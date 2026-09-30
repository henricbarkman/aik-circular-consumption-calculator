# PROGRESS — CCC, Circular Consumption Calculator

## 2026-09-30 (granskning)
- Henric: kör flera granskare, kod, användare, metod och klimatfaktorerna. Alla delar ska vara tipp topp.
- Demi: fem granskare (kod, användare, metod, faktorer i två delar). Rättat:
  - Metod: hyrt, lånat och lagat betalar nu resorna utöver ett butiksbesök även för den del som ersätter ett nyköp (loggat i README). Texterna om lagningsandelen, driften och vad som inte räknas stämmer nu med källorna.
  - Faktorer: kläder 5,2–23,2 kg (ADEME, råvara till butik) i stället för Mistras hela livet; mobiler 55 kg (IVL), datorer 182 kg (ADEME/Arcep 2025) med 89 kg som lägst; tv 328 kg; skidor 29 kg (RISE); köksapparater 36,6 kg; bord 60,1–80,2 kg; elcyklar som egen sort. Lagning av datorer och tv har källsatta värden. ADEME-källorna har rätt årtal.
  - Användare: "+ fler" hittar inte på ett antal, summarader och okända sorter förklaras, redigeringsrutan och skärmläsare fungerar bättre, förklaring av koldioxidekvivalenter.
  - Kod: publiceringsskriptet stoppar varje ostämplad filadress.
- → Väntar på Henric: böcker (svensk källa 0,53 kg gör böcker negativa med standardresorna) och om ett lån ska räknas som ett halvt nyköp (RISE räknar per sak i utlåningen, inte per lån).
- → Sedan: föremål per besök.

## 2026-09-30 (natt)
- Henric: kan CCC inte läsa Excel direkt? Lånat och hyrt ger samma resultat, en kategori. Saknar lagat.
- Demi: Excel (.xlsx, .xls) och .ods läses direkt i webbläsaren; läsaren laddas bara när ett kalkylark väljs, och rapporten säger vilket blad som lästes. Hyrt och lånat är ett sätt, "hyrts eller lånats"; gamla länkar med lånat fungerar. Provat i Firefox och Chrome.
- Henric (senare): 82 % för lagning av kläder är rimligt.
- Demi: "lagats" som tredje sätt. Andelen som ersätter ett nyköp sätts per sort: 82 % för kläder (WRAP 2025, IVL), 50 % för resten. Själva lagningen blir ett eget steg: reservdelar och material räknas för varje lagad sak (0,1 kg per plagg, 3 kg per mobil, 0,2 kg som antagande där källa saknas). Beslutet står under Method decisions i README. Utredningen finns i `docs/research-repair-2026-09-30.md`.
- → Nästa: föremål per besök (för lagning har Privett mätt 1,4 per besök på reparationskaféer).

## 2026-09-30 (sen kväll)
- Henric: knappen "Lägg till en sorts produkt" gick inte att trycka på, och rubrikerna syntes utan uträkning. Ja till att kunna ladda upp en lista.
- Demi: orsaken var cache, inte knappen. Domänen henricbarkman.se låter webbläsare spara .js i fyra timmar medan HTML alltid hämtas färsk, så ny HTML körde gammal JS och kraschade. `bin/deploy.sh` stämplar nu varje filadress med ett fingeravtryck, och allt som bygger på uträkningen är dolt tills den finns. Knappen är nu ett tomt fält i meningen ("+ fler"). Listinläsning (CSV, mall att hämta), där varje rad visas med vad den räknades som. Granskad, fem tysta tapp rättade. Publicerad och provad i Firefox och Chrome.
- → Nästa: utred föremål per besök. Fler sorter i verktyget om listorna visar vad butikerna faktiskt har (lampor, leksaker, husgeråd).

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
