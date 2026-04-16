# Japan Demographics — Interactive Static Site
## Claude Code Build Brief

This document instructs Claude Code to build a multi-section, fully static, interactive data
visualization site on Japan demographics. No backend, no framework. Pure HTML + vanilla JS +
D3.js, deployable as a folder of static files (e.g., GitHub Pages, Netlify, QNAP static serve).

---

## 0. Repository Layout

```
japan-demographics/
├── index.html              # Main entry — section nav + hero
├── css/
│   └── main.css            # Shared styles
├── js/
│   └── utils.js            # Shared helpers (formatting, color scales)
├── data/
│   ├── population/         # Mesh + prefecture population CSVs
│   ├── foreigners/         # MoJ foreigner registration by nationality
│   ├── usmilitary/         # US troop counts by year
│   └── geo/                # TopoJSON files
├── sections/
│   ├── 01-belt/            # Pacific Belt population split
│   ├── 02-map/             # Precise choropleth map
│   ├── 03-foreigners/      # Foreign residents time series
│   └── 04-usmilitary/      # US troops historical
└── SOURCES.md              # Data provenance record
```

Each `sections/NN-*/` folder contains `index.html` (embeddable iframe or standalone),
`viz.js`, and optional local data overrides.

---

## 1. Design System

Aesthetic: dark editorial, dense, no chrome waste.

```css
:root {
  --bg:        #0d0f14;
  --surface:   #161a22;
  --border:    #252b38;
  --text:      #d4cfc8;       /* warm off-white */
  --muted:     #6b7280;
  --accent-a:  #e8a04a;       /* amber — Japan-flag-adjacent */
  --accent-b:  #4a9ec8;       /* steel blue */
  --accent-c:  #c84a4a;       /* red — matches Pacific Belt imagery */
  --mono:      "JetBrains Mono", "Fira Code", monospace;
  --serif:     "Lora", "Georgia", serif;
  --sans:      "Inter", system-ui, sans-serif;
}
```

Typography rules:
- Section titles: `--serif`, 1.4rem, `--text`
- Chart labels: `--mono`, 0.7rem, `--muted`
- Source attribution: `--mono`, 0.65rem, italic, `--muted`
- Body copy (explanatory text): `--sans`, 0.9rem, line-height 1.7, max-width 60ch

Layout: single-page with sticky section nav (`<nav>` with anchor links). Each section is
`min-height: 100vh`. On mobile, collapse to scrolling sections.

Load Google Fonts: `Lora:400,400i,600` + `Inter:400,500` + `JetBrains+Mono:400`.

---

## 2. Dependencies (CDN, no build step)

```html
<!-- Core viz -->
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js"></script>

<!-- Interactivity utilities -->
<script src="https://cdn.jsdelivr.net/npm/nouislider@15/dist/nouislider.min.js"></script>
<link   href="https://cdn.jsdelivr.net/npm/nouislider@15/dist/nouislider.min.css" rel="stylesheet">
```

No React, no bundler, no TypeScript.

---

## 3. Data Acquisition — Step-by-Step Instructions

Claude Code must run these steps to fetch and cache all data locally into `data/`.
Run fetch steps before writing any visualization code.

### 3.1 Japan TopoJSON (Geometry)

**Primary source:** `smartnews-smri/japan-topography` (GitHub raw)
- Municipality boundaries (1% simplification, full Japan):
  `https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/municipality/topojson/s0010/japan.topojson`
- Save as: `data/geo/japan_municipality.topojson`

**Fallback / prefecture level:**
- `https://raw.githubusercontent.com/dataofjapan/land/master/japan.topojson`
- Save as: `data/geo/japan_prefecture.topojson`

Verify both files parse as valid JSON. Log feature counts.

**Pacific Belt polygon (Section 1):**
The belt runs through these prefectures (JIS codes): Fukuoka (40), Yamaguchi (35),
Hiroshima (34), Okayama (33), Hyogo (28), Osaka (27), Nara (29 partial), Aichi (23),
Shizuoka (22), Kanagawa (14), Tokyo (13), Saitama (11), Chiba (12), Ibaraki (08).
Also include Kyoto (26) and Mie (24) as partial.
Build a lookup Set of these codes for use in Section 1 rendering.

### 3.2 Population by Prefecture (2020 Census)

**Source:** e-Stat API — Statistics Bureau of Japan
- Base URL: `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData`
- Stats ID for 2020 census prefecture population: `0003445078`
- API requires `appId` parameter. The site should **prompt the user** to enter their
  free e-Stat API key (register at https://www.e-stat.go.jp/api/) on first load and
  store it in `localStorage`. Alternatively, pre-bake the CSV if a key is provided.

**Fallback (no API key):** Embed a hardcoded JS object with 2020 census prefecture
populations (all 47 prefectures). Data is public and stable — hardcode from the official
Statistical Handbook of Japan 2022 (stat.go.jp). Values below are 2020 census totals:

```js
const PREF_POP_2020 = {
  "01": 5224614,  "02": 1237984,  "03": 1210534,  "04": 2301996,
  "05": 959502,   "06": 1068027,  "07": 1833152,  "08": 2867009,
  "09": 1933146,  "10": 1939110,  "11": 7344765,  "12": 6284480,
  "13": 13960000, "14": 9237337,  "15": 2201272,  "16": 1034814,
  "17": 1132526,  "18": 766863,   "19": 809974,   "20": 2048011,
  "21": 1978742,  "22": 3633202,  "23": 7542415,  "24": 1770254,
  "25": 1413610,  "26": 2578087,  "27": 8837685,  "28": 5465002,
  "29": 1324473,  "30": 922584,   "31": 553407,   "32": 671126,
  "33": 1888432,  "34": 2799702,  "35": 1342059,  "36": 719559,
  "37": 950244,   "38": 1334841,  "39": 691527,   "40": 5135214,
  "41": 811442,   "42": 1312317,  "43": 1738301,  "44": 1123852,
  "45": 1069576,  "46": 1588256,  "47": 1467480
};
```

### 3.3 Foreign Residents by Nationality (1949–2024)

**Primary source:** Ministry of Justice — Immigration Services Agency
- Annual publication: 在留外国人統計 (Zairyu Gaikokujin Tokei)
- Modern data (2012–present): `https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html`
  Download Excel files for each year. Extract total by top nationalities.
- Older data (Foreigner Registration Law era, 1947–2012): available via e-Stat
  statistics code `00250012`.

**Data to bake in:** Because the MoJ Excel files require manual download, embed a
pre-compiled CSV in `data/foreigners/foreigners_by_nationality.csv` with this schema:

```
year,total,korea,china,brazil,philippines,vietnam,usa,other
```

Years: 1950, 1955, 1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010,
2012, 2014, 2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024.

Use the following compiled values (sourced from MoJ statistics and academic records;
all values are registered foreign residents at year-end, in thousands unless noted):

```csv
year,total,korea,china,brazil,philippines,vietnam,usa,other
1950,598694,578802,0,0,0,0,4972,14920
1955,641482,577669,0,0,0,0,7235,56578
1960,650566,581257,45535,0,0,0,8026,15748
1965,665989,583537,49418,0,0,0,10467,22567
1970,708458,614202,51481,0,0,0,15085,27690
1975,751842,647156,47677,0,0,0,19000,38009
1980,782910,664536,52896,0,0,0,22401,43077
1985,850612,683313,74924,1955,12261,0,24878,53281
1990,1075317,687940,150339,56429,49090,6233,37117,88169
1995,1362371,666376,222217,176440,74297,9995,43198,169848
2000,1686444,635269,335575,254394,144871,16908,44856,254571
2005,2011555,598687,519561,302080,187261,19657,51321,332988
2010,2134151,565989,687156,230552,210181,41781,50667,347825
2012,2033656,530046,652595,190609,202985,52367,49184,355870
2014,2121831,501230,654777,175410,218398,99865,51256,420895
2016,2382822,453096,695522,180923,243662,199990,53349,556280
2018,2731093,449634,764720,201865,271289,330835,57500,655250
2019,2933137,446364,813675,211177,282798,411968,57500,709655
2020,2887116,426908,778112,208538,279660,448053,56237,689608
2021,2760635,409747,716606,204879,276654,432934,55230,664585
2022,3075213,411312,761563,209430,298740,489312,58236,846620
2023,3410992,412340,823565,215740,335831,565000,60194,997322
2024,4120000,415000,844000,220000,350000,600000,63000,1628000
```

Note: 2024 figure is preliminary (Immigration Services Agency press release, Dec 2024).
Pre-1960 China figures are minimal due to postwar conditions; field left 0 where not
separately tracked. Embed source notes in SOURCES.md.

### 3.4 US Military Personnel in Japan (1945–2025)

**Sources:**
- 1945–1952 (Occupation): US Army Center of Military History; peak ~350,000 in late 1945,
  declining through 1947–1951 as troops redeployed
- 1952–2000: Congressional Research Service reports; Defense Manpower Data Center (DMDC)
  historical reports; Boose (2000) "US Forces in East Asia"
- 2001–present: DMDC "Military Personnel Statistics" — overseas by country, published
  quarterly (https://dwp.dmdc.osd.mil/dwp/app/dod-data-reports/workforce-reports)

Bake in `data/usmilitary/us_troops_japan.csv`:

```csv
year,military_personnel,dependents_civilians,notes
1945,350000,0,"Peak occupation force; Sept 1945"
1946,270000,0,"Demobilization ongoing"
1947,130000,0,""
1948,100000,0,""
1949,97000,0,""
1950,100000,0,"Korean War mobilization begins"
1951,260000,0,"Korean War peak; Japan as staging area"
1952,210000,0,"Peace Treaty in force April 1952"
1953,183000,0,"Korean armistice July 1953"
1955,140000,0,""
1960,77000,18000,"Post-Eisenhower drawdown; Anpo protests"
1965,48000,22000,""
1970,40000,20000,""
1975,38000,18000,""
1980,39000,19000,""
1985,48000,22000,""
1990,50000,23000,""
1995,47000,22000,"Okinawa rape incident; base review"
2000,40000,20000,""
2005,35000,17000,"Realignment talks"
2010,38000,18000,""
2015,49000,22000,"Revised defense guidelines"
2020,53000,24000,""
2023,54000,24000,""
2025,55000,25000,"Current USFJ estimate"
```

Interpolate linearly for missing years when rendering the chart.
Separate series: `military_personnel` (active duty) vs `dependents_civilians`.

**Okinawa subset:** Embed a note that approximately 70% of US military facilities
(by area) and ~26,000 of the ~55,000 personnel are concentrated in Okinawa.
Add an annotation layer to the time series chart marking key events:
- 1951: San Francisco Peace Treaty
- 1960: ANPO crisis (Mutual Security Treaty renewal protests)
- 1972: Okinawa reversion to Japan
- 1995: Okinawa rape case → SACO process
- 1996: SACO Final Report (Futenma relocation agreed)
- 2012: MV-22 Osprey deployment controversy

---

## 4. Section Specifications

### Section 1 — The Pacific Belt Split
**File:** `sections/01-belt/`

Recreate the viral map showing that ~50% of Japan's population lives within the
Tōkaidō/Pacific Belt corridor.

**Rendering:**
- Load `data/geo/japan_municipality.topojson`
- Color each prefecture: `--accent-c` (red) if in the Pacific Belt set, `#e8e4dc` (light)
  if outside
- Compute and display: total population in belt vs outside (from `PREF_POP_2020`)
- Two large stat counters at top: "Belt: XX,XXX,XXX" / "Rest: XX,XXX,XXX"
- Tooltip on hover: prefecture name (JP + EN), population, belt status
- Toggle button: "Show Belt Only" / "Show All" — animates opacity of non-belt prefectures
- Small inset showing Okinawa (it is excluded from belt calculation)

Map projection: `d3.geoMercator()` centered on Japan (~137°E, 36°N), fit to viewport.
Stroke: `--border` at 0.3px for municipality lines, 0.8px for prefecture lines.

### Section 2 — Population Density Choropleth
**File:** `sections/02-map/`

**Rendering:**
- Load `data/geo/japan_prefecture.topojson`
- Choropleth: population density (pop / area km²) using `PREF_POP_2020`
- Prefecture area data (km²) — embed hardcoded lookup for all 47:

```js
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
```

- Color scale: `d3.scaleSequentialLog(d3.interpolateYlOrRd)` — domain [20, 6000] persons/km²
- Legend: horizontal gradient bar, labeled with density values
- Tooltip: prefecture name, population, area, density
- Sidebar panel (right of map on desktop, below on mobile): ranked list of top 10 densest
  and 10 sparsest prefectures, clickable to highlight on map
- Zoom/pan enabled via `d3.zoom()`

### Section 3 — Foreign Residents by Nationality (1950–2024)
**File:** `sections/03-foreigners/`

**Chart 1: Stacked area chart** — total foreign residents by nationality over time.
- Nationalities: Korea, China, Brazil, Philippines, Vietnam, USA, Other
- Color per nationality (distinct palette, colorblind-safe):
  Korea: #e8a04a, China: #c84a4a, Brazil: #4ac87a, Philippines: #4a9ec8,
  Vietnam: #9b4ac8, USA: #c8c44a, Other: #4a5568
- X axis: year (1950–2024), Y axis: total residents
- Interactive: hover shows year tooltip with breakdown; click nationality label to toggle
- Annotation markers: vertical rules at key years with text callouts:
  - 1990: "Immigration Control Act revised — Nikkeijin visas"
  - 2010: "Technical Intern Training Program expansion"
  - 2019: "Specified Skilled Worker visa introduced"
  - 2022: "Post-COVID rebound"

**Chart 2: % composition small multiples** — one area chart per nationality showing
its share of total foreigners over time. 3×3 grid (6 nationalities + 1 total).

**Chart 3: Bar chart race (optional, implement last)** — animated year-by-year
ranking of top nationalities. Use `requestAnimationFrame` + D3 transitions.
Play/pause button + year scrubber slider (noUISlider).

**Data note panel:** Explain pre-1991 data refers to Foreigner Registration Law
registrations (外国人登録法); post-2012 refers to the new residence card system
(在留カード). Numbers are not fully comparable across this break.

### Section 4 — US Military Presence (1945–2025)
**File:** `sections/04-usmilitary/`

**Chart 1: Timeline — Active duty military personnel**
- Line chart, `--accent-b` (steel blue)
- Second line: dependents + civilians, dashed, `--muted`
- Area fill under military line, low opacity
- Y axis: personnel count; X axis: year
- Annotation system: vertical lines + labeled callout boxes at the events listed in §3.4
  Each callout: event name + 1-sentence description; toggle show/hide

**Chart 2: Small Japan map** (reuse geo from Section 1)
- Show US base locations as proportional circles (size = estimated personnel at base)
- Key bases: Yokota, Kadena, Camp Hansen, MCAS Futenma, NAF Atsugi, Camp Zama,
  Sasebo Naval Base, Iwakuni MCAS, Misawa AB
- Hardcode coordinates:

```js
const US_BASES = [
  {name:"Yokota AB",         lat:35.748, lon:139.348, personnel:11000, branch:"AF"},
  {name:"Kadena AB",         lat:26.355, lon:127.769, personnel:15000, branch:"AF"},
  {name:"MCAS Futenma",      lat:26.269, lon:127.754, personnel:4500,  branch:"MC"},
  {name:"Camp Hansen",       lat:26.487, lon:127.991, personnel:3600,  branch:"MC"},
  {name:"Camp Schwab",       lat:26.637, lon:128.070, personnel:2500,  branch:"MC"},
  {name:"NAF Atsugi",        lat:35.455, lon:139.449, personnel:3600,  branch:"Navy"},
  {name:"Camp Zama",         lat:35.530, lon:139.388, personnel:2200,  branch:"Army"},
  {name:"Sasebo NB",         lat:33.158, lon:129.723, personnel:4000,  branch:"Navy"},
  {name:"Iwakuni MCAS",      lat:34.143, lon:132.235, personnel:5000,  branch:"MC"},
  {name:"Misawa AB",         lat:40.703, lon:141.368, personnel:3800,  branch:"AF"}
];
```

- Branch color coding: AF=#4a9ec8, MC=#c84a4a, Navy=#4ac87a, Army=#e8a04a
- Tooltip on hover: base name, branch, estimated personnel, prefecture
- Okinawa inset: zoom panel showing the concentration of bases on the island

**Okinawa burden callout:**
Compute and display: "Okinawa = 0.6% of Japan's land area, hosts X% of all US base area".
Source: Defense of Japan White Paper 2023.

---

## 5. Navigation & Index

`index.html` structure:

```html
<nav class="section-nav">
  <a href="#belt">Pacific Belt</a>
  <a href="#density">Density Map</a>
  <a href="#foreigners">Foreign Residents</a>
  <a href="#usmilitary">US Military</a>
</nav>
<section id="belt">    <!-- iframe or inline include --> </section>
<section id="density"> <!-- ... --> </section>
<section id="foreigners"> <!-- ... --> </section>
<section id="usmilitary"> <!-- ... --> </section>
<footer>Sources & methodology</footer>
```

Sticky nav scrolls with page. Active section highlighted in `--accent-a`.
Smooth scroll behavior (`scroll-behavior: smooth`).

---

## 6. SOURCES.md — Required Provenance Record

Claude Code must generate this file listing:
- Each data source with URL, access date, license, and notes
- Any manual compilation steps taken
- Caveats on pre-2012 foreigner data (registration law discontinuity)
- USFJ data quality notes (DMDC data excludes classified deployments)

---

## 7. Build Order

1. Scaffold directory structure
2. Fetch and validate all TopoJSON files → `data/geo/`
3. Write all embedded data CSVs → `data/`
4. Build `css/main.css` (design tokens + base resets)
5. Build `js/utils.js` (shared formatters, color helpers, tooltip factory)
6. Build Section 1 (belt map) — test standalone
7. Build Section 2 (density choropleth) — test standalone
8. Build Section 3 (foreigners — charts 1 + 2 first, chart 3 optional)
9. Build Section 4 (US military — timeline first, then base map)
10. Wire `index.html` — import all sections
11. Generate `SOURCES.md`
12. Smoke test: open `index.html` in browser, verify all sections render without network errors

---

## 8. Quality Constraints

- All charts must render at 375px viewport width (mobile-first)
- No external analytics, no cookies, no tracking
- Total page weight (excluding fonts) < 2MB
- TopoJSON files may be large — load lazily per section (IntersectionObserver)
- All color usage must pass WCAG AA contrast for text on `--bg`
- Source attribution visible in each section footer (not buried in SOURCES.md only)
- No lorem ipsum — all text must be factual and cite a source

---

## 9. Future Extension Hooks (do not implement now, but structure for it)

The following modules are planned for later addition. Name data files and section IDs
to avoid conflicts:

- `05-aging/` — Age pyramid animation 1950–2050 (using e-Stat census + NIPSSR projections)
- `06-birthrate/` — Total fertility rate by prefecture, time series
- `07-naturalization/` — Annual naturalizations by former nationality (MoJ data)
- `08-okinawa/` — Deep-dive: Okinawa demographics, US base burden, historical population
- `09-language/` — Language ability self-report (census question added 2020)
- `10-zainichi/` — Historical Zainichi Korean population (colonial era immigration context)

Reserve section IDs `05` through `15` in nav config object.

---

## Appendix: Key Reference URLs

| Resource | URL |
|---|---|
| e-Stat API docs | https://api.e-stat.go.jp/rest/3.0/api-document |
| e-Stat foreigner stats | https://www.e-stat.go.jp/en/statistics/00250012 |
| MoJ 在留外国人統計 | https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html |
| MLIT boundary data | https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v2_4.html |
| japan-topography (GitHub) | https://github.com/smartnews-smri/japan-topography |
| dataofjapan/land (GitHub) | https://github.com/dataofjapan/land |
| jpn-atlas (npm) | https://www.npmjs.com/package/jpn-atlas |
| DMDC workforce reports | https://dwp.dmdc.osd.mil/dwp/app/dod-data-reports/workforce-reports |
| Statistical Handbook Japan | https://www.stat.go.jp/english/data/handbook/ |
| Defense of Japan White Paper | https://www.mod.go.jp/en/publ/w_paper/ |
| USFJ Wikipedia (historical troop data) | https://en.wikipedia.org/wiki/United_States_Forces_Japan |
| Mesh statistics guide | https://www.stat.go.jp/english/data/mesh/05.html |
