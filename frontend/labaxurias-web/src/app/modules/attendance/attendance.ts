import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { SignalrService } from '../../services/signalr';

import { AttendanceCard } from './components/attendance-card/attendance-card';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    AttendanceCard
  ],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class Attendance implements OnInit {

  guides: any[] = [];

  constructor(
    private api: ApiService,
    private signalr: SignalrService
  ) {}

  ngOnInit(): void {

    this.loadGuides();

    this.signalr.startConnection();

    this.signalr.onAnyCall(() => {

      console.log('🔥 Atualizando filas');

      this.loadGuides();

    });

  }

  loadGuides() {

    this.api.getGuides().subscribe(guides => {

      this.guides = guides;

      this.guides.forEach((guide: any) => {

        this.api.getQueueByGuide(guide.id).subscribe(queue => {

          guide.queue = queue;

        });

      });

    });

  }

  callNext(guideId: string) {

    this.api.callNext(guideId).subscribe({

      next: () => {

        console.log("✅ Próximo chamado");

      },

      error: err => console.error(err)

    });

  }

}