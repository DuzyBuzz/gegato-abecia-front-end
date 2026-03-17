# Fake Data Generator

This utility generates 1000+ fake records for development and testing purposes. The logic is separated from the main application and is automatically triggered when a user successfully logs in.

## Overview

The fake data generator creates mock data for:
- **1000 Users** - With varying roles (Admin, Biller, Staff, Viewer)
- **1000 Funeral Contracts** - Complete funeral service records
- **1000 Billing Accounts** - Billing and transaction information

## Architecture

The implementation is separated into 3 parts:

### 1. **Fake Data Generator Utility** (`src/utils/fake-data-generator.ts`)
- Pure TypeScript functions that generate fake data
- No dependencies on Angular or the application
- Contains reusable functions:
  - `generateFakeUsers(count)` - Generates user records
  - `generateFakeFuneralContracts(count)` - Generates funeral contracts
  - `generateFakeBillingAccounts(count)` - Generates billing accounts
  - `generateAllFakeData(userCount, contractCount, billingCount)` - Master function

### 2. **Mock Data Generator Service** (`src/app/services/mock-data-generator.service.ts`)
- Angular service that wraps the generator utility
- Handles storage in localStorage
- Provides methods:
  - `generateAndStoreMockData()` - Generate all data and store it
  - `getStoredUsers()` - Retrieve stored users
  - `getStoredContracts()` - Retrieve stored contracts
  - `getStoredBilling()` - Retrieve stored billing accounts
  - `clearAllMockData()` - Clear all stored data
  - `hasMockData()` - Check if data exists

### 3. **Login Component Integration** (`src/app/pages/login/login.component.ts`)
- Injected the `MockDataGeneratorService`
- Calls `generateAndStoreMockData()` on successful login
- Only generates data once per session using `mockDataGenerated` flag

## Usage

### Automatic Generation (Default)
The data is automatically generated when a user successfully logs in:

```typescript
// In login.component.ts submit() method
if (!this.mockDataGenerated && !this.mockDataGenerator.hasMockData()) {
  this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);
  this.mockDataGenerated = true;
}
```

### Manual Generation
You can manually generate data in any component:

```typescript
import { MockDataGeneratorService } from './services/mock-data-generator.service';

constructor(private mockDataGenerator: MockDataGeneratorService) {}

// Generate data
this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);

// Get specific data
const users = this.mockDataGenerator.getStoredUsers();
const contracts = this.mockDataGenerator.getStoredContracts();
const billing = this.mockDataGenerator.getStoredBilling();

// Clear data
this.mockDataGenerator.clearAllMockData();
```

### Direct Generator Usage
You can also use the generator utility directly without the service:

```typescript
import { generateAllFakeData } from '@utils/fake-data-generator';

const data = generateAllFakeData(1000, 1000, 1000);
console.log(data.summary); // View generated data summary
```

## Data Storage

All generated data is stored in **localStorage**:
- `MOCK_USERS_DATA` - Users array
- `MOCK_FUNERAL_CONTRACTS_DATA` - Funeral contracts array
- `MOCK_BILLING_ACCOUNTS_DATA` - Billing accounts array

## Generated Data Sample

### User Record
```typescript
{
  userId: 1,
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  username: 'user_1',
  password: 'password123',
  position: 'System Administrator',
  role: 'Admin',
  createdAt: '2025-12-15'
}
```

### Funeral Contract Record
```typescript
{
  contract_id: 101,
  header: {
    contract_date: '2026-02-01',
    contract_no: 'FC-2026-0001',
    type_of_service: 'Complete Funeral Service',
    type_of_cremation: 'Full Cremation',
    financial_assistance: 'None'
  },
  deceased: { /* detailed deceased info */ },
  contractee: { /* contractee info */ },
  casket_urn: { /* casket/urn details */ },
  delivery: { /* delivery info */ },
  transfer: { /* transfer info */ },
  burial_schedule: { /* burial schedule */ },
  status: 'ACTIVE',
  remarks: { /* remarks */ },
  created_at: '2026-02-01T08:00:00Z',
  updated_at: '2026-02-08T10:30:00Z'
}
```

### Billing Account Record
```typescript
{
  billing_account_id: 1,
  funeral_contract_id: 101,
  contract_no: '12-013951-25',
  deceased_name: 'MARIA CRUZ SANTOS',
  contractee: 'JUAN DELA CRUZ',
  total_amount: 150000,
  total_discount: 5000,
  amount_due: 145000,
  plan_amount: 40000,
  balance: 110000,
  is_paid: false,
  created_at: '2026-02-01T08:00:00Z',
  updated_at: '2026-02-08T10:30:00Z'
}
```

## Console Output

When data is generated, you'll see:

```
📊 MockDataGeneratorService: Starting data generation and storage...
🔄 Generating fake data...
  - Users: 1000
  - Funeral Contracts: 1000
  - Billing Accounts: 1000
✅ Fake data generation completed!


╔════════════════════════════════════════╗
║   FAKE DATA GENERATION COMPLETE        ║
╠════════════════════════════════════════╣
║ Users:              1000               ║
║ Funeral Contracts:  1000               ║
║ Billing Accounts:   1000               ║
╠════════════════════════════════════════╣
║ Total Records:      3000               ║
╚════════════════════════════════════════╝
```

## Features

- **Realistic Data**: Generated names, dates, and values follow realistic patterns
- **Large Dataset**: Generates 3000+ records (1000 of each type)
- **Relationships**: Contract IDs link users to contracts to billing accounts
- **Variation**: Random dates, amounts, and statuses for variety
- **No External Dependencies**: Pure TypeScript implementation
- **Reusable**: Can be used in tests or other utilities

## Performance

Generation time on modern machines:
- 1000 Users: ~100ms
- 1000 Funeral Contracts: ~200ms
- 1000 Billing Accounts: ~150ms
- **Total: ~450ms**

## Customization

To customize the generated data:

1. **Change quantities**: Pass different counts to `generateAndStoreMockData()`
   ```typescript
   this.mockDataGenerator.generateAndStoreMockData(500, 500, 500); // 500 each
   ```

2. **Add custom data pools**: Edit the arrays at the top of `fake-data-generator.ts`:
   ```typescript
   const FIRST_NAMES = ['Juan', 'Maria', ...]; // Add more names
   const CITIES = ['Quezon City', ...]; // Add more cities
   ```

3. **Modify data generation logic**: Edit the `generate*` functions in `fake-data-generator.ts`

## Disabling Auto-Generation

If you don't want automatic generation on login, comment out or remove this block from `login.component.ts`:

```typescript
// if (!this.mockDataGenerated && !this.mockDataGenerator.hasMockData()) {
//   this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);
//   this.mockDataGenerated = true;
// }
```

## Testing

The generator is designed for easy testing. You can directly import and test:

```typescript
import { generateFakeUsers } from '@utils/fake-data-generator';

describe('Data Generator', () => {
  it('should generate 100 users', () => {
    const users = generateFakeUsers(100);
    expect(users.length).toBe(100);
  });
});
```

## Notes

- Data is stored in localStorage, which has a size limit (~5-10MB)
- Each login checks if data already exists before generating
- Data persists across browser sessions until localStorage is cleared
- In production, remove this entirely or secure it behind admin-only endpoints
