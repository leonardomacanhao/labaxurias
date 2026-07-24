import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  username: string = 'Usuario';
  showLogoutModal: boolean = false;
  showPublicSettingsModal: boolean = false;
  isMobileMenuOpen: boolean = false;

  publicSettings = {
    headerTitle: 'T.U.C.U.C.J.',
    headerSubtitle: 'Sistema de Atendimento',
    brandName: 'T.U.C.U.C.J.',
    logoPath: 'logo-tucucj-transparent.png',
    displaySeconds: 7,
    fontFamily: 'Cinzel',
    textAnimation: 'fire',
    textColor: '#f0c581',
    textSize: 56,
    logoSize: 416,
    recentFontSize: 11
  };

  fontOptions = [
    { value: 'Cinzel', label: 'Cinzel' },
    { value: 'Manrope', label: 'Manrope' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times' },
    { value: 'Trebuchet MS', label: 'Trebuchet' },
    { value: 'Verdana', label: 'Verdana' }
  ];

  animationOptions = [
    { value: 'fire', label: 'Fogo' },
    { value: 'ember', label: 'Brasa' },
    { value: 'pulse', label: 'Pulso' },
    { value: 'shine', label: 'Brilho' },
    { value: 'float', label: 'Flutuar' },
    { value: 'wave', label: 'Onda' },
    { value: 'breath', label: 'Respirar' },
    { value: 'spark', label: 'Faiscas' },
    { value: 'focus', label: 'Foco' },
    { value: 'still', label: 'Parado' }
  ];

  private menuSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarState: SidebarStateService
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'Usuario';
    this.loadPublicSettings();

    this.menuSubscription = this.sidebarState.isMobileMenuOpen$.subscribe(isOpen => {
      this.isMobileMenuOpen = isOpen;
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    });
  }

  ngOnDestroy(): void {
    this.menuSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768) {
      this.sidebarState.setMobileMenuOpen(false);
    }
  }

  closeMobileMenu(): void {
    this.sidebarState.setMobileMenuOpen(false);
  }

  openExternal(path: string): void {
    window.open(path, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }

  openPublicSettingsModal(): void {
    this.loadPublicSettings();
    this.showPublicSettingsModal = true;
  }

  closePublicSettingsModal(): void {
    this.showPublicSettingsModal = false;
  }

  savePublicSettings(): void {
    this.publicSettings.brandName = this.publicSettings.brandName.trim() || 'T.U.C.U.C.J.';
    this.publicSettings.headerTitle = this.publicSettings.headerTitle.trim() || 'T.U.C.U.C.J.';
    this.publicSettings.headerSubtitle = this.publicSettings.headerSubtitle.trim() || 'Sistema de Atendimento';
    this.publicSettings.logoPath = this.publicSettings.logoPath.trim() || 'logo-tucucj-transparent.png';
    this.publicSettings.displaySeconds = Math.min(Math.max(Number(this.publicSettings.displaySeconds) || 7, 3), 30);
    this.publicSettings.fontFamily = this.publicSettings.fontFamily || 'Cinzel';
    this.publicSettings.textAnimation = this.publicSettings.textAnimation || 'fire';
    this.publicSettings.textColor = this.publicSettings.textColor || '#f0c581';
    this.publicSettings.textSize = Math.min(Math.max(Number(this.publicSettings.textSize) || 56, 24), 120);
    this.publicSettings.logoSize = Math.min(Math.max(Number(this.publicSettings.logoSize) || 416, 120), 700);
    this.publicSettings.recentFontSize = Math.min(Math.max(Number(this.publicSettings.recentFontSize) || 11, 8), 22);

    localStorage.setItem('publicPanelSettings', JSON.stringify(this.publicSettings));
    window.dispatchEvent(new StorageEvent('storage', { key: 'publicPanelSettings' }));
    this.showPublicSettingsModal = false;
  }

  selectPublicLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.publicSettings.logoPath = String(reader.result || this.publicSettings.logoPath);
    };
    reader.readAsDataURL(file);
    input.value = '';
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

  private loadPublicSettings(): void {
    const stored = localStorage.getItem('publicPanelSettings');
    if (!stored) return;

    try {
      this.publicSettings = { ...this.publicSettings, ...JSON.parse(stored) };
    } catch {
      localStorage.removeItem('publicPanelSettings');
    }
  }
}
