// Business details live here so nothing is hard-coded in pages.
// Replace the [PLACEHOLDER] values before launch.
export const site = {
  name: 'The Amanah Trading',
  url: 'https://theamanahtrading.com',
  email: 'info@theamanahtrading.com',
  phoneDisplay: '[PHONE NUMBER]',
  phoneTel: '+66000000000', // international format, no spaces
  hours: '[OPENING HOURS]',
  timeZone: 'Asia/Bangkok',
  timeZoneLabel: 'Thailand time (UTC+7)',
  address: '',
  // Public Web3Forms access key (see README). Empty = test mode in development.
  formKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',
  countries: [
    'Thailand', 'Malaysia', 'Vietnam', 'Cambodia', 'Laos',
    'Philippines', 'Indonesia', 'Other',
  ],
} as const;
