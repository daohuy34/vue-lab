import fg from 'fast-glob';
import { parse } from '@vue/compiler-sfc';
import { watch, FSWatcher } from 'chokidar';
import { ComponentMeta, FileWatchEvent, WatchEvent, DEFAULT_SRC_DIR, DEFAULT_COMPONENTS_PATTERN } from '@vue-lab/core';
import { basename, dirname, relative, join } from 'path';
import { ComponentRegistry } from './registry.js';
import { parseSFC } from './parser.js';

export interface ScannerOptions {
  root: string;
  srcDir?: string;
  pattern?: string;
  onChange?: (event: FileWatchEvent) => void;
}

export class Scanner {
  private root: string;
  private srcDir: string;
  private pattern: string;
  private registry: ComponentRegistry;
  private watcher?: FSWatcher;
  public onChange?: (event: FileWatchEvent) => void;
  private usedByMap: Map<string, Set<string>> = new Map();

  constructor(options: ScannerOptions) {
    this.root = options.root;
    this.srcDir = options.srcDir || DEFAULT_SRC_DIR;
    this.pattern = options.pattern || DEFAULT_COMPONENTS_PATTERN;
    this.onChange = options.onChange;
    this.registry = new ComponentRegistry();
  }

  async scan(): Promise<ComponentMeta[]> {
    const globPattern = join(this.root, this.srcDir, '**/*.vue');
    const files = await fg(globPattern, { cwd: this.root, onlyFiles: true });

    const components: ComponentMeta[] = [];

    for (const file of files) {
      const meta = await this.extractComponentMeta(file);
      if (meta) {
        components.push(meta);
      }
    }

    this.registry.loadAll(components);
    this.buildUsedByMap(components);
    return components;
  }

  async scanWithAnalysis(): Promise<ComponentMeta[]> {
    const globPattern = join(this.root, this.srcDir, '**/*.vue');
    const files = await fg(globPattern, { cwd: this.root, onlyFiles: true });

    const components: ComponentMeta[] = [];

    for (const file of files) {
      const meta = await this.extractComponentMetaWithAnalysis(file);
      if (meta) {
        components.push(meta);
      }
    }

    this.registry.loadAll(components);
    this.buildUsedByMap(components);

    for (const component of components) {
      if (this.usedByMap.has(component.id)) {
        component.usedBy = Array.from(this.usedByMap.get(component.id) || []);
      }
    }

    return components;
  }

  private buildUsedByMap(components: ComponentMeta[]): void {
    this.usedByMap.clear();
    
    for (const component of components) {
      if (!this.usedByMap.has(component.id)) {
        this.usedByMap.set(component.id, new Set());
      }
      
      const deps = component.dependencies || [];
      for (const depName of deps) {
        const depComponent = components.find(c => c.name === depName);
        if (depComponent) {
          const usedBy = this.usedByMap.get(depComponent.id);
          if (usedBy) {
            usedBy.add(component.id);
          }
        }
      }
    }
  }

  getUsedBy(componentId: string): string[] {
    return Array.from(this.usedByMap.get(componentId) || []);
  }

  private async extractComponentMetaWithAnalysis(filePath: string): Promise<ComponentMeta | null> {
    try {
      const fullPath = filePath.startsWith('/') 
        ? filePath 
        : join(this.root, this.srcDir, filePath);
      
      const { readFile } = await import('fs/promises');
      const content = await readFile(fullPath, 'utf-8');
      
      const parsed = parseSFC(content, { filename: filePath });
      parse(content);
      
      const fileName = basename(filePath, '.vue');
      const relativePath = relative(this.root, fullPath);
      const dir = dirname(relativePath);
      
      const namespace = this.extractNamespace(dir);
      const id = this.generateId(namespace, fileName, dir);

      return {
        id,
        name: fileName,
        namespace,
        path: filePath,
        props: parsed.props,
        emits: parsed.emits,
        slots: parsed.slots,
        dependencies: parsed.dependencies,
      };
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  private async extractComponentMeta(filePath: string): Promise<ComponentMeta | null> {
    try {
      const fullPath = filePath.startsWith('/') 
        ? filePath 
        : join(this.root, this.srcDir, filePath);
      
      const { readFile } = await import('fs/promises');
      const content = await readFile(fullPath, 'utf-8');
      
      parse(content);
      
      const fileName = basename(filePath, '.vue');
      const relativePath = relative(this.root, fullPath);
      const dir = dirname(relativePath);
      
      const namespace = this.extractNamespace(dir);
      const id = this.generateId(namespace, fileName, dir);

      return {
        id,
        name: fileName,
        namespace,
        path: filePath,
      };
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  private extractNamespace(dirPath: string): string {
    if (dirPath === '.' || dirPath === '') {
      return 'Shared';
    }
    
    const parts = dirPath.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      return 'Shared';
    }
    
    if (parts.length === 1) {
      return 'Shared';
    }
    
    const lastPart = parts[parts.length - 1];
    
    return this.formatNamespace(lastPart);
  }

  private formatNamespace(name: string): string {
    return name
      .split(/[-_]/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private generateId(namespace: string, name: string, dirPath: string): string {
    if (dirPath === '.' || dirPath === '') {
      return name;
    }
    const dirName = dirname(dirPath).replace(/[/\\]/g, '-');
    if (dirName === '.') {
      return `${namespace}/${name}`;
    }
    return `${namespace}/${name}`;
  }

  async watch(): Promise<void> {
    const globPattern = join(this.root, this.srcDir, '**/*.vue');
    
    this.watcher = watch(globPattern, {
      cwd: this.root,
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
    });

    this.watcher
      .on('add', (path) => this.handleFileEvent('add', path))
      .on('change', (path) => this.handleFileEvent('change', path))
      .on('unlink', (path) => this.handleFileEvent('unlink', path));
  }

  private async handleFileEvent(event: WatchEvent, filePath: string): Promise<void> {
    const relativePath = relative(this.root, filePath);
    
    if (event === 'unlink') {
      const existing = this.registry.getByPath(relativePath);
      if (existing) {
        this.registry.unregister(existing.id);
        this.onChange?.({
          event,
          path: relativePath,
          component: existing,
        });
      }
    } else {
      const meta = await this.extractComponentMetaWithAnalysis(relativePath);
      if (meta) {
        const existing = this.registry.getByPath(relativePath);
        if (existing) {
          this.registry.unregister(existing.id);
        }
        this.registry.register(meta);
        this.buildUsedByMap(this.registry.getComponents());
        this.onChange?.({
          event,
          path: relativePath,
          component: meta,
        });
      }
    }
  }

  getComponents(): ComponentMeta[] {
    return this.registry.getComponents();
  }

  getComponent(id: string): ComponentMeta | undefined {
    return this.registry.getComponent(id);
  }

  getByNamespace(namespace: string): ComponentMeta[] {
    return this.registry.getByNamespace(namespace);
  }

  getNamespaces(): string[] {
    return this.registry.getNamespaces();
  }

  search(query: string): ComponentMeta[] {
    return this.registry.search(query);
  }

  async stop(): Promise<void> {
    await this.watcher?.close();
  }
}
