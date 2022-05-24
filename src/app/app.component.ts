/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */
import { Component } from '@angular/core';
import { appWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Test';

  constructor() {
    appWindow.toggleMaximize();
  }
}
