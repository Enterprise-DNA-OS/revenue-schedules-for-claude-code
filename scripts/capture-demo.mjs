import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {importLeapfin} from './lib/import.mjs';
const tmp=mkdtempSync(path.join(os.tmpdir(),'revenue-capture-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=tmp;
let db;
try{
 db=await getDb();await migrate(db);await seed(db);await importLeapfin(db,path.join(REPO_ROOT,'examples/leapfin/records.csv'),{source:'sample'});await db.close();db=null;
 const examples=[['Recognition review','Which completed months still need review?','recognition-due'],['Evidence checks','Which records need an accounting or retention check?','compliance'],['Imported records','What came across from the source records?','source-inbox']];
 const screens=examples.map(([title,ask,command])=>{const result=spawnSync(process.execPath,['scripts/revenue.mjs',command],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);return {title,ask,command:'npm run revenue -- '+command,output:result.stdout.trim()};});
 writeFileSync(path.join(REPO_ROOT,'docs/demo-output.json'),JSON.stringify({captured_at:new Date().toISOString(),data:'Fictional seed records',screens},null,2)+'\n');
 console.log('Captured three actual CLI runs in docs/demo-output.json');
}finally{if(db)await db.close();rmSync(tmp,{recursive:true,force:true});}
