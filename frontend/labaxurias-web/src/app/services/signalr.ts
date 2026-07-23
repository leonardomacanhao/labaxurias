import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection?: signalR.HubConnection;
  private callbacks: ((data: any) => void)[] = [];
  private startPromise?: Promise<void>;
  private retryTimer?: ReturnType<typeof setTimeout>;

  startConnection(): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR ja conectado');
      return;
    }

    if (this.startPromise) {
      console.log('SignalR conectando');
      return;
    }

    if (!this.hubConnection) {
      this.createConnection();
    }

    this.startPromise = this.hubConnection!
      .start()
      .then(() => {
        console.log('SignalR conectado');
      })
      .catch(err => {
        console.error('Erro SignalR', err);
        this.scheduleReconnect();
      })
      .finally(() => {
        this.startPromise = undefined;
      });
  }

  onReceiveCall(callback: (data: any) => void): void {
    this.callbacks.push(callback);
  }

  onAnyCall(callback: (data: any) => void): void {
    this.callbacks.push(callback);
  }

  private createConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onclose(err => {
      console.warn('SignalR desconectado', err);
      this.scheduleReconnect();
    });

    this.hubConnection.on('ReceiveCall', (data: any) => {
      console.log('SignalR recebeu chamada:', data);
      this.callbacks.forEach(callback => callback(data));
    });
  }

  private scheduleReconnect(): void {
    if (this.retryTimer) {
      return;
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;

      if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
        this.startConnection();
      }
    }, 3000);
  }
}
