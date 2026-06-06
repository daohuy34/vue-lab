import { readFile } from 'fs/promises';
import { join, relative } from 'path';
import { ComponentAnalysis, ComponentId, ComponentMeta } from '@vue-lab/core';
import { parseSFC, ParsedSFC } from './parser.js';
import { Scanner } from './scanner.js';
import { ComponentRegistry } from './registry.js';

export interface AnalyzerOptions {
  root: string;
  srcDir?: string;
}

export class ComponentAnalyzer {
  private root: string;
  private srcDir: string;
  private scanner: Scanner;
  private registry: ComponentRegistry;
  private analysisCache: Map<ComponentId, ComponentAnalysis> = new Map();

  constructor(options: AnalyzerOptions) {
    this.root = options.root;
    this.srcDir = options.srcDir || 'src';
    this.scanner = new Scanner({ root: options.root, srcDir: options.srcDir });
    this.registry = new ComponentRegistry();
  }

  async analyzeAll(): Promise<ComponentAnalysis[]> {
    const components = await this.scanner.scan();
    const analyses: ComponentAnalysis[] = [];

    for (const component of components) {
      const analysis = await this.analyze(component);
      if (analysis) {
        analyses.push(analysis);
        this.analysisCache.set(analysis.meta.id, analysis);
      }
    }

    return analyses;
  }

  async analyze(component: ComponentMeta): Promise<ComponentAnalysis | null> {
    try {
      const fullPath = this.getFullPath(component.path);
      const content = await readFile(fullPath, 'utf-8');
      const parsed = parseSFC(content, { filename: component.path });

      const analysis: ComponentAnalysis = {
        meta: component,
        props: parsed.props,
        emits: parsed.emits,
        slots: parsed.slots,
        dependencies: parsed.dependencies,
        dependenciesGraph: this.buildDependenciesGraph(parsed.dependencies),
      };

      return analysis;
    } catch (error) {
      console.warn(`Failed to analyze ${component.path}:`, error);
      return null;
    }
  }

  async analyzeById(id: string): Promise<ComponentAnalysis | null> {
    const cached = this.analysisCache.get(id);
    if (cached) return cached;

    const component = this.scanner.getComponent(id);
    if (!component) return null;

    return this.analyze(component);
  }

  private getFullPath(relativePath: string): string {
    if (relativePath.startsWith('/')) {
      return relativePath;
    }
    return join(this.root, this.srcDir, relativePath);
  }

  private buildDependenciesGraph(dependencies: string[]): Record<ComponentId, ComponentId[]> {
    const graph: Record<string, string[]> = {};
    
    for (const dep of dependencies) {
      // Try to find matching component in registry
      const matchingComponent = this.findComponentByName(dep);
      if (matchingComponent) {
        graph[matchingComponent.id] = [];
      }
    }
    
    return graph;
  }

  private findComponentByName(name: string): ComponentMeta | undefined {
    const allComponents = this.scanner.getComponents();
    
    // Exact match
    const exact = allComponents.find(c => c.name === name);
    if (exact) return exact;
    
    // Try with different casing
    const lowerName = name.toLowerCase();
    return allComponents.find(c => c.name.toLowerCase() === lowerName);
  }

  getAnalysis(id: string): ComponentAnalysis | undefined {
    return this.analysisCache.get(id);
  }

  getAllAnalyses(): ComponentAnalysis[] {
    return Array.from(this.analysisCache.values());
  }

  clearCache(): void {
    this.analysisCache.clear();
  }

  getComponents(): ComponentMeta[] {
    return this.scanner.getComponents();
  }

  getComponent(id: string): ComponentMeta | undefined {
    return this.scanner.getComponent(id);
  }

  async stop(): Promise<void> {
    await this.scanner.stop();
  }
}
