import { Transaction } from '@/types/domain';

const csvHeader = 'id,type,category,amount,currency,timestamp,notes';

export const exportService = {
  toCsv(rows: Transaction[]) {
    return [
      csvHeader,
      ...rows.map((r) => [r.id, r.type, r.category, r.amountMinor / 100, r.currency, r.timestamp, r.notes ?? ''].join(','))
    ].join('\n');
  },
  toOfx(rows: Transaction[]) {
    const txns = rows
      .map(
        (r) => `<STMTTRN><TRNTYPE>${r.type.toUpperCase()}</TRNTYPE><DTPOSTED>${r.timestamp}</DTPOSTED><TRNAMT>${
          r.amountMinor / 100
        }</TRNAMT><NAME>${r.category}</NAME></STMTTRN>`
      )
      .join('');
    return `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>${txns}</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
  },
  toPdfPlaceholder() {
    return 'PDF generation should be done with expo-print or backend stream for production.';
  },
  toXlsxPlaceholder() {
    return 'XLSX generation should use sheetjs in production.';
  }
};
