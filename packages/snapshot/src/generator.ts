import { ComponentMeta } from '@vue-lab/core';
import { Snapshot, SnapshotOptions } from './storage.js';

export interface SnapshotResult {
  success: boolean;
  snapshot?: Snapshot;
  error?: string;
}

export interface SnapshotGeneratorOptions extends SnapshotOptions {
  serverUrl?: string;
}

/**
 * SnapshotGenerator - Captures component screenshots
 * 
 * Uses Playwright for browser automation when available.
 * For CLI usage, run `npx vue-lab snapshot` which uses the CLI command.
 */
export class SnapshotGenerator {
  private options: Required<SnapshotGeneratorOptions>;

  constructor(options: SnapshotGeneratorOptions = {}) {
    this.options = {
      outputDir: options.outputDir || '.vue-lab/snapshots',
      format: options.format || 'png',
      width: options.width || 800,
      height: options.height || 600,
      pixelRatio: options.pixelRatio || 2,
      serverUrl: options.serverUrl || 'http://localhost:5173',
    };
  }

  async capture(
    component: ComponentMeta,
    props: Record<string, unknown> = {},
    runtime: 'isolated' | 'project' = 'isolated'
  ): Promise<SnapshotResult> {
    try {
      const playwright = await this.tryLoadPlaywright();
      
      if (playwright) {
        return await this.captureWithPlaywright(playwright, component, props, runtime);
      }

      return this.createPlaceholderSnapshot(component, props, runtime);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async captureAll(
    components: ComponentMeta[],
    onProgress?: (current: number, total: number, component: ComponentMeta) => void
  ): Promise<SnapshotResult[]> {
    const results: SnapshotResult[] = [];

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      onProgress?.(i + 1, components.length, component);

      const result = await this.capture(component);
      results.push(result);
    }

    return results;
  }

  private async tryLoadPlaywright() {
    try {
      const { chromium } = await import('playwright');
      return { chromium };
    } catch {
      return null;
    }
  }

  private async captureWithPlaywright(
    playwright: { chromium: typeof import('playwright').chromium },
    component: ComponentMeta,
    props: Record<string, unknown>,
    runtime: 'isolated' | 'project'
  ): Promise<SnapshotResult> {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.setViewportSize({
        width: this.options.width,
        height: this.options.height,
      });

      const componentUrl = `/preview/${component.id}?props=${encodeURIComponent(JSON.stringify(props))}`;

      try {
        await page.goto(`${this.options.serverUrl}${componentUrl}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
      } catch {
        await page.setContent(this.generatePlaceholderHTML(component.name));
      }

      await page.waitForTimeout(500);

      const screenshot = await page.screenshot({
        type: this.options.format === 'webp' ? 'png' : this.options.format as 'png' | 'jpeg',
        fullPage: false,
      });

      const base64Image = `data:image/${this.options.format};base64,${screenshot.toString('base64')}`;

      const snapshot: Snapshot = {
        id: `${component.id}-${Date.now()}`,
        componentId: component.id,
        componentName: component.name,
        timestamp: Date.now(),
        width: this.options.width,
        height: this.options.height,
        format: this.options.format,
        data: base64Image,
        props,
        metadata: {
          browser: 'chromium',
          viewport: `${this.options.width}x${this.options.height}`,
          pixelRatio: this.options.pixelRatio,
          runtime,
        },
      };

      return { success: true, snapshot };
    } finally {
      await browser.close();
    }
  }

  private createPlaceholderSnapshot(
    component: ComponentMeta,
    props: Record<string, unknown>,
    runtime: 'isolated' | 'project'
  ): SnapshotResult {
    const canvas = this.createPlaceholderCanvas(component.name);

    const snapshot: Snapshot = {
      id: `${component.id}-${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      timestamp: Date.now(),
      width: this.options.width,
      height: this.options.height,
      format: this.options.format,
      data: canvas,
      props,
      metadata: {
        browser: 'placeholder',
        viewport: `${this.options.width}x${this.options.height}`,
        pixelRatio: this.options.pixelRatio,
        runtime,
      },
    };

    return { success: true, snapshot };
  }

  private createPlaceholderCanvas(componentName: string): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.options.width}" height="${this.options.height}">
        <rect fill="#f5f5f5" width="100%" height="100%"/>
        <rect fill="#e0e0e0" x="10%" y="10%" width="80%" height="80%" rx="8"/>
        <text x="50%" y="45%" font-family="system-ui" font-size="24" font-weight="600" fill="#333" text-anchor="middle">${componentName}</text>
        <text x="50%" y="55%" font-family="system-ui" font-size="14" fill="#666" text-anchor="middle">Snapshot placeholder</text>
      </svg>
    `;

    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  private generatePlaceholderHTML(componentName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
              font-family: system-ui, sans-serif;
            }
            .placeholder {
              text-align: center;
              color: #333;
            }
            .placeholder-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .placeholder-name {
              font-size: 24px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="placeholder">
            <div class="placeholder-icon">🎨</div>
            <div class="placeholder-name">${componentName}</div>
          </div>
        </body>
      </html>
    `;
  }
}
