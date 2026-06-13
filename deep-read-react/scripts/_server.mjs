// Minimal static file server for the built dist/, used by the verify scripts
// so they are fully self-contained (no long-lived external preview server).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

export function startServer(root, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path === '/' || path.endsWith('/')) path += 'index.html';
      const file = join(root, normalize(path));
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      try {
        const body = await readFile(join(root, '404.html'));
        res.writeHead(404, { 'content-type': TYPES['.html'] }).end(body);
      } catch { res.writeHead(404).end('not found'); }
    }
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      resolve({ server, url: `http://127.0.0.1:${p}` });
    });
  });
}
