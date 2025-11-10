import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SatService } from '../../../core/services/sat.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  templateUrl: './sat.html',
  imports: [CommonModule, FormsModule]
})
export class SatComponent implements OnInit {
  solicitudes: any[] = [];
  clientes: any[] = [];
  form: any = {};
  cargando = false;

  constructor(private satService: SatService, private http: HttpClient) {}

  ngOnInit() {
    this.cargarSolicitudes();
    this.cargarClientes();
  }

  // 🔹 Clientes disponibles
  cargarClientes() {
    this.http.get(`${environment.apiUrl}/clientes/lista`).subscribe({
      next: (data: any) => (this.clientes = data),
      error: () => Swal.fire('Error', 'No se pudieron cargar los clientes', 'error')
    });
  }

  // 🔹 Solicitudes actuales
  cargarSolicitudes() {
    this.cargando = true;
    this.satService.getSolicitudes().subscribe({
      next: (data: any) => {
        this.solicitudes = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar las solicitudes', 'error');
      }
    });
  }

  // 🔹 Crear solicitud (con conexión SAT)
  crearSolicitud() {
    if (!this.form.cliente_id || !this.form.tipo_solicitud || !this.form.fecha_inicio || !this.form.fecha_fin) {
      Swal.fire('Advertencia', 'Debe completar todos los campos', 'warning');
      return;
    }

    this.cargando = true;
    this.satService.crearSolicitud(this.form).subscribe({
      next: () => {
        this.cargarSolicitudes();
        this.cargando = false;
        Swal.fire('Éxito', 'Solicitud creada y enviada al SAT correctamente', 'success');
      },
      error: (e) => {
        this.cargando = false;
        console.error(e);
        Swal.fire('Error', 'Error creando la solicitud', 'error');
      }
    });
  }

  // 🔹 Verificar solicitud
  verificar(id: number) {
    this.cargando = true;
    this.satService.verificarSolicitud(id).subscribe({
      next: () => {
        this.cargarSolicitudes();
        this.cargando = false;
        Swal.fire('Verificación completada', 'Solicitud verificada con el SAT', 'success');
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo verificar la solicitud', 'error');
      }
    });
  }

  // 🔹 Descargar paquete
  descargar(id: number) {
    this.cargando = true;
    this.satService.descargarPaquete(id).subscribe({
      next: (data: any) => {
        this.cargando = false;
        Swal.fire('Descarga completada', data.mensaje || 'Los archivos se generaron correctamente', 'success');
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo descargar el paquete', 'error');
      }
    });
  }
}
