import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-funeral-contract-entry',
  imports: [],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
})
export class FuneralContractEntry {
  showContractModal = false;

  openModal() {
    this.showContractModal = true;
  }

  closeModal() {
    this.showContractModal = false;
  }
    constructor(
    private router: Router
  ) {
  }

  onPrintSelect(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;

  switch (value) {
    case 'funeral-contract':
      this.router.navigate(['/printing-forms/funeral-service-contract']);
      break;

    case 'cremation-certificate':
      this.router.navigate(['/printing-forms/cremation-certificate']);
      break;

    case 'authority-cremate':
      this.router.navigate(['/printing-forms/authority-to-cremate-remains']);
      break;

    case 'statement-account':
      this.router.navigate(['/printing-forms/statement-of-account']);
      break;

    default:
      return;
  }

  // reset dropdown after navigation (important UX)
  (event.target as HTMLSelectElement).value = '';
}
}
