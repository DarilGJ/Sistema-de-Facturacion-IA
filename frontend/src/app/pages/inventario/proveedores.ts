import { Component } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-proveedores',
  imports: [InventarioNav],
  templateUrl: './proveedores.html',
  styleUrl: './inventario-shared.css',
})
export class Proveedores {
  constructor(readonly inventario: InventarioService) {}
}
