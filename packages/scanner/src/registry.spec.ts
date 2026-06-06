import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '@/registry';
import type { ComponentMeta } from '@vue-lab/core';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('register', () => {
    it('should register a component', () => {
      const component: ComponentMeta = {
        id: 'Shared/Button',
        name: 'Button',
        namespace: 'Shared',
        path: 'src/components/Button.vue',
      };

      registry.register(component);

      expect(registry.getComponent('Shared/Button')).toEqual(component);
    });

    it('should group components by namespace', () => {
      const button: ComponentMeta = {
        id: 'Auth/Button',
        name: 'Button',
        namespace: 'Auth',
        path: 'src/auth/Button.vue',
      };

      registry.register(button);

      expect(registry.getByNamespace('Auth')).toHaveLength(1);
      expect(registry.getByNamespace('Auth')[0].name).toBe('Button');
    });
  });

  describe('unregister', () => {
    it('should unregister a component', () => {
      const component: ComponentMeta = {
        id: 'Shared/Modal',
        name: 'Modal',
        namespace: 'Shared',
        path: 'src/components/Modal.vue',
      };

      registry.register(component);
      registry.unregister('Shared/Modal');

      expect(registry.getComponent('Shared/Modal')).toBeUndefined();
      expect(registry.getByNamespace('Shared')).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('should search by name', () => {
      registry.register({
        id: 'Shared/Button',
        name: 'Button',
        namespace: 'Shared',
        path: 'src/components/Button.vue',
      });
      registry.register({
        id: 'Shared/Modal',
        name: 'Modal',
        namespace: 'Shared',
        path: 'src/components/Modal.vue',
      });

      const results = registry.search('Button');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Button');
    });

    it('should search by namespace', () => {
      registry.register({
        id: 'Auth/LoginForm',
        name: 'LoginForm',
        namespace: 'Auth',
        path: 'src/auth/LoginForm.vue',
      });
      registry.register({
        id: 'Product/LoginForm',
        name: 'LoginForm',
        namespace: 'Product',
        path: 'src/product/LoginForm.vue',
      });

      const results = registry.search('Auth');

      expect(results).toHaveLength(1);
      expect(results[0].namespace).toBe('Auth');
    });
  });

  describe('loadAll', () => {
    it('should load multiple components at once', () => {
      const components: ComponentMeta[] = [
        { id: 'Shared/Button', name: 'Button', namespace: 'Shared', path: 'src/Button.vue' },
        { id: 'Auth/Form', name: 'Form', namespace: 'Auth', path: 'src/auth/Form.vue' },
      ];

      registry.loadAll(components);

      expect(registry.getComponentCount()).toBe(2);
      expect(registry.getNamespaces()).toContain('Shared');
      expect(registry.getNamespaces()).toContain('Auth');
    });
  });

  describe('getByPath', () => {
    it('should get component by path', () => {
      const component: ComponentMeta = {
        id: 'Shared/Button',
        name: 'Button',
        namespace: 'Shared',
        path: 'src/components/Button.vue',
      };

      registry.register(component);

      expect(registry.getByPath('src/components/Button.vue')?.id).toBe('Shared/Button');
    });
  });
});
