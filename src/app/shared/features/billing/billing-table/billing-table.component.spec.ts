import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingTalebleComponent } from './billing-table.component';

describe('BillingTalebleComponent', () => {
  let component: BillingTalebleComponent;
  let fixture: ComponentFixture<BillingTalebleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingTalebleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingTalebleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
