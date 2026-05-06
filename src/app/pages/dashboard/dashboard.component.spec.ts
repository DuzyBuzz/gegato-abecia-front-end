import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { UserService } from '../../shared/features/users/users.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: FuneralContractService,
          useValue: {
            getFuneralServices: () => of([]),
          },
        },
        {
          provide: FuneralPaymentsService,
          useValue: {
            getFuneralPayments: () => of([]),
          },
        },
        {
          provide: UserService,
          useValue: {
            getUsers: () => of([]),
          },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
