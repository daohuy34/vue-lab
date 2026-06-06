import { ComponentId } from '@vue-lab/core';
import { join } from 'path';
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
      const module = await import(componentPath);
      
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

  private resolveComponentPath(componentId: ComponentId): string {
    const [namespace, name] = componentId.split('/');
    
    if (namespace === 'Shared') {
      return join(this.root, 'src', `${name}.vue`);
    }
    
    const dirName = namespace.charAt(0).toLowerCase() + namespace.slice(1);
    return join(this.root, 'src', dirName, `${name}.vue`);
  }

  private resolveComponentFilePath(componentId: ComponentId): string {
    return this.resolveComponentPath(componentId);
  }

  clearCache(): void {
    this.cache.clear();
    this.sourceCache.clear();
  }
}
