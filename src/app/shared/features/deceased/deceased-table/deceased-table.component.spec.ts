import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeceasedTableComponent } from './deceased-table.component';

describe('DeceasedTableComponent', () => {
  let component: DeceasedTableComponent;
  let fixture: ComponentFixture<DeceasedTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeceasedTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeceasedTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
