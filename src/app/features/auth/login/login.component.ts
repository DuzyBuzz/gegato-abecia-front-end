import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = 'owner@gegato.test';
  password = 'demo123';
  error = '';
  loading = false;

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  async submit(): Promise<void> {
    this.loading = true;
    this.error = '';

    const user = await this.auth.signIn(this.email, this.password);
    if (!user) {
      this.error = 'Invalid credentials. Try owner@gegato.test / demo123.';
      this.loading = false;
      return;
    }

    this.router.navigateByUrl('/dashboard');
    this.loading = false;
  }
}
