import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuneralContract } from '../../../models/funeral-contract.model';
import { AuthService } from '../../../services/auth.service';
import { PrintDataService } from '../../../services/print-data.service';
import { FUNERAL_CONTRACTS_MOCK } from '../../../../assets/mock/funeral-contract.mock';
import { BILLING_ACCOUNTS_MOCK } from '../../../../assets/mock/billing-account.mock';

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
})
export class FuneralContractEntry implements OnInit {

  form: FormGroup;
  selectedContract: FuneralContract | null = null;
  contractId: string | null = null;
  isNew: boolean = false;
  deceasedName = 'John Doe'; // replace later with real data

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthService,
    private printDataService: PrintDataService
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

  ngOnInit(): void {
    this.contractId = this.activatedRoute.snapshot.paramMap.get('contractId');
    this.isNew = !this.contractId || this.contractId === 'new';

    if (!this.isNew && this.contractId) {
      this.loadContractFromMock(this.contractId);
    }
  }

  private loadContractFromMock(contractId: string): void {
    // Load from mock data - replace with actual service call
    const numericId = parseInt(contractId, 10);
    const contract = FUNERAL_CONTRACTS_MOCK.find(c => c.contract_id === numericId);
    if (contract) {
      this.selectedContract = contract;
      this.loadContractData(contract);
    } else {
      console.warn('[FuneralContractEntry] Contract not found:', contractId);
    }
  }

  get isBillingDisabled(): boolean {
    return !this.selectedContract;
  }

  goToBilling(): void {
    if (!this.selectedContract) {
      return; // hard stop
    }

    // Navigate to the appropriate billing entry based on user role
    const userRole = this.auth.getRole();
    let billingPath = '';

    if (userRole === 'Admin') {
      billingPath = `/admin/documents/billing/${this.selectedContract.contract_id}`;
    } else if (userRole === 'Biller') {
      billingPath = `/billing/documents/billing/${this.selectedContract.contract_id}`;
    } else {
      console.warn('[FuneralContractEntry] User role not supported for billing:', userRole);
      return;
    }

    console.log('[FuneralContractEntry] Navigating to billing:', billingPath);
    this.router.navigateByUrl(billingPath);
  }

  goBack(): void {
    const userRole = this.auth.getRole();
    const backPath = userRole === 'Admin' ? '/admin/deceased' : '/billing/deceased';
    this.router.navigateByUrl(backPath);
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

    if (!this.selectedContract) {
      console.warn('[FuneralContractEntry] No contract selected for printing');
      return;
    }

    const userRole = this.auth.getRole();
    const contractId = this.selectedContract.contract_id;
    let printPath = '';

    // Get billing account if available
    const billingAccount = BILLING_ACCOUNTS_MOCK.find(b => b.funeral_contract_id === contractId);

    // Set print data in service BEFORE navigating
    this.printDataService.setPrintData(this.selectedContract, billingAccount);

    switch (value) {
      case 'funeral-contract':
        // TODO: Implement funeral-service-contract-printing route if needed
        console.log('[FuneralContractEntry] Funeral Service Contract printing - route not yet configured');
        break;

      case 'cremation-certificate':
        // TODO: Implement cremation-certificate-printing route if needed
        console.log('[FuneralContractEntry] Cremation Certificate printing - route not yet configured');
        break;

      case 'authority-cremate':
        printPath = userRole === 'Admin'
          ? `/admin/print/authority-to-cremate-remains/${contractId}`
          : `/billing/print/authority-to-cremate-remains/${contractId}`;
        this.router.navigateByUrl(printPath);
        break;

      case 'statement-account':
        printPath = userRole === 'Admin'
          ? `/admin/print/statement-of-account/${contractId}`
          : `/billing/print/statement-of-account/${contractId}`;
        this.router.navigateByUrl(printPath);
        break;
    }

    (event.target as HTMLSelectElement).value = '';
  }
}
