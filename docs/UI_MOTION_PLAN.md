# ClientPulse — UI motion & interactivity plan

## Problems
- KPI cards are static — values don't count up, no hover motion, sparklines don't draw.
- Health-trend line has no granularity control (daily / weekly / monthly / quarterly).
- Page feels flat — no reveal-on-mount, no hover lift, no transitions.

## Libraries to evaluate (all React, dashboard-appropriate)
| Library | Use |
|---------|-----|
| **Motion** (`motion`, ex-Framer Motion) | hover lift/scale springs, reveal-on-mount, layout transitions, `AnimatePresence` |
| **NumberFlow** (`@number-flow/react`) | animated counting KPI values + deltas |
| **Auto-Animate** (`@formkit/auto-animate`) | drop-in transitions when lists/filters change |
| **ECharts** (have) | interactive line: granularity toggle, animated transitions, crosshair tooltip, dataZoom |
| **tw-animate-css** (have) | lightweight CSS keyframe utilities |
| **GSAP** (skills installed) | optional: pro count-up + sparkline draw timelines |

Keep motion tasteful — data dashboards want subtle, not flashy (per the research).

## Showcase (test file)
`ui-showcase.html` → renders variants side by side with sample data:
1. **KPI cards** — static (current) · Motion hover+reveal · NumberFlow count-up · combined (Motion card + NumberFlow value + drawing sparkline)
2. **Interactive line** — segmented control Daily / Weekly / Monthly / Quarterly, animated transition on switch, crosshair tooltip, dataZoom slider
3. **Effects** — Auto-Animate reorder, hover lift, reveal-on-scroll

## After you pick
- `kpi-cards.tsx` → Motion card (hover lift + mount reveal) + NumberFlow values + animated sparkline
- `health-trend.tsx` → granularity segmented control + animated ECharts transitions + crosshair + optional zoom
- Apply subtle reveal/hover to the other cards via a shared Motion wrapper

## Steps
1. Install `motion @number-flow/react @formkit/auto-animate`
2. Build `ui-showcase.html` (this file's section above)
3. You pick variants → wire into the real KPI cards + trend chart → verify
