/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { appWindow } from '@tauri-apps/api/window';

@Component({
  selector: 'app-titlebar',
  templateUrl: 'titlebar.component.html',
  styleUrls: ['titlebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitlebarComponent {
  maximize() {
    appWindow.toggleMaximize();
  }

  minimize() {
    appWindow.minimize();
  }

  close() {
    appWindow.close();
  }
}
