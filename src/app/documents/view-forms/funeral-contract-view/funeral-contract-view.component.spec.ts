import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuneralContractViewComponent } from './funeral-contract-view.component';

describe('FuneralContractViewComponent', () => {
  let component: FuneralContractViewComponent;
  let fixture: ComponentFixture<FuneralContractViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuneralContractViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuneralContractViewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
