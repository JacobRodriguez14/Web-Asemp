import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SatService } from '../../../core/services/sat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  totalSolicitudes = 0;
  descargasExitosas = 0;
  solicitudesPendientes = 0;
  erroresSat = 0;
  ultimasSolicitudes: any[] = [];

  rol: string | null = null;

  constructor(
    private satService: SatService,
    private auth: AuthService
  ) { }

  ngOnInit(): void {
    this.rol = this.auth.getRol();

    if (this.rol !== 'Cliente') {
      this.cargarDatosDashboard();
    }
  }

 cargarDatosDashboard(): void {
  this.satService.getSolicitudes().subscribe({
    next: (data: any[]) => {

      // === CONTADORES ===
      this.totalSolicitudes = data.length;

      this.descargasExitosas = data.filter(s => s.estado_solicitud === 3).length;

      this.solicitudesPendientes = data.filter(s =>
        s.estado_solicitud === 1 || s.estado_solicitud === 2
      ).length;

      this.erroresSat = data.filter(s =>
        s.estado_solicitud === 0 ||
        s.estado_solicitud === 4 ||
        s.estado_solicitud === 5 ||
        s.estado_solicitud === 6
      ).length;

      // === ÚLTIMAS 5 SOLICITUDES ===
      this.ultimasSolicitudes = data
        .sort((a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime()
        )
        .slice(0, 5);
    },
    error: (err) => console.error('Error cargando solicitudes:', err)
  });
}


  // ===== Mismo método que usas en el SAT =====
  getEstadoTexto(estado: number): string {
    switch (estado) {
      case 0: return 'Creada';
      case 1: return 'Pendiente';
      case 2: return 'En proceso';
      case 3: return 'Correcta';
      case 4: return 'Error';
      case 5: return 'Rechazada';
      case 6: return 'Vencida';
      default: return '—';
    }
  }

}
