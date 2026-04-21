import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { finalize, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface MockUser {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    FloatLabelModule,
    ProgressSpinnerModule 
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  errorMessage = '';
  form: FormGroup;
  mockUsers: MockUser[] = [];
  showMockUsers = true;
  private mockDataGenerated = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit() {
    // Load available mock users
    
  }

  /**
   * Quick login with mock user credentials
   */
  quickLogin(username: string, password: string = 'password123') {
    console.log('[LoginComponent] Quick login:', username);
    this.form.patchValue({ username, password });
    // Use setTimeout to ensure form is updated before submit
    setTimeout(() => this.submit(), 0);
  }

submit() {
  if (this.loading) {
    return;
  }

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.setLoading(true);
  this.setErrorMessage('');

  const { username, password } = this.form.value;

  this.auth.login(username, password).pipe(
    take(1),
    finalize(() => {
      this.setLoading(false);
    })
  ).subscribe({
    next: (user) => {
      let redirectPath: string | null = null;

      if (user.role === 'Admin') {
        redirectPath = '/admin/dashboard';
      } else if (user.role === 'Biller') {
        redirectPath = '/billing/deceased';
      }

      if (!redirectPath) {
        this.auth.logout();
        this.setErrorMessage('This account does not have access to the application.');
        return;
      }

      void this.router.navigate([redirectPath]).catch((error) => {
        console.error('[LoginComponent] Navigation error:', error);
        this.setErrorMessage('Login succeeded, but redirect failed. Please try again.');
      });
    },
    error: (err: any) => {
      console.error('[LoginComponent] Login error:', err);
      
      // Provide clear error message based on error type
      if (err.message === 'Invalid password') {
        this.setErrorMessage('Invalid username or password');
      } else if (err.message === 'User not found') {
        this.setErrorMessage('Invalid username or password');
      } else if (err.name === 'TimeoutError') {
        this.setErrorMessage('Login request timed out. Please try again.');
      } else {
        this.setErrorMessage(err.message || 'Login failed. Please try again.');
      }
    }
  });
}

  private setLoading(value: boolean): void {
    this.runInAngular(() => {
      this.loading = value;
    });
  }

  private setErrorMessage(message: string): void {
    this.runInAngular(() => {
      this.errorMessage = message;
    });
  }

  private runInAngular(update: () => void): void {
    this.ngZone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }

}
