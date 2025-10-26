// navbar.component.ts
import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<boolean>();
  
  pageTitle = 'Dashboard';
  breadcrumb = 'Inicio';
  userAvatar: string | null = null;
  isSidebarOpen = true;
  currentTheme: 'default' | 'light' | 'dark' | 'custom' = 'default';
  isThemeMenuOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.replaceIcons();

    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updatePageInfo(event.url);
      });

    // Aplicar tema guardado
    const storedTheme = localStorage.getItem('theme') as 'default' | 'light' | 'dark' | 'custom';
    if (storedTheme) {
      this.currentTheme = storedTheme;
      document.documentElement.setAttribute('data-theme', storedTheme);
    }

    // ✅ Nuevo: reaplicar configuración guardada (logo y colores)
    // Antes: this.applyStoredConfig();
if (this.currentTheme === 'custom') {
  this.applyStoredConfig();
}


  // ✅ Nuevo: detectar la ruta actual si se recarga directamente
  this.updatePageInfo(this.router.url);

    this.applyThemeLogo(this.currentTheme); // ✅ sincroniza logo con el tema activo

    this.updateSidebarTextContrast();



  }

  /** ===== NUEVO ===== */
  private applyStoredConfig() {
    const stored = localStorage.getItem('configuracion');
    if (!stored) return;

    const c = JSON.parse(stored);

    // Aplica colores sólidos — evita navbar transparente
    if (c.primaryColor)
      document.documentElement.style.setProperty('--color-primary', c.primaryColor);
    if (c.backgroundColor) {
      document.documentElement.style.setProperty('--color-background', c.backgroundColor);
      document.documentElement.style.setProperty('--color-navbar', c.backgroundColor);
    }
    if (c.textColor)
      document.documentElement.style.setProperty('--color-text', c.textColor);

    // ✅ Aplica logo guardado
    if (c.logo) {
      const sidebarLogo = document.querySelector('.lOGO-img') as HTMLImageElement | null;
      if (sidebarLogo) sidebarLogo.src = c.logo;
    }
  }


  // === NUEVO: sincronizar logo según tema ===
private applyThemeLogo(theme: string) {
  const sidebarLogo = document.querySelector('.lOGO-img') as HTMLImageElement | null;
  if (!sidebarLogo) return;

  // Si hay un logo personalizado guardado en localStorage, úsalo primero
  const cfg = localStorage.getItem('configuracion');
  if (cfg) {
    const c = JSON.parse(cfg);
    if (c.logo) {
      sidebarLogo.src = c.logo;
      return;
    }
  }

  // Si no hay logo personalizado, usar el predeterminado por tema
  switch (theme) {
    case 'dark':
      sidebarLogo.src = 'assets/images/LOGO.png'; // ← tu logo blanco
      break;
    case 'light':
    case 'default':
      sidebarLogo.src = 'assets/images/LOGO.png'; // ← tu logo normal
      break;
    default:
      sidebarLogo.src = 'assets/images/LOGO.png';
      break;
  }
}

  /** ================= */

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const themeSelector = document.querySelector('.theme-selector');
    if (themeSelector && !themeSelector.contains(event.target as Node)) {
      this.isThemeMenuOpen = false;
      this.replaceIcons();
    }
  }

  replaceIcons() {
    setTimeout(() => {
      if ((window as any).feather) {
        (window as any).feather.replace();
      }
    }, 10);
  }

  updatePageInfo(url: string): void {
    const routeMap: { [key: string]: { title: string, breadcrumb: string } } = {
      '/dashboard/home': { title: 'Dashboard', breadcrumb: 'Inicio' },
      '/dashboard/clientes': { title: 'Clientes', breadcrumb: 'Gestión de Clientes' },
      '/dashboard/sat': { title: 'SAT', breadcrumb: 'Documentos Fiscales' },
      '/dashboard/reportes': { title: 'Reportes', breadcrumb: 'Análisis y Reportes' },
      '/dashboard/configuracion': { title: 'Configuración', breadcrumb: 'Ajustes del Sistema' }
    };

    const info = routeMap[url] || { title: 'Dashboard', breadcrumb: 'Inicio' };
    this.pageTitle = info.title;
    this.breadcrumb = info.breadcrumb;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarToggle.emit(this.isSidebarOpen);
    this.replaceIcons();
  }

  toggleThemeMenu(): void {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
    this.replaceIcons();
  }

  setTheme(theme: 'default' | 'light' | 'dark' | 'custom'): void {
    this.isThemeMenuOpen = false;
    this.toggleTheme(theme);
    this.replaceIcons();
  }
toggleTheme(theme: 'default' | 'light' | 'dark' | 'custom') {
  document.documentElement.setAttribute('data-theme', theme);
  this.currentTheme = theme;
  localStorage.setItem('theme', theme);

  if (theme !== 'custom') {
    // salir de custom: limpia variables en línea
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-navbar');
    document.documentElement.style.removeProperty('--color-background');
    document.documentElement.style.removeProperty('--color-text');
  } else {
    // volver a custom: aplica configuración guardada
    const cfg = localStorage.getItem('configuracion');
    if (cfg) {
      const c = JSON.parse(cfg);
      document.documentElement.style.setProperty('--color-primary', c.primaryColor);
      document.documentElement.style.setProperty('--color-background', c.backgroundColor);
      document.documentElement.style.setProperty('--color-navbar', c.backgroundColor);
    }
  }

  this.updateSidebarTextContrast();
  this.applyThemeLogo(theme);
  this.replaceIcons();
}


  updateSidebarTextContrast() {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim();

    if (bgColor.startsWith('#') && bgColor.length === 7) {
      const r = parseInt(bgColor.substring(1, 3), 16);
      const g = parseInt(bgColor.substring(3, 5), 16);
      const b = parseInt(bgColor.substring(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const sidebarText = luminance > 0.6 ? '#1a1a1a' : '#ffffff';
      document.documentElement.style.setProperty('--color-text-sidebar', sidebarText);
    }
  }
}
