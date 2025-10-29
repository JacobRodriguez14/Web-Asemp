// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';                    // 👈 Necesario para que Angular reconozca el servicio
import { HttpClient } from '@angular/common/http';             // 👈 Cliente HTTP para peticiones al backend
import { environment } from '../../../environments/environment'; // 👈 Contiene la URL base de la API
import { tap } from 'rxjs/operators';

// 👇 Esta línea es OBLIGATORIA: indica que el servicio se puede inyectar globalmente
@Injectable({ providedIn: 'root' })
export class AuthService {                                     // 👈 Asegúrate de que diga exactamente "export class AuthService"
  private api = `${environment.apiUrl}/api/auth`;                  // 👈 Base URL: https://localhost:7183/api/auth

  constructor(private http: HttpClient) {}                     // 👈 Angular inyecta el cliente HTTP aquí

  // --- LOGIN ---
  login(credenciales: { usuario: string; contrasena: string }) {
    return this.http
      .post<{ token: string; usuario: string; rol: string }>(  // 👈 Petición POST al endpoint /api/auth/login
        `${this.api}/login`,
        credenciales
      )
      .pipe(
        tap((res) => {
          // Guarda los datos devueltos por la API en localStorage
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', res.usuario);
          localStorage.setItem('rol', res.rol);
        })
      );
  }

  // --- PERFIL ---
  getPerfil() {                                                // 👈 Método que faltaba: obtiene los datos del usuario logueado
    return this.http.get<{ id: number; usuario: string; rol: string }>(
      `${this.api}/me`                                         // 👈 Endpoint GET /api/auth/me (requiere token)
    );
  }

  // --- LOGOUT ---
  logout() {                                                   // 👈 Elimina token y datos guardados
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
  }

  // --- TOKEN ---
  get token() {                                                // 👈 Getter: devuelve el token actual (si existe)
    return localStorage.getItem('token');
  }

  // --- ESTADO ---
  get estaAutenticado(): boolean {                             // 👈 Retorna true si existe token (usuario logueado)
    return !!this.token;
  }
}
