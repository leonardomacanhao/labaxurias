import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  // =========================
  // Mediums
  // =========================

  getMediums(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/catalog/mediums`, { headers: this.getHeaders() });
  }

  createMedium(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/catalog/mediums`, data, { headers: this.getHeaders() });
  }

  updateMedium(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/catalog/mediums/${id}`, data, { headers: this.getHeaders() });
  }

  deleteMedium(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/catalog/mediums/${id}`, { headers: this.getHeaders() });
  }

  // =========================
  // Guides
  // =========================

  getGuides(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/catalog/guides`, { headers: this.getHeaders() });
  }

  getGuidesByMediumId(mediumId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/catalog/guides/medium/${mediumId}`,
      { headers: this.getHeaders() }
    );
  }

  createGuide(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/catalog/guides`, data, { headers: this.getHeaders() });
  }

  updateGuide(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/catalog/guides/${id}`, data, { headers: this.getHeaders() });
  }

  deleteGuide(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/catalog/guides/${id}`, { headers: this.getHeaders() });
  }

  // =========================
  // Queue
  // =========================

  createQueueItem(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/attendance/queue`, data, { headers: this.getHeaders() });
  }

  getQueueByGuide(guideId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/attendance/queue/guide/${guideId}`,
      { headers: this.getHeaders() }
    );
  }

  // =========================
  // Calls
  // =========================

  callNext(guideId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/${guideId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  callNextBySessionEntity(sessionEntityId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/session-entity/${sessionEntityId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  repeatCall(queueItemId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/queue-item/${queueItemId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  testPublicPanel(): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/attendance/call/test`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // =========================
  // Sessions
  // =========================

  getSessionByDate(date: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/session/${date}`, { headers: this.getHeaders() });
  }

  saveSession(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/session`, data, { headers: this.getHeaders() });
  }

  // =========================
  // Reports
  // =========================

  getAttendanceReport(date: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/report/attendance/${date}`,
      { headers: this.getHeaders() }
    );
  }

  getRegistrationReport(date: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/report/registration/${date}`,
      { headers: this.getHeaders() }
    );
  }

  getCambonesReport(date: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/report/cambones/${date}`, { headers: this.getHeaders() });
  }

  // =========================
  // Admin Users
  // =========================

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/users`, { headers: this.getHeaders() });
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/users`, data, { headers: this.getHeaders() });
  }

  updateUser(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/users/${data.id}`, data, { headers: this.getHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/users/${id}`, { headers: this.getHeaders() });
  }
}
