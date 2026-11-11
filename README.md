# The Amanah Trading website

Static multilingual site (8 languages) built with **Astro + React islands**, deployed on **Cloudflare**.
Products are edited by the client through **Pages CMS**. Quote requests go to **info@** through **Web3Forms**.
Decisions and reasoning are in the build spec (Claude Doc "Build Spec: Client Website").

## Run it locally

Needs Node 22 or newer.

```bash
npm install
cp .env.example .env     # leave the key empty to try the quote flow in test mode
npm run dev              # http://localhost:4321
npm run build            # static site in ./dist
```

In development, with no Web3Forms key, submitting the quote form runs in **test mode**:
the confirmation page appears and shows "Test mode: nothing was sent". In a production build
with no key, the form refuses to send and tells the buyer to call or email.

## Before launch (checklist)

1. `src/config/site.ts`: set the phone number (display and international `tel`), opening hours, address if any.
2. Web3Forms: create an access key for `info@theamanahtrading.com` (the key is emailed to that inbox).
   Put it in `PUBLIC_WEB3FORMS_KEY` (Cloudflare build variables and your local `.env`). Choose the shortest
   retention in the Web3Forms dashboard; keep hCaptcha off at launch and switch it on if spam appears.
3. Products have no pages of their own: the products page shows every product as a card (photo, name, unit weight, MOQ, Add to quote). Each card can also carry an optional short description (under 300 characters). It is shown exactly as written in every language, so write it in English or leave it empty; per-language descriptions can be added later. The home page carousel shows up to 8 products: those marked "Show in the home page carousel" (`featured`), or the first 8 if none are marked. The sample products (SAMPLE-001 to SAMPLE-010) are placeholders so the carousel has something to scroll: delete them. Replace sample products (`src/content/products/*.json`, `src/assets/products/*`) and categories
   (`src/content/categories/*.json`). Keep `.pages.yml` category options in step with the categories.
4. Translations: `src/i18n/ui/<lang>.json`. English is the source. A missing key falls back to English.
   `th.json` has two sample keys; the other six are empty stubs. Translate after the English copy is final,
   then have a native speaker read home, terms, contact and the privacy notice (Thai first).
5. Privacy notice (`privacy.sections` in the language files): fill every [bracket]; have the Thai adviser review it,
   the consent wording, and the "request for quote, not an order" statement.
6. Fonts: Inter and Fraunces are placeholders (open licence, self-hosted via Fontsource). Thai, Khmer and Lao use
   Noto Sans. Fontsource loads each script only when a page needs it.
7. Colours: edit `src/styles/tokens.css` only. Current palette: Sky Blue `#00A6FB` (primary), Background `#F5F7F9`, Accent navy `#172F46`. Navy text on Sky Blue is 5.1:1 (fine); white text on Sky Blue is only 2.7:1, so never put white text on it.

## Deploy on Cloudflare

The site is fully static, so it needs **no Astro adapter**.

- Workers Builds (Cloudflare's recommended route for new projects): connect the GitHub repo,
  build command `npm run build`, deploy command `npx wrangler deploy` (uses `wrangler.jsonc`, which serves `./dist`).
- Or a Pages project: build command `npm run build`, output directory `dist`, leave the deploy command empty.
- Set `PUBLIC_WEB3FORMS_KEY` as a build variable, and check the Node version setting is 22 or newer.
- Do **not** enable Cloudflare Email Routing on the domain: it replaces the MX records that Purelymail needs.

## Client editing with Pages CMS

1. Make the repository private and invite the client's GitHub account as a collaborator.
2. The client signs in at `app.pagescms.org`, opens the repository, and uses **Products**.
3. Each save is a commit. The build validates every product (required fields, units, category, image exists,
   unique SKU). A bad entry fails the build and the previous site stays live.
4. Test once with the client before launch: add one product with a photo and watch it go live.

Notes: image names are matched by file name, so the folder prefix Pages CMS writes does not matter.
Pages CMS can also edit a CSV as a spreadsheet-style grid; if bulk editing becomes common, switching products
to one CSV file is a small change in `content.config.ts` and `.pages.yml`.

## Privacy by design

- No analytics or third-party scripts load. The consent banner is ready: Accept and Reject are equal,
  nothing is pre-ticked, and the choice (kept 12 months) is stored in this browser only.
  `window.amanahConsent.get()` returns the choice; load any future analytics only when `analytics` is true.
- The quote list and confirmation live in the browser session only. Nothing is stored by us.
- The quote form sends data to Web3Forms, which emails it to info@. Name Web3Forms and its processors
  (AWS, CleanTalk, Akismet, and hCaptcha only if enabled) in the privacy notice.

## Where things are

| What | Where |
|---|---|
| Business details | `src/config/site.ts` |
| Languages and UI text | `src/i18n/` |
| Products and categories | `src/content/` and `src/assets/products/` |
| Product rules and validation | `src/content.config.ts`, `src/lib/products.ts` |
| Quote list, form and PDF record | `src/components/QuoteList.tsx` |
| Consent banner | `src/components/ConsentBanner.astro` |
| Styles and palette | `src/styles/` |
| Pages (one file serves all 8 languages) | `src/pages/[...lang]/` |
