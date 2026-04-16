/* === Pacific Belt Visualization === */

let _beltResizeHandler = null;

function initBeltViz() {
  const container = document.getElementById("belt-viz");
  if (!container) return;
  container.innerHTML = '';

  // --- Compute stats ---
  const totalPop = Object.values(PREF_POP_2020).reduce((a, b) => a + b, 0);
  let beltPop = 0;
  for (const [code, pop] of Object.entries(PREF_POP_2020)) {
    if (PACIFIC_BELT.has(code)) beltPop += pop;
  }
  const restPop = totalPop - beltPop;
  const beltPct = beltPop / totalPop;
  const restPct = restPop / totalPop;

  // --- Stat counters ---
  const statRow = d3.select(container).append("div").attr("class", "stat-row");

  const beltCard = statRow.append("div").attr("class", "stat-card");
  beltCard.append("div").attr("class", "stat-label").text("Pacific Belt");
  beltCard.append("div").attr("class", "stat-value")
    .style("color", "var(--accent-c)")
    .text(fmt.num(beltPop) + " (" + fmt.pct0(beltPct) + ")");

  const restCard = statRow.append("div").attr("class", "stat-card");
  restCard.append("div").attr("class", "stat-label").text("Rest of Japan");
  restCard.append("div").attr("class", "stat-value")
    .text(fmt.num(restPop) + " (" + fmt.pct0(restPct) + ")");

  // --- Legend ---
  const legend = d3.select(container).append("div").attr("class", "legend");
  [
    { color: "#c84a4a", label: "Pacific Belt" },
    { color: "#e8e4dc", label: "Rest of Japan" },
  ].forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-swatch").style("background", d.color);
    item.append("span").text(d.label);
  });

  // --- Toggle button ---
  let beltOnly = false;
  const toggleBtn = d3.select(container).append("button")
    .attr("class", "btn")
    .style("margin-bottom", "1rem")
    .text("Show Belt Only")
    .on("click", () => {
      beltOnly = !beltOnly;
      toggleBtn.text(beltOnly ? "Show All" : "Show Belt Only")
        .classed("active", beltOnly);
      d3.selectAll(".muni-path.non-belt")
        .transition().duration(400)
        .style("opacity", beltOnly ? 0.1 : 1);
    });

  // --- Map container ---
  const chartDiv = d3.select(container).append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartDiv.node(), 0.75);

  const svg = chartDiv.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // --- Okinawa inset container ---
  const insetSize = Math.min(dims.width * 0.18, 140);
  const insetG = svg.append("g")
    .attr("class", "okinawa-inset")
    .attr("transform", `translate(10, ${dims.height - insetSize - 10})`);

  // Inset background
  insetG.append("rect")
    .attr("width", insetSize)
    .attr("height", insetSize)
    .attr("fill", "var(--surface)")
    .attr("stroke", "var(--border)")
    .attr("stroke-width", 1)
    .attr("rx", 3);

  insetG.append("text")
    .attr("x", insetSize / 2)
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .attr("class", "chart-label")
    .text("Okinawa (not in belt)");

  // --- Tooltip (remove any previous one to avoid duplicates on resize) ---
  d3.select("body").selectAll(".tooltip").remove();
  const tip = createTooltip();

  // --- Load data ---
  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';
  Promise.all([
    d3.json(basePath + "data/geo/japan_municipality.topojson"),
    d3.json(basePath + "data/geo/japan_prefecture.topojson"),
  ]).then(([muniTopo, prefTopo]) => {
    const muniGeo = topojson.feature(muniTopo, muniTopo.objects["N03-21_210101"]);
    const prefGeo = topojson.feature(prefTopo, prefTopo.objects["japan"]);
    const prefMesh = topojson.mesh(prefTopo, prefTopo.objects["japan"], (a, b) => a !== b);

    // --- Main map: filter out Okinawa for main view ---
    const mainMuniFeatures = muniGeo.features.filter(f => {
      const pc = getPrefCode(f.properties.N03_007);
      return pc !== "47";
    });
    // --- Projection for main map ---
    const mainCollection = { type: "FeatureCollection", features: mainMuniFeatures };
    const projection = d3.geoMercator()
      .center([137, 36])
      .fitSize([dims.width, dims.height], mainCollection);
    const path = d3.geoPath(projection);

    // --- Draw municipalities ---
    const mainG = svg.append("g").attr("class", "main-map");

    mainG.selectAll("path.muni-path")
      .data(mainMuniFeatures)
      .join("path")
      .attr("class", d => {
        const pc = getPrefCode(d.properties.N03_007);
        return "muni-path " + (PACIFIC_BELT.has(pc) ? "belt" : "non-belt");
      })
      .attr("d", path)
      .attr("fill", d => {
        const pc = getPrefCode(d.properties.N03_007);
        return PACIFIC_BELT.has(pc) ? "#c84a4a" : "#e8e4dc";
      })
      .attr("stroke", "#252b38")
      .attr("stroke-width", 0.3)
      .on("mouseenter", (event, d) => {
        const pc = getPrefCode(d.properties.N03_007);
        const names = PREF_NAMES[pc];
        const pop = PREF_POP_2020[pc];
        const isBelt = PACIFIC_BELT.has(pc);
        const html = `
          <div class="tooltip-title">${names ? names[1] : ""} ${names ? names[0] : ""}</div>
          <div class="tooltip-row"><span class="label">Population</span><span>${fmt.num(pop)}</span></div>
          <div class="tooltip-row"><span class="label">Status</span><span style="color:${isBelt ? "var(--accent-c)" : "var(--muted)"}">${isBelt ? "Pacific Belt" : "Outside Belt"}</span></div>
        `;
        tip.show(html, event);
      })
      .on("mousemove", (event) => tip.move(event))
      .on("mouseleave", () => tip.hide());

    // --- Prefecture boundaries overlay ---
    mainG.append("path")
      .datum(prefMesh)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#252b38")
      .attr("stroke-width", 0.8);

    // --- Okinawa inset ---
    const okiFeatures = muniGeo.features.filter(f => {
      const pc = getPrefCode(f.properties.N03_007);
      return pc === "47";
    });
    const okiCollection = { type: "FeatureCollection", features: okiFeatures };

    const okiProjection = d3.geoMercator()
      .fitSize([insetSize - 10, insetSize - 20], okiCollection);
    const okiPath = d3.geoPath(okiProjection);

    const okiMapG = insetG.append("g").attr("transform", "translate(5, 16)");

    okiMapG.selectAll("path")
      .data(okiFeatures)
      .join("path")
      .attr("d", okiPath)
      .attr("fill", "#e8e4dc")
      .attr("stroke", "#252b38")
      .attr("stroke-width", 0.3)
      .on("mouseenter", (event) => {
        const names = PREF_NAMES["47"];
        const pop = PREF_POP_2020["47"];
        const html = `
          <div class="tooltip-title">${names[1]} ${names[0]}</div>
          <div class="tooltip-row"><span class="label">Population</span><span>${fmt.num(pop)}</span></div>
          <div class="tooltip-row"><span class="label">Status</span><span style="color:var(--muted)">Outside Belt</span></div>
        `;
        tip.show(html, event);
      })
      .on("mousemove", (event) => tip.move(event))
      .on("mouseleave", () => tip.hide());

    // --- Okinawa prefecture boundary ---
    const okiPrefFeatures = prefGeo.features.filter(f => {
      const id = String(f.properties.id).padStart(2, "0");
      return id === "47";
    });
    if (okiPrefFeatures.length) {
      const okiPrefMesh = topojson.mesh(
        prefTopo,
        prefTopo.objects["japan"],
        (a, b) => {
          const aId = String(a.properties.id).padStart(2, "0");
          const bId = String(b.properties.id).padStart(2, "0");
          return (aId === "47" || bId === "47") && a !== b;
        }
      );
      okiMapG.append("path")
        .datum(okiPrefMesh)
        .attr("d", okiPath)
        .attr("fill", "none")
        .attr("stroke", "#252b38")
        .attr("stroke-width", 0.8);
    }
  });

  // --- Source attribution ---
  d3.select(container).append("p")
    .attr("class", "source-attr")
    .html('Source: <a href="https://www.stat.go.jp/english/data/handbook/" style="color:var(--accent-a)">2020 Census — Statistics Bureau of Japan</a>; Boundary data: <a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v2_4.html" style="color:var(--accent-a)">MLIT National Land Numerical Information</a> via <a href="https://github.com/smartnews-smri/japan-topography" style="color:var(--accent-a)">smartnews-smri/japan-topography</a>');

  // --- Responsive resize (remove previous listener to avoid stacking) ---
  if (_beltResizeHandler) window.removeEventListener("resize", _beltResizeHandler);
  let resizeTimer;
  _beltResizeHandler = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      container.innerHTML = "";
      initBeltViz();
    }, 300);
  };
  window.addEventListener("resize", _beltResizeHandler);
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initBeltViz));
} else {
  requestAnimationFrame(initBeltViz);
}
