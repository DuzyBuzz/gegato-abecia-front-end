# Generate Mock Data Files - Setup Guide

This guide explains how to generate and write 1000+ fake records to the mock files.

## Quick Start

### Option 1: Run Node.js Script (Recommended)

Run this command from the project root to generate and write the mock files directly:

```bash
npm run generate-mock
```

This will:
- Generate 1000 funeral contracts
- Generate 1000 billing accounts
- Write them to:
  - `src/assets/mock/funeral-contract.mock.ts`
  - `src/assets/mock/billing-account.mock.ts`

### Option 2: Manual Download from Browser

1. Log in to the application
2. Open browser console (F12)
3. Call the service methods to download files:

```javascript
// Get the service instance
const mockDataService = ng.probe(document.querySelector('app-root')).injector.get(MockDataGeneratorService);

// Generate and download both files
mockDataService.downloadAllMockFiles();
```

Or download individually:
```javascript
mockDataService.downloadFuneralContractsFile();
mockDataService.downloadBillingAccountsFile();
```

### Option 3: Copy to Clipboard

```javascript
const mockDataService = ng.probe(document.querySelector('app-root')).injector.get(MockDataGeneratorService);

// Copy funeral contracts to clipboard
mockDataService.copyFuneralContractsToclipboard();

// Copy billing accounts to clipboard
mockDataService.copyBillingAccountsToClipboard();
```

## How It Works

### Script: `generate-mock-data.js`

This Node.js script:
- Generates 1000 funeral contracts with realistic data
- Generates 1000 billing accounts with linked data
- Formats the data as TypeScript exports
- Writes to the mock files directly

**Usage:**
```bash
node generate-mock-data.js
```

Or via npm:
```bash
npm run generate-mock
```

### Service Methods

The `MockDataGeneratorService` provides several methods:

#### `generateAndStoreMockData()`
Generates data and stores in localStorage
```typescript
this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);
```

#### `exportFuneralContractsFile()`
Returns the file content as a string
```typescript
const content = this.mockDataGenerator.exportFuneralContractsFile();
// content is ready to write to funeral-contract.mock.ts
```

#### `exportBillingAccountsFile()`
Returns the file content as a string
```typescript
const content = this.mockDataGenerator.exportBillingAccountsFile();
// content is ready to write to billing-account.mock.ts
```

#### `downloadFuneralContractsFile()`
Triggers browser download of funeral contracts file
```typescript
this.mockDataGenerator.downloadFuneralContractsFile();
```

#### `downloadBillingAccountsFile()`
Triggers browser download of billing accounts file
```typescript
this.mockDataGenerator.downloadBillingAccountsFile();
```

#### `downloadAllMockFiles()`
Downloads both files with a 500ms delay
```typescript
this.mockDataGenerator.downloadAllMockFiles();
```

#### `copyFuneralContractsToclipboard()`
Copies funeral contracts content to clipboard
```typescript
this.mockDataGenerator.copyFuneralContractsToclipboard();
```

#### `copyBillingAccountsToClipboard()`
Copies billing accounts content to clipboard
```typescript
this.mockDataGenerator.copyBillingAccountsToClipboard();
```

## File Paths

The script generates files at:
- **Funeral Contracts:** `src/assets/mock/funeral-contract.mock.ts`
- **Billing Accounts:** `src/assets/mock/billing-account.mock.ts`

Files will be overwritten if they already exist.

## Data Generated

### For Each Type:
- **1000 Records** per type
- **Linked IDs** - contracts link to billing accounts
- **Realistic Data** - proper names, addresses, dates, amounts
- **TypeScript Format** - exports as proper `const` arrays
- **Follows Models** - matches funeral-contract.model.ts and billing-account.model.ts

## Troubleshooting

### Script not found
Make sure you're in the project root directory:
```bash
cd E:\Repositories\gegato-abecia
npm run generate-mock
```

### Files not updating
- Delete existing mock files and try again
- Check file permissions
- Verify the script ran without errors

### Data not appearing in app
- Restart the development server: `npm start`
- Clear browser cache (Ctrl+Shift+Delete)
- Check that imports are correct in components

## Integration with Login

The data is automatically generated on first successful login (stored in localStorage). To also write to the mock files:

1. Run the script before starting the app:
   ```bash
   npm run generate-mock
   npm start
   ```

2. Or trigger manually after login:
   - Open browser console
   - Call `mockDataService.downloadAllMockFiles()`
   - Replace the mock files with downloaded content

## Next Steps

After generating the mock files:

1. ✅ Files are created at the correct paths
2. ✅ Data follows the model interfaces
3. ✅ App can import and use the data
4. ✅ Ready for development and testing

## Notes

- The Node.js script runs on your machine locally
- It does NOT require internet connection
- It overwrites existing mock files completely
- Data is generated fresh each time the script runs
- All data is sample/fake data suitable for testing only
