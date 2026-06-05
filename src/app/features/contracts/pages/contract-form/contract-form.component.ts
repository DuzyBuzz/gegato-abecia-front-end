import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractBillingComponent } from './contract-billing/contract-billing.component';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ContractBillingComponent],
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss',
})
export class ContractFormComponent {
calculateAge() {
throw new Error('Method not implemented.');
}
  billingVisible = false;
dobValue: any;
ageValue: any;
dobDeathValue: any;


  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  openBillingRecord(): void {
    this.billingVisible = true;
  }

  closeBillingRecord(): void {
    this.billingVisible = false;
  }
}
