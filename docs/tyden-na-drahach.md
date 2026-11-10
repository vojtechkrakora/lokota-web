# Týden na drahách — redakční postup

Postup vyžádaný majitelem 8. 11. 2026 pro opakované zadání „Vytvoř Týden na drahách“. Vychází z prvního vydání za 2.–8. 11. 2026 (T-32), jeho ověřených podkladů a majitelova pravidla: „jsi zaujatý táborský fanoušek. Vždy hledáme pozitiva, nikdy negativa“.

Jde o redakční práci v existujícím modelu článků (FR-02/FR-03/FR-05/FR-09; D-03/D-08/D-09), nikoli o nový generátor nebo hráčské statistiky na webu. Při každém vydání vytvoř nový záznam úkolu a ověření v tasks.md. Ukázkovým článkem je [první vydání](../src/content/news/2026-11-08-tyden-na-drahach.md); přebírej jeho strukturu a tón, nikoli výsledky, počty nebo tvrzení platná jen pro daný týden.

## 1. Co znamená krátké zadání

- „Vytvoř / připrav / napiš Týden na drahách“ znamená samostatně dohledat podklady a vytvořit ověřený lokální koncept článku s `draft: true`, včetně přehledu všech doložených klubových startů. Majitel nemusí znovu zadávat tón, tabulky ani způsob zpracování střídání.
- Přednost má období uvedené v zadání. Bez období použij při nedělním zadání právě probíhající týden od pondělí, jinak poslední ukončený týden pondělí–neděle. Jde o výchozí redakční volbu; zapiš konkrétní rozsah a okamžik ověření. Relativní data vyhodnocuj v Europe/Prague.
- V neděli neoznačuj přehled za konečný, pokud ještě zbývá klubový zápas nebo nedokončený zápis. Uveď, do kdy jsou výsledky ověřené, a co ještě čeká. Nezahrnuj budoucí výkony.
- Zadání „vydej / publikuj / nasaď“ zpracuj podle již uděleného oprávnění v konverzaci. Samotné vytvoření článku neopravňuje k publikaci, commitu ani pushi. Nežádej znovu o již udělené oprávnění.
- Pokud stejné období už má článek, nejprve ho najdi a rozliš opravu od nového vydání; nevytvářej duplicitní slug. Při opravě zachovej existující URL.

## 2. Podklady z ČKA a úplnost týdne

1. Přečti AGENTS.md, relevantní redakční a datová pravidla a aktuální model obsahu. Identitu klubu a API přebírej ze [site.ts](../src/site.ts), nikoli z nové kopie konfigurace.
2. Před použitím API ověř jeho současnou [veřejnou OpenAPI specifikaci](https://kuzelky.cz/api/v1/public/openapi?variant=public) a [konvence](https://kuzelky.cz/api/docs/conventions/). Níže uvedené názvy jsou ověřené zkušenosti z listopadu 2026, ne záruka neměnného kontraktu. Pokud jsou dokumentace či data nedostupné, přiznej omezení; nedeklaruj nové ověření podle starých souborů.
3. Používej veřejné GET požadavky bez přihlášení. Sezonu zjisti podle ověřených dat a pravidel projektu; pro historické období vyber sezonu, do níž zápasy skutečně patří. Nepřenášej sezonní ID z prvního vydání.
4. Načti všechny klubové zápasy doma i venku, projdi celé stránkování a ověř celkový počet i jedinečnost ID. Výběr týdne dělej podle skutečného data utkání, nikoli čísla kola, data článku nebo pořadí odpovědi. Přeložené zápasy patří do týdne, kdy se skutečně hrály podle aktuálního zápisu.
5. Zkontroluj všechna nalezená družstva. První vydání zahrnovalo A–E; není to pravidlo, že každý týden hraje všech pět týmů nebo každý právě jednou. Družstvo bez zápasu není chybějící výsledek. Derby dvou našich družstev je jeden zápas, ale do hráčských tabulek patří obě klubové sestavy.
6. Odděl dokončená utkání s platným zápisem od plánovaných, rozehraných, odložených a kontumačních. Kontumaci lze uvést jako oficiální týmový výsledek s označením; nepřidávej hráčské starty, které se neodehrály. Z neúplného nebo rozporného zápisu nedělej kompletní výsledkovou tabulku.
7. Pro každý použitý zápas načti úplný detail včetně obou týmů a klubů, soutěže/disciplíny, výsledků, hráčů, drah a střídání. Ověř, že požadované vztahy skutečně přišly; ignorované `include` nemusí skončit HTTP chybou.
8. Ulož potřebné pracovní odpovědi a stručnou faktickou tabulku do ignorované .cache oblasti pro dané období. Do článku a evidence dej zdrojové odkazy a datum ověření. Nespoléhej na přetrvání souborů v /tmp, nekopíruj soukromé nebo nepotřebné údaje a nepřidávej nové dotazy do sestavení webu.

Při výpadku respektuj `Retry-After` a omezené opakování. Staré výsledky vydávej za staré, ne za čerstvě ověřené. Pokud není z čeho ověřit úplnost, připrav jen doložitelný koncept s jasným omezením. Při týdnu bez odehraných zápasů nevyráběj prázdné žebříčky ani domnělé výkony.

## 3. Sestavy a střídání — povinná kontrola

Základní detail dříve skrýval hráče a dráhy na střídaných pozicích. Neuzavírej proto rešerši tvrzením „API jména nevrací“, dokud nezkontroluješ plnou sestavu a vztahy střídání.

Při prvním vydání fungoval detail `/matches/{id}` s `fullLineup=true` a těmito vztahy v `include` (vždy znovu ověř proti aktuálnímu kontraktu):

```text
homeTeam,homeTeam.club,awayTeam,awayTeam.club,competition,competition.season,
results,results.playerResults,results.playerResults.player,
results.playerResults.laneResults,results.playerResults.substitute,
results.substitutions,results.substitutions.playerOut,
results.substitutions.playerIn,venue
```

- Domácí/hostující výsledek přiřazuj podle `isHome` a klubové identity, nikoli indexu v poli. Hráče, střídání a pozice spojuj ověřenými ID a pozicemi v zápisu, nikoli podobností jmen nebo pořadím odpovědi.
- Rozliš skutečnou obsazenou pozici, prázdnou pozici a případný samostatný záznam náhradníka. Nedvoj započtené součty ani počet startů. Zkontroluj všechny záznamy střídání; při řetězci více střídání zachovej všechny doložené účastníky v pořadí.
- Souhrnný výkon střídané pozice uváděj jednou, s oběma jmény a výslovným označením společného výkonu. Stejně společný je výsledek celého souboje. Nelze ho každému hráči připsat zvlášť ani rozdělit odhadem.
- Přidej doložený hod střídání. Není-li doložen, vynech tento detail; při nevyřešeném rozporu označ omezení. Nikdy nepřebírej „31. hod“ jako pevné pravidlo pro další zápasy.
- Rozliš počet obsazených pozic/startů od počtu jmen účastníků. Týden s více zápasy může mít opakované starty stejného člověka; neslučuj je do jednoho výsledku.

Příklad zápisu z prvního vydání: `David Kášek → Ondřej Novák* | A | 546 | 0`, s poznámkou „546 kuželek je jejich společný výkon; střídání při 31. hodu“. Jména, čísla i načasování patří pouze k tomuto ověřenému zápasu.

## 4. Tabulky hráčských výkonů

- Disciplínu určuj z oficiální soutěže/zápisu každého utkání. `T120` zobrazuj jako **120 hs**, `T100` jako **100 hs**. Nepředpokládej trvale A = 120 hs a ostatní = 100 hs; neznámou disciplínu nejprve vysvětli z oficiálních podkladů.
- Použij samostatné tabulky „Všechny naše výkony na 120 hs“ a „Všechny naše výkony na 100 hs“, pokud jsou v týdnu obě disciplíny. Prázdnou disciplínu vynech. Další skutečná disciplína potřebuje vlastní označený přehled.
- Základní sloupce jsou **Hráč / hráčka | Tým | Kuželky | Hráčský bod**. Uveď všechny doložené obsazené klubové pozice, nejen nejvyšší výkony. Pro více zápasů stejného družstva přidej srozumitelné rozlišení startu datem a soupeřem, ideálně další sloupec Zápas; každý start je samostatný řádek.
- Řaď sestupně podle výkonu pouze uvnitř stejné disciplíny. Shodné výkony jsou shodné; stabilní pořadí podle týmu, zápasu a pozice nesmí předstírat sportovní rozhodnutí o pořadí.
- Nedělej společný absolutní žebříček obou disciplín, přepočet na hod ani smyšlený srovnávací index. Neoznačuj celkového vítěze týdne porovnáním 100 a 120 hs.
- Stručně vysvětli, že jde o jednotlivé starty na různých kuželnách. Není to dlouhodobý žebříček kvality hráčů.
- Rozliš **hráčský bod** za souboj, **body za dráhy**, **týmový výsledek zápasu** a **body do ligové tabulky**. Zachovej nuly i půlbody, používej český zápis. Chybějící hodnotu nikdy nenahrazuj nulou.

## 5. Táborský hlas a stavba článku

Piš česky, lidsky a jako náš fanoušek: „naši“, „přidali jsme“, „udělali nám radost“. Používej KK Lokomotiva Tábor, Lokomotiva nebo Tábor; nepoužívej veřejně interní název Lokota.

Hledej konkrétní pozitiva i u družstva bez výhry: vyhraný souboj, dráhu, nejvyšší týmový výkon nebo jiný doložený moment. Vynech kritiku, výčitky, formulace o zklamání a hledání viníků. Oficiální výsledky v úplném přehledu zachovej přesně i tehdy, když pro nás nejsou vítězné. Pozitivní tón nesmí změnit fakta, z neúspěchu udělat vítězství nebo část týmu zamlčet.

Nevymýšlej atmosféru, emoce konkrétních lidí, citace, přezdívky, zranění, osobní rekordy, formu nebo historická prvenství. „Nejvyšší náš výkon týdne na 120 hs“ vyžaduje ověřenou úplnost dané disciplíny; „nejvyšší výkon zápasu“ vyžaduje kontrolu soupeře. Při shodě výslovně přiznej sdílené prvenství. „Osobák“, „nejlepší v sezoně“ a podobná tvrzení vynech bez ověřené historie.

Doporučené pořadí:

1. **Titulek:** „Týden na drahách: …“ a dva až tři skutečné pozitivní motivy. Nevynucuj šestistovku či vítězství, pokud nebyly.
2. **Perex:** přesné období a hlavní radosti týdne; neměň ho na pouhý výpis skóre.
3. **Krátké odstavce o týmech:** vyzdvihni konkrétní hráčky/hráče a doložené momenty. Pokryj všechny týmy, které hrály; drobnější příběhy lze spojit. Existující reporty prolinkuj, nevytvářej neexistující cíle.
4. **Naše zápasy v kostce:** úplné oficiální výsledky s datem, týmy v pořadí domácí–hosté, body a kuželkami. Kontumace či čekající zápis označ pravdivě.
5. **Všechny naše výkony:** oddělené tabulky disciplín, vysvětlení bodů a poznámky ke střídání.
6. **Krátké poděkování a povzbuzení:** klubově, bez hodnocení lidí podle pořadí v tabulce.
7. **Zdroje:** odkazy na všechny použité oficiální zápisy, datum ověření, období a případná omezení pokrytí.

## 6. Soubor, titulní obrázek a náhled

Použij existující Markdown frontmatter a ověř ho proti aktuálnímu schématu. Název souboru může mít podobu `YYYY-MM-DD-tyden-na-drahach.md`, kde první datum je skutečné datum vytvoření/vydání. Slug vychází z reportovaného období, například `tyden-na-drahach-2026-11-02-08`; přes rok/měsíc zvol jednoznačnou variantu. `publicationDate` není automaticky datum posledního zápasu a publikovaný článek nesmí být datovaný do budoucna.

- Výchozí koncept výslovně nastav na `draft: true` — model jinak publikuje standardně. Připrav titulek, stručné `summary`, text, zdroje a případný validní `cover`.
- Dodaný obrázek ulož do repozitáře a zachovej původní obsah, logo, proporce a celý titulek. Použij existující lokální Astro varianty, smysluplný český alt a pravdivý popisek.
- Je-li to grafika nebo AI ilustrace, popiš ji jako ilustraci, nikoli fotografii skutečného utkání. Nevymýšlej osoby, místo ani datum fotografie.
- Bez dodaného obrázku není nutné zastavit článek: použij vhodnou existující fotografii s pravdivým kontextem, nebo vynech cover a využij zavedený motiv drah. Starý týdenní plakát s konkrétním titulkem/výsledky nepoužívej pro jiné období. Generování nové grafiky je samostatný výslovný požadavek; pak postupuj podle dostupné dovednosti imagegen a zachovej skutečné klubové logo.
- Zkontroluj hlavní i všechny tři malé náhledy, seznam novinek a detail článku na počítači i telefonu. Celý titulek a logo v obrázku musí zůstat viditelné, obraz nesmí být natažený a šířka detailu musí souhlasit s textem. Ověř také zalamování tabulek a zvětšený text.
- Návrh vzhledu tvoř v existujících komponentách. Nové vydání samo o sobě není důvod měnit globální CSS nebo zavádět nový layout. Vždy rozliš místní náhled od skutečně nasazené verze.
- Koncept nezveřejňuj přepnutím na `draft: false` jen kvůli náhledu. Použij případný izolovaný dočasný náhled, po kontrole vrať stav a ověř vyloučení konceptu z veřejných výstupů. Git a veřejné preview nejsou soukromá redakce.

## 7. Kontrola před předáním a vydáním

1. Nezávisle porovnej faktické podklady s každým řádkem článku: období, zápasy, domácí/hosté, týmy, disciplíny, jména, výsledky a body. Zkontroluj jedinečnost klíče zápas–strana–pozice a úplnost všech zahrnutých sestav.
2. Zkontroluj součty výkonů proti oficiálním týmovým součtům a součty dostupných úplných drah proti hráčským souhrnům. Pro střídání používej společnou pozici právě jednou. Případné kontumační/korigované/neúplné údaje posuzuj podle skutečného zápisu; nevynucuj shodu vymyšlenými čísly. Nerozpočítávej týmové body na hráče.
3. Ověř každé střídání, pokrytí všech doložených účastníků a počet řádků/startů oproti počtu osob. Neopisuj testové očekávání „5 zápasů / 24 řádků / 25 jmen“ z prvního týdne.
4. Projdi pozitivní tón, přesnost superlativů a úplnost zdrojů. Odkazy musí vést na skutečné relevantní zápisy a reporty.
5. Na připnuté verzi Node spusť přiměřené obsahové kontroly. `npm run verify` ověřuje obsah/typy/testy bez API; `npm run build` je produkční sestavení s čerstvými daty a kontrolou výstupu. U konceptu ověř nepřítomnost ve veřejných cestách, seznamech, metadatech a obrázcích; při vydání naopak správný článek, tabulky, titulní obrázek a zařazení na homepage, v novinkách a archivu. Fixture build nikdy nepoužívej k vydání.
6. Provedené kontroly, počty podle aktuálního týdne, zdroje, datum ověření a zbývající omezení zaznamenej v tasks.md. Nedeklaruj browser kontrolu nebo build, který neproběhl.
7. Předání konceptu stručně shrň: období, hlavní motivy, pokrytí týmů/startů, stav obrázku a náhled. Neptej se znovu na již zapsaná pravidla.
8. Při oprávněném vydání přepni `draft: false`, ověř výsledný výstup, commitni pouze dané vydání a jeho evidenci, pushni a ověř přesný commit, CI, Pages a skutečný veřejný článek včetně mobilu. Úspěšný push ani přijatý build nejsou doklad nasazení.
9. Selže-li nasazení kvůli povinnému API, zachovej předchozí funkční web a oznam přesný stav. Nenahrazuj data fixtures, nepředstírej úspěch a nezaváděj náhradní publikační infrastrukturu. Po obnově zdroje pokračuj v již autorizovaném vydání bez opakované žádosti o souhlas.
