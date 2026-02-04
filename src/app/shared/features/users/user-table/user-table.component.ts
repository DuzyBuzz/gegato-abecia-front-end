import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { User } from '../users.model';
import { UserService } from '../users.service';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SmartTableComponent } from '../../../components/smart-table/smart-table.component';
import { SmartTableColumn } from '../../../components/smart-table/smart-table-column.model';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    SmartTableComponent,
    ToolbarModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    FormsModule,
    RippleModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TooltipModule,
    RouterLink
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersTableComponent implements OnInit {

  users: User[] = [];
  selectedUsers: User[] = [];
  totalRecords = 0;
  loading = false;

  userDialog = false;
  submitted = false;

  columns: SmartTableColumn[] = [
    { field: 'username', header: 'Username', sortable: true, filterable: true, width: '150px', filterType: 'text' },
    { field: 'firstName', header: 'First Name', sortable: true, filterable: true, filterType: 'text' },
    { field: 'lastName', header: 'Last Name', sortable: true, filterable: true, filterType: 'text' },
    { field: 'role', header: 'Role', sortable: true, filterable: true, template: 'status', filterType: 'text' },
    { field: 'createdAt', header: 'Created', sortable: true, filterable: true, template: 'date', filterType: 'date' }
  ];

user: User = {
  userId: 0,
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  role: ''
};


  roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Staff', value: 'Staff' },
    { label: 'Viewer', value: 'Viewer' }
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }
onRowClicked(row: User) {
  console.log('Row clicked:', row);
}


  onTableSearch(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.loadUsers();
      return;
    }

    this.loading = true;
    this.userService.search(searchTerm).subscribe({
      next: data => {
        this.users = data;
        this.totalRecords = data.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to search users'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: data => {
        this.users = data;
        this.totalRecords = data.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }



  openNew() {
    this.user = {
      userId: 0,
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      role: 'Staff'
    };
    this.userDialog = true;
  }

  editUser(user: User) {
    this.user = { ...user };
    this.userDialog = true;
  }

  hideDialog() {
    this.userDialog = false;
    this.submitted = false;
  }

  saveUser() {
    this.submitted = true;

    if (!this.user.username || !this.user.password) return;

    const action$ =
      this.user.userId === 0
        ? this.userService.create(this.user)
        : this.userService.update(this.user.userId, this.user);

    action$.subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: this.user.userId === 0 ? 'User created' : 'User updated'
      });
      this.userDialog = false;
      this.loadUsers();
    });
  }

  deleteUser(user: User) {
    this.confirmationService.confirm({
      message: `Delete user ${user.username}?`,
      accept: () => {
        this.userService.delete(user.userId).subscribe(() => {
          this.users = this.users.filter(u => u.userId !== user.userId);
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User deleted successfully'
          });
        }, error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete user'
          });
        });
      }
    });
  }

  deleteSelectedUsers() {
    this.confirmationService.confirm({
      message: 'Delete selected users?',
      accept: () => {
        const deleteRequests = this.selectedUsers.map(u =>
          this.userService.delete(u.userId)
        );

        Promise.all(deleteRequests).then(() => {
          this.users = this.users.filter(u => !this.selectedUsers.includes(u));
          this.selectedUsers = [];
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Users deleted successfully'
          });
        }).catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete some users'
          });
        });
      }
    });
  }

  getSeverity(status: string): any {
    switch (status?.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'staff':
        return 'info';
      case 'viewer':
        return 'warning';
      default:
        return 'secondary';
    }
  }

}