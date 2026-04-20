import { ContractCharges } from '../models/contract-charges.model';

// ======================================================
// ✅ API → UI (GET)
// ======================================================
/**
 * Maps API response to UI model
 * Converts timestamps to date strings for form inputs
 */
export function mapFuneralCharge(api: any): ContractCharges {
  console.log('🔄 MAPPER: mapFuneralCharge starting', { apiId: api?.id });

  const result = {
    ...api,

    // ✅ NUMBERS - safe conversion
    quantity: toNumber(api.quantity),
    unitPrice: toNumber(api.unitPrice),
    discount: toNumber(api.discount),

    // ✅ STRINGS - clean garbage
    chargeType: cleanString(api.chargeType),
    description: cleanString(api.description),
    createdBy: cleanString(api.createdBy),
    updatedBy: cleanString(api.updatedBy),
  };

  console.log('✅ MAPPER: mapFuneralCharge completed', {
    id: result.id,
    description: result.description,
  });
  return result;
}

// ======================================================
// ✅ UI → API (SAVE)
// ======================================================
/**
 * Maps form data back to API format
 */
export function mapFuneralChargeToApi(form: ContractCharges): any {
  console.log('🔄 MAPPER: mapFuneralChargeToApi starting', { id: form.id });

  const result = {
    ...form,

    // ✅ Ensure numbers are properly formatted
    quantity: toNumber(form.quantity),
    unitPrice: toNumber(form.unitPrice),
    discount: toNumber(form.discount),
    funeralService: form.funeralContractId,
  };

  console.log('✅ MAPPER: mapFuneralChargeToApi completed', { id: result.id });
  return result;
}

// ======================================================
// 🔧 HELPERS
// ======================================================

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function cleanString(value: any): string | null {
  if (!value) return null;
  const str = String(value).trim();
  return str.length === 0 ? null : str;
}

function toBoolean(value: any): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}
