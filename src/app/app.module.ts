/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */

/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */

import { NgModule } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TitlebarModule } from './titlebar/titlebar.module';
import { FileExplorerModule } from './directory-tree/file-explorer.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconRegistry } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';

const icons = [
  { name: 'folder', url: '../assets/icons/folder_round.svg' },
  {
    name: 'keyboard_arrow_right',
    url: '../assets/icons/keyboard_arrow_right_round.svg',
  },
  {
    name: 'keyboard_arrow_down',
    url: '../assets/icons/keyboard_arrow_down_round.svg',
  },
  {
    name: 'description',
    url: '../assets/icons/description_round.svg',
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    TitlebarModule,
    FileExplorerModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    for (let i = 0; i < icons.length; i++) {
      this.matIconRegistry.addSvgIcon(
        icons[i].name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(icons[i].url)
      );
    }
  }
}
