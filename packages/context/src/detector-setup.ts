import { stat, readdir } from 'fs/promises';
import { join, relative } from 'path';
import type { ProjectConfig, ProjectSetup } from './types.js';

export interface SetupDetectorOptions {
  strict?: boolean;
}

export class ProjectSetupDetector {
  constructor(private _options: SetupDetectorOptions = {}) {}

  async detectProjectType(config: ProjectConfig): Promise<'vue' | 'nuxt'> {
    const nuxtConfigPaths = [
      join(config.root, 'nuxt.config.ts'),
      join(config.root, 'nuxt.config.js'),
      join(config.root, 'app.config.ts'),
    ];

    for (const path of nuxtConfigPaths) {
      try {
        await stat(path);
        return 'nuxt';
      } catch {
        // continue
      }
    }

    return 'vue';
  }

  async detect(config: ProjectConfig): Promise<ProjectSetup> {
    const projectType = await this.detectProjectType(config);
    const srcPath = join(config.root, config.srcDir);

    return {
      pinia: await this.detectPinia(srcPath),
      router: await this.detectRouter(srcPath, projectType),
      i18n: await this.detectI18n(srcPath),
      nuxt: projectType === 'nuxt' ? await this.detectNuxt(config.root) : null,
    };
  }

  private async detectPinia(srcPath: string): Promise<{
    detected: boolean;
    entryPath?: string;
    storeFiles?: string[];
  }> {
    const storeDirs = ['stores', 'store'];
    const storeFiles: string[] = [];

    for (const dir of storeDirs) {
      const dirPath = join(srcPath, dir);
      try {
        await stat(dirPath);
        const files = await readdir(dirPath, { recursive: true });
        const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        storeFiles.push(...tsFiles.map(f => join(dir, f)));

        if (storeFiles.length > 0) {
          return {
            detected: true,
            entryPath: `${dir}/index.ts`,
            storeFiles,
          };
        }
      } catch {
        // continue
      }
    }

    return { detected: false };
  }

  private async detectRouter(srcPath: string, projectType: string): Promise<{
    detected: boolean;
    entryPath?: string;
    routesFile?: string;
  }> {
    const routerPaths = [
      'router/index.ts',
      'router/index.js',
      'router.ts',
      'router.js',
      'routes.ts',
      'routes.js',
    ];

    for (const path of routerPaths) {
      try {
        await stat(join(srcPath, path));
        return {
          detected: true,
          entryPath: path,
          routesFile: path,
        };
      } catch {
        // continue
      }
    }

    if (projectType === 'nuxt') {
      return {
        detected: true,
        entryPath: 'pages/',
        routesFile: 'pages/',
      };
    }

    return { detected: false };
  }

  private async detectI18n(srcPath: string): Promise<{
    detected: boolean;
    entryPath?: string;
    locales?: string[];
  }> {
    const i18nPaths = [
      'i18n/index.ts',
      'i18n.ts',
      'locales',
      'lang',
    ];

    for (const path of i18nPaths) {
      try {
        const fullPath = join(srcPath, path);
        await stat(fullPath);

        if (path === 'locales' || path === 'lang') {
          const files = await readdir(fullPath, { recursive: true });
          const localeFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.ts'));
          return {
            detected: true,
            entryPath: `${path}/index.ts`,
            locales: localeFiles.map(f => relative(srcPath, f)),
          };
        }

        return {
          detected: true,
          entryPath: path,
          locales: [path],
        };
      } catch {
        // continue
      }
    }

    return { detected: false };
  }

  private async detectNuxt(rootPath: string): Promise<{
    detected: boolean;
    nuxtConfigPath?: string;
    modules?: string[];
  }> {
    const configPath = join(rootPath, 'nuxt.config.ts');

    try {
      await stat(configPath);

      return {
        detected: true,
        nuxtConfigPath: 'nuxt.config.ts',
        modules: [],
      };
    } catch {
      return { detected: false };
    }
  }
}
