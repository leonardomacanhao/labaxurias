import { Component, OnDestroy, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
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
export class PublicScreen implements OnInit, OnDestroy {
  currentAttendance: QueueItem | null = null;
  nextInQueue: QueueItem | null = null;
  private queueItems: QueueItem[] = [];
  private displayTimeout: ReturnType<typeof setTimeout> | null = null;
  private callSound: HTMLAudioElement;
  private readonly unlockAudio = () => this.primeAudio();

  constructor(
    private signalr: SignalrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.callSound = new Audio('/assets/sounds/call.mp3');
    this.callSound.preload = 'auto';
    this.callSound.load();
  }

  ngOnInit(): void {
    this.registerAudioUnlock();
    this.signalr.startConnection();

    this.signalr.onReceiveCall((data: any) => {
      console.log('Public recebeu chamada:', data);

      this.ngZone.run(() => {
        this.playCallSound();

        const clientName = data.clientName || data.name || 'Consulente';
        const guideName = data.guideName || data.entityName || 'Entidade';
        const guideId = data.guideId || data.entityId || 'unknown';

        this.processCall(clientName, guideName, guideId);
      });
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);
    document.removeEventListener('touchstart', this.unlockAudio);

    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
    }
  }

  private playCallSound(): void {
    try {
      this.callSound.currentTime = 0;
      this.callSound.play().catch(err => {
        console.warn('Nao foi possivel tocar o som na Public:', err.message);
      });
    } catch (err) {
      console.warn('Erro ao tocar som na Public:', err);
    }
  }

  private registerAudioUnlock(): void {
    document.addEventListener('click', this.unlockAudio, { once: true });
    document.addEventListener('keydown', this.unlockAudio, { once: true });
    document.addEventListener('touchstart', this.unlockAudio, { once: true });
  }

  private primeAudio(): void {
    this.callSound.muted = true;
    this.callSound.play()
      .then(() => {
        this.callSound.pause();
        this.callSound.currentTime = 0;
        this.callSound.muted = false;
      })
      .catch(() => {
        this.callSound.muted = false;
      });
  }

  private processCall(clientName: string, guideName: string, guideId: string): void {
    const attendance: QueueItem = {
      uniqueId: `${clientName}_${Date.now()}`,
      name: clientName,
      entityName: guideName,
      entityId: guideId,
      status: 'CHAMADO',
      calledAt: new Date().toISOString()
    };

    this.currentAttendance = attendance;
    this.updateNext();
    this.startDisplayTimer();

    this.cdr.detectChanges();
  }

  private updateNext(): void {
    this.nextInQueue = this.queueItems.length > 0 ? this.queueItems[0] : null;
  }

  private startDisplayTimer(): void {
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
    }

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
