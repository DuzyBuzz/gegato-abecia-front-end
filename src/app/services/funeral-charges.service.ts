import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContractCharges } from '../models/contract-charges.model';
import {
  mapFuneralCharge,
  mapFuneralChargeToApi
} from '../mappers/funeral-charges.mapper';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FuneralChargesService {
  private api = `${environment.api}/funeralservice`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ Fetch charges by funeral service ID
   * Maps API response through mapper to UI format
   */
  getChargesByServiceId(serviceId: number): Observable<ContractCharges[]> {
    console.log('📡 FuneralChargesService: getChargesByServiceId', { serviceId });
    return this.http
      .get<any[]>(`${this.api}/find_charges/${serviceId}`)
      .pipe(
        map((response) => {
          // Handle both single object and array responses
          if (Array.isArray(response)) {
            return response.map((item) => mapFuneralCharge(item));
          }
          return [mapFuneralCharge(response)];
        })
      );
  }

  /**
   * ✅ Fetch charge by charge ID
   * Maps API response through mapper to UI format
   */
  getChargeById(id: number): Observable<ContractCharges> {
    console.log('📡 FuneralChargesService: getChargeById', { id });
    return this.http
      .get<any>(`${this.api}/find_record/${id}`)
      .pipe(map((response) => mapFuneralCharge(response)));
  }

  /**
   * ✅ UPSERT: Create or update charge
   * Maps form data to API format, sends to backend, maps response back
   */
  save(charge: ContractCharges): Observable<ContractCharges> {
    console.log('💾 FuneralChargesService: save', {
      id: charge.id,
      isUpdate: !!charge.id,
      description: charge.description,
    });
    const apiPayload = mapFuneralChargeToApi(charge);
    return this.http
      .post<any>(`${this.api}/save_charge`, apiPayload)
      .pipe(map((response) => mapFuneralCharge(response)));
  }

  /**
   * ✅ DELETE: Remove charge by ID
   */
  delete(id: number): Observable<void> {
    console.log('🗑️ FuneralChargesService: delete', { id });
    return this.http.post<void>(`${this.api}/delete_charge/${id}`, {});
  }
}
