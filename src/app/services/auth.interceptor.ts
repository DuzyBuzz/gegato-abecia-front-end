import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip token injection for external URLs
    if (!req.url.includes('localhost') && !req.url.includes('gegato-abecia')) {
      return next.handle(req);
    }

    // Get the current user from auth service
    const user = this.auth.currentUser;
    
    if (user) {
      // Clone the request and add auth headers
      const clonedReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${user.userId || ''}`,
          'X-User-ID': String(user.userId || ''),
          'X-User-Role': String(user.role || ''),
        }
      });
      return next.handle(clonedReq);
    }

    return next.handle(req);
  }
}
