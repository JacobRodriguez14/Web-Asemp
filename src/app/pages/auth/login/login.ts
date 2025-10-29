import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherService } from '../../../core/services/feather.service';
import { AuthService } from '../../../core/services/auth.service'; // 👈 nuevo


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements AfterViewInit {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = ''; // 👈 nuevo

  constructor(
    private router: Router,
    private feather: FeatherService,
    private authSrv: AuthService // 👈 nuevo
  ) {}

  ngAfterViewInit(): void {
    this.feather.replace();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.feather.replace();
  }

  login(): void {
    if (this.loading) return;
    if (!this.email || !this.password) {
      alert('Por favor, completa todos los campos');
      return;
    }

    this.loading = true;
    this.error = '';

    // 👇 Reemplaza tu setTimeout por llamada real
    this.authSrv.login({ usuario: this.email, contrasena: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/dashboard/home');
        },
        error: (err: any) => {
  this.loading = false;
  this.error = err?.error || 'Credenciales inválidas';
}

      });
  }
}
