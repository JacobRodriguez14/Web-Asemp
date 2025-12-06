import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableroIvaService } from '../../../../core/services/tablero-iva.service';
import { TableroIva } from '../../../../core/models/tablero-iva.model';
import { ClientesService, ClienteLista } from '../../../../core/services/clientes.service';
import { Chart, ChartConfiguration, registerables, DoughnutControllerChartOptions } from 'chart.js';



// NUEVOS
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Antes
// import * as XLSX from 'xlsx';

// Después
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { IvaXmlDetalle, TableroIvaConDetalle } from '../../../../core/models/tablero-iva-detalle.model';

@Component({
  selector: 'app-tablero-iva',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './tablero-iva.component.html',
  styleUrls: ['./tablero-iva.component.css']
})
export class TableroIvaComponent implements OnInit, AfterViewInit, OnDestroy {

  // Variables para el buscador de cliente
  clienteId: number | null = null;
  clienteNombre: string = '';
  clientes: ClienteLista[] = []; // Lista completa de clientes
  clientesFiltrados: ClienteLista[] = []; // Clientes filtrados
  mostrarSugerencias: boolean = false;
  clienteSeleccionado: ClienteLista | null = null;

  // Variables para fecha
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  // Variables de estado
  cargando = false;
  error: string | null = null;
  tablero: TableroIva | null = null;
  
  // Variables para gráficas
  chartMax = 0;
  chartData: any = null;
  chartInstance: Chart | null = null;
  porcentajeCausado = 0;
  porcentajeAcreditable = 0;

  // Referencia a la gráfica
  @ViewChild('pieChart') pieChart!: ElementRef<HTMLCanvasElement>;

  // Timer para manejar blur
  private blurTimer: any = null;

  // Meses para el select
  meses = [
    { id: 1, nombre: "Enero" }, { id: 2, nombre: "Febrero" }, { id: 3, nombre: "Marzo" },
    { id: 4, nombre: "Abril" }, { id: 5, nombre: "Mayo" }, { id: 6, nombre: "Junio" },
    { id: 7, nombre: "Julio" }, { id: 8, nombre: "Agosto" }, { id: 9, nombre: "Septiembre" },
    { id: 10, nombre: "Octubre" }, { id: 11, nombre: "Noviembre" }, { id: 12, nombre: "Diciembre" }
  ];

  constructor(
    private tableroSvc: TableroIvaService,
    private clientesSvc: ClientesService
  ) {
    Chart.register(...registerables);
  }






  

  ngOnInit() {
    // Cargar lista de clientes al iniciar
    this.cargarClientes();
    
    // Cargar último cliente consultado si existe
    const clienteGuardado = localStorage.getItem('ultimoClienteConsultado');
    if (clienteGuardado) {
      try {
        this.clienteSeleccionado = JSON.parse(clienteGuardado);
        this.clienteNombre = this.clienteSeleccionado!.razon_social;
        this.clienteId = this.clienteSeleccionado!.id;
      } catch (e) {
        console.error('Error al cargar cliente guardado', e);
      }
    }
  }

  ngAfterViewInit() {
    // Inicialización de Chart.js se hará cuando haya datos
  }

  
//=============================================================================================

//TABLERO
// TABLERO
// TABLERO DETALLE (para exportar)
tableroDetalle: TableroIva | null = null;
detalleIva: IvaXmlDetalle[] = [];


// Carga resumen + detalle de XML para exportar
async cargarDetalle(): Promise<void> {
  if (!this.clienteId) return;

  return new Promise<void>((resolve, reject) => {
    this.tableroSvc
      .obtenerConDetalle(this.clienteId!, this.anio, this.mes)
      .subscribe({
        next: (resp: TableroIvaConDetalle) => {
          this.tableroDetalle = resp.resumen;
          this.detalleIva = resp.detalleXml;
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar detalle IVA:', err);
          reject(err);
        }
      });
  });
}

async exportarPDF() {
  if (!this.clienteId || !this.anio || !this.mes) return;

  await this.cargarDetalle();

  const doc = new jsPDF("p", "mm", "letter");

  // ===========================
  // ENCABEZADO BONITO
  // ===========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("Reporte IVA Detallado", 105, 18, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(70, 130, 180);
  doc.setLineWidth(0.7);
  doc.line(20, 22, 195, 22);

  // Datos del contribuyente
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");

  doc.text("Cliente:", 20, 35);
  doc.setFont("helvetica", "bold");
  doc.text(`${this.clienteSeleccionado?.razon_social ?? ""}`, 50, 35);

  doc.setFont("helvetica", "normal");
  doc.text("RFC:", 20, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`${this.tableroDetalle?.rfc ?? ""}`, 50, 42);

  doc.setFont("helvetica", "normal");
  doc.text("Periodo:", 20, 49);
  doc.setFont("helvetica", "bold");
  doc.text(`${this.getNombreMes(this.mes)} ${this.anio}`, 50, 49);

  let startY = 58;

  // ===========================
  // TABLA DEL TABLERO CON COLORES
  // ===========================
  const resumenHead = [["Concepto", "PUE", "PPD", "Total"]];
  const resumenBody = [
    [
      "IVA Causado",
      (this.tablero?.ivaCausado?.pue ?? 0).toFixed(2),
      (this.tablero?.ivaCausado?.ppd ?? 0).toFixed(2),
      (this.tablero?.ivaCausado?.total ?? 0).toFixed(2),
    ],
    [
      "IVA Acreditable",
      (this.tablero?.ivaAcreditable?.pue ?? 0).toFixed(2),
      (this.tablero?.ivaAcreditable?.ppd ?? 0).toFixed(2),
      (this.tablero?.ivaAcreditable?.total ?? 0).toFixed(2),
    ],
    ["IVA Neto", "", "", (this.tablero?.ivaAPagar ?? 0).toFixed(2)],
  ];

autoTable(doc, {
  startY,
  head: [['Concepto', 'PUE', 'PPD', 'Total']],
  body: resumenBody,

  styles: { 
    fontSize: 10,
    cellPadding: 3
  },

  // 🔵 Encabezado azul fuerte
  headStyles: { 
    fillColor: [30, 90, 180],  // azul fuerte
    textColor: 255,
    fontStyle: 'bold'
  },

  // 🎨 Colores de las filas como tu frontend
  didParseCell: (data) => {
    if (data.section === 'body') {
      if (data.row.index === 0) data.cell.styles.fillColor = [220, 235, 255];  // azul pastel
      if (data.row.index === 1) data.cell.styles.fillColor = [215, 244, 225];  // verde pastel
      if (data.row.index === 2) data.cell.styles.fillColor = [255, 230, 230];  // rosa pastel
    }
  }
});


  startY = (doc as any).lastAutoTable.finalY + 10;

  // ===========================
  // GRÁFICA DONUT CENTRADA
  // ===========================
if (this.chartInstance) {

  const img = this.chartInstance.toBase64Image();

  // Título centrado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Distribución del IVA", 105, startY, { align: "center" });

  // Tamaño de la gráfica
  const chartWidth = 60;
  const chartHeight = 60;
  const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;
  const chartY = startY + 5;

  // Insertar gráfica
  doc.addImage(img, "PNG", chartX, chartY, chartWidth, chartHeight);

  // ======================================================
  // 🔷 NÚMERO CENTRAL (SE MANTIENE)
  // ======================================================
  const totalCentral =
    (this.tablero?.ivaCausado.total ?? 0) +
    (this.tablero?.ivaAcreditable.total ?? 0);

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');

  doc.text(
    `MX$${totalCentral.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    chartX + chartWidth / 2,
    chartY + chartHeight / 2,
    { align: "center" }
  );

  // ======================================================
  // 🔵 PORCENTAJES A LA DERECHA (OPCIÓN B)
  // ======================================================

  const totalCausado = this.tablero?.ivaCausado.total ?? 0;
  const totalAcred = this.tablero?.ivaAcreditable.total ?? 0;
  const total = totalCausado + totalAcred;

  const p1 = total > 0 ? ((totalCausado / total) * 100).toFixed(1) : "0.0";
  const p2 = total > 0 ? ((totalAcred / total) * 100).toFixed(1) : "0.0";

  // Texto a la derecha
  const textX = chartX + chartWidth + 10;
  const textY1 = chartY + 10;
  const textY2 = chartY + 22;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  // IVA Causado (azul)
  doc.setTextColor(79, 158, 255);
  doc.text(`IVA Causado: ${p1}%`, textX, textY1);

  // IVA Acreditable (verde)
  doc.setTextColor(110, 231, 183);
  doc.text(`IVA Acreditable: ${p2}%`, textX, textY2);

  // Restaurar color negro
  doc.setTextColor(0, 0, 0);

  // Actualizar posición Y
  startY = chartY + chartHeight + 20;
}

  // ===========================
  // SALTO DE PÁGINA -> EMITIDOS
  // ===========================
  const emitidos = this.detalleIva.filter((x) => x.tipoMovimiento === "Emitido");

  doc.addPage();
  startY = 20;

  if (emitidos.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("COMPROBANTES EMITIDOS", 14, startY);
    startY += 6;

    autoTable(doc, {
      startY,
      head: [["UUID", "Tipo", "Método", "Emisor", "Receptor", "IVA", "Retenido", "Incluido"]],
      body: emitidos.map((x) => [
        x.uuid,
        x.tipoCfdi,
        x.metodoPago,
        x.rfcEmisor,
        x.rfcReceptor,
        x.ivaTrasladado,
        x.ivaRetenido,
        x.incluidoEnCalculo ? "Sí" : "No",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 144, 255] },
    });
  }

  // ===========================
  // SALTO DE PÁGINA -> RECIBIDOS
  // ===========================
  const recibidos = this.detalleIva.filter((x) => x.tipoMovimiento === "Recibido");

  doc.addPage();
  startY = 20;

  if (recibidos.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("COMPROBANTES RECIBIDOS", 14, startY);
    startY += 6;

    autoTable(doc, {
      startY,
      head: [["UUID", "Tipo", "Método", "Emisor", "Receptor", "IVA", "Retenido", "Incluido"]],
      body: recibidos.map((x) => [
        x.uuid,
        x.tipoCfdi,
        x.metodoPago,
        x.rfcEmisor,
        x.rfcReceptor,
        x.ivaTrasladado,
        x.ivaRetenido,
        x.incluidoEnCalculo ? "Sí" : "No",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 204, 113] },
    });
  }

  // ===========================
  // VISTA PREVIA
  // ===========================
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  Swal.fire({
    title: "Vista Previa del PDF",
    html: `<iframe src="${url}" width="100%" height="600px"></iframe>`,
    width: "80%",
    showConfirmButton: true,
  });
}
async descargarExcelReal() {
  if (!this.tableroDetalle || !this.detalleIva.length) return;

  const wb = XLSX.utils.book_new();
  const t = this.tableroDetalle;

  // ==========================
  // HOJA 1: RESUMEN BONITO
  // ==========================
  const resumen = [
    ['REPORTE IVA DETALLADO', '', '', ''],
    [],
    ['Cliente:', this.clienteSeleccionado?.razon_social ?? '', '', ''],
    ['RFC:', t.rfc, '', ''],
    ['Periodo:', `${this.getNombreMes(this.mes)} ${this.anio}`, '', ''],
    [],
    ['Concepto', 'PUE', 'PPD', 'Total'],
    ['IVA Causado', t.ivaCausado.pue, t.ivaCausado.ppd, t.ivaCausado.total],
    ['IVA Acreditable', t.ivaAcreditable.pue, t.ivaAcreditable.ppd, t.ivaAcreditable.total],
    ['IVA Neto', '', '', t.ivaAPagar],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumen);

  // Combinar título A1:D1
  wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  // Asegurar ref
  if (!wsResumen['!ref']) {
    wsResumen['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: resumen.length - 1, c: resumen[0].length - 1 }
    });
  }

  // Helper para estilos
  const set = (cell: any, style: any) => {
    if (cell) cell.s = style;
  };

  // Colores
  const azulHeader = '1F4E79';
  const azulSuave = 'E8F3FF';
  const verdeSuave = 'E6F6E6';
  const rosaSuave = 'FCE4EC';

  // Título A1:D1
  set(wsResumen['A1'], {
    font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: azulHeader } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });

  // Etiquetas “Cliente: / RFC: / Periodo:”
  ['A3', 'A4', 'A5'].forEach(addr =>
    set(wsResumen[addr], { font: { bold: true, sz: 12 } })
  );

  // Encabezado de tabla (fila 7 → A7:D7)
  ['A7', 'B7', 'C7', 'D7'].forEach(addr =>
    set(wsResumen[addr], {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: azulHeader } },
      alignment: { horizontal: 'center' }
    })
  );

  // Fila IVA Causado (A8:D8) – azul suave
  ['A8', 'B8', 'C8', 'D8'].forEach(addr =>
    set(wsResumen[addr], { fill: { fgColor: { rgb: azulSuave } } })
  );

  // Fila IVA Acreditable (A9:D9) – verde suave
  ['A9', 'B9', 'C9', 'D9'].forEach(addr =>
    set(wsResumen[addr], { fill: { fgColor: { rgb: verdeSuave } } })
  );

  // Fila IVA Neto (A10:D10) – rosa suave
  ['A10', 'B10', 'C10', 'D10'].forEach(addr =>
    set(wsResumen[addr], { fill: { fgColor: { rgb: rosaSuave } } })
  );

  // Ancho de columnas
  wsResumen['!cols'] = [
    { wch: 18 }, // A
    { wch: 18 }, // B
    { wch: 18 }, // C
    { wch: 18 }, // D
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // ==========================
  // HOJA 2: EMITIDOS
  // ==========================
  const emitidos = this.detalleIva
    .filter(x => x.tipoMovimiento === 'Emitido')
    .map(x => ({
      UUID: x.uuid,
      Tipo: x.tipoCfdi,
      Método: x.metodoPago,
      Emisor: x.rfcEmisor,
      Receptor: x.rfcReceptor,
      IVA: x.ivaTrasladado,
      Retenido: x.ivaRetenido,
      Incluido: x.incluidoEnCalculo ? 'Sí' : 'No'
    }));

  const wsEmitidos = XLSX.utils.json_to_sheet(emitidos);
  wsEmitidos['!cols'] = [
    { wch: 40 }, { wch: 6 }, { wch: 10 }, { wch: 22 },
    { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
  ];

  // Estilos encabezado EMITIDOS (fila 1)
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'].forEach(addr =>
    set(wsEmitidos[addr], {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: azulHeader } },
      alignment: { horizontal: 'center' }
    })
  );

  XLSX.utils.book_append_sheet(wb, wsEmitidos, 'Emitidos');

  // ==========================
  // HOJA 3: RECIBIDOS
  // ==========================
  const recibidos = this.detalleIva
    .filter(x => x.tipoMovimiento === 'Recibido')
    .map(x => ({
      UUID: x.uuid,
      Tipo: x.tipoCfdi,
      Método: x.metodoPago,
      Emisor: x.rfcEmisor,
      Receptor: x.rfcReceptor,
      IVA: x.ivaTrasladado,
      Retenido: x.ivaRetenido,
      Incluido: x.incluidoEnCalculo ? 'Sí' : 'No'
    }));

  const wsRecibidos = XLSX.utils.json_to_sheet(recibidos);
  wsRecibidos['!cols'] = wsEmitidos['!cols'];

  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'].forEach(addr =>
    set(wsRecibidos[addr], {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: azulHeader } },
      alignment: { horizontal: 'center' }
    })
  );

  XLSX.utils.book_append_sheet(wb, wsRecibidos, 'Recibidos');

  // ==========================
  // DESCARGA
  // ==========================
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array'
  });

  saveAs(
    new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    `IVA_${t.rfc}_${this.mes}_${this.anio}.xlsx`
  );
}

async exportarExcel() {
  if (!this.detalleIva || this.detalleIva.length === 0) {
    Swal.fire('Sin datos', 'No hay detalle de IVA para exportar.', 'warning');
    return;
  }

  const htmlPreview = `
    <div style="max-height:400px; overflow:auto; text-align:left;">
      <h4>Vista previa del detalle</h4>
      <table style="width:100%; border-collapse: collapse; font-size:11px;">
        <thead>
          <tr style="background:#e8e8e8;">
            <th>UUID</th><th>Tipo</th><th>Método</th><th>Emisor</th>
            <th>Receptor</th><th>IVA</th><th>Retenido</th><th>Incluido</th>
          </tr>
        </thead>
        <tbody>
          ${this.detalleIva
            .slice(0, 30)
            .map(
              x => `
            <tr>
              <td>${x.uuid}</td>
              <td>${x.tipoCfdi}</td>
              <td>${x.metodoPago}</td>
              <td>${x.rfcEmisor}</td>
              <td>${x.rfcReceptor}</td>
              <td>${x.ivaTrasladado}</td>
              <td>${x.ivaRetenido}</td>
              <td>${x.incluidoEnCalculo ? 'Sí' : 'No'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <small>Muestra de los primeros 30 registros…</small>
    </div>
  `;

  Swal.fire({
    title: 'Vista previa del Excel',
    html: htmlPreview,
    width: '90%',
    showCancelButton: true,
    confirmButtonText: 'Descargar Excel',
    cancelButtonText: 'Cancelar'
  }).then(async result => {
    if (result.isConfirmed) {
      await this.descargarExcelReal();
    }
  });
}



  //=============================================================================================



  // Método para cargar todos los clientes
  cargarClientes() {
    this.clientesSvc.getLista().subscribe({
      next: (res) => {
        this.clientes = res;
        this.clientesFiltrados = [];
      },
      error: (err) => {
        console.error('Error al cargar lista de clientes:', err);
        this.clientes = [];
      }
    });
  }

  // ==============================
  // MÉTODOS DEL BUSCADOR DE CLIENTE
  // ==============================
  
  onClienteBusquedaChange() {
    if (!this.clienteNombre) {
      this.clientesFiltrados = [];
      this.mostrarSugerencias = false;
      this.clienteSeleccionado = null;
      this.clienteId = null;
      return;
    }

    // Filtrar clientes en tiempo real
    const busqueda = this.clienteNombre.toLowerCase().trim();
    this.clientesFiltrados = this.clientes.filter(c => 
      c.razon_social.toLowerCase().includes(busqueda)
    );

    // Mostrar sugerencias si hay resultados
    this.mostrarSugerencias = this.clientesFiltrados.length > 0;
  }

  seleccionarCliente(cliente: ClienteLista) {
    this.clienteSeleccionado = cliente;
    this.clienteNombre = cliente.razon_social;
    this.clienteId = cliente.id;
    this.clientesFiltrados = [];
    this.mostrarSugerencias = false;
    
    // Guardar en localStorage para próximas consultas
    localStorage.setItem('ultimoClienteConsultado', JSON.stringify(cliente));
  }

  limpiarSeleccion() {
    this.clienteSeleccionado = null;
    this.clienteNombre = '';
    this.clienteId = null;
    this.clientesFiltrados = [];
    this.mostrarSugerencias = false;
    this.tablero = null;
    this.chartData = null;
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    localStorage.removeItem('ultimoClienteConsultado');
  }

  onInputBlur() {
    // Pequeño delay para permitir la selección con click
    this.blurTimer = setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  onInputFocus() {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    if (this.clienteNombre && this.clienteNombre.trim().length >= 2) {
      this.onClienteBusquedaChange();
    }
  }

  // ==============================
  // MÉTODO PRINCIPAL DE CONSULTA
  // ==============================
  
  consultar() {
    this.error = null;
    this.tablero = null;
    this.chartData = null;
    this.mostrarSugerencias = false;

    // Limpiar gráfica anterior si existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    // Validaciones
    if (!this.clienteId && !this.clienteSeleccionado) {
      this.error = 'Debe seleccionar un cliente.';
      return;
    }

    // Si se seleccionó desde búsqueda pero no se asignó ID
    if (this.clienteSeleccionado && !this.clienteId) {
      this.clienteId = this.clienteSeleccionado.id;
    }

    // Si hay nombre pero no se seleccionó cliente, intentar buscar en la lista
    if (!this.clienteSeleccionado && this.clienteNombre && this.clienteNombre.trim().length >= 2) {
      const clienteEncontrado = this.clientes.find(
        c => c.razon_social.toLowerCase().includes(this.clienteNombre.toLowerCase().trim())
      );
      
      if (clienteEncontrado) {
        this.clienteSeleccionado = clienteEncontrado;
        this.clienteId = clienteEncontrado.id;
      } else {
        this.error = 'Cliente no encontrado. Seleccione uno de la lista.';
        return;
      }
    }

    this.cargando = true;

    // ========================================================
  //          🔥 AQUÍ ESTÁ LA VERSIÓN CORRECTA DEL SUBSCRIBE
  // ========================================================
  this.tableroSvc.obtener(this.clienteId!, this.anio, this.mes).subscribe({
    
    next: async (resp) => {
      this.tablero = resp;
      this.cargando = false;

      // Preparar datos
      this.prepararDatosGrafica();

      setTimeout(() => {
        this.crearGraficaCircular();
      }, 50);

      // 🔥 Cargamos el DETALLE para PDF/Excel
      await this.cargarDetalle();
      console.log("DETALLE CARGADO:", this.detalleIva);
    },

    error: (err) => {
      console.error('Error al obtener tablero:', err);
      this.error = 'No se encontraron datos para el periodo seleccionado.';
      this.cargando = false;
    }
  });

  }

  // ==============================
  // MÉTODOS PARA GRÁFICAS
  // ==============================
  
  prepararDatosGrafica() {
    if (!this.tablero) return;

    const ivaCausado = Math.abs(this.tablero.ivaCausado?.total || 0);
    const ivaAcreditable = Math.abs(this.tablero.ivaAcreditable?.total || 0);
    
    this.chartMax = Math.max(ivaCausado, ivaAcreditable, 1);

    const total = ivaCausado + ivaAcreditable;
    
    // Calcular porcentajes para la gráfica circular
    this.porcentajeCausado = total > 0 ? (ivaCausado / total) * 100 : 0;
    this.porcentajeAcreditable = total > 0 ? (ivaAcreditable / total) * 100 : 0;
    
    this.chartData = {
      labels: ['IVA Causado', 'IVA Acreditable'],
      datasets: [
        {
          data: [ivaCausado, ivaAcreditable],
          backgroundColor: [
            'rgba(79, 158, 255, 0.8)',
            'rgba(110, 231, 183, 0.8)'
          ],
          borderColor: [
            'rgba(79, 158, 255, 1)',
            'rgba(110, 231, 183, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }
      ],
      total: total
    };
  }

   crearGraficaCircular() {
    if (!this.chartData || !this.pieChart) return;

    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruir gráfica anterior si existe
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const config = {
      type: 'doughnut' as const,
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset?.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value.toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN'
                })} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    this.chartInstance = new Chart(ctx, config);
    console.log(
  "CANVAS REAL SIZE:",
  this.pieChart.nativeElement.clientWidth,
  this.pieChart.nativeElement.clientHeight
);

  }

  // Alternativa simplificada sin Chart.js (para gráficas SVG)
  crearGraficaSVG() {
    // Esta función sería para crear gráficas SVG manualmente si no quieres usar Chart.js
    console.log('Creando gráfica SVG alternativa...');
  }

  // Método para obtener el porcentaje de la barra
  getBarPercent(value: number): number {
    if (!this.chartMax || this.chartMax <= 0) return 0;
    return Math.round((value / this.chartMax) * 100);
  }

  // ==============================
  // MÉTODOS AUXILIARES
  // ==============================
  
  getNombreMes(m: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[m - 1] || '';
  }

  getNombreMesSelect(m: number): string {
    const mesObj = this.meses.find(item => item.id === m);
    return mesObj ? mesObj.nombre : '';
  }

  // Método para formatear moneda
  formatoMoneda(valor: number): string {
    return valor.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Método para obtener el tipo de saldo
  getTipoSaldo(): string {
    if (!this.tablero) return '';
    return this.tablero.ivaAPagar < 0 ? 'Saldo a Favor' : 'Saldo por Pagar';
  }

  // Método para obtener clase CSS según el tipo de saldo
  getClaseSaldo(): string {
    if (!this.tablero) return '';
    return this.tablero.ivaAPagar < 0 ? 'text-success' : 'text-danger';
  }

  // Método para obtener icono según el tipo de saldo
  getIconoSaldo(): string {
    if (!this.tablero) return '';
    return this.tablero.ivaAPagar < 0 ? 'fa-arrow-down' : 'fa-arrow-up';
  }

  // Método para reiniciar consulta
  reiniciarConsulta() {
    this.limpiarSeleccion();
    this.anio = new Date().getFullYear();
    this.mes = new Date().getMonth() + 1;
    this.error = null;
    this.tablero = null;
    this.chartData = null;
    this.porcentajeCausado = 0;
    this.porcentajeAcreditable = 0;
  }

  // Método para cambiar mes
  cambiarMes(direccion: number) {
    let nuevoMes = this.mes + direccion;
    if (nuevoMes > 12) {
      nuevoMes = 1;
      this.anio++;
    } else if (nuevoMes < 1) {
      nuevoMes = 12;
      this.anio--;
    }
    this.mes = nuevoMes;
  }

  // Método para validar si se puede consultar
  puedeConsultar(): boolean {
    return (!!this.clienteId || !!this.clienteSeleccionado) && !this.cargando;
  }

  // Método para limpiar errores
  limpiarError() {
    this.error = null;
  }

  // Método para obtener el resumen de datos
  getResumenDatos(): { causado: number, acreditable: number, saldo: number, periodo: string, cliente: string } | null {
    if (!this.tablero) return null;
    
    return {
      causado: this.tablero.ivaCausado?.total || 0,
      acreditable: this.tablero.ivaAcreditable?.total || 0,
      saldo: this.tablero.ivaAPagar || 0,
      periodo: `${this.getNombreMes(this.tablero.mes)} ${this.tablero.anio}`,
      cliente: this.clienteSeleccionado?.razon_social || 'Cliente no seleccionado'
    };
  }

  // Método para obtener el ángulo de la gráfica circular (para SVG alternativo)
  getAnguloCircular(porcentaje: number): number {
    return (porcentaje / 100) * 360;
  }

  // Método para obtener el offset de la gráfica circular (para SVG alternativo)
  getCircularOffset(): number {
    return 282.6 - (this.porcentajeCausado / 100 * 282.6);
  }

  // Método para obtener la porción de la gráfica circular (para SVG alternativo)
  getCircularPorcion(porcentaje: number): number {
    return (porcentaje / 100) * 282.6; // 282.6 es la circunferencia de un círculo con radio 45
  }

  ngOnDestroy() {
    // Limpiar timer
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    
    // Destruir gráfica
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}