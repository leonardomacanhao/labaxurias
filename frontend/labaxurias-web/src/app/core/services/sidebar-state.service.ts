import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private isMobileMenuOpenSubject = new BehaviorSubject<boolean>(false);
  isMobileMenuOpen$ = this.isMobileMenuOpenSubject.asObservable();

  toggleMobileMenu() {
    this.isMobileMenuOpenSubject.next(!this.isMobileMenuOpenSubject.value);
  }

  setMobileMenuOpen(isOpen: boolean) {
    this.isMobileMenuOpenSubject.next(isOpen);
  }
}
