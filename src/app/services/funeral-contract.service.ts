import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { FuneralContract } from '../models/funeral-contract.model'
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class FuneralContractService {

  private api = `${environment.api}/funeralservice`;

  constructor(private http: HttpClient) {}

  getFuneralServices(page: number, size: number): Observable<FuneralContract[]> {
    return this.http.get<FuneralContract[]>(`${this.api}/find/${page}/${size}`);
  }

  getFuneralService(id: number): Observable<FuneralContract> {
    return this.http.get<FuneralContract>(`${this.api}/find_record/${id}`);
  }

  searchFuneralServices(filter: string): Observable<FuneralContract[]> {
    return this.http.get<FuneralContract[]>(`${this.api}/find_record/${filter}`);
  }

  save(service: FuneralContract) {
    return this.http.post(`${this.api}/save`, service);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}