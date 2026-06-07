import { ComponentMeta } from '@vue-lab/core';

export interface DependencyInfo {
  componentId: string;
  imports: string[];
  importedBy: string[];
  depth: number;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  label: string;
  namespace: string;
  depth: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'import' | 'slot' | 'prop';
}

export interface UsedByResult {
  componentId: string;
  usedBy: ComponentMeta[];
}

export class DependencyAnalyzer {
  private dependencies: Map<string, Set<string>> = new Map();
  private reverseDependencies: Map<string, Set<string>> = new Map();

  analyze(components: ComponentMeta[]): DependencyGraph {
    this.buildDependencyMap(components);
    
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();

    for (const component of components) {
      if (visited.has(component.id)) continue;
      visited.add(component.id);

      const depth = this.calculateDepth(component.id);
      nodes.push({
        id: component.id,
        label: component.name,
        namespace: component.namespace,
        depth,
      });

      const imports = this.dependencies.get(component.id);
      if (imports) {
        for (const importedId of imports) {
          edges.push({
            from: component.id,
            to: importedId,
            type: 'import',
          });
        }
      }
    }

    return { nodes, edges };
  }

  private buildDependencyMap(components: ComponentMeta[]): void {
    for (const component of components) {
      if (!this.dependencies.has(component.id)) {
        this.dependencies.set(component.id, new Set());
      }
      if (!this.reverseDependencies.has(component.id)) {
        this.reverseDependencies.set(component.id, new Set());
      }
    }
  }

  getUsedBy(componentId: string): string[] {
    return Array.from(this.reverseDependencies.get(componentId) || []);
  }

  getDependencies(componentId: string): string[] {
    return Array.from(this.dependencies.get(componentId) || []);
  }

  private calculateDepth(componentId: string, visited = new Set<string>()): number {
    if (visited.has(componentId)) return 0;
    visited.add(componentId);

    const deps = this.dependencies.get(componentId);
    if (!deps || deps.size === 0) return 0;

    let maxDepth = 0;
    for (const dep of deps) {
      const depth = this.calculateDepth(dep, visited);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  buildTree(componentId: string, components: ComponentMeta[]): TreeNode {
    const component = components.find(c => c.id === componentId);
    if (!component) {
      return { id: '', label: 'Unknown', children: [] };
    }

    const children: TreeNode[] = [];
    const deps = this.dependencies.get(componentId) || [];

    for (const depId of deps) {
      children.push(this.buildTree(depId, components));
    }

    return {
      id: componentId,
      label: component.name,
      namespace: component.namespace,
      children,
    };
  }

  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const deps = this.dependencies.get(nodeId) || [];
      for (const depId of deps) {
        if (!visited.has(depId)) {
          dfs(depId, [...path]);
        } else if (recursionStack.has(depId)) {
          const cycleStart = path.indexOf(depId);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), depId]);
          }
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const componentId of this.dependencies.keys()) {
      if (!visited.has(componentId)) {
        dfs(componentId, []);
      }
    }

    return cycles;
  }

  getComponentDepth(componentId: string): number {
    return this.calculateDepth(componentId);
  }

  getLongestChain(): string[] {
    let longestPath: string[] = [];
    
    const dfs = (
      nodeId: string, 
      path: string[],
      visited: Set<string>
    ): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const newPath = [...path, nodeId];
      if (newPath.length > longestPath.length) {
        longestPath = newPath;
      }

      const deps = this.dependencies.get(nodeId) || [];
      for (const depId of deps) {
        dfs(depId, newPath, new Set(visited));
      }
    };

    for (const componentId of this.dependencies.keys()) {
      dfs(componentId, [], new Set());
    }

    return longestPath;
  }
}

export interface TreeNode {
  id: string;
  label: string;
  namespace?: string;
  children: TreeNode[];
}
