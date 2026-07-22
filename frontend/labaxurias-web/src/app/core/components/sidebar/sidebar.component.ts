import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  username: string = 'Usuário';
  showLogoutModal: boolean = false;
  isMobileMenuOpen: boolean = false;
  private menuSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarState: SidebarStateService
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'Usuário';
    
    // Escuta mudanças no estado do menu vindas do header ou de outro lugar
    this.menuSubscription = this.sidebarState.isMobileMenuOpen$.subscribe(isOpen => {
      this.isMobileMenuOpen = isOpen;
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    });
  }

  ngOnDestroy(): void {
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth > 768) {
      this.sidebarState.setMobileMenuOpen(false);
    }
  }

  toggleMobileMenu(): void {
    this.sidebarState.toggleMobileMenu();
  }

  closeMobileMenu(): void {
    this.sidebarState.setMobileMenuOpen(false);
  }

  openExternal(path: string): void {
    window.open(path, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
