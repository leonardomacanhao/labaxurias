import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class Attendance implements OnInit {

  guides: any[] = [];
  selectedGuideId: string | null = null;
  queue: any[] = [];

  //constructor(private api: ApiService) {}
  constructor(
  private api: ApiService,
  private signalr: SignalrService
) {}

 ngOnInit(): void {
  this.loadGuides();

  this.signalr.startConnection();

this.signalr.onAnyCall(() => {
  console.log('🔥 EVENTO RECEBIDO NO FRONT');

  this.loadQueue();
});
}

  loadGuides() {
    this.api.getGuides().subscribe(data => {
      this.guides = data;
    });
  }

  selectGuide(guideId: string) {
    this.selectedGuideId = guideId;
    this.loadQueue();
  }

  loadQueue() {
    if (!this.selectedGuideId) return;

    this.api.getQueueByGuide(this.selectedGuideId).subscribe(data => {
      this.queue = data;
    });
  }

  callNext() {
    if (!this.selectedGuideId) return;

    this.api.callNext(this.selectedGuideId).subscribe(() => {
      this.loadQueue();
    });
  }
}