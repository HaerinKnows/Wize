export type ParsedSms = {
  merchant: string;
  amountMinor: number;
  timestamp: string;
  sourceId: string;
};

export const parseSmsSample = (body: string): ParsedSms | null => {
  const amountMatch = body.match(/(?:USD|\$)\s?([0-9]+(?:\.[0-9]{1,2})?)/i);
  const merchantMatch = body.match(/at\s([A-Za-z0-9\s]+)/i);
  if (!amountMatch) return null;
  const major = Number(amountMatch[1]);
  if (Number.isNaN(major)) return null;
  return {
    merchant: merchantMatch?.[1]?.trim() ?? 'Unknown Merchant',
    amountMinor: Math.round(major * 100),
    timestamp: new Date().toISOString(),
    sourceId: `sms_${Date.now()}`
  };
};
