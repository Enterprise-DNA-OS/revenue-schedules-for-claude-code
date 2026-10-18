#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {getDb} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {reads,read,insert,transaction,workflow,workflows,details,exportData,saveArtifact,draft} from './lib/domain.mjs';
import {importLeapfin} from './lib/import.mjs';
const args=process.argv.slice(2),pos=[],flags={};
function output(value){if(flags.json)console.log(JSON.stringify(value,null,2));else if(Array.isArray(value)){if(value[0]?.question){for(const q of value){console.log('\n'+q.question);output(q.rows);}}else console.log(table(value,Object.keys(value[0]||{}).map(key=>({key,label:key.replace(/_cents$/,'').replaceAll('_',' '),format:key.endsWith('_cents')?(v)=>v==null?'':(Number(v)/100).toFixed(2):undefined}))));}else for(const [key,v]of Object.entries(value)){if(Array.isArray(v)){console.log('\n'+key);output(v);}else console.log(key+': '+(typeof v==='object'?JSON.stringify(v):v));}}
let db;
try{
 for(const a of args){if(a.startsWith('--')){const [k,...v]=a.slice(2).split('=');if(Object.hasOwn(flags,k))throw Error('Repeated flag '+k);flags[k]=v.length?v.join('='):true;}else pos.push(a);}
 const [cmd,...rest]=pos;
 const allowed={add:['file','actor'],log:['text','actor'],import:['source','mapping','dry-run','actor'],...Object.fromEntries(workflows.map(c=>[c,['evidence','actor',...(c==='approve-contract'?['basis']:c==='review-contract'?['next']:c==='retain-evidence'?['until']:[])]]))};
 for(const key of Object.keys(flags))if(!['json',...(allowed[cmd]||[])].includes(key))throw Error('Unknown flag --'+key+' for '+cmd);
 for(const [k,v]of Object.entries(flags))if(['json','dry-run'].includes(k)?v!==true:typeof v!=='string'||!v.trim())throw Error('Invalid value for --'+k);
 const counts={add:1,log:1,import:2,contract:1,'draft-contract-memo':1,...Object.fromEntries(workflows.map(c=>[c,1]))};
 if(rest.length!==(counts[cmd]||0))throw Error('Wrong arguments for '+cmd);
 if(cmd==='help'||!cmd){console.log('revenue: '+[...Object.keys(reads),'weekly-review','insights','contract','add','log',...workflows,'draft-weekly-review','draft-contract-memo','draft-recognition-review','import leapfin <file> --source=<account>','export'].join(', '));process.exit(0);}
 db=await getDb();let result;const actor=flags.actor||'operator';
 if(reads[cmd]||['weekly-review','insights'].includes(cmd))result=await read(db,cmd);
 else if(cmd==='contract')result=await details(db,rest[0]);
 else if(cmd==='add'){if(!flags.file)throw Error('Provide --file=<record.json>');result=await transaction(db,()=>insert(db,rest[0],JSON.parse(readFileSync(flags.file,'utf8'))),actor);}
 else if(workflows.includes(cmd))result=await transaction(db,()=>workflow(db,cmd,rest[0],flags),actor);
 else if(cmd==='log')result=await transaction(db,()=>insert(db,'notes',{source_id:randomUUID(),contract_id:rest[0],name:'Revenue review note',summary:flags.text,owner:actor}),actor);
 else if(cmd?.startsWith('draft-'))result=await draft(db,cmd.slice(6),rest[0]);
 else if(cmd==='export')result=saveArtifact('exports','revenue',await transaction(db,()=>exportData(db),actor));
 else if(cmd==='import'){if(rest[0]!=='leapfin')throw Error('Supported import: leapfin');result=await importLeapfin(db,rest[1],{source:flags.source,dry:!!flags['dry-run'],actor,mapping:flags.mapping?JSON.parse(readFileSync(flags.mapping,'utf8')):{}});}
 else throw Error('Unknown command '+cmd);
 output(result);
}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
