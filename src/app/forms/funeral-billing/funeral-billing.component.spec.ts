import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuneralBillingComponent } from './funeral-billing.component';

describe('FuneralBillingComponent', () => {
  let component: FuneralBillingComponent;
  let fixture: ComponentFixture<FuneralBillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuneralBillingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuneralBillingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
