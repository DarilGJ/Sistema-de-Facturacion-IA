import { Component, OnInit, inject, signal } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { InventarioConfigKey } from '../../core/models/inventario.model';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

interface ConfigOpcion {
  key: InventarioConfigKey;
  titulo: string;
  descripcion: string;
  toggle: string;
  estadoOn: string;
  estadoOff: string;
  warnOn?: string;
  warnOff?: string;
}

@Component({
  selector: 'app-inventario-config',
  imports: [InventarioNav, UiIcon],
  templateUrl: './inventario-config.html',
  styleUrls: ['./inventario-shared.css', './inventario-config.css'],
})
export class InventarioConfigPage implements OnInit {
  readonly inventario = inject(InventarioService);
  readonly error = signal('');
  readonly saving = signal<InventarioConfigKey | null>(null);
  readonly opciones: ConfigOpcion[] = [
    {
      key: 'control_lotes',
      titulo: 'Control por lotes (FIFO / FEFO)',
      descripcion:
        'Para productos perecederos, medicamentos o ítems con número de lote y fecha de vencimiento.',
      toggle: 'Mi empresa trabaja con lotes',
      estadoOn: 'Activado — el stock se controla por lote y vencimiento',
      estadoOff: 'Desactivado — el stock funciona como caja única por bodega',
      warnOff:
        'Sin esta opción, el inventario se gestiona por cantidad total por bodega. Los lotes existentes no se eliminan, pero no se validan al facturar.',
    },
    {
      key: 'bloquear_ventas_sin_stock',
      titulo: 'Control de stock',
      descripcion: 'Bloquea ventas y tiquetes cuando el stock disponible es insuficiente.',
      toggle: 'Bloquear ventas sin stock',
      estadoOn: 'Activado — no se puede vender si el stock disponible es 0 o insuficiente',
      estadoOff: 'Desactivado — se puede vender aunque el stock sea 0 o insuficiente',
      warnOn:
        'El sistema valida el stock antes de registrar cada venta. Si la bodega no tiene cantidad suficiente, la línea se rechaza.',
    },
    {
      key: 'reserva_stock',
      titulo: 'Reserva de stock',
      descripcion: 'Separa el stock físico del disponible cuando hay órdenes pendientes de despacho.',
      toggle: 'Activar reserva de stock',
      estadoOn: 'Activado — el stock visible descuenta reservas pendientes',
      estadoOff: 'Desactivado — el stock visible es el físico total',
    },
    {
      key: 'merma_ajustes',
      titulo: 'Merma de Inventario',
      descripcion:
        'Permite marcar ajustes como merma (vencimiento, rotura, hurto, etc.) para reportes de gestión.',
      toggle: 'Habilitar Merma en Ajustes de Inventario',
      estadoOn: 'Activado — los ajustes pueden clasificarse como merma',
      estadoOff: 'Desactivado — los ajustes son ajustes normales, sin distinción de merma',
    },
  ];

  ngOnInit(): void {
    this.inventario.cargarConfig().subscribe({
      error: (err) => this.error.set(apiErrorMessage(err, 'No se pudo cargar la configuración.')),
    });
  }

  activo(key: InventarioConfigKey): boolean {
    return Boolean(this.inventario.config()[key]);
  }

  toggle(key: InventarioConfigKey): void {
    if (this.saving()) {
      return;
    }
    const siguiente = !this.activo(key);
    this.saving.set(key);
    this.error.set('');
    this.inventario.actualizarConfig({ [key]: siguiente }).subscribe({
      next: () => this.saving.set(null),
      error: (err) => {
        this.saving.set(null);
        this.error.set(apiErrorMessage(err, 'No se pudo guardar la configuración.'));
      },
    });
  }
}
