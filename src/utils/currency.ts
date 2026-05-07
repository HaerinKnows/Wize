const REGION_CURRENCY_MAP: Record<string, string> = {
  PH: 'PHP',
  ID: 'IDR',
  MY: 'MYR',
  SG: 'SGD',
  TH: 'THB',
  VN: 'VND',
  IN: 'INR',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  HK: 'HKD',
  TW: 'TWD',
  AU: 'AUD',
  NZ: 'NZD',
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  CY: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  BH: 'BHD',
  OM: 'OMR',
  KW: 'KWD',
  TR: 'TRY',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  UA: 'UAH',
  RU: 'RUB'
};

let cachedLocale: string | undefined;
let cachedCurrency: string | undefined;

const extractRegion = (locale: string) => {
  try {
    const IntlLocale = (Intl as unknown as { Locale?: new (tag: string) => { region?: string } }).Locale;
    if (IntlLocale) {
      const parsed = new IntlLocale(locale);
      if (parsed.region) {
        return parsed.region.toUpperCase();
      }
    }
  } catch {
    // fallback parser below
  }

  const normalized = locale.replace('_', '-');
  const parts = normalized.split('-');

  for (const part of parts) {
    if (/^[A-Za-z]{2}$/.test(part)) {
      return part.toUpperCase();
    }
  }

  return undefined;
};

export const getPreferredLocale = () => {
  if (cachedLocale) return cachedLocale;

  const fallback = 'en-US';
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
    cachedLocale = resolved || fallback;
    return cachedLocale;
  } catch {
    cachedLocale = fallback;
    return cachedLocale;
  }
};

export const getPreferredCurrency = () => {
  if (cachedCurrency) return cachedCurrency;

  const locale = getPreferredLocale();
  const region = extractRegion(locale);
  cachedCurrency = (region && REGION_CURRENCY_MAP[region]) || 'PHP';
  return cachedCurrency;
};

export const formatCurrency = (minor: number, currency?: string, locale?: string) => {
  const finalLocale = locale ?? getPreferredLocale();
  const finalCurrency = currency ?? getPreferredCurrency();

  try {
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: finalCurrency,
      maximumFractionDigits: 2
    }).format(minor / 100);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(minor / 100);
  }
};

export const fromMajor = (amount: number) => Math.round(amount * 100);
