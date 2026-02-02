import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsEntry } from './items-entry';

describe('ItemsEntry', () => {
  let component: ItemsEntry;
  let fixture: ComponentFixture<ItemsEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemsEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
