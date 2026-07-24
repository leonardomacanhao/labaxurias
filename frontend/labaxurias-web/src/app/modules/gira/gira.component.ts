import { Component, OnDestroy, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ApiService } from '../../services/api.service';
import { DatePreferenceService } from '../../services/date-preference.service';
import { environment } from '../../../environments/environment';
import * as signalR from '@microsoft/signalr';

interface QueueItem {
  id: string;
  name: string;
  isCalled: boolean;
  calledAt?: string;
}

interface SessionEntity {
  sessionEntityId: string;
  entityId: string;
  entityName: string;
  mediumId: string;
  mediumName: string;
  queueItems: QueueItem[];
}

@Component({
  selector: 'app-gira',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, RouterLink],
  templateUrl: './gira.component.html',
  styleUrl: './gira.component.css'
})
export class GiraComponent implements OnInit, OnDestroy {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  selectedDate: string = '';
  sessionEntities: SessionEntity[] = [];
  searchTerm: string = '';
  showMobileSearch: boolean = false;
  isTestingPanel: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  private hubConnection: signalR.HubConnection | null = null;
  private callSound: HTMLAudioElement;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private readonly focusHandler = () => {
    this.loadSessionData();
  };

  constructor(
    private api: ApiService,
    private datePreference: DatePreferenceService,
    private cdr: ChangeDetectorRef
  ) {
    this.callSound = new Audio('/assets/sounds/call.mp3');
    this.callSound.load();
  }

  ngOnInit(): void {
    this.selectedDate = this.datePreference.getSelectedDate();

    this.loadSessionData();
    this.setupSignalR();
    window.addEventListener('focus', this.focusHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.focusHandler);
    this.hubConnection?.stop();
  }

  openCalendar(): void {
    this.dateInput.nativeElement.showPicker();
  }

  onDateChange(): void {
    this.datePreference.setSelectedDate(this.selectedDate);
    this.loadSessionData();
    this.clearPublicHistory();
  }

  get filteredSessionEntities(): SessionEntity[] {
    const term = this.normalizeSearch(this.searchTerm);
    if (!term) return this.sessionEntities;

    return this.sessionEntities.filter(entity => {
      const entityName = this.normalizeSearch(entity.entityName);
      const mediumName = this.normalizeSearch(entity.mediumName);
      return entityName.includes(term) || mediumName.includes(term);
    });
  }

  get hasNoSearchResults(): boolean {
    return this.sessionEntities.length > 0 && this.filteredSessionEntities.length === 0;
  }

  toggleMobileSearch(): void {
    this.showMobileSearch = !this.showMobileSearch;
    if (!this.showMobileSearch) {
      this.searchTerm = '';
      return;
    }

    setTimeout(() => document.querySelector<HTMLInputElement>('.mobile-search-panel input')?.focus());
  }

  loadSessionData(): void {
    this.api.getSessionByDate(this.selectedDate).subscribe({
      next: (data) => {
        this.sessionEntities = data.sessionEntities.map((se: any) => ({
          sessionEntityId: se.sessionEntityId,
          entityId: se.entityId,
          entityName: se.entityName,
          mediumId: se.mediumId,
          mediumName: se.mediumName,
          queueItems: se.queueItems.map((qi: any) => ({
            id: qi.id,
            name: qi.clientName || qi.name,
            isCalled: qi.isCalled || false,
            calledAt: qi.calledAt || undefined
          }))
        }));

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar sessao:', err)
    });
  }

  setupSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('Conectado ao SignalR');
      })
      .catch(err => console.error('Erro ao conectar SignalR:', err));

    this.hubConnection.on('ReceiveCall', () => {
      this.loadSessionData();
    });
  }

  callNext(sessionEntity: SessionEntity): void {
    this.playCallSound();

    this.api.callNextBySessionEntity(sessionEntity.sessionEntityId).subscribe({
      next: () => {
        setTimeout(() => this.loadSessionData(), 500);
      },
      error: (err) => {
        console.error('Erro ao chamar proximo:', err);
        if (err.status === 404) {
          this.showToast('Nao ha mais consulentes na fila.', 'info');
        }
      }
    });
  }

  callQueueItem(queueItem: QueueItem): void {
    this.playCallSound();
    queueItem.isCalled = true;
    queueItem.calledAt = new Date().toISOString();
    this.cdr.detectChanges();

    this.api.repeatCall(queueItem.id).subscribe({
      next: () => {
        setTimeout(() => this.loadSessionData(), 500);
      },
      error: (err) => console.error('Erro ao chamar consulente:', err)
    });
  }

  testPublicPanel(): void {
    this.isTestingPanel = true;
    this.playCallSound();

    const payload = {
      clientName: 'Teste do Painel',
      queueItemId: crypto.randomUUID?.() || `${Date.now()}`,
      guideId: 'test',
      guideName: 'Entidade de Teste',
      calledAt: new Date().toISOString(),
      isTest: true
    };

    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      this.isTestingPanel = false;
      this.showToast('SignalR ainda nao esta conectado.', 'error');
      return;
    }

    this.hubConnection.invoke('SendCall', payload)
      .then(() => {
        this.isTestingPanel = false;
        this.showToast('Teste enviado para o painel publico.', 'success');
      })
      .catch((err) => {
        this.isTestingPanel = false;
        console.error('Erro ao testar painel publico:', err);
        this.showToast('Nao foi possivel testar o painel publico.', 'error');
      });
  }

  getPendingCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => !q.isCalled).length;
  }

  getCalledCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => q.isCalled).length;
  }

  private playCallSound(): void {
    try {
      this.callSound.currentTime = 0;
      this.callSound.play().catch(err => {
        console.warn('Nao foi possivel tocar o som:', err.message);
      });
    } catch (err) {
      console.warn('Erro ao tocar som:', err);
    }
  }

  private clearPublicHistory(): void {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection.invoke('ClearPublicHistory').catch(err => {
      console.warn('Nao foi possivel limpar historico da Public:', err);
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 3200);
  }

  private normalizeSearch(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
