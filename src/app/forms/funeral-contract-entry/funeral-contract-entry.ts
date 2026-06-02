import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, Inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ComboboxFirestoreService } from '../../services/combobox-firestore.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
import { AutoCompleteHelperComponent } from '../../shared/components/auto-complete-helper/auto-complete-helper.component';
import { DialogModule } from "primeng/dialog";
import { FuneralContract } from '../../models/funeral-contract.model';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';

// ========== FIELD LABEL MAP ==========
const FIELD_LABELS: { [key: string]: string } = {
  // Section 1: Contract Information
  contractNo: 'Contract Number',
  type: 'Type of Service',
  contractDate: 'Contract Date',
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
};

const SECTION_FIELDS: Record<number, string[]> = {
  1: ['contractNo', 'contractDate', 'dueDate', 'type'],
  2: ['firstName', 'lastName', 'dateOfBirth', 'dateOfDeath', 'gender', 'religion', 'placeOfDeath'],
  3: ['contractee', 'relationshipToDeceased', 'contactNo', 'addressLine1', 'municipality'],
  4: ['deliveryDate', 'deliveryDriver', 'deliveryHelper', 'deliveryStatus'],
  5: ['dateOfTransfer', 'transferAddress', 'dateOfBurial', 'massTime', 'church', 'cementary'],
  6: ['dateEmblamed', 'timeFinished', 'embalmedBy', 'finishedBy'],
  7: ['autopsy', 'autopsyDate', 'autopsyBy'],
  8: ['idType', 'claimIdNumber', 'issuedAt', 'issuedOn'],
  9: ['baranggayCaptain', 'cityDocsCompletion', 'cleared', 'supSigBurial'],
  10: ['remarks', 'billingRemarks']
};

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectHelperComponent, AutoCompleteHelperComponent, ToastModule, DialogModule],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
  providers: [MessageService]
})
export class FuneralContractEntry implements OnInit, OnDestroy, AfterViewInit {
  dialogVisible = true;
  form: FormGroup;
  deceasedName = '';
  comboboxesReady = false;
  isSaving = false;
  contractId: number | null = null;
  currentSection = 1;
  private intersectionObserver: IntersectionObserver | null = null;
  documentsMenuOpen = false;
  expandedSections: { [key: number]: boolean } = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false
  };
  
  @Input() set selectedContract(contract: any) {
    if (contract) {
      this.loadDataFromSelected(contract);
    } else {
      // Reset form if no contract is selected (new contract mode)
      this.contractId = null;
      this.form.reset();
      this.form.patchValue({ contractDate: this.getTodayDateString() }, { emitEvent: false });
      this.deceasedName = '';
    }
  }
  sections = [
    { id: 1, name: 'Contract ' },
    { id: 2, name: 'Deceased ' },
    { id: 3, name: 'Contractee ' },
    { id: 4, name: 'Delivery' },
    { id: 5, name: 'Transfer & Burial/Cremation' },
    { id: 6, name: 'Embalming & Makeup' },
    { id: 7, name: 'Medical' },
    { id: 8, name: 'Identification ' },
    { id: 9, name: 'Government Signatures' },
    { id: 10, name: 'Remarks' }
  ];

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  openBillingRecord(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] openBillingRecord - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before opening billing or payment details',
        life: 3000,
      });
      return;
    }

    if (!this.auth.canAccessPayments()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Access denied',
        detail: 'You do not have access to the billing screen.',
        life: 3000,
      });
      return;
    }

    this.router.navigateByUrl(this.auth.getContractFinanceRoute(this.contractId));
  }

  get billingActionLabel(): string {
    return this.auth.getContractFinanceLabel();
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

  printEventDetailsInstructions(): void {
    if (!this.contractId) {
      console.warn('[FuneralContractEntry] printEventDetailsInstructions - No contractId');
      this.messageService.add({
        severity: 'info',
        summary: 'Create Contract First',
        detail: 'Please save the contract first before printing',
        life: 3000,
      });
      return;
    }

    this.router.navigate(['/print/event-details-instructions', this.contractId]);
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
      contractNo: [''],
      type: [''],
      contractDate: [this.getTodayDateString()],
      dueDate: [''],
      price: [0],
      discount: [0],
      checkedBy: [''],

      // ========== SECTION 2: DECEASED INFORMATION ==========
      firstName: [''],
      middleName: [''],
      lastName: [''],
      dateOfBirth: [''],
      age: [''],
      gender: [''],
      civilStatus: [''],
      dateOfDeath: [''],
      timeOfDeath: [''],
      placeOfDeath: [''],
      placeOfBirth: [''],
      religion: [''],
      addressLine1: [''],
      parentFather: [''],
      parentMother: [''],
      nameOfInformant: [''],

      // ========== SECTION 3: CONTRACTEE INFORMATION ==========
      contractee: [''],
      contracteeAge: [''],
      contracteeGender: [''],
      contracteeCivilStatus: [''],
      contactNo: [''],
      baranggay: [''],
      district: [''],
      municipality: [''],
      province: [''], 
      plan: [''],
      planNumber: [''],
      relationshipToDeceased: [''],

      // ========== SECTION 4: DELIVERY ==========
      deliverySerialNumber: [''],
      deliveryDate: [''],
      deliveryHelper: [''],
      deliveryDriver: [''],
      deliveryRemarks: [''],
      deliveryStatus: [''],

      // ========== SECTION 5: TRANSFER & BURIAL/CREMATION SCHEDULE ==========
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

      // ========== SECTION 6: EMBALMING & MAKEUP ==========
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

      // ========== SECTION 7: MEDICAL ==========
      autopsy: [''],
      autopsyDate: [''],
      autopsyBy: [''],

      // ========== SECTION 8: IDENTIFICATION DOCUMENTS ==========
      idType: [''],
      claimIdNumber: [''],
      seniorId: [''],
      issuedAt: [''],
      issuedOn: [''],

      // ========== SECTION 9: GOVERNMENT/SIGNATURES/REMARKS ==========
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

    this.applyFormAccess();


  }

  private preloadComboboxes(): void {
    const comboboxNames = [
      'type',
      'gender',
      'civilStatus',
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
    this.applyFormAccess();
    
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
        this.applyFormAccess();
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
    this.applyFormAccess();
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

  get canEditContract(): boolean {
    return this.auth.canManageFuneralContracts();
  }

  get isBillerUser(): boolean {
    return this.auth.isBiller();
  }

  get canEditCompactSections(): boolean {
    return this.isBillerUser;
  }

  get canAccessPayments(): boolean {
    return this.auth.canAccessPayments();
  }

  get workflowTotalSections(): number {
    return this.sections.length;
  }

  get workflowCompletedSections(): number {
    return this.sections.filter((section) => this.getSectionStatusLabel(section.id) === 'Completed').length;
  }

  get workflowProgressPercent(): number {
    const totalSections = this.workflowTotalSections;
    if (!totalSections) {
      return 0;
    }

    const totalRatio = this.sections.reduce((sum, section) => {
      return sum + this.getSectionCompletionRatio(section.id);
    }, 0);

    return Math.round((totalRatio / totalSections) * 100);
  }

  get deliveryStatusLabel(): string {
    const status = this.normalizeDeliveryStatus(this.form.get('deliveryStatus')?.value);

    switch (status) {
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  }

  get deliveryStatusClass(): string {
    const status = this.normalizeDeliveryStatus(this.form.get('deliveryStatus')?.value);

    switch (status) {
      case 'completed':
        return 'contract-entry-header__status-pill--completed';
      case 'cancelled':
        return 'contract-entry-header__status-pill--cancelled';
      case 'scheduled':
      default:
        return 'contract-entry-header__status-pill--scheduled';
    }
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

  private applyFormAccess(): void {
    if (this.canEditCompactSections) {
      this.form.enable({ emitEvent: false });
      this.form.get('age')?.disable({ emitEvent: false });
      return;
    }

    this.form.disable({ emitEvent: false });
  }

submitContract(): void {
  if (this.isSaving) {
    return;
  }

  if (!this.canEditCompactSections) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Read only',
      detail: 'Only billers can expand and edit compact funeral contract sections.',
      life: 3000
    });
    return;
  }

  if (this.form.invalid) {
    console.log('FORM VALUE:', this.form.value);
    
    this.messageService.add({
      severity: 'error',
      summary: 'Invalid Form',
      detail: 'Please review and correct invalid fields before saving.',
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

  this.isSaving = true;

  this.funeralContractService.save(payload).subscribe({
    next: (res: FuneralContract) => {
      this.isSaving = false;

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
      this.isSaving = false;
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
    return false;
  }


  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field) return '';

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
      if (control && control.invalid) {
        invalidFields.push(key);
      }
    });
    return invalidFields;
  }

  toggleDocumentsMenu(): void {
    this.documentsMenuOpen = !this.documentsMenuOpen;
  }

  toggleSection(sectionId: number): void {
    if (!this.isBillerUser) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(this.expandedSections, sectionId)) {
      this.expandedSections[sectionId] = !this.expandedSections[sectionId];
    }
  }

  getSectionSummary(sectionId: number): string {
    const value = this.form.getRawValue();

    switch (sectionId) {
      case 1:
        return [
          value.contractNo || 'No contract number',
          value.contractDate ? `Contract date ${this.formatDate(value.contractDate)}` : 'Contract date not set',
          value.dueDate ? `Due ${this.formatDate(value.dueDate)}` : 'No due date'
        ].join(' • ');
      case 2:
        return [
          this.fullName || 'Deceased details not entered',
          value.dateOfDeath ? `Died ${this.formatDate(value.dateOfDeath)}` : 'No date of death',
          value.placeOfDeath || 'Place of death not set'
        ].join(' • ');
      case 3:
        return [
          value.contractee || 'No contractee',
          value.relationshipToDeceased || 'Relationship not set',
          value.contactNo || 'No contact number'
        ].join(' • ');
      case 4:
        return [
          `Delivery ${this.deliveryStatusLabel}`,
          value.deliveryDate ? this.formatDate(value.deliveryDate) : 'No delivery date',
          value.deliveryDriver || 'No driver assigned'
        ].join(' • ');
      case 5:
        return [
          value.transferAddress || 'No wake location',
          value.dateOfBurial ? `Burial ${this.formatDate(value.dateOfBurial)}` : 'No burial date',
          value.church || value.cementary || 'Venue not set'
        ].join(' • ');
      case 6:
        return [
          value.embalmedBy || 'No embalmer assigned',
          value.dateEmblamed ? `Embalmed ${this.formatDate(value.dateEmblamed)}` : 'No embalming date',
          value.finishedBy || 'No finisher assigned'
        ].join(' • ');
      case 7:
        return [
          `Autopsy ${value.autopsy || 'not specified'}`,
          value.autopsyDate ? this.formatDate(value.autopsyDate) : 'No autopsy date',
          value.autopsyBy || 'No medical officer'
        ].join(' • ');
      case 8:
        return [
          value.idType || 'No ID type',
          value.claimIdNumber || 'No claim ID number',
          value.issuedOn ? `Issued ${this.formatDate(value.issuedOn)}` : 'Issue date not set'
        ].join(' • ');
      case 9:
        return [
          value.cityDocsCompletion ? 'City documents complete' : 'City documents pending',
          value.cleared ? 'Cleared' : 'Not cleared',
          value.baranggayCaptain || 'No barangay captain listed'
        ].join(' • ');
      case 10:
        return value.remarks || value.billingRemarks || 'No remarks recorded';
      default:
        return 'Summary unavailable.';
    }
  }

  getSectionStatusLabel(sectionId: number): 'Completed' | 'Scheduled' | 'Cancelled' | 'Not Started' {
    if (sectionId === 4) {
      const deliveryStatus = this.normalizeDeliveryStatus(this.form.get('deliveryStatus')?.value);

      switch (deliveryStatus) {
        case 'completed':
          return 'Completed';
        case 'cancelled':
          return 'Cancelled';
        case 'scheduled':
          return 'Scheduled';
        default:
          return this.getSectionCompletionRatio(sectionId) > 0 ? 'Scheduled' : 'Not Started';
      }
    }

    const completionRatio = this.getSectionCompletionRatio(sectionId);

    if (completionRatio === 0) {
      return 'Not Started';
    }

    if (completionRatio >= 0.74) {
      return 'Completed';
    }

    return 'Scheduled';
  }

  getSectionStatusClass(sectionId: number): string {
    const status = this.getSectionStatusLabel(sectionId);

    switch (status) {
      case 'Completed':
        return 'contract-entry-section__badge--completed';
      case 'Cancelled':
        return 'contract-entry-section__badge--cancelled';
      case 'Scheduled':
        return 'contract-entry-section__badge--scheduled';
      default:
        return 'contract-entry-section__badge--not-started';
    }
  }

  getWorkflowStepClass(sectionId: number): string {
    const status = this.getSectionStatusLabel(sectionId);

    switch (status) {
      case 'Completed':
        return 'contract-entry-workflow__step--completed';
      case 'Cancelled':
        return 'contract-entry-workflow__step--cancelled';
      case 'Scheduled':
        return 'contract-entry-workflow__step--scheduled';
      default:
        return '';
    }
  }

  private getSectionCompletionRatio(sectionId: number): number {
    const fields = SECTION_FIELDS[sectionId] ?? [];
    if (!fields.length) {
      return 0;
    }

    const value = this.form.getRawValue() as Record<string, unknown>;
    const completedFields = fields.filter((field) => this.hasMeaningfulValue(value[field])).length;

    return completedFields / fields.length;
  }

  private normalizeDeliveryStatus(status: unknown): 'completed' | 'scheduled' | 'cancelled' | 'unknown' {
    const normalized = String(status || '').trim().toLowerCase();

    if (!normalized) {
      return 'unknown';
    }

    if (normalized.includes('complete')) {
      return 'completed';
    }

    if (normalized.includes('cancel')) {
      return 'cancelled';
    }

    if (normalized.includes('schedule')) {
      return 'scheduled';
    }

    return 'unknown';
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not set';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  private hasMeaningfulValue(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return !Number.isNaN(value) && value !== 0;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return value !== null && value !== undefined;
  }
}
