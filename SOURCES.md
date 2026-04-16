# Data Sources & Provenance

## Geographic Boundaries

### Municipality Boundaries (TopoJSON)
- **Source:** smartnews-smri/japan-topography (GitHub)
- **URL:** https://github.com/smartnews-smri/japan-topography
- **File:** `data/geo/japan_municipality.topojson` (N03-21_210101, 1% simplification)
- **Original data:** Ministry of Land, Infrastructure, Transport and Tourism (MLIT) — National Land Numerical Information, Administrative Boundary Data (N03)
- **Access date:** 2026-04-15
- **License:** CC BY 4.0 (MLIT data); MIT (repository processing code)
- **Notes:** Based on 2021-01-01 administrative boundaries. 1906 municipality-level features.

### Prefecture Boundaries (TopoJSON)
- **Source:** dataofjapan/land (GitHub)
- **URL:** https://github.com/dataofjapan/land
- **File:** `data/geo/japan_prefecture.topojson`
- **Access date:** 2026-04-15
- **License:** MIT
- **Notes:** 47 prefecture-level features. Simplified geometry suitable for choropleth display.

---

## Population Data

### 2020 Census — Prefecture Population
- **Source:** Statistics Bureau of Japan — 2020 Population Census
- **URL:** https://www.stat.go.jp/english/data/handbook/
- **Publication:** Statistical Handbook of Japan 2022
- **e-Stat Stats ID:** 0003445078
- **Access date:** 2026-04-15
- **License:** Public domain (Government of Japan statistics)
- **Notes:** Hardcoded 47-prefecture population totals from the 2020 Census. Tokyo figure (13,960,000) is rounded from official count.

### Prefecture Area (km²)
- **Source:** Geospatial Information Authority of Japan (GSI)
- **URL:** https://www.gsi.go.jp/
- **Access date:** 2026-04-15
- **License:** Public domain
- **Notes:** Land area figures for all 47 prefectures. Used to compute population density.

---

## Foreign Residents

### Foreign Residents by Nationality (1950–2024)
- **File:** `data/foreigners/foreigners_by_nationality.csv`
- **Primary source:** Ministry of Justice — Immigration Services Agency (法務省 出入国在留管理庁)
- **Publication:** 在留外国人統計 (Statistics on Foreign Residents)
- **URL:** https://www.moj.go.jp/isa/policies/statistics/toukei_ichiran_touroku.html
- **e-Stat statistics code:** 00250012 (for historical data)
- **Access date:** 2026-04-15
- **License:** Public domain (Government of Japan statistics)

#### Compilation Notes
- **1950–1985:** Sourced from Foreigner Registration Law (外国人登録法) statistics. Pre-1960 China figures set to 0 where not separately tracked in published tables. Vietnam figures not separately tracked before 1985.
- **1990–2011:** Foreigner Registration system statistics via e-Stat.
- **2012–present:** New residence card system (在留カード) introduced July 2012. The administrative change means pre-2012 and post-2012 figures are **not fully comparable** — the new system excludes certain short-term categories previously counted, while including some categories previously omitted.
- **2024:** Preliminary figure from Immigration Services Agency press release (December 2024). Subject to revision.
- **Korea category:** Includes both South Korea (韓国) and North Korea (朝鮮) registrations throughout the time series. The "Korea" line represents the combined Zainichi Korean population and newer Korean immigrants.
- **Brazil spike (1990s):** Reflects the 1990 Immigration Control Act revision allowing Nikkeijin (Japanese descendants in South America) to obtain residence visas.
- **Vietnam surge (2010s–2020s):** Driven by Technical Intern Training Program expansion and the 2019 Specified Skilled Worker visa category.

---

## US Military Presence

### US Military Personnel in Japan (1945–2025)
- **File:** `data/usmilitary/us_troops_japan.csv`
- **Sources (by period):**
  - **1945–1952 (Occupation):** US Army Center of Military History; various published accounts of occupation force levels
  - **1952–2000:** Congressional Research Service reports; Defense Manpower Data Center (DMDC) historical compilations; Boose, Donald W. Jr. (2000) "US Forces in East Asia"
  - **2001–present:** DMDC "Military Personnel Statistics" — overseas by country, published quarterly
  - **URL:** https://dwp.dmdc.osd.mil/dwp/app/dod-data-reports/workforce-reports
- **Access date:** 2026-04-15
- **License:** Public domain (US Government publications)

#### Data Quality Notes
- **DMDC data excludes classified deployments**, temporary rotational forces, and certain special operations personnel. Actual total presence may be higher than reported figures.
- **Dependents/civilians column** is estimated for years prior to 1960 (set to 0 where data not available). Post-1960 figures from DMDC and SOFA-related reporting.
- **Linear interpolation** is applied for years not present in the CSV when rendering charts.
- **Personnel-per-base estimates** are approximate, compiled from USFJ public affairs releases and defense reporting. Exact figures are not publicly disclosed at the installation level.

### US Base Locations
- **Source:** US Forces Japan (USFJ) public information; Defense of Japan White Paper
- **URL:** https://www.mod.go.jp/en/publ/w_paper/
- **Notes:** Coordinates are approximate facility centroids. Personnel figures are estimates from publicly available sources. The "70% of US facility area in Okinawa" statistic is from Defense of Japan White Paper 2023.

---

## General Notes

- All data in this project is from public, official sources or established academic compilations.
- No personal data is collected, stored, or processed.
- This site uses no cookies, analytics, or tracking of any kind.
- Data files are static snapshots; they do not update automatically.
