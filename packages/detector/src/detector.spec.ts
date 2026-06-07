import { describe, it, expect } from 'vitest';
import { DependencyDetector } from './detector.js';

describe('DependencyDetector', () => {
  const detector = new DependencyDetector();

  describe('Pinia Detection', () => {
    it('should detect useStore()', () => {
      const source = `
        const store = useStore();
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(true);
      expect(result.dependencies.find(d => d.type === 'pinia')).toBeDefined();
    });

    it('should detect useUserStore()', () => {
      const source = `
        const userStore = useUserStore();
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(true);
      expect(result.dependencies.find(d => d.type === 'pinia')?.name).toBe('UserStore');
    });

    it('should detect defineStore()', () => {
      const source = `
        export const useUserStore = defineStore('user', {
          state: () => ({ count: 0 })
        });
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(true);
    });

    it('should detect pinia import', () => {
      const source = `
        import { createPinia } from 'pinia';
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(true);
    });
  });

  describe('Router Detection', () => {
    it('should detect useRouter()', () => {
      const source = `
        const router = useRouter();
      `;
      const result = detector.detect(source);
      
      expect(result.hasRouter).toBe(true);
      expect(result.dependencies.find(d => d.type === 'router')?.name).toBe('useRouter');
    });

    it('should detect useRoute()', () => {
      const source = `
        const route = useRoute();
      `;
      const result = detector.detect(source);
      
      expect(result.hasRouter).toBe(true);
      expect(result.dependencies.find(d => d.type === 'router')?.name).toBe('useRoute');
    });

    it('should detect vue-router import', () => {
      const source = `
        import { RouterLink, RouterView } from 'vue-router';
      `;
      const result = detector.detect(source);
      
      expect(result.hasRouter).toBe(true);
    });
  });

  describe('I18n Detection', () => {
    it('should detect useI18n()', () => {
      const source = `
        const { t } = useI18n();
      `;
      const result = detector.detect(source);
      
      expect(result.hasI18n).toBe(true);
    });

    it('should detect t() usage', () => {
      const source = `
        <h1>t('hello')</h1>
      `;
      const result = detector.detect(source);
      
      expect(result.hasI18n).toBe(true);
    });

    it('should detect vue-i18n import', () => {
      const source = `
        import { createI18n } from 'vue-i18n';
      `;
      const result = detector.detect(source);
      
      expect(result.hasI18n).toBe(true);
    });
  });

  describe('Inject Detection', () => {
    it('should detect inject()', () => {
      const source = `
        const auth = inject('auth');
      `;
      const result = detector.detect(source);
      
      expect(result.hasInject).toBe(true);
    });

    it('should detect provide()', () => {
      const source = `
        provide('key', value);
      `;
      const result = detector.detect(source);
      
      expect(result.hasInject).toBe(true);
    });

    it('should detect injectionKey', () => {
      const source = `
        export const AuthKey = injectionKey<Auth>('auth');
      `;
      const result = detector.detect(source);
      
      expect(result.hasInject).toBe(true);
    });
  });

  describe('Nuxt Detection', () => {
    it('should detect useNuxtApp()', () => {
      const source = `
        const nuxtApp = useNuxtApp();
      `;
      const result = detector.detect(source);
      
      expect(result.hasNuxt).toBe(true);
    });

    it('should detect useAsyncData()', () => {
      const source = `
        const { data } = await useAsyncData('key', () => $fetch('/api'));
      `;
      const result = detector.detect(source);
      
      expect(result.hasNuxt).toBe(true);
    });

    it('should detect useFetch()', () => {
      const source = `
        const { data } = useFetch('/api');
      `;
      const result = detector.detect(source);
      
      expect(result.hasNuxt).toBe(true);
    });

    it('should detect useCookie()', () => {
      const source = `
        const token = useCookie('token');
      `;
      const result = detector.detect(source);
      
      expect(result.hasNuxt).toBe(true);
    });

    it('should detect nuxt import', () => {
      const source = `
        import { useRouter } from '#app';
      `;
      const result = detector.detect(source);
      
      expect(result.hasNuxt).toBe(true);
    });
  });

  describe('Multiple Dependencies', () => {
    it('should detect multiple dependencies', () => {
      const source = `
        import { createPinia } from 'pinia';
        import { useRouter } from 'vue-router';
        
        const store = useStore();
        const router = useRouter();
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(true);
      expect(result.hasRouter).toBe(true);
      expect(result.dependencies).toHaveLength(2);
    });

    it('should not have dependencies for simple component', () => {
      const source = `
        <template>
          <div>{{ message }}</div>
        </template>
        
        <script setup>
        const message = 'Hello';
        </script>
      `;
      const result = detector.detect(source);
      
      expect(result.hasPinia).toBe(false);
      expect(result.hasRouter).toBe(false);
      expect(result.hasI18n).toBe(false);
      expect(result.hasNuxt).toBe(false);
      expect(result.hasInject).toBe(false);
      expect(result.dependencies).toHaveLength(0);
    });
  });

  describe('getMissingPackages', () => {
    it('should return missing packages', () => {
      const source = `
        import { createPinia } from 'pinia';
        import { useRouter } from 'vue-router';
      `;
      const result = detector.detect(source);
      const packages = detector.getMissingPackages(result);
      
      expect(packages).toContain('pinia');
      expect(packages).toContain('vue-router');
    });

    it('should return empty array for no dependencies', () => {
      const source = `<div>Hello</div>`;
      const result = detector.detect(source);
      const packages = detector.getMissingPackages(result);
      
      expect(packages).toHaveLength(0);
    });
  });

  describe('formatReport', () => {
    it('should format report for dependencies', () => {
      const source = `
        import { createPinia } from 'pinia';
      `;
      const result = detector.detect(source);
      const report = detector.formatReport(result);
      
      expect(report).toContain('PINIA');
      expect(report).toContain('pinia');
    });

    it('should format report for no dependencies', () => {
      const source = `<div>Hello</div>`;
      const result = detector.detect(source);
      const report = detector.formatReport(result);
      
      expect(report).toContain('No dependencies detected');
    });
  });
});
