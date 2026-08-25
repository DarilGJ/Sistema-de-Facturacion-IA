import { Component } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-existencias',
  imports: [InventarioNav],
  templateUrl: './existencias.html',
  styleUrl: './inventario-shared.css',
})
export class Existencias {
  constructor(readonly inventario: InventarioService) {}
}
