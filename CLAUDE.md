# AIK Circular Consumption Calculator (Demi map)

Repo: [henricbarkman/aik-circular-consumption-calculator](https://github.com/henricbarkman/aik-circular-consumption-calculator)

AIK-delprojekt (AI för klimatet).

## What this is

Open-source tool that calculates climate-impact savings from circulating products (borrow, rent, second-hand) instead of buying new. Currently exists only as a Custom GPT — this repo is the staging ground for a real implementation.

## Canonical docs

- [README.md](README.md) — public-facing overview, status, roadmap
- [docs/PROMPT.md](docs/PROMPT.md) — full GPT prompt with step-by-step methodology (the source of truth for the calculation logic)

## Links

- Notion: https://www.notion.so/35cb0484bfa48188bb0bff6fab4396e6
- Drive: (set after first /project create completes)
- Landing page: https://swinga.coop/calculator
- Custom GPT (live): https://chat.openai.com/g/g-8E20qS8aO-circular-consumption-calculator
- Parent (generalassistant): `~/generalassistant`

## Related

- [SwingaOrg/app](https://github.com/SwingaOrg/app) — the cooperative platform that the calculator is associated with
- Distinct from [henricbarkman/zaid](https://github.com/henricbarkman/zaid) (climate impact of municipal measures, not consumer products)
- Distinct from [henricbarkman/aida-klimatkalkyl](https://github.com/henricbarkman/aida-klimatkalkyl) (renovations, not consumption)

## Stakeholders / users mentioned

- **Vasco** (Smarta Kartan Göteborg) — wants the calculator for their platform; aktiv Notion-task to send it to him
- **Anna** — also receiving early access
- LinkedIn / Instagram / YouTube — eventual public-spread channels

## Status

No code yet. Next step: decide implementation stack (likely a static web app with a backend that runs the LLM-driven calculation flow, or a deterministic non-LLM calculator with the same methodology) and build a minimal first version.
