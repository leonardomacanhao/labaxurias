import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5291/api';

  constructor(private http: HttpClient) {}

  // ===== MEDIUMS =====

  createMedium(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/catalog/mediums`, data);
  }

  getMediums(): Observable<any> {
    return this.http.get(`${this.baseUrl}/catalog/mediums`);
  }

  // ===== GUIDES =====

  createGuide(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/catalog/guides`, data);
  }

  getGuides(): Observable<any> {
    return this.http.get(`${this.baseUrl}/catalog/guides`);
  }

  // ===== QUEUE =====

  createQueueItem(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/queue`, data);
  }

  getQueueByGuide(guideId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/queue/guide/${guideId}`);
  }

  // ===== CALL =====

  callNext(guideId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/call/${guideId}`, {});
  }
}