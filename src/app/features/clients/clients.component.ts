import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent {
  searchTerm = '';

  readonly summaryCards = [
    { label: 'Active clients', value: '124', tone: 'blue' },
    { label: 'SOA due', value: '18', tone: 'amber' },
    { label: 'Collections this month', value: '₱ 412K', tone: 'green' },
    { label: 'Pending contracts', value: '9', tone: 'rose' },
  ];

  readonly clients = [
    { id: 1, name: 'Juan Dela Cruz', contact: 'juan@familycare.ph', address: 'Bacolod City, Negros Occidental', branch: 'Main Branch', lastPayment: '₱ 18,000 · 05 Jun', outstanding: '₱ 30,000', activeContracts: '3 active', soaStatus: 'Ready for print', status: 'Active' },
    { id: 2, name: 'Maria Santos', contact: 'maria@sample.ph', address: 'Silay City, Negros Occidental', branch: 'Main Branch', lastPayment: '₱ 5,500 · 02 Jun', outstanding: '₱ 12,500', activeContracts: '2 active', soaStatus: 'Awaiting payment', status: 'Pending' },
    { id: 3, name: 'Ramon Cruz', contact: 'ramon@sample.ph', address: 'Bago City, Negros Occidental', branch: 'North Branch', lastPayment: '₱ 50,000 · 01 Jun', outstanding: '₱ 0', activeContracts: '1 active', soaStatus: 'Settled', status: 'Active' },
  ];

  selectedClient = this.clients[0];

  get filteredClients() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.clients;

    return this.clients.filter((client) =>
      [client.name, client.contact, client.address].some((field) => field.toLowerCase().includes(term)),
    );
  }

  selectClient(client: (typeof this.clients)[number]) {
    this.selectedClient = client;
  }
}
