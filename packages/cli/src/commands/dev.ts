import { bold, cyan, green, yellow } from 'kolorist';
import { execa } from 'execa';
import { Server } from '@vue-lab/server';
import { Scanner } from '@vue-lab/scanner';
import { DEFAULT_SERVER_PORT } from '@vue-lab/core';

interface DevOptions {
  port: string;
  host?: string;
  open: boolean | string;
  root?: string;
}

export async function dev(options: DevOptions): Promise<void> {
  const { port = DEFAULT_SERVER_PORT, host = 'localhost', open = true, root = process.cwd() } = options;
  const portNum = typeof port === 'string' ? parseInt(port) : port;
  const shouldOpen = open === true || open === 'true' || open === undefined;

  console.log(bold(cyan('\n🚀 Vue Lab\n')));

  console.log(cyan('  Initializing scanner...'));
  const scanner = new Scanner({ root });

  console.log(cyan('  Scanning components...'));
  const components = await scanner.scan();
  console.log(green(`  ✔ Found ${components.length} components`));

  console.log(cyan('\n  Starting server...'));
  const server = new Server({
    port: portNum,
    host,
    scanner,
  });

  await server.start();

  const url = `http://${host}:${portNum}`;
  console.log(green(`  ✔ Vue Lab running at ${bold(url)}\n`));

  if (shouldOpen) {
    console.log(cyan('  Opening browser...'));
    await execa('open', [url]);
  }

  process.on('SIGINT', async () => {
    console.log(yellow('\n\n  Shutting down...'));
    await server.stop();
    process.exit(0);
  });
}
