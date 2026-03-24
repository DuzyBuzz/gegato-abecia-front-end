import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FuneralContract } from '../models/funeral-contract.model';
import { environment } from '../../environments/environment';
import {
  mapFuneralContract,
  mapFuneralContractToApi
} from '../mappers/funeral-contract.mapper';

@Injectable({
  providedIn: 'root'
})
export class FuneralContractService {

  private api = `${environment.api}/funeralservice`;

  constructor(private http: HttpClient) {}

  // ======================================================
  // ✅ GET LIST (paginated)
  // ======================================================
  getFuneralServices(page: number, size: number): Observable<FuneralContract[]> {
    return this.http
      .get<any[]>(`${this.api}/find/${page}/${size}`)
      .pipe(
        map(res => res.map(mapFuneralContract))
      );
  }

  // ======================================================
  // ✅ GET SINGLE
  // ======================================================
  getFuneralService(id: number): Observable<FuneralContract> {
    return this.http
      .get<any>(`${this.api}/find_record/${id}`)
      .pipe(
        map(response => {
          console.log('🔄 SERVICE: getFuneralService raw response:', response);
          
          // 🔥 API returns array, extract first element
          const data = Array.isArray(response) ? response[0] : response;
          
          if (!data) {
            console.error('❌ No data in response');
            throw new Error('No data in API response');
          }
          
          console.log('✅ SERVICE: Extracted data before mapping:', data);
          
          // Now map the extracted data
          const mapped = mapFuneralContract(data);
          
          console.log('✅ SERVICE: Data mapped successfully');
          return mapped;
        })
      );
  }

  // ======================================================
  // ⚠️ SEARCH (same endpoint as get by id — backend issue)
  // ======================================================
  searchFuneralServices(filter: string): Observable<FuneralContract[]> {
    return this.http
      .get<any[]>(`${this.api}/find_record/${filter}`)
      .pipe(
        map(res => res.map(mapFuneralContract))
      );
  }

  // ======================================================
  // ✅ SAVE (CREATE / UPDATE)
  // ======================================================
  save(contract: FuneralContract): Observable<FuneralContract> {
    const payload = mapFuneralContractToApi(contract);

    console.log('📤 PAYLOAD TO API:', payload); // keep this for debugging

    return this.http
      .post<any>(`${this.api}/save`, payload)
      .pipe(
        map(mapFuneralContract)
      );
  }

  // ======================================================
  // ✅ DELETE
  // ======================================================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }
}