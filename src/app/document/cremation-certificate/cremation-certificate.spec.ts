import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CremationCertificate } from './cremation-certificate';

describe('CremationCertificate', () => {
  let component: CremationCertificate;
  let fixture: ComponentFixture<CremationCertificate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CremationCertificate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CremationCertificate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
