import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, Inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ComboboxFirestoreService } from '../../services/combobox-firestore.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
import { DialogModule } from "primeng/dialog";
import { FuneralContract } from '../../models/funeral-contract.model';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';

// ========== FIELD LABEL MAP ==========
const FIELD_LABELS: { [key: string]: string } = {
  // Section 1: Contract Information
  contractNo: 'Contract Number',
  type: 'Type of Service',
  contractDate: 'Contract Date',
  price: 'Contract Price',
  dueDate: 'Due Date',

  // Section 2: Deceased Information
  firstName: 'First Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  age: 'Age',
  gender: 'Gender',
  civilStatus: 'Civil Status',
  dateOfDeath: 'Date of Death',
  placeOfDeath: 'Place of Death',
  religion: 'Religion',
  addressLine1: 'Address',

  // Section 3: Contractee Information
  contractee: 'Contractee Name',
  contracteeAge: 'Contractee Age',
  contactNo: 'Contact Number',
  baranggay: 'Barangay',
  district: 'District',
  municipality: 'City/Municipality',

  // Section 4: Casket/Urn
  casket: 'Casket Type',
};

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectHelperComponent, ToastModule, DialogModule],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
  providers: [MessageService]
})
export class FuneralContractEntry implements OnInit, OnDestroy, AfterViewInit {
  dialogVisible = true;
  form: FormGroup;
  deceasedName = '';
  comboboxesReady = false;
  contractId: number | null = null;
  currentSection = 1;
  private intersectionObserver: IntersectionObserver | null = null;
  
  @Input() set selectedContract(contract: any) {
    if (contract) {
      this.loadDataFromSelected(contract);
    } else {
      // Reset form if no contract is selected (new contract mode)
      this.contractId = null;
      this.form.reset();
      this.deceasedName = '';
    }
  }
  sections = [
    { id: 1, name: 'Contract ' },
    { id: 2, name: 'Deceased ' },
    { id: 3, name: 'Contractee ' },
    { id: 4, name: 'Casket/Urn ' },
    { id: 5, name: 'Delivery' },
    { id: 6, name: 'Transfer & Burial/Cremation' },
    { id: 7, name: 'Embalming & Makeup' },
    { id: 8, name: 'Medical' },
    { id: 9, name: 'Identification ' },
    { id: 10, name: 'Government Signatures' },
    { id: 11, name: 'Remarks' }
  ];

  openBillingRecord(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] openBillingRecord - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before adding payment information',
        life: 3000,
      });
      return;
    }

const role = this.auth.getRole();

if (role === 'Admin') {
  this.router.navigate([`/admin/payments/${this.contractId}`]); // ⚠️ doesn't exist yet
} else {
  this.router.navigate([`/billing/forms/contracts/payments/${this.contractId}`]);
}
  }

  printFuneralServiceContract(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] printFuneralServiceContract - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before printing',
        life: 3000,
      });
      return;
    }

    const role = this.auth.getRole();
    const basePath = role === 'Admin' ? '/admin' : '/billing';
    this.router.navigate([`/print/funeral-service-contract/${this.contractId}`]);
  }

  printAuthorityToCremateRemains(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] printAuthorityToCremateRemains - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before printing',
        life: 3000,
      });
      return;
    }

    const role = this.auth.getRole();
    const basePath = role === 'Admin' ? '/admin' : '/billing';
    this.router.navigate([`/print/authority-to-cremate-remains/${this.contractId}`]);
  }

  printCremationCertificate(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] printCremationCertificate - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before printing',
        life: 3000,
      });
      return;
    }

    const role = this.auth.getRole();
    const basePath = role === 'Admin' ? '/admin' : '/billing';
    this.router.navigate([`/print/cremation-certificate/${this.contractId}`]);
  }
  // ================= PRINTING =================
  printStatement(): void {
    if (!this.contractId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Contract ID not found'
      });
      return;
    }

    this.router.navigate(['/print/statement-of-account', this.contractId]);
  }
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthService,
    private comboboxService: ComboboxFirestoreService,
    private funeralContractService: FuneralContractService,
    @Inject(MessageService) private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      // ========== SECTION 1: CONTRACT INFORMATION ==========
      contractNo: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      contractDate: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      discount: [0],
      dueDate: ['', Validators.required],
      checkedBy: [''],
      financialAssitance: [''],

      // ========== SECTION 2: DECEASED INFORMATION ==========
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      age: [''],
      gender: ['', Validators.required],
      civilStatus: ['', Validators.required],
      dateOfDeath: ['', Validators.required],
      timeOfDeath: [''],
      placeOfDeath: ['', Validators.required],
      placeOfBirth: [''],
      religion: ['', Validators.required],
      addressLine1: ['', Validators.required],
      parentFather: [''],
      parentMother: [''],
      nameOfInformant: [''],

      // ========== SECTION 3: CONTRACTEE INFORMATION ==========
      contractee: ['', Validators.required],
      contracteeAge: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      contracteeGender: [''],
      contracteeCivilStatus: [''],
      contactNo: ['', [Validators.required]],
      baranggay: ['', Validators.required],
      district: ['', Validators.required],
      municipality: ['', Validators.required],
      province: [''], 
      plan: [''],
      planNumber: [''],
      relationshipToDeceased: [''],

      // ========== SECTION 4: CASKET/URN & SERVICES ==========
      casket: ['', Validators.required],
      casketAvailable: [''],
      uniform: [''],
      urnType: [''],
      urnDescription: [''],

      // ========== SECTION 5: DELIVERY ==========
      deliverySerialNumber: [''],
      deliveryDate: [''],
      deliveryHelper: [''],
      deliveryDriver: [''],
      deliveryRemarks: [''],
      deliveryStatus: [''],

      // ========== SECTION 6: TRANSFER & BURIAL/CREMATION SCHEDULE ==========
      dateOfTransfer: [''],
      transferAddress: [''],
      transferTime: [''],
      dateReceived: [''],
      dateOfBurial: [''],
      takeOff: [''],
      massTime: [''],
      burialDriver: [''],
      burialHelper: [''],
      familyCar: [''],
      familyCarDriver: [''],
      flowerCar: [''],
      flowerCarDriver: [''],
      carRental: [''],
      carRentalDriver: [''],
      cremationTime: [''],
      cremationDate: [''],
      cremationOperator: [''],
      burialBenefit: [''],
      setupCrew: [''],
      pallBearrer: [''],
      funeralDirector: [''],
      church: [''],
      cementary: [''],

      // ========== SECTION 7: EMBALMING & MAKEUP ==========
      dateEmblamed: [''],
      timeFinished: [''],
      makeupDressUp: [''],
      makeUprequest: [''],
      bodySpecialInstruction: [''],
      nails: [''],
      lips: [''],
      embalmers: [''],
      finishedBy: [''],
      embalmedBy: [''],

      // ========== SECTION 8: MEDICAL ==========
      autopsy: [''],
      autopsyDate: [''],
      autopsyBy: [''],

      // ========== SECTION 9: IDENTIFICATION DOCUMENTS ==========
      idType: [''],
      claimIdNumber: [''],
      seniorId: [''],
      issuedAt: [''],
      issuedOn: [''],

      // ========== SECTION 10: GOVERNMENT/SIGNATURES/REMARKS ==========
      baranggayIndigent: [''],
      baranggayCaptain: [''],
      cityDocsCompletion: [false],
      supSigBurial: [''],
      omSigDelivery: [''],
      omSigBurial: [''],
      chapelRental: [''],
      familyWillConvo: [false],
      cleared: [false],
      collectorRemarks: [false],
      remarks: [''],
      billingRemarks: [''],

      // ========== ADMINISTRATIVE/TIMESTAMPS ==========
      startOfTransaction: [''],
      dateSubmitted: [''],
      timeEncoded: [''],
      dateAshReleased: [''],
      releasedBy: [''],
      receivedBy: ['']
    });

    // Preload all combobox collections IMMEDIATELY in parallel
    this.preloadComboboxes();


  }

  private preloadComboboxes(): void {
    const comboboxNames = [
      'type',
      'financialAssitance',
      'gender',
      'civilStatus',
      'casket',
      'urnType',
      'autopsy',
      'idType',
      'deliveryStatus'
    ];

    // Load all in parallel (fire and forget - data cached)
    Promise.all(
      comboboxNames.map(name => this.comboboxService.getCombobox(name))
    ).then(() => {
      console.log('[FuneralContractEntry] Comboboxes preloaded');
      this.comboboxesReady = true;
      // Set up real-time watchers
      comboboxNames.forEach(name => {
        this.comboboxService.watchCombobox(name, () => {});
      });
    }).catch(err => {
      console.error('[FuneralContractEntry] Preload failed:', err);
      // Set ready flag even on error to allow form to render
      this.comboboxesReady = true;
    });
  }
ngAfterViewInit() {
  this.setupIntersectionObserver();
}
  ngOnInit(): void {
    
    // Capture contractId from route parameters if in edit mode
    this.activatedRoute.params.subscribe(params => {
      if (params['contractId']) {
        this.contractId = Number(params['contractId']);
        this.loadContractData(params['contractId']);
      }
    });

    const ageControls = ['dateOfBirth', 'dateOfDeath'] as const;
    ageControls.forEach((field) => {
      this.form.get(field)?.valueChanges.subscribe(() => this.updateDeceasedAge());
    });


    // Set up IntersectionObserver to track current section on scroll
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 100);
  }
formatNumber(field: string): void {
  const control = this.form.get(field);

  if (!control) return;

  let value = control.value;

  if (value === null || value === '' || isNaN(value)) {
    control.setValue('0.00', { emitEvent: false });
    return;
  }

  const formatted = parseFloat(value).toFixed(2);

  control.setValue(formatted, { emitEvent: false });
}
  ngOnDestroy(): void {
    // Clean up IntersectionObserver
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
private updateAgeFromDOB(): void {
  this.updateDeceasedAge();
}

private updateDeceasedAge(): void {
  const dob = this.form.get('dateOfBirth')?.value as string | null | undefined;
  const dod = this.form.get('dateOfDeath')?.value as string | null | undefined;
  const age = deceasedAgeAtDeath(dob, dod);
  if (age !== null) {
    this.form.get('age')?.setValue(age, { emitEvent: false });
  } else {
    this.form.get('age')?.setValue('', { emitEvent: false });
  }
}
private setupIntersectionObserver(): void {
  const options = {
    root: null,
    rootMargin: '-40% 0px -50% 0px', // tighter focus
    threshold: 0.25 // 👈 important
  };

  this.intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = Number(entry.target.getAttribute('data-section'));
        this.currentSection = sectionId;
      }
    });
  }, options);

  const sections = document.querySelectorAll('[data-section]');
  sections.forEach(section => {
    this.intersectionObserver?.observe(section);
  });
}

private async loadContractData(id: number): Promise<void> {
  try {
    this.funeralContractService.getFuneralService(id).subscribe({
      next: async (response: any) => {
        console.log('📥 COMPONENT: API response received (already mapped by service):', response);

        // Service already extracted from array and mapped, response is now FuneralContract
        const data = response;

        if (!data || !data.id) {
          console.error('❌ No valid contract data');
          return;
        }

        console.log('✅ COMPONENT: Data received from service:', data);
        console.log('📅 DATE FIELDS CHECK (from mapped response):');
        console.log('  - contractDate:', data.contractDate, typeof data.contractDate);
        console.log('  - dateOfBirth:', data.dateOfBirth, typeof data.dateOfBirth);
        console.log('  - dateOfDeath:', data.dateOfDeath, typeof data.dateOfDeath);
        console.log('  - dueDate:', data.dueDate, typeof data.dueDate);
        console.log('  - dateOfBurial:', data.dateOfBurial, typeof data.dateOfBurial);

        // 🔥 WAIT FOR COMBOBOXES BEFORE PATCHING
        await this.waitForComboboxes();
        console.log('✅ COMBOBOXES READY - Proceeding with patchValue');

        this.contractId = data.id ?? null;

        console.log('📝 FORM BEFORE PATCH (sample dates):');
        console.log('  - contractDate:', this.form.get('contractDate')?.value);
        console.log('  - dateOfBirth:', this.form.get('dateOfBirth')?.value);

        // 🔥 PATCH ALL DATA (service mapper already converted dates to yyyy-MM-dd strings)
        this.form.patchValue(data, { emitEvent: false });
        this.updateAgeFromDOB();
        console.log('✅ FORM AFTER PATCH (verify dates populated):');
        console.log('  - contractDate:', this.form.get('contractDate')?.value);
        console.log('  - dateOfBirth:', this.form.get('dateOfBirth')?.value);
        console.log('  - dateOfDeath:', this.form.get('dateOfDeath')?.value);
        console.log('  - dueDate:', this.form.get('dueDate')?.value);
        console.log('  - dateOfBurial:', this.form.get('dateOfBurial')?.value);

        // 🔥 TRIGGER CHANGE DETECTION TO RENDER IN UI
        this.cdr.markForCheck();
        
        // 🔥 VERIFY ALL DATES ARE IN FORM
        this.verifyFormDateValues('[AFTER PATCH]');

        this.deceasedName = [
          data.firstName,
          data.middleName,
          data.lastName
        ].filter(Boolean).join(' ');

        console.log('✅ Data loaded successfully');
      },
      error: (err) => {
        console.error('❌ COMPONENT: Load contract error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Load Error',
          detail: err.message || 'Failed to load contract',
          life: 3000
        });
      }
    });
  } catch (err) {
    console.error('❌ Load contract exception:', err);
  }
}

async loadDataFromSelected(funeralService: FuneralContract): Promise<void> {
  if (!funeralService) return;

  try {
    // Data is already mapped FuneralContract object
    const data = funeralService;

    console.log('📥 COMPONENT: Selected data received (already mapped):', data);
    console.log('📅 DATE FIELDS CHECK (from mapped data):');
    console.log('  - contractDate:', data.contractDate, typeof data.contractDate);
    console.log('  - dateOfBirth:', data.dateOfBirth, typeof data.dateOfBirth);
    console.log('  - dateOfDeath:', data.dateOfDeath, typeof data.dateOfDeath);
    console.log('  - dueDate:', data.dueDate, typeof data.dueDate);
    console.log('  - dateOfBurial:', data.dateOfBurial, typeof data.dateOfBurial);

    // 🔥 WAIT FOR COMBOBOXES BEFORE PATCHING
    await this.waitForComboboxes();
    console.log('✅ COMBOBOXES READY - Proceeding with patchValue');

    this.contractId = data.id ?? null;

    console.log('📝 FORM BEFORE PATCH (sample dates):');
    console.log('  - contractDate:', this.form.get('contractDate')?.value);
    console.log('  - dateOfBirth:', this.form.get('dateOfBirth')?.value);

    // 🔥 PATCH ALL DATA (mapper already converted dates to yyyy-MM-dd strings)
    this.form.patchValue(data, { emitEvent: false });
this.updateAgeFromDOB();
    console.log('✅ FORM AFTER PATCH (verify dates populated):');
    console.log('  - contractDate:', this.form.get('contractDate')?.value);
    console.log('  - dateOfBirth:', this.form.get('dateOfBirth')?.value);
    console.log('  - dateOfDeath:', this.form.get('dateOfDeath')?.value);
    console.log('  - dueDate:', this.form.get('dueDate')?.value);
    console.log('  - dateOfBurial:', this.form.get('dateOfBurial')?.value);

    // 🔥 TRIGGER CHANGE DETECTION TO RENDER IN UI
    this.cdr.markForCheck();
    
    // 🔥 VERIFY ALL DATES ARE IN FORM
    this.verifyFormDateValues('[SELECTED AFTER PATCH]');

    this.deceasedName = [
      data.firstName,
      data.middleName,
      data.lastName
    ].filter(Boolean).join(' ');

    console.log('✅ Selected data loaded successfully');
} catch (err: unknown) {
  console.error('❌ Load selected data error:', err);

  const message = err instanceof Error
    ? err.message
    : 'Failed to load selected contract';

  this.messageService.add({
    severity: 'error',
    summary: 'Load Error',
    detail: message,
    life: 3000
  });
}
}

private waitForComboboxes(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (this.comboboxesReady) {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 100; // 5 seconds at 50ms intervals

    const checkReady = () => {
      attempts++;

      if (this.comboboxesReady) {
        resolve();
      } else if (attempts >= maxAttempts) {
        console.warn('⚠️ Combobox timeout - proceeding anyway');
        resolve();
      } else {
        setTimeout(checkReady, 50);
      }
    };

    checkReady();
  });
}

private verifyFormDateValues(label: string = ''): void {
  const dateFields = [
    'contractDate', 'dueDate', 'dateOfBirth', 'dateOfDeath', 
    'dateOfBurial', 'dateOfTransfer', 'dateReceived', 'deliveryDate',
    'dateEmblamed', 'autopsyDate', 'issuedOn', 'cremationDate'
  ];

  console.log(`\n📋 VERIFY FORM DATES ${label}:`);
  dateFields.forEach(field => {
    const value = this.form.get(field)?.value;
    if (value) {
      console.log(`  ✅ ${field}: ${value} (type: ${typeof value})`);
    }
  });
  console.log('');
}

scrollToSection(sectionId: number): void {
  const element = document.querySelector(`[data-section="${sectionId}"]`);

  if (element) {
    const yOffset = -80; // adjust for header
    const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

  get currentFuneralService() {
    return this.form.value as any;
  }

  goToBilling(): void {
  if (!this.contractId) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Save First',
      detail: 'Please save contract before proceeding to billing'
    });
    return;
  }

  const role = this.auth.getRole();
  const base = role === 'Admin' ? '/admin' : '/billing';

  this.router.navigate([`${base}/documents/billing/${this.contractId}`]);
}


  get fullName(): string {
    const { firstName, middleName, lastName } = this.form.value;
    return `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
  }

  get isEditMode(): boolean {
    return !!this.contractId;
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Update Contract' : 'Create Contract';
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

submitContract(): void {
  if (this.form.invalid) {
    const invalidFields = this.getInvalidFields();
    const fieldLabels = invalidFields
      .map(field => FIELD_LABELS[field] || field)
      .sort();
    
    const detailMessage = fieldLabels.length > 0
      ? `Please fill in the following required fields:\n${fieldLabels.map(label => `• ${label}`).join('\n')}`
      : 'Please complete required fields.';

    console.log('FORM VALUE:', this.form.value);
    console.log('INVALID FIELDS:', invalidFields);
    
    this.messageService.add({
      severity: 'error',
      summary: 'Missing Required Fields',
      detail: detailMessage,
      life: 5000
    });
    return;
  }

  const isUpdating = !!this.contractId;
  const payload = this.form.value as FuneralContract;

  // ✅ ONLY include ID if updating
  if (this.contractId) {
    payload.id = this.contractId;
  }

  console.log('UPSERT PAYLOAD:', payload);

  this.funeralContractService.save(payload).subscribe({
    next: (res: FuneralContract) => {

      // ✅ backend is source of truth
      if (res?.id) {
        this.contractId = res.id;
      }

      this.messageService.add({
        severity: 'success',
        summary: isUpdating ? 'Updated' : 'Created',
        detail: 'Contract saved successfully',
        life: 3000
      });

    },
    error: (err) => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Save failed',
        life: 4000
      });
    }
  });
}


  // Helper Methods for Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.hasError('required'));
  }


  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return 'This field is required';
    }
    if (field.hasError('email')) {
      return 'Please provide a valid email address';
    }
    if (field.hasError('minlength')) {
      return 'This field does not meet length requirements';
    }
    if (field.hasError('min')) {
      return 'The value entered is not valid';
    }
    if (field.hasError('max')) {
      return 'The value entered exceeds the maximum allowed';
    }
    if (field.hasError('pattern')) {
      return 'The format of this field is not valid';
    }

    return 'Please check this field';
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.invalid && control.hasError('required')) {
        invalidFields.push(key);
      }
    });
    return invalidFields;
  }
}
