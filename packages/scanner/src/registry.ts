import { ComponentMeta, ComponentId } from '@vue-lab/core';

export class ComponentRegistry {
  private components: Map<ComponentId, ComponentMeta> = new Map();
  private byNamespace: Map<string, ComponentMeta[]> = new Map();
  private byPath: Map<string, ComponentId> = new Map();

  register(component: ComponentMeta): void {
    this.components.set(component.id, component);
    
    if (!this.byNamespace.has(component.namespace)) {
      this.byNamespace.set(component.namespace, []);
    }
    this.byNamespace.get(component.namespace)!.push(component);
    
    this.byPath.set(component.path, component.id);
  }

  unregister(id: ComponentId): ComponentMeta | undefined {
    const component = this.components.get(id);
    if (!component) return undefined;

    this.components.delete(id);
    
    const nsComponents = this.byNamespace.get(component.namespace);
    if (nsComponents) {
      const index = nsComponents.findIndex(c => c.id === id);
      if (index !== -1) {
        nsComponents.splice(index, 1);
      }
    }
    
    this.byPath.delete(component.path);
    
    return component;
  }

  getComponents(): ComponentMeta[] {
    return Array.from(this.components.values());
  }

  getComponent(id: ComponentId): ComponentMeta | undefined {
    return this.components.get(id);
  }

  getByPath(path: string): ComponentMeta | undefined {
    const id = this.byPath.get(path);
    return id ? this.components.get(id) : undefined;
  }

  getByNamespace(namespace: string): ComponentMeta[] {
    return this.byNamespace.get(namespace) || [];
  }

  getNamespaces(): string[] {
    return Array.from(this.byNamespace.keys());
  }

  getComponentCount(): number {
    return this.components.size;
  }

  search(query: string): ComponentMeta[] {
    const lowerQuery = query.toLowerCase();
    return this.getComponents().filter(
      c => c.name.toLowerCase().includes(lowerQuery) ||
           c.namespace.toLowerCase().includes(lowerQuery) ||
           c.path.toLowerCase().includes(lowerQuery)
    );
  }

  clear(): void {
    this.components.clear();
    this.byNamespace.clear();
    this.byPath.clear();
  }

  loadAll(components: ComponentMeta[]): void {
    this.clear();
    for (const component of components) {
      this.register(component);
    }
  }
}
