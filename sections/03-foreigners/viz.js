/* === Foreign Residents Visualization === */

function initForeignersViz() {
  d3.select("#foreigners-viz").html('');
  const container = d3.select("#foreigners-viz");

  const NATIONALITIES = ["korea", "china", "brazil", "philippines", "vietnam", "usa", "other"];
  const LABELS = {
    korea: "Korea", china: "China", brazil: "Brazil",
    philippines: "Philippines", vietnam: "Vietnam", usa: "USA", other: "Other"
  };
  const COLORS = {
    korea: "#e8a04a", china: "#c84a4a", brazil: "#4ac87a",
    philippines: "#4a9ec8", vietnam: "#9b4ac8", usa: "#c8c44a", other: "#4a5568"
  };

  const ANNOTATIONS = [
    { year: 1990, text: "Immigration Control Act revised — Nikkeijin visas" },
    { year: 2010, text: "Technical Intern Training Program expansion" },
    { year: 2019, text: "Specified Skilled Worker visa introduced" },
    { year: 2022, text: "Post-COVID rebound" }
  ];

  const basePath = document.querySelector('[data-viz-src]') ? '' : '../../';
  d3.csv(basePath + "data/foreigners/foreigners_by_nationality.csv").then(raw => {
    const data = raw.map(d => {
      const row = { year: +d.year, total: +d.total };
      NATIONALITIES.forEach(k => row[k] = +d[k]);
      return row;
    });

    renderStackedArea(container, data);
    renderSmallMultiples(container, data);
    renderCountryBreakdown(container, basePath);
    renderDataNote(container);
    renderSource(container);
  });

  function renderStackedArea(container, data) {
    const chartBox = container.append("div").attr("class", "chart-container");
    const dims = getChartDimensions(chartBox.node(), 0.5);
    const margin = { top: 40, right: 30, bottom: 40, left: 70 };
    const w = dims.width - margin.left - margin.right;
    const h = dims.height - margin.top - margin.bottom;

    const svg = chartBox.append("svg")
      .attr("viewBox", `0 0 ${dims.width} ${dims.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, w]);
    const y = d3.scaleLinear().range([h, 0]);

    // State for toggling
    const visible = {};
    NATIONALITIES.forEach(k => visible[k] = true);

    // Stack generator
    function computeStack() {
      const activeKeys = NATIONALITIES.filter(k => visible[k]);
      const stack = d3.stack().keys(activeKeys).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
      return { stacked: stack(data), activeKeys };
    }

    let { stacked, activeKeys } = computeStack();
    y.domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice();

    // Area generator
    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Axes
    const xAxis = g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`);
    const yAxis = g.append("g").attr("class", "axis");

    function drawAxes() {
      xAxis.call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(8));
      yAxis.call(d3.axisLeft(y).ticks(6).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(1) + "M" : d >= 1e3 ? (d / 1e3).toFixed(0) + "K" : d));
    }

    // Y grid
    const yGrid = g.append("g").attr("class", "grid");
    function drawGrid() {
      yGrid.call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
    }

    // Areas group
    const areasG = g.append("g");

    function drawAreas() {
      const paths = areasG.selectAll("path").data(stacked, d => d.key);
      paths.exit().remove();
      paths.enter().append("path")
        .attr("fill", d => COLORS[d.key])
        .attr("opacity", 0.85)
        .merge(paths)
        .transition().duration(400)
        .attr("d", area)
        .attr("fill", d => COLORS[d.key]);
    }

    drawAxes();
    drawGrid();
    drawAreas();

    // Annotations
    const annoG = g.append("g").attr("class", "annotations");
    ANNOTATIONS.forEach((a, i) => {
      const ax = x(a.year);
      annoG.append("line")
        .attr("class", "annotation-line")
        .attr("x1", ax).attr("x2", ax)
        .attr("y1", 0).attr("y2", h);

      // Stagger label positions to avoid overlap
      const yOff = 10 + (i % 2) * 14;
      annoG.append("text")
        .attr("class", "annotation-label")
        .attr("x", ax + 4)
        .attr("y", yOff)
        .attr("text-anchor", "start")
        .text(`${a.year}: ${a.text}`)
        .each(function() {
          // Wrap long text if it exceeds available space
          const node = d3.select(this);
          if (ax + 4 + this.getComputedTextLength() > w) {
            node.attr("text-anchor", "end").attr("x", ax - 4);
          }
        });
    });

    // Hover interaction
    const tooltip = createTooltip();
    const hoverLine = g.append("line")
      .attr("stroke", "var(--muted)")
      .attr("stroke-width", 1)
      .attr("y1", 0).attr("y2", h)
      .style("opacity", 0);

    const overlay = g.append("rect")
      .attr("width", w).attr("height", h)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    overlay.on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const year = Math.round(x.invert(mx));
      const d = data.find(r => r.year === year) || data.reduce((a, b) =>
        Math.abs(b.year - year) < Math.abs(a.year - year) ? b : a
      );

      hoverLine.attr("x1", x(d.year)).attr("x2", x(d.year)).style("opacity", 1);

      const rows = NATIONALITIES.filter(k => visible[k]).map(k =>
        `<div class="tooltip-row">
          <span class="label"><span style="color:${COLORS[k]}">&#9632;</span> ${LABELS[k]}</span>
          <span>${fmt.num(d[k])}</span>
        </div>`
      ).join("");

      tooltip.show(
        `<div class="tooltip-title">${d.year}</div>
         <div class="tooltip-row"><span class="label">Total</span><span>${fmt.num(d.total)}</span></div>
         ${rows}`,
        event
      );
    });

    overlay.on("mouseleave", function() {
      hoverLine.style("opacity", 0);
      tooltip.hide();
    });

    // Legend
    const legend = chartBox.append("div").attr("class", "legend");
    NATIONALITIES.forEach(k => {
      const item = legend.append("div")
        .attr("class", "legend-item")
        .on("click", () => {
          visible[k] = !visible[k];
          item.classed("dimmed", !visible[k]);

          const result = computeStack();
          stacked = result.stacked;
          activeKeys = result.activeKeys;

          if (stacked.length > 0) {
            y.domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice();
          }
          drawAxes();
          drawGrid();
          drawAreas();
        });

      item.append("div")
        .attr("class", "legend-swatch")
        .style("background", COLORS[k]);
      item.append("span").text(LABELS[k]);
    });

    // Update function for redraws
    function update() {
      const result = computeStack();
      stacked = result.stacked;
      activeKeys = result.activeKeys;
      if (stacked.length > 0) {
        y.domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))]).nice();
      }
      drawAxes();
      drawGrid();
      drawAreas();
    }
  }

  function renderSmallMultiples(container, data) {
    const grid = container.append("div").attr("class", "small-multiples");

    NATIONALITIES.forEach(k => {
      const cell = grid.append("div").attr("class", "small-multiple");
      cell.append("div").attr("class", "title").text(LABELS[k]);

      const pctData = data.map(d => ({
        year: d.year,
        pct: d.total > 0 ? d[k] / d.total : 0
      }));

      const margin = { top: 8, right: 8, bottom: 20, left: 36 };
      const cellW = 220;
      const cellH = 110;
      const w = cellW - margin.left - margin.right;
      const h = cellH - margin.top - margin.bottom;

      const svg = cell.append("svg")
        .attr("viewBox", `0 0 ${cellW} ${cellH}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().domain(d3.extent(pctData, d => d.year)).range([0, w]);
      const yMax = Math.max(d3.max(pctData, d => d.pct), 0.05);
      const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

      // X axis
      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")))
        .selectAll("text").style("font-size", "0.55rem");

      // Y axis
      g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format(".0%")))
        .selectAll("text").style("font-size", "0.55rem");

      // Area
      const area = d3.area()
        .x(d => x(d.year))
        .y0(h)
        .y1(d => y(d.pct))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(pctData)
        .attr("d", area)
        .attr("fill", COLORS[k])
        .attr("opacity", 0.6);

      // Line
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.pct))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(pctData)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", COLORS[k])
        .attr("stroke-width", 1.5);
    });
  }

  function renderCountryBreakdown(container, basePath) {
    // Section header
    container.append("h3")
      .attr("class", "section-title")
      .style("margin-top", "2.5rem")
      .text("All Nationalities — Mid-2023 Snapshot");
    container.append("p")
      .attr("class", "section-subtitle")
      .text("107 countries with registered foreign residents, ranked by population in Japan");

    const chartBox = container.append("div").attr("class", "chart-container");
    const tip = createTooltip();

    d3.csv(basePath + "data/foreigners/residents_by_country_2024.csv").then(raw => {
      const data = raw.map(d => ({
        rank: +d.rank_in_japan,
        country: d.country,
        residents: +d.residents_in_japan,
        pct: +d.pct_of_foreign_residents || 0,
        worldPop: +d.country_population_2024 || 0,
      }));

      const INITIAL_SHOW = 30;
      let expanded = false;

      // Color by region
      function barColor(d) {
        const asian = ["China","Vietnam","South Korea","Philippines","Nepal","Indonesia",
          "Myanmar","Thailand","Taiwan","India","Sri Lanka","Bangladesh","North Korea",
          "Cambodia","Pakistan","Mongolia","Malaysia","Laos","Uzbekistan","Kyrgyzstan",
          "Afghanistan","Iran","Turkey","Singapore","Tajikistan"];
        const latam = ["Brazil","Peru","Bolivia","Mexico","Argentina","Colombia",
          "Venezuela","Paraguay","Ecuador","Chile","Guatemala","Nicaragua","Cuba"];
        if (asian.includes(d.country)) return "#c84a4a";
        if (latam.includes(d.country)) return "#4ac87a";
        if (["United States","Canada","Australia","New Zealand"].includes(d.country)) return "#c8c44a";
        if (["United Kingdom","France","Germany","Italy","Spain","Romania","Sweden",
          "Netherlands","Switzerland","Poland","Belgium","Denmark","Finland",
          "Hungary","Portugal","Austria","Norway","Czech Republic (Czechia)",
          "Slovakia","Serbia","Bulgaria","Ukraine","Russia","Belarus","Estonia",
          "Slovenia","Luxembourg","Greece"].includes(d.country)) return "#4a9ec8";
        return "#6b7280";
      }

      function render(showData) {
        // Clear previous
        chartBox.selectAll("*").remove();

        const margin = { top: 10, right: 80, bottom: 10, left: 130 };
        const barH = expanded ? 18 : 22;
        const gap = expanded ? 2 : 4;
        const chartW = Math.min(800, chartBox.node().getBoundingClientRect().width);
        const chartH = showData.length * (barH + gap) + margin.top + margin.bottom;
        const w = chartW - margin.left - margin.right;
        const h = chartH - margin.top - margin.bottom;

        // Use log scale when expanded to make long tail visible
        const x = expanded
          ? d3.scaleLog().domain([1, d3.max(showData, d => d.residents)]).range([0, w]).clamp(true)
          : d3.scaleLinear().domain([0, d3.max(showData, d => d.residents)]).range([0, w]);

        const y = d3.scaleBand()
          .domain(showData.map(d => d.country))
          .range([0, h])
          .padding(0.12);

        const svg = chartBox.append("svg")
          .attr("viewBox", `0 0 ${chartW} ${chartH}`)
          .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Bars
        g.selectAll("rect")
          .data(showData)
          .join("rect")
            .attr("x", 0)
            .attr("y", d => y(d.country))
            .attr("width", d => Math.max(2, x(Math.max(1, d.residents))))
            .attr("height", y.bandwidth())
            .attr("fill", d => barColor(d))
            .attr("opacity", 0.8)
            .attr("rx", 2)
            .on("mouseover", function(event, d) {
              d3.select(this).attr("opacity", 1);
              tip.show(
                `<div class="tooltip-title">#${d.rank} ${d.country}</div>
                 <div class="tooltip-row"><span class="label">Residents</span><span>${fmt.num(d.residents)}</span></div>
                 <div class="tooltip-row"><span class="label">% of foreign pop.</span><span>${(d.pct * 100).toFixed(2)}%</span></div>
                 ${d.worldPop ? `<div class="tooltip-row"><span class="label">Home population</span><span>${fmt.num(d.worldPop)}</span></div>` : ''}`,
                event
              );
            })
            .on("mousemove", (event) => tip.move(event))
            .on("mouseout", function() {
              d3.select(this).attr("opacity", 0.8);
              tip.hide();
            });

        // Country labels
        const fontSize = expanded ? "0.55rem" : "0.65rem";
        g.selectAll(".bar-label")
          .data(showData)
          .join("text")
            .attr("class", "chart-label")
            .attr("x", -6)
            .attr("y", d => y(d.country) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .style("font-size", fontSize)
            .text(d => d.country);

        // Value labels
        g.selectAll(".val-label")
          .data(showData)
          .join("text")
            .attr("class", "chart-label")
            .attr("x", d => Math.max(2, x(Math.max(1, d.residents))) + 4)
            .attr("y", d => y(d.country) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .style("font-size", expanded ? "0.5rem" : "0.6rem")
            .style("fill", "var(--text)")
            .text(d => fmt.num(d.residents));

        // Region legend
        const regionLegend = chartBox.append("div").attr("class", "legend");
        [
          { color: "#c84a4a", label: "Asia" },
          { color: "#4ac87a", label: "Latin America" },
          { color: "#4a9ec8", label: "Europe" },
          { color: "#c8c44a", label: "Anglosphere" },
          { color: "#6b7280", label: "Africa / Other" },
        ].forEach(d => {
          const item = regionLegend.append("div").attr("class", "legend-item");
          item.append("div").attr("class", "legend-swatch").style("background", d.color);
          item.append("span").text(d.label);
        });

        // Expand/collapse button
        const remaining = data.length - INITIAL_SHOW;
        const btn = chartBox.append("button")
          .attr("class", "btn")
          .style("margin-top", "0.75rem")
          .style("display", "block")
          .text(expanded ? "Show top 30" : `+ ${remaining} more countries`)
          .on("click", () => {
            expanded = !expanded;
            render(expanded ? data : data.slice(0, INITIAL_SHOW));
          });

        // Long tail stat
        if (expanded) {
          const under100 = data.filter(d => d.residents < 100).length;
          const under1000 = data.filter(d => d.residents < 1000).length;
          const smallest = data[data.length - 1];
          chartBox.append("div")
            .attr("class", "data-note")
            .html(`<strong>Long tail:</strong> ${under1000} of ${data.length} countries have fewer than 1,000 residents in Japan. ${under100} have fewer than 100. Smallest recorded: ${smallest.country} with ${fmt.num(smallest.residents)}. Scale switches to logarithmic to show the full range.`);
        }
      }

      render(data.slice(0, INITIAL_SHOW));
    });
  }

  function renderDataNote(container) {
    container.append("div")
      .attr("class", "data-note")
      .html("<strong>Note:</strong> Pre-1991 data refers to Foreigner Registration Law (外国人登録法) registrations. Post-2012 data uses the new residence card system (在留カード). Numbers are not fully comparable across this administrative break. Time series data from MoJ annual publications; per-country snapshot primarily from MoJ mid-2023 release (令和5年6月末). Some smaller countries use older vintages.");
  }

  function renderSource(container) {
    container.append("p")
      .attr("class", "source-attr")
      .html('Source: <a href="https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html" style="color:var(--accent-a)">Ministry of Justice — Immigration Services Agency (在留外国人統計)</a>; Historical data via <a href="https://www.e-stat.go.jp/en/statistics/00250012" style="color:var(--accent-a)">e-Stat statistics code 00250012</a>');
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(initForeignersViz));
} else {
  requestAnimationFrame(initForeignersViz);
}
