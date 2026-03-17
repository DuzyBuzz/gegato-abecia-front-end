import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingLayoutComponent } from './billing-layout.component';

describe('BillingLayoutComponent', () => {
  let component: BillingLayoutComponent;
  let fixture: ComponentFixture<BillingLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
