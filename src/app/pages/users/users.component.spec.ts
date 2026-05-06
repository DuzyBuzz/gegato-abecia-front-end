import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UsersComponent } from './users.component';
import { UserService } from '../../shared/features/users/users.service';
import { AuthService } from '../../services/auth.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        {
          provide: UserService,
          useValue: {
            getUsers: () => of([]),
            getUser: () => of({
              id: 1,
              userId: 1,
              username: 'ADMIN-001',
              accountNumber: 'ADMIN-001',
              firstName: 'Admin',
              lastName: 'User',
              role: 'Admin',
              companyRole: 'SUPER_USER',
              password: 'secret',
            }),
            save: () => of({
              id: 1,
              userId: 1,
              username: 'ADMIN-001',
              accountNumber: 'ADMIN-001',
              firstName: 'Admin',
              lastName: 'User',
              role: 'Admin',
              companyRole: 'SUPER_USER',
              password: 'secret',
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: null,
          },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
