import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnclosionsComponent } from './enclosions.component';

describe('EnclosionsComponent', () => {
  let component: EnclosionsComponent;
  let fixture: ComponentFixture<EnclosionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnclosionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnclosionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
