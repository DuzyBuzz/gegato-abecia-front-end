import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeceasedComponent } from './deceased.component';

describe('DeceasedComponent', () => {
  let component: DeceasedComponent;
  let fixture: ComponentFixture<DeceasedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeceasedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeceasedComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
