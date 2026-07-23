import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
export class GiraComponent implements OnInit {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  selectedDate: string = '';
  sessionEntities: SessionEntity[] = [];
  searchTerm: string = '';
  showMobileSearch: boolean = false;
  private hubConnection: signalR.HubConnection | null = null;
  private callSound: HTMLAudioElement;

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

    // Recarregar dados quando a janela ganhar foco
    window.addEventListener('focus', () => {
      console.log('🔄 Recarregando dados ao focar na janela');
      this.loadSessionData();
    });
  }

  openCalendar(): void {
    this.dateInput.nativeElement.showPicker();
  }

  onDateChange(): void {
    console.log('📅 Data alterada para:', this.selectedDate);
    this.datePreference.setSelectedDate(this.selectedDate);
    this.loadSessionData();
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

  private normalizeSearch(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  loadSessionData(): void {
    console.log('🔄 Carregando dados para data:', this.selectedDate);

    this.api.getSessionByDate(this.selectedDate).subscribe({
      next: (data) => {
        console.log('✅ Dados carregados:', data);

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
      error: (err) => console.error('❌ Erro ao carregar sessão:', err)
    });
  }

  setupSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('✅ Conectado ao SignalR'))
      .catch(err => console.error('❌ Erro ao conectar SignalR:', err));

    this.hubConnection.on('ReceiveCall', (data: any) => {
      console.log('📢 Chamada recebida:', data);
      this.loadSessionData();
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

  callNext(sessionEntity: SessionEntity): void {
    console.log('🔔 Chamando próximo da entidade:', sessionEntity.entityName);
    this.playCallSound();

    this.api.callNextBySessionEntity(sessionEntity.sessionEntityId).subscribe({
      next: (data) => {
        console.log('✅ Próximo chamado:', data);
        setTimeout(() => this.loadSessionData(), 500);
      },
      error: (err) => {
        console.error('❌ Erro ao chamar próximo:', err);

        if (err.status === 404) {
          alert('Não há mais consulentes na fila!');
        }
      }
    });
  }

  callQueueItem(queueItem: QueueItem): void {
    console.log(queueItem.isCalled ? '🔔 Repetindo chamada:' : '🔔 Chamando consulente:', queueItem.name);
    this.playCallSound();

    this.api.repeatCall(queueItem.id).subscribe({
      next: (data) => {
        console.log('✅ Chamada enviada:', data);
        setTimeout(() => this.loadSessionData(), 500);
      },
      error: (err) => console.error('❌ Erro ao chamar consulente:', err)
    });
  }

  getPendingCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => !q.isCalled).length;
  }

  getCalledCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => q.isCalled).length;
  }
}
