import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-info.component.html',
  styleUrl: './header-info.component.css'
})
export class HeaderInfoComponent implements OnInit {
  currentTime: string = '';
  currentDate: string = '';

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }

  private updateDateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.currentDate = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
