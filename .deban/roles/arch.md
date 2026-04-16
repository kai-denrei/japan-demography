---
role: arch
owner: minikai
status: active
last-updated: 2026-04-16
---

# Architecture

## Scope
Site structure, data flow, dependency choices, performance constraints (< 2MB, lazy loading, mobile-first).

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-04-15 | Inline sections with lazy loading via IntersectionObserver | Simpler than iframes; data-viz-src attribute triggers script load on scroll-into-view | [[dev]] |
| 2026-04-16 | Switch from scrolling single-page to tabbed SPA | 7 sections made the page too long; tabs show one section at a time with URL hash routing. Lazy loading now triggers on tab switch, not scroll. | [[dev]], [[pm]] |
| 2026-04-16 | requestAnimationFrame for viz init after tab switch | Tab panels go from display:none to display:block; browser needs one frame to compute layout before getBoundingClientRect works | [[dev]] |
| 2026-04-16 | Live exchange rate via frankfurter.dev (ECB data), fallback to open.er-api.com | No API key needed, CORS enabled, daily rates. Sufficient for demographics site. Economy section converts all JPY values to USD/EUR on toggle. | [[dev]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-04-15 | Single long scrolling page with all sections visible | Worked for 4 sections but became unwieldy at 7. User explicitly requested tabs. |
| 2026-04-15 | IntersectionObserver-based lazy loading for scrolling page | Replaced by tab-switch-based loading when architecture changed to SPA tabs. Observer code still in utils.js but unused. |

## Lessons
- A scrolling data viz page hits a usability wall around 5-6 sections. Tabs with lazy loading per tab is a better pattern for a growing project. — from dead end on 2026-04-15

## Open Questions

## Assumptions
- Inline sections (not iframes) will be used for index.html integration — status: validated — since: 2026-04-15
- TopoJSON files can be lazy-loaded per section with IntersectionObserver without UX jank — status: superseded (now tab-based) — since: 2026-04-15
- Tab panels get correct layout dimensions after one requestAnimationFrame — status: validated — since: 2026-04-16

## Dependencies
Blocked by:
Feeds into: [[dev]]

## Session Log
- 2026-04-16 — SYNC — Architecture now tabbed SPA with 7 sections + home. URL hash routing. Lazy load on tab switch. requestAnimationFrame for layout timing. Live FX via frankfurter.dev.
- 2026-04-15 — BUILD — Architecture: inline sections (not iframes), lazy-loaded via data-viz-src + IntersectionObserver. CDN deps (D3 v7, topojson-client v3). Municipality topojson 1.5MB loaded only for Section 1. Total project ~2.6MB but lazy-loaded so initial payload well under 2MB.
- 2026-04-15 — INIT — role created
