# The Amanah Trading website

B2B wholesale site for **The Amanah Trading Co., Ltd.** (theamanahtrading.com), selling to wholesalers and
traders in Thailand, Malaysia, Vietnam, Cambodia, Laos, the Philippines and Indonesia.

- **Stack:** Astro 7 + React islands, fully static. No server code and no Astro adapter.
- **Hosting:** Cloudflare Worker `theamanahtrading-com` (static assets), built automatically from this repo.
- **Products:** edited by the client in Pages CMS. One JSON file per product.
- **Quote requests:** sent to info@ through Web3Forms (no access key yet).
- **Languages:** 8 (en, th, ms, vi, km, lo, fil, id). English is the source.

## Run it locally

Needs Node 22 or newer.

```bash
npm ci
cp .env.example .env     # leave the key empty to try the quote flow in test mode
npm run dev              # http://localhost:4321
npm run build            # static site in ./dist
```

With no Web3Forms key, the quote form runs in **test mode** in development ("Test mode: nothing was sent").
In a production build with no key, the form refuses to send and asks the buyer to call or email.

`package.json` and `package-lock.json` must stay in sync, or the Cloudflare build fails at `npm ci`.

## Updating the repo (GitHub Desktop)

1. Delete everything in the local folder **except `.git`** (unzipping over it does not remove deleted files).
2. Unzip the new version into the folder.
3. Check the changes list in GitHub Desktop, commit, push.

Never commit `node_modules`, `dist`, `.astro` or `.env` (all are in `.gitignore`), and never commit the
company-registration PDFs.

## Hosting and deploys (Cloudflare)

| What | Setting |
|---|---|
| Worker | `theamanahtrading-com` (name must match `wrangler.jsonc`) |
| Git | `m-firoz/theamanahtrading.com`, branch `main` (Workers Builds) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` (serves `./dist`, see `wrangler.jsonc`) |
| Domains | `theamanahtrading.com` and `www.theamanahtrading.com` (custom domains on the Worker) |
| www | Redirect rule: `www` → `https://theamanahtrading.com`, path and query kept |
| Test URL | `theamanahtrading-com.muhtasim2798.workers.dev` |

- Every push to `main` builds and deploys. A failed build leaves the previous version live.
- **Rebuild without a push:** Settings → Builds → Deploy Hooks has a hook named `manual-rebuild` (branch `main`).
  Sending a POST to its link builds the latest commit. Keep the link private. "Retry build" on the Deployments
  page re-runs an old commit, not the latest one.
- **If pushes stop deploying:** check that the "Cloudflare Workers and Pages" GitHub app still has access to this
  repo (GitHub → Settings → Applications → Configure → Repository access).
- Add `PUBLIC_WEB3FORMS_KEY` as a **build** variable (Settings → Builds → Variables and secrets) once it exists.

### DNS and email

The domain's DNS is on Cloudflare. Email runs on **Purelymail**. Do not touch these records:
MX (`mailserver.purelymail.com`), SPF TXT, the Purelymail ownership TXT, `purelymail1/2/3._domainkey`,
`_dmarc`, `autoconfig` and the `_autodiscover._tcp` SRV record.
Do **not** enable Cloudflare Email Routing: it replaces the MX records Purelymail needs.
The old cPanel host (162.0.215.16) is suspended and all its records have been removed.

## Client editing with Pages CMS

1. The client signs in at `app.pagescms.org`, opens this repository and uses **Products**.
2. Each save is a commit, so it deploys like any push.
3. The build validates every product (required fields, units, category, image exists, unique SKU).
   A bad entry fails the build and the previous site stays live.

## Products and categories

- One JSON file per product in `src/content/products/`, one photo per product in `src/assets/products/`
  named `<slug>-1.<ext>`. Only the first photo is used.
- Fields: SKU, name (as printed on the pack, never translated), optional short description (under 300
  characters), category, pack sizes (optional free text, shown as "-" if empty), MOQ (value + unit, metric tons
  by default), published, order.
- **Two category levels:** 9 detailed internal categories (`src/content/categories/`, used in the CMS) each map
  to one of 6 public groups shown on the site: Rice, Spices & seasonings, Dried herbs & garlic, Pulses & lentils,
  Snacks, Ghee (ids `rice`, `spices`, `herbs`, `pulses`, `snacks`, `ghee`, used in `?group=` links).
  The group list lives in `src/content.config.ts`, `src/lib/products.ts` and `groups` in the language files.
  Keep `.pages.yml` category options in step with `src/content/categories/`.
- 41 products: Rice 8, Spices & seasonings 19, Dried herbs & garlic 5, Pulses & lentils 3, Snacks 3, Ghee 3.
  Crushed Red Pepper Flakes sits in Ground spices (its SKU still starts DHV-, which is fine).

## Design

- Colours (`src/styles/tokens.css`): navy `#172F46`, honey `#E3A72F` accent, cream `#F7F3EA`, white sections.
- Fonts (self-hosted via Fontsource): Playfair Display for headings, Inter for body, Barlow Condensed for the
  hero button only, lining numerals. Thai, Khmer and Lao use Noto Sans, loaded only when needed.
- Pages: Home, Products (filter chips on desktop, swipe rows per group on phone), About, Quote list, Privacy, 404.

## Business details and translations

- Business details: `src/config/site.ts` (phone, email, legal name, and the hours used in the English email to info@).
- Hours on the pages come from the language files (`contact.days/time/timeZone`, same keys under `quote`):
  "7 days a week, 8:00 am – 8:00 pm (Thailand time, UTC+7)". If hours change, update `site.ts` and every language file.
- Country names in the quote form are translated (`countries` in the language files); the English name is what is sent.
- UI text: `src/i18n/ui/<lang>.json`. A missing key falls back to English, key by key.
- Status: English and **Thai complete** (every key). Malay, Vietnamese, Khmer, Lao, Filipino and Indonesian are still
  empty and show English. Product names and pack sizes stay as written in every language.
- Every translation needs a native-speaker read of home, About, contact and the privacy notice before launch.

## Privacy

- No analytics or third-party scripts load. The consent banner is ready (Accept and Reject are equal, nothing
  pre-ticked, choice kept 12 months in this browser). `window.amanahConsent.get()` returns the choice.
- The quote list lives in the browser session only. The form sends data to Web3Forms, which emails info@.
  Name Web3Forms and its processors in the privacy notice. The notice is a draft for a Thai adviser to review.

## House rules

- Never show origin countries on the site.
- No WhatsApp or LINE.
- `public/robots.txt` stays **Disallow** until launch.
- No sitemap or SEO work until the final version (`@astrojs/sitemap` stays in the config as it is).

## Before launch

1. Client confirms phone, hours and the About fact tiles.
2. Web3Forms key created, added as a build variable, and a real test quote sent.
3. Terms, FAQ and delivery info from the client.
4. Translations: Thai done (needs a native read); the other six still to do.
5. Privacy notice reviewed by a Thai adviser.
6. Test on real phones.
7. SEO round: sitemap, structured data, robots.txt switched to Allow.
