import { Component } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-categorias',
  imports: [InventarioNav],
  templateUrl: './categorias.html',
  styleUrl: './inventario-shared.css',
})
export class Categorias {
  constructor(readonly inventario: InventarioService) {}
}
