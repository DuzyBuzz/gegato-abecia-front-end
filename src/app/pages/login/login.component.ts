import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  errorMessage = '';
  form: FormGroup;
  mockUsers: MockUser[] = [];
  showMockUsers = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit() {
    // Load available mock users
    this.mockUsers = this.auth.getMockUsers();
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
    console.log('--- LOGIN SUBMIT START ---');

    if (this.form.invalid) {
      console.warn('Form is INVALID', this.form.value);
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.value;

    console.log('Submitting login with:');
    console.log('username:', username);
    console.log('password length:', password?.length);

    this.auth.login(username, password).subscribe({
      next: (user) => {
        console.log('LOGIN SUCCESS');
        console.log('RAW USER RESPONSE:', user);

        if (!user) {
          console.error('User response is NULL or UNDEFINED');
          this.errorMessage = 'Login failed: empty response';
          return;
        }

        console.log('user.role:', user.role);
        console.log('typeof user.role:', typeof user.role);

        // Navigate to dashboard for any authenticated user
        console.log('User authenticated → redirecting to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);

        console.log('--- LOGIN SUBMIT END ---');
      },
      error: (err) => {
        console.error('LOGIN ERROR');
        console.error('Error object:', err);
        this.errorMessage = 'Invalid username or password';
      }
    });
  }

}
