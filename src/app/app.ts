import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InvalidSubmitFocus } from '@core/a11y/invalid-submit-focus';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    // App-wide behaviour, installed once: a refused submit takes the user to
    // the field that refused it. See InvalidSubmitFocus for why this is not a
    // directive each of the twenty-three forms has to remember to import.
    inject(InvalidSubmitFocus).install();
  }
}
