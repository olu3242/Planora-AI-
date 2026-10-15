import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script=resolve('scripts/check-structural-preflight.mjs');
const scripts={build:'next build',lint:'eslint .',typecheck:'tsc --noEmit',certify:'npm run test', 'db:validate':'prisma validate'};
const manifest={scripts,dependencies:{'@prisma/client':'6.19.1'},devDependencies:{prisma:'6.19.1'}};
async function fixture(run){
 const root=await mkdtemp(join(tmpdir(),'planora-structure-'));
 try {
  await mkdir(join(root,'prisma'));
  await writeFile(join(root,'package.json'),JSON.stringify(manifest));
  await writeFile(join(root,'prisma','schema.prisma'),'model User {\n id String @id\n}\n');
  await run(root);
 } finally {await rm(root,{recursive:true,force:true});}
}
function check(root){
 const p=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
 assert.equal(p.error,undefined);
 return {exit:p.status,result:JSON.parse(p.stdout)};
}
test('valid manifest and schema pass',async()=>fixture(async root=>{
 const x=check(root);assert.equal(x.exit,0);assert.equal(x.result.passed,true);
}));
test('malformed manifest fails',async()=>fixture(async root=>{
 await writeFile(join(root,'package.json'),'{invalid');
 const x=check(root);assert.equal(x.exit,1);assert.ok(x.result.problems.some(p=>p.error==='INVALID_JSON'));
}));
test('missing required script fails',async()=>fixture(async root=>{
 await writeFile(join(root,'package.json'),JSON.stringify({...manifest,scripts:{...scripts,certify:undefined}}));
 const x=check(root);assert.equal(x.exit,1);assert.ok(x.result.problems.some(p=>p.error==='MISSING_SCRIPT'));
}));
test('mismatched Prisma dependencies fail',async()=>fixture(async root=>{
 await writeFile(join(root,'package.json'),JSON.stringify({...manifest,devDependencies:{prisma:'5.0.0'}}));
 const x=check(root);assert.equal(x.exit,1);assert.ok(x.result.problems.some(p=>p.error==='PRISMA_VERSION_MISMATCH'));
}));
test('duplicate Prisma models fail',async()=>fixture(async root=>{
 await writeFile(join(root,'prisma','schema.prisma'),'model User {\n id String @id\n}\nmodel User {\n id String @id\n}\n');
 const x=check(root);assert.equal(x.exit,1);assert.ok(x.result.problems.some(p=>p.error==='DUPLICATE_MODEL'));
}));
test('schema without models fails',async()=>fixture(async root=>{
 await writeFile(join(root,'prisma','schema.prisma'),'enum State { OPEN CLOSED }');
 const x=check(root);assert.equal(x.exit,1);assert.ok(x.result.problems.some(p=>p.error==='NO_MODELS'));
}));
