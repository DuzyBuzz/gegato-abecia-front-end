import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { FuneralService } from '../models/funeral-service.model'
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class FuneralServiceService {

  private api = `${environment.api}/funeralservice`

  constructor(private http: HttpClient) {}

  getFuneralServices(page:number, size:number): Observable<FuneralService[]> {
    return this.http.get<FuneralService[]>(`${this.api}/find/${page}/${size}`)
  }

  getFuneralService(id:number): Observable<FuneralService> {
    return this.http.get<FuneralService>(`${this.api}/find_record/${id}`)
  }

  searchFuneralServices(filter:string): Observable<FuneralService[]> {
    return this.http.get<FuneralService[]>(`${this.api}/find_record/${filter}`)
  }

  //upsert method if there is an id, it will update the record, if there is no id, it will create a new record
  save(service:FuneralService) {
    return this.http.post(`${this.api}/save`, service)
  }

  delete(id:number) {
    return this.http.delete(`${this.api}/delete/${id}`)
  }
}