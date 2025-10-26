import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherService } from '../../../core/services/feather.service';

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

  constructor(private router: Router, private feather: FeatherService) {}

  ngAfterViewInit(): void {
    // Reemplaza íconos al iniciar
    this.feather.replace();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    // Actualiza el ícono inmediatamente
    this.feather.replace();
  }

  login(): void {
    if (this.loading) return;
    if (!this.email || !this.password) {
      alert('Por favor, completa todos los campos');
      return;
    }

    this.loading = true;
    setTimeout(() => {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify({
        email: this.email,
        name: this.email.split('@')[0]
      }));
      this.loading = false;
      this.router.navigateByUrl('/dashboard/home');
    }, 1000);
  }
}
