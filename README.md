# Circular Consumption Calculator

Tool that calculates the climate-impact savings from circulating products (borrowing, renting, second-hand) instead of buying new. Created by [Swinga](https://swinga.coop) — open source.

## Status

Early stage. The calculator currently exists as a Custom GPT on ChatGPT:

- **Live**: [chatgpt.com/g/g-8E20qS8aO-circular-consumption-calculator](https://chat.openai.com/g/g-8E20qS8aO-circular-consumption-calculator)
- **Beta variant**: [chatgpt.com/g/g-8E20qS8a0-circular-consumption-calculator-beta](https://chatgpt.com/g/g-8E20qS8a0-circular-consumption-calculator-beta)
- **Landing page**: [swinga.coop/calculator](https://swinga.coop/calculator)

The methodology is documented in [docs/PROMPT.md](docs/PROMPT.md) — that's the full prompt that drives the Custom GPT, written so a calculator implementation in any framework can follow the same steps.

## Goal

Move from "GPT-only" to a real, embeddable, open-source calculator that other circular-economy platforms (e.g. Smarta Kartan Göteborg) can integrate into their own tools, and that can be shared on LinkedIn, Instagram and YouTube.

## Methodology in brief

For each product category, calculate the lifecycle emissions of one new product, multiply by the number of circulations, then subtract:

- Emissions for the share that does not actually replace new consumption (default 50%)
- Increased transport emissions induced by the circulation service
- Increased operational/energy emissions from running the service

The result is an **estimated range** (low–high) of CO2e savings, plus optional waste, water and chemical metrics.

Full step-by-step methodology in [docs/PROMPT.md](docs/PROMPT.md).

## License

To be decided. Likely AGPL-3.0 to match the [SwingaOrg/app](https://github.com/SwingaOrg/app) cooperative platform.

## Contact

[swinga.coop](https://swinga.coop) — info@swinga.coop
