import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  
  @Output() closeModal = new EventEmitter<void>();

  form: FormGroup;
  profileForm: FormGroup;
  loading = false;
  editingProfile = false;
  currentUser: any = null;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private api = `${environment.api}/ua_control`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    if (!this.currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not logged in'
      });
    } else {
      this.profileForm.patchValue({
        username: this.currentUser.username,
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName
      });
    }
  }

  // Validate passwords match
  get passwordsMismatch(): boolean {
    const newPassword = this.form.get('newPassword')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    const isTouched = this.form.get('confirmPassword')?.touched;
    return newPassword !== confirmPassword && !!isTouched;
  }

  changePassword(): void {
    if (this.form.invalid || this.passwordsMismatch) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please check all fields and ensure passwords match'
      });
      return;
    }

    this.loading = true;

    const currentPassword = this.form.get('currentPassword')?.value;
    const newPassword = this.form.get('newPassword')?.value;

    // First, verify current password is correct
    this.http.get<any>(`${this.api}/find_record/${this.currentUser.username}`).subscribe({
      next: (user) => {
        // Verify current password matches
        if (user.password !== currentPassword) {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Current password is incorrect'
          });
          return;
        }

        // Password is correct, proceed to update
        this.updatePassword(user, newPassword);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to verify current password'
        });
      }
    });
  }

  private updatePassword(user: any, newPassword: string): void {
    // Create payload with updated password
    const payload = {
      ...user,
      password: newPassword,
      // Ensure all required fields are included for upsert
      id: user.id,
      accountNumber: user.accountNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      companyRole: user.companyRole
    };

    this.http.post(`${this.api}/save`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password changed successfully'
        });
        this.form.reset();
        // Close modal after 1.5 seconds
        setTimeout(() => {
          this.closeModal.emit();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error('Password change error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to change password. Please try again.'
        });
      }
    });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showPassword = !this.showPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  toggleEditProfile(): void {
    this.editingProfile = !this.editingProfile;
    if (!this.editingProfile) {
      this.profileForm.reset({
        username: this.currentUser.username,
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please check all fields'
      });
      return;
    }

    this.loading = true;

    const payload = {
      id: this.currentUser.id,
      accountNumber: this.currentUser.accountNumber,
      username: this.profileForm.get('username')?.value,
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      companyRole: this.currentUser.companyRole,
      password: this.currentUser.password
    };

    this.http.post(`${this.api}/save`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully'
        });
        // Update current user
        this.currentUser = { ...this.currentUser, ...this.profileForm.value };
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        this.editingProfile = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Profile update error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update profile. Please try again.'
        });
      }
    });
  }
}
