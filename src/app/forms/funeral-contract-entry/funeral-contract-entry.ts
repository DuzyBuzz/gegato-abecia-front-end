import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { PrintDataService } from '../../services/print-data.service';
import { ComboboxFirestoreService } from '../../services/combobox-firestore.service';
import { FuneralServiceService } from '../../services/funeral-service.service';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
import { InputNumber } from 'primeng/inputnumber';
import { DialogModule } from "primeng/dialog";
import { FuneralPaymentComponent } from '../funeral-payment/funeral-payment.component';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { BillingEntry } from "../../documents/entry-forms/billing-entry/billing-entry";

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectHelperComponent, ToastModule, DialogModule, FuneralPaymentComponent, BillingEntry],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
  providers: [MessageService]
})
export class FuneralContractEntry implements OnInit, OnDestroy {
  dialogVisible = false;
  paymentDialogVisible = false;
  funeralPaymentData: FuneralPayment | null = null;
  form: FormGroup;
  deceasedName = '';
  comboboxesReady = false;
  messageService: MessageService;
  contractId: string | null = null;
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

    console.log('[FuneralContractEntry] openBillingRecord called', {
      contractId: this.contractId,
      numericContractId: +this.contractId,
      funeralService: {
        id: this.form.value.id,
        contractNo: this.form.value.contractNo,
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        price: this.form.value.price,
        discount: this.form.value.discount
      }
    });

    this.paymentDialogVisible = true;
  }
  sections = [
    { id: 1, name: 'Contract Information' },
    { id: 2, name: 'Deceased Information' },
    { id: 3, name: 'Contractee Information' },
    { id: 4, name: 'Casket/Urn Information' },
    { id: 5, name: 'Delivery' },
    { id: 6, name: 'Transfer & Burial/Cremation' },
    { id: 7, name: 'Embalming & Makeup' },
    { id: 8, name: 'Medical' },
    { id: 9, name: 'Identification Documents' },
    { id: 10, name: 'Government/Signatures/Remarks' },
    { id: 11, name: 'Administrative/Timestamps' }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthService,
    private printDataService: PrintDataService,
    private comboboxService: ComboboxFirestoreService,
    private funeralServiceService: FuneralServiceService,
    messageService: MessageService
  ) {
    this.messageService = messageService;
    this.form = this.fb.group({
      // ========== SECTION 1: CONTRACT INFORMATION ==========
      contractNo: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      contractDate: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      discount: [0],
      dueDate: [''],
      checkedBy: [''],
      financialAssitance: [''],

      // ========== SECTION 2: DECEASED INFORMATION ==========
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      gender: ['', Validators.required],
      civilStatus: ['', Validators.required],
      dateOfDeath: ['', Validators.required],
      timeOfDeath: [''],
      placeOfDeath: ['', Validators.required],
      placeOfBirth: [''],
      religion: [''],
      addressLine1: ['', Validators.required],
      parentFather: [''],
      parentMother: [''],
      nameOfInformant: [''],

      // ========== SECTION 3: CONTRACTEE INFORMATION ==========
      contractee: ['', Validators.required],
      contracteeAge: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      contracteeGender: [''],
      contracteeCivilStatus: [''],
      contactNo: ['', [Validators.required, Validators.pattern(/^[0-9\s\-\+\(\)]{7,}$/)]],
      baranggay: ['', Validators.required],
      district: ['', Validators.required],
      municipality: ['', Validators.required],
      province: [''],
      plan: [''],
      planNumber: [''],

      // ========== SECTION 4: CASKET/URN & SERVICES ==========
      casket: ['', Validators.required],
      casketAvailable: [''],
      uniform: [''],
      urnType: [''],
      urnDescription: [''],

      // ========== SECTION 5: DELIVERY ==========
      deliverySerialNumber: [''],
      deliveryHelper: [''],
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
      cremationOperator: [''],
      burialBenefit: [''],
      setupCrew: [''],
      pallBearrer: [''],
      funeralDirector: [''],

      // ========== SECTION 7: EMBALMING & MAKEUP ==========
      dateEmblamed: [''],
      timeFinished: [''],
      makeupDressUp: [''],
      makeUprequest: [''],
      bodySpecialInstruction: [''],
      nails: [''],
      lips: [''],
      emblamers: [''],
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

  ngOnInit(): void {
    // Capture contractId from route parameters if in edit mode
    this.activatedRoute.params.subscribe(params => {
      if (params['contractId']) {
        this.contractId = params['contractId'];
        this.loadContractData(params['contractId']);
      }
    });

    // Auto-calculate age when dateOfBirth changes
    this.form.get('dateOfBirth')?.valueChanges.subscribe(dateOfBirth => {
      if (dateOfBirth) {
        const calculatedAge = this.calculateAge(new Date(dateOfBirth));
        this.form.get('age')?.setValue(calculatedAge, { emitEvent: false });
      }
    });

    // Format price and discount to 2 decimals on input
    ['price', 'discount'].forEach(field => {
      this.form.get(field)?.valueChanges.subscribe(value => {
        if (value && !isNaN(value)) {
          const formatted = parseFloat(value).toFixed(2);
          this.form.get(field)?.setValue(formatted, { emitEvent: false });
        }
      });
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

  private setupIntersectionObserver(): void {
    // Create observer options to detect when sections are in view
    const options = {
      root: null, // viewport
      rootMargin: '-30% 0px -70% 0px', // trigger when section is in top 30% of viewport
      threshold: 0
    };

    // Create the observer
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = parseInt(entry.target.getAttribute('data-section') || '1');
          this.currentSection = sectionId;
        }
      });
    }, options);

    // Observe all section elements
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => {
      this.intersectionObserver?.observe(section);
    });
  }

  private loadContractData(contractId: string | number): void {
    this.funeralServiceService.getFuneralService(Number(contractId)).subscribe({
      next: (data: any) => {
        console.log('[FuneralContractEntry] Contract data loaded:', data);
        // Use setTimeout to ensure select-helper comboboxes are initialized
        setTimeout(() => {
          this.form.patchValue(data, { emitEvent: false });
          this.deceasedName = `${data.firstName} ${data.lastName}`;
        }, 100);
      },
      error: (err) => {
        console.error('[FuneralContractEntry] Failed to load contract data:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Unable to Load',
          detail: 'The contract data could not be loaded. Please try again or contact support if the problem persists.',
          life: 5000
        });
      }
    });
  }

  loadDataFromSelected(funeralService: any): void {
    if (!funeralService) return;
    
    console.log('[FuneralContractEntry] Loading data from selected contract:', funeralService);
    this.contractId = funeralService.id?.toString() || null;
    
    // Use setTimeout to ensure select-helper comboboxes are initialized
    setTimeout(() => {
      // Convert timestamps to yyyy-MM-dd format before patching
      const normalizedData = this.normalizeTimestamps(funeralService);
      this.form.patchValue(normalizedData, { emitEvent: false });
      this.deceasedName = `${funeralService.firstName} ${funeralService.lastName}`;
    }, 100);
  }

  private normalizeTimestamps(data: any): any {
    const normalized = { ...data };
    const dateFields = [
      'dateOfBirth', 'contractDate', 'dueDate', 'dateOfDeath',
      'contractDate', 'dateDelivery', 'cremationDate', 'promissoryDate',
      'dateBurial', 'ashReleased', 'timeOfDeath'
    ];

    dateFields.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'number') {
        // Convert timestamp to yyyy-MM-dd format
        const date = new Date(normalized[field]);
        normalized[field] = date.toISOString().split('T')[0];
      } else if (normalized[field] && normalized[field] instanceof Date) {
        // Convert Date object to yyyy-MM-dd format
        normalized[field] = normalized[field].toISOString().split('T')[0];
      }
    });

    return normalized;
  }

  onPaymentSaved(payment: FuneralPayment): void {
    this.funeralPaymentData = payment;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Payment record saved successfully',
      life: 3000,
    });
  }

  onPaymentDialogClose(): void {
    this.paymentDialogVisible = false;
  }

  get currentFuneralService() {
    return this.form.value as any;
  }

  scrollToSection(sectionId: number): void {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date(); 
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  }

  goToBilling(): void {
    // Validate form before navigation
    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to Proceed',
        detail: 'Please complete all required fields before proceeding. Check highlighted fields for more information.',
        life: 5000
      });
      return;
    }

    const userRole = this.auth.getRole();
    const billingPath = userRole === 'Admin' ? '/admin/documents/billing' : '/billing/documents/billing';
    
    // If we have a contractId, pass it to billing form
    if (this.contractId) {
      this.router.navigate([billingPath.replace('documents/billing', `documents/billing/${this.contractId}`)]);
    } else {
      // Generate a temporary contractId based on form data
      const tempId = this.generateContractId();
      this.contractId = tempId;
      this.router.navigate([`${billingPath}/${tempId}`]);
    }
  }

  private generateContractId(): string {
    // Generate a contract ID based on timestamp and form data
    const timestamp = new Date().getTime();
    const deceasedName = this.form.get('firstName')?.value || 'Unknown';
    return `contract_${deceasedName.substring(0, 3)}_${timestamp}`;
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

  submitContract(): void {
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unable to Save',
        detail: 'Please complete all required fields before proceeding. Check highlighted fields for more information.',
        sticky: true,
        life: 8000
      });
      return;
    }

    const formValue = this.form.value;

    // Map form values directly to FuneralService model (field names already match)
    const funeralService = {
      id: this.contractId ? Number(this.contractId) : undefined, // Include ID if updating
      // Contract Info
      contractNo: formValue.contractNo,
      type: formValue.type,
      contractDate: formValue.contractDate,
      price: parseFloat(formValue.price) || 0,
      discount: parseFloat(formValue.discount) || 0,
      dueDate: formValue.dueDate,
      checkedBy: formValue.checkedBy,
      financialAssitance: formValue.financialAssitance,

      // Deceased Information
      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      age: parseInt(formValue.age) || 0,
      gender: formValue.gender,
      civilStatus: formValue.civilStatus,
      dateOfDeath: formValue.dateOfDeath,
      timeOfDeath: formValue.timeOfDeath,
      placeOfDeath: formValue.placeOfDeath,
      placeOfBirth: formValue.placeOfBirth,
      religion: formValue.religion,
      addressLine1: formValue.addressLine1,
      parentFather: formValue.parentFather,
      parentMother: formValue.parentMother,
      nameOfInformant: formValue.nameOfInformant,

      // Contractee Information
      contractee: formValue.contractee,
      contracteeAge: parseInt(formValue.contracteeAge) || 0,
      contracteeGender: formValue.contracteeGender,
      contracteeCivilStatus: formValue.contracteeCivilStatus,
      contactNo: formValue.contactNo,
      baranggay: formValue.baranggay,
      district: formValue.district,
      municipality: formValue.municipality,
      province: formValue.province,
      plan: formValue.plan,
      planNumber: formValue.planNumber,

      // Casket/Urn
      casket: formValue.casket,
      casketAvailable: formValue.casketAvailable,
      uniform: formValue.uniform,
      urnType: formValue.urnType,
      urnDescription: formValue.urnDescription,

      // Delivery
      deliverySerialNumber: formValue.deliverySerialNumber,
      deliveryHelper: formValue.deliveryHelper,
      deliveryRemarks: formValue.deliveryRemarks,
      deliveryStatus: formValue.deliveryStatus,

      // Transfer & Burial/Cremation
      dateOfTransfer: formValue.dateOfTransfer,
      transferAddress: formValue.transferAddress,
      transferTime: formValue.transferTime,
      dateReceived: formValue.dateReceived,
      dateOfBurial: formValue.dateOfBurial,
      takeOff: formValue.takeOff,
      massTime: formValue.massTime,
      burialDriver: formValue.burialDriver,
      burialHelper: formValue.burialHelper,
      familyCar: formValue.familyCar,
      familyCarDriver: formValue.familyCarDriver,
      flowerCar: formValue.flowerCar,
      flowerCarDriver: formValue.flowerCarDriver,
      carRental: formValue.carRental,
      carRentalDriver: formValue.carRentalDriver,
      cremationTime: formValue.cremationTime,
      cremationOperator: formValue.cremationOperator,
      burialBenefit: formValue.burialBenefit,
      setupCrew: formValue.setupCrew,
      pallBearrer: formValue.pallBearrer,
      funeralDirector: formValue.funeralDirector,

      // Embalming & Makeup
      dateEmblamed: formValue.dateEmblamed,
      timeFinished: formValue.timeFinished,
      makeupDressUp: formValue.makeupDressUp,
      makeUprequest: formValue.makeUprequest,
      bodySpecialInstruction: formValue.bodySpecialInstruction,
      nails: formValue.nails,
      lips: formValue.lips,
      emblamers: formValue.emblamers,
      finishedBy: formValue.finishedBy,
      embalmedBy: formValue.embalmedBy,

      // Medical
      autopsy: formValue.autopsy,
      autopsyDate: formValue.autopsyDate,
      autopsyBy: formValue.autopsyBy,

      // Identification Documents
      idType: formValue.idType,
      claimIdNumber: formValue.claimIdNumber,
      seniorId: formValue.seniorId,
      issuedAt: formValue.issuedAt,
      issuedOn: formValue.issuedOn,

      // Government/Signatures/Remarks
      baranggayIndigent: formValue.baranggayIndigent,
      baranggayCaptain: formValue.baranggayCaptain,
      cityDocsCompletion: formValue.cityDocsCompletion,
      supSigBurial: formValue.supSigBurial,
      omSigDelivery: formValue.omSigDelivery,
      omSigBurial: formValue.omSigBurial,
      chapelRental: formValue.chapelRental,
      familyWillConvo: formValue.familyWillConvo,
      cleared: formValue.cleared,
      collectorRemarks: formValue.collectorRemarks,
      remarks: formValue.remarks,
      billingRemarks: formValue.billingRemarks,

      // Timestamps
      startOfTransaction: formValue.startOfTransaction,
      dateSubmitted: formValue.dateSubmitted,
      timeEncoded: formValue.timeEncoded,
      dateAshReleased: formValue.dateAshReleased,
      releasedBy: formValue.releasedBy,
      receivedBy: formValue.receivedBy
    };

    const isUpdate = !!this.contractId;
    const operationType = isUpdate ? 'updated' : 'created';
    
    // Include ID if updating
    if (isUpdate) {
      funeralService.id = Number(this.contractId);
    }

    console.log(`[FuneralContractEntry] Submitting funeral contract (${isUpdate ? 'UPDATE' : 'CREATE'}):`, funeralService);

    // Show loading message
    this.messageService.add({
      severity: 'info',
      summary: 'Processing',
      detail: isUpdate ? 'Updating contract in database...' : 'Creating contract in database...',
      life: 3000
    });

    this.funeralServiceService.save(funeralService).subscribe({
      next: (response: any) => {
        console.log(`[FuneralContractEntry] Contract ${operationType} successfully:`, response);
        
        // Set contract ID from response if available
        if (response && response.id) {
          this.contractId = response.id.toString();
        }

        this.messageService.add({
          severity: 'success',
          summary: isUpdate ? 'Contract Updated Successfully' : 'Contract Created Successfully',
          detail: `Funeral contract for ${funeralService.firstName} ${funeralService.lastName} has been ${operationType}. Contract ID: ${this.contractId || 'pending'}`,
          life: 4000
        });
        
        // Navigate back after delay
        setTimeout(() => this.goBack(), 2000);
      },
      error: (err: any) => {
        console.error(`[FuneralContractEntry] Failed to ${isUpdate ? 'update' : 'create'} contract:`, err);
        
        this.messageService.add({
          severity: 'error',
          summary: isUpdate ? 'Update Failed' : 'Creation Failed',
          detail: 'An error occurred while processing your request. Please try again later or contact support if the problem persists.',
          sticky: true,
          life: 6000
        });
      }
    });
  }

  // Field name to display name mapping
  private fieldDisplayNames: { [key: string]: string } = {
    contractNo: 'Contract Number',
    type: 'Type of Service',
    contractDate: 'Contract Date',
    price: 'Contract Price',
    discount: 'Discount',
    dueDate: 'Due Date',
    checkedBy: 'Checked By',
    financialAssitance: 'Financial Assistance',
    firstName: 'First Name',
    middleName: 'Middle Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    age: 'Age',
    gender: 'Gender',
    civilStatus: 'Civil Status',
    dateOfDeath: 'Date of Death',
    timeOfDeath: 'Time of Death',
    placeOfDeath: 'Place of Death',
    placeOfBirth: 'Place of Birth',
    religion: 'Religion',
    addressLine1: 'Address',
    parentFather: 'Father\'s Name',
    parentMother: 'Mother\'s Name',
    nameOfInformant: 'Informant',
    contractee: 'Contractee Name',
    contracteeAge: 'Contractee Age',
    contracteeGender: 'Contractee Gender',
    contracteeCivilStatus: 'Contractee Civil Status',
    contactNo: 'Contact Number',
    baranggay: 'Barangay',
    district: 'District',
    municipality: 'City/Municipality',
    province: 'Province',
    plan: 'Plan',
    planNumber: 'Plan Number',
    casket: 'Casket Type',
    casketAvailable: 'Casket Available',
    uniform: 'Uniform',
    urnType: 'Urn Type',
    urnDescription: 'Urn Description',
    deliverySerialNumber: 'Delivery Serial Number',
    deliveryHelper: 'Delivery Helper',
    deliveryRemarks: 'Delivery Remarks',
    deliveryStatus: 'Delivery Status',
    dateOfTransfer: 'Transfer Date',
    transferAddress: 'Transfer Address',
    transferTime: 'Transfer Time',
    dateReceived: 'Date Received',
    dateOfBurial: 'Burial Date',
    takeOff: 'Take Off Time',
    massTime: 'Mass Time',
    burialDriver: 'Burial Driver',
    burialHelper: 'Burial Helper',
    familyCar: 'Family Car',
    familyCarDriver: 'Family Car Driver',
    flowerCar: 'Flower Car',
    flowerCarDriver: 'Flower Car Driver',
    carRental: 'Car Rental',
    carRentalDriver: 'Car Rental Driver',
    cremationTime: 'Cremation Time',
    cremationOperator: 'Cremation Operator',
    burialBenefit: 'Burial Benefit',
    setupCrew: 'Setup Crew',
    pallBearrer: 'Pall Bearers',
    funeralDirector: 'Funeral Director',
    dateEmblamed: 'Date Embalmed',
    timeFinished: 'Time Finished',
    makeupDressUp: 'Makeup & Dress Up',
    makeUprequest: 'Makeup Request',
    bodySpecialInstruction: 'Body Special Instructions',
    nails: 'Nails',
    lips: 'Lips',
    emblamers: 'Embalmers',
    finishedBy: 'Finished By',
    embalmedBy: 'Embalmed By',
    autopsy: 'Autopsy',
    autopsyDate: 'Autopsy Date',
    autopsyBy: 'Autopsy By',
    idType: 'ID Type',
    claimIdNumber: 'Claim ID Number',
    seniorId: 'Senior ID',
    issuedAt: 'Issued At',
    issuedOn: 'Issued On',
    baranggayIndigent: 'Barangay Indigent',
    baranggayCaptain: 'Barangay Captain',
    cityDocsCompletion: 'City Docs Completion',
    supSigBurial: 'Supervisor Burial Signature',
    omSigDelivery: 'Operations Manager Delivery Signature',
    omSigBurial: 'Operations Manager Burial Signature',
    chapelRental: 'Chapel Rental',
    familyWillConvo: 'Family Will Have Conversation',
    cleared: 'Cleared',
    collectorRemarks: 'Collector Remarks',
    remarks: 'Remarks',
    billingRemarks: 'Billing Remarks',
    startOfTransaction: 'Start of Transaction',
    dateSubmitted: 'Date Submitted',
    timeEncoded: 'Time Encoded',
    dateAshReleased: 'Date Ash Released',
    releasedBy: 'Released By',
    receivedBy: 'Received By'
  };

  // Helper Methods for Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.hasError('required'));
  }

  getDisplayName(fieldName: string): string {
    return this.fieldDisplayNames[fieldName] || fieldName;
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
