/* === Shared Utilities === */

// Number formatting
const fmt = {
  num: d3.format(","),
  pct: d3.format(".1%"),
  pct0: d3.format(".0%"),
  density: d3.format(",.0f"),
};

// Prefecture data
const PREF_POP_2020 = {
  "01":5224614,"02":1237984,"03":1210534,"04":2301996,"05":959502,
  "06":1068027,"07":1833152,"08":2867009,"09":1933146,"10":1939110,
  "11":7344765,"12":6284480,"13":13960000,"14":9237337,"15":2201272,
  "16":1034814,"17":1132526,"18":766863,"19":809974,"20":2048011,
  "21":1978742,"22":3633202,"23":7542415,"24":1770254,"25":1413610,
  "26":2578087,"27":8837685,"28":5465002,"29":1324473,"30":922584,
  "31":553407,"32":671126,"33":1888432,"34":2799702,"35":1342059,
  "36":719559,"37":950244,"38":1334841,"39":691527,"40":5135214,
  "41":811442,"42":1312317,"43":1738301,"44":1123852,"45":1069576,
  "46":1588256,"47":1467480
};

const PREF_AREA_KM2 = {
  "01":83424,"02":9646,"03":15275,"04":7282,"05":11638,"06":9323,
  "07":13784,"08":6097,"09":6408,"10":6362,"11":3798,"12":5158,
  "13":2194,"14":2416,"15":12584,"16":4248,"17":4185,"18":4190,
  "19":4465,"20":13562,"21":10621,"22":7777,"23":5173,"24":5777,
  "25":4017,"26":4612,"27":1905,"28":8401,"29":3691,"30":4725,
  "31":3507,"32":6708,"33":7115,"34":8479,"35":6112,"36":4147,
  "37":1877,"38":5676,"39":7104,"40":4986,"41":2440,"42":4132,
  "43":7409,"44":6341,"45":7735,"46":9188,"47":2282
};

const PREF_NAMES = {
  "01":["Hokkaido","北海道"],"02":["Aomori","青森県"],"03":["Iwate","岩手県"],
  "04":["Miyagi","宮城県"],"05":["Akita","秋田県"],"06":["Yamagata","山形県"],
  "07":["Fukushima","福島県"],"08":["Ibaraki","茨城県"],"09":["Tochigi","栃木県"],
  "10":["Gunma","群馬県"],"11":["Saitama","埼玉県"],"12":["Chiba","千葉県"],
  "13":["Tokyo","東京都"],"14":["Kanagawa","神奈川県"],"15":["Niigata","新潟県"],
  "16":["Toyama","富山県"],"17":["Ishikawa","石川県"],"18":["Fukui","福井県"],
  "19":["Yamanashi","山梨県"],"20":["Nagano","長野県"],"21":["Gifu","岐阜県"],
  "22":["Shizuoka","静岡県"],"23":["Aichi","愛知県"],"24":["Mie","三重県"],
  "25":["Shiga","滋賀県"],"26":["Kyoto","京都府"],"27":["Osaka","大阪府"],
  "28":["Hyogo","兵庫県"],"29":["Nara","奈良県"],"30":["Wakayama","和歌山県"],
  "31":["Tottori","鳥取県"],"32":["Shimane","島根県"],"33":["Okayama","岡山県"],
  "34":["Hiroshima","広島県"],"35":["Yamaguchi","山口県"],"36":["Tokushima","徳島県"],
  "37":["Kagawa","香川県"],"38":["Ehime","愛媛県"],"39":["Kochi","高知県"],
  "40":["Fukuoka","福岡県"],"41":["Saga","佐賀県"],"42":["Nagasaki","長崎県"],
  "43":["Kumamoto","熊本県"],"44":["Oita","大分県"],"45":["Miyazaki","宮崎県"],
  "46":["Kagoshima","鹿児島県"],"47":["Okinawa","沖縄県"]
};

// Pacific Belt prefecture codes
const PACIFIC_BELT = new Set([
  "08","11","12","13","14","22","23","24","26","27","28","29","33","34","35","40"
]);

// Get prefecture code from municipality code (first 2 digits)
function getPrefCode(munCode) {
  if (!munCode) return null;
  return String(munCode).padStart(5,"0").slice(0,2);
}

// Tooltip factory
function createTooltip() {
  const el = d3.select("body").append("div").attr("class","tooltip");
  return {
    el,
    show(html, event) {
      el.html(html).classed("visible", true);
      const pad = 12;
      let x = event.clientX + pad;
      let y = event.clientY + pad;
      const rect = el.node().getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = event.clientX - rect.width - pad;
      if (y + rect.height > window.innerHeight) y = event.clientY - rect.height - pad;
      el.style("left", x + "px").style("top", y + "px");
    },
    move(event) {
      const pad = 12;
      let x = event.clientX + pad;
      let y = event.clientY + pad;
      const rect = el.node().getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = event.clientX - rect.width - pad;
      if (y + rect.height > window.innerHeight) y = event.clientY - rect.height - pad;
      el.style("left", x + "px").style("top", y + "px");
    },
    hide() { el.classed("visible", false); }
  };
}

// Lazy section loader with IntersectionObserver
function lazyLoadSections() {
  const sections = document.querySelectorAll("[data-viz-src]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const src = el.dataset.vizSrc;
        if (!el.dataset.loaded) {
          const script = document.createElement("script");
          script.src = src;
          document.body.appendChild(script);
          el.dataset.loaded = "true";
        }
        observer.unobserve(el);
      }
    });
  }, { rootMargin: "200px" });
  sections.forEach(s => observer.observe(s));
}

// Active nav tracking
function initNavTracking() {
  const sections = document.querySelectorAll(".section[id]");
  const navLinks = document.querySelectorAll(".section-nav a");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove("active"));
        const link = document.querySelector(`.section-nav a[href="#${entry.target.id}"]`);
        if (link) link.classList.add("active");
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => observer.observe(s));
}

// Responsive dimension helper
function getChartDimensions(container, aspectRatio = 0.6) {
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = Math.min(width * aspectRatio, window.innerHeight * 0.7);
  return { width, height };
}

// Linear interpolation for missing years
function interpolateData(data, yearKey, valueKeys) {
  const years = data.map(d => d[yearKey]);
  const minYear = d3.min(years);
  const maxYear = d3.max(years);
  const result = [];
  for (let y = minYear; y <= maxYear; y++) {
    const exact = data.find(d => d[yearKey] === y);
    if (exact) {
      result.push({ ...exact });
    } else {
      const before = data.filter(d => d[yearKey] < y).slice(-1)[0];
      const after = data.find(d => d[yearKey] > y);
      if (before && after) {
        const t = (y - before[yearKey]) / (after[yearKey] - before[yearKey]);
        const row = { [yearKey]: y };
        valueKeys.forEach(k => {
          row[k] = Math.round(before[k] + t * (after[k] - before[k]));
        });
        result.push(row);
      }
    }
  }
  return result;
}
