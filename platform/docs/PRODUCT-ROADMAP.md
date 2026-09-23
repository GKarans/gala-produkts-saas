# Event Photo Platform: attīstības plāns

Atjaunots: 12.09.2026. Šis ir nākotnes darba saraksts, nevis apliecinājums gatavībai publiskai pārdošanai.

Mērķis: klients patstāvīgi sagatavo pasākumu, viesi bez konta pievieno foto, organizators saņem visus saglabātos foto, un parastās kļūmes ir atkopjamas. Platformas izmaksām un datu glabāšanai jābūt kontrolējamām.

## Avots un robežas

Pilns lietotāja iesniegtais ārējais ieteikumu saraksts saglabāts [oriģinālajā teksta dokumentā](reference/platform-review-original.txt). Tajā palikuši visi sākotnējie punkti, atkārtojumi un autora ieteikumi. Tas ir atsauces materiāls, nevis projekta komandas vai automātiski izpildāmas instrukcijas. Norāde uz konkrētu cita rīka Security Analyst Agent nav šī projekta prasība; prasība ir neatkarīga drošības pārbaude.

Šeit atkārtojumi apvienoti darba posmos. Pašreizējās prakses robežas nosaka [MVP scope](mvp-scope.md). Jaunu komerciālu funkciju ieviešana automātiski nepaplašina prakses plānu. Plāns pats par sevi nepievieno nostrādātas stundas.

- Saglabāt Netlify + Supabase, kamēr mērījumi nepamato maiņu; stack maiņu saskaņot atsevišķi.
- Produkts paliek photo-only. Video, seju atpazīšana, automātisks foto redaktors un native apps nav šī plāna palaišanas prasības.
- 90 dienu sadalījums avotā ir orientieris pēc prakses, nevis termiņa vai darba apjoma solījums.
- Publiska pārdošana nav atkarīga no visu iespējamo funkciju pabeigšanas. Obligāti ir zemāk noteiktie konkrētā piedāvājuma palaišanas kritēriji.

## Statusi

NEUZSĀKTS: nākotnes darbs. DAĻĒJI: ir pamats, bet kritērijs nav izpildīts. LOKĀLI: kods un lokālie testi ir, production pieņemšana vēl nav apstiprināta. PĀRBAUDĪTS: kritērijs izpildīts mērķa vidē un pievienots pierādījums. ATLIKTS: apzināti ārpus tuvākā laidiena.

Checkbox atzīmēt tikai pēc pieņemšanas testa, nevis pēc koda uzrakstīšanas. Katram pabeigtam punktam pievienot datumu, commit, vides/deploy versiju un testa saiti. Ja nav pierādījuma, statusu nepaaugstināt.

## Pašreizējais atskaites punkts

| Joma | Statuss uz 12.09.2026. | Kas palicis |
| --- | --- | --- |
| Auth, event, kamera, privātā galerija | Esošs MVP ar iepriekšējiem reāliem testiem | Atkārtota regresija pēc jaunajiem labojumiem |
| ZIP pilnīgums, sesijas atkārtota saglabāšana, skatu sacensības | LOKĀLI | Izvietošana un reālā tīkla tests; ilgstoši servera eksporti vēl nav |
| Upload retry, uploading stāvoklis, dzēšanas/cover tīrīšana | LOKĀLI | Migrācija un production pārbaude; fonā strādājošs cleanup vēl nav |
| Nākotnes eventu pogas, Riga datumi, Refresh, lapošana | LOKĀLI | Production regresija; pulksteņa laika lauki vēl nav |
| Viena komanda unit/SQL/browser testiem | LOKĀLI | Tīra checkout/CI un izolēta Supabase integrācija |
| Viesu galerija esošajā saitē | DAĻĒJI | Iepriekš sagatavota un lietotājs veica backend uzstādīšanu; pilnā production plūsma nav šeit apstiprināta |
| Maksājumi, tarifi, billing, sistēmas īpašnieka admin | NEUZSĀKTS | Piedāvājuma izvēle un pakāpeniska ieviešana |

Tehniskās robežas: [uzticamības labojumi](reliability.md), [viesu galerija](guest-gallery.md), [testu pārskats](testing-report.md). Šis dokuments šajā reizē kodu vai production atkārtoti neauditē.

## A. Pabeigt stabilitātes laidienu

Prioritāte P0. Priekšnosacījums: sagatavotās migrācijas un lokālie labojumi.

- [ ] A1 LOKĀLI: pilns ZIP ar ieslēgtiem filtriem un vairākām metadatu lapām. Tests: katrs saglabātais foto ir eksportā vienreiz.
- [ ] A2 LOKĀLI: atkārtota sagatavotā ZIP saglabāšana un kļūdainas marķiera atbildes atkopšana. Tests: nav atkārtotu foto pieprasījumu atvērtajā sesijā; robeža pēc reload ir skaidra.
- [ ] A3 LOKĀLI: A -> B galerijas/dizaina/preview maiņa un logout uz lēna tīkla. Tests: A atbilde neparādās B skatā vai cita konta sesijā.
- [ ] A4 LOKĀLI: upload UUID, atsevišķi failu/metadatu posmi un foreground retry. Tests: pārtraukt katru posmu; pēc retry nav dublikātu, success tikai ar abiem failiem.
- [ ] A5 LOKĀLI: atkopjama foto dzēšana un cover tīrīšana. Tests: pārtraukta DB/Storage darbība paliek uzskaitīta un pēc retry sasniedz konsekventu stāvokli.
- [ ] A6 NEUZSĀKTS: pieprasījumu timeout un saprotama atcelšana/discard nepabeigtam upload; tests arī tad, ja events aizveras sūtīšanas laikā.
- [ ] A7 NEUZSĀKTS: identificēt agrākos orphan failus un foto bez thumbnail; vispirms read-only pārskats, pēc tam atsevišķi saskaņota atjaunošana/tīrīšana ar izmaksu aplēsi.
- [ ] A8 LOKĀLI: npm ci, pārlūka uzstādīšana un npm test no tīra checkout; piesaistīt regresijas katram P0 defektam.
- [ ] A9 NEUZSĀKTS: reāls Android, iPhone un vājāka telefona tests ar 10 secīgiem foto, offline/retry, kameras atcelšanu un atgriešanos no citas app.

Pieņemšana: nav neatrisinātu foto pazaudēšanas, starpkontu datu vai nepilna eksporta defektu; testi un migrāciju versijas dokumentētas. Ar lokāliem imitēta API testiem nepietiek.

## B. Eventa laiks un dzīves cikls

Prioritāte P1; A pirms production izmantošanas.

- [ ] B1 DAĻĒJI: atsevišķa eventa/datumu un izskata vadība; nākotnes eventam sagatavojams dizains, links un QR.
- [ ] B2 NEUZSĀKTS: sākuma/beigu pulksteņa laiks, upload logs un skaidra IANA laika zona. Sākuma variants Europe/Riga; starptautiskām zonām atsevišķs lēmums.
- [ ] B3 NEUZSĀKTS: serveris vienādi nosaka upload, ZIP un galerijas kopīgošanas robežas. Esošo datumu eventu migrācija saglabā visas dienas nozīmi. Testēt pusnakti, vasaras/ziemas laiku un atšķirīgu viesa zonu.
- [ ] B4 NEUZSĀKTS: paredzams scheduled/live/paused/completed skats; nākotnes viesim norādīts atvēršanas brīdis. Brīdinājums, mainot periodu un ar to saistītos termiņus.
- [ ] B5 DAĻĒJI: atdalīt Archive, Restore un Permanent delete. Pēdējai darbībai atsevišķs apstiprinājums; definēt, ko drīkst atjaunot un līdz kuram datumam.
- [ ] B6 NEUZSĀKTS: retention deadline datubāzē, redzams lietotājam; plānots cleanup ar retry un atskaiti, nevis atkarība no dashboard atvēršanas.
- [ ] B7 ATLIKTS: drafts/publish, eventa apraksts, dublēšana un templates, ja pilotā tie vajadzīgi.

Pieņemšana: pasākumu var sagatavot nedēļu iepriekš; pēc norādītā beigu laika iespējama kopīgošana bez gaidīšanas līdz pusnaktij; termiņi ir vienādi serverī un saskarnē.

## C. Mobilā foto plūsma

Prioritāte P1; vispirms stabils A4.

- [ ] C1 NEUZSĀKTS: Take photo un Choose photos, vairāku foto atlase un rinda ar sākotnēji 1-2 paralēliem upload.
- [ ] C2 NEUZSĀKTS: katram foto priekšskatījums, progress, retry/remove un kopējais veiksmīgo/nepabeigto skaits.
- [ ] C3 DAĻĒJI: stabili upload ID, idempotence un ierobežots automātisks retry tikai īslaicīgām kļūmēm; atšķirt nederīgu failu, slēgtu eventu un tīkla kļūdu.
- [ ] C4 NEUZSĀKTS: decode vienreiz, pareiza orientācija, adaptīva kompresija, HEIC/HEIF atbalsta vai skaidras atteikuma stratēģija; atmiņas tests lielām bildēm.
- [ ] C5 NEUZSĀKTS: skaidri izvēlēties, glabājam optimizēto kopiju, oriģinālu vai abus. Eksportu nesaukt par oriģinālu, ja oriģināls nav saglabāts.
- [ ] C6 ATLIKTS: IndexedDB pending foto glabāšana ar apjoma robežu, lietotāja izvēli un dzēšanu. Nepromisēt universālu background upload.
- [ ] C7 NEUZSĀKTS: release matrica: Android/iPhone/vecāks telefons, 20 atlasīti foto, vājš Wi-Fi/mobilais tīkls, app pārslēgšana, reload, kameras atcelšana un eventa aizvēršana upload laikā.

Pieņemšana: katram no 20 atlasītajiem foto ir skaidrs iznākums; atkārtojot kļūmi, nav dublikātu vai klusās pazušanas.

## D. Galerijas, eksports un QR

Prioritāte P1/P2; lielo eksportu worker izvēli pamatot ar mērījumiem.

- [ ] D1 DAĻĒJI: datubāzes lapošana, stabila secība, Refresh un URL expiry atjaunošana; vēlāk cursor pagination un pieauguma ielāde.
- [ ] D2 NEUZSĀKTS: Last updated un mērena aktīva skata atjaunināšana; mērīt polling/realtime izmaksas.
- [ ] D3 DAĻĒJI: thumbnail grid, preview, tastatūra/swipe, filtrs pēc viesa/datuma, saprotami tukšie un daļējas kļūmes stāvokļi.
- [ ] D4 NEUZSĀKTS: multi-select, bulk delete ar apstiprinājumu, atsevišķi Export all un Export selected; vispirms izvēlēties nepieciešamās darbības pilotam.
- [ ] D5 NEUZSĀKTS: exports ieraksti un fona darbi queued/processing/ready/failed; fiksēts failu saraksts, progress, timeout, retry, expiry un gatavā arhīva atkārtota izsniegšana pēc reload.
- [ ] D6 NEUZSĀKTS: servera thumbnail ģenerēšana/atjaunošana un redzams processing/failed stāvoklis; jobs neizpildās divreiz pēc atkārtota ziņojuma.
- [ ] D7 DAĻĒJI: viesu sharing slēdzis, termiņš, preview/download; atšķirīgi closed/expired/quota/network paziņojumi un redzams atlikums organizatoram.
- [ ] D8 NEUZSĀKTS: mērīt sarakstu, thumbnail un pilno foto izmaksas atsevišķi; hardcoded 2000 pieprasījumu limitu aizvietot ar pārbaudītu produkta konfigurāciju.
- [ ] D9 NEUZSĀKTS: drukājami QR plakāti/galda kartītes ar nosaukumu un īsu instrukciju; drukas priekšskatījumam jāietilpst vienā A5 ainavas lapā bez API adreses un satura sadalīšanas. Pārbaudīt PDF un reālu izdruku/QR skenēšanu. Saites maiņai brīdināt par veco QR nederīgumu.
- [ ] D11 NEUZSĀKTS: paplašināt QR dizaina redaktoru: brīvi pārvietot visus teksta blokus, rediģēt apakšējo instrukciju un tās novietojumu, kā arī redzami atšķirt saglabāto no nesaglabātā dizaina. Pieņemšana: katrs drukā redzamais teksta elements ir rediģējams un pārvietojams, un pēc saglabāšanas atjaunojas pareizi.
- [ ] D10 ATLIKTS: publicējamo foto atlase/moderācija, ja tas ir pārdotā pakalpojuma nosacījums.

Pieņemšana: visi saglabātie foto ir izgūstami, liels eksports atkopjams pēc pārlādes, un parasta viesu pārlūkošana neiztērē kvotu bez saprotama skaidrojuma.

## E. Konts un klienta darba vide

Prioritāte P1 minimumam, P2 paplašinājumiem.

- [ ] E1 DAĻĒJI: register/verify/login/logout/reset/session un nederīgas/izbeigušās e-pasta saites; pilns tests jaunam lietotājam bez palīdzības.
- [ ] E2 NEUZSĀKTS: profila rediģēšana, e-pasta maiņa, account settings un konta dzēšanas pieprasījums ar skaidrām sekām foto/maksājumiem.
- [ ] E3 NEUZSĀKTS: vienkāršs onboarding un noderīgi empty states; nepabeigtās eventa formas saglabāšana, ja nepieciešams.
- [ ] E4 DAĻĒJI: upcoming/live/completed/archived saraksti, meklēšana/kārtošana, foto skaits, piekļuve support un skaidra Create event darbība.
- [ ] E5 NEUZSĀKTS: iegādātās iespējas, atlikusī kvota un glabāšanas/brīdinājumu termiņi klienta dashboard.
- [ ] E6 NEUZSĀKTS: piekļūstamība: dialogu/tabs semantika, fokuss, tastatūra, reduced motion, kontrasts abās tēmās, zoom un mobilā tastatūra.
- [ ] E7 ATLIKTS: pielāgots e-pasta sūtītājs ar `lumiq.cam` domēnu un zīmola veidnēm. Vēlāk izvēlēties e-pasta piegādātāju, verificēt domēna DNS (SPF/DKIM/DMARC) un notestēt reālu reģistrācijas, apstiprināšanas un paroles atjaunošanas piegādi.

Pieņemšana: nepazīstams lietotājs pats sasniedz dashboard, izveido eventu un atrod palīdzību; nekas no citas sesijas nepaliek redzams.

## F. Piedāvājums un maksājumi

Prioritāte P2 pēc stabilitātes un izmaksu mērījumiem. Šeit vēl nav izvēlēts maksājumu piegādātājs, cena vai obligāts abonements.

- [ ] F1 LĒMUMS: intervijas ar esošajiem organizatoriem un viens neliels maksas pilots. Salīdzināt maksu par eventu ar abonementu regulāriem organizatoriem. Neīstenot abus modeļus automātiski.
- [ ] F2 NEUZSĀKTS: noteikt trial/paid piedāvājuma foto, storage, eventu, perioda, retention, sharing, branding un iespējamās komandas robežas. Aprakstīt sasniegtu limitu sekas.
- [ ] F3 NEUZSĀKTS: izmērīt storage, attēlu/ZIP apstrādi, pārraidi, maksājumu komisijas un support laiku uz eventu; tikai tad noteikt cenu. Unlimited nav noklusējums.
- [ ] F4 NEUZSĀKTS: hosted checkout un servera apstiprinājums; orders/payment_events/entitlements/usage vai izvēlētajam modelim atbilstoši ieraksti. Redirect uz success lapu nepiešķir tiesības.
- [ ] F5 NEUZSĀKTS: idempotenti un nepareizā secībā saņemti webhook, aizkavēti/nesekmīgi maksājumi, refunds/cancel un reconciliation.
- [ ] F6 NOSACĪTS: tikai abonēšanas modelim monthly/yearly, trialing/active/overdue/canceled/ended, grace period, upgrade/downgrade/proration, renewal, invoices un billing portal.
- [ ] F7 NEUZSĀKTS: serverī enforce tiesības; skaidri saglabāt apmaksāto piekļuvi un datu glabāšanu atcelšanas/neveiksmīga maksājuma laikā, neizdzēšot foto uzreiz.

Pieņemšana: reāls maksājums un tā atkārtoti/novēloti paziņojumi dod pareizas tiesības vienreiz; noteikumi un atlikumi saprotami klientam. Ja izvēlēta maksa par eventu, abonementa tests nav obligāts.

## G. Publiskā vietne, ziņojumi un atbalsts

Prioritāte P2 pēc piedāvājuma izvēles.

- [ ] G1 NEUZSĀKTS: homepage ar produkta attēliem/paraugu, features/pricing/FAQ/contact, guest demo, trial/pirkuma darbība, mobilā pieejamība un SEO/social metadata.
- [ ] G2 DAĻĒJI: account e-pasti; papildus event-ready, kvotu/retention atgādinājumi, export-ready, maksājumu un support paziņojumi atbilstoši funkcijām.
- [ ] G3 NEUZSĀKTS: e-pastu piegādes kļūmju uzraudzība, reminder deduplication, notification preferences; mārketinga atteikšanās atsevišķi.
- [ ] G4 NEUZSĀKTS: help center, problēmas pieteikums, publicēts support darba laiks un dokumentēts refund process.
- [ ] G5 NEUZSĀKTS: tirgum atbilstošas privacy/terms/consumer/refund un nodokļu/rēķinu prasības ar profesionālu pārbaudi. Šis saraksts nav juridiska konsultācija vai atbilstības apliecinājums.

Pieņemšana: klients saprot pirkumu, atcelšanu, foto termiņus un to, kā saņemt palīdzību.

## H. Arhitektūra, darbināšana un drošība

Prioritāte P1 izolācijai/drošībai, P2 biznesa administrēšanai.

- [ ] H1 DAĻĒJI: pakāpeniski sadalīt config/auth/events/uploads/images/gallery/exports/ui moduļos; vispirms saglabāt uzvedību testos. TypeScript pakāpeniski, bez obligātas framework pārrakstīšanas.
- [ ] H2 DAĻĒJI: versētas migrācijas, indeksi, idempotence un retryable jobs; testēt svaigu DB un iepriekšējās versijas upgrade.
- [ ] H3 NEUZSĀKTS: dev/staging/production nošķiršana, vides konfigurācija, precīzas CDN un npm versijas, CI pirms deploy, laidiena versija un rollback procedūra.
- [ ] H4 DAĻĒJI: testi eksportētām moduļu funkcijām, pakāpeniski aizvietojot funkciju teksta ekstrakciju; pilna izolēta Supabase integrācija un maza apjoma production smoke tests.
- [ ] H5 NEUZSĀKTS: neatkarīga RLS/Storage/anon upload/owner/admin/payment pārbaude, kvotu apiešana un abuse/rate-limit scenāriji. Testiem neizmantot klientu foto vai kvotu destruktīvus scenārijus.
- [ ] H6 NEUZSĀKTS: error/uptime monitorings, request/job IDs un brīdinājumi par ilgstošām kļūmēm/izmaksu kāpumu; nelogot foto saturu, tokens vai liekus personas datus.
- [ ] H7 NEUZSĀKTS: DB backup un atsevišķa Storage failu atkopšana, izmēģināts restore un incidenta procedūra. DB backup viens pats neatjauno fotogrāfijas.
- [ ] H8 NEUZSĀKTS: jaudas tests vienlaicīgiem eventiem/upload; worker izvēle pēc reālām atmiņas/laika robežām, nevis pieņēmuma, ka visas bildes un ZIP jāapstrādā vienā Edge Function.
- [ ] H9 NEUZSĀKTS: sistēmas īpašnieka admin ar klientu/eventu/usage apskati, jobs retry, refunds/reconciliation, support, auditējamiem labojumiem un kontrolētu retention/allowance maiņu.
- [ ] H10 NOSACĪTS: customer/workspace/memberships un team access tikai tad, ja tas ir pārdotajā piedāvājumā. Papildu tabulas projektēt pie konkrētā uzdevuma, nevis izveidot visu avota sarakstu uzreiz.

Pieņemšana: sistēmu var novērot, atjaunot un uzturēt bez neizsekojamām manuālām datu izmaiņām; drošības atradumiem ir pierādīta novēršana.

## I. Mērījumi un palaišanas slieksnis

- [ ] I1 Mērīt upload izdošanās procentu, ilgumu/retry, vismaz vienu foto pievienojušo viesu īpatsvaru, export completion un izmaksas/support uz eventu.
- [ ] I2 Pēc maksājumu ieviešanas mērīt trial -> purchase un ieņēmumus pret tiešajām izmaksām. Neuzskaitīt API 200 atbildi kā saglabātu foto vai diskā saņemtu ZIP.
- [ ] I3 Kļūmes grupēt pēc pārlūka/ierīces bez nevajadzīgas personas datu vākšanas; pirms pilota noteikt izmērāmos sliekšņus.
- [ ] I4 Nepazīstams testētājs izpilda register -> izvēlētā pakalpojuma pirkums -> tiesības -> nākotnes events -> dizains/drukāts QR -> Android/iPhone upload ar pārtraukumu -> organizer gallery -> sharing -> pilns eksports/retry -> support.
- [ ] I5 Ja pārdod abonementu, papildus billing details/cancel/grace/renewal; visos modeļos skaidri retention un piekļuves termiņi.
- [ ] I6 Negatīvie testi: nepareizs konts, duplicate/out-of-order maksājumi, pilna kvota, expired share, nesekmīgs export, cleanup retry un restore.
- [ ] I7 Neliels maksas pilots, novērsti būtiskie atradumi, pierādīta atkopšana un izmaksu robežas; tikai tad publiska palaišana.

## Tuvākā darba secība

Papildinājums: [privāta R2 integrācija](r2-storage.md) sagatavota production laidienam pēc viena veiksmīga upload/thumbnail/galerijas testa. Veco failu migrācija, plašāki integrācijas/atkopšanas testi un automātiskā tīrīšana vēl jāizpilda. Organizatora izvēlēts ilgāks kopīgošanas termiņš ir nākotnes variants; pašreizējās 7 dienas paliek.

1. Pabeigt A: jaunās migrācijas, lokālā laidiena publicēšana un manuālie testi. Prakses dokumentāciju turēt saskaņā ar faktiskajiem rezultātiem.
2. Saskaņot B2/B3 precīzo eventa laiku un ieviest atsevišķā pārbaudāmā izmaiņā.
3. Izolēt staging, nostiprināt monitoring un datu atkopšanu; pabeigt retention lēmumus.
4. Uzlabot mobilo rindu un servera eksportus pēc vajadzības; gatavot vienu piedāvājumu un izmērīt izmaksas.
5. Pirkumi, support un nepieciešamās admin darbības; maksas pilots; pārskatīt atlikušās prioritātes pēc klientu pieredzes.

Katram nākamajam uzdevumam lietot šādu ierakstu: ID, problēma, statuss, robežas, priekšnosacījumi, izmaiņas DB/API/UI, pieņemšanas tests, izmaksu ietekme, atkopšanas plāns, pierādījums. Commit/deploy veidot par saskaņotu pārbaudītu izmaiņu kopu. Šis dokuments nav automātisks uzdevums sākt visus punktus.
