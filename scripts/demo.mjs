import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {read} from './lib/domain.mjs';
import {table} from './lib/format.mjs';
const tmp=mkdtempSync(path.join(os.tmpdir(),'revenue-demo-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=tmp;
let db;try{db=await getDb();await migrate(db);await seed(db);
for(const cmd of ['contract-review','recognition-due','compliance']){const rows=await read(db,cmd);console.log('\n'+cmd+' (fictional demo)');console.log(table(rows,Object.keys(rows[0]||{}).map(key=>({key,label:key.replaceAll('_',' ')}))));}
await db.close();db=null;
for(const name of ['view','docs']){const c=spawnSync(process.execPath,['scripts/'+name+'.mjs'],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});if(c.status!==0)throw Error(c.stderr);console.log(c.stdout);}
console.log('Demo complete. Temporary fictional records and paperwork removed.');
}finally{if(db)await db.close();rmSync(tmp,{recursive:true,force:true});}
