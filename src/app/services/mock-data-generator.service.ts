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
}
