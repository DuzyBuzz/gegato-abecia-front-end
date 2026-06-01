import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../services/auth.service';
import { User } from '../../shared/features/users/users.model';
import { UserService } from '../../shared/features/users/users.service';
import { RoleAccess, getRoleLabel, normalizeCompanyRole, resolveRoleAccess } from '../../utils/role-access.util';
import { TableHelperComponent } from '../../shared/components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../shared/components/table-helper/table-helper-column.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule, ToolbarModule, ButtonModule, DialogModule, TableHelperComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  providers: [MessageService]
})
export class UsersComponent implements OnInit {
  readonly roleOptions = [
    { label: 'Admin', value: 'SUPER_USER', roleAccess: RoleAccess.Admin, hint: 'Full access to contracts, payments, dashboard, and users' },
    { label: 'Biller', value: 'BILLER', roleAccess: RoleAccess.Biller, hint: 'Can encode funeral contracts and charges' },
    { label: 'Accounting', value: 'ACCOUNTING', roleAccess: RoleAccess.Accounting, hint: 'Can manage payment entries and collections' },
    { label: 'User', value: 'USER', hint: 'Limited access account' },
  ];

  loading = false;
  loadingUser = false;
  saving = false;
  searchTerm = '';
  users: User[] = [];
  selectedUser: User | null = null;
  createDialogVisible = false;

  userColumns: TableHelperColumn[] = [
    { field: 'accountNumber', header: 'Account Number', sortable: true, filterable: true, filterType: 'text', width: '12rem' },
    { field: 'firstName', header: 'First Name', sortable: true, filterable: true, filterType: 'text', width: '12rem' },
    { field: 'lastName', header: 'Last Name', sortable: true, filterable: true, filterType: 'text', width: '12rem' },
    { field: 'position', header: 'Position', sortable: true, filterable: true, filterType: 'text', width: '12rem' },
    { field: 'role', header: 'Role', sortable: true, filterable: true, filterType: 'text', width: '10rem' },
  ];

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private messageService: MessageService,
  ) {
    this.form = this.buildForm();
  }

  private buildForm() {
    return this.fb.group({
      accountNumber: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      position: [''],
      companyRole: ['USER', Validators.required],
      password: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.startCreate();
  }

  get filteredUsers(): User[] {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return this.users;
    }

    return this.users.filter((user) => {
      const haystack = [
        user.accountNumber,
        user.username,
        user.firstName,
        user.lastName,
        user.role,
        user.position,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(normalizedTerm);
    });
  }

  onUsersSearch(searchValue: string): void {
    this.searchTerm = searchValue || '';
  }

  onUserRowSelected(row: User): void {
    this.selectUser(row);
  }

  get isEditingExistingUser(): boolean {
    return !!this.selectedUser?.id;
  }

  get selectedRoleHint(): string {
    const selectedRole = this.form.get('companyRole')?.value || 'USER';
    return this.roleOptions.find((option) => option.value === selectedRole)?.hint || '';
  }

  get totalUserCount(): number {
    return this.users.length;
  }

  get adminUserCount(): number {
    return this.users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Admin).length;
  }

  get billerUserCount(): number {
    return this.users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Biller).length;
  }

  get accountingUserCount(): number {
    return this.users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Accounting).length;
  }

  get billingTeamCount(): number {
    return this.billerUserCount + this.accountingUserCount;
  }

  get staffedAccountsCount(): number {
    return this.users.filter((user) => String(user.position || '').trim().length > 0).length;
  }

  get selectedRoleLabel(): string {
    return this.mapRoleLabel(String(this.form.get('companyRole')?.value || 'USER'));
  }

  get selectedRoleAccess(): number | undefined {
    return this.mapRoleAccess(String(this.form.get('companyRole')?.value || 'USER'));
  }

  startCreate(): void {
    this.selectedUser = null;
    this.form.reset({
      accountNumber: '',
      firstName: '',
      lastName: '',
      position: '',
      companyRole: 'USER',
      password: '',
    });
  }

  openCreateDialog(): void {
    this.startCreate();
    this.createDialogVisible = true;
  }

  closeCreateDialog(): void {
    if (this.saving) {
      return;
    }

    this.createDialogVisible = false;
    this.startCreate();
  }

  selectUser(userSummary: User): void {
    const identifier = userSummary.accountNumber || userSummary.username || userSummary.id;
    if (!identifier) {
      return;
    }

    this.loadingUser = true;
    this.createDialogVisible = false;
    this.userService.getUser(identifier).subscribe({
      next: (user) => {
        this.loadingUser = false;
        this.selectedUser = user;
        this.form.reset({
          accountNumber: user.accountNumber || user.username || '',
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position || '',
          companyRole: user.companyRole || 'USER',
          password: '',
        });
      },
      error: (error) => {
        this.loadingUser = false;
        console.error('[UsersComponent] Failed to load user details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load the selected user.',
        });
      },
    });
  }

  saveUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation error',
        detail: 'Please complete the required user fields.',
      });
      return;
    }

    const password = String(this.form.get('password')?.value || '').trim();
    if (!this.isEditingExistingUser && !password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Password required',
        detail: 'New accounts need an initial password.',
      });
      return;
    }

    const accountNumber = String(this.form.get('accountNumber')?.value || '').trim();
    const firstName = String(this.form.get('firstName')?.value || '').trim();
    const lastName = String(this.form.get('lastName')?.value || '').trim();
    const position = String(this.form.get('position')?.value || '').trim();
    const companyRole = String(this.form.get('companyRole')?.value || 'USER').trim();

    const payload: User = {
      id: this.selectedUser?.id,
      userId: this.selectedUser?.userId || this.selectedUser?.id,
      accountNumber,
      username: accountNumber,
      firstName,
      lastName,
      position: position || undefined,
      companyRole,
      role: this.mapRoleLabel(companyRole),
      password: password || this.selectedUser?.password || undefined,
      roleAccess: this.mapRoleAccess(companyRole),
    };

    const wasEditing = this.isEditingExistingUser;

    this.saving = true;
    this.userService.save(payload).subscribe({
      next: (savedUser) => {
        this.saving = false;

        const mergedUser = {
          ...payload,
          ...savedUser,
          password: payload.password,
        };

        this.selectedUser = mergedUser;
        this.form.patchValue({ password: '' });
        this.syncSessionUser(mergedUser);
        this.loadUsers();

        if (!wasEditing) {
          this.createDialogVisible = false;
          this.startCreate();
        }

        this.messageService.add({
          severity: 'success',
          summary: wasEditing ? 'User updated' : 'User created',
          detail: `${firstName} ${lastName} has been saved successfully.`,
        });
      },
      error: (error) => {
        this.saving = false;
        console.error('[UsersComponent] Failed to save user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Save failed',
          detail: 'Unable to save this user account.',
        });
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'bg-[#35103F]/10 text-[#35103F]';
      case 'Accounting':
        return 'bg-emerald-100 text-emerald-700';
      case 'Biller':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  trackByUser(_index: number, user: User): number | string {
    return user.id || user.accountNumber || user.username;
  }

  get showInlineEditor(): boolean {
    return this.isEditingExistingUser || this.loadingUser;
  }

  private loadUsers(): void {
    this.loading = true;

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.sort((left, right) => {
          const leftName = `${left.lastName} ${left.firstName}`.trim().toLowerCase();
          const rightName = `${right.lastName} ${right.firstName}`.trim().toLowerCase();
          return leftName.localeCompare(rightName);
        });
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('[UsersComponent] Failed to load users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load user accounts.',
        });
      },
    });
  }

  private mapRoleLabel(companyRole: string): string {
    return getRoleLabel(undefined, normalizeCompanyRole(companyRole));
  }

  private syncSessionUser(user: User): void {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !user.id || currentUser.id !== user.id) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      accountNumber: user.accountNumber,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyRole: user.companyRole,
      roleAccess: user.roleAccess,
      position: user.position,
      password: user.password,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  private mapRoleAccess(companyRole: string): number | undefined {
    return resolveRoleAccess(undefined, companyRole);
  }

}
