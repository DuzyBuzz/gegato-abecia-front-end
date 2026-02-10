/**
 * Fake Data Generator Utility
 * Generates 1000+ mock records for Users, Funeral Contracts, and Billing Accounts
 * Separated logic - call from login component only
 */

import { User } from '../app/shared/features/users/users.model';
import { FuneralContract } from '../app/models/funeral-contract.model';
import { BillingAccount, BillingTransaction } from '../app/models/billing-account.model';

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Michael', 'Anthony', 'Daniel', 'Carlos', 'Francisco',
  'Elena', 'Patricia', 'Sandra', 'Jennifer', 'Rosa', 'Angela', 'Carmen', 'Carmen',
  'Pedro', 'Manuel', 'Luis', 'Antonio', 'Jose', 'Fernando', 'Diego', 'Ramon'
];

const LAST_NAMES = [
  'Dela Cruz', 'Garcia', 'Santos', 'Reyes', 'Cruz', 'Morales', 'Tan', 'Villanueva',
  'Fernandez', 'Lopez', 'Martinez', 'Rodriguez', 'Hernandez', 'Sanchez', 'Perez',
  'Ramirez', 'Torres', 'Silva', 'Gutierrez', 'Mendoza', 'Vargas', 'Castro', 'Rojas'
];

const POSITIONS = [
  'System Administrator', 'Billing Officer', 'Operations Manager', 'Data Entry Personnel',
  'Finance Officer', 'Records Clerk', 'Report Viewer', 'Accounts Clerk', 'System Officer',
  'Audit Trail Viewer', 'Manager', 'Supervisor', 'Coordinator', 'Specialist', 'Assistant'
];

const ROLES = ['Admin', 'Biller', 'Staff', 'Viewer'];

const SERVICE_TYPES = [
  'Traditional Funeral', 'Complete Funeral Service', 'Burial Only', 
  'Cremation Service', 'Memorial Service', 'Direct Cremation'
];

const CREMATION_TYPES = ['Full Cremation', 'Body Viewing Then Cremation', 'No Cremation', 'Direct Cremation'];

const CITIES = [
  'Quezon City', 'Manila', 'Cebu City', 'Davao City', 'Makati City',
  'Iloilo City', 'Pasig City', 'Las Piñas City', 'Caloocan City', 'Valenzuela City'
];

const BARANGAYS = [
  'Barangay 1', 'Barangay 2', 'San Salvador', 'Mandurriao', 'Kamuning', 'Tatalon'
];

const CASKETS = [
  'SR FLEXI METAL', 'SR METAL SOLID', 'WOODEN CASKET', 'STEEL CASKET', 'VENEER CASKET'
];

const RELIGIONS = ['Catholic', 'Protestant', 'Islam', 'Buddhism', 'Others'];

const OCCUPATIONS = [
  'Housewife', 'Business Owner', 'Government Employee', 'Retired', 'Self-Employed',
  'Private Employee', 'Teacher', 'Medical Professional', 'Engineer', 'Farmer'
];

const PLANS = ['Basic Plan', 'Standard Plan', 'Premium Plan', 'Deluxe Plan'];

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate 1000 fake users
 */
export function generateFakeUsers(count: number = 1000): User[] {
  const users: User[] = [];
  
  for (let i = 1; i <= count; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const username = `user_${i}`;
    
    users.push({
      userId: i,
      firstName,
      lastName,
      username,
      password: 'password123',
      position: getRandomElement(POSITIONS),
      role: getRandomElement(ROLES),
      createdAt: generateRandomDate(2025, 2026)
    });
  }
  
  return users;
}

/**
 * Generate 1000 fake funeral contracts
 */
export function generateFakeFuneralContracts(count: number = 1000): FuneralContract[] {
  const contracts: FuneralContract[] = [];
  
  for (let i = 1; i <= count; i++) {
    const contractId = 100 + i;
    const deceasedFirstName = getRandomElement(FIRST_NAMES);
    const deceasedLastName = getRandomElement(LAST_NAMES);
    const contracteeFirstName = getRandomElement(FIRST_NAMES);
    const contracteeLastName = getRandomElement(LAST_NAMES);
    
    const deceasedDOB = generateRandomDate(1940, 2010);
    const deceasedAge = Math.floor((new Date().getFullYear() - new Date(deceasedDOB).getFullYear()));
    const deathDate = generateRandomDate(2025, 2026);
    
    contracts.push({
      contract_id: contractId,
      header: {
        contract_date: generateRandomDate(2025, 2026),
        contract_no: `FC-2026-${String(i).padStart(4, '0')}`,
        type_of_service: getRandomElement(SERVICE_TYPES),
        type_of_cremation: getRandomElement(CREMATION_TYPES),
        financial_assistance: Math.random() > 0.7 ? 'DSWD' : 'None'
      },
      deceased: {
        id: 1000 + i,
        contract_no: `FC-2026-${String(i).padStart(4, '0')}`,
        first_name: deceasedFirstName,
        middle_name: getRandomElement(FIRST_NAMES),
        last_name: deceasedLastName,
        suffix: Math.random() > 0.7 ? 'Jr.' : undefined,
        date_of_birth: deceasedDOB,
        age: deceasedAge,
        sex: Math.random() > 0.5 ? 'Male' : 'Female',
        civil_status: getRandomElement(['Single', 'Married', 'Widowed', 'Divorced']),
        religion: getRandomElement(RELIGIONS),
        type_of_service: getRandomElement(SERVICE_TYPES),
        type_of_interment: getRandomElement(['Ground', 'Crypt', 'Columbarium']),
        casket: getRandomElement(CASKETS),
        date_of_death: deathDate,
        address_of_deceased: `${generateRandomNumber(1, 9999)} Main Street, ${getRandomElement(CITIES)}`,
        place_of_death: getRandomElement(['Home', 'Hospital', 'Accident Scene', 'Nursing Home']),
        retrived_date: new Date(new Date(deathDate).getTime() + 86400000).toISOString().split('T')[0],
        office: 'Main Office',
        deliviered_by: `${contracteeFirstName} ${contracteeLastName}`,
        informant: `${contracteeFirstName} ${contracteeLastName}`
      },
      contractee: {
        full_name: `${contracteeFirstName} ${contracteeLastName}`,
        age: generateRandomNumber(25, 85),
        occupation: getRandomElement(OCCUPATIONS),
        address: `${generateRandomNumber(1, 9999)} Main Street`,
        barangay: getRandomElement(BARANGAYS),
        district: `District ${generateRandomNumber(1, 5)}`,
        city: getRandomElement(CITIES),
        relationship: getRandomElement(['Son', 'Daughter', 'Spouse', 'Sibling', 'Parent', 'Friend']),
        contact_no: `0917${generateRandomNumber(1000000, 9999999)}`,
        email: `${contracteeFirstName.toLowerCase()}.${contracteeLastName.toLowerCase()}@email.com`,
        plan: getRandomElement(PLANS),
        plan_no: `PP-2026-${String(i).padStart(3, '0')}`,
        referred_by: getRandomElement(['Friend', 'Family', 'Advertisement', 'Previous Customer', 'Online'])
      },
      casket_urn: {
        contract_price: generateRandomNumber(50000, 300000),
        casket_type: getRandomElement(CASKETS),
        casket_description: 'White / Rose Handle',
        casket_other_details: 'Standard size',
        urn_type: 'Ceramic',
        urn_description: 'Standard ceramic urn'
      },
      delivery: {
        date: new Date(new Date(deathDate).getTime() + 86400000 * generateRandomNumber(1, 5)).toISOString().split('T')[0],
        time: `${String(generateRandomNumber(8, 17)).padStart(2, '0')}:${String(generateRandomNumber(0, 59)).padStart(2, '0')}`,
        location: getRandomElement(CITIES),
        driver: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
        helper: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
        vehicle: `Van ${String(generateRandomNumber(1000, 9999))}`
      },
      transfer: {
        date: new Date(new Date(deathDate).getTime() + 86400000 * generateRandomNumber(1, 3)).toISOString().split('T')[0],
        time: `${String(generateRandomNumber(8, 17)).padStart(2, '0')}:${String(generateRandomNumber(0, 59)).padStart(2, '0')}`,
        location: 'Transfer Center',
        notes: 'Transfer from hospital to funeral house'
      },
      burial_schedule: {
        burial_date: new Date(new Date(deathDate).getTime() + 86400000 * generateRandomNumber(3, 10)).toISOString().split('T')[0],
        take_off_time: `${String(generateRandomNumber(8, 12)).padStart(2, '0')}:${String(generateRandomNumber(0, 59)).padStart(2, '0')}`,
        mass_time: `${String(generateRandomNumber(10, 14)).padStart(2, '0')}:${String(generateRandomNumber(0, 59)).padStart(2, '0')}`,
        holding_area: `Block ${generateRandomNumber(1, 50)}, Lot ${generateRandomNumber(1, 100)}`,
        cremation_date: new Date(new Date(deathDate).getTime() + 86400000 * generateRandomNumber(5, 15)).toISOString().split('T')[0],
        cremation_time: `${String(generateRandomNumber(8, 17)).padStart(2, '0')}:${String(generateRandomNumber(0, 59)).padStart(2, '0')}`,
        church: `${getRandomElement(CITIES)} Parish Church`,
        cemetery: `${getRandomElement(CITIES)} Public Cemetery`,
        notes: 'Burial schedule arranged',
        driver: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
        helper: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
        vehicle: `Van ${String(generateRandomNumber(1000, 9999))}`
      },
      status: getRandomElement(['ACTIVE', 'COMPLETED', 'PENDING']),
      remarks: {
        contract: 'Contract processed successfully',
        operations: 'Standard processing',
        morgue: 'Body prepared for services'
      },
      created_at: generateRandomDate(2025, 2026),
      updated_at: generateRandomDate(2025, 2026)
    });
  }
  
  return contracts;
}

/**
 * Generate 1000 fake billing accounts with transactions
 */
export function generateFakeBillingAccounts(count: number = 1000): BillingAccount[] {
  const accounts: BillingAccount[] = [];
  
  for (let i = 1; i <= count; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    
    const totalAmount = generateRandomNumber(80000, 500000);
    const totalDiscount = generateRandomNumber(0, Math.floor(totalAmount * 0.1));
    const amountDue = totalAmount - totalDiscount;
    const planAmount = generateRandomNumber(20000, 100000);
    const balance = amountDue - planAmount;
    
    accounts.push({
      billing_account_id: i,
      funeral_contract_id: 100 + i,
      contract_no: `12-${String(13950 + i).padStart(6, '0')}-25`,
      start_date: generateRandomDate(2025, 2026),
      deceased_name: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
      contractee: `${firstName} ${lastName}`,
      contractee_phone: `0917${generateRandomNumber(1000000, 9999999)}`,
      address: `${generateRandomNumber(1, 9999)} Street, ${getRandomElement(CITIES)}`,
      service_type: getRandomElement(SERVICE_TYPES),
      cremation_type: getRandomElement(CREMATION_TYPES),
      casket: getRandomElement(CASKETS),
      casket_description: 'White / Rose Handle',
      age: generateRandomNumber(50, 95),
      disc_id_no: `PWD-${generateRandomNumber(2020, 2024)}-${String(generateRandomNumber(1, 9999)).padStart(3, '0')}`,
      issued_at: getRandomElement(CITIES),
      issued_on: generateRandomDate(2020, 2024),
      city_docs: 'Death Certificate - Submitted',
      submitted: generateRandomDate(2025, 2026),
      barangay: getRandomElement(BARANGAYS),
      chairman: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
      financial_asst: Math.random() > 0.7 ? 'DSWD' : 'None',
      date_submitted: generateRandomDate(2025, 2026),
      received_by: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
      date_of_delivery: generateRandomDate(2025, 2026),
      cremation_date: Math.random() > 0.5 ? generateRandomDate(2025, 2026) : '',
      promissory_date: generateRandomDate(2026, 2026),
      date_of_burial: generateRandomDate(2025, 2026),
      ash_released: Math.random() > 0.5 ? generateRandomDate(2026, 2026) : '',
      released_by: Math.random() > 0.5 ? `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}` : '',
      guarantor: `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`,
      billing_remarks: getRandomElement([
        'Payment on installment - 3 months',
        'Partially paid',
        'Payment expected soon',
        'Full payment received',
        'With DSWD assistance'
      ]),
      total_amount: totalAmount,
      total_discount: totalDiscount,
      amount_due: amountDue,
      plan_amount: planAmount,
      balance: Math.max(0, balance),
      is_paid: balance <= 0,
      created_at: generateRandomDate(2025, 2026),
      updated_at: generateRandomDate(2025, 2026)
    });
  }
  
  return accounts;
}

/**
 * Master function to generate all fake data at once
 */
export function generateAllFakeData(userCount: number = 1000, contractCount: number = 1000, billingCount: number = 1000) {
  console.log('🔄 Generating fake data...');
  console.log(`  - Users: ${userCount}`);
  console.log(`  - Funeral Contracts: ${contractCount}`);
  console.log(`  - Billing Accounts: ${billingCount}`);
  
  const users = generateFakeUsers(userCount);
  const contracts = generateFakeFuneralContracts(contractCount);
  const billing = generateFakeBillingAccounts(billingCount);
  
  console.log('✅ Fake data generation completed!');
  
  return {
    users,
    contracts,
    billing,
    summary: {
      totalUsers: users.length,
      totalContracts: contracts.length,
      totalBillingAccounts: billing.length,
      totalRecords: users.length + contracts.length + billing.length
    }
  };
}
