import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DatePreferenceService {
  private readonly fallbackKey = 'gira_selected_date';
  private readonly userDatePrefix = 'selected_date_user_';

  getSelectedDate(): string {
    const username = this.getUsername();
    const userDate = localStorage.getItem(this.getUserDateKey(username));

    if (userDate) return userDate;
    if (username === 'anonymous') return localStorage.getItem(this.fallbackKey) || this.getToday();

    return this.getToday();
  }

  setSelectedDate(date: string): void {
    if (!date) return;
    localStorage.setItem(this.getUserDateKey(this.getUsername()), date);
    localStorage.setItem(this.fallbackKey, date);
  }

  private getUserDateKey(username: string): string {
    return `${this.userDatePrefix}${username}`;
  }

  private getUsername(): string {
    return localStorage.getItem('username') || 'anonymous';
  }

  private getToday(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
}
