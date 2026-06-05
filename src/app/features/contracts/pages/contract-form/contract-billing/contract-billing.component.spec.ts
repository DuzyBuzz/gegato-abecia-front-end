import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractBillingComponent } from './contract-billing.component';

describe('ContractBillingComponent', () => {
  let component: ContractBillingComponent;
  let fixture: ComponentFixture<ContractBillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractBillingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractBillingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
