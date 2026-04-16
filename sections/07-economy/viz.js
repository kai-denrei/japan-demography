/* === Economy Visualization === */

function initEconomyViz() {
  d3.select("#economy-viz").html('');
  const container = d3.select("#economy-viz");
  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';

  // Currency state
  const FX = { currency: "JPY", usd: null, eur: null, date: null, loading: true };

  // Fetch live rates
  fetch("https://api.frankfurter.dev/v1/latest?from=JPY&to=USD,EUR")
    .then(r => r.json())
    .then(d => { FX.usd = d.rates.USD; FX.eur = d.rates.EUR; FX.date = d.date; FX.loading = false; updateCurrencyDisplay(); })
    .catch(() => fetch("https://open.er-api.com/v6/latest/JPY").then(r => r.json())
      .then(d => { FX.usd = d.rates.USD; FX.eur = d.rates.EUR; FX.date = d.time_last_update_utc; FX.loading = false; updateCurrencyDisplay(); })
      .catch(() => { FX.loading = false; }));

  function convert(jpyVal) {
    if (FX.currency === "USD" && FX.usd) return jpyVal * FX.usd;
    if (FX.currency === "EUR" && FX.eur) return jpyVal * FX.eur;
    return jpyVal;
  }
  function symbol() { return FX.currency === "USD" ? "$" : FX.currency === "EUR" ? "€" : "¥"; }
  function fmtMoney(v) {
    if (FX.currency === "JPY") {
      if (Math.abs(v) >= 1e12) return "¥" + (v / 1e12).toFixed(1) + "T";
      if (Math.abs(v) >= 1e9) return "¥" + (v / 1e9).toFixed(1) + "B";
      if (Math.abs(v) >= 1e6) return "¥" + (v / 1e6).toFixed(1) + "M";
      return "¥" + fmt.num(Math.round(v));
    }
    const cv = convert(v);
    const s = symbol();
    if (Math.abs(cv) >= 1e9) return s + (cv / 1e9).toFixed(1) + "B";
    if (Math.abs(cv) >= 1e6) return s + (cv / 1e6).toFixed(1) + "M";
    if (Math.abs(cv) >= 1e3) return s + fmt.num(Math.round(cv));
    return s + cv.toFixed(0);
  }
  function fmtSalary(thousandsJpy) {
    const v = thousandsJpy * 1000;
    if (FX.currency === "JPY") return "¥" + fmt.num(Math.round(v));
    return symbol() + fmt.num(Math.round(convert(v)));
  }
  function fmtWage(jpy) {
    if (FX.currency === "JPY") return "¥" + fmt.num(jpy);
    return symbol() + convert(jpy).toFixed(2);
  }

  let updateCallbacks = [];
  function updateCurrencyDisplay() { updateCallbacks.forEach(fn => fn()); }

  Promise.all([
    d3.csv(basePath + "data/economy/prefecture_gdp.csv"),
    d3.csv(basePath + "data/economy/prefecture_income_per_capita.csv"),
    d3.csv(basePath + "data/economy/prefecture_gdp_per_capita.csv"),
    d3.csv(basePath + "data/economy/prefecture_wages.csv"),
    d3.csv(basePath + "data/economy/minimum_wage_2024.csv"),
  ]).then(([gdpRaw, incomeRaw, gdppcRaw, wageRaw, minwageRaw]) => {

    const gdp = gdpRaw.map(d => ({ code: d.prefecture_code, name: d.prefecture_name_en, gdp: +d.gdp_fy2022 }));
    const income = incomeRaw.map(d => ({ code: d.prefecture_code, name: d.prefecture_name_en, income: +d.income_fy2022 }));
    const gdppc = gdppcRaw.map(d => ({ code: d.prefecture_code, name: d.prefecture_name_en, gdppc: +d.gdp_per_capita_fy2022 }));
    const wages = wageRaw.filter(d => d.prefecture_code !== "00").map(d => ({
      code: d.prefecture_code, name: d.prefecture_name_en,
      wage2023: +d.monthly_wage_2023_thousands, wage2024: +d.monthly_wage_2024_thousands,
    }));
    const natWage = wageRaw.find(d => d.prefecture_code === "00");
    const minwage = minwageRaw.map(d => ({ code: d.prefecture_code, name: d.prefecture_name_en, minwage: +d.hourly_min_wage_jpy }));

    renderCurrencyToggle(container);
    renderGdpOverview(container, gdp);
    renderGdpMap(container, gdppc, basePath);
    renderWageChart(container, wages, natWage);
    renderMinWage(container, minwage);
    renderSource(container);
  });

  /* === Currency toggle === */
  function renderCurrencyToggle(container) {
    const bar = container.append("div")
      .style("display", "flex").style("align-items", "center").style("gap", "0.75rem")
      .style("margin-bottom", "1.5rem").style("flex-wrap", "wrap");

    bar.append("span").attr("class", "chart-label").style("font-size", "0.75rem").text("Currency:");

    ["JPY", "USD", "EUR"].forEach(c => {
      bar.append("button")
        .attr("class", "btn" + (c === FX.currency ? " active" : ""))
        .attr("data-cur", c)
        .text(c === "JPY" ? "¥ JPY" : c === "USD" ? "$ USD" : "€ EUR")
        .on("click", function() {
          if (c !== "JPY" && !FX[c.toLowerCase()]) return;
          FX.currency = c;
          bar.selectAll(".btn").classed("active", false);
          d3.select(this).classed("active", true);
          updateCurrencyDisplay();
        });
    });

    const rateLabel = bar.append("span").attr("class", "chart-label").style("font-size", "0.65rem").style("color", "var(--muted)");

    function updateLabel() {
      if (FX.loading) { rateLabel.text("Loading rates..."); return; }
      if (FX.usd && FX.eur) {
        rateLabel.html(`Live rates (${FX.date}): 1 USD = ¥${Math.round(1/FX.usd)} · 1 EUR = ¥${Math.round(1/FX.eur)} · <a href="https://api.frankfurter.dev" style="color:var(--accent-a)">ECB via frankfurter.dev</a>`);
      } else {
        rateLabel.text("Exchange rates unavailable — showing JPY only");
      }
    }
    updateLabel();
    updateCallbacks.push(updateLabel);
  }

  /* === GDP overview === */
  function renderGdpOverview(container, gdp) {
    container.append("h3").attr("class", "section-title").style("margin-top", "1rem")
      .text("Prefectural GDP (FY2022)");

    const sorted = [...gdp].sort((a, b) => b.gdp - a.gdp);
    const totalGdp = sorted.reduce((s, d) => s + d.gdp, 0);
    const tokyo = sorted.find(d => d.name === "Tokyo");

    // Stat cards (dynamic)
    const statRow = container.append("div").attr("class", "stat-row");
    const cards = [];
    [{label: "National GDP", val: () => fmtMoney(totalGdp * 1e6)},
     {label: "Tokyo", val: () => fmtMoney(tokyo.gdp * 1e6)},
     {label: "Tokyo share", val: () => (tokyo.gdp / totalGdp * 100).toFixed(1) + "%"},
     {label: "Top 3 share", val: () => ((sorted[0].gdp + sorted[1].gdp + sorted[2].gdp) / totalGdp * 100).toFixed(1) + "%"},
    ].forEach(s => {
      const c = statRow.append("div").attr("class", "stat-card");
      c.append("div").attr("class", "stat-label").text(s.label);
      const v = c.append("div").attr("class", "stat-value");
      function update() { v.text(s.val()); }
      update();
      cards.push(update);
    });
    updateCallbacks.push(() => cards.forEach(fn => fn()));

    // Bar chart — top 20
    const top20 = sorted.slice(0, 20);
    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawBars() {
      chartBox.selectAll("*").remove();
      const margin = { top: 5, right: 90, bottom: 10, left: 110 };
      const barH = 22;
      const chartW = Math.min(750, chartBox.node().getBoundingClientRect().width);
      const chartH = top20.length * (barH + 3) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const x = d3.scaleLinear().domain([0, d3.max(top20, d => convert(d.gdp * 1e6))]).range([0, w]);
      const y = d3.scaleBand().domain(top20.map(d => d.name)).range([0, chartH - margin.top - margin.bottom]).padding(0.12);

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.selectAll("rect").data(top20).join("rect")
        .attr("x", 0).attr("y", d => y(d.name)).attr("width", d => x(convert(d.gdp * 1e6))).attr("height", y.bandwidth())
        .attr("fill", "#e8a04a").attr("opacity", 0.75).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          tip.show(`<div class="tooltip-title">${d.name}</div>
            <div class="tooltip-row"><span class="label">GDP</span><span>${fmtMoney(d.gdp * 1e6)}</span></div>
            <div class="tooltip-row"><span class="label">% of national</span><span>${(d.gdp / totalGdp * 100).toFixed(1)}%</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.75); tip.hide(); });

      g.selectAll(".bar-label").data(top20).join("text")
        .attr("class", "chart-label").attr("x", -6).attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.65rem").text(d => d.name);

      g.selectAll(".val-label").data(top20).join("text")
        .attr("class", "chart-label").attr("x", d => x(convert(d.gdp * 1e6)) + 4)
        .attr("y", d => y(d.name) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.6rem").style("fill", "var(--text)")
        .text(d => fmtMoney(d.gdp * 1e6));
    }
    drawBars();
    updateCallbacks.push(drawBars);
  }

  /* === GDP per capita choropleth === */
  function renderGdpMap(container, gdppc, basePath) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("GDP per Capita by Prefecture (FY2022)");

    const layout = container.append("div").attr("class", "map-layout");
    const mapCol = layout.append("div");
    const chartBox = mapCol.append("div").attr("class", "chart-container");
    const { width } = getChartDimensions(chartBox.node(), 0.8);
    const height = Math.min(width * 0.9, window.innerHeight * 0.6);

    const svg = chartBox.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");
    const mapG = svg.append("g");
    const tip = createTooltip();

    const lookup = {};
    gdppc.forEach(d => { lookup[d.code] = d; });
    const maxVal = d3.max(gdppc, d => d.gdppc);
    const minVal = d3.min(gdppc, d => d.gdppc);
    const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([minVal * 0.9, maxVal]);

    d3.json(basePath + "data/geo/japan_prefecture.topojson").then(topo => {
      const geojson = topojson.feature(topo, topo.objects.japan);
      const projection = d3.geoMercator().center([137, 36]).fitSize([width, height], geojson);
      const path = d3.geoPath(projection);

      function prefCode(d) { return String(d.properties.id).padStart(2, "0"); }

      const paths = mapG.selectAll("path").data(geojson.features).join("path")
        .attr("d", path)
        .attr("fill", d => { const pd = lookup[prefCode(d)]; return pd ? color(pd.gdppc) : "#333"; })
        .attr("stroke", "#252b38").attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke", "var(--accent-a)").attr("stroke-width", 1.5).raise();
          const code = prefCode(d);
          const pd = lookup[code];
          const names = PREF_NAMES[code];
          if (!pd || !names) return;
          tip.show(`<div class="tooltip-title">${names[0]} ${names[1]}</div>
            <div class="tooltip-row"><span class="label">GDP/capita</span><span>${fmtSalary(pd.gdppc)}</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("stroke", "#252b38").attr("stroke-width", 0.5); tip.hide(); });

      svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[0,0],[width,height]])
        .on("zoom", e => mapG.attr("transform", e.transform)));
    });

    // Sidebar
    const sidebar = layout.append("div").attr("class", "sidebar");
    const sorted = [...gdppc].sort((a, b) => b.gdppc - a.gdppc);

    function drawSidebar() {
      sidebar.selectAll("*").remove();
      sidebar.append("h3").text("Highest GDP/capita");
      sorted.slice(0, 10).forEach(d => {
        sidebar.append("div").attr("class", "sidebar-item")
          .html(`<span>${d.name}</span><span class="density">${fmtSalary(d.gdppc)}</span>`);
      });
      sidebar.append("div").style("height", "1.5rem");
      sidebar.append("h3").text("Lowest GDP/capita");
      sorted.slice(-10).reverse().forEach(d => {
        sidebar.append("div").attr("class", "sidebar-item")
          .html(`<span>${d.name}</span><span class="density">${fmtSalary(d.gdppc)}</span>`);
      });
    }
    drawSidebar();
    updateCallbacks.push(drawSidebar);
  }

  /* === Wage chart === */
  function renderWageChart(container, wages, natWage) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Monthly Wages by Prefecture (2024)");
    container.append("p").attr("class", "section-subtitle")
      .text("Scheduled cash earnings (所定内給与額) — full-time workers at establishments with 10+ employees");

    const sorted = [...wages].sort((a, b) => b.wage2024 - a.wage2024);
    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawWages() {
      chartBox.selectAll("*").remove();
      const margin = { top: 5, right: 80, bottom: 10, left: 110 };
      const barH = 16;
      const chartW = Math.min(750, chartBox.node().getBoundingClientRect().width);
      const chartH = sorted.length * (barH + 2) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const natVal = natWage ? +natWage.monthly_wage_2024_thousands : 330.4;
      const x = d3.scaleLinear().domain([0, d3.max(sorted, d => convert(d.wage2024 * 1000)) * 1.05]).range([0, w]);
      const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, chartH - margin.top - margin.bottom]).padding(0.1);

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // National average line
      const natX = x(convert(natVal * 1000));
      g.append("line").attr("x1", natX).attr("x2", natX).attr("y1", 0).attr("y2", chartH - margin.top - margin.bottom)
        .attr("stroke", "var(--accent-a)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");
      g.append("text").attr("x", natX + 3).attr("y", -3).attr("class", "chart-label").style("font-size", "0.55rem").style("fill", "var(--accent-a)")
        .text("National avg: " + fmtSalary(natVal));

      g.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y(d.name)).attr("width", d => x(convert(d.wage2024 * 1000))).attr("height", y.bandwidth())
        .attr("fill", d => d.wage2024 >= natVal ? "#4a9ec8" : "#c84a4a").attr("opacity", 0.7).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          const yoy = d.wage2023 > 0 ? ((d.wage2024 - d.wage2023) / d.wage2023 * 100).toFixed(1) + "%" : "—";
          tip.show(`<div class="tooltip-title">${d.name}</div>
            <div class="tooltip-row"><span class="label">Monthly wage</span><span>${fmtSalary(d.wage2024)}</span></div>
            <div class="tooltip-row"><span class="label">Est. annual</span><span>${fmtSalary(d.wage2024 * 12)}</span></div>
            <div class="tooltip-row"><span class="label">YoY change</span><span>${yoy}</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.7); tip.hide(); });

      g.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -4).attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.55rem").text(d => d.name);

      g.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x(convert(d.wage2024 * 1000)) + 3)
        .attr("y", d => y(d.name) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtSalary(d.wage2024));
    }
    drawWages();
    updateCallbacks.push(drawWages);
  }

  /* === Minimum wage === */
  function renderMinWage(container, minwage) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Minimum Wage by Prefecture (Oct 2024)");

    const sorted = [...minwage].sort((a, b) => b.minwage - a.minwage);
    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawMinWage() {
      chartBox.selectAll("*").remove();
      const margin = { top: 5, right: 70, bottom: 10, left: 110 };
      const barH = 16;
      const chartW = Math.min(750, chartBox.node().getBoundingClientRect().width);
      const chartH = sorted.length * (barH + 2) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const x = d3.scaleLinear().domain([0, d3.max(sorted, d => convert(d.minwage)) * 1.05]).range([0, w]);
      const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, chartH - margin.top - margin.bottom]).padding(0.1);

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const maxW = d3.max(sorted, d => d.minwage);
      const minW = d3.min(sorted, d => d.minwage);
      const colorScale = d3.scaleLinear().domain([minW, maxW]).range(["#c84a4a", "#4ac87a"]);

      g.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y(d.name)).attr("width", d => x(convert(d.minwage))).attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.minwage)).attr("opacity", 0.75).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          const monthly = d.minwage * 8 * 22;
          const annual = monthly * 12;
          tip.show(`<div class="tooltip-title">${d.name}</div>
            <div class="tooltip-row"><span class="label">Hourly</span><span>${fmtWage(d.minwage)}/hr</span></div>
            <div class="tooltip-row"><span class="label">Est. monthly (176h)</span><span>${fmtMoney(monthly)}</span></div>
            <div class="tooltip-row"><span class="label">Est. annual</span><span>${fmtMoney(annual)}</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.75); tip.hide(); });

      g.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -4).attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.55rem").text(d => d.name);

      g.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x(convert(d.minwage)) + 3)
        .attr("y", d => y(d.name) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtWage(d.minwage) + "/hr");
    }
    drawMinWage();
    updateCallbacks.push(drawMinWage);
  }

  /* === Source === */
  function renderSource(container) {
    container.append("p").attr("class", "source-attr").style("margin-top", "1.5rem")
      .html('Sources: <a href="https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html" style="color:var(--accent-a)">Cabinet Office — Prefectural Accounts (県民経済計算)</a> FY2022; <a href="https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/" style="color:var(--accent-a)">MHLW — Basic Survey on Wage Structure (賃金構造基本統計調査)</a> 2024; <a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/" style="color:var(--accent-a)">MHLW — Regional Minimum Wages</a> Oct 2024. Exchange rates via <a href="https://api.frankfurter.dev" style="color:var(--accent-a)">ECB/frankfurter.dev</a>.');
  }
}

/* === Init === */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initEconomyViz));
} else {
  requestAnimationFrame(initEconomyViz);
}
