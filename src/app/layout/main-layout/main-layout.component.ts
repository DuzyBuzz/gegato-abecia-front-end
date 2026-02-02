import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayout {
  showContractModal = true;
   expandedMenu: string | null = null;
  sidebarExpanded = false;

  toggle(menu: string) {
    this.expandedMenu = this.expandedMenu === menu ? null : menu;
  }

  isOpen(menu: string): boolean {
    return this.expandedMenu === menu;
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;

    // collapse child menus when sidebar collapses
    if (!this.sidebarExpanded) {
      this.expandedMenu = null;
    }
  }



  openModal() {
    this.showContractModal = true;
  }

  closeModal() {
    this.showContractModal = false;
  }
  /** Controls user dropdown visibility */
  isUserMenuOpen = false;

  /** Static user data (replace with Auth service later) */
  currentUser = {
    name: 'Admin User',
    email: 'admin@gegatoabecia.com',
    role: 'Administrator'
  };

  constructor(private router: Router) {}

  /** Toggle dropdown */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /** Close dropdown */
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  /** Logout action (replace later) */
  logout(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/login']);
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }
}
