import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueItem } from '../../models/queue-item.model';

@Component({
  selector: 'app-attendance-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-panel.component.html',
  styleUrl: './attendance-panel.component.css'
})
export class AttendancePanelComponent implements OnChanges {
  @Input() currentAttendance: QueueItem | null = null;
  @Input() nextInQueue: QueueItem | null = null;
  isBlinking: boolean = false;
  private blinkTimeout: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentAttendance'] && this.currentAttendance) {
      this.isBlinking = true;
      if (this.blinkTimeout) clearTimeout(this.blinkTimeout);
      this.blinkTimeout = setTimeout(() => { this.isBlinking = false; }, 7000);
    }
  }
}
