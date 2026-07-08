import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Guide } from '../models/guide';
import { Medium } from '../models/medium';
import { QueueItem } from '../models/queue-item';
import { Call } from '../models/call';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly baseUrl = 'http://localhost:5291/api';

  constructor(private http: HttpClient) {}

  // Mediums

  createMedium(data: Partial<Medium>): Observable<Medium> {
    return this.http.post<Medium>(
      `${this.baseUrl}/catalog/mediums`,
      data
    );
  }

  getMediums(): Observable<Medium[]> {
    return this.http.get<Medium[]>(
      `${this.baseUrl}/catalog/mediums`
    );
  }

  // Guides

  createGuide(data: Partial<Guide>): Observable<Guide> {
    return this.http.post<Guide>(
      `${this.baseUrl}/catalog/guides`,
      data
    );
  }

  getGuides(): Observable<Guide[]> {
    return this.http.get<Guide[]>(
      `${this.baseUrl}/catalog/guides`
    );
  }

  // Queue

  createQueueItem(data: Partial<QueueItem>): Observable<QueueItem> {
    return this.http.post<QueueItem>(
      `${this.baseUrl}/attendance/queue`,
      data
    );
  }

  getQueueByGuide(guideId: string): Observable<QueueItem[]> {
    return this.http.get<QueueItem[]>(
      `${this.baseUrl}/attendance/queue/guide/${guideId}`
    );
  }

  // Calls

  callNext(guideId: string): Observable<Call> {
    return this.http.post<Call>(
      `${this.baseUrl}/attendance/call/${guideId}`,
      {}
    );
  }

}