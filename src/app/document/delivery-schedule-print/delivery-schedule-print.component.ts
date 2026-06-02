import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralContract } from '../../models/funeral-contract.model';

interface DeliveryScheduleRow {
  date: string;
  deceased: string;
  contractNo: string;
  address: string;
  casketDescription: string;
  wakeLocation: string;
  time: string;
  remarks: string;
}

@Component({
  selector: 'app-delivery-schedule-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-schedule-print.component.html',
  styleUrl: './delivery-schedule-print.component.scss',
})
export class DeliverySchedulePrintComponent implements OnInit, OnDestroy {
  private readonly originalDocumentTitle = document.title;

  isReady = false;
  startDate = '';
  endDate = '';
  returnTo = '/schedule';
  nextReport = '';
  rows: DeliveryScheduleRow[] = [];

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
      this.nextReport = params.get('next') || '';
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
          .sort((a, b) => a.date.localeCompare(b.date) || a.deceased.localeCompare(b.deceased));
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

      if (this.nextReport === 'interment') {
        this.router.navigate(['/print/interment-schedule'], {
          queryParams: {
            startDate: this.startDate,
            endDate: this.endDate,
            returnTo: this.returnTo,
          },
        });
        return;
      }

      if (this.returnTo) {
        this.router.navigateByUrl(this.returnTo);
        return;
      }

      this.location.back();
    };

    window.print();
  }

  private toRow(contract: FuneralContract): DeliveryScheduleRow {
    const deliveryDate = this.formatReadableDate(contract.deliveryDate || contract.dateOfBurial);
    const deceasedName = this.buildName(contract);
    const address = this.firstFilled([
      contract.addressLine1,
      contract.transferAddress,
      this.joinAddress(contract),
    ]);
    const casketDescription = this.firstFilled([
      contract.casket,
      contract.urnType,
      contract.urnDescription,
      contract.type,
    ]);
    const wakeLocation = this.firstFilled([contract.transferAddress]);
    const time = this.firstFilled([
      contract.deliveryDate ? this.extractTime(contract.deliveryDate) : '',
      contract.transferTime,
      contract.takeOff,
      contract.massTime,
    ]);
    const remarks = this.firstFilled([
      contract.deliveryRemarks,
      contract.remarks,
      contract.billingRemarks,
    ]);

    return {
      date: deliveryDate,
      deceased: deceasedName,
      contractNo: contract.contractNo || '-',
      address,
      casketDescription,
      wakeLocation,
      time,
      remarks,
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

  private extractTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
