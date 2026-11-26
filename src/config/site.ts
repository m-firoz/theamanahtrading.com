// Business details live here so nothing is hard-coded in pages.
// Replace the [PLACEHOLDER] values before launch.
export const site = {
  name: 'The Amanah Trading',
  legalName: 'The Amanah Trading Co., Ltd.',
  url: 'https://theamanahtrading.com',
  email: 'info@theamanahtrading.com',
  phoneDisplay: '+66 90 094 7292',
  phoneTel: '+66900947292', // international format, no spaces
  hours: '8:00 am – 8:00 pm',
  timeZone: 'Asia/Bangkok',
  timeZoneLabel: 'Thailand time, UTC+7',
  address: '',
  // Public Web3Forms access key (see README). Empty = test mode in development.
  formKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',
  countries: [
    'Thailand', 'Malaysia', 'Vietnam', 'Cambodia', 'Laos',
    'Philippines', 'Indonesia', 'Other',
  ],
} as const;
