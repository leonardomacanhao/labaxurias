import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { SignalrService } from '../../services/signalr';
import { AttendancePanelComponent } from './components/attendance-panel/attendance-panel.component';
import { HeaderInfoComponent } from './components/header-info/header-info.component';
import { QueueItem } from './models/queue-item.model';

@Component({
  selector: 'app-public-screen',
  standalone: true,
  imports: [AttendancePanelComponent, HeaderInfoComponent],
  templateUrl: './public-screen.html',
  styleUrl: './public-screen.css',
})
export class PublicScreen implements OnInit {
  currentAttendance: QueueItem | null = null;
  nextInQueue: QueueItem | null = null;
  private queueItems: QueueItem[] = [];
  private displayTimeout: any;

  constructor(
    private signalr: SignalrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.signalr.startConnection();

    this.signalr.onReceiveCall((data) => {
      this.ngZone.run(() => {
        this.processCall(data.clientName, data.guideName, data.guideId);
      });
    });
  }

  private processCall(clientName: string, guideName: string, guideId?: string): void {
    const attendance: QueueItem = {
      uniqueId: `${clientName}_${Date.now()}`,
      name: clientName,
      entityName: guideName,
      entityId: guideId || 'unknown',
      status: 'CHAMADO',
      calledAt: new Date().toISOString()
    };

    if (this.currentAttendance) {
      this.queueItems = [...this.queueItems, attendance];
      this.updateNext();
    } else {
      this.currentAttendance = attendance;
      this.updateNext();
      this.startDisplayTimer();
    }

    this.cdr.detectChanges();
  }

  private updateNext(): void {
    this.nextInQueue = this.queueItems.length > 0 ? this.queueItems[0] : null;
  }

  private startDisplayTimer(): void {
    if (this.displayTimeout) clearTimeout(this.displayTimeout);

    this.displayTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.currentAttendance = null;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.ngZone.run(() => {
            if (this.queueItems.length > 0) {
              this.currentAttendance = this.queueItems[0];
              this.queueItems = this.queueItems.slice(1);
              this.updateNext();
              this.startDisplayTimer();
            }
            this.cdr.detectChanges();
          });
        }, 800);
      });
    }, 7000);
  }
}
