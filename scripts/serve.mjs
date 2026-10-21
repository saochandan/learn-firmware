import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const allowed=new Set(['index.html','styles.css','content.js','app.js','.nojekyll']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer(async(req,res)=>{try{const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const name=requested==='/'?'index.html':requested.slice(1);if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}const bytes=await fs.readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]||'text/plain'});res.end(bytes);}catch{res.writeHead(500);res.end('Unable to serve file');}}).listen(4173,'127.0.0.1',()=>console.log('Learn Firmware: http://127.0.0.1:4173'));
