import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuneralContractEntry } from './funeral-contract-entry';

describe('FuneralContractEntry', () => {
  let component: FuneralContractEntry;
  let fixture: ComponentFixture<FuneralContractEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuneralContractEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuneralContractEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
