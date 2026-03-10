import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { FuneralService } from '../models/funeral-service.model'

@Injectable({
  providedIn: 'root'
})
export class FuneralServiceService {

  private api = 'https://gegato-abecia-fh.appspot.com/funeralservice'

  constructor(private http: HttpClient) {}

  getFuneralServices(page:number, size:number): Observable<FuneralService[]> {
    return this.http.get<FuneralService[]>(`${this.api}/find/${page}/${size}`)
  }

  getFuneralService(id:number): Observable<FuneralService> {
    return this.http.get<FuneralService>(`${this.api}/find_record/${id}`)
  }

  save(service:FuneralService) {
    return this.http.post(`${this.api}/save`, service)
  }

  delete(id:number) {
    return this.http.delete(`${this.api}/delete/${id}`)
  }
}