# Foto ietilpiba un izmaksu scenariji

Datums: 2026-09-14. Planos izmainas nav veiktas.

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
| Explore | 50 | 350 MiB | 7 MiB |
| Single Event / Gathering | 1500 | 5 GiB | 3.413 MiB |
| Studio | 5000 | 20 GiB | 4.096 MiB |

Explore pietiek pat 50 maksimalajiem 6+1 MiB pariem. Maksas planos foto
skaita sasniegsana nav garanteta: pie 7 MiB uz pari ietilpst tikai 731 vai
2925 foto. 100 MiB izmaksatu 2 MiB videjo budzetu, nevis atbalstitu visus
50 maksimalos failus. Pa esosais Explore limits ir 350 MiB.

## Modela pienemumi

100 lietotaji nozime 100 organizatorus, nevis viesus. Visi publice visus
atlautos pasakumus un sasniedz foto skaita limitu. Videja optimizeta foto
un siktela summa tiek model eta ar 0.5, 1 un 2 MiB. Tie ir jutiguma scenariji,
nevis realu klientu merijumi. Menesis model i ir 30 dienas, pasakumi isi,
publicesana vienmeriga, autom atiska dzesana strada. 90/180 dienas dod
aptuveni 3/6 menesu uzkrajumu; pasakuma ilgums, nevienmeriga publicesana
un dzesanas aizkave palielina maksimumu.

TB un GB tabulas ir decimalas vienibas (10^12 un 10^9 baiti).
GiB = 2^30 baiti, MiB = 2^20 baiti. 1 GiB = 1.073741824 GB.

## 100 organizatori viena plana

| Plans | Jauni foto menesi | Jauni dati pie 1 MiB | Uzkrajums pie 0.5 MiB | Pie 1 MiB | Pie 2 MiB | Pilna baitu kvota |
|---|---:|---:|---:|---:|---:|---:|
| Single, viens pirkums katram katru menesi | 150000 | 157.29 GB | 0.236 TB | 0.472 TB | 0.944 TB | 1.611 TB |
| Gathering, 4 pasakumi katram | 600000 | 629.15 GB | 0.944 TB | 1.887 TB | 3.775 TB | 6.442 TB |
| Studio, 12 pasakumi katram | 6000000 | 6291.46 GB | 18.874 TB | 37.749 TB | 75.497 TB | 154.619 TB |

Pilnas kvotas kolonna ir atsevisks slodzes scenarijs, nevis 2 MiB scenarijs.
100 Explore konti vienu reizi: 5000 foto, 5.243 GB pie 1 MiB vai 36.700 GB
pie pilnas kvotas. Izmeginajums neatkartojas katru menesi tam pasam kontam.
100 Single pirceji tikai vienu reizi: 157.286 GB pie 1 MiB vai 536.871 GB
pie kvotas; dati paliek aptuveni 90 dienas, nevis reizinami ar trim.

## Jaukts portfelis

60 Gathering, 20 Studio, 20 Single pirceji (katrs Single perk vienu katru menesi).
1470000 jaunu foto menesi. Pec stabilizesanas:
0.5 MiB -> 4.388 TB; 1 MiB -> 8.777 TB; 2 MiB -> 17.553 TB;
pilnas kvotas -> 35.111 TB.

## R2 Standard glabasanas modelis

Oficialais avots: https://developers.cloudflare.com/r2/pricing/
Cena parbaudes bridi: USD 0.015/GB-month, pirmie 10 GB-month bez maksas.
Tabula ir tikai glabasana, stabila pilna menesa videjam datu apjomam.
Rekins tiek noapalots atbilstosi pakalpojuma noteikumiem.

| Portfelis | 0.5 MiB | 1 MiB | 2 MiB | Pilnas kvotas |
|---|---:|---:|---:|---:|
| 100 Gathering | ~$14 | ~$28 | ~$56 | ~$97 |
| 100 Studio | ~$283 | ~$566 | ~$1132 | ~$2319 |
| Jauktais | ~$66 | ~$131 | ~$263 | ~$527 |

Papildus: rakstisanas/lasisanas operacijas, API/compute, datubaze,
autentifikacija, hostings, epasti, nodokli, maksajumu komisijas, backups un ZIP.
R2 Standard Class A: $4.50/milj., Class B: $0.36/milj.; bezmaksas
1 milj. A un 10 milj. B menesi. 6 milj. foto nozime vismaz 12 milj. PUT
foto+sikteliem: ap $49.50 A operaciju izmaksas pirms papildu darba.
100 lasijumi uz katru no 6 milj. foto butu 600 milj. GET un ap $212.40
B operacijas pec bezmaksas dalas, bez citiem lasijumiem.

R2 egress ir bez maksas, bet API serveris, kas parraida attela baitus,
var radit cita hostinga egress. Pasreizeja platformas photo route lasa
files.get un atgriez baitus, tapec kopigas infrastrukturas egress nav
automatiski nulle. Japarbauda gala izkartojums pirms publicesanas.

ZIP nav bezmaksas vietas zina: jau saspiests WebP parasti maz samazinas.
Viens pilns eksports katram pasakumam ar 7 dienu dzivi vienmeriga model i
pievieno lidz aptuveni menesa foto apjoms * 7/30. Vairaki vienlaicigi
eksporti vai visi vienas dienas eksporti var but daudz lielaki.
Atseviska pilna rezerves kopija var gandriz dubultot foto glabatuvi.

## Ieteikums

Gathering ietilpiba ir pietiekama optimizetam produktam. Studio maksimalais
limits ir 7 GiB * 12 pasakumi katra perioda ar 60 dienu glabasanu. Vienmeriga
maksimala lietojuma modelis dod aptuveni 168 GiB aktivu foto datu uz klientu,
pirms eksporta arhiviem un rezerves kopijam. EUR 59 ir cenu hipoteze, nevis
garanteta pelna. Pirms cenu fiksesanas jaizmera realais p50/p95 foto para
izmers, R2 operacijas, eksporta darbs, maksajumu komisija un atbalsta laiks.

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
