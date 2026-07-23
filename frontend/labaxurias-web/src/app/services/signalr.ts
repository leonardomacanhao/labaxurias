import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export type SignalrStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection?: signalR.HubConnection;
  private callbacks: ((data: any) => void)[] = [];
  private startPromise?: Promise<void>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  readonly status$ = new BehaviorSubject<SignalrStatus>('disconnected');

  startConnection(asPublicPanel: boolean = false): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR ja conectado');
      return;
    }

    if (this.startPromise) {
      console.log('SignalR conectando');
      return;
    }

    if (!this.hubConnection) {
      this.createConnection(asPublicPanel);
    }

    this.status$.next('connecting');

    this.startPromise = this.hubConnection!
      .start()
      .then(() => {
        this.status$.next('connected');
        console.log('SignalR conectado');
      })
      .catch(err => {
        this.status$.next('disconnected');
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

  registerPublicPanel(): void {
    const connection = this.hubConnection;

    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    connection.invoke('RegisterPublicPanel').catch(err => {
      console.warn('Nao foi possivel registrar painel publico', err);
    });
  }

  onPublicPanelStatus(callback: (data: any) => void): void {
    if (!this.hubConnection) {
      this.createConnection();
    }

    this.hubConnection?.on('PublicPanelStatus', callback);
  }

  onClearPublicHistory(callback: () => void): void {
    if (!this.hubConnection) {
      this.createConnection();
    }

    this.hubConnection?.on('ClearPublicHistory', callback);
  }

  private createConnection(asPublicPanel: boolean = false): void {
    const url = asPublicPanel
      ? `${environment.signalRUrl}${environment.signalRUrl.includes('?') ? '&' : '?'}role=public`
      : environment.signalRUrl;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onclose(err => {
      this.status$.next('disconnected');
      console.warn('SignalR desconectado', err);
      this.scheduleReconnect();
    });

    this.hubConnection.onreconnecting(err => {
      this.status$.next('reconnecting');
      console.warn('SignalR reconectando', err);
    });

    this.hubConnection.onreconnected(() => {
      this.status$.next('connected');
      console.log('SignalR reconectado');
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
        this.status$.next('reconnecting');
        this.startConnection();
      }
    }, 3000);
  }
}
