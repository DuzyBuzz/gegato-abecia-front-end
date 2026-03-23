import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeceasedTableComponent } from "../../shared/features/deceased/deceased-table/deceased-table.component";
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FuneralContract } from '../../models/funeral-contract.model';
import { AuthService } from '../../services/auth.service';
import { Dialog } from "primeng/dialog";
import { FuneralContractEntry } from '../../forms/funeral-contract-entry/funeral-contract-entry';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-deceased',
  imports: [DeceasedTableComponent, ButtonModule, ToolbarModule, Dialog, FuneralContractEntry, TagModule],
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

  openNewFuneralContract(): void {
    this.selectedContract = null; // Clear selection for new contract
    this.dialogVisible = true;
  }

  onContractSelected(contract: FuneralContract): void {
    console.log('[DeceasedComponent] Contract selected:', contract);
    this.selectedContract = contract;
    this.dialogVisible = true;
  }

  onContractRowSelected(contract: FuneralContract): void {
    const userRole = this.auth.getRole();
    const path = userRole === 'Admin'
      ? `/admin/documents/contracts/funeral/${contract.id}`
      : `/billing/documents/contracts/funeral/${contract.id}`;
    this.router.navigateByUrl(path);
  }
}

