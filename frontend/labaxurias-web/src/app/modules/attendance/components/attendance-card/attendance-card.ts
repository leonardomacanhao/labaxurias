import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QueueItem } from '../../../../models/queue-item';

@Component({
  selector: 'app-attendance-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './attendance-card.html',
  styleUrl: './attendance-card.css',
})
export class AttendanceCard {

  @Input() guideName = '';

  @Input() queue: QueueItem[] = [];

  @Output() callNext = new EventEmitter<void>();

}