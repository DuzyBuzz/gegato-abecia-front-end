import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeceasedTableComponent } from "../../shared/features/deceased/deceased-table/deceased-table.component";
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FuneralContract } from '../../models/funeral-contract.model';
import { AuthService } from '../../services/auth.service';
import { Dialog } from "primeng/dialog";
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-deceased',
  imports: [DeceasedTableComponent, ButtonModule, ToolbarModule, Dialog, TagModule],
  templateUrl: './deceased.component.html',
  styleUrl: './deceased.component.scss',
})
export class DeceasedComponent {
  dialogVisible = false;
  dialogMaximized = true;
  selectedContract: FuneralContract | null = null;
  
  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  get canManageContracts(): boolean {
    return this.auth.canManageFuneralContracts();
  }

  get canCreateContracts(): boolean {
    return Number((this.auth.currentUser as any)?.roleAccess) === 1;
  }

  get scheduleRoute(): string {
    return `${this.auth.getOperationsBaseRoute()}/schedule`;
  }

  get newContractRoute(): string {
    return `${this.auth.getOperationsBaseRoute()}/forms/contracts/funeral-contract/new`;
  }

  openNewFuneralContract(): void {
    if (!this.canCreateContracts) {
      return;
    }

    this.selectedContract = null; // Clear selection for new contract
    this.router.navigate([this.newContractRoute]);
  }

  onContractSelected(contract: FuneralContract): void {
    console.log('[DeceasedComponent] Contract selected:', contract);
    this.selectedContract = contract;
    this.dialogVisible = true;
  }

  onContractRowSelected(contract: FuneralContract): void {
    const baseRoute = this.auth.getOperationsBaseRoute();
    const path = this.auth.isAdmin() || this.auth.canManageFuneralContracts()
      ? `${baseRoute}/forms/contracts/funeral-contract/${contract.id}`
      : `${baseRoute}/forms/contracts/payments/${contract.id}`;

    this.router.navigateByUrl(path);
  }
}

