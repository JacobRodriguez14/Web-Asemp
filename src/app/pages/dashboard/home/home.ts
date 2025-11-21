import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SatService } from '../../../core/services/sat.service';

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

  constructor(private satService: SatService) {}

  ngOnInit(): void {
    this.cargarDatosDashboard();
    window.addEventListener('scroll', this.handleScroll);
  }

  handleScroll = (): void => {
    const banner = document.querySelector('.hero-image') as HTMLElement;
    if (banner) {
      const offset = window.scrollY * 0.3;
      banner.style.transform = `translateY(${offset * 0.2}px) scale(1.1)`;
    }
  };

  cargarDatosDashboard(): void {
    this.satService.getSolicitudes().subscribe({
      next: (data: any[]) => {

        this.totalSolicitudes = data.length;

        this.descargasExitosas = data.filter(s => s.estado_solicitud === 3).length;

        this.solicitudesPendientes = data.filter(s => s.estado_solicitud === 1).length;

        this.erroresSat = data.filter(s => s.estado_solicitud === 0 || s.estado_solicitud === 4).length;

        this.ultimasSolicitudes = data
          .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
          .slice(0, 5);
      },
      error: (err: any) => console.error('Error cargando solicitudes:', err)
    });
  }

}
