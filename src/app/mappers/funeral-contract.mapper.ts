import { FuneralContract } from '../models/funeral-contract.model';


// ======================================================
// ✅ API → UI (GET)
// ======================================================
export function mapFuneralContract(api: any): FuneralContract {
  console.log('🔄 MAPPER: mapFuneralContract starting', { apiId: api?.id });
  
  const result = {
    ...api,

    // ✅ DATE → string (for input[type="date"])
    contractDate: formatDate(api.contractDate),
    dueDate: formatDate(api.dueDate),
    dateOfBirth: formatDate(api.dateOfBirth),
    dateOfDeath: formatDate(api.dateOfDeath),
    dateOfBurial: formatDate(api.dateOfBurial),
    dateSubmitted: formatDate(api.dateSubmitted),
    dateOfTransfer: formatDate(api.dateOfTransfer),
    dateReceived: formatDate(api.dateReceived),
    deliveryDate: formatDate(api.deliveryDate),
    autopsyDate: formatDate(api.autopsyDate),
    issuedOn: formatDate(api.issuedOn),
    dateEmblamed: formatDate(api.dateEmblamed),
    dateAshReleased: formatDate(api.dateAshReleased),
    timeEncoded: formatDate(api.timeEncoded),
    cremationDate: formatDate(api.cremationDate),

    // ✅ datetime-local
    startOfTransaction: formatDateTime(api.startOfTransaction),

    // ✅ numbers
    price: toNumber(api.price),
    discount: toNumber(api.discount),
    contracteeAge: toNumber(api.contracteeAge),
    age: toNumber(api.age),

    // ✅ clean garbage
    firstName: cleanString(api.firstName),
    middleName: cleanString(api.middleName),
    lastName: cleanString(api.lastName),

    // ✅ booleans
    familyWillConvo: toBoolean(api.familyWillConvo),
    cleared: toBoolean(api.cleared),
    collectorRemarks: toBoolean(api.collectorRemarks),
    cityDocsCompletion: toBoolean(api.cityDocsCompletion),
  };

  console.log('✅ MAPPER: mapFuneralContract completed', { id: result.id, firstName: result.firstName });
  return result;
}


// ======================================================
// ✅ UI → API (SAVE)
// ======================================================
export function mapFuneralContractToApi(form: FuneralContract): any {
  console.log('🔄 MAPPER: mapFuneralContractToApi starting', { id: form.id, firstName: form.firstName });

  const result = {
    ...form,

    // ✅ convert string → timestamp
    contractDate: toTimestamp(form.contractDate),
    dueDate: toTimestamp(form.dueDate),
    dateOfBirth: toTimestamp(form.dateOfBirth),
    dateOfDeath: toTimestamp(form.dateOfDeath),
    dateOfBurial: toTimestamp(form.dateOfBurial),
    dateSubmitted: toTimestamp(form.dateSubmitted),
    dateOfTransfer: toTimestamp(form.dateOfTransfer),
    dateReceived: toTimestamp(form.dateReceived),
    deliveryDate: toTimestamp(form.deliveryDate),
    autopsyDate: toTimestamp(form.autopsyDate),
    issuedOn: toTimestamp(form.issuedOn),
    dateEmblamed: toTimestamp(form.dateEmblamed),
    dateAshReleased: toTimestamp(form.dateAshReleased),
    timeEncoded: toTimestamp(form.timeEncoded),
    cremationDate: toTimestamp(form.cremationDate),

    // datetime-local
    startOfTransaction: toTimestamp(form.startOfTransaction),
  };

  console.log('✅ MAPPER: mapFuneralContractToApi completed', { id: result.id });
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
  console.log(`📅 formatDate: ${value} (${new Date(value).toISOString()}) → ${formatted}`);
  return formatted;
}

// ✅ datetime → yyyy-MM-ddTHH:mm (for input[type="datetime-local"]) - TIMEZONE SAFE
function formatDateTime(value: any): string | null {
  if (!value) return null;

  let date: Date;

  if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    // If already in correct format, return as-is
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.substring(0, 16);
    }
    date = new Date(value);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    console.warn(`⚠️ Invalid datetime value: ${value}`);
    return null;
  }

  // Use UTC to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
  console.log(`⏰ formatDateTime: ${value} → ${formatted}`);
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
    // Parse yyyy-MM-dd or yyyy-MM-ddTHH:mm format
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