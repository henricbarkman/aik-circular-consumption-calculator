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

- **Avoided purchases**: N × the share that replaces a new purchase (default 50%). For a loan, divided by L, the loans that together make one purchase: someone who owns the thing uses it many times, so a loan replaces 1/L of a purchase (skis 1/9, books 1/1). Second hand and repair replace whole purchases.
- **Avoided**: avoided purchases × new-item emissions
- **Minus trips**: every visit's car trips (N divided by the items per visit), minus one shop visit, there and back, for each avoided purchase
- **Minus operations**: (N − avoided purchases) × the service's operating emissions per item

A new purchase would have caused a shop visit and gone through a shop too, so those are subtracted for every avoided purchase. This assumes the shop trip and the shop's emissions per item are the same size as the service's. With whole purchases it is the same as charging the non-replacing share in full and the replacing share for the trips beyond one shop visit, which is how the page counted until the loan change.

New-item emissions run from raw material to the shop wherever the sources allow; the note on each factor says where they do not.

Three methods: bought second hand (two one-way trips), rented or borrowed (four: fetch and return), and repaired (four: drop off and pick up). Renting and borrowing were one calculation under two names, so they are one method; old links with `hur=borrow` still open as rented or borrowed.

Repair differs in two ways. The share that replaces a new purchase is set per product type (82 % for clothes, 50 % for the rest). The repair's own emissions (spare parts, material) are subtracted for every repaired item, not only for the share that does not replace a purchase: the parts are new material either way. Only completed repairs should be counted. Research: [docs/research-repair-2026-09-30.md](docs/research-repair-2026-09-30.md).

Several product types can be entered in the sentence, or read from a list with a product and a count per line (`app/list.js`): CSV, or Excel/ODS (`.xlsx`, `.xls`, `.ods`) read in the browser with the vendored SheetJS build (`app/vendor/`, Apache 2.0, loaded only when a spreadsheet is chosen; the first sheet with content is read, and the report names any other sheets). Every line of the list is shown with what it was counted as; lines the tool does not recognise are listed and left out, never guessed.

All factors and their sources: [app/factors.js](app/factors.js) and [docs/research-factors-2026-09-30.md](docs/research-factors-2026-09-30.md). The original step-by-step method: [docs/PROMPT.md](docs/PROMPT.md).

## Method decisions

Decisions on how the tool calculates, kept so they can be reviewed or presented later. Newest first.

- **2026-09-30, a loan replaces 1/L of a new purchase** (Henric: "Varför inte tänka att ett lån ersätter 1 åttondels nyköp?").
  - Why: someone who owns a pair of skis uses it 7.5 to 10 times (RISE 2020, p. 22). Counting each loan as a whole avoided purchase made loans look far better than they are.
  - L per product type, with its source or reasoning in `app/factors.js`. Henric suggested about 1/6 for skis. The source gives 1/7.5 to 1/10, so the page uses 1/9 and he can change it.
  - L comes on top of the 50 % share: the share asks whether the borrower would otherwise have owned one, L how much of a purchase one loan is. For skis, 1/18 of a purchase per loan. RISE's own best case is about 1/25.
  - A loan is defined per product type where it varies: a month for clothes, two weeks for bikes, e-bikes and tools.
  - Consequence: loans of durable things usually come out negative with the default trips, because a loan takes whole trips and saves a small part of a product. Every library-of-things method found credits a whole product per loan, so their results are 10 to 40 times higher than this page's.
  - Trips and operations were rewritten to one form for all methods: every visit and every item is charged, and one shop visit and one shop's operations are subtracted per avoided purchase. For second hand and repair the numbers are unchanged.
  - Rejected: counting loans per item in the lending (needs the number of loans per item, which a user rarely has), and a whole purchase per loan (the libraries-of-things convention).
- **2026-09-30, books 0.56 kg, and a library's car share of 38 %** (Henric: "Ja", and "bibliotek ligger ofta i närheten så andelen bilresor är antagligen betydligt lägre").
  - 0.56 kg: an average book from a Swedish publisher to the bookshop, Bokbranschens klimatinitiativ 2025, pp. 21 and 22. The report's own 534 g stops at the publisher; the 24 g to the bookshop is added to match the other factors. A book from a foreign publisher, 1.32 kg, is the top of the span.
  - 38 %: Novus for Svensk biblioteksförening 2018, 35 % by car and 8 % don't know. Used when books are all that is borrowed, the same way Myrorna's operations figure is used when clothes are all that is counted.
  - A list with books and other things gets a car share weighted by visits: 38 % for the book loans, 75 % for the rest. That equals giving each row its own share for the trips. Rejected: 38 % only when every row is books, because one garment in a list of a thousand books then moved every book loan to 75 % (found in review 2026-09-30).
  - A bought book is read by one person (KTH 2009), so a library loan replaces a whole purchase (L = 1).
  - Not counted: that a library buys its books new. A library book is lent about 18 times (KB 2024, derived), so each loan carries about 1/18 of a new book.
- **2026-09-30, repair counts as a replacement share, 82 % for clothes and 50 % for the rest** (Henric).
  - Why 82 % for clothes: WRAP measured it in 2025 among 721 customers of clothing repair services, and IVL uses the same figure.
  - Why 50 % for the rest: nothing has been measured for other products. Half matches the second-hand default and the Restart Project's method.
  - How long the repaired item lasts: not asked as a separate question. WRAP's 82 % counts avoided purchases only and leaves the item's remaining life out; IVL uses the same share in a worked example and assumes the repaired item lasts as long as a new one. The page says so.
  - Rejected: 50 % for everything (more conservative, but ignores the only measurement there is), and a life-extension model (it needs the item's age and remaining life, which users do not know).
  - What it affects: the replacement share, a new cost for the repair itself (charged to all repaired items), and the method "lagats" in the sentence.
- **2026-09-30, trips beyond one shop visit are charged to every loan and repair** (Demi, a correction after the method review).
  - Why: the rule that the replacing share pays no trips rested on "a new purchase would have caused a shop trip too". That covers one visit, two one-way trips. A loan or a repair takes four, so two were never offset.
  - What it affects: renting, borrowing and repair. 100 drill loans go from 984 to 895 kg net. Second hand is unchanged.
  - Rejected for now: charging every trip and all operations to every circulation (WRAP's formula). It is the more common method in the literature, but it assumes the new purchase's shop trip is inside the new-item factor, which ADEME's production-to-shop values are not.
- **2026-09-30, renting and borrowing are one method.** Both assumed four one-way trips, so they gave identical results under two names. Old `hur=borrow` links open as the merged method.
- **2026-09-30, a replacement share of 50 % and a car factor of 0.17 kg per km** (Henric).
  - 50 %: Blocket's 2023 measurement. The 2025 figure, 40 %, is shown in the note.
  - 0.17 kg per km: Naturvårdsverket's figure including fuel production. The rejected alternative was 0.138.

## License

To be decided.
