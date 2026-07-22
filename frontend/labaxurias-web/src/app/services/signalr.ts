import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection?: signalR.HubConnection;

  private callbacks: ((data: any) => void)[] = [];

  startConnection() {

    if (this.hubConnection) {
      console.log('🟡 SignalR já iniciado');
      return;
    }


    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl)
      .withAutomaticReconnect()
      .build();


    this.hubConnection.on(
      'ReceiveCall',
      (data: any) => {

        console.log('📡 SignalR recebeu chamada:', data);


        this.callbacks.forEach(callback => {
          callback(data);
        });

      }
    );


    this.hubConnection
      .start()
      .then(() => {
        console.log('🟢 SignalR conectado');
      })
      .catch(err => {
        console.error('🔴 Erro SignalR', err);
      });

  }


  onReceiveCall(callback: (data:any)=>void) {

    this.callbacks.push(callback);

  }


  onAnyCall(callback: (data:any)=>void) {

    this.callbacks.push(callback);

  }

}