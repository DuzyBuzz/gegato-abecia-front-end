
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type InventoryCategory =
  | 'Casket'
  | 'Urn'
  | 'Consumable'
  | 'Service'
  | 'Vehicle';

@Component({
  selector: 'app-items-entry',
  imports: [CommonModule, FormsModule],
  templateUrl: './items-entry.html',
  styleUrl: './items-entry.scss',
})
export class ItemsEntry {

  item = {
    code: '',
    name: '',
    category: 'Casket' as InventoryCategory,
    description: '',
    quantity: 0,
    unit: 'pcs',
    price: 0,
    supplier: '',
    remarks: ''
  };

  categories: InventoryCategory[] = [
    'Casket',
    'Urn',
    'Consumable',
    'Service',
    'Vehicle'
  ];

  units = ['pcs', 'set', 'service'];

  submit() {
    const payload = {
      ...this.item,
      status: this.computeStatus(this.item.quantity),
      createdAt: new Date().toISOString()
    };

    console.log('SAVE INVENTORY ITEM', payload);

    // 🔜 API SAVE HERE
    // this.inventoryService.create(payload)

    alert('Inventory item saved (mock)');
    this.reset();
  }

  reset() {
    this.item = {
      code: '',
      name: '',
      category: 'Casket',
      description: '',
      quantity: 0,
      unit: 'pcs',
      price: 0,
      supplier: '',
      remarks: ''
    };
  }

  computeStatus(qty: number) {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 2) return 'Low Stock';
    return 'Available';
  }

  isStockBased() {
    return this.item.category !== 'Service' && this.item.category !== 'Vehicle';
  }

  formatCurrency(v: number) {
    return '₱' + v.toLocaleString();
  }
}
