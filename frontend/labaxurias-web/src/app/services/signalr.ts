import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection?: signalR.HubConnection;

  startConnection() {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('🟢 SignalR conectado'))
      .catch(err => console.error('🔴 Erro SignalR', err));

  }

  onReceiveCall(callback: (data: any) => void) {

    this.hubConnection?.on('ReceiveCall', callback);

  }

  onAnyCall(callback: (data: any) => void) {
  this.hubConnection?.on('ReceiveCall', callback);
}

}