import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailsInstructionsComponent } from './event-details-instructions.component';

describe('EventDetailsInstructionsComponent', () => {
  let component: EventDetailsInstructionsComponent;
  let fixture: ComponentFixture<EventDetailsInstructionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetailsInstructionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDetailsInstructionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
