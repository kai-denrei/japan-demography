/* === US Military Presence Visualization === */

const US_BASES = [
  // Okinawa
  {name:"Kadena AB",lat:26.355,lon:127.769,personnel:15000,branch:"AF",size:"major"},
  {name:"MCAS Futenma",lat:26.274,lon:127.756,personnel:4500,branch:"MC",size:"major"},
  {name:"Camp Hansen",lat:26.487,lon:127.991,personnel:3600,branch:"MC",size:"major"},
  {name:"Camp Schwab",lat:26.525,lon:128.044,personnel:2500,branch:"MC",size:"major"},
  {name:"Camp Foster",lat:26.301,lon:127.775,personnel:4200,branch:"MC",size:"major"},
  {name:"Camp Courtney",lat:26.389,lon:127.856,personnel:3200,branch:"MC",size:"major"},
  {name:"Camp Kinser",lat:26.253,lon:127.697,personnel:2200,branch:"MC",size:"major"},
  {name:"Camp Gonsalves (JWTC)",lat:26.728,lon:128.245,personnel:200,branch:"MC",size:"facility"},
  {name:"Camp McTureous",lat:26.387,lon:127.843,personnel:400,branch:"MC",size:"facility"},
  {name:"Camp Shields",lat:26.345,lon:127.809,personnel:350,branch:"Navy",size:"facility"},
  {name:"White Beach Naval Facility",lat:26.333,lon:127.896,personnel:800,branch:"Navy",size:"medium"},
  {name:"Tengan Pier",lat:26.373,lon:127.870,personnel:50,branch:"Navy",size:"facility"},
  {name:"Naha Military Port",lat:26.215,lon:127.670,personnel:150,branch:"Army",size:"facility"},
  {name:"Torii Station",lat:26.379,lon:127.737,personnel:1200,branch:"Army",size:"medium"},
  {name:"Kadena Ammo Storage",lat:26.395,lon:127.784,personnel:100,branch:"AF",size:"facility"},
  {name:"Northern Training Area",lat:26.72,lon:128.22,personnel:20,branch:"MC",size:"facility"},
  {name:"Ie Jima Range",lat:26.710,lon:127.790,personnel:30,branch:"MC",size:"facility"},
  {name:"Okuma Rest Center",lat:26.828,lon:128.300,personnel:30,branch:"MC",size:"facility"},
  {name:"Senaha Comm Station",lat:26.355,lon:127.740,personnel:20,branch:"Army",size:"facility"},
  {name:"Yomitan Aux Airfield",lat:26.400,lon:127.730,personnel:10,branch:"MC",size:"facility"},
  // Kanto
  {name:"Yokota AB",lat:35.748,lon:139.348,personnel:11000,branch:"AF",size:"major"},
  {name:"Fleet Activities Yokosuka",lat:35.293,lon:139.671,personnel:11500,branch:"Navy",size:"major"},
  {name:"NAF Atsugi",lat:35.455,lon:139.449,personnel:3600,branch:"Navy",size:"major"},
  {name:"Camp Zama",lat:35.530,lon:139.388,personnel:2200,branch:"Army",size:"major"},
  {name:"Sagami General Depot",lat:35.581,lon:139.378,personnel:600,branch:"Army",size:"medium"},
  {name:"Yokohama North Dock",lat:35.468,lon:139.650,personnel:500,branch:"Army",size:"medium"},
  {name:"Tsurumi POL Depot",lat:35.495,lon:139.685,personnel:80,branch:"Navy",size:"facility"},
  {name:"Negishi Housing Area",lat:35.420,lon:139.647,personnel:200,branch:"Navy",size:"facility"},
  {name:"Tama Hills Recreation",lat:35.615,lon:139.360,personnel:30,branch:"AF",size:"facility"},
  {name:"Owada Comm Station",lat:35.878,lon:139.582,personnel:50,branch:"AF",size:"facility"},
  {name:"New Sanno Hotel",lat:35.650,lon:139.733,personnel:100,branch:"Navy",size:"facility"},
  {name:"Hardy Barracks",lat:35.672,lon:139.738,personnel:50,branch:"Joint",size:"facility"},
  {name:"Ikego Housing Area",lat:35.315,lon:139.590,personnel:200,branch:"Navy",size:"facility"},
  {name:"Kamiseya Comm Station",lat:35.469,lon:139.501,personnel:40,branch:"Navy",size:"facility"},
  {name:"Camp Asaka (shared)",lat:35.780,lon:139.580,personnel:50,branch:"Joint",size:"facility"},
  {name:"Fuchu Comm Station",lat:35.676,lon:139.477,personnel:30,branch:"AF",size:"facility"},
  // Tohoku
  {name:"Misawa AB",lat:40.703,lon:141.368,personnel:3800,branch:"AF",size:"major"},
  {name:"Shariki X-band Radar",lat:41.001,lon:140.355,personnel:120,branch:"Army",size:"facility"},
  // Kansai/Chugoku
  {name:"Iwakuni MCAS",lat:34.143,lon:132.235,personnel:5000,branch:"MC",size:"major"},
  {name:"Akizuki Ammo Depot",lat:34.225,lon:132.510,personnel:100,branch:"Army",size:"facility"},
  {name:"Hiro Ammo Depot",lat:34.208,lon:132.545,personnel:50,branch:"Army",size:"facility"},
  // Kyushu
  {name:"Sasebo NB",lat:33.158,lon:129.723,personnel:4000,branch:"Navy",size:"major"},
  {name:"Hario Housing Area",lat:33.195,lon:129.700,personnel:300,branch:"Navy",size:"facility"},
  {name:"Sasebo Dry Dock",lat:33.160,lon:129.720,personnel:200,branch:"Navy",size:"facility"},
  {name:"Tsushima Comm Site",lat:34.600,lon:129.340,personnel:10,branch:"Navy",size:"facility"},
  // Hokkaido/Northern
  {name:"Camp Chitose (shared)",lat:42.790,lon:141.650,personnel:20,branch:"Joint",size:"facility"},
  {name:"Yausubetsu Comm Site",lat:43.460,lon:143.430,personnel:15,branch:"AF",size:"facility"},
  {name:"Wakkanai Comm Site",lat:45.400,lon:141.790,personnel:10,branch:"AF",size:"facility"},
];

const BRANCH_COLORS = {
  AF: "#4a9ec8",
  MC: "#c84a4a",
  Navy: "#4ac87a",
  Army: "#e8a04a",
  Joint: "#9b4ac8",
};

const BRANCH_LABELS = {
  AF: "Air Force",
  MC: "Marine Corps",
  Navy: "Navy",
  Army: "Army",
  Joint: "Joint",
};

const ANNOTATIONS = [
  { year: 1951, text: "San Francisco Peace Treaty signed" },
  { year: 1960, text: "ANPO crisis \u2014 Mutual Security Treaty renewal protests" },
  { year: 1972, text: "Okinawa reversion to Japan" },
  { year: 1995, text: "Okinawa rape case triggers SACO process" },
  { year: 1996, text: "SACO Final Report \u2014 Futenma relocation agreed" },
  { year: 2012, text: "MV-22 Osprey deployment controversy" },
];

function initMilitaryViz() {
  const container = document.getElementById("usmilitary-viz");
  if (!container) return;

  // Clear loading indicator
  container.innerHTML = '';

  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';
  d3.csv(basePath + "data/usmilitary/us_troops_japan.csv", d => ({
    year: +d.year,
    military_personnel: +d.military_personnel,
    dependents_civilians: +d.dependents_civilians,
    notes: d.notes,
  })).then(rawData => {
    const data = interpolateData(rawData, "year", ["military_personnel", "dependents_civilians"]);
    buildTimeline(container, data);
    buildBaseMap(container, basePath);
    buildCallout(container);
    buildSource(container);
  });
}

/* =============================================
   Chart 1: Timeline
   ============================================= */
function buildTimeline(container, data) {
  // --- Stat cards ---
  const peakRow = rawStats(data);
  const statRow = d3.select(container).append("div").attr("class", "stat-row");

  const peakCard = statRow.append("div").attr("class", "stat-card");
  peakCard.append("div").attr("class", "stat-label").text("Peak Military Personnel");
  peakCard.append("div").attr("class", "stat-value")
    .style("color", "var(--accent-b)")
    .text(fmt.num(peakRow.peak) + " (" + peakRow.peakYear + ")");

  const currentCard = statRow.append("div").attr("class", "stat-card");
  currentCard.append("div").attr("class", "stat-label").text("Current Estimate (2025)");
  currentCard.append("div").attr("class", "stat-value")
    .text(fmt.num(peakRow.current));

  // --- Toggle annotations button ---
  let annotationsVisible = true;
  const toggleBtn = d3.select(container).append("button")
    .attr("class", "btn active")
    .style("margin-bottom", "1rem")
    .text("Hide Annotations")
    .on("click", () => {
      annotationsVisible = !annotationsVisible;
      toggleBtn
        .text(annotationsVisible ? "Hide Annotations" : "Show Annotations")
        .classed("active", annotationsVisible);
      chartDiv.selectAll(".annotation-group")
        .transition().duration(300)
        .style("opacity", annotationsVisible ? 1 : 0);
    });

  // --- Legend ---
  const legend = d3.select(container).append("div").attr("class", "legend");
  [
    { color: "#4a9ec8", label: "Active-duty military personnel" },
    { color: "#6b7280", label: "Dependents & civilians", dashed: true },
  ].forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-swatch")
      .style("background", d.dashed ? "transparent" : d.color)
      .style("border", d.dashed ? `2px dashed ${d.color}` : "none");
    item.append("span").text(d.label);
  });

  // --- Chart ---
  const chartDiv = d3.select(container).append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartDiv.node(), 0.5);
  const margin = { top: 30, right: 30, bottom: 40, left: 65 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartDiv.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.military_personnel) * 1.1])
    .range([h, 0]);

  // Grid
  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));

  // Axes
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));

  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d >= 1000 ? d3.format(",")(d / 1000) + "k" : d));

  // Area fill under military line
  const area = d3.area()
    .x(d => x(d.year))
    .y0(h)
    .y1(d => y(d.military_personnel))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("d", area)
    .attr("fill", "#4a9ec8")
    .attr("opacity", 0.15);

  // Military personnel line
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.military_personnel))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "#4a9ec8")
    .attr("stroke-width", 2);

  // Dependents/civilians line (dashed)
  const depData = data.filter(d => d.dependents_civilians > 0);
  const depLine = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.dependents_civilians))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(depData)
    .attr("d", depLine)
    .attr("fill", "none")
    .attr("stroke", "#6b7280")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "6,3");

  // Annotations
  const annotGroup = g.selectAll(".annotation-group")
    .data(ANNOTATIONS)
    .enter().append("g")
    .attr("class", "annotation-group");

  annotGroup.append("line")
    .attr("class", "annotation-line")
    .attr("x1", d => x(d.year))
    .attr("x2", d => x(d.year))
    .attr("y1", 0)
    .attr("y2", h);

  annotGroup.each(function (d, i) {
    const gEl = d3.select(this);
    const xPos = x(d.year);
    const boxWidth = 140;
    // Alternate label position: above/below to reduce overlap
    const yPos = (i % 2 === 0) ? 8 : 28;
    // Flip label to left side if near right edge
    const flipLeft = xPos + boxWidth + 5 > w;

    const fo = gEl.append("foreignObject")
      .attr("x", flipLeft ? xPos - boxWidth - 5 : xPos + 5)
      .attr("y", yPos)
      .attr("width", boxWidth)
      .attr("height", 50);

    fo.append("xhtml:div")
      .attr("class", "annotation-box")
      .style("position", "static")
      .html(`<strong>${d.year}</strong> ${d.text}`);
  });

  // Hover interaction
  const tooltip = createTooltip();
  const bisect = d3.bisector(d => d.year).left;

  const hoverLine = g.append("line")
    .attr("stroke", "var(--muted)")
    .attr("stroke-width", 1)
    .attr("y1", 0)
    .attr("y2", h)
    .style("opacity", 0);

  const hoverDot = g.append("circle")
    .attr("r", 4)
    .attr("fill", "#4a9ec8")
    .style("opacity", 0);

  svg.append("rect")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const yr = x.invert(mx);
      const idx = bisect(data, yr, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx] || d0;
      const d = yr - d0.year > (d1.year - d0.year) / 2 ? d1 : d0;

      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
      hoverDot.attr("cx", x(d.year)).attr("cy", y(d.military_personnel)).style("opacity", 1);

      let html = `<div class="tooltip-title">${d.year}</div>`;
      html += `<div class="tooltip-row"><span class="label">Military</span><span>${fmt.num(d.military_personnel)}</span></div>`;
      if (d.dependents_civilians > 0) {
        html += `<div class="tooltip-row"><span class="label">Dep. & Civ.</span><span>${fmt.num(d.dependents_civilians)}</span></div>`;
      }
      tooltip.show(html, event);
    })
    .on("mouseleave", () => {
      hoverLine.style("opacity", 0);
      hoverDot.style("opacity", 0);
      tooltip.hide();
    });
}

function rawStats(data) {
  const peakEntry = data.reduce((a, b) => b.military_personnel > a.military_personnel ? b : a);
  const currentEntry = data[data.length - 1];
  return {
    peak: peakEntry.military_personnel,
    peakYear: peakEntry.year,
    current: currentEntry.military_personnel,
  };
}

/* =============================================
   Chart 2: Base Locations Map (municipality-level, Pacific Belt style)
   ============================================= */
function buildBaseMap(container, basePath) {
  const chartDiv = d3.select(container).append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartDiv.node(), 0.8);
  const svg = chartDiv.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Legend
  const mapLegend = chartDiv.append("div").attr("class", "legend").style("margin-top", "0.75rem");
  Object.entries(BRANCH_LABELS).forEach(([key, label]) => {
    const item = mapLegend.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-swatch")
      .style("background", BRANCH_COLORS[key])
      .style("border-radius", "50%");
    item.append("span").text(label);
  });
  const sizeLeg = mapLegend.append("div").attr("class", "legend-item").style("margin-left", "1rem");
  sizeLeg.append("span").style("color", "var(--muted)").text("Circle size = personnel");
  // Map background legend
  mapLegend.append("div").attr("class", "legend-item").style("margin-left", "1rem")
    .html('<div class="legend-swatch" style="background:#c84a4a;opacity:0.25;border-radius:2px"></div><span>Pacific Belt</span>');

  const tooltip = createTooltip();
  const mapG = svg.append("g");

  // Load municipality + prefecture TopoJSON (same as Pacific Belt section)
  Promise.all([
    d3.json(basePath + "data/geo/japan_municipality.topojson"),
    d3.json(basePath + "data/geo/japan_prefecture.topojson"),
  ]).then(([muniTopo, prefTopo]) => {
    const muniGeo = topojson.feature(muniTopo, muniTopo.objects["N03-21_210101"]);
    const prefTopo2 = topojson.feature(prefTopo, prefTopo.objects.japan);
    const prefMesh = topojson.mesh(prefTopo, prefTopo.objects.japan, (a, b) => a !== b);

    // Filter out Okinawa from main view
    const mainFeatures = muniGeo.features.filter(f => getPrefCode(f.properties.N03_007) !== "47");
    const mainCollection = { type: "FeatureCollection", features: mainFeatures };

    const projection = d3.geoMercator().center([137, 36]).fitSize([dims.width, dims.height], mainCollection);
    const path = d3.geoPath(projection);

    // Draw municipalities with Pacific Belt coloring (muted)
    mapG.selectAll("path.muni")
      .data(mainFeatures)
      .join("path")
      .attr("class", "muni")
      .attr("d", path)
      .attr("fill", d => {
        const pc = getPrefCode(d.properties.N03_007);
        return PACIFIC_BELT.has(pc) ? "rgba(200,74,74,0.15)" : "rgba(228,228,220,0.06)";
      })
      .attr("stroke", "#1a1f28")
      .attr("stroke-width", 0.2);

    // Prefecture boundary overlay
    mapG.append("path")
      .datum(prefMesh)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#252b38")
      .attr("stroke-width", 0.6);

    // Personnel scale
    const rScale = d3.scaleSqrt()
      .domain([0, d3.max(US_BASES, d => d.personnel)])
      .range([2, 24]);

    // Split: Okinawa vs mainland; major/medium vs facility
    const isOkinawa = d => d.lat < 27;
    const mainlandBases = US_BASES.filter(d => !isOkinawa(d));
    const okinawaBases = US_BASES.filter(d => isOkinawa(d));

    // Mainland: all bases as circles
    mapG.selectAll("circle.base")
      .data(mainlandBases)
      .join("circle")
      .attr("class", "base")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => Math.max(2, rScale(d.personnel)))
      .attr("fill", d => BRANCH_COLORS[d.branch])
      .attr("fill-opacity", d => d.size === "facility" ? 0.45 : 0.75)
      .attr("stroke", d => BRANCH_COLORS[d.branch])
      .attr("stroke-width", d => d.size === "facility" ? 0.5 : 1.5)
      .on("mousemove", (event, d) => tooltip.show(baseTooltipHtml(d), event))
      .on("mouseleave", () => tooltip.hide());

    // Labels only for major/medium mainland bases
    mapG.selectAll("text.base-label")
      .data(mainlandBases.filter(d => d.size === "major" || d.size === "medium"))
      .join("text")
      .attr("class", "chart-label")
      .attr("x", d => projection([d.lon, d.lat])[0] + rScale(d.personnel) + 4)
      .attr("y", d => projection([d.lon, d.lat])[1])
      .attr("dy", "0.35em")
      .style("font-size", "0.5rem")
      .style("fill", d => BRANCH_COLORS[d.branch])
      .text(d => d.name);

    // Okinawa markers on main map (small cluster indicator)
    mapG.selectAll("circle.oki-dot")
      .data(okinawaBases.filter(d => d.size === "major"))
      .join("circle")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", d => rScale(d.personnel) * 0.4)
      .attr("fill", d => BRANCH_COLORS[d.branch])
      .attr("fill-opacity", 0.4)
      .attr("stroke", d => BRANCH_COLORS[d.branch])
      .attr("stroke-width", 0.5);

    // --- Okinawa inset ---
    const insetSize = Math.min(dims.width * 0.28, 230);
    const insetX = dims.width - insetSize - 12;
    const insetY = dims.height - insetSize - 12;

    const insetG = svg.append("g").attr("transform", `translate(${insetX},${insetY})`);
    insetG.append("rect").attr("width", insetSize).attr("height", insetSize)
      .attr("fill", "var(--surface)").attr("stroke", "var(--border)").attr("rx", 3);
    insetG.append("text").attr("x", 8).attr("y", 16).attr("class", "chart-label")
      .style("font-size", "0.65rem").text("Okinawa (detail)");

    // Okinawa municipalities
    const okiFeatures = muniGeo.features.filter(f => getPrefCode(f.properties.N03_007) === "47");
    const okiProjection = d3.geoMercator().center([127.8, 26.45])
      .scale(insetSize * 50).translate([insetSize / 2, insetSize / 2 + 8]);
    const okiPath = d3.geoPath(okiProjection);

    insetG.selectAll("path.oki-muni")
      .data(okiFeatures.length > 0 ? okiFeatures : prefTopo2.features.filter(f => String(f.properties.id) === "47"))
      .join("path")
      .attr("d", okiPath)
      .attr("fill", "rgba(228,228,220,0.06)")
      .attr("stroke", "#252b38")
      .attr("stroke-width", 0.4);

    // Okinawa base circles in inset — all facilities
    insetG.selectAll("circle.oki-base")
      .data(okinawaBases)
      .join("circle")
      .attr("cx", d => okiProjection([d.lon, d.lat])[0])
      .attr("cy", d => okiProjection([d.lon, d.lat])[1])
      .attr("r", d => Math.max(2, rScale(d.personnel) * 0.8))
      .attr("fill", d => BRANCH_COLORS[d.branch])
      .attr("fill-opacity", d => d.size === "facility" ? 0.45 : 0.75)
      .attr("stroke", d => BRANCH_COLORS[d.branch])
      .attr("stroke-width", d => d.size === "facility" ? 0.5 : 1)
      .on("mousemove", (event, d) => tooltip.show(baseTooltipHtml(d), event))
      .on("mouseleave", () => tooltip.hide());

    // Okinawa labels — major/medium only
    insetG.selectAll("text.oki-label")
      .data(okinawaBases.filter(d => d.size === "major" || d.size === "medium"))
      .join("text")
      .attr("class", "chart-label")
      .attr("x", d => okiProjection([d.lon, d.lat])[0] + rScale(d.personnel) * 0.8 + 3)
      .attr("y", d => okiProjection([d.lon, d.lat])[1])
      .attr("dy", "0.35em")
      .style("font-size", "0.4rem")
      .style("fill", d => BRANCH_COLORS[d.branch])
      .text(d => d.name);

    // Connector line
    const okiMainPos = projection([127.8, 26.4]);
    svg.append("line")
      .attr("x1", okiMainPos[0]).attr("y1", okiMainPos[1])
      .attr("x2", insetX).attr("y2", insetY + insetSize / 2)
      .attr("stroke", "var(--border)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");

    // Zoom/pan
    svg.call(d3.zoom().scaleExtent([1, 6]).translateExtent([[0,0],[dims.width, dims.height]])
      .on("zoom", e => mapG.attr("transform", e.transform)));
  });
}

function baseTooltipHtml(d) {
  const sizeLabel = d.size === "major" ? "Major base" : d.size === "medium" ? "Medium facility" : "Support facility";
  return `<div class="tooltip-title">${d.name}</div>
    <div class="tooltip-row"><span class="label">Branch</span><span>${BRANCH_LABELS[d.branch]}</span></div>
    <div class="tooltip-row"><span class="label">Type</span><span>${sizeLabel}</span></div>
    <div class="tooltip-row"><span class="label">Est. Personnel</span><span>${fmt.num(d.personnel)}</span></div>`;
}

/* =============================================
   Callout & Source
   ============================================= */
function buildCallout(container) {
  const callout = d3.select(container).append("div").attr("class", "callout");
  const okiCount = US_BASES.filter(d => d.lat < 27).length;
  const totalCount = US_BASES.length;
  const majorCount = US_BASES.filter(d => d.size === "major").length;
  callout.append("div").attr("class", "big-stat").text(totalCount + " sites");
  callout.append("div").attr("class", "context")
    .html(`${majorCount} major bases and ${totalCount - majorCount} support facilities across Japan. ${okiCount} of ${totalCount} sites are in Okinawa — 0.6% of Japan's land area hosting ~70% of all US military facility area. Approximately 26,000 of ~55,000 personnel are stationed there.`);
  callout.append("div").attr("class", "context")
    .style("margin-top", "0.5rem")
    .style("font-size", "0.65rem")
    .style("font-style", "italic")
    .html('Source: <a href="https://www.mod.go.jp/en/publ/w_paper/" style="color:var(--accent-a)">Defense of Japan White Paper 2023</a>');
}

function buildSource(container) {
  d3.select(container).append("p").attr("class", "source-attr")
    .html('Sources: <a href="https://dwp.dmdc.osd.mil/dwp/app/dod-data-reports/workforce-reports" style="color:var(--accent-a)">DMDC Military Personnel Statistics</a>; <a href="https://crsreports.congress.gov/" style="color:var(--accent-a)">Congressional Research Service</a>; <a href="https://history.army.mil/" style="color:var(--accent-a)">US Army Center of Military History</a>');
}

/* === Init === */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initMilitaryViz));
} else {
  requestAnimationFrame(initMilitaryViz);
}
