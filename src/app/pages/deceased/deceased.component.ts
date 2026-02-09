import { Component } from '@angular/core';
import { DeceasedTableComponent } from "../../shared/features/deceased/deceased-table/deceased-table.component";
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FuneralContractEntry } from "../../documents/entry-forms/funeral-contract-entry/funeral-contract-entry";
import { DialogModule } from 'primeng/dialog';
import { FuneralContract } from '../../models/funeral-contract.model';

@Component({
  selector: 'app-deceased',
  imports: [DeceasedTableComponent, ButtonModule, ToolbarModule, FuneralContractEntry, DialogModule],
  templateUrl: './deceased.component.html',
  styleUrl: './deceased.component.scss',
})
export class DeceasedComponent {

  showModal = false;
  selectedContract: FuneralContract | null = null;

  openModal(){
    this.showModal = true;
  }

  closeModal(){
    this.showModal = false;
    this.selectedContract = null;
  }

  onContractRowSelected(contract: FuneralContract): void {
    this.selectedContract = contract;
    this.openModal();
  }
}

