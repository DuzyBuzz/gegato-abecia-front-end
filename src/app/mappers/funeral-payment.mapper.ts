import { FuneralPayment } from '../models/funeral-payment.model';

// ======================================================
// ✅ API → UI (GET)
// ======================================================
/**
 * Maps API response (raw timestamp) to UI model (formatted strings)
 * Converts timestamps to date strings for form inputs
 */
export function mapFuneralPayment(api: any): FuneralPayment {
  console.log('🔄 MAPPER: mapFuneralPayment starting', { apiId: api?.id });

  const result = {
    ...api,

    // ✅ DATE → string (for input[type="date"])
    dateIssued: formatDate(api.dateIssued),
    checkDate: formatDate(api.checkDate),

    // ✅ NUMBERS - safe conversion
    amount: toNumber(api.amount),

    // ✅ STRINGS - clean garbage
    controlNumber: cleanString(api.controlNumber),
    issuedBy: cleanString(api.issuedBy),
    bank: cleanString(api.bank),
    accountNumber: cleanString(api.accountNumber),
    description: cleanString(api.description),
    remarks: cleanString(api.remarks),

    // ✅ BOOLEANS
    checkCleared: toBoolean(api.checkCleared),
  };

  console.log('✅ MAPPER: mapFuneralPayment completed', {
    id: result.id,
    amount: result.amount,
  });
  return result;
}

// ======================================================
// ✅ UI → API (SAVE)
// ======================================================
/**
 * Maps form data (formatted strings) back to API format (timestamps)
 * Converts date strings back to timestamps for backend storage
 */
export function mapFuneralPaymentToApi(form: FuneralPayment): any {
  console.log('🔄 MAPPER: mapFuneralPaymentToApi starting', { id: form.id });

  const result = {
    ...form,

    // ✅ convert string → timestamp
    dateIssued: toTimestamp(form.dateIssued),
    checkDate: toTimestamp(form.checkDate),
  };

  console.log('✅ MAPPER: mapFuneralPaymentToApi completed', { id: result.id });
  return result;
}

// ======================================================
// 🔧 HELPERS
// ======================================================

// ✅ date → yyyy-MM-dd (for input[type="date"]) - TIMEZONE SAFE
function formatDate(value: any): string | null {
  if (!value) return null;

  let date: Date;

  if (typeof value === 'number') {
    // Timestamp in milliseconds from API
    date = new Date(value);
  } else if (typeof value === 'string') {
    // If already in yyyy-MM-dd format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // Parse string date
    date = new Date(value);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    console.warn(`⚠️ Invalid date value: ${value}`);
    return null;
  }

  // Use UTC to avoid timezone offset issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  const formatted = `${year}-${month}-${day}`;
  console.log(
    `📅 formatDate: ${value} (${new Date(value).toISOString()}) → ${formatted}`
  );
  return formatted;
}

// ✅ string → timestamp (for backend) - TIMEZONE SAFE
function toTimestamp(value: any): number | null {
  if (!value) return null;

  let date: Date;

  if (typeof value === 'number') {
    // Already a timestamp, return as-is
    return value;
  } else if (typeof value === 'string') {
    // Parse yyyy-MM-dd format
    // Use UTC to avoid timezone offset issues
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    console.warn(`⚠️ Cannot convert to timestamp: ${value}`);
    return null;
  }

  const timestamp = date.getTime();
  console.log(`⏱️ toTimestamp: ${value} → ${timestamp}`);
  return timestamp;
}

// ✅ safe number
function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  const num = Number(value);
  return isNaN(num) ? null : num;
}

// ✅ safe boolean
function toBoolean(value: any): boolean {
  return value === true || value === 1 || value === '1';
}

// ✅ clean junk values
function cleanString(value: any): string | null {
  if (!value) return null;

  const trimmed = String(value).trim();

  if (trimmed === '' || trimmed === ',' || trimmed === '-') {
    return null;
  }

  return trimmed;
}
