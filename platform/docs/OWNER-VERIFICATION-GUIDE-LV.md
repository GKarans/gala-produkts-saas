# Lumiq pārbaudes un Windows DNS/TLS pamācība

Atjaunināts: 2026-09-25. Šī ir īpašnieka izpildāmo pārbaužu rokasgrāmata.
Izmanto tikai slēgtā testa vidi, sintētiskus notikumus un attēlus, kuru
augšupielādei ir piekrišana. Paroles, tokenus, datubāzes URL un R2 atslēgas
neievieto čatā, ekrānattēlos vai Git.

## Vienošanās par palaišanas secību

- Apmaksātus produkcijas resursus neveido un nepieslēdz, kamēr `lumiq.cam` nav
  pārslēgts un uzņēmums nav reģistrēts. Tas ir atlikts lēmums, nevis atļauja
  izmantot testa DB/R2 publiskai produkcijai.
- Ja `lumiq.cam` vispirms pārslēdz slēgtam pilotam, tam jāpaliek aiz Cloudflare
  Access, jāraksta tikai atsevišķajā closed-test DB/R2, un jābūt aizliegtām
  publiskai reģistrācijai, pārdošanai un īstu viesu foto pieņemšanai. Tas nav
  production launch. Pirms šādas domēna maiņas vēl jāizveido un jāpārbauda
  Access politika, test Auth atgriešanās URL un atsevišķa kandidāta Worker.
- Pēc uzņēmuma reģistrācijas atgriezies pie `PRODUCTION-COST-PLAN.md`, saņem
  konkrēto ikmēneša izmaksu apstiprinājumu un tikai tad veido izolētos
  production DB/R2/Queue resursus. `lumiq.cam` nedrīkst sūtīt klientus uz
  closed-test vai staging datiem.
- Operatora juridiskā identitāte, privātuma paziņojums, noteikumi, nodokļi,
  dzēšanas/glabāšanas politika un galīgās cenas paliek atliktas līdz uzņēmuma
  reģistrācijai un kvalificētai juridiskai/nodokļu konsultācijai.

## 0. Access pārbaude saknes domēna pārejai

Pašreiz `lumiq.cam/app` atdod publisku lietotnes čaulu, lai gan anonīmais
`/api/events` atgriež 401. Tas nav slēgta pilota Access apliecinājums. **Neveic
šos soļus ārpus apstiprināta domēna pārejas loga**, jo Access aplikācija uz
saknes domēna tūlīt ietekmēs pašreizējo `lumiq.cam` vietni.

1. Ieplānotajā pārejas logā Cloudflare Zero Trust atver **Access controls →
   Applications → Create new application → Self-hosted**.
2. Pievieno visu `lumiq.cam` hostname kā vienu app (ne tikai `/app` vai `/api`)
   un Allow politikā atstāj tikai īpašnieku un nosauktos testētājus. Neveido
   `Bypass` vai publisku Allow politiku.
3. Pārlūkā bez Access sesijas pārbaudi `/`, `/app`, `/features`, `/api/config`,
   `/api/events`, `/healthz`, `/auth/verify`, `/auth/reset`, `/auth/email`,
   `/api/auth/google/callback` un vienu sintētiska pasākuma viesu URL. Visām
   takām jāapstājas pie Access login/deny; neviena nedrīkst atdot lietotnes
   saturu, API datus vai Worker veselības atbildi.
4. Atļautā testa sesijā atver organizatora lietotni un viesa URL; statiskajiem
   failiem un API pieprasījumiem jāstrādā, un Supabase Auth atgriešanās saitēm
   jāsaglabā pareizais ceļš pēc Access autentifikācijas.
5. Pārbaudi Access audit žurnālus, saglabā nekonfidenciālus statusus un tikai
   pēc tam turpini ar Worker hostname piesaistes nomaiņu. Ja kāds ceļš apiet
   Access vai testētājs nevar atgriezties pēc login, apturi cutover.

Cloudflare ļauj self-hosted Access aplikācijai aizsargāt visu hostname, kā arī
atsevišķus ceļus; šim slēgtajam pilotam jāizvēlas viss hostname:
[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/),
[self-hosted public app](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

## 1. Autentifikācija testa vidē

Sagatavo atsevišķu testa e-pasta adresi, kurai vari piekļūt. Nemaini vienīgo
īpašnieka konta paroli, ja neesi gatavs pēc tam pieteikties ar jauno paroli.

1. Atver closed-test lietotni caur Access. Reģistrē testa kontu, atver
   apstiprinājuma e-pastu un seko saitei.
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

Pašreizējam datoram trūkst `pg_dump` un `pg_restore`, un Docker dzinējs nebija
pieejams. Šo soli veic tikai, kad tie ir uzstādīti/palaisti, un kad ir pieejams
**atsevišķs tukšs** Supabase/R2 atjaunošanas mērķis. Nekad neatjauno esošajā
closed-test DB vai bucketā.

1. Uzstādi PostgreSQL klienta rīkus, kuru `pg_dump`/`pg_restore` versija atbilst
   avota PostgreSQL galvenajai versijai; PowerShell pārbaudi:
   `Get-Command pg_dump,pg_restore`. Docker variantā vispirms palaid Docker
   Desktop un sagaidi, līdz `docker info` beidzas bez kļūdas.
2. Slēptā vietējā terminālī sagatavo avota DB Session Pooler URL (5432) un
   slēgtā testa R2 lasīšanas atslēgas vides mainīgajos; izpildi
   `npm run backup -- backups/lumiq-restore-drill`. Nekādas atslēgas čatā vai
   `.env`/Git failā.
3. Pārbaudi backup ar
   `npm run backup:verify -- backups/lumiq-restore-drill`. Tam jāpārbauda
   database dump, publisko tabulu inventārs un katra lokālā objekta kontrolsumma.
4. Izveido jaunu tukšu atjaunošanas DB un atsevišķu tukšu R2 bucket. Pārbaudi
   to projekta ID neatkarīgi. Nedrīkst būt tie paši target ID kā avotam.
5. Slēptajā terminālī ievadi tikai jaunā mērķa URL/atslēgas, uzstādi
   `PLATFORM_RESTORE_TARGET_REF` uz tukšā Supabase projekta ref un
   `PLATFORM_RESTORE_DRILL=EMPTY-ISOLATED-TARGET`; izpildi
   `npm run restore:drill -- backups/lumiq-restore-drill`.
6. Veiksmes izvadē jābūt sakrītošam publisko tabulu/rindu inventāram un visu R2
   atslēgu, izmēru, SHA-256 kontrolsummu sakritībai. Pēc tam manuāli izpildi
   migration verifieri, ielādē atjaunoto aplikāciju izolētā kandidātā, pārbaudi
   `/healthz`, login, galeriju un izvelc vismaz vienu atjaunoto ZIP.
7. Fiksē avota/mērķa ID (bez noslēpumiem), koda versiju, objektu/rindu skaitu,
   ZIP manifestu, ilgumu, neatbilstības un veicēju. Tikai tad atzīmē restore
   gate kā izpildītu. Pēc testa iznīcini tikai īpaši šim drill izveidotos
   atjaunošanas resursus.

Rīks nedrīkst tikt palaists, ja nevar skaidri pierādīt, ka mērķa DB un bucket ir
tukši un atsevišķi. Ja redzi neskaidru target ID vai secrets kļūdu, apstājies.

## 4. Slodze un drošības pārbaude

Slodzes testu neveic pret `lumiq.cam`, `lumiq-cam`, klientu e-pastiem vai īstu
foto datiem.

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

## 6. Windows DNS/TLS kļūdas novēršana

Pēdējā pārbaude 2026-09-25: publiskais Cloudflare DNS atgrieza
`104.21.67.110` un `172.67.221.99`, bet šī datora noklusētais DNS atgrieza
`81.198.92.113` (TTL 1). Iepriekšējā pārbaudē lokālais DNS bija
`192.168.1.254`, un parastais `curl` noraidīja sertifikātu ar
`SEC_E_UNTRUSTED_ROOT`. Atkārto testu ar aktuālajām atbildēm; nepaļaujies uz
agrāko resolver adresi vai uz vienu fiksētu Cloudflare IP.
Sertifikātu pārbaudi neizslēdz, neinstalē nepazīstamu saknes sertifikātu un
neveido hosts faila ierakstu.

1. Atver PowerShell un salīdzini datora DNS atbildi ar Cloudflare publisko DNS:

   ```powershell
   Resolve-DnsName lumiq.cam -Type A
   Resolve-DnsName lumiq.cam -Type A -Server 1.1.1.1
   ipconfig /all
   ```

   `ipconfig /all` atrod Wi-Fi adaptera `DNS Servers`. Saglabā rezultātus.
   Publisko Cloudflare IP vērtības var mainīties; salīdzini, vai lokālā un
   publiskā atbilde nāk no tās pašas paredzētās Cloudflare zonas, nevis
   paļaujies uz vienu mūžīgi fiksētu IP.
2. Notīri tikai Windows DNS kešu un pārbaudi vēlreiz:

   ```powershell
   ipconfig /flushdns
   Resolve-DnsName lumiq.cam -Type A
   curl.exe --fail --show-error https://lumiq.cam/healthz
   ```

   Paredzēts: parastais `curl` pabeidzas ar HTTP 200, TLS bez brīdinājuma un
   JSON ar `database: ready` un `storage: bound`. `ipconfig /flushdns` notīra
   klienta resolver kešu; tas pats par sevi neizlabo maršrutētāja DNS atbildi.
3. Ja lokālais DNS joprojām atšķiras, vispirms pārstartē pārlūku un maršrutētāju
   tikai tad, ja tas ir droši mājas tīklam. Maršrutētāja iestatījumos pārbaudi
   DNS proxy/forwarder, cache, vecās manuālās DNS vērtības, parental-control vai
   filtrēšanas funkciju. Ja neesi drošs par maršrutētāja izmaiņām, tās neveic.
4. Kā īslaicīgu, atgriezenisku pārbaudi Windows 11 iestati DNS tikai šim
   datoram: **Settings → Network & internet → Wi-Fi → Hardware properties →
   DNS server assignment → Edit → Manual → IPv4**; Preferred `1.1.1.1`,
   Alternate `1.0.0.1`; saglabā, atvieno/pieslēdz Wi-Fi un izpildi `ipconfig
   /flushdns`. Windows ekrānu nosaukumi var atšķirties. Lai atgrieztos,
   tajā pašā vietā izvēlies **Automatic (DHCP)**. Ja lieto ģimenes/uzņēmuma DNS
   filtrēšanu, neizslēdz to bez atļaujas.
5. Atkārto `Resolve-DnsName` un parasto `curl.exe` bez `--resolve`. Ja TLS kļūda
   paliek, pieraksti DNS serveru atbildes, sertifikāta kļūdu un tīklu; sazinies
   ar interneta pakalpojuma sniedzēju vai tīkla administratoru. Nekad
   neizmanto `curl -k` / `--insecure`.

Microsoft apraksta Windows DNS klienta keša pārbaudi un `ipconfig /flushdns`
[DNS troubleshooting](https://learn.microsoft.com/windows-server/networking/dns/troubleshoot/troubleshoot-dns-client)
un Windows 11 DNS servera maiņu sadaļā
[Essential network settings](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/essential-network-settings-and-tasks-in-windows).

## Rezultāta nodošana

Pēc katras sadaļas atsūti: sadaļas numuru, testa datumu, ierīci/vidi, iznākumu
(`pass`/`fail`), kļūdas tekstu un nekonfidenciālu ekrānattēlu. Nekad nesūti
paroles, pilnus auth URL ar tokeniem, database URL, R2 atslēgas vai QR viesu
sesijas tokenus.
