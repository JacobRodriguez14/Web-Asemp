import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportesCobrosService } from '../../../../core/services/reportes.cobros.service';
import { ClientesService } from '../../../../core/services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes-cobros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.cobros.html',
  styleUrls: ['./reportes.cobros.css']
})
export class ReportesCobrosComponent implements OnInit {

  filtro = {
    Mes: new Date().getMonth() + 1,
    Anio: new Date().getFullYear(),
    ClienteId: 0,
    Tipo: 'PENDIENTES'
  };

  meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];

  tipos = [
    { id: 'PENDIENTES', nombre: 'Pendientes' },
    { id: 'PAGADOS', nombre: 'Pagados' },
    { id: 'ATRASADOS', nombre: 'Atrasados' }
  ];

  clientes: any[] = [];
  lista: any[] = [];

  constructor(
    private reporteService: ReportesCobrosService,
    private clienteService: ClientesService
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.buscar();
  }

  cargarClientes() {
    this.clienteService.getLista().subscribe((r: any[]) => {
      this.clientes = r;
    });
  }

  buscar() {
    this.reporteService.obtenerLista(this.filtro).subscribe((r: any[]) => {
      this.lista = r;
    });
  }
/*
  descargarExcel() {
    this.reporteService.descargarExcel(this.filtro).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Cobros.xlsx';
      a.click();
    });
  }*/


    mostrarVistaPreviaExcel(datos: any[]) {
  const htmlPreview = `
    <div style="max-height:400px; overflow:auto; text-align:left;">
      <h4>Vista previa del Excel</h4>

      <table style="width:100%; border-collapse: collapse; font-size:12px;">
        <thead>
          <tr style="background:#e8e8e8; font-weight:bold;">
            <th>Cliente</th>
            <th>RFC</th>
            <th>Mes</th>
            <th>Año</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Folio</th>
            <th>Fecha Pago</th>
          </tr>
        </thead>
        <tbody>
          ${datos.slice(0, 20).map(item => `
            <tr>
              <td>${item.cliente}</td>
              <td>${item.rfc}</td>
              <td>${item.mes}</td>
              <td>${item.anio}</td>
              <td>${item.total}</td>
              <td>${item.estadoPago}</td>
              <td>${item.folio}</td>
              <td>${item.fechaPago ?? ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <small style="color:#888;">Mostrando primeros 20 registros…</small>
    </div>
  `;

  Swal.fire({
    title: 'Vista previa del Excel',
    html: htmlPreview,
    width: "80%",
    showCancelButton: true,
    confirmButtonText: 'Descargar Excel',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      this.descargarExcelReal();
    }
  });
}
descargarExcel() {
  if (!this.lista || this.lista.length === 0) {
    Swal.fire("Sin datos", "No hay información para exportar.", "warning");
    return;
  }

  // Mostrar vista previa antes de descargar
  this.mostrarVistaPreviaExcel(this.lista);
}
descargarExcelReal() {
  this.reporteService.descargarExcel(this.filtro).subscribe((blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Reporte_Cobros.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  });
}


  /*descargarPdf() {
    this.reporteService.descargarPdf(this.filtro).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Cobros.pdf';
      a.click();
    });
  }*/

private verPDF(blob: Blob) {
  const url = URL.createObjectURL(blob);

  Swal.fire({
    title: 'Vista previa del PDF',
    html: `<iframe src="${url}" width="100%" height="600px"></iframe>`,
    width: '80%',
    showConfirmButton: true,
    didClose: () => URL.revokeObjectURL(url)
  });
}
descargarPdf() {
  this.reporteService.descargarPdf(this.filtro).subscribe((blob: Blob) => {
    this.verPDF(blob);
  });
}



}
