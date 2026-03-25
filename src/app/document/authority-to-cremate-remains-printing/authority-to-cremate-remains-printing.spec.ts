import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorityToCremateRemainsPrinting } from './authority-to-cremate-remains-printing';

describe('AuthorityToCremateRemainsPrinting', () => {
  let component: AuthorityToCremateRemainsPrinting;
  let fixture: ComponentFixture<AuthorityToCremateRemainsPrinting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorityToCremateRemainsPrinting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorityToCremateRemainsPrinting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
