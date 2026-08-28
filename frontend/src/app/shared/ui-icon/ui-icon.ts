import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './ui-icon.html',
  styleUrl: './ui-icon.css',
})
export class UiIcon {
  readonly name = input.required<string>();
}
