import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('supabase/migrations');
http.createServer((req, res) => {
  const file = path.join(root, path.basename(decodeURIComponent(req.url.split('?')[0])));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}).listen(8000, 'localhost', () => console.log('sql server on 8000'));
