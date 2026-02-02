import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovementsTableComponent } from './movements-table.component';

describe('MovementsTableComponent', () => {
  let component: MovementsTableComponent;
  let fixture: ComponentFixture<MovementsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovementsTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
