# Průměry skutečných drah v Táboře — 120 hs, sezona 2026/2027

Stav ověřen 8. listopadu 2026. Kuželna KK Lokomotiva Tábor, Skálova 2878 (ČKA venue id 43). Jde o samostatný analytický podklad; není automaticky zveřejněný na webu.

Průměr znamená počet poražených kuželek **na jednu sérii 30 hs (15 plných + 15 dorážky)** na dané fyzické dráze při zápase na 120 hs. Celkový výkon hráčské pozice tvoří čtyři takové série. Hodnoty nejsou přepočtené na 120 hodů na jediné dráze.

## Celkový přehled a výběry

### Celá kuželna (7 zápasů)

| Dráha | Domácí | Hosté | Celkem | Počet sérií | Součet kuželek |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 139,52 | 141,00 | 140,26 | 84 | 11782 |
| 2 | 142,48 | 139,79 | 141,13 | 84 | 11855 |
| 3 | 140,02 | 138,88 | 139,45 | 84 | 11714 |
| 4 | 144,88 | 143,36 | 144,12 | 84 | 12106 |

### Jen zápasy áčka (3 zápasy)

| Dráha | Domácí | Hosté | Celkem | Počet sérií | Součet kuželek |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 139,83 | 134,83 | 137,33 | 36 | 4944 |
| 2 | 144,72 | 141,72 | 143,22 | 36 | 5156 |
| 3 | 136,11 | 141,61 | 138,86 | 36 | 4999 |
| 4 | 147,56 | 150,44 | 149,00 | 36 | 5364 |

### Jen zápasy Hiltonu (4 zápasy)

| Dráha | Domácí | Hosté | Celkem | Počet sérií | Součet kuželek |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 139,29 | 145,63 | 142,46 | 48 | 6838 |
| 2 | 140,79 | 138,33 | 139,56 | 48 | 6699 |
| 3 | 142,96 | 136,83 | 139,90 | 48 | 6715 |
| 4 | 142,88 | 138,04 | 140,46 | 48 | 6742 |

Nejvyšší naměřený průměr v celém vzorku má dráha 4 (144,12), nejnižší dráha 3 (139,45); rozdíl je 4,67 kuželky na 30 hs. V zápasech áčka má dráha 4 průměr 149,00. Jde o popis odehraného vzorku, který ovlivňují také hráči, pořadí sérií a jednotlivé zápasy; sám o sobě nedokazuje vlastnost dráhy.

## Přiřazení sérií ke skutečným drahám

Číslo série v API (laneNumber) je zde pořadí odehrané třicítky, nikoli automaticky fyzické číslo dráhy. Lichost/sudost se bere z pozice v oficiální sestavě, ne z pořadí položky v odpovědi ani z pořadí hráčova jména.

| Strana a pozice v sestavě | 1. série | 2. série | 3. série | 4. série |
| --- | ---: | ---: | ---: | ---: |
| Domácí 1, 3, 5 | 1 | 2 | 4 | 3 |
| Domácí 2, 4, 6 | 3 | 4 | 2 | 1 |
| Hosté 1, 3, 5 | 2 | 1 | 3 | 4 |
| Hosté 2, 4, 6 | 4 | 3 | 1 | 2 |

Domácí pořadí určil vlastník. Odpovídající pořadí hostů vychází ze startu na sousední dráze 2 / 4 a ze stejných pravidel přechodu. Čtyři pořadí přechodů a rozdělení 120 hs na 4 × 30 hs jsou uvedeny v [pravidlech ČKA, čl. 20](https://www.kuzelky.cz/dokumenty/predpisy/STP-2022-07.pdf).
Výpočet pro každou dráhu: součet kuželek ze všech přiřazených třicítek / počet těchto třicítek. Celkový průměr počítá jednotlivé série; nezaokrouhluje nejprve průměry hráčů nebo zápasů. Zaokrouhlení na dvě desetinná místa je až výstupní.

## Zahrnuté zápasy

| Datum | Domácí | Hosté | Oficiální součet domácí : hosté | ID ČKA |
| --- | --- | --- | ---: | ---: |
| 2026-09-26 | KK Lokomotiva Tábor A | SKK Rokycany | 3397 : 3337 | 509 |
| 2026-10-04 | KK Hilton Sezimovo Ústí | TJ Nové Město na Moravě | 3428 : 3333 | 382 |
| 2026-10-10 | KK Lokomotiva Tábor A | TJ Radlice | 3414 : 3481 | 520 |
| 2026-10-17 | KK Hilton Sezimovo Ústí | TJ Centropen Dačice D | 3492 : 3384 | 371 |
| 2026-10-23 | KK Hilton Sezimovo Ústí | TJ BOPO Třebíč | 3248 : 3313 | 393 |
| 2026-10-30 | KK Hilton Sezimovo Ústí | TJ Sokol Nové Hrady | 3414 : 3382 | 360 |
| 2026-11-07 | KK Lokomotiva Tábor A | KK Slavoj Praha B | 3417 : 3417 | 531 |

Čtyři utkání pořádal na stejné kuželně Hilton Sezimovo Ústí; proto jsou zahrnuta do celé kuželny a zároveň oddělena od tří utkání áčka. Zahrnuty jsou všechny nalezené dokončené týmové zápasy na 120 hs na této kuželně v sezoně k datu kontroly, které vrací veřejné API ČKA. Tréninky, turnaje mimo tento zápasový přehled, zápasy na 100 hs, nedokončené zápasy a výkony na jiných kuželnách zahrnuty nejsou.

## Úplnost a střídání

Ověřeno 7 zápasů, 14 týmových výsledků, 84 obsazených hráčských pozic a 336 úplných sérií. Každá dráha má 84 sérií (42 domácích + 42 hostů); ve třech zápasech áčka 36 sérií (18 + 18). Součet všech přiřazených kuželek 47 457 přesně odpovídá součtu oficiálních týmových výsledků; podvýběr áčka má 20 463 kuželek.
Zápas 520 má domácí střídání na pozici 2 při 61. hodu. Zápas 531 má domácí střídání na pozici 6 při 31. hodu a hostující na pozici 3 při 61. hodu. Úplné společné série těchto pozic vrací podrobný zápis s fullLineup=true. Střídání nezakládá další start ani další třicítku; zachovává se dráha a pozice. CSV označuje celou střídanou pozici a nepřisuzuje společný výkon jednomu hráči.
Kontroly: úplná stránka 63 sezonních utkání kuželny a unikátní ID; správná sezona, místo, dokončený stav a zápasová disciplína T120; právě dvě různé strany, šest pozic na každé straně a čtyři jedinečné série na pozici; žádné prázdné/dopočtené starty či chybějící hodnoty; součet plných + dorážky, chyb, kuželek a dílčích bodů proti souhrnům; body každé dvojice podle pořadové série; nezávislá kontrola součtů drah opačným přiřazením.

## Podklady

- [Souhrnné CSV](prumery-drah-tabor-2026-2027-souhrn.csv) obsahuje všechny tři výběry včetně průměrů plných, dorážky a chyb.
- [Rozpis 336 sérií](prumery-drah-tabor-2026-2027-serie.csv) obsahuje ID a datum zápasu, týmy, stranu, pozici v sestavě, pořadí série, skutečnou dráhu a výkon. CSV jsou UTF-8 s BOM, oddělovač středník, desetinná čárka.
- [Veřejný kontrakt ČKA](https://kuzelky.cz/api/v1/public/openapi?variant=public), [sezony](https://kuzelky.cz/api/v1/public/seasons), [životní cyklus a zápis výkonů](https://kuzelky.cz/api/docs/match-lifecycle/).
- [Použitý úplný přehled kuželny s hráčskými sériemi a střídáními](https://kuzelky.cz/api/v1/public/matches?venueId=43&seasonId=20&limit=100&sort=id&fullLineup=true&include=homeTeam.club,awayTeam.club,competition.season,venue,results.playerResults.player,results.playerResults.substitute,results.playerResults.laneResults,results.substitutions.playerOut,results.substitutions.playerIn). Jde o živý zdroj: pozdější opravy nebo dohraná utkání mohou čísla změnit.
Hlubší vztahy results.playerResults.player / substitute / laneResults nejsou všechny vyjmenované v aktuálním public OpenAPI enumu include, ale jejich podporu přímo ověřil tento dotaz i dřívější T-31. Samostatný soutěžní player-match-results přehled vynechává některé střídané pozice a pro úplný výpočet by nestačil. Surové odpovědi s nepotřebnými údaji zůstávají pouze v ignorované pracovní cache.
