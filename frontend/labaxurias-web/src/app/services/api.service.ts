import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:5291/api';

  constructor(private http: HttpClient) {}

  // =========================
  // Mediums
  // =========================

  getMediums(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/catalog/mediums`);
  }

  createMedium(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/catalog/mediums`, data);
  }

  updateMedium(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/catalog/mediums/${id}`, data);
  }

  deleteMedium(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/catalog/mediums/${id}`);
  }

  // =========================
  // Guides
  // =========================

  getGuides(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/catalog/guides`);
  }

  getGuidesByMediumId(mediumId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/catalog/guides/medium/${mediumId}`
    );
  }

  createGuide(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/catalog/guides`, data);
  }

  updateGuide(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/catalog/guides/${id}`, data);
  }

  deleteGuide(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/catalog/guides/${id}`);
  }

  // =========================
  // Queue
  // =========================

  createQueueItem(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/attendance/queue`, data);
  }

  getQueueByGuide(guideId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/attendance/queue/guide/${guideId}`
    );
  }

  // =========================
  // Calls
  // =========================

  callNext(guideId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/${guideId}`,
      {}
    );
  }

  callNextBySessionEntity(sessionEntityId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/session-entity/${sessionEntityId}`,
      {}
    );
  }

  repeatCall(queueItemId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/queue-item/${queueItemId}`,
      {}
    );
  }

  // =========================
  // Sessions
  // =========================

  getSessionByDate(date: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/session/${date}`);
  }

  saveSession(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/session`, data);
  }

  // =========================
  // Reports
  // =========================

  getAttendanceReport(date: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/report/attendance/${date}`
    );
  }

  getRegistrationReport(date: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/report/registration/${date}`
    );
  }
}