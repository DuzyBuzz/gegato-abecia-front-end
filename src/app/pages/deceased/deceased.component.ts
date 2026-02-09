import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeceasedTableComponent } from "../../shared/features/deceased/deceased-table/deceased-table.component";
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FuneralContract } from '../../models/funeral-contract.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-deceased',
  imports: [DeceasedTableComponent, ButtonModule, ToolbarModule],
  templateUrl: './deceased.component.html',
  styleUrl: './deceased.component.scss',
})
export class DeceasedComponent {

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  openNewFuneralContract(): void {
    const userRole = this.auth.getRole();
    const path = userRole === 'Admin' 
      ? '/admin/documents/contracts/funeral/new'
      : '/billing/documents/contracts/funeral/new';
    this.router.navigateByUrl(path);
  }

  onContractRowSelected(contract: FuneralContract): void {
    const userRole = this.auth.getRole();
    const path = userRole === 'Admin'
      ? `/admin/documents/contracts/funeral/${contract.contract_id}`
      : `/billing/documents/contracts/funeral/${contract.contract_id}`;
    this.router.navigateByUrl(path);
  }
}

