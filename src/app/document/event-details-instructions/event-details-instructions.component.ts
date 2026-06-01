import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralContract } from '../../models/funeral-contract.model';
import { getRoleLabel } from '../../utils/role-access.util';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';
import { PrintHeader } from '../print-header/print-header';

interface DetailRow {
  label: string;
  value: string;
}

interface DetailSection {
  title: string;
  rows: DetailRow[];
}

interface InstructionRow {
  label: string;
  text: string;
}

interface DisplayUser {
  name: string;
  role: string;
}

@Component({
  selector: 'app-event-details-instructions',
  standalone: true,
  imports: [CommonModule, PrintHeader],
  templateUrl: './event-details-instructions.component.html',
  styleUrls: ['../print-header/print-header.scss', './event-details-instructions.component.scss'],
})
export class EventDetailsInstructionsComponent implements OnInit, OnDestroy {
  private readonly originalDocumentTitle = document.title;

  contractId: number | null = null;
  isReady = false;
  selectedContract: FuneralContract | null = null;
  detailSections: DetailSection[] = [];
  instructionRows: InstructionRow[] = [];
  printedAt = new Date();

  currentUser: DisplayUser = {
    name: 'Officer in Charge',
    role: 'Biller',
  };

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private contractService: FuneralContractService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const authUser = this.auth.currentUser;
    if (authUser) {
      const firstName = authUser.firstName || '';
      const lastName = authUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      this.currentUser = {
        name: fullName || authUser.username || 'Officer in Charge',
        role: getRoleLabel(authUser.roleAccess),
      };
    }

    this.route.paramMap.subscribe((params) => {
      const param = params.get('contractId');

      if (!param) {
        this.setFallbackData();
        return;
      }

      const id = Number(param);
      if (Number.isNaN(id)) {
        this.setFallbackData();
        return;
      }

      this.contractId = id;
      this.loadContractData(id);
    });
  }

  private loadContractData(id: number): void {
    this.contractService.getFuneralService(id).subscribe({
      next: (contract) => {
        this.selectedContract = contract;
        this.mapContractToDisplay(contract);
        this.isReady = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.printDocument(true);
        }, 500);
      },
      error: () => {
        this.setFallbackData();
      },
    });
  }

  private mapContractToDisplay(contract: FuneralContract): void {
    const deceasedName = this.formatFullName(contract.firstName, contract.middleName, contract.lastName);
    const ageAtDeath = deceasedAgeAtDeath(contract.dateOfBirth, contract.dateOfDeath);

    const sections: DetailSection[] = [];
    const contracteeAddress = this.joinValues([
      contract.baranggay,
      contract.district,
      contract.municipality,
      contract.province,
    ]);

    this.pushSection(sections, 'Deceased Information', [
      this.row('Name', deceasedName),
      this.row('Date of Birth', this.formatDate(contract.dateOfBirth)),
      this.row('Date of Death', this.formatDate(contract.dateOfDeath)),
      this.row('Time of Death', contract.timeOfDeath),
      this.row('Age at Death', ageAtDeath !== null ? String(ageAtDeath) : 'N/A'),
      this.row('Gender', contract.gender),
      this.row('Civil Status', contract.civilStatus),
      this.row('Religion', contract.religion),
      this.row('Place of Birth', contract.placeOfBirth),
      this.row('Place of Death', contract.placeOfDeath),
      this.row('Address', contract.addressLine1),
      this.row('Father', contract.parentFather),
      this.row('Mother', contract.parentMother),
    ]);

    this.pushSection(sections, 'Contractee & Informant', [
      this.row('Contractee', contract.contractee),
      this.row('Relationship', contract.relationshipToDeceased),
      this.row('Contractee Age', contract.contracteeAge),
      this.row('Contractee Gender', contract.contracteeGender),
      this.row('Contractee Civil Status', contract.contracteeCivilStatus),
      this.row('Contact No', contract.contactNo),
      this.row('Informant', contract.nameOfInformant),
      this.row('Address', contracteeAddress),
    ]);

    this.pushSection(sections, 'Service & Logistics', [
      this.row('Transfer Date', this.formatDate(contract.dateOfTransfer)),
      this.row('Transfer Time', contract.transferTime),
      this.row('Transfer Address', contract.transferAddress),
      this.row('Date Received', this.formatDate(contract.dateReceived)),
      this.row('Delivery Date', this.formatDate(contract.deliveryDate)),
      this.row('Delivery Status', contract.deliveryStatus),
      this.row('Delivery Driver', contract.deliveryDriver),
      this.row('Delivery Helper', contract.deliveryHelper),
      this.row('Burial Date', this.formatDate(contract.dateOfBurial)),
      this.row('Cremation Date', this.formatDate(contract.cremationDate)),
      this.row('Cremation Time', contract.cremationTime),
      this.row('Cremation Operator', contract.cremationOperator),
      this.row('Take Off', contract.takeOff),
      this.row('Mass Time', contract.massTime),
      this.row('Church', contract.church),
      this.row('Cemetery', contract.cementary),
      this.row('Funeral Director', contract.funeralDirector),
      this.row('Burial Driver', contract.burialDriver),
      this.row('Burial Helper', contract.burialHelper),
      this.row('Family Car', contract.familyCar),
      this.row('Family Car Driver', contract.familyCarDriver),
      this.row('Flower Car', contract.flowerCar),
      this.row('Flower Car Driver', contract.flowerCarDriver),
      this.row('Car Rental', contract.carRental),
      this.row('Car Rental Driver', contract.carRentalDriver),
      this.row('Setup Crew', contract.setupCrew),
      this.row('Pall Bearer', contract.pallBearrer),
    ]);

    this.pushSection(sections, 'Preparation & Other Details', [
      this.row('Casket', contract.casket),
      this.row('Casket Available', contract.casketAvailable),
      this.row('Uniform', contract.uniform),
      this.row('Urn Type', contract.urnType),
      this.row('Urn Description', contract.urnDescription),
      this.row('Date Embalmed', this.formatDate(contract.dateEmblamed)),
      this.row('Time Finished', contract.timeFinished),
      this.row('Makeup / Dress Up', contract.makeupDressUp),
      this.row('Makeup Request', contract.makeUprequest),
      this.row('Nails', contract.nails),
      this.row('Lips', contract.lips),
      this.row('Embalmed By', contract.embalmedBy),
      this.row('Embalmers', contract.embalmers),
      this.row('Finished By', contract.finishedBy),
      this.row('Autopsy', contract.autopsy),
      this.row('Autopsy Date', this.formatDate(contract.autopsyDate)),
      this.row('Autopsy By', contract.autopsyBy),
      this.row('ID Type', contract.idType),
      this.row('Claim ID Number', contract.claimIdNumber),
      this.row('Senior ID', contract.seniorId),
      this.row('Issued At', contract.issuedAt),
      this.row('Issued On', this.formatDate(contract.issuedOn)),
      this.row('Barangay Indigent', contract.baranggayIndigent),
      this.row('Barangay Captain', contract.baranggayCaptain),
      this.row('City Docs Completed', this.asYesNo(contract.cityDocsCompletion)),
      this.row('Chapel Rental', contract.chapelRental),
      this.row('Burial Benefit', contract.burialBenefit),
      this.row('Date Ash Released', this.formatDate(contract.dateAshReleased)),
      this.row('Released By', contract.releasedBy),
      this.row('Received By', contract.receivedBy),
      this.row('Family Will Convo', this.asYesNo(contract.familyWillConvo)),
      this.row('Cleared', this.asYesNo(contract.cleared)),
      this.row('Collector Remarks Flag', this.asYesNo(contract.collectorRemarks)),
    ]);

    this.detailSections = sections;

    const instructionSource: InstructionRow[] = [
      { label: 'Body Special Instruction', text: this.safeText(contract.bodySpecialInstruction) },
      { label: 'Delivery Remarks', text: this.safeText(contract.deliveryRemarks) },
      { label: 'Contract Remarks', text: this.safeText(contract.remarks) },
      { label: 'Billing Remarks', text: this.safeText(contract.billingRemarks) },
    ];

    this.instructionRows = instructionSource.filter((item) => item.text !== 'N/A');
    if (this.instructionRows.length === 0) {
      this.instructionRows = [{ label: 'Instructions', text: 'No instructions provided.' }];
    }
  }

  private setFallbackData(): void {
    this.detailSections = [
      {
        title: 'Contract Summary',
        rows: [
          { label: 'Contract Number', value: 'N/A' },
          { label: 'Event Details', value: 'No contract data available.' },
        ],
      },
    ];

    this.instructionRows = [{ label: 'Instructions', text: 'No instructions provided.' }];
    this.isReady = true;
  }

  private formatFullName(first?: string | null, middle?: string | null, last?: string | null): string {
    const parts = [first, middle, last].filter((part) => !!part && part.trim().length > 0);
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  }

  private joinValues(values: Array<string | null | undefined>, separator = ', '): string {
    const parts = values
      .map((value) => this.safe(value))
      .filter((value) => value !== 'N/A');

    return parts.length > 0 ? parts.join(separator) : 'N/A';
  }

  private asYesNo(value?: boolean | null): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return value ? 'Yes' : 'No';
  }

  private formatAmount(value?: number | null): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private row(label: string, value?: string | number | null): DetailRow | null {
    const normalized = this.safe(value);
    if (normalized === 'N/A') {
      return null;
    }

    return { label, value: normalized };
  }

  private pushSection(sections: DetailSection[], title: string, rows: Array<DetailRow | null>): void {
    const filteredRows = rows.filter((row): row is DetailRow => row !== null);
    if (filteredRows.length === 0) {
      return;
    }

    sections.push({ title, rows: filteredRows });
  }

  private safe(value?: string | number | null): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : 'N/A';
  }

  private safeText(value?: string | null): string {
    const normalized = this.safe(value);
    return normalized;
  }

  private formatDate(value?: string | null): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.safe(value);
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  ngOnDestroy(): void {
    document.title = this.originalDocumentTitle;
    window.onafterprint = null;
  }

  print(): void {
    this.printDocument();
  }

  private goBack(): void {
    this.location.back();
  }

  private printDocument(goBackAfterPrint = false): void {
    const previousTitle = document.title || this.originalDocumentTitle;
    document.title = '';

    window.onafterprint = () => {
      document.title = previousTitle;
      window.onafterprint = null;

      if (goBackAfterPrint) {
        this.goBack();
      }
    };

    window.print();
  }

}
