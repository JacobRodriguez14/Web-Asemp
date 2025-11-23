// certificados.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';             // 👈 para [(ngModel)]
import { HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { CertificadosService } from '../../../core/services/certificados.service';

@Component({
  standalone: true,
  selector: 'app-certificados',
  templateUrl: './certificados.html',
  styleUrls: ['./certificados.css'],
  imports: [CommonModule, FormsModule]                    // 👈 agrega FormsModule
})
export class CertificadosComponent implements OnInit {

  certificados: any[] = [];
  busqueda: string = '';                                  // 👈 texto del filtro

  constructor(private certSrv: CertificadosService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.certSrv.listar().subscribe({
      next: data => {
        this.certificados = data ?? [];
        this.refrescarIconos();
      },
      error: () =>
        Swal.fire('Error', 'No se pudieron cargar los certificados', 'error')
    });
  }

  // ==========================
  // DESCARGA TIPO SAT
  // ==========================
  descargar(c: any, tipo: 'cer' | 'key' | 'pfx' | 'password') {

    this.certSrv.descargar(c.id, tipo).subscribe({
      next: (resp: HttpResponse<Blob>) => {

        const mime = this.getMime(tipo);
        const nombre = this.getNombreArchivo(c, tipo);

        this.saveResponseWithPicker(resp, nombre, mime)
          .catch(() => {
            const blob = resp.body as Blob;
            this.descargarConAnchor(blob, nombre);
          });
      },
      error: (e) => {
        const msg = e?.error || 'No se pudo descargar el archivo';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  private getMime(tipo: 'cer' | 'key' | 'pfx' | 'password'): string {
    switch (tipo) {
      case 'cer':       return 'application/x-x509-ca-cert';
      case 'key':       return 'application/octet-stream';
      case 'pfx':       return 'application/x-pkcs12';
      case 'password':  return 'text/plain';
      default:          return 'application/octet-stream';
    }
  }

  private getNombreArchivo(c: any, tipo: 'cer' | 'key' | 'pfx' | 'password'): string {
    const base = (c?.rfc || `certificado_${c?.id || ''}`).trim();
    if (tipo === 'password') return `${base}_password.txt`;
    return `${base}.${tipo}`;
  }

  // ===== helpers tipo SAT =====
  private async saveResponseWithPicker(resp: HttpResponse<Blob>, nombre: string, mime: string) {
    const blob = resp.body as Blob;
    await this.saveWithPicker(blob, nombre, mime);
  }

  private async saveWithPicker(blob: Blob, suggestedName: string, mime: string) {
    const w: any = window as any;

    if (w.showSaveFilePicker) {
      const ext = suggestedName.split('.').pop()?.toLowerCase() || '';
      const accept: Record<string, string[]> = { [mime]: [`.${ext}`] };

      const handle = await w.showSaveFilePicker({
        suggestedName,
        types: [{ description: mime, accept }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      this.descargarConAnchor(blob, suggestedName);
    }
  }

  private descargarConAnchor(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ============================================================
  // REFRESCAR ICONOS FEATHER
  // ============================================================
  refrescarIconos() {
    setTimeout(() => {
      if ((window as any).feather) {
        (window as any).feather.replace();
      }
    }, 50);
  }

  // ============================================================
  // FILTRO / BÚSQUEDA
  // ============================================================
  get certificadosFiltrados(): any[] {
    const term = this.busqueda.trim().toLowerCase();
    if (!term) return this.certificados;

    return this.certificados.filter(c => {
      const id = (c.id ?? '').toString();
      const cliente = (c.cliente ?? '').toLowerCase();
      const rfc = (c.rfc ?? '').toLowerCase();

      return id.includes(term) || cliente.includes(term) || rfc.includes(term);
    });
  }
}
