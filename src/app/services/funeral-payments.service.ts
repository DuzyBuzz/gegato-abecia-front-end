import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FuneralPayment } from '../models/funeral-payment.model';
import { mapFuneralPayment, mapFuneralPaymentToApi } from '../mappers/funeral-payment.mapper';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FuneralPaymentsService {
  private api = `${environment.api}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ Fetch payment by funeral service ID
   * Maps API response through mapper to UI format
   */
  getFuneralPaymentByServiceId(serviceId: number): Observable<FuneralPayment | FuneralPayment[]> {
    console.log('📡 FuneralPaymentsService: getFuneralPaymentByServiceId', { serviceId });
    return this.http
      .get<any>(`${this.api}/find_record_service/${serviceId}`)
      .pipe(
        map((response) => {
          // Handle both single object and array responses
          if (Array.isArray(response)) {
            return response.map((item) => mapFuneralPayment(item));
          }
          return mapFuneralPayment(response);
        })
      );
  }

  /**
   * ✅ Fetch paginated list of payments
   * Maps all API responses through mapper to UI format
   */
  getFuneralPayments(page: number, size: number): Observable<FuneralPayment[]> {
    console.log('📡 FuneralPaymentsService: getFuneralPayments', { page, size });
    return this.http
      .get<any[]>(`${this.api}/find/${page}/${size}`)
      .pipe(map((response) => response.map((item) => mapFuneralPayment(item))));
  }

  /**
   * ✅ Fetch payment by payment ID
   * Maps API response through mapper to UI format
   */
  getPaymentById(id: number): Observable<FuneralPayment> {
    console.log('📡 FuneralPaymentsService: getPaymentById', { id });
    return this.http
      .get<any>(`${this.api}/find_record/${id}`)
      .pipe(map((response) => mapFuneralPayment(response)));
  }

  /**
   * ✅ UPSERT: Create or update payment
   * Maps form data to API format, sends to backend, maps response back
   */
  save(payment: FuneralPayment): Observable<FuneralPayment> {
    console.log('💾 FuneralPaymentsService: save', {
      id: payment.id,
      isUpdate: !!payment.id,
      amount: payment.amount,
    });
    const apiPayload = mapFuneralPaymentToApi(payment);
    return this.http
      .post<any>(`${this.api}/save`, apiPayload)
      .pipe(map((response) => mapFuneralPayment(response)));
  }

  /**
   * ✅ Search payments by name/filter
   */
  searchPayments(filter: string): Observable<FuneralPayment[]> {
    console.log('🔍 FuneralPaymentsService: searchPayments', { filter });
    return this.http
      .get<any[]>(`${this.api}/find_record/${filter}`)
      .pipe(map((response) => response.map((item) => mapFuneralPayment(item))));
  }

  /**
   * ✅ Search payments by date range
   */
  searchPaymentsByDateRange(
    startDate: string,
    endDate: string
  ): Observable<FuneralPayment[]> {
    console.log('🔍 FuneralPaymentsService: searchPaymentsByDateRange', {
      startDate,
      endDate,
    });
    return this.http
      .get<any[]>(`${this.api}/find_record_date/${startDate}/${endDate}`)
      .pipe(map((response) => response.map((item) => mapFuneralPayment(item))));
  }

  /**
   * ✅ Delete payment by ID
   */
delete(id: number): Observable<any> {
  console.log('🗑️ FuneralPaymentsService: delete', { id });
  return this.http.post(`${this.api}/delete/${id}`, {});
}
}
