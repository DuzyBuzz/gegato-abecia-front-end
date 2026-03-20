import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuneralPaymentComponent } from './funeral-payment.component';

describe('FuneralPaymentComponent', () => {
  let component: FuneralPaymentComponent;
  let fixture: ComponentFixture<FuneralPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuneralPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuneralPaymentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
