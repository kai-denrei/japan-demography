/* === Real Estate Visualization === */

function initRealEstateViz() {
  d3.select("#realestate-viz").html('');
  const container = d3.select("#realestate-viz");
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
  function fmtPrice(v) {
    if (FX.currency === "JPY") return "¥" + fmt.num(Math.round(v));
    return symbol() + fmt.num(Math.round(convert(v)));
  }
  function fmtPriceShort(v) {
    const cv = convert(v);
    const s = symbol();
    if (FX.currency === "JPY") {
      if (cv >= 1e6) return s + (cv / 1e6).toFixed(1) + "M";
      if (cv >= 1e3) return s + fmt.num(Math.round(cv));
      return s + Math.round(cv);
    }
    if (cv >= 1e6) return s + (cv / 1e6).toFixed(1) + "M";
    if (cv >= 1e3) return s + fmt.num(Math.round(cv));
    return s + cv.toFixed(0);
  }
  function fmtRent(v) {
    if (FX.currency === "JPY") return "¥" + fmt.num(Math.round(v));
    return symbol() + fmt.num(Math.round(convert(v)));
  }

  let updateCallbacks = [];
  function updateCurrencyDisplay() { updateCallbacks.forEach(fn => fn()); }

  // Region mapping for scatter plot coloring
  const REGION_MAP = {
    "Hokkaido": "Hokkaido", "Aomori": "Tohoku", "Iwate": "Tohoku", "Miyagi": "Tohoku",
    "Akita": "Tohoku", "Yamagata": "Tohoku", "Fukushima": "Tohoku",
    "Ibaraki": "Kanto", "Tochigi": "Kanto", "Gunma": "Kanto", "Saitama": "Kanto",
    "Chiba": "Kanto", "Tokyo": "Kanto", "Kanagawa": "Kanto",
    "Niigata": "Chubu", "Toyama": "Chubu", "Ishikawa": "Chubu", "Fukui": "Chubu",
    "Yamanashi": "Chubu", "Nagano": "Chubu", "Gifu": "Chubu", "Shizuoka": "Chubu", "Aichi": "Chubu",
    "Mie": "Kansai", "Shiga": "Kansai", "Kyoto": "Kansai", "Osaka": "Kansai",
    "Hyogo": "Kansai", "Nara": "Kansai", "Wakayama": "Kansai",
    "Tottori": "Chugoku", "Shimane": "Chugoku", "Okayama": "Chugoku", "Hiroshima": "Chugoku", "Yamaguchi": "Chugoku",
    "Tokushima": "Shikoku", "Kagawa": "Shikoku", "Ehime": "Shikoku", "Kochi": "Shikoku",
    "Fukuoka": "Kyushu", "Saga": "Kyushu", "Nagasaki": "Kyushu", "Kumamoto": "Kyushu",
    "Oita": "Kyushu", "Miyazaki": "Kyushu", "Kagoshima": "Kyushu", "Okinawa": "Kyushu"
  };
  const REGION_COLORS = {
    "Hokkaido": "#8dd3c7", "Tohoku": "#80b1d3", "Kanto": "#fb8072",
    "Chubu": "#fdb462", "Kansai": "#b3de69", "Chugoku": "#bebada",
    "Shikoku": "#fccde5", "Kyushu": "#bc80bd"
  };

  // Non-prefecture rows to skip in land price CSV
  const SKIP_PREFS = new Set(["National", "Three_Major_Metro", "Tokyo_Metro", "Osaka_Metro", "Nagoya_Metro", "Regional"]);

  // Load all data
  Promise.all([
    d3.csv(basePath + "data/realestate/property_price_index.csv"),
    d3.csv(basePath + "data/realestate/mlit_property_price_index.csv"),
    d3.csv(basePath + "data/realestate/prefecture_land_prices.csv"),
    d3.csv(basePath + "data/realestate/prefecture_rent.csv"),
    d3.csv(basePath + "data/realestate/prefecture_housing.csv"),
    d3.csv(basePath + "data/economy/tokyo_23wards_real_estate.csv"),
    d3.csv(basePath + "data/realestate/tokyo_luxury.csv"),
    d3.csv(basePath + "data/realestate/okushan_trend.csv"),
    d3.csv(basePath + "data/realestate/minato_microarea.csv"),
    d3.csv(basePath + "data/realestate/listings_database.csv"),
  ]).then(([bisRaw, mlitRaw, landRaw, rentRaw, housingRaw, wardRaw, luxuryRaw, okushanRaw, minatoRaw, listingsRaw]) => {

    // Parse BIS
    const bis = bisRaw.map(d => ({
      year: +d.year, quarter: +d.quarter, index: +d.index,
      date: new Date(+d.year, (+d.quarter - 1) * 3, 1)
    }));

    // Parse MLIT
    const mlit = mlitRaw.map(d => ({
      year: +d.year, month: +d.month,
      composite: +d.residential_composite, condo: +d.condo,
      detached: +d.detached, land: +d.residential_land,
      date: new Date(+d.year, +d.month - 1, 1)
    }));

    // Parse land prices (skip aggregate rows)
    const landPrices = landRaw.filter(d => !SKIP_PREFS.has(d.prefecture)).map(d => ({
      name: d.prefecture,
      y1975: +d["1975"], y1980: +d["1980"], y1985: +d["1985"], y1990: +d["1990"],
      y1995: +d["1995"], y2000: +d["2000"], y2005: +d["2005"], y2010: +d["2010"],
      y2015: +d["2015"], y2020: +d["2020"], y2025: +d["2025"], y2026: +d["2026"]
    }));

    // Parse rent
    const rent = rentRaw.map(d => ({
      code: d.prefecture_code, name: d.prefecture_name_en, rent: +d.monthly_rent_jpy
    }));

    // Parse housing
    const housing = housingRaw.map(d => ({
      code: d.prefecture_code, name: d.prefecture_name_en,
      vacancy: +d.vacancy_rate, ownership: +d.homeownership_rate
    }));

    // Parse ward data
    const wards = wardRaw.map(d => ({
      ja: d.ward_ja, en: d.ward_en,
      population: +d.population_2026, households: +d.households_2026,
      area: +d.area_km2, density: +d.pop_density_per_km2,
      avgLandPrice: +d.avg_land_price_yen_m2,
      residentialPrice: +d.residential_land_price_yen_m2,
      commercialPrice: +d.commercial_land_price_yen_m2,
      yoy: +d.land_price_yoy_change_pct,
      condoPrice: +d.resale_condo_70m2_million_yen,
      rent1R: +d.rent_1R1K1DK_man_yen,
      rent1LDK: +d.rent_1LDK2K2DK_man_yen,
      rent2LDK: +d.rent_2LDK3K3DK_man_yen,
      rent3LDK: +d.rent_3LDK4K_man_yen
    }));

    // Parse luxury data
    const luxury = luxuryRaw.map(d => ({ category: d.category, name: d.name, sqm: +d.price_per_sqm_jpy, total: +d.total_price_jpy, year: +d.year, type: d.type, notes: d.notes }));
    const okushan = okushanRaw.map(d => ({ year: +d.year, units: +d.units_sold_greater_tokyo, share: d.share_23ward_new_pct ? +d.share_23ward_new_pct : null }));
    const minato = minatoRaw.map(d => ({ en: d.area_en, jp: d.area_jp, price: +d.price_per_sqm_jpy, yoy: +d.yoy_pct, type: d.type }));

    renderCurrencyToggle(container);
    renderBisChart(container, bis);
    renderMlitChart(container, mlit);
    renderLandPriceMap(container, landPrices, basePath);
    renderRentChart(container, rent);
    renderAkiyaChart(container, housing);
    renderWardChart(container, wards);
    renderLuxurySection(container, luxury, okushan, minato);
    renderListings(container, listingsRaw);
    renderSources(container);
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

  /* ============================================================
     Chart 1: The Bubble and Beyond — BIS Property Price Index
     ============================================================ */
  function renderBisChart(container, bis) {
    container.append("h3").attr("class", "section-title").style("margin-top", "1rem")
      .text("The Bubble and Beyond — 70 Years of Property Prices");
    container.append("p").attr("class", "section-subtitle")
      .html('<a href="https://fred.stlouisfed.org/series/QJPN628BIS" style="color:var(--accent-a)">BIS/FRED Residential Property Price Index</a>, quarterly 1955–2025 (2010 = 100)');

    // Stats
    const peak = bis.reduce((a, b) => b.index > a.index ? b : a);
    const latest = bis[bis.length - 1];
    const low = bis.reduce((a, b) => b.index < a.index ? b : a);

    const statRow = container.append("div").attr("class", "stat-row");
    [
      { label: "Bubble Peak (1990)", val: () => peak.index.toFixed(1) },
      { label: "Post-Crash Low", val: () => low.index.toFixed(1) + " (" + low.year + ")" },
      { label: "Current (" + latest.year + " Q" + latest.quarter + ")", val: () => latest.index.toFixed(1) },
      { label: "Recovery from Low", val: () => ((latest.index / low.index - 1) * 100).toFixed(0) + "%" },
    ].forEach(s => {
      const c = statRow.append("div").attr("class", "stat-card");
      c.append("div").attr("class", "stat-label").text(s.label);
      c.append("div").attr("class", "stat-value").text(s.val());
    });

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    // Annotations
    const annotations = [
      { year: 1964, q: 3, label: "1964 Olympics", align: "right" },
      { year: 1985, q: 3, label: "Plaza Accord", align: "left" },
      { year: 1990, q: 2, label: "Bubble Peak", align: "right" },
      { year: 1991, q: 1, label: "Crash begins", align: "left" },
      { year: 2008, q: 4, label: "GFC", align: "left" },
      { year: 2013, q: 1, label: "Abenomics", align: "right" },
      { year: 2020, q: 2, label: "COVID", align: "left" },
      { year: 2024, q: 1, label: "BOJ rate hike", align: "right" },
    ];

    function drawBis() {
      chartBox.selectAll("*").remove();
      const margin = { top: 30, right: 30, bottom: 30, left: 50 };
      const cw = Math.min(800, chartBox.node().getBoundingClientRect().width);
      const ch = Math.min(cw * 0.5, 400);
      const w = cw - margin.left - margin.right;
      const h = ch - margin.top - margin.bottom;

      const x = d3.scaleTime()
        .domain(d3.extent(bis, d => d.date))
        .range([0, w]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(bis, d => d.index) * 1.1])
        .range([h, 0]);

      const svg = chartBox.append("svg")
        .attr("viewBox", `0 0 ${cw} ${ch}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Axes
      g.append("g").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(10)).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text").style("font-size", "0.6rem");
      g.append("g").call(d3.axisLeft(y).ticks(6))
        .selectAll("text").style("font-size", "0.6rem");

      // Grid
      g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""))
        .selectAll("line").attr("stroke", "var(--border)").attr("stroke-opacity", 0.3);

      // Area fill
      const area = d3.area()
        .x(d => x(d.date)).y0(h).y1(d => y(d.index))
        .curve(d3.curveMonotoneX);
      g.append("path").datum(bis)
        .attr("d", area)
        .attr("fill", "#e8a04a").attr("fill-opacity", 0.15);

      // Line
      const line = d3.line().x(d => x(d.date)).y(d => y(d.index)).curve(d3.curveMonotoneX);
      g.append("path").datum(bis)
        .attr("d", line)
        .attr("fill", "none").attr("stroke", "#e8a04a").attr("stroke-width", 2);

      // 100 baseline
      g.append("line")
        .attr("x1", 0).attr("x2", w).attr("y1", y(100)).attr("y2", y(100))
        .attr("stroke", "var(--muted)").attr("stroke-dasharray", "4,3").attr("stroke-width", 0.5);
      g.append("text").attr("x", w + 3).attr("y", y(100)).attr("dy", "0.35em")
        .style("font-size", "0.5rem").style("fill", "var(--muted)").text("100 (2010)");

      // Annotations
      annotations.forEach(a => {
        const aDate = new Date(a.year, (a.q - 1) * 3, 1);
        const pt = bis.find(d => d.year === a.year && d.quarter === a.q);
        if (!pt) return;
        const ax = x(aDate);
        const ay = y(pt.index);
        g.append("line")
          .attr("x1", ax).attr("x2", ax).attr("y1", ay).attr("y2", ay - 20)
          .attr("stroke", "var(--muted)").attr("stroke-width", 0.8);
        g.append("text")
          .attr("x", ax).attr("y", ay - 23)
          .attr("text-anchor", a.align === "left" ? "end" : "start")
          .style("font-size", "0.5rem").style("fill", "var(--text)")
          .text(a.label);
      });

      // Hover overlay
      const bisect = d3.bisector(d => d.date).left;
      const focusLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-dasharray", "3,3").style("display", "none");
      const focusDot = g.append("circle").attr("r", 4).attr("fill", "#e8a04a").style("display", "none");

      g.append("rect").attr("width", w).attr("height", h).attr("fill", "none").attr("pointer-events", "all")
        .on("mousemove", function(event) {
          const [mx] = d3.pointer(event);
          const d0 = x.invert(mx);
          const i = bisect(bis, d0, 1);
          const d = bis[i - 1] && bis[i] ? (d0 - bis[i-1].date > bis[i].date - d0 ? bis[i] : bis[i-1]) : bis[i] || bis[i-1];
          if (!d) return;
          focusLine.style("display", null).attr("x1", x(d.date)).attr("x2", x(d.date)).attr("y1", 0).attr("y2", h);
          focusDot.style("display", null).attr("cx", x(d.date)).attr("cy", y(d.index));
          tip.show(`<div class="tooltip-title">${d.year} Q${d.quarter}</div>
            <div class="tooltip-row"><span class="label">Index</span><span>${d.index.toFixed(1)}</span></div>
            <div class="tooltip-row"><span class="label">vs Peak</span><span>${((d.index / peak.index - 1) * 100).toFixed(1)}%</span></div>`, event);
        })
        .on("mouseout", () => { focusLine.style("display", "none"); focusDot.style("display", "none"); tip.hide(); });
    }
    drawBis();
    // No currency callback needed — index values, not monetary
  }

  /* ============================================================
     Chart 2: Property Types Diverge — MLIT Monthly Index
     ============================================================ */
  function renderMlitChart(container, mlit) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Property Types Diverge — Condos vs Land");
    container.append("p").attr("class", "section-subtitle")
      .html('<a href="https://www.mlit.go.jp/totikensangyo/totikensangyo_tk5_000085.html" style="color:var(--accent-a)">MLIT 不動産価格指数</a>, monthly 2008–2025 (seasonally adjusted, 2010 = 100)');

    const series = [
      { key: "condo", label: "Condos (マンション)", color: "#c84a4a" },
      { key: "detached", label: "Detached Houses", color: "#4a9ec8" },
      { key: "land", label: "Residential Land", color: "#4ac87a" },
      { key: "composite", label: "Composite", color: "#e8a04a", dash: "6,3" },
    ];

    // Track visibility
    const visible = {};
    series.forEach(s => visible[s.key] = true);

    // Latest values for stat display
    const latest = mlit[mlit.length - 1];

    const statRow = container.append("div").attr("class", "stat-row");
    [
      { label: "Condos (Latest)", val: latest.condo.toFixed(1), color: "#c84a4a" },
      { label: "Detached (Latest)", val: latest.detached.toFixed(1), color: "#4a9ec8" },
      { label: "Land (Latest)", val: latest.land.toFixed(1), color: "#4ac87a" },
      { label: "Composite (Latest)", val: latest.composite.toFixed(1), color: "#e8a04a" },
    ].forEach(s => {
      const c = statRow.append("div").attr("class", "stat-card");
      c.append("div").attr("class", "stat-label").text(s.label);
      c.append("div").attr("class", "stat-value").style("color", s.color).text(s.val);
    });

    // Toggleable legend
    const legend = container.append("div").attr("class", "legend").style("margin-bottom", "0.5rem");
    series.forEach(s => {
      const item = legend.append("span").attr("class", "legend-item").style("cursor", "pointer")
        .on("click", () => {
          visible[s.key] = !visible[s.key];
          item.style("opacity", visible[s.key] ? 1 : 0.3);
          drawMlit();
        });
      item.append("span").attr("class", "legend-swatch")
        .style("background", s.color)
        .style("border", s.dash ? `2px dashed ${s.color}` : "none");
      item.append("span").text(s.label);
    });

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawMlit() {
      chartBox.selectAll("*").remove();
      const margin = { top: 20, right: 30, bottom: 30, left: 50 };
      const cw = Math.min(800, chartBox.node().getBoundingClientRect().width);
      const ch = Math.min(cw * 0.45, 380);
      const w = cw - margin.left - margin.right;
      const h = ch - margin.top - margin.bottom;

      const x = d3.scaleTime().domain(d3.extent(mlit, d => d.date)).range([0, w]);

      // Dynamic y-domain based on visible series
      let maxY = 100;
      series.forEach(s => {
        if (visible[s.key]) {
          const mx = d3.max(mlit, d => d[s.key]);
          if (mx > maxY) maxY = mx;
        }
      });
      const y = d3.scaleLinear().domain([0, maxY * 1.08]).range([h, 0]);

      const svg = chartBox.append("svg")
        .attr("viewBox", `0 0 ${cw} ${ch}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Axes
      g.append("g").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(2)).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text").style("font-size", "0.6rem");
      g.append("g").call(d3.axisLeft(y).ticks(6))
        .selectAll("text").style("font-size", "0.6rem");

      // Grid
      g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""))
        .selectAll("line").attr("stroke", "var(--border)").attr("stroke-opacity", 0.3);

      // 100 baseline
      g.append("line")
        .attr("x1", 0).attr("x2", w).attr("y1", y(100)).attr("y2", y(100))
        .attr("stroke", "var(--muted)").attr("stroke-dasharray", "4,3").attr("stroke-width", 0.5);

      // Lines
      series.forEach(s => {
        if (!visible[s.key]) return;
        const line = d3.line().x(d => x(d.date)).y(d => y(d[s.key])).curve(d3.curveMonotoneX);
        g.append("path").datum(mlit)
          .attr("d", line)
          .attr("fill", "none").attr("stroke", s.color).attr("stroke-width", 2)
          .attr("stroke-dasharray", s.dash || "none");

        // End label
        const last = mlit[mlit.length - 1];
        g.append("text")
          .attr("x", w + 4).attr("y", y(last[s.key]))
          .attr("dy", "0.35em").style("font-size", "0.5rem").style("fill", s.color)
          .text(last[s.key].toFixed(0));
      });

      // Hover
      const bisect = d3.bisector(d => d.date).left;
      const focusLine = g.append("line").attr("stroke", "var(--muted)").attr("stroke-dasharray", "3,3").style("display", "none");

      g.append("rect").attr("width", w).attr("height", h).attr("fill", "none").attr("pointer-events", "all")
        .on("mousemove", function(event) {
          const [mx] = d3.pointer(event);
          const d0 = x.invert(mx);
          const i = bisect(mlit, d0, 1);
          const d = mlit[i - 1] && mlit[i] ? (d0 - mlit[i-1].date > mlit[i].date - d0 ? mlit[i] : mlit[i-1]) : mlit[i] || mlit[i-1];
          if (!d) return;
          focusLine.style("display", null).attr("x1", x(d.date)).attr("x2", x(d.date)).attr("y1", 0).attr("y2", h);
          let rows = series.filter(s => visible[s.key]).map(s =>
            `<div class="tooltip-row"><span class="label" style="color:${s.color}">${s.label}</span><span>${d[s.key].toFixed(1)}</span></div>`
          ).join("");
          tip.show(`<div class="tooltip-title">${d.year}/${String(d.month).padStart(2, "0")}</div>${rows}`, event);
        })
        .on("mouseout", () => { focusLine.style("display", "none"); tip.hide(); });
    }
    drawMlit();
  }

  /* ============================================================
     Chart 3: Land Prices by Prefecture — Choropleth
     ============================================================ */
  function renderLandPriceMap(container, landPrices, basePath) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Official Land Prices by Prefecture (公示地価)");
    container.append("p").attr("class", "section-subtitle")
      .html('Residential land assessed value per m², <a href="https://www.mlit.go.jp/totikensangyo/totikensangyo_tk5_000081.html" style="color:var(--accent-a)">MLIT 2026</a> — hover for 1990 bubble-peak comparison');

    const layout = container.append("div").attr("class", "map-layout");
    const mapCol = layout.append("div");
    const chartBox = mapCol.append("div").attr("class", "chart-container");
    const { width } = getChartDimensions(chartBox.node(), 0.8);
    const height = Math.min(width * 0.9, window.innerHeight * 0.6);

    const svg = chartBox.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");
    const mapG = svg.append("g");
    const tip = createTooltip();

    // Build lookup by prefecture name
    const lookup = {};
    landPrices.forEach(d => { lookup[d.name] = d; });

    // Name from PREF_NAMES code -> English name
    const codeToName = {};
    Object.entries(PREF_NAMES).forEach(([code, names]) => { codeToName[code] = names[0]; });

    const vals2026 = landPrices.map(d => d.y2026).filter(v => v > 0);
    const color = d3.scaleSequentialLog(d3.interpolateYlOrRd)
      .domain([d3.min(vals2026), d3.max(vals2026)]);

    d3.json(basePath + "data/geo/japan_prefecture.topojson").then(topo => {
      const geojson = topojson.feature(topo, topo.objects.japan);
      const projection = d3.geoMercator().center([137, 36]).fitSize([width, height], geojson);
      const path = d3.geoPath(projection);

      function prefCode(d) { return String(d.properties.id).padStart(2, "0"); }

      mapG.selectAll("path").data(geojson.features).join("path")
        .attr("d", path)
        .attr("fill", d => {
          const code = prefCode(d);
          const name = codeToName[code];
          const pd = name ? lookup[name] : null;
          return pd && pd.y2026 > 0 ? color(pd.y2026) : "#333";
        })
        .attr("stroke", "#252b38").attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke", "var(--accent-a)").attr("stroke-width", 1.5).raise();
          const code = prefCode(d);
          const names = PREF_NAMES[code];
          const engName = codeToName[code];
          const pd = engName ? lookup[engName] : null;
          if (!pd || !names) return;
          const fromPeak = pd.y1990 > 0 ? ((pd.y2026 / pd.y1990 - 1) * 100).toFixed(1) : "N/A";
          tip.show(`<div class="tooltip-title">${names[0]} ${names[1]}</div>
            <div class="tooltip-row"><span class="label">2026 price/m²</span><span>${fmtPrice(pd.y2026)}</span></div>
            <div class="tooltip-row"><span class="label">1990 peak</span><span>${fmtPrice(pd.y1990)}</span></div>
            <div class="tooltip-row"><span class="label">Change from peak</span><span>${fromPeak}%</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("stroke", "#252b38").attr("stroke-width", 0.5); tip.hide(); });

      svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[0,0],[width,height]])
        .on("zoom", e => mapG.attr("transform", e.transform)));

      // Legend
      const legendW = Math.min(200, width * 0.4);
      const legendH = 12;
      const legendG = svg.append("g").attr("transform", `translate(${width - legendW - 10}, ${height - 35})`);
      const defs = svg.append("defs");
      const grad = defs.append("linearGradient").attr("id", "land-legend-grad");
      const stops = d3.range(0, 1.01, 0.1);
      const [cMin, cMax] = [d3.min(vals2026), d3.max(vals2026)];
      stops.forEach(t => {
        const v = cMin * Math.pow(cMax / cMin, t);
        grad.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(v));
      });
      legendG.append("rect").attr("width", legendW).attr("height", legendH).attr("fill", "url(#land-legend-grad)").attr("rx", 2);
      legendG.append("text").attr("y", legendH + 12).attr("x", 0).style("font-size", "0.5rem").style("fill", "var(--text)").text(fmtPriceShort(cMin) + "/m²");
      legendG.append("text").attr("y", legendH + 12).attr("x", legendW).attr("text-anchor", "end").style("font-size", "0.5rem").style("fill", "var(--text)").text(fmtPriceShort(cMax) + "/m²");
    });

    // Sidebar: top 10 / bottom 10
    const sidebar = layout.append("div").attr("class", "sidebar");
    const sorted = [...landPrices].sort((a, b) => b.y2026 - a.y2026);

    function drawSidebar() {
      sidebar.selectAll("*").remove();
      sidebar.append("h3").text("Most Expensive");
      sorted.slice(0, 10).forEach(d => {
        sidebar.append("div").attr("class", "sidebar-item")
          .html(`<span>${d.name}</span><span class="density">${fmtPrice(d.y2026)}/m²</span>`);
      });
      sidebar.append("div").style("height", "1.5rem");
      sidebar.append("h3").text("Most Affordable");
      sorted.slice(-10).reverse().forEach(d => {
        sidebar.append("div").attr("class", "sidebar-item")
          .html(`<span>${d.name}</span><span class="density">${fmtPrice(d.y2026)}/m²</span>`);
      });
    }
    drawSidebar();
    updateCallbacks.push(drawSidebar);
  }

  /* ============================================================
     Chart 4: Rents by Prefecture — Horizontal bar chart
     ============================================================ */
  function renderRentChart(container, rent) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Average Monthly Rent by Prefecture (2023)");
    container.append("p").attr("class", "section-subtitle")
      .html('Census average across <em>all</em> rental tenancies — blue above national average, red below');
    container.append("div").attr("class", "data-note").style("margin-bottom", "1rem")
      .html(`<strong>What this measures:</strong> Average contract rent across all occupied rental dwellings per the <a href="https://www.stat.go.jp/data/jyutaku/2023/tyousake.html" style="color:var(--accent-a)">2023 Housing and Land Survey (住宅・土地統計調査)</a>. This includes public housing (avg ¥25k/mo), employer-provided housing (avg ¥38k/mo), and decades-old tenancies at below-market rates. Market asking rents for new leases are significantly higher — see the Tokyo ward breakdown below for current listing-based data.`);

    const natAvg = 59656;
    const sorted = [...rent].sort((a, b) => b.rent - a.rent);

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawRent() {
      chartBox.selectAll("*").remove();
      const margin = { top: 20, right: 80, bottom: 10, left: 110 };
      const barH = 16;
      const chartW = Math.min(750, chartBox.node().getBoundingClientRect().width);
      const chartH = sorted.length * (barH + 2) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const x = d3.scaleLinear().domain([0, d3.max(sorted, d => convert(d.rent)) * 1.05]).range([0, w]);
      const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, chartH - margin.top - margin.bottom]).padding(0.1);

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // National average line
      const natX = x(convert(natAvg));
      g.append("line").attr("x1", natX).attr("x2", natX).attr("y1", 0).attr("y2", chartH - margin.top - margin.bottom)
        .attr("stroke", "var(--accent-a)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");
      g.append("text").attr("x", natX + 3).attr("y", -5).attr("class", "chart-label").style("font-size", "0.55rem").style("fill", "var(--accent-a)")
        .text("National avg: " + fmtRent(natAvg) + "/mo");

      g.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y(d.name)).attr("width", d => x(convert(d.rent))).attr("height", y.bandwidth())
        .attr("fill", d => d.rent >= natAvg ? "#4a9ec8" : "#c84a4a").attr("opacity", 0.7).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          const vsAvg = ((d.rent / natAvg - 1) * 100).toFixed(1);
          tip.show(`<div class="tooltip-title">${d.name}</div>
            <div class="tooltip-row"><span class="label">Monthly rent</span><span>${fmtRent(d.rent)}</span></div>
            <div class="tooltip-row"><span class="label">vs National avg</span><span>${vsAvg > 0 ? "+" : ""}${vsAvg}%</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.7); tip.hide(); });

      g.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -4).attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.55rem").text(d => d.name);

      g.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x(convert(d.rent)) + 3)
        .attr("y", d => y(d.name) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtRent(d.rent));
    }
    drawRent();
    updateCallbacks.push(drawRent);
  }

  /* ============================================================
     Chart 5: The Akiya Crisis — Vacancy + Homeownership scatter
     ============================================================ */
  function renderAkiyaChart(container, housing) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("The Akiya (空き家) Crisis — 9 Million Empty Houses");
    container.append("p").attr("class", "section-subtitle")
      .html('Vacancy rate vs homeownership rate by prefecture — <a href="https://www.stat.go.jp/data/jyutaku/2023/tyousake.html" style="color:var(--accent-a)">2023 Housing and Land Survey (住宅・土地統計調査)</a>');

    // Stats
    const statRow = container.append("div").attr("class", "stat-row");
    const natVacancy = 13.8;
    [
      { label: "National Vacancy Rate", val: "13.8%" },
      { label: "Empty Houses (est.)", val: "~9 million" },
      { label: "Highest Vacancy", val: () => { const d = housing.reduce((a, b) => b.vacancy > a.vacancy ? b : a); return d.name + " (" + d.vacancy + "%)"; } },
      { label: "Lowest Vacancy", val: () => { const d = housing.reduce((a, b) => b.vacancy < a.vacancy ? b : a); return d.name + " (" + d.vacancy + "%)"; } },
    ].forEach(s => {
      const c = statRow.append("div").attr("class", "stat-card");
      c.append("div").attr("class", "stat-label").text(s.label);
      c.append("div").attr("class", "stat-value").text(typeof s.val === "function" ? s.val() : s.val);
    });

    // Legend
    const legend = container.append("div").attr("class", "legend").style("margin-bottom", "0.5rem");
    Object.entries(REGION_COLORS).forEach(([region, color]) => {
      const item = legend.append("span").attr("class", "legend-item");
      item.append("span").attr("class", "legend-swatch").style("background", color);
      item.append("span").text(region);
    });

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawScatter() {
      chartBox.selectAll("*").remove();
      const margin = { top: 20, right: 30, bottom: 45, left: 55 };
      const cw = Math.min(700, chartBox.node().getBoundingClientRect().width);
      const ch = Math.min(cw * 0.7, 500);
      const w = cw - margin.left - margin.right;
      const h = ch - margin.top - margin.bottom;

      const x = d3.scaleLinear()
        .domain([d3.min(housing, d => d.ownership) - 3, d3.max(housing, d => d.ownership) + 3])
        .range([0, w]);
      const y = d3.scaleLinear()
        .domain([d3.min(housing, d => d.vacancy) - 2, d3.max(housing, d => d.vacancy) + 2])
        .range([h, 0]);

      const svg = chartBox.append("svg")
        .attr("viewBox", `0 0 ${cw} ${ch}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Axes
      g.append("g").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(8).tickFormat(d => d + "%"))
        .selectAll("text").style("font-size", "0.6rem");
      g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"))
        .selectAll("text").style("font-size", "0.6rem");

      // Grid
      g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""))
        .selectAll("line").attr("stroke", "var(--border)").attr("stroke-opacity", 0.2);
      g.append("g").attr("class", "grid")
        .call(d3.axisBottom(x).ticks(8).tickSize(-h).tickFormat("")).attr("transform", `translate(0,${h})`)
        .selectAll("line").attr("stroke", "var(--border)").attr("stroke-opacity", 0.2);

      // Axis labels
      svg.append("text")
        .attr("x", margin.left + w / 2).attr("y", ch - 5)
        .attr("text-anchor", "middle").style("font-size", "0.65rem").style("fill", "var(--text)")
        .text("Homeownership Rate (%)");
      svg.append("text")
        .attr("transform", `rotate(-90)`).attr("x", -(margin.top + h / 2)).attr("y", 14)
        .attr("text-anchor", "middle").style("font-size", "0.65rem").style("fill", "var(--text)")
        .text("Vacancy Rate (%)");

      // National vacancy line
      g.append("line")
        .attr("x1", 0).attr("x2", w).attr("y1", y(natVacancy)).attr("y2", y(natVacancy))
        .attr("stroke", "#e8a04a").attr("stroke-dasharray", "5,3").attr("stroke-width", 1);
      g.append("text")
        .attr("x", w).attr("y", y(natVacancy) - 5).attr("text-anchor", "end")
        .style("font-size", "0.5rem").style("fill", "#e8a04a")
        .text("13.8% national avg");

      // Trend line (simple regression)
      const n = housing.length;
      const sumX = d3.sum(housing, d => d.ownership);
      const sumY = d3.sum(housing, d => d.vacancy);
      const sumXY = d3.sum(housing, d => d.ownership * d.vacancy);
      const sumX2 = d3.sum(housing, d => d.ownership * d.ownership);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      const xDom = x.domain();
      g.append("line")
        .attr("x1", x(xDom[0])).attr("y1", y(slope * xDom[0] + intercept))
        .attr("x2", x(xDom[1])).attr("y2", y(slope * xDom[1] + intercept))
        .attr("stroke", "var(--muted)").attr("stroke-width", 0.8).attr("stroke-dasharray", "3,3").attr("opacity", 0.5);

      // Dots
      g.selectAll("circle").data(housing).join("circle")
        .attr("cx", d => x(d.ownership)).attr("cy", d => y(d.vacancy))
        .attr("r", 5)
        .attr("fill", d => REGION_COLORS[REGION_MAP[d.name]] || "#888")
        .attr("stroke", "#1a1e27").attr("stroke-width", 0.5)
        .attr("opacity", 0.85)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("r", 8).attr("opacity", 1).attr("stroke-width", 1.5);
          tip.show(`<div class="tooltip-title">${d.name}</div>
            <div class="tooltip-row"><span class="label">Vacancy rate</span><span>${d.vacancy}%</span></div>
            <div class="tooltip-row"><span class="label">Homeownership</span><span>${d.ownership}%</span></div>
            <div class="tooltip-row"><span class="label">Region</span><span>${REGION_MAP[d.name] || "—"}</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("r", 5).attr("opacity", 0.85).attr("stroke-width", 0.5); tip.hide(); });

      // Annotation box
      g.append("text")
        .attr("x", w - 5).attr("y", 15)
        .attr("text-anchor", "end").style("font-size", "0.6rem").style("fill", "var(--accent-a)")
        .style("font-weight", "500")
        .text("13.8% vacancy = ~9M empty houses");
      g.append("text")
        .attr("x", w - 5).attr("y", 30)
        .attr("text-anchor", "end").style("font-size", "0.5rem").style("fill", "var(--muted)")
        .text("Higher ownership + higher vacancy = rural depopulation");
    }
    drawScatter();
  }

  /* ============================================================
     Chart 6: Tokyo 23 Wards Deep Dive
     ============================================================ */
  function renderWardChart(container, wards) {
    container.append("h3").attr("class", "section-title").style("margin-top", "2.5rem")
      .text("Tokyo 23 Wards — Land Prices, Rents & Condos");
    container.append("p").attr("class", "section-subtitle")
      .html('Ward-level data from official land price surveys and market listing platforms');
    container.append("div").attr("class", "data-note").style("margin-bottom", "1rem")
      .html(`<strong>Sources:</strong> Land prices from <a href="https://www.mlit.go.jp/totikensangyo/totikensangyo_tk5_000081.html" style="color:var(--accent-a)">MLIT 公示地価 2026</a> (official assessed values, not transaction prices). Resale condo prices from <a href="https://www.homes.co.jp/mansion/chuko/tokyo/23ku-mcity/city/price/" style="color:var(--accent-a)">LIFULL HOME&apos;S</a> (April 2026 listings, 70m² equivalent). Rents from <a href="https://suumo.jp/chintai/soba/tokyo/" style="color:var(--accent-a)">SUUMO</a> market asking rents (April 2026) — these are listing prices, not contracted rents, and skew above census averages.`);

    const sorted = [...wards].sort((a, b) => b.residentialPrice - a.residentialPrice);

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    // Color gradient
    const priceMin = d3.min(sorted, d => d.residentialPrice);
    const priceMax = d3.max(sorted, d => d.residentialPrice);
    const wardColor = d3.scaleLinear()
      .domain([priceMin, (priceMin + priceMax) / 2, priceMax])
      .range(["#4a9ec8", "#e8a04a", "#c84a4a"]);

    function drawWardBars() {
      chartBox.selectAll("*").remove();
      const margin = { top: 5, right: 95, bottom: 10, left: 120 };
      const barH = 22;
      const chartW = Math.min(800, chartBox.node().getBoundingClientRect().width);
      const chartH = sorted.length * (barH + 3) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const x = d3.scaleLinear().domain([0, d3.max(sorted, d => convert(d.residentialPrice)) * 1.05]).range([0, w]);
      const y = d3.scaleBand().domain(sorted.map(d => d.en)).range([0, chartH - margin.top - margin.bottom]).padding(0.12);

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y(d.en)).attr("width", d => x(convert(d.residentialPrice))).attr("height", y.bandwidth())
        .attr("fill", d => wardColor(d.residentialPrice)).attr("opacity", 0.8).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          tip.show(`<div class="tooltip-title">${d.en} (${d.ja})</div>
            <div class="tooltip-row"><span class="label">Residential</span><span>${fmtPrice(d.residentialPrice)}/m²</span></div>
            <div class="tooltip-row"><span class="label">Commercial</span><span>${fmtPrice(d.commercialPrice)}/m²</span></div>
            <div class="tooltip-row"><span class="label">YoY change</span><span>+${d.yoy.toFixed(1)}%</span></div>
            <div class="tooltip-row"><span class="label">Resale condo (70m²)</span><span>${fmtMoney(d.condoPrice * 1e6)}</span></div>
            <div class="tooltip-row"><span class="label">Rent 1R-1DK</span><span>${fmtRent(d.rent1R * 10000)}/mo</span></div>
            <div class="tooltip-row"><span class="label">Rent 2LDK-3DK</span><span>${fmtRent(d.rent2LDK * 10000)}/mo</span></div>
            <div class="tooltip-row"><span class="label">Rent 3LDK+</span><span>${fmtRent(d.rent3LDK * 10000)}/mo</span></div>`, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.8); tip.hide(); });

      g.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -4).attr("y", d => y(d.en) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.6rem")
        .text(d => d.en);

      g.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x(convert(d.residentialPrice)) + 4)
        .attr("y", d => y(d.en) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtPriceShort(d.residentialPrice) + "/m²");
    }
    drawWardBars();
    updateCallbacks.push(drawWardBars);

    // Ward summary stat cards
    const wardStats = container.append("div").attr("class", "stat-row").style("margin-top", "1.5rem");
    function drawWardStats() {
      wardStats.selectAll("*").remove();
      const cheapest = sorted[sorted.length - 1];
      const priciest = sorted[0];
      [{label: "Priciest ward (residential)", val: priciest.en + ": " + fmtPrice(priciest.residentialPrice) + "/m²"},
       {label: "Cheapest ward", val: cheapest.en + ": " + fmtPrice(cheapest.residentialPrice) + "/m²"},
       {label: "Price gap", val: (priciest.residentialPrice / cheapest.residentialPrice).toFixed(1) + "× range"},
       {label: "Avg 1R rent range", val: fmtRent(sorted[sorted.length-1].rent1R * 10000) + " – " + fmtRent(sorted[0].rent1R * 10000) + "/mo"},
      ].forEach(s => {
        const c = wardStats.append("div").attr("class", "stat-card");
        c.append("div").attr("class", "stat-label").text(s.label);
        c.append("div").attr("class", "stat-value").style("font-size", "1.2rem").text(s.val);
      });
    }
    drawWardStats();
    updateCallbacks.push(drawWardStats);

    // Small multiples: rent by room type
    container.append("h4").attr("class", "section-subtitle").style("margin-top", "1.5rem").style("font-weight", "500")
      .html('Market Asking Rents by Ward & Room Type — <a href="https://suumo.jp/chintai/soba/tokyo/" style="color:var(--accent-a)">SUUMO</a> listing data, April 2026');

    const rentGrid = container.append("div")
      .style("display", "grid")
      .style("grid-template-columns", "repeat(auto-fill, minmax(160px, 1fr))")
      .style("gap", "0.75rem").style("margin-top", "0.75rem");

    const rentTypes = [
      { key: "rent1R", label: "1R / 1K / 1DK" },
      { key: "rent1LDK", label: "1LDK / 2K / 2DK" },
      { key: "rent2LDK", label: "2LDK / 3K / 3DK" },
      { key: "rent3LDK", label: "3LDK / 4K+" },
    ];

    function drawRentGrid() {
      rentGrid.selectAll("*").remove();

      rentTypes.forEach(rt => {
        const card = rentGrid.append("div")
          .style("background", "var(--surface)").style("border", "1px solid var(--border)")
          .style("border-radius", "0.5rem").style("padding", "0.75rem");

        card.append("div").style("font-size", "0.7rem").style("font-weight", "500")
          .style("margin-bottom", "0.5rem").style("color", "var(--text)").text(rt.label);

        const wardsSorted = [...wards].sort((a, b) => b[rt.key] - a[rt.key]);
        const maxRent = d3.max(wardsSorted, d => convert(d[rt.key] * 10000));
        const miniW = 100;

        wardsSorted.forEach(d => {
          const row = card.append("div")
            .style("display", "flex").style("align-items", "center").style("gap", "0.25rem")
            .style("margin-bottom", "2px").style("font-size", "0.5rem").style("color", "var(--text)");

          row.append("span").style("width", "55px").style("flex-shrink", "0")
            .style("text-align", "right").style("overflow", "hidden").style("white-space", "nowrap")
            .text(d.en);

          const barW = (convert(d[rt.key] * 10000) / maxRent) * miniW;
          row.append("div")
            .style("width", barW + "px").style("height", "6px")
            .style("background", wardColor(d.residentialPrice)).style("border-radius", "2px")
            .style("flex-shrink", "0");

          row.append("span").style("color", "var(--muted)")
            .text(FX.currency === "JPY" ? d[rt.key].toFixed(1) + "万" : fmtRent(d[rt.key] * 10000));
        });
      });
    }
    drawRentGrid();
    updateCallbacks.push(drawRentGrid);
  }

  /* ============================================================
     Chart 7: The Luxury Segment — A World of Its Own
     ============================================================ */
  function renderLuxurySection(container, luxury, okushan, minato) {
    container.append("div").style("border-top", "2px solid var(--accent-c)").style("margin-top", "3rem").style("padding-top", "2rem");

    container.append("h3").attr("class", "section-title")
      .text("The Luxury Segment — A World of Its Own");
    container.append("p").attr("class", "section-subtitle")
      .html('Why averages are misleading: the 億ション (oku-shon) phenomenon and intra-ward price chasms');

    container.append("div").attr("class", "data-note").style("margin-bottom", "1.5rem")
      .html(`<strong>The gap between average and luxury is not a gradient — it's a cliff.</strong> A "typical" new condo in Tokyo's 23 wards averages ¥1.7M/m². Branded luxury (Park Court, Mita Garden Hills) starts at ¥3-5M/m². Trophy penthouses (Aman Residences, Marq Omotesando) reach ¥13-15M/m² — an <strong>8-9× multiplier</strong> over the average. Within a single ward like Minato-ku, land prices range 45× from cheapest to priciest survey point.`);

    // --- 7A: The Price Ladder ---
    container.append("h4").attr("class", "section-subtitle").style("margin-top", "1.5rem").style("font-weight", "500")
      .html('Price per m² — From Average to Trophy');

    const ladderBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    function drawLadder() {
      ladderBox.selectAll("*").remove();
      const sorted = [...luxury].sort((a, b) => a.sqm - b.sqm);
      const margin = { top: 5, right: 100, bottom: 10, left: 200 };
      const barH = 28;
      const chartW = Math.min(800, ladderBox.node().getBoundingClientRect().width);
      const chartH = sorted.length * (barH + 4) + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const x = d3.scaleLog().domain([d3.min(sorted, d => d.sqm) * 0.8, d3.max(sorted, d => d.sqm) * 1.1]).range([0, w]).clamp(true);
      const y = d3.scaleBand().domain(sorted.map(d => d.name)).range([0, chartH - margin.top - margin.bottom]).padding(0.15);

      const catColors = { "23ward_avg_new": "#4a5568", "23ward_avg_resale": "#6b7280", "cbd6_avg_new": "#4a9ec8", branded_luxury: "#e8a04a", ultra_luxury: "#c84a4a", trophy_penthouse: "#9b4ac8" };

      const svg = ladderBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y(d.name)).attr("width", d => x(d.sqm)).attr("height", y.bandwidth())
        .attr("fill", d => catColors[d.category] || "#e8a04a").attr("opacity", 0.8).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          let html = `<div class="tooltip-title">${d.name}</div>`;
          html += `<div class="tooltip-row"><span class="label">Price/m²</span><span>${fmtPrice(d.sqm)}</span></div>`;
          if (d.total) html += `<div class="tooltip-row"><span class="label">Total price</span><span>${fmtMoney(d.total)}</span></div>`;
          const avg = luxury.find(l => l.category === "23ward_avg_new");
          if (avg) html += `<div class="tooltip-row"><span class="label">vs 23-ward avg</span><span>${(d.sqm / avg.sqm).toFixed(1)}×</span></div>`;
          html += `<div class="tooltip-row"><span class="label">${d.notes}</span><span>${d.year}</span></div>`;
          tip.show(html, event);
        })
        .on("mousemove", e => tip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.8); tip.hide(); });

      g.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -6).attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.55rem").text(d => d.name);

      g.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x(d.sqm) + 4)
        .attr("y", d => y(d.name) + y.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtPrice(d.sqm) + "/m²");

      // Category legend
      const leg = ladderBox.append("div").attr("class", "legend");
      [{ c: "#4a5568", l: "23-ward average" }, { c: "#4a9ec8", l: "CBD 6-ward avg" }, { c: "#e8a04a", l: "Branded luxury" }, { c: "#c84a4a", l: "Ultra-luxury" }, { c: "#9b4ac8", l: "Trophy penthouse" }].forEach(d => {
        const it = leg.append("div").attr("class", "legend-item");
        it.append("div").attr("class", "legend-swatch").style("background", d.c);
        it.append("span").text(d.l);
      });
    }
    drawLadder();
    updateCallbacks.push(drawLadder);

    // --- 7B: Oku-shon Trend ---
    container.append("h4").attr("class", "section-subtitle").style("margin-top", "2rem").style("font-weight", "500")
      .html('The 億ション (Oku-shon) Explosion — Condos Over ¥100M');

    const statRow = container.append("div").attr("class", "stat-row");
    [{label: "2025 oku-shon sales", val: "5,947 units"}, {label: "Share of 23-ward new condos (2024)", val: "39%"}, {label: "Growth 2013→2025", val: "3.5×"}].forEach(s => {
      const c = statRow.append("div").attr("class", "stat-card");
      c.append("div").attr("class", "stat-label").text(s.label);
      c.append("div").attr("class", "stat-value").style("font-size", "1.3rem").text(s.val);
    });

    const okuBox = container.append("div").attr("class", "chart-container");
    const dims = getChartDimensions(okuBox.node(), 0.4);
    const margin = { top: 20, right: 30, bottom: 35, left: 55 };
    const w = dims.width - margin.left - margin.right;
    const h = dims.height - margin.top - margin.bottom;

    const svg = okuBox.append("svg").attr("viewBox", `0 0 ${dims.width} ${dims.height}`).attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(okushan, d => d.year)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(okushan, d => d.units) * 1.1]).range([h, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000).toFixed(1) + "k" : d));

    const area = d3.area().x(d => x(d.year)).y0(h).y1(d => y(d.units)).curve(d3.curveMonotoneX);
    g.append("path").datum(okushan).attr("d", area).attr("fill", "#9b4ac8").attr("opacity", 0.2);
    const line = d3.line().x(d => x(d.year)).y(d => y(d.units)).curve(d3.curveMonotoneX);
    g.append("path").datum(okushan).attr("d", line).attr("fill", "none").attr("stroke", "#9b4ac8").attr("stroke-width", 2.5);

    // Dots
    g.selectAll("circle").data(okushan).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.units)).attr("r", 3)
      .attr("fill", "#9b4ac8").attr("stroke", "var(--bg)").attr("stroke-width", 1);

    // COVID annotation
    const covidX = x(2020);
    g.append("line").attr("class", "annotation-line").attr("x1", covidX).attr("x2", covidX).attr("y1", 0).attr("y2", h);
    g.append("text").attr("class", "annotation-label").attr("x", covidX + 4).attr("y", 12).text("COVID");

    const okuTip = createTooltip();
    svg.append("rect").attr("transform", `translate(${margin.left},${margin.top})`).attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event, this);
        const yr = Math.round(x.invert(mx));
        const d = okushan.find(r => r.year === yr);
        if (!d) return;
        okuTip.show(`<div class="tooltip-title">${d.year}</div>
          <div class="tooltip-row"><span class="label">Units sold (Greater Tokyo)</span><span>${fmt.num(d.units)}</span></div>
          ${d.share ? `<div class="tooltip-row"><span class="label">% of 23-ward new</span><span>${d.share}%</span></div>` : ''}`, event);
      })
      .on("mouseleave", () => okuTip.hide());

    okuBox.append("p").attr("class", "source-attr")
      .html('Source: <a href="https://www.fudousankeizai.co.jp/" style="color:var(--accent-a)">不動産経済研究所</a>; <a href="https://lifull.com/news/42239/" style="color:var(--accent-a)">LIFULL HOME\'S oku-shon analysis</a>');

    // --- 7C: Minato-ku Micro-Area Price Map ---
    container.append("h4").attr("class", "section-subtitle").style("margin-top", "2rem").style("font-weight", "500")
      .html('Inside Minato-ku — A 34× Spread Within One Ward');

    container.append("div").attr("class", "data-note").style("margin-bottom", "1rem")
      .html(`The ward average of ¥5.5M/m² hides a range from <strong>¥900K/m²</strong> (Odaiba waterfront) to <strong>¥30.6M/m²</strong> (Kita-Aoyama, steps from Omotesando). Even excluding commercial zones, residential land ranges 4.7× within the ward. Source: <a href="https://tochidai.info/tokyo/minato/" style="color:var(--accent-a)">tochidai.info / MLIT 公示地価 2026</a>`);

    const minatoBox = container.append("div").attr("class", "chart-container");
    const minatoTip = createTooltip();

    function drawMinato() {
      minatoBox.selectAll("*").remove();
      const sorted = [...minato].sort((a, b) => b.price - a.price);
      const margin2 = { top: 5, right: 90, bottom: 10, left: 130 };
      const barH2 = 20;
      const chartW2 = Math.min(750, minatoBox.node().getBoundingClientRect().width);
      const chartH2 = sorted.length * (barH2 + 3) + margin2.top + margin2.bottom;
      const w2 = chartW2 - margin2.left - margin2.right;

      const x2 = d3.scaleLog().domain([d3.min(sorted, d => d.price) * 0.8, d3.max(sorted, d => d.price) * 1.1]).range([0, w2]).clamp(true);
      const y2 = d3.scaleBand().domain(sorted.map(d => d.en)).range([0, chartH2 - margin2.top - margin2.bottom]).padding(0.12);

      const typeColor = { commercial: "#c84a4a", mixed: "#e8a04a", residential: "#4a9ec8", waterfront: "#4ac87a" };

      const svg2 = minatoBox.append("svg").attr("viewBox", `0 0 ${chartW2} ${chartH2}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g2 = svg2.append("g").attr("transform", `translate(${margin2.left},${margin2.top})`);

      g2.selectAll("rect").data(sorted).join("rect")
        .attr("x", 0).attr("y", d => y2(d.en)).attr("width", d => x2(d.price)).attr("height", y2.bandwidth())
        .attr("fill", d => typeColor[d.type] || "#e8a04a").attr("opacity", 0.75).attr("rx", 2)
        .on("mouseover", function(event, d) {
          d3.select(this).attr("opacity", 1);
          minatoTip.show(`<div class="tooltip-title">${d.en} (${d.jp})</div>
            <div class="tooltip-row"><span class="label">Avg price/m²</span><span>${fmtPrice(d.price)}</span></div>
            <div class="tooltip-row"><span class="label">YoY change</span><span>+${d.yoy.toFixed(1)}%</span></div>
            <div class="tooltip-row"><span class="label">Zone type</span><span>${d.type}</span></div>
            <div class="tooltip-row"><span class="label">vs Odaiba</span><span>${(d.price / 900000).toFixed(1)}×</span></div>`, event);
        })
        .on("mousemove", e => minatoTip.move(e))
        .on("mouseout", function() { d3.select(this).attr("opacity", 0.75); minatoTip.hide(); });

      g2.selectAll(".bar-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", -6).attr("y", d => y2(d.en) + y2.bandwidth() / 2)
        .attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "0.55rem").text(d => d.en);

      g2.selectAll(".val-label").data(sorted).join("text")
        .attr("class", "chart-label").attr("x", d => x2(d.price) + 4)
        .attr("y", d => y2(d.en) + y2.bandwidth() / 2).attr("dy", "0.35em")
        .attr("text-anchor", "start").style("font-size", "0.5rem").style("fill", "var(--text)")
        .text(d => fmtPriceShort(d.price) + "/m²");

      // Legend
      const leg = minatoBox.append("div").attr("class", "legend");
      [{ c: "#c84a4a", l: "Commercial" }, { c: "#e8a04a", l: "Mixed-use" }, { c: "#4a9ec8", l: "Residential" }, { c: "#4ac87a", l: "Waterfront" }].forEach(d => {
        const it = leg.append("div").attr("class", "legend-item");
        it.append("div").attr("class", "legend-swatch").style("background", d.c);
        it.append("span").text(d.l);
      });
    }
    drawMinato();
    updateCallbacks.push(drawMinato);

    // Foreign buyer note
    container.append("div").attr("class", "callout").style("margin-top", "1.5rem")
      .html(`<div class="big-stat">20-40%</div>
        <div class="context">Share of premium ward (Chiyoda, Minato, Shibuya) new condo sales going to foreign buyers — primarily from Greater China, Singapore, and Hong Kong. The weak yen (¥150+/USD) has made Tokyo luxury a perceived bargain vs. Hong Kong, Singapore, and New York.</div>
        <div class="context" style="margin-top:0.5rem;font-size:0.65rem;font-style:italic">Sources: <a href="https://www.japantimes.co.jp/news/2025/11/26/japan/foreign-condo-buyers-survey/" style="color:var(--accent-a)">Japan Times / Mitsubishi UFJ Trust survey</a></div>`);
  }

  /* ============================================================
     Chart 8: Real Listings — What You Actually Get
     ============================================================ */
  function renderListings(container, raw) {
    container.append("div").style("border-top", "2px solid var(--accent-b)").style("margin-top", "3rem").style("padding-top", "2rem");

    container.append("h3").attr("class", "section-title")
      .text("What Does Your Money Buy? — Real Listings");
    container.append("p").attr("class", "section-subtitle")
      .html('Actual properties on the market or government-assessed values, scraped from <a href="https://www.realestate.co.jp/en/forsale/" style="color:var(--accent-a)">Real Estate Japan</a> and <a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-v3_1.html" style="color:var(--accent-a)">MLIT 公示地価 L01</a>');

    container.append("div").attr("class", "data-note").style("margin-bottom", "1rem")
      .html(`<strong>This is a living database.</strong> New listings are appended over time to build a concrete picture of what properties actually cost — not just averages. Asking prices may differ from transaction prices by 5-10%. Government-assessed values (公示地価) are land-only; actual property prices depend on the building. Data as of April 2026.`);

    const listings = raw.filter(d => d.price_jpy && +d.price_jpy > 0).map(d => ({
      id: d.id,
      source: d.source,
      url: d.source_url,
      type: d.listing_type,
      propType: d.property_type,
      ward: d.ward_or_city,
      neighborhood: d.neighborhood,
      station: d.nearest_station,
      walk: d.walk_min ? +d.walk_min : null,
      price: +d.price_jpy,
      size: d.size_sqm ? +d.size_sqm : null,
      land: d.land_sqm ? +d.land_sqm : null,
      plan: d.floor_plan,
      floor: d.floor,
      totalFloors: d.total_floors,
      year: d.building_year ? +d.building_year : null,
      structure: d.structure,
      perSqm: d.price_per_sqm ? +d.price_per_sqm : (d.size_sqm && +d.size_sqm > 0 ? +d.price_jpy / +d.size_sqm : null),
      building: d.building_name,
      notes: d.notes,
    })).sort((a, b) => a.price - b.price);

    const tip = createTooltip();

    // Dot plot: price on log X axis, each listing is a dot, colored by property type
    const chartBox = container.append("div").attr("class", "chart-container");

    function drawListings() {
      chartBox.selectAll("*").remove();

      const margin = { top: 30, right: 30, bottom: 40, left: 30 };
      const chartW = Math.min(900, chartBox.node().getBoundingClientRect().width);
      const rowH = 28;
      const chartH = listings.length * rowH + margin.top + margin.bottom;
      const w = chartW - margin.left - margin.right;

      const svg = chartBox.append("svg").attr("viewBox", `0 0 ${chartW} ${chartH}`).attr("preserveAspectRatio", "xMidYMid meet");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLog().domain([convert(10e6), convert(6e9)]).range([0, w]).clamp(true);

      // Price axis at top
      const tickVals = [10e6, 30e6, 50e6, 100e6, 200e6, 500e6, 1e9, 3e9, 6e9];
      g.append("g").attr("class", "axis").call(
        d3.axisTop(x).tickValues(tickVals.map(v => convert(v))).tickFormat(v => {
          const jpy = FX.currency === "JPY" ? v : v / (FX.currency === "USD" ? FX.usd : FX.eur);
          if (FX.currency === "JPY") {
            if (jpy >= 1e9) return "¥" + (jpy / 1e9).toFixed(0) + "B";
            return "¥" + (jpy / 1e6).toFixed(0) + "M";
          }
          if (v >= 1e6) return symbol() + (v / 1e6).toFixed(0) + "M";
          if (v >= 1e3) return symbol() + (v / 1e3).toFixed(0) + "K";
          return symbol() + v.toFixed(0);
        })
      );

      // Grid lines
      g.append("g").attr("class", "grid").call(
        d3.axisTop(x).tickValues(tickVals.map(v => convert(v))).tickSize(-(chartH - margin.top - margin.bottom)).tickFormat("")
      );

      const typeColors = {
        used_condo: "#4a9ec8", condo: "#4a9ec8",
        used_house: "#4ac87a", house: "#4ac87a",
        government_assessed: "#e8a04a",
      };
      const typeLabels = {
        used_condo: "Condo (resale)", condo: "Condo (assessed land)",
        used_house: "House", house: "House (assessed land)",
        government_assessed: "Land (assessed)",
      };

      // Each listing as a row
      listings.forEach((d, i) => {
        const cy = i * rowH + rowH / 2;
        const cx = x(convert(d.price));

        // Dot
        g.append("circle")
          .attr("cx", cx).attr("cy", cy).attr("r", 6)
          .attr("fill", typeColors[d.propType] || "#6b7280")
          .attr("opacity", 0.85)
          .attr("stroke", "var(--bg)").attr("stroke-width", 1)
          .on("mouseover", function(event) {
            d3.select(this).attr("r", 9).attr("opacity", 1);
            let html = `<div class="tooltip-title">${d.ward}${d.neighborhood ? " · " + d.neighborhood : ""}</div>`;
            html += `<div class="tooltip-row"><span class="label">Price</span><span>${fmtMoney(d.price)}</span></div>`;
            if (d.size) html += `<div class="tooltip-row"><span class="label">Size</span><span>${d.size}m²</span></div>`;
            if (d.land) html += `<div class="tooltip-row"><span class="label">Land</span><span>${d.land}m²</span></div>`;
            if (d.plan) html += `<div class="tooltip-row"><span class="label">Layout</span><span>${d.plan}</span></div>`;
            if (d.perSqm) html += `<div class="tooltip-row"><span class="label">Price/m²</span><span>${fmtPrice(d.perSqm)}</span></div>`;
            if (d.year) html += `<div class="tooltip-row"><span class="label">Built</span><span>${d.year}</span></div>`;
            if (d.station) html += `<div class="tooltip-row"><span class="label">Station</span><span>${d.station}${d.walk ? " " + d.walk + "min" : ""}</span></div>`;
            html += `<div class="tooltip-row"><span class="label">Type</span><span>${typeLabels[d.propType] || d.propType}</span></div>`;
            if (d.notes) html += `<div class="tooltip-row"><span class="label" style="color:var(--muted)">${d.notes}</span></div>`;
            tip.show(html, event);
          })
          .on("mousemove", e => tip.move(e))
          .on("mouseout", function() { d3.select(this).attr("r", 6).attr("opacity", 0.85); tip.hide(); });

        // Label: ward + plan + price
        const label = `${d.ward.replace("-ku", "")} ${d.plan || d.propType.replace("used_", "")} ${d.size ? d.size + "m²" : ""}`;
        g.append("text")
          .attr("x", cx + 10).attr("y", cy).attr("dy", "0.35em")
          .attr("class", "chart-label").style("font-size", "0.5rem")
          .style("fill", typeColors[d.propType] || "var(--muted)")
          .text(label.trim());
      });
    }
    drawListings();
    updateCallbacks.push(drawListings);

    // Legend
    const legend = chartBox.append("div").attr("class", "legend").style("margin-top", "0.75rem");
    [{ c: "#4a9ec8", l: "Condo (asking/resale)" }, { c: "#4ac87a", l: "House" }, { c: "#e8a04a", l: "Land (government assessed)" }].forEach(d => {
      const it = legend.append("div").attr("class", "legend-item");
      it.append("div").attr("class", "legend-swatch").style("background", d.c);
      it.append("span").text(d.l);
    });

    container.append("div").attr("class", "data-note").style("margin-top", "0.75rem")
      .html(`<strong>${listings.length} listings</strong> from ${new Set(listings.map(d => d.source)).size} sources. Range: ${fmtMoney(listings[0].price)} (${listings[0].ward}) to ${fmtMoney(listings[listings.length-1].price)} (${listings[listings.length-1].ward}). Government assessed values are land-only at official survey points; asking prices are from active listings on <a href="https://www.realestate.co.jp/en/forsale/" style="color:var(--accent-a)">realestate.co.jp</a>. This database grows over time — more data points make the picture sharper.`);
  }

  /* === Sources === */
  function renderSources(container) {
    container.append("p").attr("class", "source-attr").style("margin-top", "2rem")
      .html(`Sources:
        <a href="https://fred.stlouisfed.org/series/QJPN628BIS" style="color:var(--accent-a)">BIS Residential Property Price Index via FRED</a> ·
        <a href="https://www.mlit.go.jp/totikensangyo/totikensangyo_tk5_000085.html" style="color:var(--accent-a)">MLIT Property Price Index</a> ·
        <a href="https://www.mlit.go.jp/totikensangyo/totikensangyo_tk5_000081.html" style="color:var(--accent-a)">MLIT Official Land Prices (公示地価)</a> ·
        <a href="https://www.stat.go.jp/data/jyutaku/2023/tyousake.html" style="color:var(--accent-a)">Housing and Land Survey 2023</a> ·
        Tokyo ward data: MLIT 公示地価 via tochidai.info, SUUMO, LIFULL HOME'S ·
        Exchange rates via <a href="https://api.frankfurter.dev" style="color:var(--accent-a)">ECB/frankfurter.dev</a>.`);

    container.append("p").attr("class", "data-note").style("margin-top", "0.5rem")
      .text("Note: Property price indices use 2010 = 100. Land prices are official assessed values (公示地価) which may differ from market transaction prices. Vacancy includes all unoccupied dwellings per the 2023 Housing and Land Survey.");
  }
}

/* === Init === */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initRealEstateViz));
} else {
  requestAnimationFrame(initRealEstateViz);
}
