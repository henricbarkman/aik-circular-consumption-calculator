# CCC, Circular Consumption Calculator

A transparent calculator for the climate benefit of circular consumption: second-hand, rental and lending instead of buying new. Every number in the calculation can be opened, traced to its source and replaced with your own. By Henric Barkman.

## Run it

The app is static, with no build step. Serve `app/` with any web server:

```
cd app && python3 -m http.server 8765
```

Tests: `node --test tests/*.test.mjs`

## Method in brief

For each product type, a number of circulated items N and the emissions of one new item (a typical value per type; the low and high ends of the sources' span are shown beside the result, not used as the headline):

- **Avoided**: N × new-item emissions × the share that replaces a new purchase (default 50%)
- **Minus trips**: for the share that does *not* replace a new purchase, the car trips to and from the service, divided by the items per visit
- **Minus operations**: the same share times the service's operating emissions per item

Trips and operations are only charged to the share that does not replace a new purchase, because a new purchase would have caused a shop trip too.

Several product types can be entered in the sentence, or read from a CSV list with a product and a count per line (`app/list.js`). Every line of the list is shown with what it was counted as; lines the tool does not recognise are listed and left out, never guessed.

All factors and their sources: [app/factors.js](app/factors.js) and [docs/research-factors-2026-09-30.md](docs/research-factors-2026-09-30.md). The original step-by-step method: [docs/PROMPT.md](docs/PROMPT.md).

## License

To be decided.
