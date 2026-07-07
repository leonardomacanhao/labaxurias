import { Component, OnInit } from '@angular/core';
import { SignalrService } from '../../services/signalr';

@Component({
  selector: 'app-public-screen',
  standalone: true,
  imports: [],
  templateUrl: './public-screen.html',
  styleUrl: './public-screen.css',
})
export class PublicScreen implements OnInit {

  currentClient = '';
  currentGuide = '';
  calledAt = '';

  constructor(private signalr: SignalrService) {}

  ngOnInit(): void {

    this.signalr.startConnection();

    this.signalr.onReceiveCall((data) => {

      console.log('📢 Nova chamada:', data);

      this.currentClient = data.clientName;
      this.currentGuide = data.guideName;
      this.calledAt = new Date().toLocaleTimeString();

    });

  }

}