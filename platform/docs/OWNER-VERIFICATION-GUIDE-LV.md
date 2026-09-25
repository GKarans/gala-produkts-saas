# Lumiq pārbaudes un Windows DNS/TLS pamācība

Atjaunināts: 2026-09-25. Šī ir īpašnieka izpildāmo pārbaužu rokasgrāmata.
Izmanto tikai slēgtā testa vidi, sintētiskus notikumus un attēlus, kuru
augšupielādei ir piekrišana. Paroles, tokenus, datubāzes URL un R2 atslēgas
neievieto čatā, ekrānattēlos vai Git.

## Vienošanās par palaišanas secību

- Apmaksātus produkcijas resursus neveido un nepieslēdz, kamēr `lumiq.cam` nav
  pārslēgts un uzņēmums nav reģistrēts. Tas ir atlikts lēmums, nevis atļauja
  izmantot testa DB/R2 publiskai produkcijai.
- `lumiq.cam` jau ir pārslēgts uz slēgtā testa Worker aiz Cloudflare Access;
  tam jāraksta tikai atsevišķajā closed-test DB/R2. Publiska reģistrācija,
  pārdošana un viesu foto pieņemšana nav atļauta. Tas nav production launch.
  Tet Drošība iepriekš rādīja `Malware`. 2026-09-25 18:51 UTC lokālais
  `Resolve-DnsName` saņēma Cloudflare IP adreses, un parastais `curl.exe -I`
  ar sertifikāta pārbaudi sekmīgi pabeidza TLS uz `lumiq.cam` un testa
  `workers.dev`; abi atgrieza gaidīto Cloudflare Access `302`. Iepriekšējais
  `SEC_E_UNTRUSTED_ROOT` šajā pārbaudē neatkārtojās. Tas nepārbauda Tet
  klasifikāciju vai citas ierīces/tīklus. Ja brīdinājums atgriežas, to neapiet
  un PIN tajā neievadi.
- Pēc uzņēmuma reģistrācijas atgriezies pie `PRODUCTION-COST-PLAN.md`, saņem
  konkrēto ikmēneša izmaksu apstiprinājumu un tikai tad veido izolētos
  production DB/R2/Queue resursus. `lumiq.cam` nedrīkst sūtīt klientus uz
  closed-test vai staging datiem.
- Operatora juridiskā identitāte, privātuma paziņojums, noteikumi, nodokļi,
  dzēšanas/glabāšanas politika un galīgās cenas paliek atliktas līdz uzņēmuma
  reģistrācijai un kvalificētai juridiskai/nodokļu konsultācijai.

## 0. Slēgtā domēna Access pašreizējais stāvoklis

Cutover ir veikts: `lumiq.cam` piesaistīts `lumiq-closed-test` Worker un visu
hostname sargā Cloudflare Access. Allow sarakstā ir tikai īpašnieka e-pasts;
bez konfigurēta ārēja identitātes nodrošinātāja Access izmanto vienreizēju
e-pasta PIN. Anonīmi pieprasījumi uz sakni, `/app`, API, `/healthz`, Auth
atgriešanās ceļiem un sintētisku viesa URL ir saņēmuši Access `302`. Tas
apliecina anonīmās robežas pārbaudi, nevis autentificētu aplikācijas/Auth
plūsmu.

1. Pirms PIN ievades pārliecinies, ka pārlūkā redzams pareizais `lumiq.cam`
   hosts un nav Tet STOP lapas vai sertifikāta brīdinājuma. Ja tāds parādās,
   apstājies un seko sadaļai 6; nelieto allowlist kā apiešanu.
2. Īpašnieks atver
   `https://lumiq.cam/healthz`, autentificējas Access un pārbauda, ka JSON
   rāda `status: ok`, `service: lumiq-closed-test.gkarans-events.workers.dev`,
   `database: ready` un `storage: bound`.
3. Atver `https://lumiq.cam/app`, pārbauda īpašnieka pieteikšanos un
   organizatora paneli. Pārbauda, ka pieteikšanās/sesijas darbības nenonāk uz
   izdzēsto staging Worker un ka Supabase saites atgriežas uz paredzēto
   slēgtā testa adresi.
4. Visa hostname Access politika aiztur arī viesu saites, tāpēc šajā stāvoklī
   publiska viesa QR/augšupielādes plūsma nav testējama. Neveido `Bypass` vai
   publisku Access politiku. Viesa scenārijam vispirms jāizplāno atsevišķs
   izolēts, īslaicīgs testa hostname/piekļuves režīms ar tikai sintētiskiem
   foto un jāpārbauda, ka organizatora/admin API paliek slēgti.
5. Saglabā datumu, Worker versiju un nekonfidenciālos JSON/statusus. Nefiksē
   PIN, sīkdatnes, tokenus vai Access pāradresācijas pilno URL.

Cloudflare ļauj self-hosted Access aplikācijai aizsargāt visu hostname, kā arī
atsevišķus ceļus; šim slēgtajam pilotam jāizvēlas viss hostname:
[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/),
[self-hosted public app](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

## 0.1 Testa DB un R2 veselības pārbaude

Testa DB migrācijas 001–012 ir lietotas slēgtajam testam. Svaigā
`wrangler deployments list` pārbaude 2026-09-25 16:54 UTC rāda
`lumiq-closed-test` versiju
`4fc5b617-5815-4c0e-bb2d-e0492279d683`; `lumiq.cam` pašlaik ir šī Worker
slēgtā alias. Vispirms pārliecinies par pareizo host un parastu TLS,
tikai pēc tam:

1. Atver `https://lumiq.cam/healthz` caur Access.
2. Sagaidi `status: ok`, `database: ready` un `storage: bound`. `service` var
   būt test Worker identifikators. Ja tiek prasīts Access PIN, ievadi to tikai
   tad, ja pārlūkā nav DNS/TLS brīdinājuma.
3. Atver `/app` un pārbaudi īpašnieka dashboard. Šajā pārbaudē neveic nekādas
   slēgtā testa datubāzes/objektu izmaiņas; production resursu vēl nav.

## 1. Autentifikācija testa vidē

Sagatavo atsevišķu testa e-pasta adresi, kurai vari piekļūt. Nemaini vienīgo
īpašnieka konta paroli, ja neesi gatavs pēc tam pieteikties ar jauno paroli.

1. Šobrīd Access atļauj tikai īpašnieka e-pastu. Reģistrācijas testu citam
   kontam neveic, kamēr tā adrese nav īpaši pievienota Access allowlist un
   īpašnieks nav apstiprinājis šo pagaidu piekļuvi. Vispirms pārbaudi esošā
   īpašnieka login/session plūsmu caur `lumiq.cam` pēc DNS/TLS atbloķēšanas.
2. Pārbaudi, ka atgriežas uz paredzēto Lumiq lapu, konts ir verificēts un var
   atvērt organizatora lietotni.
3. Izraksties, piesakies atkārtoti, aizver/atver pārlūku un pārbaudi sesiju.
4. Pieprasi paroles atjaunošanu; atver e-pastu, iestati jaunu paroli abos
   laukos, pārbaudi neatbilstošu paroļu kļūdu, pēc tam piesakies ar jauno.
5. Ja maini e-pastu, pārbaudi apstiprinājumu un vecās/jaunās adreses darbību.
6. Pieraksti datumu, testa adreses aizstājvārdu (ne pilnu adresi, ja to nevajag),
   rezultātu un saites galamērķa ceļu. Ekrānattēlā aizsedz tokenus un query
   parametrus.

Jāizdodas: apstiprinājums, login, logout, parole un sesija darbojas; e-pasta
saite ved uz paredzēto closed-test hostu. Neveiksmīga piegāde vai nepareizs
hosta vārds ir release blocker. Produkcijas Auth URL vēlāk jākonfigurē tikai
atsevišķajā production Supabase projektā.

## 2. Foto piekļuve, atsaukšana un augšupielādes kļūmes

Izmanto divus testa organizatorus un vienu publicētu sintētisku notikumu katram.

1. Viesis A pievieno vārdu un vienu sintētisku foto. Pārbaudi pabeigtu
   augšupielādi, galerijas sīktēlu un R2 atslēgas viesfotogrāfa mapē.
2. Atver foto viesa sesijā; izslēdz kopīgošanu un pārlādē to pašu viesa saiti.
   Pēc atsaukšanas viesim foto jānoraida, organizatoram galerija joprojām
   jāatver.
3. Piesakies kā organizators B un mēģini atvērt A notikumu/foto API ierakstu.
   Atbildei jābūt liegta/neatrasta; nekādi cita organizatora dati nedrīkst
   parādīties.
4. R2 bucket jābūt privātam. Tieša publiska R2 objekta saite nedrīkst atdot
   foto. Neielīmē parakstītas saites vai tokenus pierādījumu ekrānattēlos.
5. Ar atsevišķu testa notikumu pārbaudi pārāk lielu avota failu, neatbalstītu
   vai bojātu attēlu, tīkla pārtraukumu augšupielādes laikā, retry un dublikāta
   pieprasījumu. Veiksmei jāparādās tikai pēc oriģināla un sīktēla saglabāšanas.
6. Pieraksti katras pārbaudes sagaidāmo/saņemto HTTP statusu, galerijas skaitu
   un R2 objektu skaitu. Kļūdainos testa objektus izdzēs caur lietotni un
   pārbaudi, ka fona tīrīšana tos aizvāc.

## 3. Rezerves kopijas atjaunošanas izmēģinājums

Avota closed-test DB ir PostgreSQL 17.6. Šajā datorā PostgreSQL 17.11 klienta
arhīvs no oficiālās EDB binaries lapas ir izvilkts lietotāja profilā:
`%LOCALAPPDATA%\Lumiq\postgresql17\bin`. `pg_dump --version` un
`pg_restore --version` apstiprina 17.11; lokāls PostgreSQL serveris nav
instalēts un PATH nav mainīts sistēmas līmenī. Pirms backup lokālajā
PowerShell procesā pievieno klienta rīku mapi:
`$env:PATH="$env:LOCALAPPDATA\Lumiq\postgresql17\bin;$env:PATH"`
un pārbaudi abas versijas. Docker nav nepieciešams, ja šie rīki ir pieejami.

Šo soli turpini tikai tad, kad backup avota piekļuve ievadāma drošā vietējā
terminālī un ir pieejams **atsevišķs tukšs** Supabase/R2 atjaunošanas mērķis.
Nekad neatjauno esošajā closed-test DB vai bucketā.

1. Šim avotam vajag PostgreSQL 17.x klienta rīkus. Tie jau atrodas
   `%LOCALAPPDATA%\Lumiq\postgresql17\bin`; iepriekšējā sadaļā norādītā PATH
   komanda iestata tos tikai pašreizējai PowerShell sesijai.
2. Izveido Cloudflare R2 API tokenu ar tikai Object Read atļauju, ierobežotu uz
   `lumiq-closed-test-photos`. Sagatavo Supabase Session Pooler URL (ports 5432).
   Nelīmē nekādus URL vai atslēgas čatā, `.env`, komandrindas argumentos vai Git.
3. No repozitorija saknes atver PowerShell un palaid
   `.\platform\scripts\backup-local.ps1`. Tas maskēti paprasīs avota savienojuma
   vērtības, atļaus tikai norādīto testa bucketu, saglabās backup ārpus repozitorija
   `%LOCALAPPDATA%\Lumiq\backups\` un palaidīs `backup:verify`. Beigās tas attīra
   procesa vides mainīgos. Ja komanda neizdodas, nepalaid restore un neizdzēs
   daļējo mapi; ziņo tikai nekonfidenciālo kļūdas tekstu.
4. Verifierim jāpārbauda database dump, publisko tabulu inventārs un katra
   lokālā R2 objekta kontrolsumma. Saglabā sekmīgi verificētās mapes ceļu.
5. Atjaunošanas mērķi jau ir izveidoti un pārbaudīti: Supabase Free projekts
   `Lumiq Restore Drill 2026-09-25`, ref `sprzlvywzpeyuzbsyplz`, Central EU
   (Frankfurt); Cloudflare R2 Standard bucket `lumiq-restore-drill-20260925`,
   EEUR, `0 B`, `Public Access: Disabled`. Avots ir cits projekts
   (`cpweowosocjuccjsyyic`) un cits buckets (`lumiq-closed-test-photos`).
6. Cloudflare izveido R2 API tokenu ar `Object Read & Write` atļauju, kas
   ierobežota tikai uz `lumiq-restore-drill-20260925`. Supabase projekta
   `Connect` logā izvēlies Session Pooler, portu 5432. Neielīmē tokenu vai
   savienojuma URL čatā, `.env`, komandrindas argumentos vai Git.
7. No repozitorija saknes atver PowerShell un palaid
   `.\platform\scripts\restore-local.ps1`. Palaidējs pēc noklusējuma izvēlas
   verificēto backupu `%LOCALAPPDATA%\Lumiq\backups\lumiq-restore-drill-20260925-221255`;
   pirms noslēpumu prasīšanas atkārto backup verifikāciju, prasa precīzu mērķa
   projekta ref un maskēti paprasa target pooler URL un bucketam piesaistītā
   tokena atslēgas. Palaidējs neļauj norādīt citu DB projektu vai bucketu, un
   iztīra procesa noslēpumus beigās. `restore-drill.mjs` vēlreiz pārbauda backup,
   mērķa DB tukšumu, Auth lietotāju tukšumu un bucket tukšumu pirms rakstīšanas.
   PostgreSQL parole netiek nodota `pg_restore` komandrindas argumentos.
8. Veiksmes izvadē jābūt sakrītošam publisko tabulu/rindu inventāram un visu R2
   atslēgu, izmēru, SHA-256 kontrolsummu sakritībai. Pēc tam manuāli izpildi
   migration verifieri, ielādē atjaunoto aplikāciju izolētā kandidātā, pārbaudi
   `/healthz`, login, galeriju un izvelc vismaz vienu atjaunoto ZIP.
9. Fiksē avota/mērķa ID (bez noslēpumiem), koda versiju, objektu/rindu skaitu,
   ZIP manifestu, ilgumu, neatbilstības un veicēju. Tikai tad atzīmē restore
   gate kā izpildītu. Pēc testa iznīcini tikai īpaši šim drill izveidotos
   atjaunošanas resursus.

Rīks nedrīkst tikt palaists, ja nevar skaidri pierādīt, ka mērķa DB un bucket ir
tukši un atsevišķi. Ja redzi neskaidru target ID vai secrets kļūdu, apstājies.

## 4. Slodze un drošības pārbaude

Slodzes testu neveic pret `lumiq.cam`, izdzēsto `lumiq-cam` Worker, klientu
e-pastiem vai īstiem foto datiem. Lieto tikai īpaši izolētu, budžetā ierobežotu
testa kandidātu.

1. Vispirms slēgtā testā palaid vienu mazu synthetic testu; tad pa pakāpēm
   palielini paralēlos viesus/augšupielādes, katrā posmā pierakstot kļūmes,
   Worker CPU, DB savienojumus, Queue backlog/ilgumu, R2 operācijas un izmaksas.
2. Maksimālo Studio testu (1000 foto un ZIP) drīkst darīt tikai atsevišķā
   izolētā vidē ar skaidri noteiktu budžetu, Queue/DLQ un atkopšanas scenāriju.
   Pašreiz lokālais 1000-foto tests nepierāda Cloudflare slodzes ietilpību.
3. Pirms ārēja drošības testa vienojies par rakstisku scope, atļautajiem
   hostiem, laika logu, datu/dzēšanas noteikumiem un avārijas kontaktu. Testeriem
   nedod production noslēpumus. Sāc ar Access aizsargātu kandidātu un synthetic
   datiem; kritiskus/augstas prioritātes atradumus labo un atkārtoti testē.
4. Pieraksti testētāju, metodes, atradumus un atkārtotās pārbaudes rezultātu.
   Neatzīmē neatkarīgo drošības gate kā pabeigtu tikai ar automatizētu `npm
   run check`.

## 5. Android un iPhone pārbaude

Izmanto testa eventu un piekrišanai paredzētus testa foto. Pieraksti telefona
modeli, OS, pārlūka versiju, datumu un tīklu.

1. Noskenē QR parastā un vājā apgaismojumā; atver viesa lapu, ievadi vārdu,
   atver aizmugurējo kameru, uzņem 10 foto un pārbaudi katra statusu.
2. Izvēlies 20 foto no galerijas, pagriez telefonu, pārslēdz lietotni, bloķē
   ekrānu un atgriezies. Pārbaudi, vai pabeigtais/nepabeigtais statuss ir
   saprotams un nav dublikātu.
3. Augšupielādes laikā uz 10–20 sekundēm izslēdz Wi-Fi vai ieslēdz Airplane
   mode, tad atjauno tīklu un lietotnē izmēģini retry. Nedrīkst ziņot par
   veiksmīgu augšupielādi, ja oriģināls vai sīktēls nav saglabāts.
4. Pārbaudi iPhone Safari un Android Chrome atsevišķi, arī vienas rokas
   lietojamību, safe-area, tastatūru, scroll un galerijas foto atvēršanu.
5. Saglabā nekonfidenciālus ekrānattēlus un pieraksti kļūdas; nelieto īstus
   viesu foto.

## 6. Tet Drošība DNS/TLS pārbaude

Tet Drošība iepriekš rādīja `Malware` STOP lapu un agrāk noklusētais DNS
atgrieza `195.122.12.177`. Pārbaudē 2026-09-25 17:05 UTC noklusētais DNS un
`1.1.1.1` abi atgrieza Cloudflare IP adreses, taču parastais `curl` uz
`lumiq.cam` neizgāja Windows Schannel TLS pārbaudi (`SEC_E_UNTRUSTED_ROOT`).
Jaunā pārbaudē 2026-09-25 18:51 UTC `Resolve-DnsName` atgrieza
`104.21.67.110` un `172.67.221.99`; parastais `curl.exe -I` uz `lumiq.cam`
un testa `workers.dev` sekmīgi pabeidza TLS verifikāciju un saņēma paredzēto
Cloudflare Access `302`. Iepriekšējā TLS kļūda šajā lokālajā pārbaudē
neatkārtojās. Pārbaude neiet caur visiem ISP, ierīcēm vai Tet filtru. Tet
oficiāla klasifikācijas atbilde nav saņemta, un šis pieprasījums **nav domēna
pilnas drošības apliecinājums**.

Tet apraksta Tīkla vairogu kā DNS līmeņa filtru, kas bloķē draudu sarakstos
esošus resursus un rāda STOP lapu; pašapkalpošanās pārvaldībā ir atļautais
saraksts. Atļautā saraksta izmantošana tikai apiet bloķējumu šim tīklam, tā
nav draudu klasifikācijas pārbaude vai drošības apliecinājums. Skatīt [Tet
Tīkla vairogs](https://www.tet.lv/biznesam/internets/tikla-vairogs).

1. Ja STOP lapa vai TLS brīdinājums atgriežas, tajā neievadi Access PIN,
   paroles vai konta datus. Neizvēlies turpināšanu un nepievieno `lumiq.cam`
   atļautajam sarakstam kā apiešanas risinājumu.
2. Ja brīdinājums joprojām parādās citā ierīcē/tīklā vai vajadzīgs oficiāls
   klasifikācijas apstiprinājums, sazinies ar Tet, izmantojot **Mans Tet**
   atbalstu vai [Tet kontaktu lapu](https://www.tet.lv/par-mums/kontakti).
   Nosūti domēnu `lumiq.cam`,
   STOP lapas ekrānattēlu, brīdinājuma datumu/laiku, draudu kategoriju
   `Malware` un faktu, ka noklusētais resolver atgrieza `195.122.12.177`, bet
   publiskie resolveri atgrieza Cloudflare IP. Lūdz pārbaudīt pašreizējo
   klasifikāciju un apstiprināt rezultātu. Nesūti autentifikācijas saites,
   PIN, paroles vai signed URL.

   Ziņojuma teksts, ko vari pielāgot:

   > Labdien! Tet Drošība, atverot `https://lumiq.cam`, rāda STOP lapu ar
   > kategoriju “Malware”. Lūdzu pārbaudīt šī domēna klasifikāciju un norādīt,
   > kādi signāli izraisīja bloķēšanu. Agrāk šis domēns reizēm rādīja Lumiq
   > izstrādes/staging vietni; 2026-09-25 tas tika pārslēgts uz slēgtu testa
   > versiju ar Cloudflare Access. Domēns izmanto Cloudflare DNS/HTTPS;
   > neatkarīgi DNS vaicājumi uz `1.1.1.1` un `8.8.8.8` atgrieza
   > `104.21.67.110` un `172.67.221.99`, savukārt Tet tīkla resolveris
   > atgrieza `195.122.12.177`, kuram pārlūks uzrādīja sertifikāta kļūdu
   > `SEC_E_UNTRUSTED_ROOT`. Pievienoju STOP lapas ekrānattēlu un tās
   > parādīšanās datumu/laiku. Lūdzu veikt atkārtotu pārbaudi un informēt,
   > kad klasifikācija ir izlabota vai kādas darbības no domēna īpašnieka
   > vēl nepieciešamas. Paldies!

   Pievieno datumu/laiku un ekrānattēlu. Ja Tet prasa īpašumtiesību
   apliecinājumu, sniedz to tikai Tet oficiālajā atbalsta kanālā. Nekopīgo
   Access PIN, paroles, autentifikācijas URL vai sensitīvus Worker datus.
3. Saglabā Tet atbildi un incidenta/references numuru. 16:58 rezultāts ir
   tikai vienas parastās DNS/TLS pārbaudes pierādījums, nevis Tet atbilde.
4. Atkārto PowerShell pārbaudes parastajā tīklā, ja brīdinājums atgriežas vai
   pirms pirmās Access PIN ievades:

   ```powershell
   Resolve-DnsName lumiq.cam -Type A
   Resolve-DnsName lumiq.cam -Type A -Server 1.1.1.1
   ipconfig /flushdns
   Resolve-DnsName lumiq.cam -Type A
   curl.exe --fail --show-error -D - https://lumiq.cam/healthz
   ```

   A ierakstiem jāatbilst Cloudflare zonai, TLS jāpārbauda bez brīdinājuma,
   un HTTP jābūt Access izaicinājumam, nevis publiskai `healthz` atbildei.
   Tikai pēc tam Access PIN ievadi `lumiq.cam` pārlūkā un pabeidz sadaļu 0.
5. Ja parastais DNS atkal ved uz `195.122.12.177` vai TLS kļūda parādās,
   atgriezies pie Tet ar rezultātiem un apstājies. Nemaini DNS iestatījumus,
   nerediģē hosts failu, neinstalē sertifikātus, neizmanto `--resolve` ikdienas
   pārlūkošanai un nekad nelieto `curl -k` / `--insecure`.

Microsoft apraksta Windows DNS klienta keša pārbaudi un `ipconfig /flushdns`
[DNS troubleshooting](https://learn.microsoft.com/windows-server/networking/dns/troubleshoot/troubleshoot-dns-client)
un Windows 11 DNS servera maiņu sadaļā
[Essential network settings](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/essential-network-settings-and-tasks-in-windows).

## Rezultāta nodošana

Pēc katras sadaļas atsūti: sadaļas numuru, testa datumu, ierīci/vidi, iznākumu
(`pass`/`fail`), kļūdas tekstu un nekonfidenciālu ekrānattēlu. Nekad nesūti
paroles, pilnus auth URL ar tokeniem, database URL, R2 atslēgas vai QR viesu
sesijas tokenus.
