#!/usr/bin/env node
// Dependency-free structural preflight. Does not claim Prisma semantic validation.
import { readFile } from 'node:fs/promises';
const problems=[];
let manifest;
try { manifest=JSON.parse(await readFile('package.json','utf8')); }
catch(e){ problems.push({file:'package.json',error:'INVALID_JSON',detail:e.message}); }
if(manifest){
  for(const key of ['build','lint','typecheck','certify','db:validate']){
    if(typeof manifest.scripts?.[key]!=='string')problems.push({file:'package.json',error:'MISSING_SCRIPT',key});
  }
  const p=manifest.dependencies?.['@prisma/client'];
  const cli=manifest.devDependencies?.prisma;
  if(!p||!cli)problems.push({file:'package.json',error:'MISSING_PRISMA_DEPENDENCIES'});
  else if(p!==cli)problems.push({file:'package.json',error:'PRISMA_VERSION_MISMATCH',client:p,cli});
}
try {
  const schema=await readFile('prisma/schema.prisma','utf8');
  const models=[...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(x=>x[1]);
  const enums=[...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map(x=>x[1]);
  for(const [type,names] of [['model',models],['enum',enums]]){
    for(const name of new Set(names))if(names.filter(n=>n===name).length>1)problems.push({file:'prisma/schema.prisma',error:'DUPLICATE_'+type.toUpperCase(),name});
  }
  if(models.length===0)problems.push({file:'prisma/schema.prisma',error:'NO_MODELS'});
}catch(e){problems.push({file:'prisma/schema.prisma',error:'UNREADABLE_SCHEMA',detail:e.message});}
console.log(JSON.stringify({gate:'structural-preflight',passed:problems.length===0,problems},null,2));
if(problems.length)process.exitCode=1;
