import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCsv} from './csv.mjs';
import {date,transaction} from './domain.mjs';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
function cents(v){const s=String(v??'');if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Amount must be nonnegative decimal money with at most two decimals');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n))throw Error('Amount exceeds safe cents range');return n;}
function calendar(v){if(v==null||v==='')return null;const s=String(v);if(!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(s))throw Error('Unsupported calendar date '+s);return date(s.slice(0,10));}
export async function importLeapfin(db,file,{source,dry=false,mapping={},actor='import'}={}){
 if(typeof source!=='string'||!source.trim()||! /^[a-zA-Z0-9_-]+$/.test(source))throw Error('Provide --source=<unique-export-account-name>');
 const text=readFileSync(file,'utf8');let rows=file.toLowerCase().endsWith('.json')?JSON.parse(text):parseCsv(text);
 if(!Array.isArray(rows)||!rows.length)throw Error('Input must contain accounting records');
 return transaction(db,async()=>{
 let inserted=0,unchanged=0;const seen=new Set(),retained=new Set();
 for(const row of rows){
 if(!row||Array.isArray(row)||typeof row!=='object')throw Error('Invalid accounting record');
 const data={};for(const [key,v]of Object.entries(row)){const to=mapping[key]||key;if(Object.hasOwn(data,to))throw Error('Duplicate mapping for '+to);data[to]=v;}
 if(!['contract','line-item'].includes(data.objectType))throw Error('Only contract and line-item records are supported; separate other types before import');
 if(typeof data.id!=='string'||!data.id.trim())throw Error('Missing external id');
 const key=source+':'+data.objectType+':'+data.id;if(seen.has(key))throw Error('Duplicate source identity '+key);seen.add(key);
 if(!['NZD','AUD','USD','GBP','EUR'].includes(data.currencyCode))throw Error('Unsupported currencyCode');
 const amount=cents(data.amount),start=calendar(data.startDate),end=calendar(data.endDate);
 if(start&&end&&end<start)throw Error('End date precedes start date');
 const payload=canonical(data),fingerprint=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 const old=(await db.query('select * from source_records where source_id=$1',[key]))[0];
 if(old){if(old.fingerprint!==fingerprint)throw Error('Source record changed: '+key+'. Reconcile the change; history was not overwritten.');unchanged++;}
 else {await db.query('insert into source_records(source_id,name,source,object_type,external_id,amount_cents,currency,starts_on,ends_on,payload,fingerprint) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[key,String(data.description||data.id),source,data.objectType,data.id,amount,data.currencyCode,start,end,JSON.stringify(payload),fingerprint]);inserted++;}
 for(const k of Object.keys(data))if(!['id','objectType','amount','currencyCode','description','startDate','endDate'].includes(k))retained.add(k);
 }
 const result={dry_run:dry,inserted,unchanged,retained_payload_fields:[...retained].sort(),next:'Review source-inbox, add contracts and link obligations, then approve the accounting basis. Imported records are not recognised revenue.'};
 return result;
 },actor,{dry});
}
