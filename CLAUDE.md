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

## What swinga.coop/calculator actually runs (checked 2026-09-30)

- The chat on the page is a Wix HTML embed titled "AI-chatbot" (`https://www-swinga-coop.filesusr.com/html/421b25_75de7b3c59f2b02dd7230b41a7a6e528.html`, loads lazily on scroll). It loads a third-party widget from AgentiveHub (agentivehub.com, a no-code agent platform): `https://agentivehub.com/production.bundle.min.js` with `assistantId: eb5d48d8-99a7-48b2-b211-1a65d173e774`. That script returns 404, so the calculator never renders. The agent itself lives in Henric's Agentive account, not in any repo.
- The "Press here to use the custom GPT" link points to `g-8E20qS8a0` (digit zero), which is 404. The live GPT is `g-8E20qS8aO` (capital O).
- Wix site revision 1436 was unchanged between March and September 2026, so the page broke because the widget script went away, not because anyone edited the page.
- No Lovable/Antigravity code for the calculator was found: not in any GitHub repo (henricbarkman, SwingaOrg), not in Demi's Drive view, not in mail. `henricbarkman/AI-for-Climate` is AIda's predecessor, not this.

## Status

No code yet. Next step: decide implementation stack (likely a static web app with a backend that runs the LLM-driven calculation flow, or a deterministic non-LLM calculator with the same methodology) and build a minimal first version.
