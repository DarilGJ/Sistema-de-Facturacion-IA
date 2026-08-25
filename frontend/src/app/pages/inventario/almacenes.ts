import { Component } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-almacenes',
  imports: [InventarioNav],
  templateUrl: './almacenes.html',
  styleUrl: './inventario-shared.css',
})
export class Almacenes {
  constructor(readonly inventario: InventarioService) {}
}
