import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {

  errorMessage = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(5)]],
    });
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
      console.log('LOGIN API SUCCESS');
      console.log('RAW USER RESPONSE:', user);

      if (!user) {
        console.error('User response is NULL or UNDEFINED');
        this.errorMessage = 'Login failed: empty response';
        return;
      }

      console.log('user.role:', user.role);
      console.log('typeof user.role:', typeof user.role);

      const role = (user.role || '').toUpperCase();
      console.log('NORMALIZED ROLE:', role);

      if (role === 'ADMIN') {
        console.log('ROLE OK → redirecting to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);
      } else {
        console.warn('ROLE NOT AUTHORIZED:', role);
        this.errorMessage = 'Unauthorized role';
        this.auth.logout();
      }

      console.log('--- LOGIN SUBMIT END ---');
    },
    error: (err) => {
      console.error('LOGIN API ERROR');
      console.error('Error object:', err);
      this.errorMessage = 'Invalid username or password';
    }
  });
}

}
