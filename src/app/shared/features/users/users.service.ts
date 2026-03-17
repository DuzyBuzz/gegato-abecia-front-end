// users.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { User } from './users.model';

@Injectable({ providedIn: 'root' })
export class UserService {

  private api = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}          

  /** READ */
  getUsers() {
    return this.http.get<any[]>(this.api).pipe(
      map(res =>
        res.map(u => ({
          userId: u.userId,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.userName, 
          role: u.role,
          position: u.position,
          createdAt: u.createdAt
        }) as User)
      )
    );
  }

  /** CREATE */
  create(user: User) {
    return this.http.post(this.api, {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.username, 
      password: user.password,
      position: user.position,
      role: user.role
    });
  }

  /** UPDATE */
  update(id: number, user: User) {
    return this.http.put(`${this.api}/${id}`, {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.username,
      password: user.password,
      position: user.position,
      role: user.role
    });
  }

  /** DELETE */
  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  /** SEARCH */
  search(searchTerm: string) {
    return this.http.get<any[]>(`${this.api}/search`, {
      params: { query: searchTerm }
    }).pipe(
      map(res =>
        res.map(u => ({
          userId: u.userId,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.userName,
          role: u.role,
          position: u.position,
          createdAt: u.createdAt
        }) as User)
      )
    );
  }
}
