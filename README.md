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

Three methods: bought second hand (two one-way trips), rented or borrowed (four: fetch and return), and repaired (four: drop off and pick up). Renting and borrowing were one calculation under two names, so they are one method; old links with `hur=borrow` still open as rented or borrowed.

Repair differs in two ways. The share that replaces a new purchase is set per product type (82 % for clothes, 50 % for the rest). The repair's own emissions (spare parts, material) are subtracted for every repaired item, not only for the share that does not replace a purchase: the parts are new material either way. Only completed repairs should be counted. Research: [docs/research-repair-2026-09-30.md](docs/research-repair-2026-09-30.md).

Several product types can be entered in the sentence, or read from a list with a product and a count per line (`app/list.js`): CSV, or Excel/ODS (`.xlsx`, `.xls`, `.ods`) read in the browser with the vendored SheetJS build (`app/vendor/`, Apache 2.0, loaded only when a spreadsheet is chosen; the first sheet with content is read, and the report names any other sheets). Every line of the list is shown with what it was counted as; lines the tool does not recognise are listed and left out, never guessed.

All factors and their sources: [app/factors.js](app/factors.js) and [docs/research-factors-2026-09-30.md](docs/research-factors-2026-09-30.md). The original step-by-step method: [docs/PROMPT.md](docs/PROMPT.md).

## Method decisions

Decisions on how the tool calculates, kept so they can be reviewed or presented later. Newest first.

- **2026-09-30, repair counts as a replacement share, 82 % for clothes and 50 % for the rest** (Henric).
  - Why 82 % for clothes: WRAP measured it in 2025 among 721 customers of clothing repair services, and IVL uses the same figure.
  - Why 50 % for the rest: nothing has been measured for other products. Half matches the second-hand default and the Restart Project's method.
  - How long the repaired item lasts: covered by the share rather than asked as a separate question. The fullest published methods (Privett 2018, IVL 2025) build it into the share.
  - Rejected: 50 % for everything (more conservative, but ignores the only measurement there is), and a life-extension model (it needs the item's age and remaining life, which users do not know).
  - What it affects: the replacement share, a new cost for the repair itself (charged to all repaired items), and the method "lagats" in the sentence.
- **2026-09-30, renting and borrowing are one method.** Both assumed four one-way trips, so they gave identical results under two names. Old `hur=borrow` links open as the merged method.
- **2026-09-30, a replacement share of 50 % and a car factor of 0.17 kg per km** (Henric).
  - 50 %: Blocket's 2023 measurement. The 2025 figure, 40 %, is shown in the note.
  - 0.17 kg per km: Naturvårdsverket's figure including fuel production. The rejected alternative was 0.138.

## License

To be decided.
