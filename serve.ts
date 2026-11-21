// serve.ts — a pocket static server for local play-testing:
//   node serve.ts [--port 8123]
// serves game/ on http://localhost:8123 and nothing outside it.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portAt = args.indexOf('--port');
const wanted = portAt === -1 ? 8123 : Number(args[portAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8123;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`Silent Floor at http://localhost:${port}`));
