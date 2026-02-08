import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
})
export class FuneralContractEntry {

  form: FormGroup;

  deceasedName = 'John Doe'; // replace later with real data

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      firstName: [''],
      middleName: [''],
      lastName: ['']
    });
  }

  get fullName(): string {
    const { firstName, middleName, lastName } = this.form.value;
    return `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
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
    }

    (event.target as HTMLSelectElement).value = '';
  }
}
