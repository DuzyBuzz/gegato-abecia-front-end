import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MockDataGeneratorService } from '../../services/mock-data-generator.service';
import { Router } from '@angular/router';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
showPassword = false;

  errorMessage = '';
  form: FormGroup;
  mockUsers: MockUser[] = [];
  showMockUsers = true;
  private mockDataGenerated = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private mockDataGenerator: MockDataGeneratorService
  ) {
    
    this.form = this.fb.group({
      username: ['test_user', Validators.required],
      password: ['password', [Validators.required, Validators.minLength(1)]],
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

        // Generate fake data on first successful login if not already generated
        if (!this.mockDataGenerated && !this.mockDataGenerator.hasMockData()) {
          console.log('🚀 Generating 1000+ mock records...');
          this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);
          this.mockDataGenerated = true;
        }

        // Navigate based on user role
        let redirectPath = '/login';
        
        if (user.role === 'Admin') {
          redirectPath = '/admin/dashboard';
          console.log('Admin user → redirecting to /admin/dashboard');
        } else if (user.role === 'Biller') {
          redirectPath = '/billing/deceased';
          console.log('Biller user → redirecting to /billing/deceased');
        } else {
          console.warn('Unknown role:', user.role, '→ redirecting to login');
        }

        this.router.navigate([redirectPath]);

        console.log('--- LOGIN SUBMIT END ---');
      },
      error: (err) => {
        console.error('LOGIN ERROR');
        console.error('Error object:', err);
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
  
  /**
   * Manually trigger mock data generation
   */
  GenerateMockData() {
    console.log('Manually triggering mock data generation...');
    
    if (this.mockDataGenerator.hasMockData()) {
      console.log('⚠️ Mock data already exists. Clearing and regenerating...');
      this.mockDataGenerator.clearAllMockData();
    }
    
    console.log('🚀 Generating 1000+ mock records...');
    this.mockDataGenerator.generateAndStoreMockData(1000, 1000, 1000);
    console.log('✅ Mock data generation complete!');
  }

}
