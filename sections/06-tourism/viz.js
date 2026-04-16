/* === Tourism Visualization === */

function initTourismViz() {
  d3.select("#tourism-viz").html('');
  const container = d3.select("#tourism-viz");
  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';

  Promise.all([
    d3.csv(basePath + "data/tourism/annual_visitors.csv"),
    d3.csv(basePath + "data/tourism/visitors_by_country.csv"),
    d3.csv(basePath + "data/tourism/prefecture_foreign_stays_2024.csv"),
    d3.csv(basePath + "data/tourism/prefecture_stays_timeseries.csv"),
  ]).then(([annualRaw, countryRaw, prefRaw, prefTsRaw]) => {

    const annual = annualRaw.map(d => ({ year: +d.year, visitors: +d.visitors }));

    const countryKeys = ["south_korea","china","taiwan","hong_kong","thailand","singapore",
      "malaysia","indonesia","philippines","vietnam","india","usa","canada","uk","france",
      "germany","australia","russia","other"];
    const countryData = countryRaw.map(d => {
      const row = { year: +d.year, total: +d.total };
      countryKeys.forEach(k => row[k] = +d[k] || 0);
      return row;
    });

    const prefData = prefRaw.map(d => {
      const row = { prefecture: d.prefecture, total: +d.total };
      return row;
    });

    const prefTs = prefTsRaw.map(d => {
      const row = { year: +d.year };
      Object.keys(d).forEach(k => { if (k !== 'year') row[k] = +d[k] || 0; });
      return row;
    });

    renderTimeline(container, annual);
    renderCountryBreakdown(container, countryData, countryKeys);
    renderPrefectureMap(container, prefData, basePath);
    renderPrefectureTrend(container, prefTs);
    renderSource(container);
  });
}

/* === Chart 1: 60-year timeline === */
function renderTimeline(container, data) {
  container.append("h3").attr("class", "section-title").style("margin-top", "1rem")
    .text("Visitor Arrivals 1964–2025");

  // Stat cards
  const statRow = container.append("div").attr("class", "stat-row");
  const latest = data[data.length - 1];
  const peak = data.reduce((a, b) => b.visitors > a.visitors ? b : a);
  const y1964 = data[0];

  [{label: "1964 (Tokyo Olympics)", val: fmt.num(y1964.visitors)},
   {label: "2019 (Pre-COVID peak)", val: fmt.num(data.find(d => d.year === 2019).visitors)},
   {label: latest.year + " (Latest)", val: fmt.num(latest.visitors)},
   {label: "Growth since 1964", val: Math.round(latest.visitors / y1964.visitors) + "×"},
  ].forEach(s => {
    const c = statRow.append("div").attr("class", "stat-card");
    c.append("div").attr("class", "stat-label").text(s.label);
    c.append("div").attr("class", "stat-value").text(s.val);
  });

  const ANNOTATIONS = [
    { year: 1964, text: "Tokyo Olympics" },
    { year: 1970, text: "Osaka Expo '70" },
    { year: 1985, text: "Tsukuba Expo; Plaza Accord" },
    { year: 2003, text: "Visit Japan Campaign launched" },
    { year: 2011, text: "Tohoku earthquake" },
    { year: 2013, text: "Visa liberalization wave" },
    { year: 2020, text: "COVID-19 border closure" },
  ];

  const chartBox = container.append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartBox.node(), 0.45);
  const margin = { top: 30, right: 30, bottom: 35, left: 65 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.visitors) * 1.08]).range([h, 0]);

  g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(0) + "M" : d >= 1e3 ? (d / 1e3).toFixed(0) + "K" : d));

  // Area + line
  const area = d3.area().x(d => x(d.year)).y0(h).y1(d => y(d.visitors)).curve(d3.curveMonotoneX);
  g.append("path").datum(data).attr("d", area).attr("fill", "#e8a04a").attr("opacity", 0.15);
  const line = d3.line().x(d => x(d.year)).y(d => y(d.visitors)).curve(d3.curveMonotoneX);
  g.append("path").datum(data).attr("d", line).attr("fill", "none").attr("stroke", "#e8a04a").attr("stroke-width", 2);

  // Annotations
  ANNOTATIONS.forEach((a, i) => {
    const ax = x(a.year);
    if (ax < 0 || ax > w) return;
    g.append("line").attr("class", "annotation-line").attr("x1", ax).attr("x2", ax).attr("y1", 0).attr("y2", h);
    const yOff = 8 + (i % 3) * 14;
    const txt = g.append("text").attr("class", "annotation-label").attr("x", ax + 4).attr("y", yOff).text(a.year + ": " + a.text);
    if (ax + 4 + 120 > w) txt.attr("text-anchor", "end").attr("x", ax - 4);
  });

  // Tooltip
  const tip = createTooltip();
  const hoverLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-width", 1).attr("y1", 0).attr("y2", h).style("opacity", 0);
  const hoverDot = g.append("circle").attr("r", 4).attr("fill", "#e8a04a").style("opacity", 0);
  const bisect = d3.bisector(d => d.year).left;

  svg.append("rect").attr("transform", `translate(${margin.left},${margin.top})`).attr("width", w).attr("height", h).attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const yr = x.invert(mx);
      const idx = bisect(data, yr, 1);
      const d0 = data[idx - 1], d1 = data[idx] || d0;
      const d = yr - d0.year > (d1.year - d0.year) / 2 ? d1 : d0;
      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
      hoverDot.attr("cx", x(d.year)).attr("cy", y(d.visitors)).style("opacity", 1);
      const prev = data.find(r => r.year === d.year - 1);
      const yoy = prev ? ((d.visitors - prev.visitors) / prev.visitors * 100).toFixed(1) + "%" : "—";
      tip.show(`<div class="tooltip-title">${d.year}</div>
        <div class="tooltip-row"><span class="label">Visitors</span><span>${fmt.num(d.visitors)}</span></div>
        <div class="tooltip-row"><span class="label">YoY change</span><span>${yoy}</span></div>`, event);
    })
    .on("mouseleave", () => { hoverLine.style("opacity", 0); hoverDot.style("opacity", 0); tip.hide(); });
}

/* === Chart 2: Stacked area by source country === */
function renderCountryBreakdown(container, data, keys) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Visitors by Source Country (2003–2025)");

  const LABELS = {
    south_korea:"South Korea", china:"China", taiwan:"Taiwan", hong_kong:"Hong Kong",
    thailand:"Thailand", singapore:"Singapore", malaysia:"Malaysia", indonesia:"Indonesia",
    philippines:"Philippines", vietnam:"Vietnam", india:"India", usa:"USA", canada:"Canada",
    uk:"UK", france:"France", germany:"Germany", australia:"Australia", russia:"Russia", other:"Other"
  };
  const COLORS = {
    south_korea:"#e8a04a", china:"#c84a4a", taiwan:"#4ac87a", hong_kong:"#9b4ac8",
    thailand:"#c87a4a", singapore:"#4a9ec8", malaysia:"#c8c44a", indonesia:"#7a4ac8",
    philippines:"#4a5568", vietnam:"#4ac8a0", india:"#c84a7a", usa:"#6b9ec8",
    canada:"#8bc84a", uk:"#c8964a", france:"#4a6bc8", germany:"#96c84a",
    australia:"#c84a96", russia:"#4ac8c8", other:"#3a3f4a"
  };

  // Top 8 countries to show individually, rest as "other"
  const TOP = ["south_korea","china","taiwan","usa","hong_kong","thailand","australia","vietnam"];
  const merged = data.map(d => {
    const row = { year: d.year };
    TOP.forEach(k => row[k] = d[k]);
    row.rest = keys.filter(k => !TOP.includes(k)).reduce((s, k) => s + d[k], 0);
    return row;
  });
  const stackKeys = [...TOP, "rest"];
  const stackColors = { ...COLORS, rest: "#3a3f4a" };
  const stackLabels = { ...LABELS, rest: "All others" };

  const chartBox = container.append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartBox.node(), 0.5);
  const margin = { top: 20, right: 30, bottom: 35, left: 65 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(merged, d => d.year)).range([0, w]);
  const visible = {};
  stackKeys.forEach(k => visible[k] = true);

  function computeStack() {
    const active = stackKeys.filter(k => visible[k]);
    return d3.stack().keys(active).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(merged);
  }

  let stacked = computeStack();
  const yScale = d3.scaleLinear().domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice().range([h, 0]);

  const areaGen = d3.area().x(d => x(d.data.year)).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveMonotoneX);

  g.append("g").attr("class", "grid").call(d3.axisLeft(yScale).ticks(5).tickSize(-w).tickFormat(""));
  const xAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`);
  const yAxisG = g.append("g").attr("class", "axis");
  const areasG = g.append("g");

  function drawAxes() {
    xAxisG.call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));
    yAxisG.call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(0) + "M" : d >= 1e3 ? (d / 1e3).toFixed(0) + "K" : d));
  }
  function draw() {
    const paths = areasG.selectAll("path").data(stacked, d => d.key);
    paths.exit().remove();
    paths.enter().append("path").attr("opacity", 0.8)
      .merge(paths).transition().duration(400)
      .attr("d", areaGen).attr("fill", d => stackColors[d.key]);
  }
  drawAxes(); draw();

  // Hover
  const tip = createTooltip();
  const hoverLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-width", 1).attr("y1", 0).attr("y2", h).style("opacity", 0);
  svg.append("rect").attr("transform", `translate(${margin.left},${margin.top})`).attr("width", w).attr("height", h).attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const yr = Math.round(x.invert(mx));
      const d = merged.find(r => r.year === yr) || merged.reduce((a, b) => Math.abs(b.year - yr) < Math.abs(a.year - yr) ? b : a);
      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
      const rows = stackKeys.filter(k => visible[k]).map(k =>
        `<div class="tooltip-row"><span class="label"><span style="color:${stackColors[k]}">■</span> ${stackLabels[k]}</span><span>${fmt.num(d[k])}</span></div>`
      ).join("");
      const tot = stackKeys.filter(k => visible[k]).reduce((s, k) => s + d[k], 0);
      tip.show(`<div class="tooltip-title">${d.year}</div><div class="tooltip-row"><span class="label">Total</span><span>${fmt.num(tot)}</span></div>${rows}`, event);
    })
    .on("mouseleave", () => { hoverLine.style("opacity", 0); tip.hide(); });

  // Legend
  const legend = chartBox.append("div").attr("class", "legend");
  stackKeys.forEach(k => {
    const item = legend.append("div").attr("class", "legend-item").on("click", () => {
      visible[k] = !visible[k]; item.classed("dimmed", !visible[k]);
      stacked = computeStack();
      if (stacked.length > 0) yScale.domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice();
      drawAxes(); draw();
    });
    item.append("div").attr("class", "legend-swatch").style("background", stackColors[k]);
    item.append("span").text(stackLabels[k]);
  });
}

/* === Chart 3: Prefecture choropleth === */
function renderPrefectureMap(container, prefData, basePath) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Foreign Guest-Nights by Prefecture (2024)");
  container.append("p").attr("class", "section-subtitle")
    .text("Where do foreign tourists stay? Accommodation survey data from 47 prefectures");

  const layout = container.append("div").attr("class", "map-layout");
  const mapCol = layout.append("div");
  const chartBox = mapCol.append("div").attr("class", "chart-container");

  const { width } = getChartDimensions(chartBox.node(), 0.8);
  const height = Math.min(width * 0.9, window.innerHeight * 0.6);

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const mapG = svg.append("g");
  const tip = createTooltip();

  // Build lookup
  const prefLookup = {};
  const prefNameToCode = {};
  Object.entries(PREF_NAMES).forEach(([code, [en, jp]]) => {
    prefNameToCode[en.toLowerCase()] = code;
  });
  // Map our CSV keys to pref codes
  prefData.forEach(d => {
    const code = prefNameToCode[d.prefecture];
    if (code) prefLookup[code] = d;
  });

  const maxStays = d3.max(prefData, d => d.total);
  const color = d3.scaleSequentialLog(d3.interpolateYlOrRd).domain([10000, maxStays]);

  d3.json(basePath + "data/geo/japan_prefecture.topojson").then(topo => {
    const geojson = topojson.feature(topo, topo.objects.japan);
    const projection = d3.geoMercator().center([137, 36]).fitSize([width, height], geojson);
    const path = d3.geoPath(projection);

    function prefCode(d) { return String(d.properties.id).padStart(2, "0"); }

    mapG.selectAll("path").data(geojson.features).join("path")
      .attr("d", path)
      .attr("fill", d => {
        const code = prefCode(d);
        const pd = prefLookup[code];
        return pd ? color(pd.total) : "#333";
      })
      .attr("stroke", "#252b38").attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "var(--accent-a)").attr("stroke-width", 1.5).raise();
        const code = prefCode(d);
        const names = PREF_NAMES[code];
        const pd = prefLookup[code];
        if (!names || !pd) return;
        tip.show(`<div class="tooltip-title">${names[0]} ${names[1]}</div>
          <div class="tooltip-row"><span class="label">Foreign guest-nights</span><span>${fmt.num(pd.total)}</span></div>`, event);
      })
      .on("mousemove", (event) => tip.move(event))
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "#252b38").attr("stroke-width", 0.5);
        tip.hide();
      });

    // Zoom
    svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[0,0],[width,height]])
      .on("zoom", e => mapG.attr("transform", e.transform)));
  });

  // Legend
  const legendSvg = mapCol.append("svg").attr("width", 280).attr("height", 35);
  const defs = legendSvg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "tourism-grad");
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const val = 10000 * Math.pow(maxStays / 10000, t);
    grad.append("stop").attr("offset", `${(t * 100).toFixed(1)}%`).attr("stop-color", color(val));
  }
  legendSvg.append("rect").attr("x", 10).attr("y", 2).attr("width", 220).attr("height", 12).attr("rx", 2).style("fill", "url(#tourism-grad)");
  const logScale = d3.scaleLog().domain([10000, maxStays]).range([10, 230]);
  [10000, 100000, 1000000, 10000000, maxStays].forEach(v => {
    const lx = logScale(Math.min(v, maxStays));
    legendSvg.append("text").attr("x", lx).attr("y", 28).attr("text-anchor", "middle")
      .attr("class", "chart-label").style("font-size", "0.5rem")
      .text(v >= 1e6 ? (v / 1e6).toFixed(0) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "K" : v);
  });

  // Sidebar: top 15
  const sidebar = layout.append("div").attr("class", "sidebar");
  sidebar.append("h3").text("Top 15 Prefectures");
  const sorted = [...prefData].sort((a, b) => b.total - a.total).slice(0, 15);
  sorted.forEach(d => {
    const names = PREF_NAMES[prefNameToCode[d.prefecture]];
    sidebar.append("div").attr("class", "sidebar-item")
      .html(`<span>${names ? names[0] : d.prefecture}</span><span class="density">${d.total >= 1e6 ? (d.total / 1e6).toFixed(1) + "M" : fmt.num(d.total)}</span>`);
  });
}

/* === Chart 4: Prefecture time series (top 5) === */
function renderPrefectureTrend(container, data) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Prefecture Tourism Trends (2011–2025)");
  container.append("p").attr("class", "section-subtitle")
    .text("Foreign guest-nights at the top 5 prefectures over time");

  const TOP5 = ["tokyo", "osaka", "kyoto", "hokkaido", "fukuoka"];
  const LABELS = { tokyo:"Tokyo", osaka:"Osaka", kyoto:"Kyoto", hokkaido:"Hokkaido", fukuoka:"Fukuoka" };
  const COLORS = { tokyo:"#e8a04a", osaka:"#c84a4a", kyoto:"#4ac87a", hokkaido:"#4a9ec8", fukuoka:"#9b4ac8" };

  const chartBox = container.append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartBox.node(), 0.45);
  const margin = { top: 20, right: 80, bottom: 35, left: 60 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
  const yMax = d3.max(data, d => d3.max(TOP5, k => d[k] || 0));
  const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

  g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(0) + "M" : d >= 1e3 ? (d / 1e3).toFixed(0) + "K" : d));

  const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX).defined(d => d.val > 0);

  TOP5.forEach(k => {
    const lineData = data.map(d => ({ year: d.year, val: d[k] || 0 }));
    g.append("path").datum(lineData).attr("d", lineGen)
      .attr("fill", "none").attr("stroke", COLORS[k]).attr("stroke-width", 2);
    // End label
    const last = lineData[lineData.length - 1];
    if (last.val > 0) {
      g.append("text").attr("x", x(last.year) + 4).attr("y", y(last.val))
        .attr("dy", "0.35em").attr("class", "chart-label").style("font-size", "0.6rem").style("fill", COLORS[k])
        .text(LABELS[k]);
    }
  });

  // Hover
  const tip = createTooltip();
  const hoverLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-width", 1).attr("y1", 0).attr("y2", h).style("opacity", 0);
  const bisect = d3.bisector(d => d.year).left;

  svg.append("rect").attr("transform", `translate(${margin.left},${margin.top})`).attr("width", w).attr("height", h).attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const yr = x.invert(mx);
      const idx = bisect(data, yr, 1);
      const d0 = data[idx - 1], d1 = data[idx] || d0;
      const d = yr - d0.year > (d1.year - d0.year) / 2 ? d1 : d0;
      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
      const rows = TOP5.map(k =>
        `<div class="tooltip-row"><span class="label"><span style="color:${COLORS[k]}">■</span> ${LABELS[k]}</span><span>${fmt.num(d[k] || 0)}</span></div>`
      ).join("");
      tip.show(`<div class="tooltip-title">${d.year}</div>${rows}`, event);
    })
    .on("mouseleave", () => { hoverLine.style("opacity", 0); tip.hide(); });

  // Legend
  const legend = chartBox.append("div").attr("class", "legend");
  TOP5.forEach(k => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-swatch").style("background", COLORS[k]);
    item.append("span").text(LABELS[k]);
  });

  // COVID annotation
  chartBox.append("div").attr("class", "data-note")
    .html("<strong>COVID impact:</strong> Japan closed borders to non-resident foreign visitors from April 2020. Partial reopening began June 2022; full reopening October 2022. The 2020–2021 figures reflect near-zero foreign tourism. By 2024, most prefectures surpassed their 2019 peaks.");
}

/* === Source === */
function renderSource(container) {
  container.append("p").attr("class", "source-attr").style("margin-top", "1.5rem")
    .html('Sources: <a href="https://www.jnto.go.jp/statistics/data/visitors-statistics/" style="color:var(--accent-a)">JNTO Visitor Statistics</a> (1964–2025); <a href="https://www.mlit.go.jp/kankocho/siryou/toukei/shukuhakutoukei.html" style="color:var(--accent-a)">Japan Tourism Agency 宿泊旅行統計調査</a> (2011–2025); Historical aggregates from <a href="https://www.jnto.go.jp/statistics/data/visitors-statistics/pdf/marketingdata_outbound.pdf" style="color:var(--accent-a)">JNTO annual records (PDF)</a>. Country-level data available from 2003; pre-2003 is aggregate only. Prefecture data from JTA accommodation survey via <a href="https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00601020" style="color:var(--accent-a)">e-Stat</a>.');
}

/* === Init === */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initTourismViz));
} else {
  requestAnimationFrame(initTourismViz);
}
