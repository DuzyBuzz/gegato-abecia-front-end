import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { PrintHeader } from '../print-header/print-header';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-cremation-certificate',
  imports: [PrintHeader, CommonModule],
  templateUrl: './cremation-certificate.html',
  styleUrl: '../print-header/print-header.scss',
})
export class CremationCertificate implements AfterViewInit, OnDestroy{

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

  constructor(private location: Location) {}

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
    print(): void {
    window.print();
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
