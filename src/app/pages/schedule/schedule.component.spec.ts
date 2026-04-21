import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ScheduleComponent } from './schedule.component';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralChargesService } from '../../services/funeral-charges.service';

describe('ScheduleComponent', () => {
  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        {
          provide: FuneralContractService,
          useValue: {
            getBurialSchedule: () => of([])
          }
        },
        {
          provide: FuneralChargesService,
          useValue: {
            getChargesByServiceId: () => of([])
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
