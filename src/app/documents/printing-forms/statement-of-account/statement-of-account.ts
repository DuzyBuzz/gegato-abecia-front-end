import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { PrintHeader } from '../print-header/print-header';
import { CommonModule, Location } from '@angular/common';

interface StatementItem {
  description: string;
  amount?: number;
  discount?: number;
  payment?: number;
  paymentDate?: string;
}

@Component({
  selector: 'app-statement-of-account',
  standalone: true,
  imports: [PrintHeader, CommonModule],
  templateUrl: './statement-of-account.html',
  styleUrl: '../print-header/print-header.scss',
})
export class StatementOfAccount implements AfterViewInit, OnDestroy {

  /* ================= HEADER ================= */

  header = {
    dateAsOf: '02-Jan-26',
    billedTo: 'ALDY MAY CALIXTRO',
    address: 'BACOLOD CITY',
    deceased: 'NONITO MONTAÑO MAKILAN',
    contractNo: '11-013913-25'
  };

  /* ================= ITEMS ================= */

  items: StatementItem[] = [
    { description: 'JR HALF GLASS (METAL)', amount: 45000 },
    { description: 'ADD: CRATE TO BACOLOD', amount: 3500 },
    { description: 'SERVICES:' },
    { description: 'RETRIEVAL' },
    { description: 'EMBALMING' },
    { description: 'PERPETUAL CARE AND HANDLING' },
    { description: 'HOME DECOR SET UP (WAKE AREA)' },
    { description: 'TRANSPORTATION TO RORO DUMANGAS' },
    { description: 'WOODEN CRATE' },
    { description: '*CASH FULL PAYMENT', payment: 40000, paymentDate: '12/23/2025' },
    { description: '*BANK TRANSFER TO GREG ABECIA UNIONBANK', payment: 8500, paymentDate: '12/23/2025' },
    { description: 'Bank Transfer by Aldy May Luping Calixtro' }
  ];



  constructor(
    private location: Location

  ) {
   }




  /* ================= TOTALS ================= */

  get totalAmount(): number {
    return this.items.reduce((sum, i) => sum + (i.amount || 0), 0);
  }

  get totalPayments(): number {
    return this.items.reduce((sum, i) => sum + (i.payment || 0), 0);
  }

  get balanceDue(): number {
    return this.totalAmount - this.totalPayments;
  }

  /* ================= CONTRACT INFO ================= */

  contract = {
    time: '11:08:13 AM',
    date: '1/2/2026',

    casket: 'SR FLEXI METAL',
    casketDescription: 'ALL WHITE / ROSE HANDLE',
    price: 'PHP 150,000.00',

    deceasedName: 'HELEN D. DORIN',
    dob: '02-Sep-40',
    dod: '29-Dec-25',
    age: '85',

    authorizer: 'ALAIN DORIN',
    address: '44N AMES SUBD., MANDURRIAO, ILOILO CITY',
    placeOfDeath: '44N AMES SUBD., MANDURRIAO, ILOILO CITY',

    wake: 'CHAPEL - E',
    church: 'CARMELITE SISTERS CHURCH JARO',
    burialDate: 'Wednesday, January 07, 2026',
    cemetery: 'FOREST LAKE MEMORIAL PARK',

    officer: 'Rizalina P. Panes',

    contractee: 'ALAIN DORIN',
    relationship: 'SON',
    contactNo: '0961-424-6939',
    deliveryDate: 'Friday, January 02, 2026',
    contractNo: '12-013950-25',
    cremationDate: 'January 10, 2026',
  };

  /* ================= AUTO PRINT ================= */
ngAfterViewInit(): void {
    // Register handler BEFORE printing
    window.onafterprint = () => {
      this.goBack();
    };

    // Delay ensures layout + fonts are ready
    setTimeout(() => {
      window.print();
    }, 300);
  }

  /* ================= CLEANUP ================= */

  ngOnDestroy(): void {
    // Prevent memory leaks
    window.onafterprint = null;
  }

  /* ================= NAVIGATION ================= */

  private goBack(): void {
    // Uses browser history (best UX)
    this.location.back();
  }
}