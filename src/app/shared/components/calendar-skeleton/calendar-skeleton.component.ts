import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4 animate-pulse">
      <!-- Header Skeleton -->
      <div class="flex justify-between items-center p-4 bg-gray-200 rounded-lg h-16"></div>
      
      <!-- Calendar Grid Skeleton -->
      <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <!-- Days Header -->
        <div class="grid grid-cols-7 gap-2 mb-4">
          <div *ngFor="let i of [0,1,2,3,4,5,6]" class="h-8 bg-gray-300 rounded"></div>
        </div>
        
        <!-- Calendar Cells -->
        <div class="grid grid-cols-7 gap-2">
          <div *ngFor="let i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]" 
               class="h-24 bg-gray-100 rounded border border-gray-200">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CalendarSkeletonComponent {}
