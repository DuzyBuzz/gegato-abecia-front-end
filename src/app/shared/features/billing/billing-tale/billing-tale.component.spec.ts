import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingTaleComponent } from './billing-tale.component';

describe('BillingTaleComponent', () => {
  let component: BillingTaleComponent;
  let fixture: ComponentFixture<BillingTaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingTaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingTaleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
