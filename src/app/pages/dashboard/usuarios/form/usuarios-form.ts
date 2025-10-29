import { Component, EventEmitter, HostListener, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ListasService, RolCombo, DepartamentoCombo } from '../../../../core/services/listas.service';

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-form.html',
  styleUrls: ['./usuarios-form.css']
})
export class UsuariosForm implements OnInit {
  @Input() id: number | null = null;
  @Input() show = false;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  usuario: Usuario = {
    id: 0,
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    usuario: '',
    contrasena: '',
    estatus: true,
    rol_id: 0,
    departamento_id: 0
  };

  // Estado general
  editando = false;
  mostrarCampoContrasena = false;
  campoContrasenaVisible = true;
  verContrasena = false;


  // Listas dinámicas
  roles: RolCombo[] = [];
  departamentos: DepartamentoCombo[] = [];

  constructor(
    private usuariosSrv: UsuariosService,
    private listasSrv: ListasService
  ) {}

  ngOnInit(): void {
    this.cargarListas();

    if (this.id) {
      this.editando = true;
      this.campoContrasenaVisible = false;
      this.usuariosSrv.getById(this.id).subscribe({
        next: (res) => (this.usuario = res),
        error: (err) => console.error('Error al cargar usuario', err)
      });

      // evitar autocompletado en contraseña
      setTimeout(() => (this.campoContrasenaVisible = true), 250);
    }
  }

  // === Cargar roles y departamentos desde la API ===
  cargarListas(): void {
    this.listasSrv.getRoles().subscribe({
      next: (res) => (this.roles = res),
      error: (err) => console.error('Error al cargar roles', err)
    });

    this.listasSrv.getDepartamentos().subscribe({
      next: (res) => (this.departamentos = res),
      error: (err) => console.error('Error al cargar departamentos', err)
    });
  }

  // === Eventos del modal ===
  @HostListener('document:keydown.escape')
  cerrarPorTecla() {
    this.cerrar();
  }

  cerrarFondo(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal')) this.cerrar();
  }

  cerrar(): void {
    this.show = false;
    this.closed.emit();
  }

guardar(form: NgForm): void {
  if (form.invalid) { alert('Completa los campos obligatorios.'); return; }

  // Validar selects
  if (!this.usuario.rol_id || this.usuario.rol_id === 0) {
    alert('Selecciona un rol.'); return;
  }
  if (!this.usuario.departamento_id || this.usuario.departamento_id === 0) {
    alert('Selecciona un departamento.'); return;
  }

  // Preparar payload
  const payload: any = { ...this.usuario };
  if (!this.editando) delete payload.id;              // no enviar id al crear
  if (this.editando && !payload.contrasena) delete payload.contrasena; // no cambiar password

  const req = this.editando
    ? this.usuariosSrv.update(this.usuario.id, payload)
    : this.usuariosSrv.create(payload);

  req.subscribe({
    next: () => {
      alert(this.editando ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
      this.saved.emit();
      this.cerrar();
    },
    error: (err) => {
      console.error('Error al guardar usuario', err);
      const msg = err?.error?.mensaje || err?.error || err?.message || 'Error desconocido';
      alert('No se pudo guardar el usuario: ' + msg);
    }
  });
}


  // === Control de campo de contraseña ===
  toggleCampoContrasena(): void {
    this.mostrarCampoContrasena = !this.mostrarCampoContrasena;
    this.usuario.contrasena = '';
  }
}
