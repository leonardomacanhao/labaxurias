import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueItem } from '../../public.component';

@Component({
  selector: 'app-queue-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue-panel.component.html',
  styleUrl: './queue-panel.component.css'
})
export class QueuePanelComponent {
  @Input() queueItems: QueueItem[] = [];
}
