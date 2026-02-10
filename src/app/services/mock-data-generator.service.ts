import { Injectable } from '@angular/core';
import {
  generateFakeUsers,
  generateFakeFuneralContracts,
  generateFakeBillingAccounts,
  generateAllFakeData
} from '../../utils/fake-data-generator';

/**
 * Service to manage fake data generation for mock files
 * Separates data generation logic from the rest of the application
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataGeneratorService {

  private readonly USERS_STORAGE_KEY = 'MOCK_USERS_DATA';
  private readonly CONTRACTS_STORAGE_KEY = 'MOCK_FUNERAL_CONTRACTS_DATA';
  private readonly BILLING_STORAGE_KEY = 'MOCK_BILLING_ACCOUNTS_DATA';

  constructor() {}

  /**
   * Generate all fake data (1000+ records) and store in localStorage
   * Call this once on login to populate mock data
   */
  generateAndStoreMockData(userCount: number = 1000, contractCount: number = 1000, billingCount: number = 1000): void {
    console.log('📊 MockDataGeneratorService: Starting data generation and storage...');
    
    try {
      // Generate all data
      const allData = generateAllFakeData(userCount, contractCount, billingCount);

      // Store in localStorage
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(allData.users));
      localStorage.setItem(this.CONTRACTS_STORAGE_KEY, JSON.stringify(allData.contracts));
      localStorage.setItem(this.BILLING_STORAGE_KEY, JSON.stringify(allData.billing));

      console.log('✅ Mock data successfully stored!');
      console.log('📈 Data Summary:', allData.summary);

      // Display summary in console
      this.displayDataSummary(allData.summary);
    } catch (error) {
      console.error('❌ Error generating or storing mock data:', error);
      throw error;
    }
  }

  /**
   * Get stored users data from localStorage
   */
  getStoredUsers() {
    const data = localStorage.getItem(this.USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get stored funeral contracts data from localStorage
   */
  getStoredContracts() {
    const data = localStorage.getItem(this.CONTRACTS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get stored billing accounts data from localStorage
   */
  getStoredBilling() {
    const data = localStorage.getItem(this.BILLING_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear all stored mock data
   */
  clearAllMockData(): void {
    localStorage.removeItem(this.USERS_STORAGE_KEY);
    localStorage.removeItem(this.CONTRACTS_STORAGE_KEY);
    localStorage.removeItem(this.BILLING_STORAGE_KEY);
    console.log('🗑️ All mock data cleared');
  }

  /**
   * Check if mock data already exists
   */
  hasMockData(): boolean {
    return (
      !!localStorage.getItem(this.USERS_STORAGE_KEY) &&
      !!localStorage.getItem(this.CONTRACTS_STORAGE_KEY) &&
      !!localStorage.getItem(this.BILLING_STORAGE_KEY)
    );
  }

  /**
   * Display a nice summary in console
   */
  private displayDataSummary(summary: any): void {
    const message = `
╔════════════════════════════════════════╗
║   FAKE DATA GENERATION COMPLETE        ║
╠════════════════════════════════════════╣
║ Users:              ${String(summary.totalUsers).padStart(20, ' ')} ║
║ Funeral Contracts:  ${String(summary.totalContracts).padStart(20, ' ')} ║
║ Billing Accounts:   ${String(summary.totalBillingAccounts).padStart(20, ' ')} ║
╠════════════════════════════════════════╣
║ Total Records:      ${String(summary.totalRecords).padStart(20, ' ')} ║
╚════════════════════════════════════════╝
    `;
    console.log(message);
  }

  /**
   * Export funeral contracts as TypeScript file content
   * For: src/assets/mock/funeral-contract.mock.ts
   */
  exportFuneralContractsFile(): string {
    const contracts = this.getStoredContracts();
    if (!contracts) {
      console.warn('No funeral contracts data available');
      return '';
    }

    const content = `import { FuneralContract } from '../../app/models/funeral-contract.model';

export const FUNERAL_CONTRACTS_MOCK: FuneralContract[] = ${JSON.stringify(contracts, null, 2)};
`;
    return content;
  }

  /**
   * Export billing accounts as TypeScript file content
   * For: src/assets/mock/billing-account.mock.ts
   */
  exportBillingAccountsFile(): string {
    const billing = this.getStoredBilling();
    if (!billing) {
      console.warn('No billing accounts data available');
      return '';
    }

    const content = `import { BillingAccount, BillingTransaction } from '../../app/models/billing-account.model';

export const BILLING_ACCOUNTS_MOCK: BillingAccount[] = ${JSON.stringify(billing, null, 2)};
`;
    return content;
  }

  /**
   * Download funeral contracts file
   */
  downloadFuneralContractsFile(): void {
    const content = this.exportFuneralContractsFile();
    this.downloadFile(content, 'funeral-contract.mock.ts');
  }

  /**
   * Download billing accounts file
   */
  downloadBillingAccountsFile(): void {
    const content = this.exportBillingAccountsFile();
    this.downloadFile(content, 'billing-account.mock.ts');
  }

  /**
   * Download all files as a zip (or individual files)
   */
  downloadAllMockFiles(): void {
    const contracts = this.exportFuneralContractsFile();
    const billing = this.exportBillingAccountsFile();

    this.downloadFile(contracts, 'funeral-contract.mock.ts');
    setTimeout(() => this.downloadFile(billing, 'billing-account.mock.ts'), 500);

    console.log('✅ Mock files downloaded successfully!');
  }

  /**
   * Helper method to download a file
   */
  private downloadFile(content: string, filename: string): void {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Copy funeral contracts file content to clipboard
   */
  copyFuneralContractsToclipboard(): void {
    const content = this.exportFuneralContractsFile();
    navigator.clipboard.writeText(content).then(() => {
      console.log('✅ Funeral contracts content copied to clipboard!');
    }).catch(err => {
      console.error('❌ Failed to copy to clipboard:', err);
    });
  }

  /**
   * Copy billing accounts file content to clipboard
   */
  copyBillingAccountsToClipboard(): void {
    const content = this.exportBillingAccountsFile();
    navigator.clipboard.writeText(content).then(() => {
      console.log('✅ Billing accounts content copied to clipboard!');
    }).catch(err => {
      console.error('❌ Failed to copy to clipboard:', err);
    });
  }
}
