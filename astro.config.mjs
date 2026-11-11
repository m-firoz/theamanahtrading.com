import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Static output: no adapter and no server code are needed on Cloudflare.
export default defineConfig({
  site: 'https://theamanahtrading.com',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en', th: 'th', ms: 'ms', vi: 'vi',
          km: 'km', lo: 'lo', fil: 'fil', id: 'id',
        },
      },
      filter: (page) => !page.includes('/quote'),
    }),
  ],
});
