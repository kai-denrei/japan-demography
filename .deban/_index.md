---
project: Japan Demographics Interactive Site
created: 2026-04-15
status: active
mode: solo
stale_threshold_days: 30
---

# Japan Demographics Interactive Site — Index

## Brief
Multi-section static data visualization site covering Japan's Pacific Belt population split, prefecture density choropleth, foreign residents by nationality (1950–2024), US military presence (1945–2025), crime statistics by nationality (2015–2024), inbound tourism (1964–2025), and prefectural economy (GDP, wages, minimum wage with live FX conversion). Pure HTML + vanilla JS + D3.js, tabbed SPA, no framework, no backend.

## Active Roles
- [[dev]] — owner: minikai
- [[arch]] — owner: minikai
- [[pm]] — owner: minikai

## Key Decisions
- Tabbed SPA architecture (replaced scrolling single-page at 7 sections) — [[arch]] 2026-04-16
- Municipality-level TopoJSON reused across Pacific Belt and US Military sections — [[dev]] 2026-04-16
- requestAnimationFrame for all viz init to handle tab layout timing — [[dev]], [[arch]] 2026-04-16
- Live FX conversion via frankfurter.dev (ECB, no API key) — [[arch]] 2026-04-16
- All source attributions are explicit clickable hyperlinks — [[pm]] 2026-04-16
- Gerald's spreadsheet imported; 2024 data corrected from preliminary to actual MoJ figures — [[pm]] 2026-04-15
- Congo/DR Congo swap fixed after web scraping validation — [[dev]], [[pm]] 2026-04-15

## Open Questions (cross-role)
- [ ] Saitama R5/2023 crime data vs R6/2024 national comparability — [[pm]]
- [ ] MHLW Wakayama 2024 wage anomaly (302→269k drop) — [[pm]]
- [ ] Prefecture GDP (FY2022) vs wage data (2024) fiscal year mismatch in cross-section — [[pm]]
