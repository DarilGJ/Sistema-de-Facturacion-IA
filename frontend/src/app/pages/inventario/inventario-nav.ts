import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

type InvMenu = 'catalogo' | 'almacenes' | 'movimientos' | 'reportes';
type InvFlyout = 'stock' | 'movimientos' | 'analisis';

@Component({
  selector: 'app-inventario-nav',
  imports: [RouterLink, RouterLinkActive, UiIcon],
  templateUrl: './inventario-nav.html',
  styleUrl: './inventario-nav.css',
})
export class InventarioNav {
  private readonly router = inject(Router);
  readonly openMenu = signal<InvMenu | null>(null);
  readonly openFlyout = signal<InvFlyout | null>(null);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly catalogoActivo = computed(() =>
    this.matches([
      '/inventario/productos',
      '/inventario/categorias',
      '/inventario/subcategorias',
      '/inventario/marcas',
      '/inventario/listas-precios',
    ])
  );
  readonly almacenesActivo = computed(() =>
    this.matches(['/inventario/almacenes', '/inventario/existencias'])
  );
  readonly movimientosActivo = computed(() =>
    this.matches([
      '/inventario/ajustes',
      '/inventario/traslados',
      '/inventario/toma-fisica',
      '/inventario/devoluciones',
      '/inventario/movimientos',
    ])
  );
  readonly reportesActivo = computed(() => this.url().includes('/inventario/reportes/'));
  readonly configActivo = computed(() => this.url().startsWith('/inventario/configuracion'));

  @HostListener('document:click')
  close(): void {
    this.openMenu.set(null);
    this.openFlyout.set(null);
  }

  toggle(menu: InvMenu, event: Event): void {
    event.stopPropagation();
    this.openMenu.update((current) => (current === menu ? null : menu));
    this.openFlyout.set(null);
  }

  showFlyout(key: InvFlyout, event: Event): void {
    event.stopPropagation();
    this.openFlyout.set(key);
  }

  private matches(prefixes: string[]): boolean {
    const url = this.url();
    return prefixes.some((prefix) => url === prefix || url.startsWith(`${prefix}/`));
  }
}
