/* === Population Density Choropleth === */

function initDensityViz() {
  const container = document.getElementById("density-viz");
  if (!container) return;
  container.innerHTML = '';

  // Compute density for each prefecture
  const densityData = {};
  Object.keys(PREF_POP_2020).forEach(code => {
    const pop = PREF_POP_2020[code];
    const area = PREF_AREA_KM2[code];
    densityData[code] = { pop, area, density: pop / area };
  });

  // Sort for sidebar rankings
  const sorted = Object.entries(densityData)
    .map(([code, d]) => ({ code, ...d }))
    .sort((a, b) => b.density - a.density);

  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();

  // Color scale
  const color = d3.scaleSequentialLog(d3.interpolateYlOrRd)
    .domain([20, 6000]);

  // Build layout: map-layout grid with map area + sidebar
  const layout = d3.select(container).append("div").attr("class", "map-layout");

  // --- Map column ---
  const mapCol = layout.append("div");
  const chartBox = mapCol.append("div").attr("class", "chart-container");

  const { width } = getChartDimensions(chartBox.node(), 0.8);
  const height = Math.min(width * 0.9, window.innerHeight * 0.65);

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const mapGroup = svg.append("g");

  // Tooltip
  const tip = createTooltip();

  // Load TopoJSON
  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';
  d3.json(basePath + "data/geo/japan_prefecture.topojson").then(topo => {
    const geojson = topojson.feature(topo, topo.objects.japan);

    // Projection
    const projection = d3.geoMercator()
      .center([137, 36])
      .fitSize([width, height], geojson);

    const path = d3.geoPath(projection);

    // Helper to get padded code from feature
    function prefCode(d) {
      return String(d.properties.id).padStart(2, "0");
    }

    // Draw prefectures
    const prefPaths = mapGroup.selectAll("path")
      .data(geojson.features)
      .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const code = prefCode(d);
          const dd = densityData[code];
          return dd ? color(dd.density) : "#333";
        })
        .attr("stroke", "#252b38")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          const code = prefCode(d);
          const dd = densityData[code];
          const names = PREF_NAMES[code];
          if (!dd || !names) return;
          d3.select(this).attr("stroke", "var(--accent-a)").attr("stroke-width", 1.5).raise();
          tip.show(
            `<div class="tooltip-title">${names[0]} ${names[1]}</div>
             <div class="tooltip-row"><span class="label">Population</span><span>${fmt.num(dd.pop)}</span></div>
             <div class="tooltip-row"><span class="label">Area</span><span>${fmt.num(dd.area)} km\u00B2</span></div>
             <div class="tooltip-row"><span class="label">Density</span><span>${fmt.density(dd.density)} /km\u00B2</span></div>`,
            event
          );
        })
        .on("mousemove", (event) => tip.move(event))
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "#252b38").attr("stroke-width", 0.5);
          tip.hide();
        });

    // Zoom/pan
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // --- Highlight function for sidebar clicks ---
    function highlightPref(code) {
      // Reset all
      prefPaths
        .attr("stroke", "#252b38")
        .attr("stroke-width", 0.5);

      // Highlight target
      prefPaths.filter(d => prefCode(d) === code)
        .attr("stroke", "var(--accent-a)")
        .attr("stroke-width", 2.5)
        .raise();

      // Zoom to prefecture
      const target = geojson.features.find(f => prefCode(f) === code);
      if (target) {
        const [[x0, y0], [x1, y1]] = path.bounds(target);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const scale = Math.min(8, 0.7 / Math.max(dx / width, dy / height));
        const translate = [width / 2 - scale * cx, height / 2 - scale * cy];

        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      }
    }

    // --- Sidebar click handlers ---
    d3.selectAll(".sidebar-item").on("click", function() {
      const code = d3.select(this).attr("data-code");
      if (code) highlightPref(code);
    });
  });

  // --- Legend (below map) ---
  const legendContainer = mapCol.append("div").attr("class", "gradient-legend");

  const legendWidth = 240;
  const legendHeight = 12;
  const ticks = [20, 100, 500, 1000, 3000, 6000];

  const legendSvg = legendContainer.append("svg")
    .attr("width", legendWidth + 60)
    .attr("height", 40);

  // Gradient
  const defs = legendSvg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "density-grad");

  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const val = 20 * Math.pow(6000 / 20, t); // log interpolation
    grad.append("stop")
      .attr("offset", `${(t * 100).toFixed(1)}%`)
      .attr("stop-color", color(val));
  }

  legendSvg.append("rect")
    .attr("x", 10)
    .attr("y", 2)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 2)
    .style("fill", "url(#density-grad)");

  // Tick labels
  const logScale = d3.scaleLog().domain([20, 6000]).range([10, 10 + legendWidth]);

  ticks.forEach(v => {
    const x = logScale(v);
    legendSvg.append("line")
      .attr("x1", x).attr("x2", x)
      .attr("y1", legendHeight + 2).attr("y2", legendHeight + 6)
      .attr("stroke", "var(--muted)")
      .attr("stroke-width", 0.5);
    legendSvg.append("text")
      .attr("x", x)
      .attr("y", legendHeight + 18)
      .attr("text-anchor", "middle")
      .attr("class", "chart-label")
      .style("font-size", "0.55rem")
      .text(fmt.num(v));
  });

  // --- Sidebar column ---
  const sidebar = layout.append("div").attr("class", "sidebar");

  // Densest
  sidebar.append("h3").text("Densest Prefectures");
  const denseList = sidebar.append("div");
  top10.forEach(d => {
    const names = PREF_NAMES[d.code];
    denseList.append("div")
      .attr("class", "sidebar-item")
      .attr("data-code", d.code)
      .html(`<span>${names ? names[0] : d.code}</span><span class="density">${fmt.density(d.density)} /km\u00B2</span>`);
  });

  // Spacer
  sidebar.append("div").style("height", "1.5rem");

  // Sparsest
  sidebar.append("h3").text("Sparsest Prefectures");
  const sparseList = sidebar.append("div");
  bottom10.forEach(d => {
    const names = PREF_NAMES[d.code];
    sparseList.append("div")
      .attr("class", "sidebar-item")
      .attr("data-code", d.code)
      .html(`<span>${names ? names[0] : d.code}</span><span class="density">${fmt.density(d.density)} /km\u00B2</span>`);
  });

  // --- Source attribution ---
  mapCol.append("p")
    .attr("class", "source-attr")
    .html('Source: <a href="https://www.stat.go.jp/english/data/handbook/" style="color:var(--accent-a)">2020 Census — Statistics Bureau of Japan</a>; Area: <a href="https://www.gsi.go.jp/ENGLISH/" style="color:var(--accent-a)">Geospatial Information Authority of Japan</a>; Boundaries: <a href="https://github.com/dataofjapan/land" style="color:var(--accent-a)">dataofjapan/land</a>');
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initDensityViz));
} else {
  requestAnimationFrame(initDensityViz);
}
