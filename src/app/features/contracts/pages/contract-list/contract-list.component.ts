import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractBillingComponent } from '../../pages/contract-form/contract-billing/contract-billing.component';
import { ContractService } from '../../services/contract.service';
import { ContractRecord } from '../../models/contract.model';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, ContractBillingComponent],
  templateUrl: './contract-list.component.html',
  styleUrl: './contract-list.component.scss',
})
export class ContractListComponent {
  readonly summaryCards = [
    { label: 'Active contracts', value: '24', tone: 'blue' },
    { label: 'Collections due', value: '₱ 148,500', tone: 'amber' },
    { label: 'Paid this month', value: '₱ 412,000', tone: 'green' },
    { label: 'Pending review', value: '6', tone: 'rose' },
  ];

  // readonly rows = this.contractService.getContracts();
  // selectedContract: ContractRecord = this.rows[0];
  billingVisible = false;

  constructor(private readonly contractService: ContractService) {}

  selectContract(contract: ContractRecord): void {
    // this.selectedContract = contract;
  }

  openBilling(): void {
    this.billingVisible = true;
  }

  closeBilling(): void {
    this.billingVisible = false;
  }
}
