# CCC, Circular Consumption Calculator

A transparent calculator for the climate benefit of circular consumption: second-hand, rental and lending instead of buying new. Every number in the calculation can be opened, traced to its source and replaced with your own. By Henric Barkman.

## Run it

The app is static, with no build step. Serve `app/` with any web server:

```
cd app && python3 -m http.server 8765
```

Tests: `node --test tests/*.test.mjs`

## Method in brief

For a number of circulated items N and the emissions of one new item (a low-high range, kept all the way through):

- **Avoided**: N × new-item emissions × the share that replaces a new purchase (default 50%)
- **Minus trips**: for the share that does *not* replace a new purchase, the car trips to and from the service, divided by the items per visit
- **Minus operations**: the same share times the service's operating emissions per item

Trips and operations are only charged to the share that does not replace a new purchase, because a new purchase would have caused a shop trip too.

All factors and their sources: [app/factors.js](app/factors.js) and [docs/research-factors-2026-09-30.md](docs/research-factors-2026-09-30.md). The original step-by-step method: [docs/PROMPT.md](docs/PROMPT.md).

## License

To be decided.
