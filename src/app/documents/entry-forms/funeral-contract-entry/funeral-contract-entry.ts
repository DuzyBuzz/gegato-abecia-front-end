import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FuneralContract } from '../../../models/funeral-contract.model';

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
})
export class FuneralContractEntry implements OnChanges {

  form: FormGroup;

  @Input() selectedContract: FuneralContract | null = null;
  @Output() close = new EventEmitter<void>();

  deceasedName = 'John Doe'; // replace later with real data

  constructor(
    private router: Router,
    private fb: FormBuilder
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedContract'] && this.selectedContract) {
      this.loadContractData(this.selectedContract);
    }
  }

  private loadContractData(contract: FuneralContract): void {
    const { deceased, contractee, casket_urn, delivery, transfer, burial_schedule, remarks, header } = contract;

    this.form.patchValue({
      // Contract Header
      contractDate: header?.contract_date || '',
      contractNo: header?.contract_no || '',
      typeOfService: header?.type_of_service || '',
      typeOfCremation: header?.type_of_cremation || '',
      financialAssistance: header?.financial_assistance || '',

      // Deceased Information
      firstName: deceased?.first_name || '',
      middleName: deceased?.middle_name || '',
      lastName: deceased?.last_name || '',
      suffix: deceased?.suffix || '',
      dateOfBirth: deceased?.date_of_birth || '',
      age: deceased?.age || '',
      sex: deceased?.sex || '',
      civilStatus: deceased?.civil_status || '',
      dateOfDeath: deceased?.date_of_death || '',
      addressOfDeceased: deceased?.address_of_deceased || '',
      placeOfDeath: deceased?.place_of_death || '',
      dateRetrieved: deceased?.retrived_date || '',
      informant: deceased?.informant || '',
      religion: deceased?.religion || '',
      office: deceased?.office || '',
      deliveredBy: deceased?.deliviered_by || '',

      // Contractee Information
      contracteeName: contractee?.full_name || '',
      contracteeAge: contractee?.age || '',
      occupation: contractee?.occupation || '',
      address: contractee?.address || '',
      barangay: contractee?.barangay || '',
      district: contractee?.district || '',
      city: contractee?.city || '',
      relationship: contractee?.relationship || '',
      contactNo: contractee?.contact_no || '',
      email: contractee?.email || '',
      plan: contractee?.plan || '',
      planNo: contractee?.plan_no || '',
      referredBy: contractee?.referred_by || '',

      // Casket/Urn
      contractPrice: casket_urn?.contract_price || '',
      casketType: casket_urn?.casket_type || '',
      casketDescription: casket_urn?.casket_description || '',
      casketOtherDetails: casket_urn?.casket_other_details || '',
      urnType: casket_urn?.urn_type || '',
      urnDescription: casket_urn?.urn_description || '',

      // Delivery
      deliveryDate: delivery?.date || '',
      deliveryTime: delivery?.time || '',
      deliveryLocation: delivery?.location || '',
      deliveryDriver: delivery?.driver || '',
      deliveryHelper: delivery?.helper || '',
      deliveryVehicle: delivery?.vehicle || '',

      // Transfer
      transferDate: transfer?.date || '',
      transferTime: transfer?.time || '',
      transferLocation: transfer?.location || '',
      transferNotes: transfer?.notes || '',

      // Burial/Cremation Schedule
      burialDate: burial_schedule?.burial_date || '',
      takeOffTime: burial_schedule?.take_off_time || '',
      massTime: burial_schedule?.mass_time || '',
      holdingArea: burial_schedule?.holding_area || '',
      cremationDate: burial_schedule?.cremation_date || '',
      cremationTime: burial_schedule?.cremation_time || '',
      church: burial_schedule?.church || '',
      cemetery: burial_schedule?.cemetery || '',
      burialNotes: burial_schedule?.notes || '',
      burialDriver: burial_schedule?.driver || '',
      burialHelper: burial_schedule?.helper || '',
      burialVehicle: burial_schedule?.vehicle || '',

      // Remarks
      contractRemarks: remarks?.contract || '',
      operationsRemarks: remarks?.operations || '',
      morgueRemarks: remarks?.morgue || ''
    });

    this.deceasedName = this.fullName || deceased?.first_name || 'Deceased';
  }

  get fullName(): string {
    const { firstName, suffix, middleName, lastName } = this.form.value;
    return `${firstName} ${suffix} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
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
