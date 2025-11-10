import { Component, Input, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientesService } from '../../../../core/services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes-form.html',
  styleUrls: ['./clientes-form.css']
})
export class ClientesFormComponent {
  // ==============================================================
  // 🔹 Comunicación con el padre (clientes-list)
  // ==============================================================
  @Input() show = false;
  @Input() id: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  // Referencias a los inputs de archivo
  @ViewChild('cerInput') cerInput!: ElementRef;
  @ViewChild('keyInput') keyInput!: ElementRef;

  // ==============================================================
  // 🔹 Variables principales
  // ==============================================================
  cargando = false;
  form: any;
  rfcDetectado = false;
  mostrarContrasena = false;

  // ✅ Información del certificado leído
  certInfo: any = null;

  constructor(private fb: FormBuilder, private api: ClientesService) {
    this.form = this.fb.group({
  usuario_id: [0, [Validators.required]],
  razon_social: ['', [Validators.required, Validators.minLength(3)]],
  telefono: [''],
  correo_electronico: ['', [Validators.email]],
  direccion: [''],
  honorarios_subtotal: [0, [Validators.required, Validators.min(0)]],
  rfc: [''],
  contrasena: ['', [Validators.required]],
  cer: [null], // 👈 sin required
  key: [null], // 👈 sin required
  estatus: [true]
});

  }

// ==============================================================
  // 🔹 Cargar usuarios disponibles para asignar
  // ==============================================================
  usuariosDisponibles: any[] = [];

ngOnInit() {
  // Cargar usuarios disponibles
  this.api.getUsuariosDisponibles().subscribe({
    next: (res) => (this.usuariosDisponibles = res),
  });

  // Si estamos editando, cargar datos del cliente
  if (this.id) {
    this.cargarCliente();
  }
}


cargarCliente() {
  if (!this.id) return;

  this.api.getByIdDetalle(this.id).subscribe({
    next: (cliente) => {
      const cert = cliente.certificados_sat?.[0];

      this.form.patchValue({
        usuario_id: cliente.usuario_id,
        razon_social: cliente.razon_social,
        telefono: cliente.telefono,
        correo_electronico: cliente.correo_electronico,
        direccion: cliente.direccion,
        honorarios_subtotal: cliente.honorarios_subtotal,
        rfc: cert?.rfc || '',
        contrasena: cert?.contrasena || '',
        estatus: cliente.estatus
      });
    },
    error: (err) => console.error('Error al cargar cliente', err),
  });
}




  // ==============================================================
  // 🔹 Cerrar el modal
  // ==============================================================
  @HostListener('document:keydown.escape')
  cerrarPorTecla() {
    this.cerrarModal();
  }

  cerrarFondo(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal')) this.cerrarModal();
  }

  cerrarModal() {
    this.form.reset();
    this.rfcDetectado = false;
    this.certInfo = null;
    this.closed.emit();
  }

  // ==============================================================
  // 🔹 Archivos CER/KEY
  // ==============================================================
  async onFileChange(evt: Event, campo: 'cer' | 'key') {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.form.patchValue({ [campo]: null });
      return;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (campo === 'cer' && ext !== 'cer') {
      Swal.fire('Archivo inválido', 'Solo se permiten archivos con extensión .cer', 'error');
      input.value = '';
      this.form.patchValue({ [campo]: null });
      return;
    }

    if (campo === 'key' && ext !== 'key') {
      Swal.fire('Archivo inválido', 'Solo se permiten archivos con extensión .key', 'error');
      input.value = '';
      this.form.patchValue({ [campo]: null });
      return;
    }

    if (file.size > 2_000_000) {
      Swal.fire('Archivo demasiado grande', 'El tamaño máximo permitido es de 2MB', 'warning');
      input.value = '';
      this.form.patchValue({ [campo]: null });
      return;
    }

    this.form.patchValue({ [campo]: file });

    if (campo === 'cer') {
      this.detectarRFC();
    }
  }

  // ==============================================================
  // 🔹 Detectar RFC automáticamente al subir .cer
  // ==============================================================
  detectarRFC() {
    const v = this.form.value;
    if (!v.cer) return;

    this.cargando = true;
    const fd = new FormData();
    fd.append('cer', v.cer as Blob);

    this.api.leerRFC(fd).subscribe({
  next: (res) => {
    this.cargando = false;
    const rfc = res.rfc || res.certificado?.rfc || res.data?.rfc;

    if (rfc) {
      this.form.patchValue({ rfc });
      if (!this.form.value.contrasena) this.form.patchValue({ contrasena: rfc });

      this.rfcDetectado = true;
      this.certInfo = res;

      Swal.fire({
        icon: 'success',
        title: 'RFC detectado correctamente',
        html: `
          <b>RFC:</b> ${res.rfc}<br>
          <b>Nombre:</b> ${res.nombre || '—'}<br>
          <b>Vigencia:</b> ${new Date(res.vigencia_inicio).toLocaleDateString()} a ${new Date(res.vigencia_fin).toLocaleDateString()}<br>
          <b>Mensaje:</b> ${res.mensaje || 'Certificado leído correctamente'}
        `,
        showConfirmButton: true,   // ✅ mantiene el botón
        confirmButtonText: 'OK',   // ✅ texto del botón
        confirmButtonColor: '#3085d6' // (opcional) color azul estándar
      });
    } else {
      Swal.fire('No se pudo obtener el RFC', 'Verifica el archivo .cer', 'warning');
    }
  },
  error: (err) => {
    console.error(err);
    this.cargando = false;
    Swal.fire('Error', 'No se pudo leer el RFC del certificado.', 'error');
  },
});

  }

  // ==============================================================
  // 🔹 Enviar formulario
  // ==============================================================
 enviar() {
  // 🔹 Validaciones dinámicas según el modo (nuevo o edición)
  if (!this.id) {
    // Nuevo cliente → archivos obligatorios
    this.form.get('cer')?.addValidators([Validators.required]);
    this.form.get('key')?.addValidators([Validators.required]);
  } else {
    // Edición → archivos opcionales
    this.form.get('cer')?.clearValidators();
    this.form.get('key')?.clearValidators();
  }

  this.form.updateValueAndValidity();

  // 🔹 Validación general del formulario
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.mostrarErrores();
    return;
  }

  // ===============================================================
  // 🔹 Construcción del FormData
  // ===============================================================
  const v = this.form.value;
  const fd = new FormData();

// ✅ agrega esta línea
if (this.id) fd.append('id', String(this.id));
  // Campos principales
  fd.append('usuario_id', String(v.usuario_id));
  fd.append('razon_social', v.razon_social ?? '');
  fd.append('telefono', v.telefono ?? '');
  fd.append('correo_electronico', v.correo_electronico ?? '');
  fd.append('direccion', v.direccion ?? '');
  fd.append('honorarios_subtotal', String(v.honorarios_subtotal ?? 0));
  fd.append('rfc', v.rfc ?? '');
  fd.append('contrasena', v.contrasena ?? '');
  fd.append('estatus', this.form.get('estatus')?.value ? 'true' : 'false');

  // ✅ Archivos: solo si el usuario seleccionó nuevos
  if (v.cer instanceof File) fd.append('cer', v.cer);
  if (v.key instanceof File) fd.append('key', v.key);

  // ===============================================================
  // 🔹 Envío a la API
  // ===============================================================
  this.cargando = true;

  this.api.registrarCompleto(fd).subscribe({
    next: (res) => {
      this.cargando = false;
      Swal.fire({
  icon: 'success',
  title: 'Cliente actualizado correctamente',
  html: `
    <b>${res.mensaje || res?.mensaje || 'Operación completada correctamente.'}</b><br>
    ${res.certificado?.rfc ? `<b>RFC:</b> ${res.certificado.rfc}<br>` : ''}
    ${res.certificado?.fecha_inicio ? `<b>Vigencia:</b> ${res.certificado.fecha_inicio} a ${res.certificado.fecha_fin}<br>` : ''}
    ${res.razon_social ? `<b>Cliente:</b> ${res.razon_social}<br>` : ''}
  `,
  confirmButtonColor: '#3085d6'
});


      // Limpieza final
      this.form.reset();
      this.rfcDetectado = false;
      this.certInfo = null;
      this.saved.emit();
      this.cerrarModal();
    },
    error: (err) => {
      this.cargando = false;
      const msg = err?.error?.mensaje || 'Error al registrar. Verifica los archivos y la contraseña.';
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: msg,
        confirmButtonText: 'OK'
      });
    }
  });
}


  // ==============================================================
  // 🔹 Mostrar errores del formulario
  // ==============================================================
  mostrarErrores() {
    const errores: string[] = [];

    if (this.form.get('razon_social')?.errors)
      errores.push('• Razón Social es obligatoria (mínimo 3 caracteres)');

    if (this.form.get('honorarios_subtotal')?.errors)
      errores.push('• Honorarios Subtotal es obligatorio y debe ser mayor a 0');

    if (this.form.get('contrasena')?.errors)
      errores.push('• Contraseña del Certificado es obligatoria');

    if (this.form.get('cer')?.errors)
      errores.push('• Archivo .cer es obligatorio');

    if (this.form.get('key')?.errors)
      errores.push('• Archivo .key es obligatorio');

    if (this.form.get('correo_electronico')?.errors)
      errores.push('• El formato del correo electrónico no es válido');

    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      html: errores.join('<br>'),
      confirmButtonText: 'Corregir'
    });
  }
}
