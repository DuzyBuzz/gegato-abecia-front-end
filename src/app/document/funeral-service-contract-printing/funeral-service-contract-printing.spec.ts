import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuneralServiceContractPrinting } from './funeral-service-contract-printing';

describe('FuneralServiceContractPrinting', () => {
  let component: FuneralServiceContractPrinting;
  let fixture: ComponentFixture<FuneralServiceContractPrinting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuneralServiceContractPrinting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuneralServiceContractPrinting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
