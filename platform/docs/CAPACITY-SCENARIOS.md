# Foto ietilpiba un izmaksu scenariji

Datums: 2026-09-25. Plānu limiti atbilst `shared/plans.js`.

## Parbaudita implementacija

Avoti: shared/plans.js, public/upload.js, server/schema.sql.
Klients pienem JPEG, PNG un WebP lidz 30 MiB un 60 miljoniem pikselu.
HEIC/HEIF un RAW netiek pienemti tiesi. Foto tiek samazinats lidz 2400 px
garakaja mala un kodets WebP ar kvalitates parametru 0.84 (0.65, ja par lielu).
Sis parametrs nav solijums par 84% saglabatu kvalitati. Siktels: 360 px, 0.74.
Servera limiti: foto 6 MiB, siktels 1 MiB; abi skaitas pasakuma limita.
Katram plānam paredzēti 2 MiB vienam foto pārim, lai foto skaita limits būtu
praktiski sasniedzams arī detalizētiem optimizētiem attēliem.
4:3 foto pie 2400 px ir 2400x1800 jeb 4.32 MP, nevis telefona 48 MP originals.

| Plans | Foto | Kopapjoms | Videji uz foto ar siktelu |
|---|---:|---:|---:|
| Explore | 50 | 100 MiB | 2 MiB |
| Single Event / Gathering | 500 | 1000 MiB | 2 MiB |
| Studio | 1000 | 2000 MiB | 2 MiB |

Planā norādītais foto skaits un MiB apjoms ir atsevišķi limiti vienam eventam.
2 MiB ir paredzētais vidējais pāra budžets, nevis garantija: atsevišķi foto var
būt lielāki, un tad tiks sasniegts MiB limits pirmais. Foto un sīktēli tiek
skaitīti kopējā glabātuves apjomā. Izpildlaiks noraida upload, sasniedzot kādu
no limitiem.

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
| Single, viens pasakums katram menesi | 50000 | 52.43 GB | 12.23 GB | 24.47 GB | 48.93 GB | 48.93 GB |
| Gathering, 4 pasakumi katram | 200000 | 209.72 GB | 48.93 GB | 97.87 GB | 195.73 GB | 195.73 GB |
| Studio, 12 pasakumi katram | 1200000 | 1258.29 GB | 629.15 GB | 1258.29 GB | 2516.58 GB | 2516.58 GB |

Tabula piemero foto skaitu, eventa baitu limitu un glabasanas periodu. Jaunie
dati ir viena menesa eventu apjoms; uzkrajums ir stabila, vienmeriga publicesanas
menesa foto apjoms, bez eventa dienam, ZIP un backup kopijam.
100 Explore konti vienu reizi: 5000 foto, 5.243 GB pie 1 MiB pari vai 10.486 GB
pie pilna 100 MiB/eventa limita. Explore izmēģinājums neatkārtojas ik mēnesi.
100 Single Event pirceji viena menesi: 50,000 foto, 52.43 GB pie 1 MiB pari
vai 104.86 GB pie pilnas kvotas; 14 dienu vienmeriga glabasana dod 24.47 GB
pie 1 MiB pari vai 48.93 GB pie pilna limita.

## Jaukts portfelis

60 Gathering, 20 Studio, 20 Single pircēji (katrs Single pērk vienu pasākumu
katru mēnesi). Pie pilna foto skaita tie ir 370,000 jauni foto mēnesī. Stabils
foto uzkrājums bez ZIP: 0.5 MiB -> 157.64 GB; 1 MiB -> 315.27 GB;
2 MiB/pilnas kvotas -> 630.55 GB.

## R2 Standard glabasanas modelis

Oficialais avots: https://developers.cloudflare.com/r2/pricing/
Cena parbaudes bridi: USD 0.015/GB-month, pirmie 10 GB-month bez maksas.
Tabula ir tikai glabasana, stabila pilna menesa videjam datu apjomam.
Rekins tiek noapalots atbilstosi pakalpojuma noteikumiem.

| Portfelis | 0.5 MiB | 1 MiB | 2 MiB | Pilnas kvotas |
|---|---:|---:|---:|---:|
| 100 Gathering | ~$0.59 | ~$1.32 | ~$2.79 | ~$2.79 |
| 100 Studio | ~$9.30 | ~$18.74 | ~$37.61 | ~$37.61 |
| Jauktais | ~$2.22 | ~$4.59 | ~$9.32 | ~$9.32 |

Automātiskais pilnās galerijas ZIP glabājas līdz tā paša pasākuma foto glabāšanas
termiņa beigām. Tas satur oriģinālos optimizētos WebP foto, nevis sīktēlus; tā
papildu R2 patēriņš ir ne vairāk kā foto daļa no eventa kvotas. Pie pilnām kvotām
un visiem aktīviem arhīviem 100 Gathering scenārija foto+ZIP glabāšana maksātu
ap ~$5.43, 100 Studio scenārijā ap ~$71.58, jauktajā ap ~$17.84 mēnesī.
Rēķins izmanto R2 Standard likmi, 90% oriģinālu/pari attiecību ZIP un 10 GB
bezmaksas daļu. Tas neietver API, datubāzi, CPU, citas R2 operācijas vai nodokļus.
Pēc ZIP izveides galerijas foto dzēšana
nemaina nemainīgo ZIP momentuzņēmumu un jaunu ZIP neveido. Galerijas foto un
ZIP tiek iztīrīti tikai pēc pasākuma foto glabāšanas termiņa beigām.

Papildus: rakstisanas/lasisanas operacijas, API/compute, datubaze,
autentifikacija, hostings, epasti, nodokli, maksajumu komisijas, backups un ZIP.
R2 Standard Class A: $4.50/milj., Class B: $0.36/milj.; konta bezmaksas
atlaides ir 1 milj. A un 10 milj. B menesi, dalitas ar citiem bucketi. Cloudflare
operaciju izmaksu rekins tiek noapalots uz augsejo miljonu, un realo apmaksajamo
apjomu ietekme visa konta pieprasijumi. 100 Studio kontu pilna izmantošana rada
vismaz 2.4 milj. foto/siktelu PUT un ap 121.2 milj. B lasijumu (120 milj.
pilna izmēra skatījumi plus 1.2 milj. ZIP veidošanas lasījumi), pirms papildu
galerijas, preview, API un retries.

Cloudflare R2 un Workers cenu lapas norada bezmaksas egress; šajā modelī Worker
foto pieprasījumu CPU un skaits tiek rēķināts atsevišķi. Ja attēlus pārsūtīs
cits hostings ārpus Cloudflare Worker/R2 ceļa, tā datu pārsūtīšanas cena vēl
jāpārbauda gala izvietojumā.

ZIP nav bezmaksas vietas ziņā: WebP jau ir saspiests, tāpēc arhīvs aizņem
aptuveni pašu foto failu apjomu. Iepriekšējā septiņu dienu eksporta pieņēmuma
vietā automātiskais arhīvs tiek glabāts līdz foto termiņa beigām (7/14/30 dienas).
Maksimālā papildu glabātuve ir foto daļa no eventa limita; sīktēli ZIP netiek
iekļauti. Atsevišķa pilna rezerves kopija var vēlreiz palielināt glabātuvi.

## Ieteikums

Gathering ir 30 EUR menesi un dod 4 jaunus pasakumus perioda; Studio ir 70 EUR
menesi un dod 12. Studio katrs pasakums var glabat 2000 MiB, foto 30 dienas.
Tas dod līdz 23.44 GiB jaunu foto kvotu uz Studio klientu apmaksātā periodā,
pirms eksporta arhīviem un rezerves kopijām.
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
