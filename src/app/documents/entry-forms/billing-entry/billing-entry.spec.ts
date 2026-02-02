import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingEntry } from './billing-entry';

describe('BillingEntry', () => {
  let component: BillingEntry;
  let fixture: ComponentFixture<BillingEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
