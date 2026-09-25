# Lumiq: produkta atbildes un juridiskā pirms-palaišanas darba lapa

Atjaunināts 2026. gada 22. septembrī. Šis ir darba dokuments, nevis juridisks atzinums vai gatavs distances līgums. Publiskās politikas lietotnē ir skaidri marķētas kā projekti. Pirms reālas pārdošanas tās jāpārbauda Latvijas juristam un grāmatvedim.

## Kas jau ir zināms

| Jautājums | Pašreizējā atbilde no produkta koda vai īpašnieka norādes |
| --- | --- |
| Produkta nosaukums | Lumiq ir pagaidu darba nosaukums; vēlāk var mainīties. |
| Juridiskais pakalpojuma sniedzējs | Uzņēmums vai saimnieciskā darbība vēl nav reģistrēta. Nosaukums, reģistrācijas numurs un adrese paliek tukši līdz reģistrācijai. |
| Domēns | `lumiq.cam` ir pašreizējais domēns, ko īpašnieks izvēlējies nākotnē pārslēgt no staging uz atsevišķu produkcijas vidi. Pārslēgšana vēl nav apstiprināta vai veikta. `lumiq.lv` nav apstiprināts. |
| Produkts | Pasākumu foto apkopošanas SaaS. Video netiek pieņemts vai glabāts. |
| Foto apstrāde | Tiek glabāta optimizēta WebP versija un sīktēls, nevis sākotnējais telefona fails. Failu ierobežojumi ir atkarīgi no plāna un tiek pārbaudīti serverī. |
| Viesu konts | Viesis ievada parādāmo vārdu, bet neveido organizatora kontu. |
| Foto galerijas piekļuve | Organizators redz sava pasākuma foto. Pēc pasākuma var atsevišķi ieslēgt viesu kopīgošanu. Kopīgošanas saite ir pārsūtāma; tās saņēmēji var apskatīt un saglabāt foto. |
| Dzēšana un termiņi | Glabāšana sākas pēc pasākuma un foto uzņemšanas beigām. Explore: 7 dienas; Single Event un Gathering: 14 dienas; Studio: 30 dienas. Pasākuma beigās automātiski tiek veidots nemainīgs ZIP momentuzņēmums no tajā brīdī galerijā esošajiem foto. Vēlāka foto dzēšana maina kopīgo galeriju, bet ne ZIP. Termiņa beigās galerijas foto un ZIP tiek dzēsti; arhīvā redzams tikai pasākuma nosaukums, datums/laiks un glabāšanas periods. Dzēšanas izpildes laiks vēl jāpārbauda slēgtajā testa vidē. |
| Viesu galerijas kopīgošana | Maksimums: Explore 4 dienas, Single Event/Gathering 7 dienas, Studio 14 dienas. Organizators var izvēlēties īsāku periodu. Kopīgošana sākas pēc pasākuma un nepārsniedz atlikušo foto glabāšanas termiņu. |
| Aktuālie foto un glabātuves limiti | Explore: 50 foto, 100 MiB. Single Event: 500 foto, 1000 MiB. Gathering: 500 foto, 1000 MiB. Studio: 1000 foto, 2000 MiB. Katrā plānā ieplānoti 2 MiB vienam foto un sīktēla pārim. Foto skaitu un kopējo baitu limitu piemēro vienlaikus; lielāki par vidējo attēli var sasniegt baitu limitu pirmo. |
| Aktuālās cenas | Koda konfigurācijā: Single Event 15 EUR vienreizēji, Gathering 30 EUR mēnesī, Studio 70 EUR mēnesī; Explore ir izmēģinājuma plāns. Tās ir pirms-palaišanas cenas, PVN un gala komerciālie noteikumi nav apstiprināti. |
| Maksājumi | Pašreizējā lokālā plūsma ir simulācija un neiekasē naudu. Klix un Swedbank ir iespējamie kandidāti; neviens nav izvēlēts, līgums nav noslēgts un integrācija nav aktīva. |
| Uzņēmuma klienti | Kontā ir personīgā/uzņēmuma profila izvēle un uzņēmuma dati, bet juridiskās personas rekvizīti, PVN ID, rēķina prasības un B2B līguma noteikumi jāapstiprina atbilstoši faktiskajam pārdevējam un tirgiem. |
| Sīkdatnes | Lokālajā versijā ir nepieciešamā autentifikācijas sīkdatne un funkcionāla lokālā pārlūka krātuve. Analītikas un reklāmas sīkdatnes nav ieslēgtas. Ja pievieno izvēles tehnoloģijas, vajadzīga informācija, izvēle un vienkārša piekrišanas atsaukšana pirms to ielādes. |

## Atbildes uz juridiskajiem jautājumiem

### Reģistrācija un VID

Pašlaik nav reģistrēta uzņēmējdarbības forma. Pirms reālu pasūtījumu vai maksājumu pieņemšanas ar VID un grāmatvedi jāizvēlas atbilstošs darbības veids: fiziskas personas saimnieciskā darbība vai juridiska persona. Izvēle ietekmē atbildību, grāmatvedību, nodokļus, rēķinus un komercbankas/payment-provider prasības; šo izvēli nevajag uzminēt programmatūrā.

VID norāda, ka elektroniska struktūrvienība var būt jāreģistrē, ja vietnē klients var pasūtīt pakalpojumu un/vai par to samaksāt. Reģistrācijas termiņš ir 10 dienas no lēmuma par struktūrvienības izveidošanu un reģistrācija jāveic pirms struktūrvienība sāk darbu. Precīzu piemērojamību un EDS reģistrācijas brīdi apstiprināt ar VID konkrētajam darbības modelim. Oficiālā informācija: [VID struktūrvienību reģistrācija](https://www.vid.gov.lv/lv/strukturvienibas-registracija).

### Distances līgums, pirkums un atteikums

Pirms pasūtījuma klientam saprotami jāredz pārdevēja identitāte un kontakti, pakalpojuma būtiskās īpašības, gala cena un nodokļu piemērošana, foto un glabāšanas limiti, pasākuma periods, piegādes sākums, atcelšanas kārtība, sūdzību kanāls un piemērojamā atteikuma informācija. Pasūtījuma pēdējai pogai nepārprotami jāparāda, ka darbība rada maksājuma pienākumu. Pēc līguma noslēgšanas klientam jāsaņem apstiprinājums pastāvīgā informācijas nesējā.

14 dienu atteikuma tiesības un digitālā pakalpojuma izņēmums nav jāapvieno automātiskā vispārīgā atteikumā. Ja pakalpojuma sniegšana sākas pirms atteikuma termiņa beigām vai paredz piemērot digitālā pakalpojuma izņēmumu, juristam jāapstiprina konkrētā līguma kvalifikācija un atsevišķa, skaidra klienta prasība/piekrišana, apliecinājums un apstiprinājuma pieraksts. Patērētāja likumā noteiktās tiesības un pakalpojuma neatbilstības risinājumi paliek spēkā. Skatīt [PTAC distances tirdzniecību](https://www.ptac.gov.lv/lv/distances-tirdznieciba) un [MK noteikumus Nr. 255](https://likumi.lv/ta/id/266462).

### Privātums un viesu foto

Identificējama cilvēka fotogrāfija ir personas dati. Fotogrāfija pati par sevi nav automātiski īpašas kategorijas biometriskie dati; biometrisko datu noteikums attiecas uz īpašu tehnisku apstrādi unikālas identificēšanas nolūkā. Lumiq neveic sejas atpazīšanu vai sejas veidņu izveidi. Skatīt [EDPB datu aizsardzības pamatus](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en) un [EDPB likumīgas apstrādes ceļvedi](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en).

Organizators viesa lapā pirms foto pievienošanas saņem īsu informatīvu skaidrojumu: foto nonāk pasākuma organizatora galerijā; ja organizators kopīgo galeriju, saites saņēmēji var foto apskatīt un saglabāt; norādīts foto dzēšanas termiņš; pieejama pilnā privātuma informācija. Šis paziņojums informē, bet pats par sevi nepierāda piekrišanu vai citu tiesisko pamatu. Organizators un pakalpojuma sniedzējs pirms palaišanas nosaka faktiskās pārziņa/apstrādātāja lomas, tiesiskos pamatus, datu apstrādes līgumu un sūdzību/dzēšanas kārtību.

Privātuma paziņojumā jāiekļauj datu kategorijas, nolūki un tiesiskais pamats, saņēmēji/apstrādātāji, glabāšanas termiņi, datu subjekta tiesības, kontaktinformācija, pārsūtīšana ārpus EEZ, drošības pārkāpumu process un bērnu/sensitīva satura kārtība. Konkrētie datu glabāšanas laiki un apstrādātāju juridiskās personas jāaizpilda tikai pēc staging konfigurācijas un līgumu pārbaudes.

### Sīkdatnes

Pašreizējā lokālajā versijā nav reklāmas vai analītikas sīkdatņu, tāpēc nav jāizliek piekrišanas baneris izvēles sīkdatnēm, kuru nav. Lietotāji tomēr jāinformē par nepieciešamo sesijas sīkdatni un pārlūka lokālo krātuvi. Pirms nākotnē ieslēgt analītiku, reklāmu vai citas izvēles sīkdatnes, tās jābloķē līdz lietotāja izvēlei un jānodrošina vienkārša atsaukšana. Skatīt [DVI sīkdatņu skaidrojumu](https://www.dvi.gov.lv/lv/jaunums/dviskaidro-kas-man-jazina-par-sikdatnem-jeb-cookies) un [piekrišanas atsaukšanas norādes](https://www.dvi.gov.lv/lv/jaunums/dviskaidro-ka-nodrosinat-lietotajiem-vieglu-atsaukt-piekrisanu-sikdatnem).

### Maksājumi un grāmatvedība

Klix un Swedbank paliek izvēles kandidāti. Pirms izvēles salīdzināt tirgotāja atbilstības prasības, līguma un konta nepieciešamību, banku maksājumu pārklājumu, komisijas, norēķinu termiņu, atmaksu/chargeback procesu, API vai hosted checkout pieejamību, webhook parakstu pārbaudi, rekonsiliāciju un rēķinu plūsmu. Swedbank publicē interneta maksājumu un Bank Link produktu informāciju; konkrēta pieslēgšana un tirgotāja prasības jāapstiprina tieši ar pakalpojumu sniedzēju: [Swedbank interneta maksājumi](https://www.swedbank.lv/business/cash/ecommerce/paymentPortal/form). Klix nosacījumi un pieejamība jāpārbauda ar Klix/Citadele pirms integrācijas.

Rēķina/attaisnojuma dokumenta automātiska sagatavošana un nosūtīšana vēl nav pabeigta production funkcija. Pirms pārdošanas ar grāmatvedi jānosaka PVN statuss, B2C/B2B rēķina saturs, pārrobežu pārdošanas režīms un dokumentu glabāšanas termiņš. VID informācijā attaisnojuma dokumentu glabāšana atšķiras pēc veida; neuzstādīt vienu termiņu visiem ierakstiem. Skatīt [VID grāmatvedības dokumentu glabāšanas skaidrojumu](https://www.vid.gov.lv/lv/biezak-uzdotie-jautajumi-katalogs/gramatvedibas-organizesana-gramatvedibas-datorprogrammas).

## Pirms pārdošanas aizpildāmie lauki

- Juridiskais pārdevēja nosaukums vai fiziskās personas vārds, uzvārds: ____________________
- Uzņēmuma/saimnieciskās darbības forma un reģistrācijas numurs: ____________________
- Juridiskā vai saimnieciskās darbības adrese: ____________________
- Publiskā vietne/domēns: `lumiq.cam` (tehniskais mērķis); publiskas palaišanas un juridiskā pārdevēja informācija vēl jāapstiprina.
- Klientu atbalsta e-pasts un tālrunis: ____________________
- Privātuma pieprasījumu kontaktpersona/e-pasts: ____________________
- PVN reģistrācijas statuss un gala cenas ar nodokļiem: ____________________
- Izvēlētais maksājumu pakalpojuma sniedzējs un tirgotāja līgums: ____________________
- Apstiprinātais hostings, datu reģioni, apakšapstrādātāji un DPA: ____________________
- Rezerves kopiju un galīgās dzēšanas grafiks: ____________________
- Atteikuma, atcelšanas, atmaksas, sūdzību un neatbilstības novēršanas noteikumi: ____________________
- Pirkuma apstiprinājuma e-pasts un grāmatvedības dokumenta/rēķina process: ____________________
- Foto satura ziņošanas un izņemšanas kontaktpunkts: ____________________
- Jurista un grāmatveža pārbaudes datums un secinājumi: ____________________

## Produkta jautājumi, kas vēl jāizlemj

1. Vai pirmais maksājošais klients būs patērētājs, uzņēmums vai abi? Vai B2B klientiem būs atsevišķi līgumi un rēķina lauki?
2. Vai vajag obligātu organizatora tālruni un uzņēmuma reģistrācijas/PVN laukus, vai tos pieprasīt tikai norēķinos?
3. Vai viesu galerijas kopīgošana pēc pasākuma būs izslēgta pēc noklusējuma? Pašreizējais produkts ļauj organizatoram to ieslēgt.
4. Vai viesu saite būs pietiekams piekļuves noslēpums, vai vajadzēs PIN/paroli? Pārsūtāma saite ļauj tās saņēmējiem skatīt un saglabāt attēlus.
5. Kādi būs gala faila izmēra/formāta limiti, pasākuma dienu ierobežojumi, eksporta pieejamības un rezerves kopiju termiņi?
6. Kā viesis ziņos par neatbilstošu foto, un kā organizators/operatora atbalsts reaģēs uz steidzamu sūdzību?
7. Kādiem tirgiem būs pieejams pakalpojums, un vai cenas publiski norādīs PVN iekļaušanu?
8. Kurš maksājumu pakalpojuma sniedzējs tiks izvēlēts, un vai tiks pieņemti bankas maksājumi, kartes vai abi?
9. Kādi būs atmaksas gadījumi, atbildes termiņš, atcelšanas brīdis un neveiksmīga pakalpojuma kompensācijas process?
10. Vai būs analītikas sīkdatnes vai tikai nepieciešamās tehnoloģijas?

## Ieviešanas stāvoklis

- Vietnes privātuma, lietošanas un atmaksas sadaļas ir aizpildītas kā LV/EN pirms-palaišanas šabloni ar tukšiem pārdevēja un domēna rekvizītiem.
- Viesa lapā parādīts paziņojums par galerijas saņēmējiem, pārsūtāmu kopīgošanas saiti, foto glabāšanas termiņu un privātuma lapu. Tas nav noformēts kā piekrišanas pierādījums.
- Lokālais checkout joprojām ir simulācija; netiek ievākti kartes dati un netiek ģenerēts īsts rēķins.
- Maksājumu integrācija, merchant onboarding, juridiskā pārbaude, faktiskie processor līgumi, VID reģistrācija, PVN lēmums, publiskais domēns un production e-pasts vēl nav pabeigti.

## Oficiālie avoti

- [VID: Struktūrvienības reģistrācija](https://www.vid.gov.lv/lv/strukturvienibas-registracija)
- [PTAC: E-komercija](https://www.ptac.gov.lv/lv/e-komercija)
- [PTAC: Distances tirdzniecība](https://www.ptac.gov.lv/lv/distances-tirdznieciba)
- [MK noteikumi Nr. 255 par distances līgumu](https://likumi.lv/ta/id/266462)
- [Patērētāju tiesību aizsardzības likums](https://likumi.lv/ta/id/23309)
- [DVI: Sīkdatnes](https://www.dvi.gov.lv/lv/jaunums/dviskaidro-kas-man-jazina-par-sikdatnem-jeb-cookies)
- [EDPB: Personas datu aizsardzības pamati](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en)
- [Swedbank: Interneta maksājumi](https://www.swedbank.lv/business/cash/ecommerce/paymentPortal/form)
