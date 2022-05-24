/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */
import { NgModule } from '@angular/core';
import { FileExplorerComponent } from './file-explorer.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [CommonModule, MatIconModule],
  declarations: [FileExplorerComponent],
  exports: [FileExplorerComponent],
})
export class FileExplorerModule {}
