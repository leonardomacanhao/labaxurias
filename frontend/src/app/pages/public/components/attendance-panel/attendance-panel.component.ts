import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueItem } from '../../public.component';

@Component({
  selector: 'app-attendance-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-panel.component.html',
  styleUrl: './attendance-panel.component.css'
})
export class AttendancePanelComponent {
  @Input() currentAttendance: QueueItem | null = null;
}
