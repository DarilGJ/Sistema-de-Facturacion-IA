import { Component, HostListener, input, output, signal } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

export interface RowMenuItem {
  id: string;
  label: string;
  icon: string;
  accent?: boolean;
}

@Component({
  selector: 'app-row-menu',
  imports: [UiIcon],
  templateUrl: './row-menu.html',
  styleUrl: './row-menu.css',
})
export class RowMenu {
  readonly items = input<RowMenuItem[]>([]);
  readonly canDeactivate = input(true);
  readonly canConvert = input(false);
  readonly deactivateLabel = input('Desactivar');
  readonly deactivateDanger = input(true);
  readonly canPromote = input(false);
  readonly promoteLabel = input('Marcar como principal');
  readonly edit = output<void>();
  readonly deactivate = output<void>();
  readonly convert = output<void>();
  readonly promote = output<void>();
  readonly select = output<string>();
  readonly open = signal(false);

  @HostListener('document:click')
  close(): void {
    this.open.set(false);
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  pick(id: string): void {
    this.select.emit(id);
    this.open.set(false);
  }
}
