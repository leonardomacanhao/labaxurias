import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ApiService } from '../../services/api.service';
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
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './gira.component.html',
  styleUrl: './gira.component.css'
})
export class GiraComponent implements OnInit {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;
  
  selectedDate: string = '';
  sessionEntities: SessionEntity[] = [];
  private hubConnection: signalR.HubConnection | null = null;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Tentar recuperar a data do localStorage, senão usar hoje
    const savedDate = localStorage.getItem('gira_selected_date');
    if (savedDate) {
      this.selectedDate = savedDate;
    } else {
      const today = new Date();
      this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    this.loadSessionData();
    this.setupSignalR();
  }

  openCalendar(): void { 
    this.dateInput.nativeElement.showPicker(); 
  }
  
  onDateChange(): void {
    console.log('📅 Data alterada para:', this.selectedDate);
    localStorage.setItem('gira_selected_date', this.selectedDate);
    this.loadSessionData();
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
            name: qi.name,
            isCalled: qi.isCalled || false,
            calledAt: qi.calledAt || undefined
          }))
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar sessão:', err)
    });
  }

  setupSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5291/hubs/call')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('✅ Conectado ao SignalR'))
      .catch(err => console.error(' Erro ao conectar SignalR:', err));

    this.hubConnection.on('ReceiveCall', (data: any) => {
      console.log('📢 Chamada recebida:', data);
      
      // Marcar o consulente como chamado
      const entity = this.sessionEntities.find(e => e.sessionEntityId === data.sessionEntityId);
      if (entity) {
        const queueItem = entity.queueItems.find(q => q.id === data.queueItemId);
        if (queueItem) {
          queueItem.isCalled = true;
          queueItem.calledAt = data.calledAt;
          this.cdr.detectChanges();
        }
      }
    });
  }

  callNext(sessionEntity: SessionEntity): void {
    this.api.callNextBySessionEntity(sessionEntity.sessionEntityId).subscribe({
      next: (data) => {
        console.log('✅ Próximo chamado:', data);
        // O SignalR vai atualizar automaticamente
      },
      error: (err) => {
        console.error('❌ Erro ao chamar próximo:', err);
        if (err.status === 404) {
          alert('Não há mais consulentes na fila!');
        }
      }
    });
  }

  repeatCall(queueItem: QueueItem): void {
    this.api.repeatCall(queueItem.id).subscribe({
      next: (data) => {
        console.log('✅ Chamada repetida:', data);
      },
      error: (err) => console.error('❌ Erro ao repetir chamada:', err)
    });
  }

  getPendingCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => !q.isCalled).length;
  }

  getCalledCount(sessionEntity: SessionEntity): number {
    return sessionEntity.queueItems.filter(q => q.isCalled).length;
  }
}
