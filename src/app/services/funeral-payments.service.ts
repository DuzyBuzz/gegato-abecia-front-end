import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FuneralPayment } from '../models/funeral-payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FuneralPaymentsService {
  
  private api = `${environment.api}/payments`;

  constructor(private http: HttpClient) {}

  // Fetch payment by funeral service ID
  getFuneralPaymentByServiceId(serviceId: number): Observable<FuneralPayment> {
   
    return this.http.get<FuneralPayment>(`${this.api}/find_record_service/${serviceId}`);
  }

  // Fetch paginated list of payments
  getFuneralPayments(page: number, size: number): Observable<FuneralPayment[]> {
    return this.http.get<FuneralPayment[]>(`${this.api}/find/${page}/${size}`);
  }

  // Fetch payment by payment ID
  getPaymentById(id: number): Observable<FuneralPayment> {
    return this.http.get<FuneralPayment>(`${this.api}/find_record/${id}`);
  }

  // Search payments by name/filter
  searchPayments(filter: string): Observable<FuneralPayment[]> {
    return this.http.get<FuneralPayment[]>(`${this.api}/find_record/${filter}`);
  }

  // Search payments by date range
  searchPaymentsByDateRange(startDate: string, endDate: string): Observable<FuneralPayment[]> {
    return this.http.get<FuneralPayment[]>(`${this.api}/find_record_date/${startDate}/${endDate}`);
  }

  // Upsert method: if there is an id, it will update the record, if there is no id, it will create a new record
  save(payment: FuneralPayment): Observable<FuneralPayment> {
    return this.http.post<FuneralPayment>(`${this.api}/save`, payment);
  }

  // Delete payment by ID
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
