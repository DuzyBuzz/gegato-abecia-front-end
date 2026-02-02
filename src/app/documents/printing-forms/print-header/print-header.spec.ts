import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintHeader } from './print-header';

describe('PrintHeader', () => {
  let component: PrintHeader;
  let fixture: ComponentFixture<PrintHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
