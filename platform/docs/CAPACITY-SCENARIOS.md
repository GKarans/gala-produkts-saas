# Foto ietilpiba un izmaksu scenariji

Datums: 2026-09-22. Plānu limiti atbilst `shared/plans.js`.

## Parbaudita implementacija

Avoti: shared/plans.js, public/upload.js, server/schema.sql.
Klients pienem JPEG, PNG un WebP lidz 30 MiB un 60 miljoniem pikselu.
HEIC/HEIF un RAW netiek pienemti tiesi. Foto tiek samazinats lidz 2400 px
garakaja mala un kodets WebP ar kvalitates parametru 0.84 (0.65, ja par lielu).
Sis parametrs nav solijums par 84% saglabatu kvalitati. Siktels: 360 px, 0.74.
Servera limiti: foto 6 MiB, siktels 1 MiB; abi skaitas pasakuma limita.
4:3 foto pie 2400 px ir 2400x1800 jeb 4.32 MP, nevis telefona 48 MP originals.

| Plans | Foto | Kopapjoms | Videji uz foto ar siktelu |
|---|---:|---:|---:|
| Explore | 50 | 30 MiB | 0.6 MiB |
| Single Event / Gathering | 500 | 200 MiB | 0.4 MiB |
| Studio | 1000 | 400 MiB | 0.4 MiB |

Planā norādītais foto skaits un MiB apjoms ir atsevišķi limiti vienam eventam;
lietotājam tie ir skaidri jāparāda, neizsakot garantētu faila izmēru uz foto.
Foto un sīktēli tiek skaitīti kopējā glabātuves apjomā. Izpildlaiks noraida
augšupielādi, ja sasniegts foto skaita vai glabātuves limits.

## Modela pienemumi

100 lietotaji nozime 100 organizatorus, nevis viesus. Visi publice visus
atlautos pasakumus un sasniedz foto skaita limitu, ja vien pasakuma kopapjoma
limits to neatlauj. Saglabatais apjoms vienam eventam ir
`min(foto skaits * videjais foto+siktela izmers, eventa MiB limits)`. Videja
pair izmeri 0.5, 1 un 2 MiB ir jutiguma scenariji, nevis realu klientu merijumi.
Menesis ir 30 dienas, pasakumi isi, publicesana vienmeriga, dzesana strada.
Uzkrajums ir menesa publicesanas apjoms reiz plana glabasanas periods dalits
ar 30 dienam (14 dienas Single/Gathering; 30 dienas Studio). Pasakuma ilgums,
nevienmeriga publicesana un dzesanas aizkave var palielinat maksimumu.

TB un GB tabulas ir decimalas vienibas (10^12 un 10^9 baiti).
GiB = 2^30 baiti, MiB = 2^20 baiti. 1 GiB = 1.073741824 GB.

## 100 organizatori viena plana

| Plans | Jauni foto menesi | Jauni dati pie 1 MiB (pec eventa limita) | Uzkrajums pie 0.5 MiB | Pie 1 MiB | Pie 2 MiB | Pilna baitu kvota |
|---|---:|---:|---:|---:|---:|---:|
| Single, viens pasakums katram menesi | 50000 | 20.97 GB | 9.79 GB | 9.79 GB | 9.79 GB | 9.79 GB |
| Gathering, 4 pasakumi katram | 200000 | 83.89 GB | 39.15 GB | 39.15 GB | 39.15 GB | 39.15 GB |
| Studio, 12 pasakumi katram | 1200000 | 503.32 GB | 503.32 GB | 503.32 GB | 503.32 GB | 503.32 GB |

Tabula visur piemero foto skaitu un eventa baitu limitu reiz glabasanas terminu;
pie 0.5 MiB un lielaka paira izmera kopapjoma limits sasniedzas pirmais. Jaunais
datu apjoms ir pieskirta kvota visiem si menesa jaunajiem eventiem; uzkrajums
ir apjoms stabila, vienmerigas publicesanas menesi. ZIP un rezerves kopijas nav
ietvertas saja tabula.
100 Explore konti vienu reizi: 5000 foto, 5.243 GB pie 1 MiB vai 31.46 GB
pie pilnas kvotas. Izmeginajums neatkartojas katru menesi tam pasam kontam.
100 Single pircēji vienu reizi: ne vairāk kā 20.97 GB pie kopējās eventu kvotas;
vienmērīgā publicēšanas scenārijā 14 dienu glabāšana dotu aptuveni 9.79 GB.

## Jaukts portfelis

60 Gathering, 20 Studio, 20 Single pirceji (katrs Single perk vienu katru menesi).
370000 jaunu foto mēnesī. Pēc stabilizēšanās:
0.5 MiB -> aptuveni 142.96 GB; 1 MiB -> 285.91 GB; 2 MiB -> 571.83 GB;
pilnas kvotas -> aptuveni 126.11 GB.

## R2 Standard glabasanas modelis

Oficialais avots: https://developers.cloudflare.com/r2/pricing/
Cena parbaudes bridi: USD 0.015/GB-month, pirmie 10 GB-month bez maksas.
Tabula ir tikai glabasana, stabila pilna menesa videjam datu apjomam.
Rekins tiek noapalots atbilstosi pakalpojuma noteikumiem.

| Portfelis | 0.5 MiB | 1 MiB | 2 MiB | Pilnas kvotas |
|---|---:|---:|---:|---:|
| 100 Gathering | ~$0.44 | ~$0.44 | ~$0.44 | ~$0.44 |
| 100 Studio | ~$7.40 | ~$7.40 | ~$7.40 | ~$7.40 |
| Jauktais | ~$1.74 | ~$1.74 | ~$1.74 | ~$1.74 |

Automātiskais pilnās galerijas ZIP glabājas līdz tā paša pasākuma foto glabāšanas
termiņa beigām. Tas satur oriģinālos optimizētos WebP foto, nevis sīktēlus; tā
papildu R2 patēriņš ir ne vairāk kā foto daļa no eventa kvotas. Pie pilnām kvotām
un visiem aktīviem arhīviem 100 Gathering scenārijs ar ZIP maksātu ap ~$1.02,
100 Studio scenārijs ap ~$14.95, jauktais ap ~$3.63 mēnesī. Rēķins izmanto
R2 Standard glabāšanas likmi un 10 GB bezmaksas daļu; tas neietver API, datubāzi,
CPU, citas R2 operācijas vai nodokļus. Pēc ZIP izveides galerijas foto dzēšana
nemaina nemainīgo ZIP momentuzņēmumu un jaunu ZIP neveido. Galerijas foto un
ZIP tiek iztīrīti tikai pēc pasākuma foto glabāšanas termiņa beigām.

Papildus: rakstisanas/lasisanas operacijas, API/compute, datubaze,
autentifikacija, hostings, epasti, nodokli, maksajumu komisijas, backups un ZIP.
R2 Standard Class A: $4.50/milj., Class B: $0.36/milj.; bezmaksas
1 milj. A un 10 milj. B menesi. 1.2 milj. Studio scenarija foto nozime vismaz
2.4 milj. PUT foto+sikteliem: ap $6.30 A operaciju izmaksas pirms papildu darba.
100 lasijumi uz katru no 1.2 milj. foto butu 120 milj. GET un ap $39.60
B operacijas pec bezmaksas dalas, bez citiem lasijumiem.

R2 egress ir bez maksas, bet API serveris, kas parraida attela baitus,
var radit cita hostinga egress. Pasreizeja platformas photo route lasa
files.get un atgriez baitus, tapec kopigas infrastrukturas egress nav
automatiski nulle. Japarbauda gala izkartojums pirms publicesanas.

ZIP nav bezmaksas vietas ziņā: WebP jau ir saspiests, tāpēc arhīvs aizņem
aptuveni pašu foto failu apjomu. Iepriekšējā septiņu dienu eksporta pieņēmuma
vietā automātiskais arhīvs tiek glabāts līdz foto termiņa beigām (7/14/30 dienas).
Maksimālā papildu glabātuve ir foto daļa no eventa limita; sīktēli ZIP netiek
iekļauti. Atsevišķa pilna rezerves kopija var vēlreiz palielināt glabātuvi.

## Ieteikums

Gathering ir 30 EUR menesi un dod 4 jaunus pasakumus perioda; Studio ir 70 EUR
menesi un dod 12. Studio katrs pasakums var glabat 400 MiB, foto 30 dienas.
Vienmērīgas maksimālās publicēšanas modelis dod līdz 4.69 GiB jaunu foto kvotu
uz Studio klientu apmaksātā periodā, pirms eksporta arhīviem un rezerves kopijām.
Šī ir jauno pasākumu piešķirtā kvota, nevis garantija par faktisko vidējo patēriņu.
EUR 70 ir pirms-palaišanas cena, nevis garantēta peļņa. Pirms cenu fiksēšanas
jāizmēra reālais p50/p95 foto pāra izmērs, R2 operācijas, eksporta darbs,
maksājumu komisija un atbalsta laiks.

Izmerit dazadu telefonu dienas/nakts/detalizetus kadrus, reportet p50/p95/p99
pec tiesi browser optimize pl usmas. Mer it ari 20+ vienlaicigus upload,
galeriju skatijumus, ZIP CPU/RAM un db query slodzi. 100 organizatori vieni
pasi nenosaka vajadzigo servera CPU/RAM. Studio maksimums dod ap 36 milj.
saglabatu media ierakstu un 72 milj. attelu objektu pec 6 menesiem;
datubazes indeksi un uz katru lasijumu augosi metrics ieraksti ir atsevisks risks.

R2 nav jap erk fiks ets 100 GB disks; tas aug pec paterina. Budzeta brid inajumi,
pasakuma limiti, pieprasijumu limiti un parbaudama dzesana ir obligati.
Planot 20-30% operativu rezervi papildus apr ekinatam foto apjomam, bet
ZIP, backups un piku modeli skaitit atseviski: rezerve tos negarante.
