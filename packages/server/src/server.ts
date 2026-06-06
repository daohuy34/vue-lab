import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { Scanner } from '@vue-lab/scanner';
import { Runtime } from '@vue-lab/runtime';
import { ComponentMeta, WSMessage, ApiResponse, DEFAULT_SERVER_PORT } from '@vue-lab/core';
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

  constructor(options: ServerOptions) {
    this.port = options.port || DEFAULT_SERVER_PORT;
    this.host = options.host || 'localhost';
    this.scanner = options.scanner;
    this.app = express();
    this.runtime = new Runtime({ root: process.cwd(), mode: 'isolated' });
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get('/api/components', (_req: Request, res: Response) => {
      const components = this.scanner.getComponents();
      const response: ApiResponse<ComponentMeta[]> = {
        success: true,
        data: components,
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
