# PROGRESS — CCC, Circular Consumption Calculator

## 2026-09-30 (kväll)
- Henric: spannet i rubriken blir tokigt, utgå från ett mittenvärde (~10 kg per plagg) om användaren inte vet mer. Hur gör man med flera sorters produkter? Listan såg knäpp ut när den öppnades.
- Demi: ett typiskt värde per kategori (kläder 9 kg enligt Myrorna/Erikshjälpen, annars mitten av källans spann), spannet som en rad under resultatet. Meningen tar flera sorters produkter; resor räknas som besök per sort. Rättade listans upprepade pil och jättestora alternativ. Granskad, ett decimalfel i redigeringsrutorna rättat. Publicerad.
- → Nästa: utred föremål per besök. Uppladdning av en lista (CSV) för butiker med många sorter, om rad-för-rad blir för trögt.

## 2026-09-30 (eftermiddag)
- Henric: namnet CCC på ccc.henricbarkman.se, inget om Swinga, 50 % och 0,17 gäller. Prototypen kändes för mobilanpassad, den används mest på dator.
- Demi: datorlayout med resultatet i en fast panel bredvid frågan och stegen. Adversariell granskning: länkparametrar gick att få att krascha sidan eller ge fel resultat, avrundning dolde värdet som räknades; allt rättat och provat i webbläsare. Drift för annat än kläder märkt som antagande. Publicerad på Cloudflare Pages.
- → Nästa: utred antagandena om föremål per besök (Henric: "nästa steg"). Sedan inbäddningsläge för Arvika och Smarta Kartan, engelska, CSV-uppladdning.

## 2026-09-30
- Demi: utredde swinga.coop/calculator (AgentiveHub-skriptet 404, GPT-länken har 0 i stället för O). Ingen gammal kod finns.
- Henric: bygg nytt från formlerna, under henricbarkman.se, hans egen stil, transparent uträkning.
- Demi: statisk prototyp i `app/` (ingen byggprocess) på `feature/webapp`. Alla tal källsatta (`docs/research-factors-2026-09-30.md`); kategorier utan citerbar källa strukna.
- Fynd: kläder 1–20 kg per plagg ger lågt netto nära noll (22 kg för 1 200 plagg), resorna för den icke-ersättande andelen äter upp den låga nyttan.
- → Nästa: väntar på Henric: namn/adress (klimatnytta.henricbarkman.se), Swinga i sidfoten, ersättningsandel 50 % eller Blockets 40 %, bilfaktor 0,17 (NV, inkl. bränsleproduktion) eller 0,138. Sedan: tester mot handräknade exempel, granskning, deploy till Cloudflare Pages, inbäddningsläge.
