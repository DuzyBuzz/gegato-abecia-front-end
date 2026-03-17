import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import { PrintDataService } from '../../../services/print-data.service';
import { ComboboxFirestoreService } from '../../../services/combobox-firestore.service';
import { FuneralServiceService } from '../../../services/funeral-service.service';
import { SelectHelperComponent } from '../../../shared/components/select-helper/select-helper.component';
import { InputNumber } from 'primeng/inputnumber';

@Component({
  selector: 'app-funeral-contract-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectHelperComponent, ToastModule, InputNumber],
  templateUrl: './funeral-contract-entry.html',
  styleUrl: './funeral-contract-entry.scss',
  providers: [MessageService]
})
export class FuneralContractEntry implements OnInit, OnDestroy {

  form: FormGroup;
  deceasedName = '';
  comboboxesReady = false;
  messageService: MessageService;
  contractId: string | null = null;
  currentSection = 1;
  private intersectionObserver: IntersectionObserver | null = null;
  
  sections = [
    { id: 1, name: 'Contract Information' },
    { id: 2, name: 'Deceased Information' },
    { id: 3, name: 'Contractee Information' },
    { id: 4, name: 'Casket/Urn & Services' },
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
      }
    });

    // Initialize sample data for testing
    this.initializeSampleData();

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

  private initializeSampleData(): void {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateOfBirth = '1945-03-15';
    const dateOfDeath = '2024-03-10';

    this.form.patchValue({
      // Section 1: Contract Information
      contractNo: 'FCS-2024-001234',
      type: 'Standard Funeral Service',
      contractDate: today,
      price: 45000.00,
      discount: 5000.00,
      dueDate: dueDate,
      checkedBy: 'Admin User',
      financialAssitance: 'DSWD',

      // Section 2: Deceased Information
      firstName: 'Juan',
      middleName: 'Dela',
      lastName: 'Cruz',
      dateOfBirth: dateOfBirth,
      gender: 'Male',
      civilStatus: 'Married',
      dateOfDeath: dateOfDeath,
      timeOfDeath: '14:30',
      placeOfDeath: 'St. Luke\'s Medical Center, Quezon City',
      placeOfBirth: 'Manila',
      religion: 'Roman Catholic',
      addressLine1: '#123 Sampaguita St., Barangay San Isidro, Quezon City 1113',
      parentFather: 'Jose Dela Cruz',
      parentMother: 'Maria Santos Cruz',
      nameOfInformant: 'Maria Dela Cruz (Daughter)',

      // Section 3: Contractee Information
      contractee: 'Maria Dela Cruz',
      contracteeAge: 45,
      contracteeGender: 'Female',
      contracteeCivilStatus: 'Married',
      contactNo: '+63 917 123 4567',
      baranggay: 'San Isidro',
      district: 'District 2',
      municipality: 'Quezon City',
      province: 'Metro Manila',
      plan: 'Premium Package',
      planNumber: 'PLAN-2024-001',

      // Section 4: Casket/Urn & Services
      casket: 'Mahogany Wood Casket',
      casketAvailable: 'Yes',
      uniform: 'Traditional Black Suit',
      urnType: 'Marble Cremation Urn',
      urnDescription: 'White marble with engraved name',

      // Section 5: Delivery
      deliverySerialNumber: 'DEL-2024-00567',
      deliveryHelper: 'John Helper',
      deliveryRemarks: 'Delivered to residence',
      deliveryStatus: 'Completed',

      // Section 6: Transfer & Burial/Cremation
      transferAddress: 'Holy Cross Memorial Park, Novaliches, Quezon City',
      transferTime: '09:00',
      dateReceived: '2024-03-11',
      dateOfBurial: '2024-03-12',
      takeOff: '08:00',
      massTime: '10:00',
      burialDriver: 'Robert Santos',
      burialHelper: 'Peter Lopez',
      familyCar: 'Ford Fiesta',
      familyCarDriver: 'Antonio Dela Cruz',
      flowerCar: 'Service Vehicle',
      flowerCarDriver: 'Miguel Garcia',
      carRental: 'Yes - 2 units rented',
      carRentalDriver: 'Rental Agency',
      cremationTime: '09:30',
      cremationOperator: 'Crematory Technician',
      burialBenefit: 'Included',
      setupCrew: '5 staff members',
      pallBearrer: '6 pallbearers assigned',
      funeralDirector: 'Fr. Ramon Reyes',

      // Section 7: Embalming & Makeup
      dateEmblamed: '2024-03-10',
      timeFinished: '16:00',
      makeupDressUp: 'Professional makeup and grooming',
      makeUprequest: 'Delivered according to family wishes',
      bodySpecialInstruction: 'Extra care for facial features',
      nails: 'Manicure applied',
      lips: 'Lipstick and color applied',
      emblamers: 'Expert Embalmer Team',
      finishedBy: 'Master Embalmer',
      embalmedBy: 'Certified Professional',

      // Section 8: Medical
      autopsy: 'Not required',
      autopsyDate: '',
      autopsyBy: '',

      // Section 9: Identification Documents
      idType: 'National ID',
      claimIdNumber: '1234567890-1',
      seniorId: 'N/A',
      issuedAt: 'PSA, Quezon City',
      issuedOn: '2015-03-15',

      // Section 10: Government/Signatures/Remarks
      baranggayIndigent: 'No',
      baranggayCaptain: 'Barangay Captain Ben Santos',
      cityDocsCompletion: true,
      supSigBurial: 'Yes',
      omSigDelivery: 'Yes',
      omSigBurial: 'Yes',
      chapelRental: '₱15,000',
      familyWillConvo: true,
      cleared: true,
      collectorRemarks: false,
      remarks: 'Family requested afternoon service. All arrangements completed per agreement.',
      billingRemarks: 'Payment to be collected from DSWD assistance',

      // Section 11: Administrative/Timestamps
      startOfTransaction: today,
      dateSubmitted: today,
      timeEncoded: new Date().toISOString().split('T')[0],
      dateAshReleased: '2024-03-14',
      releasedBy: 'Admin User',
      receivedBy: 'Maria Dela Cruz'
    });
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
      const invalidFields = this.getInvalidFields();
      const displayNames = invalidFields.map(field => this.getDisplayName(field));
      this.messageService.add({
        severity: 'error',
        summary: 'Form Validation Error',
        detail: `Please complete the following required information: ${displayNames.join(', ')}.`,
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

  submitContract(): void {
    if (!this.form.valid) {
      const invalidFields = this.getInvalidFields();
      const requiredFields = invalidFields.map(field => this.getDisplayName(field));
      
      // Create formatted validation message
      const fieldsList = requiredFields.length > 0 
        ? `<div style="text-align: left; margin-top: 10px;">
             <strong>Required Fields (Money in 2 decimals):</strong>
             <ul style="margin: 10px 0; padding-left: 20px;">
               ${requiredFields.map(field => `<li>${field}</li>`).join('')}
             </ul>
           </div>`
        : '';

      this.messageService.add({
        severity: 'error',
        summary: `Validation Error - ${requiredFields.length} field(s) missing`,
        detail: `Please complete the following required fields:${fieldsList}`,
        sticky: true,
        life: 8000
      });
      return;
    }

    const formValue = this.form.value;

    // Map form values directly to FuneralService model (field names already match)
    const funeralService = {
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

    console.log('[FuneralContractEntry] Submitting funeral contract:', funeralService);

    // Show loading message
    this.messageService.add({
      severity: 'info',
      summary: 'Processing',
      detail: 'Saving contract to database...',
      life: 3000
    });

    this.funeralServiceService.save(funeralService).subscribe({
      next: (response: any) => {
        console.log('[FuneralContractEntry] Contract saved successfully:', response);
        
        // Generate contract ID from response if available
        if (response && response.id) {
          this.contractId = response.id.toString();
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Contract Saved Successfully',
          detail: `Funeral contract for ${funeralService.firstName} ${funeralService.lastName} has been saved. Contract ID: ${this.contractId || 'pending'}`,
          life: 4000
        });
        
        // Reset form and navigate back after delay
        this.form.reset();
        setTimeout(() => this.goBack(), 2000);
      },
      error: (err: any) => {
        console.error('[FuneralContractEntry] Failed to save contract:', err);
        
        const errorMsg = err?.error?.message || err?.message || 'Unknown error occurred';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to Save Contract',
          detail: `Error: ${errorMsg}. Please try again or contact support.`,
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

    const displayName = this.getDisplayName(fieldName);

    if (field.hasError('required')) {
      return `${displayName} is required`;
    }
    if (field.hasError('email')) {
      return `Please enter a valid email address`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `${displayName} must be at least ${minLength} characters`;
    }
    if (field.hasError('min')) {
      const min = field.getError('min').min;
      return `${displayName} must be at least ${min}`;
    }
    if (field.hasError('max')) {
      const max = field.getError('max').max;
      return `${displayName} cannot exceed ${max}`;
    }
    if (field.hasError('pattern')) {
      return `${displayName} format is invalid`;
    }

    return '';
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
