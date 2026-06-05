import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ContractService } from '../../../services/contract.service';

@Component({
  selector: 'app-contract-billing',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './contract-billing.component.html',
  styleUrl: './contract-billing.component.scss',
})
export class ContractBillingComponent {
closeDialog() {
throw new Error('Method not implemented.');
}
  @Input() visible = false;
  @Input() contractNo = 'CTR-2026-0001';

  @Output() visibleChange = new EventEmitter<boolean>();
transactions: any;

  // // readonly transactions = this.contractService.getPayments();

  // constructor(private readonly contractService: ContractService) {}

  // closeDialog(): void {
  //   this.visible = false;
  //   this.visibleChange.emit(false);
  // }

  // get totalAmount(): number {
  //   return this.transactions.reduce((sum, row) => sum + row.amount, 0);
  // }

  // get totalDiscount(): number {
  //   return this.transactions.reduce((sum, row) => sum + row.discount, 0);
  // }

  // get totalCash(): number {
  //   return this.transactions.reduce((sum, row) => sum + row.cash, 0);
  // }

  // get totalCheck(): number {
  //   return this.transactions.reduce((sum, row) => sum + row.check, 0);
  // }

  // get totalPaid(): number {
  //   return this.totalCash + this.totalCheck;
  // }

  // get balance(): number {
  //   return this.totalAmount - this.totalDiscount - this.totalPaid;
  // }
}