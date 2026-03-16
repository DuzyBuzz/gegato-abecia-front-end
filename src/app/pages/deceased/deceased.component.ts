import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeceasedTableComponent } from "../../shared/features/deceased/deceased-table/deceased-table.component";
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FuneralContract } from '../../models/funeral-contract.model';
import { AuthService } from '../../services/auth.service';
import { Dialog } from "primeng/dialog";
import { FuneralContractEntry } from '../../documents/entry-forms/funeral-contract-entry/funeral-contract-entry';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-deceased',
  imports: [DeceasedTableComponent, ButtonModule, ToolbarModule, Dialog, FuneralContractEntry, TagModule],
  templateUrl: './deceased.component.html',
  styleUrl: './deceased.component.scss',
})
export class DeceasedComponent {
  dialogVisible = false;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  openNewFuneralContract(): void {
    this.dialogVisible = true;
  }

  onContractRowSelected(contract: FuneralContract): void {
    const userRole = this.auth.getRole();
    const path = userRole === 'Admin'
      ? `/admin/documents/contracts/funeral/${contract.contract_id}`
      : `/billing/documents/contracts/funeral/${contract.contract_id}`;
    this.router.navigateByUrl(path);
  }
}

