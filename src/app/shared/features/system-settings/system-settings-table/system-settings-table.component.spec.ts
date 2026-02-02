import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemSettingsTableComponent } from './system-settings-table.component';

describe('SystemSettingsTableComponent', () => {
  let component: SystemSettingsTableComponent;
  let fixture: ComponentFixture<SystemSettingsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemSettingsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemSettingsTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
