import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementOfAccount } from './statement-of-account';

describe('StatementOfAccount', () => {
  let component: StatementOfAccount;
  let fixture: ComponentFixture<StatementOfAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementOfAccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatementOfAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
