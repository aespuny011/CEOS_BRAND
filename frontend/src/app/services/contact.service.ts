import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly apiUrl = 'http://localhost:8080/api/contact';

  constructor(private http: HttpClient) {}

  sendMessage(payload: ContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, payload, { withCredentials: true });
  }
}
