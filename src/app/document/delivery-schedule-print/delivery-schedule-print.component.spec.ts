import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverySchedulePrintComponent } from './delivery-schedule-print.component';

describe('DeliverySchedulePrintComponent', () => {
  let component: DeliverySchedulePrintComponent;
  let fixture: ComponentFixture<DeliverySchedulePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliverySchedulePrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverySchedulePrintComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
