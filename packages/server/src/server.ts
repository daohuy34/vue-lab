import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { Scanner } from '@vue-lab/scanner';
import { Runtime } from '@vue-lab/runtime';
import { ProjectSetupDetector } from '@vue-lab/context';
import { ComponentMeta, WSMessage, ApiResponse, DEFAULT_SERVER_PORT, ComponentMetaFull } from '@vue-lab/core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface ServerOptions {
  port?: number;
  host?: string;
  scanner: Scanner;
}

export class Server {
  private port: number;
  private host: string;
  private app: Express;
  private wss: WebSocketServer | null = null;
  private scanner: Scanner;
  private runtime: Runtime;
  private viteServer: any = null;
  private projectRoot: string;
  private projectSetup: any = null;
  private projectSetupDetector: ProjectSetupDetector;

  constructor(options: ServerOptions) {
    this.port = options.port || DEFAULT_SERVER_PORT;
    this.host = options.host || 'localhost';
    this.scanner = options.scanner;
    this.projectRoot = process.cwd();
    this.app = express();
    this.runtime = new Runtime({ root: this.projectRoot, mode: 'isolated' });
    this.projectSetupDetector = new ProjectSetupDetector();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private async detectProjectSetup() {
    if (this.projectSetup) return this.projectSetup;
    
    this.projectSetup = await this.projectSetupDetector.detect({
      root: this.projectRoot,
      srcDir: 'src',
      type: 'vue',
    });
    
    return this.projectSetup;
  }

  private setupRoutes(): void {
    this.app.get('/api/components', async (_req: Request, res: Response) => {
      const components = await this.scanner.scanWithAnalysis();
      const response: ApiResponse<ComponentMetaFull[]> = {
        success: true,
        data: components as ComponentMetaFull[],
      };
      res.json(response);
    });

    this.app.get('/api/components/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const component = this.scanner.getComponent(id);
      
      if (!component) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Component ${id} not found`,
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<ComponentMeta> = {
        success: true,
        data: component,
      };
      res.json(response);
    });

    this.app.get('/api/components/:id/source', async (req: Request, res: Response) => {
      const { id } = req.params;
      const component = this.scanner.getComponent(id);
      
      if (!component) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Component ${id} not found`,
          },
        };
        res.status(404).json(response);
        return;
      }

      try {
        const { readFile } = await import('fs/promises');
        const fullPath = join(this.projectRoot, 'src', component.path);
        const source = await readFile(fullPath, 'utf-8');
        res.json({ success: true, data: { source, path: component.path } });
      } catch {
        res.status(500).json({ success: false, error: { code: 'READ_ERROR', message: 'Failed to read source file' } });
      }
    });

    this.app.post('/api/render/:id', async (req: Request, res: Response) => {
      const { id } = req.params;
      const props = req.body?.props || {};
      
      const component = this.scanner.getComponent(id);
      if (!component) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Component ${id} not found`,
          },
        };
        res.status(404).json(response);
        return;
      }

      const result = await this.runtime.render(id, props);
      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.json(response);
    });

    this.app.get('/api/render/:id/component', async (req: Request, res: Response) => {
      const { id } = req.params;
      const component = this.scanner.getComponent(id);
      
      if (!component) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Component ${id} not found` } });
        return;
      }

      const result = await this.runtime.loadComponentForRender(id);
      if (!result) {
        res.status(404).json({ success: false, error: { code: 'LOAD_ERROR', message: 'Failed to load component' } });
        return;
      }

      res.json({ success: true, data: { component: id, props: {} } });
    });

    this.app.get('/api/search', (req: Request, res: Response) => {
      const query = req.query.q as string;
      if (!query) {
        res.json({ success: true, data: [] });
        return;
      }
      const results = this.scanner.search(query);
      res.json({ success: true, data: results });
    });

    this.app.get('/api/namespaces', (_req: Request, res: Response) => {
      const namespaces = this.scanner.getNamespaces();
      const components = this.scanner.getComponents();
      const namespaceData = namespaces.map(ns => ({
        name: ns,
        components: components.filter(c => c.namespace === ns),
      }));
      res.json({ success: true, data: namespaceData });
    });

    this.app.get('/api/project-context', async (_req: Request, res: Response) => {
      const setup = await this.detectProjectSetup();
      res.json({
        success: true,
        data: {
          mode: 'isolated',
          setup: {
            hasPinia: setup.pinia.detected,
            hasRouter: setup.router.detected,
            hasI18n: setup.i18n.detected,
            hasNuxt: setup.nuxt?.detected || false,
            pinia: setup.pinia,
            router: setup.router,
            i18n: setup.i18n,
            nuxt: setup.nuxt,
          },
        },
      });
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected');

      const scanComplete: WSMessage = {
        type: 'SCAN_COMPLETE',
        payload: this.scanner.getComponents(),
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(scanComplete));

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  private broadcast(message: WSMessage): void {
    if (!this.wss) return;

    const data = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  async start(): Promise<void> {
    await this.setupVite();
    await this.detectProjectSetup();
    
    this.setupWebSocket();

    return new Promise((resolve) => {
      const httpServer = this.app.listen(this.port, this.host, () => {
        console.log(`Server running at http://${this.host}:${this.port}`);
        resolve();
      });

      httpServer.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws') {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit('connection', ws, request);
          });
        }
      });

      this.scanner.watch();
    });
  }

  private async setupVite(): Promise<void> {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const uiPath = join(__dirname, '../../ui/dist');

    this.viteServer = await createViteServer({
      root: uiPath,
      server: {
        port: this.port,
        host: this.host,
      },
    });
  }

  async stop(): Promise<void> {
    await this.scanner.stop();
    await this.viteServer?.close();
    this.wss?.close();
  }
}
