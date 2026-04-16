/* === Crime Statistics Visualization === */

function initCrimeViz() {
  d3.select("#crime-viz").html('');
  const container = d3.select("#crime-viz");
  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';

  Promise.all([
    d3.csv(basePath + "data/crime/annual_totals.csv"),
    d3.csv(basePath + "data/crime/penal_by_nationality_persons.csv"),
    d3.csv(basePath + "data/crime/penal_by_nationality_cases.csv"),
    d3.csv(basePath + "data/crime/by_area_nationality.csv"),
  ]).then(([annualRaw, personsRaw, casesRaw, areaRaw]) => {

    const annual = annualRaw.map(d => {
      const row = {};
      for (const [k, v] of Object.entries(d)) row[k] = +v;
      return row;
    });

    const years = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];

    function parseNatTable(raw) {
      const out = {};
      raw.forEach(row => {
        out[row.nationality] = years.map(y => +row[y] || 0);
      });
      return out;
    }
    const persons = parseNatTable(personsRaw);
    const cases = parseNatTable(casesRaw);

    renderContext(container);
    renderAnnualTrend(container, annual);
    renderNationalityTrend(container, persons, years);
    renderAreaBreakdown(container, areaRaw);
    renderPerCapita(container, persons, years);
    renderDefinitions(container);
    renderSource(container);
  });
}

/* === Context box === */
function renderContext(container) {
  container.append("div")
    .attr("class", "data-note")
    .html(`<strong>Scope:</strong> This section shows <em>arrest data</em> (検挙) for 来日外国人 ("visiting foreign nationals") — defined by NPA as all foreign nationals in Japan <strong>excluding</strong> permanent residents, special permanent residents (mostly Zainichi Koreans), and US military personnel. This is a subset of all foreigners. Arrests are not convictions. Crime rates require normalization by population, shown below.`);
}

/* === Chart 1: Annual trend — total arrests === */
function renderAnnualTrend(container, data) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2rem")
    .text("Total Arrests — Visiting Foreign Nationals");

  // Stat cards
  const latest = data[data.length - 1];
  const statRow = container.append("div").attr("class", "stat-row");

  const c1 = statRow.append("div").attr("class", "stat-card");
  c1.append("div").attr("class", "stat-label").text("Penal Code Arrests (2024)");
  c1.append("div").attr("class", "stat-value").text(fmt.num(latest.penal_cases_visiting) + " cases");

  const c2 = statRow.append("div").attr("class", "stat-card");
  c2.append("div").attr("class", "stat-label").text("Persons Arrested (2024)");
  c2.append("div").attr("class", "stat-value").text(fmt.num(latest.penal_persons_visiting));

  const c3 = statRow.append("div").attr("class", "stat-card");
  c3.append("div").attr("class", "stat-label").text("Special Law Violations (2024)");
  c3.append("div").attr("class", "stat-value").text(fmt.num(latest.special_cases_visiting) + " cases");

  // Chart
  const chartBox = container.append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartBox.node(), 0.45);
  const margin = { top: 20, right: 30, bottom: 35, left: 60 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
  const yMax = d3.max(data, d => Math.max(d.penal_cases_visiting, d.special_cases_visiting));
  const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

  g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? (d/1000).toFixed(0) + "k" : d));

  // Penal code area + line
  const penalArea = d3.area().x(d => x(d.year)).y0(h).y1(d => y(d.penal_cases_visiting)).curve(d3.curveMonotoneX);
  g.append("path").datum(data).attr("d", penalArea).attr("fill", "#c84a4a").attr("opacity", 0.15);

  const penalLine = d3.line().x(d => x(d.year)).y(d => y(d.penal_cases_visiting)).curve(d3.curveMonotoneX);
  g.append("path").datum(data).attr("d", penalLine).attr("fill", "none").attr("stroke", "#c84a4a").attr("stroke-width", 2);

  // Special law line
  const specLine = d3.line().x(d => x(d.year)).y(d => y(d.special_cases_visiting)).curve(d3.curveMonotoneX);
  g.append("path").datum(data).attr("d", specLine).attr("fill", "none").attr("stroke", "#e8a04a").attr("stroke-width", 2).attr("stroke-dasharray", "6,3");

  // Tooltip
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
      tip.show(`<div class="tooltip-title">${d.year}</div>
        <div class="tooltip-row"><span class="label">Penal cases</span><span>${fmt.num(d.penal_cases_visiting)}</span></div>
        <div class="tooltip-row"><span class="label">Penal persons</span><span>${fmt.num(d.penal_persons_visiting)}</span></div>
        <div class="tooltip-row"><span class="label">Special law cases</span><span>${fmt.num(d.special_cases_visiting)}</span></div>
        <div class="tooltip-row"><span class="label">Special law persons</span><span>${fmt.num(d.special_persons_visiting)}</span></div>`, event);
    })
    .on("mouseleave", () => { hoverLine.style("opacity", 0); tip.hide(); });

  // Legend
  const legend = chartBox.append("div").attr("class", "legend");
  [{color:"#c84a4a", label:"Penal Code offenses (刑法犯)"}, {color:"#e8a04a", label:"Special law violations (特別法犯)", dashed:true}].forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-swatch").style("background", d.dashed ? "transparent" : d.color).style("border", d.dashed ? `2px dashed ${d.color}` : "none");
    item.append("span").text(d.label);
  });
}

/* === Chart 2: By nationality stacked area === */
function renderNationalityTrend(container, persons, years) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Arrests by Nationality — Persons (Penal Code)");
  container.append("p").attr("class", "section-subtitle")
    .text("Visiting foreign nationals arrested for Penal Code offenses, by nationality of suspect");

  const NATS = ["vietnam", "china", "philippines", "brazil", "korea", "indonesia", "sri_lanka", "usa"];
  const LABELS = { vietnam:"Vietnam", china:"China", philippines:"Philippines", brazil:"Brazil", korea:"Korea", indonesia:"Indonesia", sri_lanka:"Sri Lanka", usa:"USA" };
  const COLORS = { vietnam:"#9b4ac8", china:"#c84a4a", philippines:"#4a9ec8", brazil:"#4ac87a", korea:"#e8a04a", indonesia:"#c8c44a", sri_lanka:"#c87a4a", usa:"#4a5568" };

  // Build stacked data
  const stackData = years.map((y, i) => {
    const row = { year: y };
    NATS.forEach(n => row[n] = persons[n] ? persons[n][i] : 0);
    // Compute "other" as total minus named
    const named = NATS.reduce((s, n) => s + (row[n] || 0), 0);
    row.other = Math.max(0, (persons.total ? persons.total[i] : 0) - named);
    return row;
  });

  const allKeys = [...NATS, "other"];
  const allColors = { ...COLORS, other: "#6b7280" };
  const allLabels = { ...LABELS, other: "Other" };

  const chartBox = container.append("div").attr("class", "chart-container");
  const dims = getChartDimensions(chartBox.node(), 0.5);
  const margin = { top: 20, right: 30, bottom: 35, left: 60 };
  const w = dims.width - margin.left - margin.right;
  const h = dims.height - margin.top - margin.bottom;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, w]);

  const visible = {};
  allKeys.forEach(k => visible[k] = true);

  function computeStack() {
    const active = allKeys.filter(k => visible[k]);
    return d3.stack().keys(active).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(stackData);
  }

  let stacked = computeStack();
  const y = d3.scaleLinear().domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice().range([h, 0]);

  const area = d3.area().x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1])).curve(d3.curveMonotoneX);

  g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
  const xAxisG = g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`);
  const yAxisG = g.append("g").attr("class", "axis");

  function drawAxes() {
    xAxisG.call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));
    yAxisG.call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? (d/1000).toFixed(1) + "k" : d));
  }

  const areasG = g.append("g");

  function drawAreas() {
    const paths = areasG.selectAll("path").data(stacked, d => d.key);
    paths.exit().remove();
    paths.enter().append("path")
      .attr("fill", d => allColors[d.key])
      .attr("opacity", 0.8)
      .merge(paths)
      .transition().duration(400)
      .attr("d", area)
      .attr("fill", d => allColors[d.key]);
  }

  drawAxes();
  drawAreas();

  // Hover
  const tip = createTooltip();
  const hoverLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-width", 1).attr("y1", 0).attr("y2", h).style("opacity", 0);

  svg.append("rect").attr("transform", `translate(${margin.left},${margin.top})`).attr("width", w).attr("height", h).attr("fill", "transparent")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const yr = Math.round(x.invert(mx));
      const d = stackData.find(r => r.year === yr) || stackData.reduce((a, b) => Math.abs(b.year - yr) < Math.abs(a.year - yr) ? b : a);
      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);
      const rows = allKeys.filter(k => visible[k]).map(k =>
        `<div class="tooltip-row"><span class="label"><span style="color:${allColors[k]}">&#9632;</span> ${allLabels[k]}</span><span>${fmt.num(d[k])}</span></div>`
      ).join("");
      const total = allKeys.filter(k => visible[k]).reduce((s, k) => s + d[k], 0);
      tip.show(`<div class="tooltip-title">${d.year}</div><div class="tooltip-row"><span class="label">Total</span><span>${fmt.num(total)}</span></div>${rows}`, event);
    })
    .on("mouseleave", () => { hoverLine.style("opacity", 0); tip.hide(); });

  // Legend (toggleable)
  const legend = chartBox.append("div").attr("class", "legend");
  allKeys.forEach(k => {
    const item = legend.append("div").attr("class", "legend-item").on("click", () => {
      visible[k] = !visible[k];
      item.classed("dimmed", !visible[k]);
      stacked = computeStack();
      if (stacked.length > 0) y.domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice();
      drawAxes(); drawAreas();
    });
    item.append("div").attr("class", "legend-swatch").style("background", allColors[k]);
    item.append("span").text(allLabels[k]);
  });
}

/* === Chart 3: Area breakdown (filterable) === */
function renderAreaBreakdown(container, areaRaw) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Arrests by Area");
  container.append("p").attr("class", "section-subtitle")
    .text("Penal Code arrests by nationality — filter by area");

  const data = areaRaw.map(d => ({
    area: d.area, nationality: d.nationality,
    cases: +d.penal_cases, persons: +d.penal_persons,
  }));

  const areas = [...new Set(data.map(d => d.area))];
  const areaYears = { National: "2024", Tokyo: "2024", Osaka: "2024", Saitama: "2023" };

  // Filter controls
  const controls = container.append("div").style("margin-bottom", "1rem").style("display", "flex").style("gap", "0.5rem").style("flex-wrap", "wrap");
  let activeArea = "National";

  areas.forEach(a => {
    controls.append("button")
      .attr("class", "btn" + (a === activeArea ? " active" : ""))
      .attr("data-area", a)
      .text(a + " (" + areaYears[a] + ")")
      .on("click", function() {
        activeArea = a;
        controls.selectAll(".btn").classed("active", false);
        d3.select(this).classed("active", true);
        render();
      });
  });

  // Metric toggle
  let metric = "persons";
  const metricControls = container.append("div").style("margin-bottom", "1rem").style("display", "flex").style("gap", "0.5rem");
  ["persons", "cases"].forEach(m => {
    metricControls.append("button")
      .attr("class", "btn" + (m === metric ? " active" : ""))
      .attr("data-metric", m)
      .text(m === "persons" ? "Persons arrested" : "Cases")
      .on("click", function() {
        metric = m;
        metricControls.selectAll(".btn").classed("active", false);
        d3.select(this).classed("active", true);
        render();
      });
  });

  const chartBox = container.append("div").attr("class", "chart-container");
  const tip = createTooltip();

  function render() {
    chartBox.selectAll("*").remove();

    const areaData = data.filter(d => d.area === activeArea && d.nationality !== "Total");
    areaData.sort((a, b) => (metric === "persons" ? b.persons - a.persons : b.cases - a.cases));

    const total = data.find(d => d.area === activeArea && d.nationality === "Total");

    // Stat line
    if (total) {
      chartBox.append("div").style("font-family", "var(--mono)").style("font-size", "0.75rem").style("color", "var(--muted)").style("margin-bottom", "1rem")
        .html(`${activeArea} total: <span style="color:var(--text)">${fmt.num(total.cases)}</span> cases / <span style="color:var(--text)">${fmt.num(total.persons)}</span> persons arrested`);
    }

    if (areaData.length === 0) {
      chartBox.append("div").style("color", "var(--muted)").style("font-family", "var(--mono)").style("font-size", "0.8rem").text("No detailed nationality data available for this area.");
      return;
    }

    const margin = { top: 5, right: 70, bottom: 10, left: 120 };
    const barH = 22;
    const chartW = Math.min(750, chartBox.node().getBoundingClientRect().width);
    const chartH = areaData.length * (barH + 3) + margin.top + margin.bottom;
    const w = chartW - margin.left - margin.right;

    const val = d => metric === "persons" ? d.persons : d.cases;

    const x = d3.scaleLinear().domain([0, d3.max(areaData, val) * 1.05]).range([0, w]);
    const y = d3.scaleBand().domain(areaData.map(d => d.nationality)).range([0, chartH - margin.top - margin.bottom]).padding(0.12);

    const svg = chartBox.append("svg")
      .attr("viewBox", `0 0 ${chartW} ${chartH}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("rect").data(areaData).join("rect")
      .attr("x", 0).attr("y", d => y(d.nationality))
      .attr("width", d => Math.max(2, x(val(d)))).attr("height", y.bandwidth())
      .attr("fill", "#c84a4a").attr("opacity", 0.75).attr("rx", 2)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1);
        const pct = total ? ((metric === "persons" ? d.persons : d.cases) / (metric === "persons" ? total.persons : total.cases) * 100).toFixed(1) : "?";
        tip.show(`<div class="tooltip-title">${d.nationality}</div>
          <div class="tooltip-row"><span class="label">Cases</span><span>${fmt.num(d.cases)}</span></div>
          <div class="tooltip-row"><span class="label">Persons</span><span>${fmt.num(d.persons)}</span></div>
          <div class="tooltip-row"><span class="label">% of ${activeArea}</span><span>${pct}%</span></div>`, event);
      })
      .on("mousemove", (event) => tip.move(event))
      .on("mouseout", function() { d3.select(this).attr("opacity", 0.75); tip.hide(); });

    g.selectAll(".bar-label").data(areaData).join("text")
      .attr("class", "chart-label").attr("x", -6)
      .attr("y", d => y(d.nationality) + y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("text-anchor", "end").style("font-size", "0.65rem").text(d => d.nationality);

    g.selectAll(".val-label").data(areaData).join("text")
      .attr("class", "chart-label")
      .attr("x", d => Math.max(2, x(val(d))) + 4)
      .attr("y", d => y(d.nationality) + y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("text-anchor", "start").style("font-size", "0.6rem").style("fill", "var(--text)")
      .text(d => fmt.num(val(d)));
  }

  render();

  chartBox.append("div").attr("class", "data-note").style("margin-top", "1rem")
    .html(`<strong>Sources:</strong> National — <a href="https://www.npa.go.jp/publications/statistics/sousa/year.html" style="color:var(--accent-a)">NPA 犯罪統計書</a> Table 132 (2024). Tokyo — <a href="https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/tokei/k_tokei06.html" style="color:var(--accent-a)">警視庁の統計</a> Table 54 (2024). Osaka — <a href="https://www.police.pref.osaka.lg.jp/seikatsu/hanzai/17666.html" style="color:var(--accent-a)">大阪府警 犯罪統計</a> Section 8-2 (2024). Saitama — <a href="https://www.police.pref.saitama.lg.jp/e0010/kurashi/toukei-hanzai.html" style="color:var(--accent-a)">埼玉県警 令和5年の犯罪</a> (2023). Visiting foreign nationals (来日外国人) only. "China" includes Taiwan per NPA/police convention.`);
}

/* === Chart 4: Per-capita arrest rate === */
function renderPerCapita(container, persons, years) {
  container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
    .text("Per-Capita Arrest Rates — 2024");
  container.append("p").attr("class", "section-subtitle")
    .text("Penal Code arrests per 10,000 residents of that nationality (mid-2023 population data)");

  // Population from our residents data (mid-2023 vintage)
  const pop = {
    vietnam: 520154, china: 788495, philippines: 309943, brazil: 210563,
    korea: 411748, indonesia: 122028, sri_lanka: 46949, usa: 62425,
    thailand: 63689, india: 48835, pakistan: 21293, bangladesh: 24940,
  };

  const LABELS = {
    vietnam:"Vietnam", china:"China", philippines:"Philippines", brazil:"Brazil",
    korea:"Korea", indonesia:"Indonesia", sri_lanka:"Sri Lanka", usa:"USA",
    thailand:"Thailand", india:"India", pakistan:"Pakistan", bangladesh:"Bangladesh",
    japanese:"Japanese nationals",
  };

  // 2024 persons (last index)
  const data2024 = [];
  for (const [nat, popVal] of Object.entries(pop)) {
    const arr = persons[nat];
    if (!arr) continue;
    const arrested = arr[arr.length - 1]; // 2024
    const rate = (arrested / popVal) * 10000;
    data2024.push({ nat, label: LABELS[nat], arrested, pop: popVal, rate, isBaseline: false });
  }

  // Japanese baseline: total 2024 penal arrests = 191,826 persons (NPA Table 1)
  // Foreign arrests 2024 = 10,464 persons (Table 129)
  // Japanese arrests = 191,826 - 10,464 = 181,362
  // Japanese population ≈ 123,750,000 - 3,769,000 = 119,981,000
  const jpArrested = 191826 - 10464;
  const jpPop = 123750000 - 3769000;
  const jpRate = (jpArrested / jpPop) * 10000;
  data2024.push({ nat: "japanese", label: "Japanese nationals", arrested: jpArrested, pop: jpPop, rate: jpRate, isBaseline: true });

  data2024.sort((a, b) => b.rate - a.rate);

  const chartBox = container.append("div").attr("class", "chart-container");
  const margin = { top: 10, right: 90, bottom: 30, left: 110 };
  const barH = 26;
  const chartW = Math.min(700, chartBox.node().getBoundingClientRect().width);
  const chartH = data2024.length * (barH + 4) + margin.top + margin.bottom;
  const w = chartW - margin.left - margin.right;

  const svg = chartBox.append("svg")
    .attr("viewBox", `0 0 ${chartW} ${chartH}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(data2024, d => d.rate) * 1.1]).range([0, w]);
  const y = d3.scaleBand().domain(data2024.map(d => d.label)).range([0, chartH - margin.top - margin.bottom]).padding(0.15);

  const tip = createTooltip();

  g.selectAll("rect").data(data2024).join("rect")
    .attr("x", 0).attr("y", d => y(d.label))
    .attr("width", d => x(d.rate)).attr("height", y.bandwidth())
    .attr("fill", d => d.isBaseline ? "var(--accent-b)" : "#c84a4a").attr("opacity", 0.75).attr("rx", 2)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 1);
      tip.show(`<div class="tooltip-title">${d.label}</div>
        <div class="tooltip-row"><span class="label">Arrested</span><span>${fmt.num(d.arrested)} persons</span></div>
        <div class="tooltip-row"><span class="label">Population</span><span>${fmt.num(d.pop)}</span></div>
        <div class="tooltip-row"><span class="label">Rate</span><span>${d.rate.toFixed(1)} per 10k</span></div>`, event);
    })
    .on("mousemove", (event) => tip.move(event))
    .on("mouseout", function() { d3.select(this).attr("opacity", 0.75); tip.hide(); });

  g.selectAll(".bar-label").data(data2024).join("text")
    .attr("class", "chart-label").attr("x", -6)
    .attr("y", d => y(d.label) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("text-anchor", "end").style("font-size", "0.65rem").text(d => d.label);

  g.selectAll(".val-label").data(data2024).join("text")
    .attr("class", "chart-label")
    .attr("x", d => x(d.rate) + 4)
    .attr("y", d => y(d.label) + y.bandwidth() / 2).attr("dy", "0.35em")
    .attr("text-anchor", "start").style("font-size", "0.6rem").style("fill", "var(--text)")
    .text(d => d.rate.toFixed(1) + " / 10k");

  chartBox.append("div").attr("class", "data-note")
    .html(`<strong>Methodology:</strong> Rate = (persons arrested for Penal Code offenses in 2024) ÷ (population) × 10,000. Foreign population denominators are from <a href="https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html" style="color:var(--accent-a)">MoJ June 2023 statistics</a> (来日外国人 only — excludes permanent/special permanent residents). Japanese baseline: total 2024 penal arrests (191,826 persons, <a href="https://www.npa.go.jp/publications/statistics/sousa/year.html" style="color:var(--accent-a)">NPA 犯罪統計書 Table 1</a>) minus all foreign arrests (10,464, <a href="https://www.npa.go.jp/publications/statistics/sousa/year.html" style="color:var(--accent-a)">Table 129</a>), divided by Japanese national population (~120M). This is an <em>arrest</em> rate, not a conviction rate. Small populations produce volatile rates.`);
}

/* === Definitions === */
function renderDefinitions(container) {
  container.append("div").attr("class", "data-note").style("margin-top", "1.5rem")
    .html(`<strong>Key definitions:</strong><br>
    <strong>来日外国人 (visiting foreign nationals):</strong> All foreign nationals in Japan excluding: permanent residents (永住者), special permanent residents (特別永住者 — mostly Zainichi Koreans/Taiwanese), US military-related personnel, and those with unknown residence status.<br>
    <strong>刑法犯 (Penal Code offenses):</strong> Homicide, robbery, assault, theft, fraud, arson, sexual offenses, etc. Excludes traffic negligence.<br>
    <strong>特別法犯 (Special law violations):</strong> Immigration Control Act, drug laws, weapons laws, prostitution prevention, etc. Excludes traffic law violations.<br>
    <strong>"China" (中国):</strong> NPA definition includes Taiwan, Hong Kong, and Macau.`);
}

/* === Source === */
function renderSource(container) {
  container.append("p").attr("class", "source-attr")
    .html('Source: National Police Agency (警察庁) — 犯罪統計書 Tables 129, 132 (令和6年). <a href="https://www.npa.go.jp/publications/statistics/sousa/year.html" style="color:var(--accent-a)">npa.go.jp</a>');
}

/* === Init === */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initCrimeViz));
} else {
  requestAnimationFrame(initCrimeViz);
}
