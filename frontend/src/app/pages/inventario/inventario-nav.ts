import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

@Component({
  selector: 'app-inventario-nav',
  imports: [RouterLink, RouterLinkActive, UiIcon],
  templateUrl: './inventario-nav.html',
  styleUrl: './inventario-nav.css',
})
export class InventarioNav {
  readonly openMenu = signal<'catalogo' | 'almacenes' | 'reportes' | null>(null);

  @HostListener('document:click')
  close(): void {
    this.openMenu.set(null);
  }

  toggle(menu: 'catalogo' | 'almacenes' | 'reportes', event: Event): void {
    event.stopPropagation();
    this.openMenu.update((current) => (current === menu ? null : menu));
  }
}
