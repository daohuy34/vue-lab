import type { Dependency, DetectionResult, DependencyType } from './types.js';

export interface DetectorOptions {
  strict?: boolean;
}

export class DependencyDetector {
  private patterns: Map<DependencyType, RegExp[]> = new Map();

  constructor(_options: DetectorOptions = {}) {
    this.initPatterns();
  }

  private initPatterns(): void {
    this.patterns.set('pinia', [
      /\buseStore\s*\(/,
      /\buse[A-Z]\w*Store\s*\(/,
      /\bdefineStore\s*\(/,
      /\bcreatePinia\s*\(/,
      /\bPinia\b/,
      /\bfrom\s+['"]pinia['"]/,
      /\bfrom\s+['"]@pinia\/nuxt['"]/,
    ]);

    this.patterns.set('router', [
      /\buseRouter\s*\(/,
      /\buseRoute\s*\(/,
      /\bcreateRouter\s*\(/,
      /\bcreateWebHistory\s*\(/,
      /\bcreateWebHashHistory\s*\(/,
      /\bcreateMemoryHistory\s*\(/,
      /\bRouterLink\b/,
      /\bRouterView\b/,
      /\bfrom\s+['"]vue-router['"]/,
    ]);

    this.patterns.set('i18n', [
      /\buseI18n\s*\(/,
      /\bcreateI18n\s*\(/,
      /\bt\(['"`]/,
      /\$t\(/,
      /\bfrom\s+['"]vue-i18n['"]/,
    ]);

    this.patterns.set('inject', [
      /\binject\s*\(/,
      /\bprovide\s*\(/,
      /\binjectionKey\b/,
      /\bInjectionKey\b/,
    ]);

    this.patterns.set('nuxt', [
      /\buseNuxtApp\s*\(/,
      /\buseNuxt\s*\(/,
      /\buseAsyncData\s*\(/,
      /\buseFetch\s*\(/,
      /\buseState\s*\(/,
      /\buseLazyAsyncData\s*\(/,
      /\buseLazyFetch\s*\(/,
      /\bcallOnce\s*\(/,
      /\buseCookie\s*\(/,
      /\buseSeoMeta\s*\(/,
      /\buseHead\s*\(/,
      /\bdefinePageMeta\s*\(/,
      /\bdefineNuxtComponent\s*\(/,
      /\bfrom\s+['"]#app['"]/,
      /\bfrom\s+['"]@nuxt\/app['"]/,
      /\bfrom\s+['"]nuxt['"]/,
    ]);
  }

  detect(source: string): DetectionResult {
    const dependencies: Dependency[] = [];
    
    for (const [type, patterns] of this.patterns) {
      const matchedPattern = patterns.find(pattern => pattern.test(source));
      if (matchedPattern) {
        const dep = this.createDependency(type, source);
        if (!dependencies.some(d => d.type === type)) {
          dependencies.push(dep);
        }
      }
    }

    return {
      dependencies,
      hasPinia: dependencies.some(d => d.type === 'pinia'),
      hasRouter: dependencies.some(d => d.type === 'router'),
      hasI18n: dependencies.some(d => d.type === 'i18n'),
      hasNuxt: dependencies.some(d => d.type === 'nuxt'),
      hasInject: dependencies.some(d => d.type === 'inject'),
    };
  }

  private createDependency(type: DependencyType, source: string): Dependency {
    switch (type) {
      case 'pinia':
        return {
          type: 'pinia',
          name: this.extractStoreName(source),
          message: 'Component uses Pinia store',
          missing: ['pinia', '@pinia/nuxt'],
        };

      case 'router':
        return {
          type: 'router',
          name: this.extractRouterUsage(source),
          message: 'Component uses Vue Router',
          missing: ['vue-router'],
        };

      case 'i18n':
        return {
          type: 'i18n',
          name: this.extractI18nUsage(source),
          message: 'Component uses vue-i18n',
          missing: ['vue-i18n'],
        };

      case 'inject':
        return {
          type: 'inject',
          name: this.extractInjectionKey(source),
          message: 'Component uses inject/provide',
          missing: [],
        };

      case 'nuxt':
        return {
          type: 'nuxt',
          name: this.extractNuxtUsage(source),
          message: 'Component uses Nuxt composables',
          missing: ['nuxt', '@nuxt/kit'],
        };

      default:
        return {
          type: 'unknown',
          message: 'Unknown dependency detected',
          missing: [],
        };
    }
  }

  private extractStoreName(source: string): string | undefined {
    const storeMatch = source.match(/\buse([A-Z]\w*Store)\s*\(/);
    return storeMatch ? storeMatch[1] : undefined;
  }

  private extractRouterUsage(source: string): string | undefined {
    const routerMatch = source.match(/\b(useRouter|useRoute)\s*\(/);
    return routerMatch ? routerMatch[1] : undefined;
  }

  private extractI18nUsage(source: string): string | undefined {
    if (/\buseI18n\s*\(/.test(source)) return 'useI18n';
    if (/\bt\(/.test(source)) return 't()';
    if (/\$t\(/.test(source)) return '$t()';
    return undefined;
  }

  private extractInjectionKey(source: string): string | undefined {
    const keyMatch = source.match(/\binject\s*<\s*(\w+)/);
    return keyMatch ? keyMatch[1] : undefined;
  }

  private extractNuxtUsage(source: string): string | undefined {
    const nuxtMatch = source.match(/\buse(NuxtApp|Nuxt|AsyncData|Fetch|State|Cookie)\s*\(/);
    return nuxtMatch ? `use${nuxtMatch[1]}` : undefined;
  }

  getMissingPackages(result: DetectionResult): string[] {
    const packages = new Set<string>();
    
    for (const dep of result.dependencies) {
      for (const pkg of dep.missing) {
        packages.add(pkg);
      }
    }
    
    return Array.from(packages);
  }

  formatReport(result: DetectionResult): string {
    const lines: string[] = ['Dependency Detection Report', '='.repeat(40)];
    
    if (result.dependencies.length === 0) {
      lines.push('No dependencies detected.');
      return lines.join('\n');
    }

    lines.push(`Found ${result.dependencies.length} dependency(ies):\n`);
    
    for (const dep of result.dependencies) {
      lines.push(`- ${dep.type.toUpperCase()}: ${dep.message}`);
      if (dep.name) {
        lines.push(`  Name: ${dep.name}`);
      }
      if (dep.missing.length > 0) {
        lines.push(`  Missing packages: ${dep.missing.join(', ')}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
