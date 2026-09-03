import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modulo-placeholder',
  templateUrl: './modulo-placeholder.html',
  styleUrl: '../inventario/inventario-shared.css',
})
export class ModuloPlaceholder {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  readonly titulo = computed(() => String(this.data()?.['titulo'] || 'Módulo'));
  readonly subtitulo = computed(
    () =>
      String(
        this.data()?.['subtitulo'] ||
          'Esta función ya está disponible en el menú. El detalle operativo se completará en una siguiente etapa.'
      )
  );
}
