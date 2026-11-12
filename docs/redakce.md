# Zkouška redakce novinek — Pages CMS

Stav: místní integrace T-40 je ověřená testy a sestavením webu. Připojení GitHub účtu, skutečné uložení v hostovaném editoru a nasazení se ověřují zvlášť. Web zůstává na stávajícím hostingu a doméně. [Hostovaná služba Pages CMS](https://pagescms.org/) je podle aktuálních podmínek zdarma; nepotřebujeme vlastní CMS server ani databázi.

## Jednorázové připojení majitelem

1. Po schváleném zveřejnění konfigurace do GitHubu otevřete [Pages CMS](https://app.pagescms.org) a přihlaste se svým GitHub účtem.
2. Povolte GitHub App pouze pro repozitář **vojtechkrakora/lokota-web**, nikoli všechny repozitáře. Heslo ani token nikomu neposílejte.
3. Vyberte repozitář a zkušební větev **trial/pages-cms** obsahující připravenou konfiguraci. Pro první zkoušku nepoužívejte produkční main.
4. Editor má načíst existující kořenovou konfiguraci [.pages.yml](../.pages.yml) a nabídnout **Novinky** se zkušebním konceptem. Pokud žádá vytvoření nové konfigurace, zkontrolujte větev; nepřepisujte připravenou konfiguraci prázdnou šablonou.
5. Vyzkoušejte níže uvedený postup. Skutečný test uložení a opětovného otevření musí potvrdit datum, formátování, přílohy, obrázky a stav konceptu. Poté zkontrolujeme změny a sestavení zkušební větve. Případný Cloudflare PR/branch preview není soukromý a jeho vytvoření není potvrzeno touto příručkou.
6. Až po úspěšném testu a rozhodnutí o nasazení přidejte další autory přes emailové pozvánky v Pages CMS. Pozvaní spolupracovníci nepotřebují GitHub účet. Konfigurace redakce není zárukou jemných přístupových práv GitHub App; oprávnění instalace a skutečnou nabídku spolupracovníka ověřte při zkoušce.

Oficiální postup: [rychlé připojení](https://pagescms.org/docs/quick-start/) a [spolupracovníci](https://pagescms.org/docs/configuration/collaborators/). Instalace aplikace vyžaduje majitelovo přihlášení; není součástí místního ověření.

## Napsání článku

1. V záložce **Novinky** založte nový článek. Zkušební koncept je pouze ukázka a nepopisuje skutečnou událost.
2. Ponechte **Koncept** zapnutý. Vyplňte **Nadpis**, **Krátký úvod** a **Text článku**. Datum vyberte v kalendáři; autor je nepovinný. Pole mají české popisky, některá ovládací tlačítka služby mohou být anglicky.
3. Text formátujte nadpisy, tučným písmem, seznamy a odkazy. Pro začátek vkládejte prostý text a upravte jej v editoru; zachování složitého formátování při kopírování z Wordu není ověřené.
4. Volitelně přidejte **Úvodní fotografii** a **Další fotografie**. Vyberte JPG, PNG nebo WebP a vždy doplňte, co je na snímku. Popisek pod snímkem je nepovinný. Přiměřeně velké soubory urychlí nahrávání; optimalizované webové varianty vytváří Astro. Fotografie se nyní vkládají těmito poli, nikoli přímo do textu.
5. Volitelně přidejte **Přílohy ke stažení**, vyplňte čitelný název odkazu a nahrajte PDF nebo CSV do 25 MiB. Jiné formáty nejsou v této zkoušce povolené.
6. Uložte a znovu otevřete článek. Zkontrolujte odstavce, formátování, fotografie, popisy a přílohy. Adresu a název souboru vytváří editor automaticky; změna nadpisu adresu nezmění.

První zkoušku ukončete uložením konceptu ve zkušební větvi. Uložení v editoru zapisuje do GitHubu; není to jen místní náhled. Zkušební větev se automaticky nepřidá do produkčního webu.

## Pozdější zveřejnění po přijetí zkoušky

Po schváleném zapojení do produkčního postupu se přepínač **Koncept** vypne a článek uloží do publikované větve. Datum zveřejnění nesmí být v budoucnu; automatické časování není součástí zkoušky. Web článek ukáže po úspěšném sestavení a nasazení. Vydání se může zdržet při nedostupnosti povinných sportovních dat, přestože editor článek správně uložil. Samotné uložení nepotvrzuje úspěšné nasazení.

Koncept skryje článek z webových stránek, ale nečiní GitHub soukromým. Přílohy z veřejného adresáře se mohou zveřejnit i bez vydaného článku. Nevkládejte soukromé dokumenty. Zkušební redakce nabízí pouze nové články v samostatné kolekci; stávající ručně sestavené zápasové reporty se zde zatím neupravují, protože jejich HTML není ověřené pro vizuální editor.

## Kontrola správcem

- Ověřit skutečný přístup a uložené soubory na zkušební větvi, včetně prázdných volitelných polí a stabilní skryté adresy.
- Ověřit nové datum/české znaky/tučné písmo/nadpisy/seznamy/odkazy, nahrání i opětovný výběr fotografie, cover/gallery alt a pojmenované přílohy.
- Při použití připnutého Node spustit `npm run verify`, `npm run test:editorial` a `npm run build`; zkontrolovat i vygenerovaný detail, přehledy a stažení souboru. Vše musí fungovat bez JavaScriptu.
- Před přijetím zkoušky ověřit i vydání testovacího článku pouze v preview, jeho opětovné skrytí a zobrazení na mobilu. Žádný syntetický článek nevydávat na produkci.
- Git publikaci, skutečnou zkoušku editoru, nasazení a přijetí majitelem zaznamenat odděleně v [tasks.md](tasks.md), T-40.
