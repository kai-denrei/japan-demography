---
role: dev
owner: minikai
status: active
last-updated: 2026-04-16
---

# Development

## Scope
Implementation of all HTML, CSS, JS, and D3.js visualizations. Data file creation. Build order execution per spec.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-04-15 | Use `data-viz-src` attribute + basePath detection for dual standalone/embedded paths | viz.js files need to work from both root index.html and standalone section pages; `document.querySelector('[data-viz-src]')` detects context | [[arch]] |
| 2026-04-15 | Correct 2024 foreigner data from 4.12M to 3.77M using Gerald's spreadsheet | Our preliminary estimate was 27.8% too high; MoJ actual data via Gerald's sheet is authoritative | [[pm]] |
| 2026-04-15 | Swap Congo/DR Congo entries in per-country CSV | Web scraping confirmed 605 is DR Congo (109M pop), 25 is Republic of Congo (6.3M pop); original sheet had them backwards | [[pm]] |
| 2026-04-15 | Use NPA 犯罪統計書 Tables 129/130/131/132/133 for crime data | Downloaded actual Excel files from npa.go.jp; extracted to CSV. 2024 data, 26 nationalities, 10-year time series | [[pm]] |
| 2026-04-15 | Include Japanese national baseline in per-capita arrest chart | Total 2024 penal arrests (191,826 from NPA Table 1) minus foreign (10,464 from Table 129) = 181,362 Japanese; rate 15.1/10k provides essential context | [[pm]] |
| 2026-04-15 | Prefecture crime data from Tokyo (Keishicho), Osaka, Saitama police | Each prefecture publishes own nationality breakdown; Tokyo most detailed (33 nationalities), Saitama has unique Turkey data | [[pm]] |
| 2026-04-16 | Use requestAnimationFrame wrapper for all viz init functions | Tab-panel switching sets display:block but browser needs a frame to compute layout before getBoundingClientRect returns non-zero dimensions | [[arch]] |
| 2026-04-16 | Reuse municipality TopoJSON + Pacific Belt coloring for US Military base map | Gives geographic context to base locations; belt corridor visible behind base circles; Okinawa inset with municipality detail | [[arch]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-04-15 | Municipality topojson URL `smartnews-smri/.../s0010/japan.topojson` | 404 — the combined Japan file doesn't exist at that path. Per-prefecture files exist but the combined file is at `N03-21_210101.json` instead |
| 2026-04-15 | `DOMContentLoaded` event listener in lazy-loaded scripts | Event already fired by the time lazy scripts load; init functions never execute. Fixed with readyState check |
| 2026-04-15 | Relative data paths `../../data/` in viz.js when loaded from root index.html | Resolves relative to page URL, not script URL; `../../data/` from root goes above root. Fixed with basePath detection |
| 2026-04-15 | Our baked-in 2024 foreigner estimate of 4,120,000 | Based on preliminary ISA press release; actual MoJ figure is 3,768,977 (end-2024). Off by 28% |
| 2026-04-15 | Gerald's spreadsheet Summary tab labeled as "June 2024" data | Web scraping proved it's actually June 2023 (令和5年6月末) data for most countries; some smaller countries are even older. Mixed vintages |
| 2026-04-16 | getChartDimensions on just-shown tab panels returns 0 width | Browser hasn't computed layout yet after display:none→block switch. requestAnimationFrame defers measurement by one frame |

## Lessons
- Municipality TopoJSON filenames from smartnews-smri use the MLIT naming convention (`N03-21_210101.json`), not intuitive names — always check the GitHub API listing first. — from dead end on 2026-04-15
- Official government data labeled with a date may actually be from a different reporting period. Always cross-validate with web scraping against the MoJ press release page. — from dead end on 2026-04-15
- Lazy-loaded scripts in a tabbed SPA need both readyState-aware init AND requestAnimationFrame to ensure the container has layout dimensions. — from dead end on 2026-04-16

## Open Questions

## Assumptions
- D3.js v7 CDN will remain available — status: untested — since: 2026-04-15
- smartnews-smri TopoJSON GitHub raw URLs are stable — status: validated — since: 2026-04-15
- frankfurter.dev API for exchange rates will remain free and CORS-enabled — status: untested — since: 2026-04-16

## Dependencies
Blocked by:
Feeds into:

## Session Log
- 2026-04-16 — SYNC — 7 sections now live. Tabbed SPA architecture. Economy section with live FX. US military map uses municipality TopoJSON. requestAnimationFrame fix for tab layout timing.
- 2026-04-15 — BUILD — All 4 sections implemented: belt map (municipality topojson), density choropleth, foreigners stacked area + small multiples, US military timeline + base map. Lazy loading via IntersectionObserver. All JS syntax-checked.
- 2026-04-15 — INIT — role created
