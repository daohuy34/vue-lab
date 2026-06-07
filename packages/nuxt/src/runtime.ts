import { NuxtDetector, type NuxtProjectInfo, type NuxtFeatures } from './detector.js';

export interface NuxtRuntimeOptions {
  rootDir?: string;
  mode?: 'nuxt' | 'vue';
}

export class NuxtRuntime {
  private detector: NuxtDetector;
  private projectInfo: NuxtProjectInfo | null = null;
  private mode: 'nuxt' | 'vue';

  constructor(options: NuxtRuntimeOptions = {}) {
    this.detector = new NuxtDetector(options.rootDir || process.cwd());
    this.mode = options.mode || 'vue';
  }

  async init(): Promise<void> {
    this.projectInfo = await this.detector.detect();
    
    if (this.projectInfo.isNuxtProject) {
      this.mode = 'nuxt';
    }
  }

  isNuxt(): boolean {
    return this.mode === 'nuxt';
  }

  getProjectInfo(): NuxtProjectInfo | null {
    return this.projectInfo;
  }

  getFeatures(): NuxtFeatures | null {
    return this.projectInfo?.features || null;
  }

  getAutoImports(): string[] {
    const autoImports: string[] = [];
    
    // Vue reactivity
    autoImports.push(
      'ref', 'reactive', 'computed', 'watch', 'watchEffect',
      'onMounted', 'onUnmounted', 'onUpdated', 'onBeforeMount',
      'onBeforeUnmount', 'onBeforeUpdate', 'onErrorCaptured',
      'provide', 'inject', 'readonly', 'toRef', 'toRefs',
      'isRef', 'unref', 'shallowRef', 'triggerRef', 'customRef',
      'markRaw', 'toRaw', 'effectScope', 'getCurrentScope',
      'onScopeDispose'
    );

    // Vue Router
    autoImports.push(
      'useRouter', 'useRoute', 'useLink', 'onBeforeRouteEnter',
      'onBeforeRouteLeave', 'onBeforeRouteUpdate'
    );

    // Nuxt composables
    if (this.mode === 'nuxt') {
      autoImports.push(
        'useNuxtApp', 'useNuxtData', 'useAsyncData', 'useFetch',
        'useLazyAsyncData', 'useLazyFetch', 'useFetch',
        'useState', 'useCookie', 'useHead', 'useSeoMeta',
        'useRuntimeConfig', 'useAppConfig', 'useRouter',
        'useRoute', 'useError', 'clearError', 'throwError',
        'defineNuxtPlugin', 'defineNuxtRouteMiddleware'
      );
    }

    return autoImports;
  }

  resolveAutoImport(name: string): { imported: string; from: string } | null {
    const vueReactivity = [
      'ref', 'reactive', 'computed', 'watch', 'watchEffect',
      'onMounted', 'onUnmounted'
    ];

    const vueRouter = ['useRouter', 'useRoute'];

    const nuxtComposables = [
      'useNuxtApp', 'useNuxtData', 'useAsyncData', 'useFetch',
      'useLazyAsyncData', 'useLazyFetch', 'useState', 'useCookie',
      'useHead', 'useSeoMeta', 'useRuntimeConfig', 'useAppConfig'
    ];

    if (vueReactivity.includes(name)) {
      return { imported: name, from: 'vue' };
    }

    if (vueRouter.includes(name)) {
      return { imported: name, from: 'vue-router' };
    }

    if (this.mode === 'nuxt' && nuxtComposables.includes(name)) {
      return { imported: name, from: 'nuxt/app' };
    }

    return null;
  }

  getComponentPrefix(componentPath: string): string {
    if (!this.projectInfo?.config) {
      return '';
    }

    // Extract prefix from path
    // e.g., /components/auth/Button.vue -> AuthButton
    const relativePath = componentPath
      .replace(this.projectInfo.config.srcDir, '')
      .replace(/^\//, '');

    const parts = relativePath.split('/').filter(Boolean);
    
    if (parts.length > 1) {
      // Remove 'components' prefix
      const componentIndex = parts.indexOf('components');
      if (componentIndex !== -1) {
        parts.splice(componentIndex, 1);
      }
      
      // Format remaining parts as prefix
      return parts
        .slice(0, -1) // Remove filename
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
    }

    return '';
  }
}
