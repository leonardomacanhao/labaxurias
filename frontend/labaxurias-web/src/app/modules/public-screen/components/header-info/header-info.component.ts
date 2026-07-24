import { ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-info.component.html',
  styleUrl: './header-info.component.css'
})
export class HeaderInfoComponent implements OnInit, OnDestroy {
  @Input() title: string = 'T.U.C.U.C.J.';
  @Input() subtitle: string = 'Sistema de Atendimento';
  currentTime: string = '';
  currentDate: string = '';
  private intervalId: number | null = null;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateDateTime();

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        this.ngZone.run(() => {
          this.updateDateTime();
          this.cdr.markForCheck();
        });
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateDateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    this.currentDate = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
