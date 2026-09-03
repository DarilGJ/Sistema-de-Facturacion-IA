import { Component, HostListener, input, output, signal } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-row-menu',
  imports: [UiIcon],
  templateUrl: './row-menu.html',
  styleUrl: './row-menu.css',
})
export class RowMenu {
  readonly canDeactivate = input(true);
  readonly canConvert = input(false);
  readonly edit = output<void>();
  readonly deactivate = output<void>();
  readonly convert = output<void>();
  readonly open = signal(false);

  @HostListener('document:click')
  close(): void {
    this.open.set(false);
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }
}
