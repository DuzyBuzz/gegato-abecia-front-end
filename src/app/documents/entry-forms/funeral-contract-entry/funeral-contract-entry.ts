import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PrintDataService } from '../../../services/print-data.service';
import { ComboboxFirestoreService } from '../../../services/combobox-firestore.service';
import { SelectHelperComponent } from '../../../shared/components/select-helper/select-helper.component';

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectHelperComponent],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
})
export class FuneralContractEntry implements OnInit {

  form: FormGroup;
  deceasedName = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthService,
    private printDataService: PrintDataService,
    private comboboxService: ComboboxFirestoreService
  ) {
    this.form = this.fb.group({
      // Contract Header
      contractDate: [''],
      contractNo: [''],
      typeOfService: [''],
      typeOfCremation: [''],
      financialAssistance: [''],

      // Deceased Information
      dateRetrieved: [''],
      informant: [''],
      firstName: [''],
      suffix: [''],
      middleName: [''],
      lastName: [''],
      dateOfBirth: [''],
      age: [''],
      sex: [''],
      civilStatus: [''],
      dateOfDeath: [''],
      addressOfDeceased: [''],
      placeOfDeath: [''],
      religion: [''],
      office: [''],
      deliveredBy: [''],

      // Contractee Information
      contracteeName: [''],
      contracteeAge: [''],
      occupation: [''],
      address: [''],
      barangay: [''],
      district: [''],
      city: [''],
      relationship: [''],
      contactNo: [''],
      email: [''],
      plan: [''],
      planNo: [''],
      referredBy: [''],

      // Casket/Urn
      contractPrice: [''],
      casketType: [''],
      casketDescription: [''],
      casketOtherDetails: [''],
      urnType: [''],
      urnDescription: [''],

      // Delivery
      deliveryDate: [''],
      deliveryTime: [''],
      deliveryLocation: [''],
      deliveryDriver: [''],
      deliveryHelper: [''],
      deliveryVehicle: [''],

      // Transfer
      transferDate: [''],
      transferTime: [''],
      transferLocation: [''],
      transferNotes: [''],

      // Burial/Cremation Schedule
      burialDate: [''],
      takeOffTime: [''],
      massTime: [''],
      holdingArea: [''],
      cremationDate: [''],
      cremationTime: [''],
      church: [''],
      cemetery: [''],
      burialNotes: [''],
      burialDriver: [''],
      burialHelper: [''],
      burialVehicle: [''],

      // Remarks
      contractRemarks: [''],
      operationsRemarks: [''],
      morgueRemarks: ['']
    });

    // Preload all combobox collections IMMEDIATELY in parallel
    this.preloadComboboxes();
  }

  private preloadComboboxes(): void {
    const comboboxNames = [
      'typeOfService',
      'typeOfCremation',
      'financialAssistance',
      'sex',
      'civilStatus',
      'casketType',
      'urnType',
      'holdingArea'
    ];

    // Load all in parallel (fire and forget - data cached)
    Promise.all(
      comboboxNames.map(name => this.comboboxService.getCombobox(name))
    ).then(() => {
      console.log('[FuneralContractEntry] Comboboxes preloaded');
      // Set up real-time watchers
      comboboxNames.forEach(name => {
        this.comboboxService.watchCombobox(name, () => {});
      });
    }).catch(err => {
      console.error('[FuneralContractEntry] Preload failed:', err);
    });
  }

  ngOnInit(): void {
    // Preload SelectHelper collections
    this.preloadComboboxes();
  }

  goToBilling(): void {
    const userRole = this.auth.getRole();
    const billingPath = userRole === 'Admin' ? '/admin/documents/billing' : '/billing/documents/billing';
    this.router.navigateByUrl(billingPath);
  }

  get fullName(): string {
    const { firstName, suffix, middleName, lastName } = this.form.value;
    return `${firstName} ${suffix} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  }

  goBack(): void {
    const userRole = this.auth.getRole();
    const backPath = userRole === 'Admin' ? '/admin/deceased' : '/billing/deceased';
    this.router.navigateByUrl(backPath);
  }

  onPrintSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const userRole = this.auth.getRole();
    let printPath = '';

    switch (value) {
      case 'funeral-contract':
        console.log('[FuneralContractEntry] Funeral Service Contract printing');
        break;

      case 'cremation-certificate':
        console.log('[FuneralContractEntry] Cremation Certificate printing');
        break;

      case 'authority-cremate':
        printPath = userRole === 'Admin'
          ? `/admin/print/authority-to-cremate-remains`
          : `/billing/print/authority-to-cremate-remains`;
        this.router.navigateByUrl(printPath);
        break;

      case 'statement-account':
        printPath = userRole === 'Admin'
          ? `/admin/print/statement-of-account`
          : `/billing/print/statement-of-account`;
        this.router.navigateByUrl(printPath);
        break;
    }

    (event.target as HTMLSelectElement).value = '';
  }
}
