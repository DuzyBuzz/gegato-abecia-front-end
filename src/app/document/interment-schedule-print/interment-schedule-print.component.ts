import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralContract } from '../../models/funeral-contract.model';

interface IntermentScheduleRow {
  burialDate: string;
  deceased: string;
  placeOfDeath: string;
  contracteeName: string;
  contactNumber: string;
  wakeLocation: string;
  church: string;
  cemetery: string;
  takeOffTime: string;
  massTime: string;
  vehicle: string;
  burialDriver: string;
  burialHelper: string;
  remarks: string;
}

@Component({
  selector: 'app-interment-schedule-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interment-schedule-print.component.html',
  styleUrl: './interment-schedule-print.component.scss',
})
export class IntermentSchedulePrintComponent implements OnInit, OnDestroy {
  private readonly originalDocumentTitle = document.title;

  isReady = false;
  startDate = '';
  endDate = '';
  returnTo = '/schedule';
  rows: IntermentScheduleRow[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private funeralContractService: FuneralContractService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const today = this.formatDate(new Date());
      this.startDate = params.get('startDate') || today;
      this.endDate = params.get('endDate') || this.startDate;
      this.returnTo = params.get('returnTo') || '/schedule';
      this.loadRows();
    });
  }

  ngOnDestroy(): void {
    document.title = this.originalDocumentTitle;
    window.onafterprint = null;
  }

  get rangeLabel(): string {
    return `${this.startDate} to ${this.endDate}`;
  }

  private loadRows(): void {
    this.isReady = false;
    this.funeralContractService.getBurialSchedule(this.startDate, this.endDate).subscribe({
      next: (contracts) => {
        this.rows = contracts
          .map((contract) => this.toRow(contract))
          .sort((a, b) => a.burialDate.localeCompare(b.burialDate) || a.deceased.localeCompare(b.deceased));
        this.finalizeAndPrint();
      },
      error: () => {
        this.rows = [];
        this.finalizeAndPrint();
      },
    });
  }

  private finalizeAndPrint(): void {
    this.isReady = true;
    this.cdr.markForCheck();
    setTimeout(() => this.printDocument(), 500);
  }

  private printDocument(): void {
    const previousTitle = document.title || this.originalDocumentTitle;
    document.title = '';

    window.onafterprint = () => {
      document.title = previousTitle;
      window.onafterprint = null;

      if (this.returnTo) {
        this.router.navigateByUrl(this.returnTo);
        return;
      }

      this.location.back();
    };

    window.print();
  }

  private toRow(contract: FuneralContract): IntermentScheduleRow {
    const placeOfDeath = this.firstFilled([contract.placeOfDeath]);

    return {
      burialDate: this.formatReadableDate(contract.dateOfBurial || contract.cremationDate),
      deceased: this.buildName(contract),
      placeOfDeath,
      contracteeName: this.firstFilled([contract.contractee]),
      contactNumber: this.firstFilled([contract.contactNo]),
      wakeLocation: this.firstFilled([contract.transferAddress]),
      church: this.firstFilled([contract.church]),
      cemetery: this.firstFilled([contract.cementary]),
      takeOffTime: this.firstFilled([contract.takeOff]),
      massTime: this.firstFilled([contract.massTime]),
      vehicle: this.firstFilled([contract.familyCar, contract.flowerCar, contract.carRental]),
      burialDriver: this.firstFilled([contract.burialDriver, contract.familyCarDriver, contract.flowerCarDriver, contract.carRentalDriver]),
      burialHelper: this.firstFilled([contract.burialHelper, contract.deliveryHelper]),
      remarks: this.firstFilled([contract.remarks, contract.billingRemarks]),
    };
  }

  private buildName(contract: FuneralContract): string {
    const parts = [contract.firstName, contract.middleName, contract.lastName]
      .filter((part): part is string => !!part && part.trim().length > 0);
    return parts.length > 0 ? parts.join(' ') : 'UNKNOWN';
  }

  private joinAddress(contract: FuneralContract): string {
    const parts = [contract.baranggay, contract.municipality, contract.province]
      .filter((part): part is string => !!part && part.trim().length > 0);
    return parts.join(', ');
  }

  private firstFilled(values: Array<string | null | undefined>): string {
    const found = values.find((value) => !!value && value.trim().length > 0);
    return found?.trim() || '-';
  }

  private formatReadableDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
