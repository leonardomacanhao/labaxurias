import { Component, OnInit } from '@angular/core';
import { SignalrService } from '../../services/signalr';

@Component({
  selector: 'app-public-screen',
  imports: [],
  templateUrl: './public-screen.html',
  styleUrl: './public-screen.css',
})
export class PublicScreen implements OnInit {

  lastCall: any = null;

  constructor(private signalr: SignalrService) {}

  ngOnInit(): void {

    this.signalr.startConnection();

    this.signalr.onReceiveCall((data) => {

      console.log('📢 Nova chamada:', data);

      this.lastCall = data;

    });

  }

}