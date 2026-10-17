import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script = resolve('scripts/check-merge-conflicts.mjs');
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(),'planora-conflict-'));
  try { await run(root); } finally { await rm(root,{recursive:true,force:true}); }
}
function check(root) {
  const p = spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  return {code:p.status,result:JSON.parse(p.stdout)};
}
test('clean repository passes',async()=>fixture(async root=>{
  await writeFile(join(root,'package.json'),'{"name":"clean"}');
  const out=check(root);assert.equal(out.code,0);assert.equal(out.result.count,0);
}));
test('conflicted Prisma schema fails with location',async()=>fixture(async root=>{
  await mkdir(join(root,'prisma'));
  await writeFile(join(root,'prisma','schema.prisma'),'model A {\n<<<<<<< HEAD\n=======\n>>>>>>> origin/main\n}\n');
  const out=check(root);assert.equal(out.code,1);assert.equal(out.result.count,3);
  assert.equal(out.result.hits[0].file,join('prisma','schema.prisma'));
  assert.equal(out.result.hits[0].line,2);
}));
test('ignored dependencies do not trigger false positives',async()=>fixture(async root=>{
  await mkdir(join(root,'node_modules'));
  await writeFile(join(root,'node_modules','bad.js'),'<<<<<<< HEAD\n=======\n>>>>>>> main\n');
  const out=check(root);assert.equal(out.code,0);
}));
