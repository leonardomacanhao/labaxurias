import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AttendancePanelComponent } from './components/attendance-panel/attendance-panel.component';
import { QueuePanelComponent } from './components/queue-panel/queue-panel.component';
import { HeaderInfoComponent } from './components/header-info/header-info.component';
import { SignalRService } from '../../services/signalr.service';

export interface QueueItem {
  id: string;
  name: string;
  entityName: string;
  entityId: string;
  status: 'AGUARDANDO' | 'CHAMADO' | 'ATENDENDO' | 'FINALIZADO';
  calledAt?: string;
}

export interface AttendanceData {
  current: QueueItem | null;
  queue: QueueItem[];
}

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [
    CommonModule,
    AttendancePanelComponent,
    QueuePanelComponent,
    HeaderInfoComponent
  ],
  templateUrl: './public.component.html',
  styleUrl: './public.component.css'
})
export class PublicComponent implements OnInit, OnDestroy {
  attendanceData: AttendanceData = {
    current: null,
    queue: []
  };
  
  private signalRSubscription: Subscription | null = null;

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.signalRSubscription = this.signalRService.attendanceUpdate$.subscribe(
      (data: any) => {
        console.log('📡 Dados recebidos no PublicComponent:', data);
        this.handleCallUpdate(data);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.signalRSubscription) {
      this.signalRSubscription.unsubscribe();
    }
  }

  private handleCallUpdate(data: any): void {
    if (data.clientName && data.guideName) {
      this.attendanceData.current = {
        id: data.guideId || 'unknown',
        name: data.clientName,
        entityName: data.guideName,
        entityId: data.guideId || 'unknown',
        status: 'CHAMADO',
        calledAt: data.calledAt
      };
      
      console.log('✅ Atualização aplicada:', this.attendanceData.current);
    }
  }
}
