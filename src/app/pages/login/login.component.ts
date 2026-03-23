import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';

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

  const { username, password } = this.form.value;

  this.auth.login(username, password).subscribe({
    next: () => {
      const user = this.auth.currentUser;

      if (!user) {
        this.errorMessage = 'Login failed';
        return;
      }

      let redirectPath = '/login';

      if (user.role === 'Admin') {
        redirectPath = '/admin/dashboard';
      } else if (user.role === 'Biller') {
        redirectPath = '/billing/deceased';
      }

      this.router.navigate([redirectPath]);
    },
    error: (err) => {
      console.error(err);
      this.errorMessage = err.message || 'Invalid username or password';
    }
  });
}

}
