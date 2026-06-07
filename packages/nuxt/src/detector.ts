import { readFile, access, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface NuxtConfig {
  rootDir: string;
  srcDir: string;
  componentsDir: string;
  composablesDir: string;
  autoImports: boolean;
  version?: string;
}

export interface NuxtProjectInfo {
  isNuxtProject: boolean;
  config?: NuxtConfig;
  features: NuxtFeatures;
}

export interface NuxtFeatures {
  autoImports: boolean;
  components: boolean;
  composables: boolean;
  layouts: boolean;
  pages: boolean;
  middleware: boolean;
  plugins: boolean;
  server: boolean;
}

export class NuxtDetector {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  async detect(): Promise<NuxtProjectInfo> {
    const hasNuxtConfig = await this.hasNuxtConfig();
    
    if (!hasNuxtConfig) {
      return {
        isNuxtProject: false,
        features: {
          autoImports: false,
          components: false,
          composables: false,
          layouts: false,
          pages: false,
          middleware: false,
          plugins: false,
          server: false,
        },
      };
    }

    const config = await this.loadNuxtConfig();
    const features = await this.detectFeatures();

    return {
      isNuxtProject: true,
      config,
      features,
    };
  }

  private async hasNuxtConfig(): Promise<boolean> {
    const configFiles = [
      'nuxt.config.ts',
      'nuxt.config.js',
      'nuxt.config.mjs',
      'nuxt.config.cjs',
      '.nuxtrc',
      '.nuxtrc.json',
    ];

    for (const file of configFiles) {
      const path = join(this.rootDir, file);
      if (existsSync(path)) {
        return true;
      }
    }

    return false;
  }

  private async loadNuxtConfig(): Promise<NuxtConfig> {
    const defaultConfig: NuxtConfig = {
      rootDir: this.rootDir,
      srcDir: join(this.rootDir, 'src'),
      componentsDir: 'components',
      composablesDir: 'composables',
      autoImports: true,
    };

    try {
      const nuxtConfigPath = this.findConfigFile();
      if (nuxtConfigPath) {
        const content = await readFile(nuxtConfigPath, 'utf-8');
        const parsed = this.parseNuxtConfig(content);
        return { ...defaultConfig, ...parsed };
      }
    } catch {
      // Return defaults
    }

    return defaultConfig;
  }

  private findConfigFile(): string | null {
    const configFiles = [
      'nuxt.config.ts',
      'nuxt.config.js',
      'nuxt.config.mjs',
      'nuxt.config.cjs',
    ];

    for (const file of configFiles) {
      const path = join(this.rootDir, file);
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  private parseNuxtConfig(content: string): Partial<NuxtConfig> {
    // Simple detection - look for key patterns
    const config: Partial<NuxtConfig> = {};

    // Detect srcDir
    const srcDirMatch = content.match(/srcDir:\s*['"`]([^'"`]+)['"`]/);
    if (srcDirMatch) {
      config.srcDir = join(this.rootDir, srcDirMatch[1]);
    }

    // Detect components dir
    const componentsMatch = content.match(/components:\s*(?:true|{)/);
    if (componentsMatch) {
      config.componentsDir = 'components';
    }

    // Detect composables dir
    const composablesMatch = content.match(/composables:\s*(?:true|{)/);
    if (composablesMatch) {
      config.composablesDir = 'composables';
    }

    // Detect auto-imports
    const importsMatch = content.match(/imports:\s*(?:true|{)/);
    if (importsMatch) {
      config.autoImports = true;
    }

    return config;
  }

  private async detectFeatures(): Promise<NuxtFeatures> {
    const srcDir = join(this.rootDir, 'src');
    const componentsDir = join(srcDir, 'components');
    const composablesDir = join(srcDir, 'composables');
    const layoutsDir = join(srcDir, 'layouts');
    const pagesDir = join(srcDir, 'pages');
    const middlewareDir = join(srcDir, 'middleware');
    const pluginsDir = join(srcDir, 'plugins');
    const serverDir = join(this.rootDir, 'server');

    return {
      autoImports: existsSync(composablesDir) || existsSync(join(srcDir, 'utils')),
      components: existsSync(componentsDir),
      composables: existsSync(composablesDir),
      layouts: existsSync(layoutsDir),
      pages: existsSync(pagesDir),
      middleware: existsSync(middlewareDir),
      plugins: existsSync(pluginsDir),
      server: existsSync(serverDir),
    };
  }

  async getComponentPaths(): Promise<string[]> {
    const paths: string[] = [];
    
    // Check default locations
    const locations = [
      join(this.rootDir, 'src', 'components'),
      join(this.rootDir, 'components'),
      join(this.rootDir, 'app', 'components'),
    ];

    for (const location of locations) {
      if (existsSync(location)) {
        const componentPaths = await this.scanDirectory(location);
        paths.push(...componentPaths);
      }
    }

    return paths;
  }

  private async scanDirectory(dir: string, extension = '.vue'): Promise<string[]> {
    const paths: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subPaths = await this.scanDirectory(fullPath, extension);
          paths.push(...subPaths);
        } else if (entry.name.endsWith(extension)) {
          paths.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist
    }

    return paths;
  }

  async getNuxtVersion(): Promise<string | undefined> {
    try {
      const packageJsonPath = join(this.rootDir, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.dependencies?.nuxt || pkg.devDependencies?.nuxt;
    } catch {
      return undefined;
    }
  }
}
