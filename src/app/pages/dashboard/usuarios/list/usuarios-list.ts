import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { UsuariosForm } from '../form/usuarios-form';

import Swal from 'sweetalert2';

declare const feather: any;

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, UsuariosForm],
  templateUrl: './usuarios-list.html',
  styleUrls: ['./usuarios-list.css']
})
export class UsuariosList implements OnInit, AfterViewInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  terminoBusqueda = '';
  criterioBusqueda: 'nombres' | 'apellidos' | 'usuario' | 'correo' | 'departamento' | 'rol' = 'nombres';
  page = 1;

  temaActual: 'light' | 'dark' = 'light';
  mostrarModal = false;
  editingId: number | null = null;

  constructor(private usuarioSrv: UsuariosService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.detectarTema();
  }

  ngAfterViewInit(): void {
    setTimeout(() => feather?.replace(), 0);
    const observer = new MutationObserver(() => this.detectarTema());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  private refreshIcons(): void {
    setTimeout(() => feather?.replace(), 0);
  }

  private detectarTema(): void {
    const temaGuardado = localStorage.getItem('theme');
    this.temaActual = temaGuardado === 'dark' ? 'dark' : 'light';
  }

  cargarUsuarios(): void {
    this.usuarioSrv.getAll().subscribe({
      next: res => {
        this.usuarios = res;
        this.usuariosFiltrados = res;
        this.refreshIcons();
      },
      error: err => console.error('Error al cargar usuarios', err)
    });
  }

  filtrarUsuarios(): void {
    const t = this.terminoBusqueda.trim().toLowerCase();
    if (!t) {
      this.usuariosFiltrados = this.usuarios;
      this.page = 1;
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u => {
      switch (this.criterioBusqueda) {
        case 'nombres': return u.nombres?.toLowerCase().includes(t);
        case 'apellidos': return `${u.apellido_paterno} ${u.apellido_materno}`.toLowerCase().includes(t);
        case 'usuario': return u.usuario?.toLowerCase().includes(t);
        case 'correo': return u.correo?.toLowerCase().includes(t);
        case 'departamento': return u.departamento?.nombre?.toLowerCase().includes(t) || false;
        case 'rol': return u.rol?.nombre?.toLowerCase().includes(t) || false;
        default: return false;
      }
    });
    this.page = 1;
  }

  // === MODAL CONTROL ===
  abrirModalNuevo(): void {
    this.editingId = null;
    this.mostrarModal = true;
  }

  abrirEditar(id: number): void {
    this.editingId = id;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  onSaved(): void {
    this.cargarUsuarios();
    this.cerrarModal();
  }

 eliminar(id: number): void {
  Swal.fire({
    title: '¿Eliminar usuario?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.usuarioSrv.delete(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El usuario ha sido eliminado correctamente.',
            confirmButtonColor: '#3085d6',
            timer: 1500,
            showConfirmButton: false
          });
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el usuario.',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  });
}
}
