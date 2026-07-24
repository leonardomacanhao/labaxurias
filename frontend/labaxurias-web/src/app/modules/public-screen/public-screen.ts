import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SignalrService, SignalrStatus } from '../../services/signalr';
import { AttendancePanelComponent } from './components/attendance-panel/attendance-panel.component';
import { HeaderInfoComponent } from './components/header-info/header-info.component';
import { QueueItem } from './models/queue-item.model';

interface PublicPanelSettings {
  headerTitle: string;
  headerSubtitle: string;
  brandName: string;
  logoPath: string;
  displaySeconds: number;
  fontFamily: string;
  textAnimation: string;
  textColor: string;
  textSize: number;
  logoSize: number;
  recentFontSize: number;
}

@Component({
  selector: 'app-public-screen',
  standalone: true,
  imports: [CommonModule, AttendancePanelComponent, HeaderInfoComponent],
  templateUrl: './public-screen.html',
  styleUrl: './public-screen.css'
})
export class PublicScreen implements OnInit, OnDestroy {
  currentAttendance: QueueItem | null = null;
  nextInQueue: QueueItem | null = null;
  recentCalls: QueueItem[] = [];
  connectionStatus: SignalrStatus = 'disconnected';
  audioReady: boolean = false;
  isToolbarOpen: boolean = false;

  settings: PublicPanelSettings = {
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

  private queueItems: QueueItem[] = [];
  private displayTimeout: ReturnType<typeof setTimeout> | null = null;
  private registerPanelInterval?: ReturnType<typeof setInterval>;
  private settingsRefreshInterval?: ReturnType<typeof setInterval>;
  private wakeLock: any = null;
  private statusSubscription?: Subscription;
  private callSound: HTMLAudioElement;
  private readonly unlockAudio = () => this.primeAudio();
  private readonly settingsListener = (event: StorageEvent) => {
    if (!event.key || event.key === 'publicPanelSettings') {
      this.loadSettings();
      this.cdr.markForCheck();
    }
  };

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
    this.loadSettings();
    window.addEventListener('storage', this.settingsListener);
    this.settingsRefreshInterval = setInterval(() => this.loadSettings(), 3000);
    this.registerAudioUnlock();

    this.statusSubscription = this.signalr.status$.subscribe(status => {
      this.connectionStatus = status;
      if (status === 'connected') {
        this.signalr.registerPublicPanel();
      }
      this.cdr.markForCheck();
    });

    this.signalr.startConnection(true);
    setTimeout(() => this.signalr.registerPublicPanel(), 1000);
    this.registerPanelInterval = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.signalr.registerPublicPanel();
      }
    }, 7000);

    this.signalr.onReceiveCall((data: any) => {
      this.ngZone.run(() => {
        this.playCallSound();

        const clientName = data.clientName || data.name || 'Consulente';
        const guideName = data.guideName || data.entityName || 'Entidade';
        const guideId = data.guideId || data.entityId || 'unknown';

        this.processCall(clientName, guideName, guideId);
      });
    });

    this.signalr.onClearPublicHistory(() => {
      this.ngZone.run(() => this.clearHistory());
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.unlockAudio);
    document.removeEventListener('keydown', this.unlockAudio);
    document.removeEventListener('touchstart', this.unlockAudio);
    window.removeEventListener('storage', this.settingsListener);
    this.statusSubscription?.unsubscribe();

    if (this.displayTimeout) clearTimeout(this.displayTimeout);
    if (this.registerPanelInterval) clearInterval(this.registerPanelInterval);
    if (this.settingsRefreshInterval) clearInterval(this.settingsRefreshInterval);

    this.wakeLock?.release?.();
  }

  get statusLabel(): string {
    const labels: Record<SignalrStatus, string> = {
      connected: 'Conectado',
      connecting: 'Conectando',
      reconnecting: 'Reconectando',
      disconnected: 'Desconectado'
    };

    return labels[this.connectionStatus];
  }

  toggleToolbar(): void {
    this.primeAudio();
    this.isToolbarOpen = !this.isToolbarOpen;
  }

  async activateTvMode(): Promise<void> {
    this.primeAudio();

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Nao foi possivel abrir tela cheia:', err);
    }

    try {
      const navigatorWithWakeLock = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<any> } };
      this.wakeLock = await navigatorWithWakeLock.wakeLock?.request('screen');
    } catch (err) {
      console.warn('Nao foi possivel manter a tela acordada:', err);
    }
  }

  primeAudio(): void {
    this.callSound.muted = true;
    this.callSound.play()
      .then(() => {
        this.callSound.pause();
        this.callSound.currentTime = 0;
        this.callSound.muted = false;
        this.audioReady = true;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.callSound.muted = false;
      });
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

  private loadSettings(): void {
    const stored = localStorage.getItem('publicPanelSettings');
    if (!stored) return;

    try {
      this.settings = { ...this.settings, ...JSON.parse(stored) };
    } catch {
      localStorage.removeItem('publicPanelSettings');
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

    this.currentAttendance = attendance;
    this.recentCalls = [attendance, ...this.recentCalls.filter(item => item.uniqueId !== attendance.uniqueId)].slice(0, 3);
    this.updateNext();
    this.startDisplayTimer();
    this.cdr.detectChanges();
  }

  private clearHistory(): void {
    this.recentCalls = [];
    this.currentAttendance = null;
    this.nextInQueue = null;
    this.queueItems = [];

    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
      this.displayTimeout = null;
    }

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
      });
    }, this.settings.displaySeconds * 1000);
  }
}
