import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {
  primaryColor = '#802020';
  backgroundColor = '#f4f7fa';
  textColor = '#1a1a1a';
  previewLogo: string | ArrayBuffer | null = null;
  currentTheme: 'default' | 'light' | 'dark' | 'custom' = 'default';
  applyGlobally = false;

  ngOnInit() {
  this.loadThemeState();
  this.syncInputsWithTheme();
  this.syncThemeLogo();
  this.updateFeatherIcons();

  // === Observador de cambios de tema sin recursividad ===
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        // solo reaccionar si el tema realmente cambió
        const newTheme = document.documentElement.getAttribute('data-theme');
        if (newTheme && newTheme !== this.currentTheme) {
          this.currentTheme = newTheme as any;
          this.syncInputsWithTheme();
          this.syncThemeLogo();
        }
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // === Escuchar solo cambios externos en localStorage ===
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' && e.newValue && e.newValue !== this.currentTheme) {
      this.currentTheme = e.newValue as any;
      this.syncInputsWithTheme();
      this.syncThemeLogo();
    }
  });
}


  // === Detectar y aplicar el tema actual ===
  loadThemeState() {
    const storedTheme = localStorage.getItem('theme') as 'default' | 'light' | 'dark' | 'custom' | null;
    this.currentTheme = storedTheme || (document.documentElement.getAttribute('data-theme') as any) || 'default';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  // === Sincronizar los colores visibles con el tema actual ===
  private syncInputsWithTheme() {
    // Si hay una configuración guardada y el tema es custom
    const cfg = localStorage.getItem('configuracion');
    if (cfg && this.currentTheme === 'custom') {
      const c = JSON.parse(cfg);
      this.primaryColor = c.primaryColor || this.getComputedColor('--color-primary');
      this.backgroundColor = c.backgroundColor || this.getComputedColor('--color-background');
      this.textColor = c.textColor || this.getComputedColor('--color-text');
      this.previewLogo = c.logo || null;
      return;
    }

    // Si no, leer las variables actuales del CSS (para light/dark/default)
    this.primaryColor = this.getComputedColor('--color-primary');
    this.backgroundColor = this.getComputedColor('--color-background');
    this.textColor = this.getComputedColor('--color-text');
  }

  // === Obtener color CSS actual ===
  getComputedColor(v: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  // === Alternar alcance de aplicación ===
  onToggleScope() {
    if (this.applyGlobally) {
      this.applyTheme();
    } else {
      // Volver al tema actual sin custom
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--color-background');
      document.documentElement.style.removeProperty('--color-navbar');
      document.documentElement.style.removeProperty('--color-text');

      const theme = localStorage.getItem('theme') || this.currentTheme || 'default';
      document.documentElement.setAttribute('data-theme', theme);
      this.syncInputsWithTheme();
    }
  }

private applying = false;

applyTheme() {
  if (this.applying) return; // evita recursión
  this.applying = true;

  if (!this.applyGlobally) {
    this.applying = false;
    return;
  }

  this.currentTheme = 'custom';
  document.documentElement.setAttribute('data-theme', 'custom');
  localStorage.setItem('theme', 'custom');

  document.documentElement.style.setProperty('--color-primary', this.primaryColor);
  document.documentElement.style.setProperty('--color-background', this.backgroundColor);
  document.documentElement.style.setProperty('--color-navbar', this.backgroundColor);

  const calculatedTextColor = this.calculateTextColor(this.backgroundColor);
  document.documentElement.style.setProperty('--color-text', calculatedTextColor);
  this.textColor = calculatedTextColor;

  const sidebarLogo = document.querySelector('.logo-img') as HTMLImageElement | null;
  if (sidebarLogo && this.previewLogo) sidebarLogo.src = this.previewLogo as string;

  this.saveTemporaryConfig();
  this.applying = false;
}



  // === Calcular contraste automático ===
  calculateTextColor(bgHex: string): string {
    const hex = bgHex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#1a1a1a' : '#e5e7eb';
  }

  // === Subir logo ===
  onLogoChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Máximo 2MB.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewLogo = reader.result;
      this.saveTemporaryConfig();
      if (this.applyGlobally) {
        const sidebarLogo = document.querySelector('.logo-img') as HTMLImageElement | null;
        if (sidebarLogo) sidebarLogo.src = this.previewLogo as string;
      }
      this.updateFeatherIcons();
    };
    reader.readAsDataURL(file);
  }

  // === Eliminar logo ===
  removeLogo() {
    this.previewLogo = null;
    this.saveTemporaryConfig();
    this.syncThemeLogo();
    this.updateFeatherIcons();
  }

  // === Cambiar tema predefinido ===
 resetToTheme(themeName: 'default' | 'light' | 'dark') {
  if (this.applying) return;
  this.applying = true;

  this.currentTheme = themeName;
  localStorage.setItem('theme', themeName);
  document.documentElement.setAttribute('data-theme', themeName);

  document.documentElement.style.removeProperty('--color-primary');
  document.documentElement.style.removeProperty('--color-background');
  document.documentElement.style.removeProperty('--color-navbar');
  document.documentElement.style.removeProperty('--color-text');

  this.syncInputsWithTheme();
  this.syncThemeLogo();

  // liberar bloqueo
  setTimeout(() => (this.applying = false), 150);
}


  // === Restaurar a default o light ===
  resetConfig() {
    const def = confirm('¿Restaurar al tema por defecto? (Cancelar = tema claro)');
    this.resetToTheme(def ? 'default' : 'light');
    this.updateFeatherIcons();
  }

  // === Sincronizar el logo por tema ===
  private syncThemeLogo() {
    const sidebarLogo = document.querySelector('.logo-img') as HTMLImageElement | null;
    if (!sidebarLogo) return;

    const cfg = localStorage.getItem('configuracion');
    if (cfg && this.currentTheme === 'custom') {
      const c = JSON.parse(cfg);
      if (c.logo) {
        sidebarLogo.src = c.logo;
        this.previewLogo = c.logo;
        return;
      }
    }

    switch (this.currentTheme) {
      case 'dark':
        sidebarLogo.src = 'assets/images/LOGO.png';
        break;
      default:
        sidebarLogo.src = 'assets/images/LOGO.png';
        break;
    }
  }

  // === Guardar configuración temporal ===
  saveTemporaryConfig() {
    localStorage.setItem('configuracion', JSON.stringify({
      primaryColor: this.primaryColor,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      logo: this.previewLogo,
      theme: this.currentTheme
    }));
  }

  // === Guardar configuración permanente ===
  saveConfig() {
    // Solo guarda como custom si realmente se usa custom
    if (this.currentTheme !== 'custom') {
      alert('Solo los temas personalizados se guardan permanentemente.');
      return;
    }

    localStorage.setItem('configuracion', JSON.stringify({
      primaryColor: this.primaryColor,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      logo: this.previewLogo,
      theme: 'custom'
    }));

    localStorage.setItem('theme', 'custom');
    document.documentElement.setAttribute('data-theme', 'custom');

    alert('Configuración personalizada guardada.');
  }

  // === Feather icons ===
  private updateFeatherIcons() {
    setTimeout(() => {
      const f = (window as any).feather;
      if (f) f.replace();
    }, 100);
  }
}
