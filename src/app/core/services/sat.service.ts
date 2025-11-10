// sat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SatService {
  private solicitudesUrl = `${environment.apiUrl}/solicitudessat`;
  private descargasUrl = `${environment.apiUrl}/api/sat/descargas`; // este sí está bien

  constructor(private http: HttpClient) {}

  // 🔹 Obtener lista de solicitudes
  getSolicitudes(): Observable<any> {
    return this.http.get(`${this.solicitudesUrl}/lista`);
  }

  // 🔹 Crear nueva solicitud
  crearSolicitud(payload: any): Observable<any> {
    return this.http.post(`${this.solicitudesUrl}/registrar`, payload);
  }

  // 🔹 Verificar una solicitud existente
  verificarSolicitud(id: number): Observable<any> {
    return this.http.post(`${this.solicitudesUrl}/${id}/verificar`, {});
  }

  // 🔹 Descargar paquete SAT
  descargarPaquete(id: number): Observable<any> {
    return this.http.post(`${this.descargasUrl}/${id}/descargar`, {});
  }
}
