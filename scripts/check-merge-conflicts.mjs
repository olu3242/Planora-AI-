#!/usr/bin/env node
// Fail-closed repository merge-conflict gate. No dependencies or database access.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
const root = process.cwd();
const ignored = new Set(['.git','node_modules','.next','dist','coverage','playwright-report','test-results']);
const markers = /^(<<<<<<<(?: .*)?|=======$|>>>>>>>(?: .*)?)$/gm;
const extensions = new Set(['.ts','.tsx','.js','.mjs','.cjs','.json','.prisma','.sql','.md','.yml','.yaml']);
const hits = [];
async function scan(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir,entry.name);
    if (entry.isDirectory()) { await scan(path); continue; }
    if (!entry.isFile() || ![...extensions].some(ext=>entry.name.endsWith(ext))) continue;
    const data = await readFile(path,'utf8');
    const lines = data.split(/\r?\n/);
    for (let i=0;i<lines.length;i++) if (/^(<<<<<<<(?: .*)?|=======$|>>>>>>>(?: .*)?)$/.test(lines[i])) hits.push({file:relative(root,path),line:i+1,marker:lines[i]});
  }
}
await scan(root);
console.log(JSON.stringify({gate:'merge-conflicts',passed:hits.length===0,count:hits.length,hits},null,2));
if (hits.length) process.exitCode=1;
