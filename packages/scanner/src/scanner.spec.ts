import { describe, it, expect } from 'vitest';
import { Scanner } from '../src/index.js';
import { resolve } from 'path';

describe('Scanner CLI Integration', () => {
  describe('scan', () => {
    it('should scan playground package', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      const components = await scanner.scan();
      
      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
    });

    it('should find Vue components in playground', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      const components = await scanner.scan();
      
      const vueFiles = components.filter(c => c.path.endsWith('.vue'));
      expect(vueFiles.length).toBeGreaterThan(0);
    });

    it('should extract component metadata', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      const components = await scanner.scan();
      
      for (const component of components) {
        expect(component.id).toBeDefined();
        expect(component.name).toBeDefined();
        expect(component.namespace).toBeDefined();
        expect(component.path).toBeDefined();
      }
    });
  });

  describe('getComponents', () => {
    it('should return scanned components', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      await scanner.scan();
      
      const components = scanner.getComponents();
      expect(components.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    it('should search components by name', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      await scanner.scan();
      
      const results = scanner.search('Button');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      await scanner.scan();
      
      const results = scanner.search('NonExistentComponentXYZ123');
      expect(results).toEqual([]);
    });
  });

  describe('getByNamespace', () => {
    it('should filter components by namespace', async () => {
      const scanner = new Scanner({ 
        root: resolve(__dirname, '..', '..', '..', 'packages', 'playground'),
        srcDir: 'src'
      });
      await scanner.scan();
      
      const namespaces = scanner.getNamespaces();
      expect(namespaces.length).toBeGreaterThan(0);
      
      for (const ns of namespaces) {
        const components = scanner.getByNamespace(ns);
        for (const c of components) {
          expect(c.namespace).toBe(ns);
        }
      }
    });
  });
});
