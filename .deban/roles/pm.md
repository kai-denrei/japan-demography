---
role: pm
owner: minikai
status: active
last-updated: 2026-04-16
---

# Project Management

## Scope
Build order tracking, scope management, quality constraints enforcement, data provenance.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-04-15 | Import Gerald's spreadsheet data to replace preliminary estimates | Spreadsheet has annual data 1975-2024 and 107 per-country entries; our baked-in data was sparse (5-year intervals) and 2024 was 28% off | [[dev]] |
| 2026-04-15 | Web scraping validation of 5 countries: DR Congo, Nicaragua, Nepal, Mongolia, Vietnam | Cross-validated spreadsheet figures against MoJ press releases, MOFA, embassy pages, Wikipedia JP. Found mixed-vintage data and a Congo/DR Congo swap. | [[dev]] |
| 2026-04-15 | Add crime statistics section using NPA data | Sensitive but important; raw arrest data with clear methodology notes and per-capita normalization with Japanese baseline. Source: NPA 犯罪統計書. | [[dev]] |
| 2026-04-15 | Prefecture-level crime data from 3 sources: Tokyo, Osaka, Saitama | National data doesn't cross-tab prefecture × nationality; had to fetch from individual prefectural police. Kanagawa doesn't publish nationality breakdowns. | [[dev]] |
| 2026-04-16 | Add tourism section (1964-2025) | JNTO visitor data (1964-2025 annual, 2003-2025 by country), JTA accommodation survey (2011-2025 by prefecture × nationality). 62 years of data. | [[dev]] |
| 2026-04-16 | Add economy section with live FX conversion | Cabinet Office prefectural GDP (FY2022), MHLW wage data (2024), minimum wage (Oct 2024). frankfurter.dev for live JPY/USD/EUR. | [[dev]], [[arch]] |
| 2026-04-16 | Make all sources explicit and clickable across all sections | Every source attribution now has hyperlinked URLs to the actual data source pages. Footer updated with all major sources. | [[dev]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-04-15 | Using Gerald's spreadsheet "2024-06-01" date as face value | Web scraping proved the per-country data is mostly from MoJ June 2023 (令和5年6月末), not June 2024. Some entries (Mongolia) are actually June 2024; Nicaragua is June 2022. Mixed vintages. |
| 2026-04-15 | Trusting the DR Congo = 25 figure from the spreadsheet | MOFA says 716 (Jun 2024); MoJ/Wikipedia says 605 (Dec 2023). The "25" was mislabeled — it's Republic of Congo. The "605" labeled as "Congo" is actually DR Congo. |

## Lessons
- Spreadsheet data assembled from multiple sources will have mixed date vintages. Always verify a sample against primary sources before trusting the whole dataset. — from dead end on 2026-04-15
- When two similar country names appear in data (Congo vs DR Congo), verify population figures against the country's actual population to catch swaps. DR Congo (109M) vs Republic of Congo (6.3M) — the one with 605 residents is obviously the larger country. — from dead end on 2026-04-15

## Open Questions
- [x] TopoJSON from smartnews-smri may be too large for < 2MB budget — resolved: 1.5MB municipality file, lazy-loaded per section — since: 2026-04-15
- [x] Municipality-level TopoJSON may not have prefecture code properties — resolved: N03_007 field, first 2 digits are prefecture code — since: 2026-04-15
- [x] The spec says sections can be "embeddable iframe or standalone" but also shows inline tags — resolved: went with inline, now tabbed SPA — since: 2026-04-15
- [x] 2024 foreigner data is marked "preliminary" — resolved: replaced with actual MoJ figure (3,768,977) — since: 2026-04-15
- [ ] Saitama R5 2023 crime data may not be directly comparable to R6 2024 national/Tokyo/Osaka data — owner: minikai — since: 2026-04-15
- [ ] MHLW wage data Wakayama 2024 value (269.1k) dropped sharply from 302.1k in 2023 — may be chart-reading error — owner: minikai — since: 2026-04-16
- [ ] Prefecture GDP data is FY2022 (2-year lag); wage data is 2024 — cross-section comparisons are mixing fiscal years — owner: minikai — since: 2026-04-16

## Assumptions
- All 47 prefecture populations and areas are correctly embedded in the spec — status: validated — since: 2026-04-15
- NPA crime data methodology (来日外国人 definition) is consistent across 2015-2024 — status: untested — since: 2026-04-15
- JNTO pre-2003 annual totals are aggregate-only; no country breakdown available before 2003 — status: validated — since: 2026-04-16

## Dependencies
Blocked by:
Feeds into: [[dev]], [[arch]]

## Session Log
- 2026-04-16 — SYNC — Project now at 7 sections (belt, density, foreigners, military, crime, tourism, economy). Tabbed SPA. All sources clickable. Live FX conversion. 3 new open questions flagged.
- 2026-04-15 — INIT — role created, 4 open questions surfaced from brief
