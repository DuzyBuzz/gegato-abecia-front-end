import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {

  errorMessage = '';
  form!: FormGroup; // <-- declare only, no initialization here

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    // ✅ SAFE: fb is initialized here
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(5)]],
      rememberMe: [false]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.value;

    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => this.errorMessage = 'Invalid username or password'
    });
  }

  get username() {
    return this.form.get('username');
  }

  get password() {
    return this.form.get('password');
  }
}
