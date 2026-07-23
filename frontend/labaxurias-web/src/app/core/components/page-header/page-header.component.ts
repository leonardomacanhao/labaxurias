import { Component, Input } from '@angular/core';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() title: string = '';
  isMenuOpen: boolean = false;

  constructor(private sidebarState: SidebarStateService) {}

  toggleMenu(): void {
    this.sidebarState.toggleMobileMenu();
  }
}
