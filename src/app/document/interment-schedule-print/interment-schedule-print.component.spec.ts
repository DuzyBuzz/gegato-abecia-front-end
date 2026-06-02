import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntermentSchedulePrintComponent } from './interment-schedule-print.component';

describe('IntermentSchedulePrintComponent', () => {
  let component: IntermentSchedulePrintComponent;
  let fixture: ComponentFixture<IntermentSchedulePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntermentSchedulePrintComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntermentSchedulePrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
