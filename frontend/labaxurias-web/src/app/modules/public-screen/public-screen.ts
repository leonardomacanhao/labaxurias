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
  private callSound: HTMLAudioElement;

  constructor(
    private signalr: SignalrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.callSound = new Audio('/assets/sounds/call.mp3');
    this.callSound.load();
  }

  ngOnInit(): void {
    this.signalr.startConnection();

    this.signalr.onReceiveCall((data: any) => {
      console.log('📢 Dados brutos recebidos do SignalR:', data);
      
      this.ngZone.run(() => {
        this.playCallSound();
        
        // Garante que pegamos o nome corretamente, independente de como o backend enviou
        const clientName = data.clientName || data.name || 'Consulente';
        const guideName = data.guideName || data.entityName || 'Entidade';
        const guideId = data.guideId || data.entityId || 'unknown';

        console.log('🔄 Processando chamada com:', { clientName, guideName, guideId });
        this.processCall(clientName, guideName, guideId);
      });
    });
  }

  private playCallSound(): void {
    try {
      this.callSound.currentTime = 0;
      this.callSound.play().catch(err => {
        console.warn('⚠️ Não foi possível tocar o som:', err.message);
      });
    } catch (err) {
      console.warn('⚠️ Erro ao tocar som:', err);
    }
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

    // Exibe a chamada IMEDIATAMENTE, substituindo a anterior se houver
    this.currentAttendance = attendance;
    this.updateNext();
    this.startDisplayTimer();

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
    }, 7000); // 7 segundos de exibição
  }
}