import { describe, it, expect } from 'vitest';
import { Scanner } from '@/scanner';
import { join } from 'path';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';

describe('Scanner', () => {
  describe('scan', () => {
    it('should scan and extract components from Vue files', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/components'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/components/Button.vue'),
          '<template><button>Click</button></template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/components/Modal.vue'),
          '<template><div>Modal</div></template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        const components = await scanner.scan();

        expect(components).toHaveLength(2);
        expect(components.map(c => c.name).sort()).toEqual(['Button', 'Modal']);
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should extract namespace from directory path', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/auth'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/auth/Button.vue'),
          '<template><button>Login</button></template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        const components = await scanner.scan();

        expect(components).toHaveLength(1);
        expect(components[0].namespace).toBe('Auth');
        expect(components[0].id).toBe('Auth/Button');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle kebab-case directory names', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/auth-form'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/auth-form/Submit.vue'),
          '<template><button>Submit</button></template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        const components = await scanner.scan();

        expect(components).toHaveLength(1);
        expect(components[0].namespace).toBe('AuthForm');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle nested directory paths', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/ui/forms'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/ui/forms/Input.vue'),
          '<template><input /></template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        const components = await scanner.scan();

        expect(components).toHaveLength(1);
        expect(components[0].namespace).toBe('Forms');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle root-level components as Shared namespace', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/BaseButton.vue'),
          '<template><button>Base</button></template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        const components = await scanner.scan();

        expect(components).toHaveLength(1);
        expect(components[0].namespace).toBe('Shared');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('getComponents', () => {
    it('should return all registered components', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/A.vue'),
          '<template>A</template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/B.vue'),
          '<template>B</template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        await scanner.scan();

        expect(scanner.getComponents()).toHaveLength(2);
        expect(scanner.getComponent('Shared/A')).toBeDefined();
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('search', () => {
    it('should search components by name', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/components'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/components/Button.vue'),
          '<template>Button</template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/components/Input.vue'),
          '<template>Input</template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        await scanner.scan();

        const results = scanner.search('Button');

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Button');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('getByNamespace', () => {
    it('should return components by namespace', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/auth'), { recursive: true });
        await mkdir(join(tempDir, 'src/product'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/auth/Login.vue'),
          '<template>Login</template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/auth/Register.vue'),
          '<template>Register</template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/product/Card.vue'),
          '<template>Card</template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        await scanner.scan();

        const authComponents = scanner.getByNamespace('Auth');
        expect(authComponents).toHaveLength(2);
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('getNamespaces', () => {
    it('should return all unique namespaces', async () => {
      const tempDir = await mkdtemp(join('/tmp', 'vue-lab-test-'));
      
      try {
        await mkdir(join(tempDir, 'src/auth'), { recursive: true });
        await mkdir(join(tempDir, 'src/product'), { recursive: true });
        await writeFile(
          join(tempDir, 'src/auth/Button.vue'),
          '<template>Auth</template>',
          'utf-8'
        );
        await writeFile(
          join(tempDir, 'src/product/Button.vue'),
          '<template>Product</template>',
          'utf-8'
        );

        const scanner = new Scanner({ root: tempDir });
        await scanner.scan();

        const namespaces = scanner.getNamespaces();
        expect(namespaces).toContain('Auth');
        expect(namespaces).toContain('Product');
        
        await scanner.stop();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
