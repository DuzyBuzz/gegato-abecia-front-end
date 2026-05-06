import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingLayoutComponent } from './accounting-layout.component';

describe('AccountingLayoutComponent', () => {
  let component: AccountingLayoutComponent;
  let fixture: ComponentFixture<AccountingLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
