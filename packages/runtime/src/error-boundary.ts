import { RenderResult, RenderStatus } from '@vue-lab/core';

interface ErrorPattern {
  pattern: RegExp;
  type: 'MISSING_STORE' | 'MISSING_ROUTER' | 'MISSING_I18N' | 'MISSING_INJECT' | 'MISSING_NUXT' | 'COMPILE_ERROR' | 'UNKNOWN';
  message: string;
  missingDeps?: string[];
}

export class ErrorBoundary {
  private errorPatterns: ErrorPattern[] = [
    {
      pattern: /useStore|pinia|Pinia|createPinia/,
      type: 'MISSING_STORE',
      message: 'Component requires Pinia store',
      missingDeps: ['pinia'],
    },
    {
      pattern: /useRouter|useRoute|createRouter|createMemoryHistory/,
      type: 'MISSING_ROUTER',
      message: 'Component requires Vue Router',
      missingDeps: ['vue-router'],
    },
    {
      pattern: /useI18n|createI18n|vue-i18n/,
      type: 'MISSING_I18N',
      message: 'Component requires vue-i18n',
      missingDeps: ['vue-i18n'],
    },
    {
      pattern: /inject\(|provide\(|injectionKey/,
      type: 'MISSING_INJECT',
      message: 'Component requires injected dependencies',
    },
    {
      pattern: /useNuxtApp|useNuxt|useAsyncData|useFetch/,
      type: 'MISSING_NUXT',
      message: 'Component requires Nuxt context',
      missingDeps: ['nuxt'],
    },
  ];

  catch(error: unknown): RenderResult {
    const message = this.extractMessage(error);

    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(message)) {
        return {
          status: 'warning',
          error: {
            type: pattern.type,
            message: pattern.message,
            missingDeps: pattern.missingDeps,
          },
        };
      }
    }

    return {
      status: 'failed',
      error: {
        type: 'UNKNOWN',
        message,
      },
    };
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  analyzeComponent(source: string): { warnings: string[]; missingDeps: string[] } {
    const warnings: string[] = [];
    const missingDepsSet = new Set<string>();

    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(source)) {
        warnings.push(pattern.message);
        pattern.missingDeps?.forEach(dep => missingDepsSet.add(dep));
      }
    }

    return {
      warnings,
      missingDeps: Array.from(missingDepsSet),
    };
  }
}
