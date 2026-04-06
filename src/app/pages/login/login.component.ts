import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
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
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading = true; // START LOADING

  const { username, password } = this.form.value;

  this.auth.login(username, password).subscribe({
    next: () => {
      const user = this.auth.currentUser;

      if (!user) {
        this.errorMessage = 'Login failed';
        this.loading = false;
        return;
      }

      let redirectPath = '/login';

      if (user.role === 'Admin') {
        redirectPath = '/admin/dashboard';
      } else if (user.role === 'Biller') {
        redirectPath = '/billing/deceased';
      }

      this.router.navigate([redirectPath]);
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.errorMessage = err.message || 'Invalid username or password';
      this.loading = false; // STOP LOADING
    }
  });
}

}
