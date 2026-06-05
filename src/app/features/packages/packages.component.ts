import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss',
})
export class PackagesComponent {
  readonly summaryCards = [
    { label: 'Active packages', value: '14', tone: 'blue' },
    { label: 'Most used', value: 'Premium', tone: 'green' },
    { label: 'Avg. package price', value: '₱ 38,500', tone: 'amber' },
    { label: 'Price updates', value: '2 pending', tone: 'rose' },
  ];

  readonly packages = [
    {
      name: 'Premium Memorial Package',
      category: 'Featured',
      price: '₱ 75,000',
      description: 'Full service package for premium arrangements, chapel, and family coordination.',
      items: ['Casket selection', 'Viewing room', 'Transportation', 'Flowers', 'Memorial service'],
    },
    {
      name: 'Standard Service Bundle',
      category: 'Core',
      price: '₱ 48,500',
      description: 'Balanced package for daily funeral operations with essential service coverage.',
      items: ['Service team', 'Basic embalming', 'Vehicle support', 'Documentation', 'Wake setup'],
    },
    {
      name: 'Budget Care Package',
      category: 'Value',
      price: '₱ 32,000',
      description: 'Economical arrangement option for lower-cost family plans and quick billing.',
      items: ['Basic service team', 'Simple casket', 'Standard transport', 'Paperwork support'],
    },
  ];
}
