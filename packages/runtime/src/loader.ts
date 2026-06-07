import { ComponentId } from '@vue-lab/core';
import { join, dirname, relative, isAbsolute } from 'path';
import { readFile } from 'fs/promises';

export interface LoaderOptions {
  root: string;
}

export class ComponentLoader {
  private root: string;
  private cache: Map<ComponentId, any> = new Map();
  private sourceCache: Map<ComponentId, string> = new Map();

  constructor(options: LoaderOptions) {
    this.root = options.root;
  }

  async load(componentId: ComponentId): Promise<any> {
    if (this.cache.has(componentId)) {
      return this.cache.get(componentId);
    }

    try {
      const componentPath = this.resolveComponentPath(componentId);
      const module = await import(/* @vite-ignore */ componentPath);
      
      this.cache.set(componentId, module.default || module);
      return this.cache.get(componentId);
    } catch (error) {
      console.warn(`Failed to load component ${componentId}:`, error);
      return null;
    }
  }

  async getSource(componentId: ComponentId): Promise<string | null> {
    if (this.sourceCache.has(componentId)) {
      return this.sourceCache.get(componentId) ?? null;
    }

    try {
      const filePath = this.resolveComponentFilePath(componentId);
      const source = await readFile(filePath, 'utf-8');
      this.sourceCache.set(componentId, source);
      return source;
    } catch (error) {
      console.warn(`Failed to read source for ${componentId}:`, error);
      return null;
    }
  }

  resolveComponentPath(componentId: ComponentId): string {
    if (componentId.includes('/')) {
      const parts = componentId.split('/');
      if (parts.length === 2) {
        const [namespace, name] = parts;
        const dirName = namespace.charAt(0).toLowerCase() + namespace.slice(1);
        return join(this.root, 'src', dirName, `${name}.vue`);
      }
      return join(this.root, 'src', componentId.replace(/\//g, '/') + '.vue');
    }
    return join(this.root, 'src', `${componentId}.vue`);
  }

  resolveComponentFilePath(componentId: ComponentId): string {
    return this.resolveComponentPath(componentId);
  }

  getSourceDir(): string {
    return this.root;
  }

  clearCache(): void {
    this.cache.clear();
    this.sourceCache.clear();
  }
}
