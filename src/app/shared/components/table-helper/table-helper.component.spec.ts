import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHelperComponent } from './table-helper.component';     

describe('TableHelperComponent', () => {
  let component: TableHelperComponent;
  let fixture: ComponentFixture<TableHelperComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHelperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableHelperComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
