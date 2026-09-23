# Lumiq: pieslegsana soli pa solim

> **Vēsturiskas instrukcijas.** Šis dokuments apraksta Node/Render modeli un
> daļēji vairs neatbilst pašreizējam Cloudflare Worker izvietojumam. Pašreiz
> atļauts tikai bezmaksas, slēgts tests. Neizveido Render servisus, nemaini
> `lumiq.cam` DNS un nepieslēdz staging resursus jaunajam testam. Skati
> [CLOSED-FREE-TEST.md](CLOSED-FREE-TEST.md) un [PRODUCTION-COST-PLAN.md](PRODUCTION-COST-PLAN.md).

Statuss: lokals pirmsizlaides produkts. Nekas no si dokumenta nav izpildits makoni.
MVP projekts, ta Supabase, bucket `app-images`, Worker un Netlify vietne paliek neaiztikti.
Neveidot maksajumus, apmaksatus abonementus vai resursus, pirms ipasnieks tos atseviski apstiprina.

## 1. Lokala apskate tagad

1. Atver terminali mape `C:\Users\GKarans\Desktop\gala-produkts-saas`.
2. Parbaudi `git remote -v`: tam janorada uz `GKarans/gala-produkts-saas`, nevis MVP repozitoriju.
3. Pirmaja uzstadisana: `npm ci --ignore-scripts` un `npx playwright install chromium`.
4. Nonem attala servera `PLATFORM_DATABASE_URL` un `PLATFORM_R2_BUCKET` mainigos no si terminala, ja tadi ir. Lokala palaide tos apzinati noraida.
5. Palaid `npm run dev`. Atver `http://127.0.0.1:5700`.
6. Login lapa izmanto `Open sample workspace`, vai registre jaunu testa kontu. Vestules ir `/inbox`, nevis ista epasta.
7. `npm run verify` parbauda servera testus un publisko failu build. Pilnai izoletai parbaudei ar Chromium un drosibas skeneri lieto `npm run check`; tas pats iedarbina un aptur testa serveri un neizmanto tavu lokalo demo datubazi.
8. Dati paliek `platform/.local`. Testu atteli ir sintesiski. Neievadi savas istas paroles.

## 2. Pirms jaunas infrastrukturas

1. Izvelies atsevisku staging nosaukumu/domenu. Nepieskir MVP Netlify domenu.
2. Izvelies Node.js 22 servera vidi ar ilgstosu API procesu un atsevisku fona worker procesu. Sharp un ZIP darbiem neder tikai statisks Netlify publish vai isa Edge Function palaide.
3. Saja versija frontend un API lieto vienu HTTPS origin. Tas saglaba HttpOnly sesijas un CSRF politiku vienkarsu.
4. Node API var servet ari publiskos failus. Netlify nav obligats pirmajam staging testam. Ja lieto Netlify, nepieciesams apstiprinats reverse proxy uz jauno API visam `/api/*`; nedrikst publicet tikai `platform/dist` un sagaidit darbigu backend.
5. Sakuma viens API process un viens jobs process. API izmanto DB koplietotu rate limiter. Horizontala merogosana vel prasa proxy un jaudas parbaudi merka vide.
6. Izverte izmaksas PIRMS izvelies servera pakalpojumu. Saja uzdevuma neviens pakalpojums nav pasutits.

## 3. Jauns Supabase projekts

1. Supabase dashboard izveido JAUNU projektu tikai pec sava apstiprinajuma. Neatver MVP SQL Editor siem skriptiem.
2. Pieraksti jauno Project URL. Tam jabut citam neka MVP project reference.
3. Database sadaja izveido atsevisku backend DB lietotaju. Tas drikst stradat tikai ar sis platformas tabulam. Nelieto brauzera anon/publishable atslegu DB savienojumam.
4. Shemu uzstadi ar zemak aprakstito `npm run migrate`, nevis tikai ar viena SQL faila ielimesanu. Tas palaiz visas numuretas migracijas, ieskaitot `005-gallery-curation`, un saglaba checksum vesturi. SQL NEPALAIST vecaja projekta un neapvienot ar MVP `schema.sql`.
5. Platformas tabulas ir server-only: visam ieslegts RLS, `anon` un `authenticated` nav piekluves. Backend DB lomai jabut so tabulu ipasniekam vai speciali izveidotai lomai ar vajadzigo piekluvi. Nekonfigure publiskas RLS politikas, lai apietu serveri.
6. Platformas tabulam backend vajag SELECT/INSERT/UPDATE/DELETE. Nav vajadziga piekluve `auth` vai `storage` shemas datiem. Migracijas izpilda atseviska administratora loma, nevis browser vai parasts API pieprasijums.
7. SQL parbaude: `select tablename, rowsecurity from pg_tables where schemaname='public';`. Parliecinies, ka platformas tabulam `rowsecurity=true`.
8. API/Data API settings nepublice jaunas tabulas viesiem. Veic anon REST negative testu: accounts/events/media pieprasijumi nedrikst atgriezt ierakstus.
9. Backend slepenaja konfiguracija ievieto `PLATFORM_DATABASE_URL`. Lieto dashboard doto jauna projekta SSL savienojuma virkni un specialo DB lietotaju. Kopet to uz chatu nevajag.
10. Migratoram iestati administratora `PLATFORM_DATABASE_URL`, `PLATFORM_MODE=staging`, `PLATFORM_MIGRATE=1` un palaid `npm run migrate`. Pec tam nonem `PLATFORM_MIGRATE` un API/worker piesledz ar ierobezoto backend DB lietotaju. SQL failus pec to izmantosanas staging nemaini: pievieno jaunu numuretu migraciju. Parbaudi `select version,applied_at from platform_migrations order by version;`. Sagaidami `001-platform` lidz `005-gallery-curation`.

## 4. Supabase Auth

1. Authentication > URL Configuration: Site URL = jaunais HTTPS staging origin.
2. Redirect URLs pievieno tikai jaunus `/auth/verify`, `/auth/reset`, `/auth/email` celus. Nelieto plasu wildcard publiskai videi.
3. Iesledz epasta apstiprinasanu, paroles minimalo garumu 12 un droso epasta mainu. Custom SMTP piesledz tikai apstiprinatam sutitajam.
4. Authentication > Email Templates izmanto TokenHash saites, nevis klienta access token fragmentu:
   - Confirm signup: `{{ .SiteURL }}/auth/verify?token={{ .TokenHash }}`.
   - Reset password: `{{ .SiteURL }}/auth/reset?token={{ .TokenHash }}`.
   - Change email: `{{ .SiteURL }}/auth/email?token={{ .TokenHash }}`.
5. Backend konfiguracija ievieto `PLATFORM_SUPABASE_URL` un `PLATFORM_SUPABASE_PUBLISHABLE_KEY`. Backend adapteris izmanto Auth REST API; service-role atslega tam nav vajadziga.
6. Genere 32 nejausus baitus ar `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` sava terminali. Rezultatu saglaba parolu parvaldnieka un backend secret `PLATFORM_SESSION_ENCRYPTION_KEY`, nevis Git vai publiska faila.
7. Sis secret sifre provider access/refresh tokenus datubaze. Mainot to, vecas platformas sesijas bus nederigas; datu foto sifresana nav si secret funkcija.
8. Teste jaunu epastu: register > verify > login > reload > logout > reset > veca parole neder > jauna parole der > email change abi apstiprinajumi. Teste izbeigusos un otreiz izmantotu saiti.
9. Vietejie sample konti un `/api/local/*` staging ir izslegti. Netiek importets demo admin.

## 5. Privats R2 bucket

1. Cloudflare > R2 izveido JAUNU bucket, piemeram `lumiq-staging-photos`, tikai pec izmaksu apstiprinajuma.
2. `Public access` un `r2.dev` atstaj IZSLEGTU. Nepievieno publisko media domenu. Viesu piekluvi parbauda API katra attela pieprasijuma.
3. Izveido jaunu Object Read & Write API tokenu tikai sim bucket. Nekope MVP tokenu. Access Key ID un Secret Access Key glaba tikai backend secrets.
4. No bucket S3 API iestatijumiem nokope precizo endpoint, ari jurisdikcijas dalu, ja tada ir.
5. Iestati backend `PLATFORM_R2_BUCKET`, `PLATFORM_R2_ENDPOINT`, `PLATFORM_R2_ACCESS_KEY_ID`, `PLATFORM_R2_SECRET_ACCESS_KEY`.
6. Settings > CORS ievieto zemak esoso konfiguraciju, aizstajot origin. Neizmanto `*`:

```json
[
  {
    "AllowedOrigins": ["https://YOUR-NEW-STAGING-HOST"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "x-amz-checksum-sha256"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

7. Klients vispirms rezerve kvotu API, sanem 5 minutu parakstitu PUT saiti katram failam, suta WebP tiesi R2, tad prasa finalize. SHA-256, izmers un faila dekodesana tiek parbauditi serveri.
8. Saites atkartota izmantosana lidz termina beigam ir tehniski iespejama, bet parakstitais checksum/garums nedrikst laut aizstat ar citiem baitiem. Parbaudi to staging ar atskirigiem baitiem un lielaku failu. Sis R2 integracijas tests vel nav veikts uz jauna bucket.
9. Nosaukumi ir momentuznemums: `events/nosaukums--EVENT_ID/guests/vards--GUEST_ID/photo-MEDIA_ID.webp`. Vienadi vardi nekonflikte. Pardevejot eventu, esosie objekti neparvietojas.
10. CORS nav autorizacija. Pieeja bildem notiek caur API; zinama bucket adrese pati par sevi nedod lasisanas tiesibas.
11. Supabase Storage netiek lietots platformas foto. Supabase DB/Auth datu trafiks un Node/R2 operaciju izmaksas joprojam pastav; netiek solits pilnigs nulles egress vai neierobezota glabatuve.

## 6. Node API un jobs process

1. Jaunaja servera vide instale Node 22 un `npm ci --ignore-scripts` ar Linux optional dependencies. Parbaudi `node -e "import('sharp').then(()=>console.log('sharp ok'))"`.
2. Pievieno secret/config mainigos pec `platform/.env.example`; `.env` ir tikai paraugs. Saja faila nekad neieraksti istus secret un to nepublice.
3. `PLATFORM_MODE=staging`, `PLATFORM_RELEASE_APPROVED=staging`, `PLATFORM_ORIGIN=https://JAUNA-ADRESE` bez beigu `/`.
4. API start command: `npm start`. TLS termine uzticama proxy/servera prieksa; tikai HTTPS piekluve lietotajiem.
5. Otram procesam tas pati konfiguracija, start command `npm run worker`. Tas apstrada ZIP/cleanup un reizi minute retention un outbox. Nelieto vienu request-limited serverless callback ilgstosa worker vieta.
6. Healthcheck `/healthz` ir procesa dzivibas parbaude, nevis apliecinajums visu atkaribu darbspejai. Monitore ari sintetisku login/guest API un vecako queued/failed job.
7. Iestati `PLATFORM_TRUSTED_PROXY_IPS` tikai tiesa reverse proxy IP adresem. Proxy aizstaj, nevis nekontroleti parnes klienta X-Forwarded-For. Kods ignore forwarding no citiem avotiem un izmanto DB koplietotu limiter. Teste divus API procesus: tiem jasadala viens limits; viltots forwarding nedrikst to apiet.
8. Atver lapu un DevTools. Nedrikst but pieprasijumu uz MVP Supabase, Worker vai Netlify. Upload binarie PUT ir tikai jaunaja R2; lasisana ir caur platformas API.
9. Netlify krediti netiek izmantoti lokalam build vai Node serverim. Root Netlify/Worker konfiguracija si kopija apzinati nobloketa.

## 7. Maksajumi pagaidam izslegti

1. `render.yaml` nepievieno Stripe mainigos un Render vidē neatstāj `PLATFORM_STRIPE_*` vērtības.
2. Bez `PLATFORM_STRIPE_SECRET` konfigurācija ziņo, ka checkout ir izslēgts. Maksas plānu pogas ir atspējotas; serveris noraida tiešus checkout pieprasījumus, neveidojot pasūtījumu.
3. Explore izmēģinājuma plāns un tā publikācijas limits turpina darboties. Maksājumu simulācija ir pieejama tikai lokālajā izstrādē, nevis pieslēgtajā domēnā.
4. Stripe atslēgas, webhook, cenu ID, pirkuma izpildi un juridiski/nodokļu jautājumus konfigurē tikai atsevišķā, vēlāk apstiprinātā maksājumu palaišanā. Nekādā gadījumā neizmanto `sk_live_` šajā izvietojumā.

## 8. Servisa epasti

1. Izvelies apstiprinatu sutitaju. Resend adapteris jau ir; konta/domena izveide nav veikta.
2. Verifice savu domenu ar pakalpojuma prasitajiem DNS ierakstiem. Nemaini MVP domenu automatiski.
3. Backend secrets iestati `PLATFORM_EMAIL_KEY`, config `PLATFORM_EMAIL_FROM`.
4. Parbaudi testa sutijumu sev un apluko deliveries statusu. Klumes pec 5 meginajumiem paliek `failed`, nevis pazud.
5. Auth vestules suta Supabase SMTP; pasakuma/limitu/sharing/export/retention/billing/support vestules suta platformas outbox. Tas ir divas konfiguracijas.
6. Nesuti marketinga vestules; marketinga kampanas saja versija nav ieviestas.

## 9. Kas obligati jadara pirms publiskas pardosanas

Izpildi [LAUNCH-GATES.md](LAUNCH-GATES.md), aizpildi [ROADMAP-STATUS.md](ROADMAP-STATUS.md), pievieno faktiskos rezultatus [TESTING.md](TESTING.md).
Vispirms isolated staging, tad realu telefonu testi, backup/restore un drosibas parbaude, tad apstiprinats mazs pilots. Neviens automatizets tests neaizstaj operatora identitati, juridisko parbaudi vai realu servisu testu.

## Oficialas atsauces

- [Cloudflare presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
