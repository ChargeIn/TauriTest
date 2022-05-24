/*
 * Copyright (c) 2022.
 * Florian Plesker
 * florian.plesker@web.de
 */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { watch } from 'tauri-plugin-fs-watch-api';
import { invoke } from '@tauri-apps/api/tauri';

interface PathNode {
  path: string;
  name: string;
  is_dir: boolean;
  file_type: string;
  icon: string;
}

interface PathBuildNode extends PathNode {
  children: PathBuildNode[];
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
  prefix_icon: string;
  level_offset: number;
  level: number;
  prev: PathBuildNode | null;
  next: PathBuildNode | null;
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: 'file-explorer.component.html',
  styleUrls: ['file-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnChanges, OnDestroy {
  @Input() path: string | null = null;

  // used for virtual scroll port
  drawnNodes: PathBuildNode[] = [];
  drawStack: PathBuildNode[] = [];
  drawTopOffset = 0;
  drawTop = 0;
  drawHeight = 10;
  screenHeight = 100;
  nodeCount = 1;

  focused: PathBuildNode | null = null;

  readonly nodeHeight = 31;
  readonly offsetPerLevel = 24;

  rootNode: PathBuildNode = {
    name: 'No Project loaded',
    children: [],
    expanded: false,
    loaded: true,
    loading: false,
    prefix_icon: '',
    path: '',
    is_dir: true,
    file_type: '',
    icon: 'folder',
    level_offset: 0,
    level: 0,
    prev: null,
    next: null,
  };

  private stopWatching: (() => void) | null = null;

  constructor(private readonly cd: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['path']) {
      this.openPath();
      this.updateWatcher();
    }
  }

  ngOnDestroy() {
    if (this.stopWatching) {
      this.stopWatching();
    }
  }

  openPath() {
    if (!this.path) {
      return;
    }

    const segments = this.path.includes('/')
      ? this.path.split('/')
      : [this.path];
    this.rootNode = {
      name: segments[segments.length - 1],
      children: [],
      expanded: false,
      loaded: false,
      loading: false,
      path: this.path,
      icon: 'folder',
      is_dir: true,
      prefix_icon: '',
      file_type: '',
      level: 0,
      level_offset: 0,
      prev: null,
      next: null,
    };
    this.drawnNodes = [this.rootNode];
    this.nodeCount = 1;
    this.onNodeClick(this.rootNode, 0);
  }

  async updateWatcher() {
    if (this.stopWatching) {
      this.stopWatching();
    }

    if (!this.path) {
      return;
    }

    this.stopWatching = await watch(this.path, { recursive: true }, (event) => {
      console.log(event);
    });
  }

  onNodeClick(node: PathBuildNode, index: number) {
    this.focused = node;

    if (node.is_dir) {
      if (node.loaded) {
        node.expanded = !node.expanded;
        node.prefix_icon =
          node.children.length > 0
            ? node.expanded
              ? 'keyboard_arrow_down'
              : 'keyboard_arrow_right'
            : '';

        if (node.expanded) {
          if (node.children.length > 0) {
            node.next = node.children[0];
          }
          this.addDrawnNodes(index, node.children);
        } else {
          this.collapseAllChilds(node);
          this.removeDrawnNodes(index, node.children.length);
        }
      } else {
        if (node.loading) {
          return;
        }

        this.addLoadingChild(node);
        this.addDrawnNodes(index, node.children);
        node.loading = true;
        node.expanded = true;
        node.prefix_icon = 'keyboard_arrow_down';

        invoke('discover_path', { path: node.path }).then(
          (v) => {
            node.loaded = true;

            // remove loading node;
            node.next = node.children[0].next;
            this.removeDrawnNodes(index, node.children.length);

            // set up new children
            node.children = v as PathBuildNode[];
            this.cd.markForCheck();

            if (node.children.length === 0) {
              return;
            }

            let prev = node;
            for (let i = 0; i < node.children.length - 1; i++) {
              this.setUpNode(
                node.level + 1,
                node.children[i],
                prev,
                node.children[i + 1]
              );
              prev = node.children[i];
            }
            this.setUpNode(
              node.level + 1,
              node.children[node.children.length - 1],
              prev,
              node.next
            );
            node.next = node.children[0];

            this.addDrawnNodes(index, node.children);
            this.cd.markForCheck();
          },
          (err) => {
            node.loaded = true;

            // remove loading node;
            node.next = node.children[0].next;
            this.removeDrawnNodes(index, node.children.length);

            // setup error child
            this.addErrorChild(err, node);
            this.addDrawnNodes(index, node.children);

            this.cd.markForCheck();
          }
        );
      }
    }
  }

  setUpNode(
    level: number,
    node: PathBuildNode,
    prev: PathBuildNode | null,
    next: PathBuildNode | null
  ) {
    node.children = [];
    node.loaded = false;
    node.expanded = false;
    node.loading = false;
    node.prefix_icon = node.is_dir
      ? node.expanded
        ? 'keyboard_arrow_down'
        : 'keyboard_arrow_right'
      : '';
    node.level = level;
    node.level_offset = level * this.offsetPerLevel;
    node.prev = prev;
    node.next = next;
  }

  private collapseAllChilds(node: PathBuildNode) {
    if (node.children.length > 0) {
      node.next = node.children[node.children.length - 1].next;
      for (let i = 0; i < node.children.length; i++) {
        this.collapseAllChilds(node.children[i]);
      }
    }
  }

  private addLoadingChild(parent: PathBuildNode) {
    const level = parent.level + 1;
    const loading = {
      name: 'loading...',
      path: '',
      is_dir: false,
      file_type: '',
      icon: '',
      children: [],
      expanded: true,
      loaded: true,
      loading: false,
      prefix_icon: '',
      level,
      level_offset: level * this.offsetPerLevel,
      prev: parent,
      next: parent.next,
    };
    parent.next = loading;
    parent.children = [loading];
  }

  private addErrorChild(err: string, parent: PathBuildNode) {
    const level = parent.level + 1;
    const errNode = {
      name: 'Error: ' + err,
      path: '',
      is_dir: false,
      file_type: '',
      icon: '',
      children: [],
      expanded: true,
      loaded: true,
      loading: false,
      prefix_icon: '',
      level: level,
      level_offset: level * this.offsetPerLevel,
      prev: parent,
      next: parent.next,
    };
    parent.next = errNode;
    parent.children = [errNode];
  }

  private addDrawnNodes(index: number, nodes: PathBuildNode[]) {
    if (nodes.length === 0) {
      return;
    }

    this.nodeCount += nodes.length;
    this.screenHeight += this.nodeCount * this.nodeHeight;

    const drawableCount = this.drawHeight - index - 1;
    const drawCount = Math.min(drawableCount, nodes.length);
    const restCount = Math.max(drawableCount - nodes.length, 0);

    const newNodes = this.drawnNodes.splice(0, index + 1);
    for (let i = 0; i < drawCount; i++) {
      newNodes.push(nodes[i]);
    }
    newNodes.push(...this.drawnNodes.splice(0, restCount));

    this.drawnNodes = newNodes;
  }

  private removeDrawnNodes(index: number, deleteCount: number) {
    if (deleteCount === 0) {
      return;
    }

    this.nodeCount -= deleteCount;
    this.screenHeight = this.nodeCount * this.nodeHeight;

    this.drawnNodes.splice(index + 1, deleteCount);

    let next = this.drawnNodes[this.drawnNodes.length - 1].next;
    let drawableCount = this.drawHeight - this.drawnNodes.length;

    while (next !== null && drawableCount > 0) {
      this.drawnNodes.push(next);
      next = next.next;
      drawableCount--;
    }
    this.cd.markForCheck();
  }

  onScroll($event: Event) {
    console.log($event);
  }

  onWheel($event: WheelEvent) {
    console.log($event);

    this.drawTopOffset += $event.deltaY;
    this.drawTop = Math.max(
      Math.floor(this.drawTopOffset / this.nodeHeight) * this.nodeHeight,
      0
    );
  }
}
