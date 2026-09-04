import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { InventarioNav } from './inventario-nav';

@Component({
  selector: 'app-inventario-placeholder',
  imports: [InventarioNav],
  templateUrl: './inventario-placeholder.html',
  styleUrl: './inventario-shared.css',
})
export class InventarioPlaceholder {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  readonly titulo = computed(() => String(this.data()?.['titulo'] || 'Inventario'));
  readonly subtitulo = computed(
    () =>
      String(
        this.data()?.['subtitulo'] ||
          'Esta función ya está disponible en el menú. El detalle operativo se completará en una siguiente etapa.'
      )
  );
}
