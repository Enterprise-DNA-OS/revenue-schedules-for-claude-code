import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {REPO_ROOT} from './db.mjs';
export const entities=JSON.parse(readFileSync(new URL('./entities.json',import.meta.url),'utf8'));
export const reads={
 'contract-review':'select source_id,name,customer,owner,currency,amount_cents,allocated_cents,recorded_cents,status,review_on from v_contracts order by source_id',
 'obligations':'select o.source_id,o.name,c.name as contract,o.method,c.currency,o.amount_cents,o.starts_on,o.ends_on,o.basis,o.evidence from obligations o join contracts c on c.id=o.contract_id order by o.source_id',
 'revenue-waterfall':'select month,currency,contract_status,sum(scheduled_cents)::bigint as scheduled_cents,sum(recorded_cents)::bigint as recorded_cents,sum(pending_cents)::bigint as pending_cents from v_revenue_review group by month,currency,contract_status order by month,currency,contract_status',
 'recognition-due':"select source_id,obligation,contract,currency,month,pending_cents,period_status from v_revenue_review where month<date_trunc('month',current_date) and pending_cents>0 order by month,source_id",
 'source-inbox':'select source_id,name,object_type,currency,amount_cents,starts_on,ends_on from source_records order by source_id',
 'retention-review':'select source_id,name,jurisdiction,retention_basis_on,retain_until from contracts order by retain_until',
 'periods':'select source_id,month,status,evidence,locked_by from periods order by month',
 'recognitions':'select r.source_id,o.name as obligation,p.month,c.currency,r.amount_cents,r.status,r.reviewer,r.evidence,r.void_reason from recognitions r join obligations o on o.id=r.obligation_id join contracts c on c.id=o.contract_id join periods p on p.id=r.period_id order by p.month,r.source_id',
 'attention':'select * from v_attention order by due_on,source_id,issue',
 'compliance':'select * from v_compliance order by source_id,rule',
 'notes':'select n.source_id,c.name as contract,n.summary,n.owner,n.created_at from notes n join contracts c on c.id=n.contract_id order by n.created_at',
 'history':'select id,entity,action,actor,created_at from audit_log order by id desc limit 50'
};
export const questions=[
 ['Which contracts have an allocation gap and an overdue review?',"select source_id,name,owner,currency,(amount_cents-allocated_cents)::bigint as unallocated_cents from v_contracts where amount_cents<>allocated_cents and review_on<current_date order by source_id"],
 ['Which approved contracts have past revenue awaiting review?',"select contract,currency,sum(pending_cents)::bigint as pending_cents from v_revenue_review where contract_status='approved' and month<date_trunc('month',current_date) and pending_cents>0 group by contract,currency order by contract"],
 ['Which imported line items have no obligation linked to them?',"select s.source_id,s.name,s.currency,s.amount_cents from source_records s where object_type='line-item' and not exists(select 1 from obligations o where o.source_record_id=s.id) order by source_id"],
 ['Which owners have both overdue reviews and pending revenue?',"select distinct c.owner from contracts c join v_revenue_review v on v.contract_id=c.id where c.review_on<current_date and v.pending_cents>0 and v.month<date_trunc('month',current_date) order by c.owner"],
 ['Which customers have contracts in more than one currency?',"select customer,count(distinct currency)::int as currencies from contracts group by customer having count(distinct currency)>1 order by customer"],
 ['Which point-in-time obligations await a completed-month review?',"select contract,obligation,currency,month,pending_cents from v_revenue_review where method='point' and pending_cents>0 and month<date_trunc('month',current_date) order by source_id"],
 ['Which approved contracts have short evidence retention dates?',"select c.source_id,c.name,c.retain_until from contracts c join v_compliance v on v.source_id=c.source_id where c.status='approved' and v.rule='RECORDS-7Y' order by c.source_id"],
 ['Which draft obligations are already in past reporting months?',"select contract,obligation,currency,month,scheduled_cents from v_schedule where contract_status='draft' and month<date_trunc('month',current_date) order by month,source_id"],
 ['How much allocated consideration remains unrecorded by contract?',"select source_id,name,currency,(allocated_cents-recorded_cents)::bigint as remaining_cents from v_contracts order by source_id"],
 ['Which contracts have notes and outstanding allocation gaps?',"select c.source_id,c.name,n.summary from v_contracts c join notes n on n.contract_id=c.id where c.amount_cents<>c.allocated_cents order by c.source_id,n.source_id"]
];
export async function read(db,command){
 if(reads[command])return db.query(reads[command]);
 if(command==='weekly-review'){const out={};for(const c of ['contract-review','recognition-due','attention'])out[c]=await read(db,c);return out;}
 if(command==='insights'){const out=[];for(const [question,sql] of questions)out.push({question,rows:await db.query(sql)});return out;}
 throw Error('Unknown read '+command);
}
export function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('Use a real YYYY-MM-DD date');return value;}
export function month(value){date(value);if(!value.endsWith('-01'))throw Error('Month must be the first day');return value;}
export function normalise(entity,input){
 const s=entities[entity];if(!s)throw Error('Unsupported entity '+entity);
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Record must be an object');
 const out={};for(const [key,v] of Object.entries(input)){
 if(!s.fields.includes(key))throw Error('Unsupported field '+key);
 if(v==null||v===''){out[key]=null;continue;}
 if(s.numbers.includes(key)){if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<=0)throw Error(key+' must be positive safe integer cents');out[key]=Number(v);}
 else {if(typeof v!=='string'||!v.trim())throw Error(key+' must be nonempty text');out[key]=s.dates.includes(key)?date(v):v.trim();}
 }for(const k of s.required)if(out[k]==null)throw Error('Missing '+entity+'.'+k);return out;
}
export async function resolve(db,entity,needle,{lock=false}={}){
 if(!['contracts','obligations','source_records','periods','recognitions','notes'].includes(entity))throw Error('Unsupported entity');
 if(typeof needle!=='string'||!needle.trim())throw Error('Provide a source ID, UUID prefix or name');
 let rows=await db.query(`select * from ${entity} where source_id=$1 or id::text=$1${lock?' for update':''}`,[needle]);
 if(rows.length===1)return rows[0];
 rows=await db.query(`select * from ${entity} where starts_with(lower(id::text),lower($1)) or position(lower($1) in lower(name))>0 order by source_id${lock?' for update':''}`,[needle]);
 if(rows.length!==1)throw Error((rows.length?'Ambiguous':'No matching')+' '+entity+': '+needle+'\n'+rows.map(r=>r.source_id+' | '+r.name+' | '+r.id).join('\n'));
 return rows[0];
}
export async function transaction(db,fn,actor='operator',{dry=false}={}){
 if(typeof actor!=='string'||!actor.trim())throw Error('Actor must be nonempty');
 await db.exec('begin');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const out=await fn();await db.exec(dry?'rollback':'commit');return out;}catch(e){await db.exec('rollback');throw e;}
}
export async function insert(db,entity,input){const data=normalise(entity,input),s=entities[entity];for(const [key,to]of Object.entries(s.refs))if(data[key])data[key]=(await resolve(db,to,data[key])).id;const keys=Object.keys(data);return(await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(data)))[0];}
export async function details(db,needle){const contract=await resolve(db,'contracts',needle);return {contract,obligations:await db.query('select * from obligations where contract_id=$1 order by source_id',[contract.id]),schedule:await db.query('select source_id,obligation,currency,month,scheduled_cents,recorded_cents,pending_cents from v_revenue_review where contract_id=$1 order by month,source_id',[contract.id]),notes:await db.query('select summary,owner,created_at from notes where contract_id=$1 order by created_at',[contract.id])};}
async function getPeriod(db,value){month(value);await db.query("insert into periods(source_id,name,month) values($1::text,$1::text,$1::date) on conflict(month) do nothing",[value]);return resolve(db,'periods',value,{lock:true});}
export const workflows=['approve-contract','record-period','void-recognition','lock-period','review-contract','retain-evidence'];
export async function workflow(db,cmd,needle,flags){
 const evidence=flags.evidence?.trim();if(!evidence)throw Error('Provide --evidence for the recorded action');
 const actor=flags.actor||'operator',today=(await db.query('select current_date::text as d'))[0].d;
 if(cmd==='approve-contract'){
 const c=await resolve(db,'contracts',needle,{lock:true});if(c.status!=='draft')throw Error('Contract already approved');
 if(!flags.basis?.trim())throw Error('Provide --basis with the accounting assessment');
 return(await db.query("update contracts set status='approved',basis=$2,approval_evidence=$3,approved_by=$4,approved_on=current_date where id=$1 returning *",[c.id,flags.basis,evidence,actor]))[0];
 }
 if(cmd==='record-period'){
 const p=await getPeriod(db,needle);if(p.status==='locked')throw Error('Period is locked');
 if(p.month>=today.slice(0,7)+'-01')throw Error('Only completed months can be recorded');
 const rows=await db.query('select * from v_revenue_review where month=$1 and pending_cents>0 order by source_id',[p.month]);
 if(!rows.length)throw Error('No pending scheduled revenue');
 if(rows.some(r=>r.contract_status!=='approved'))throw Error('Draft contracts remain in this month; approve their allocation first');
 const out=[];for(const r of rows)out.push((await db.query('insert into recognitions(source_id,name,obligation_id,period_id,amount_cents,evidence,reviewer) values($1,$2,$3,$4,$5,$6,$7) returning *',[randomUUID(),r.obligation+' '+p.month,r.obligation_id,p.id,r.scheduled_cents,evidence,actor]))[0]);return out;
 }
 if(cmd==='void-recognition'){const r=await resolve(db,'recognitions',needle,{lock:true});if(r.status==='void')throw Error('Recognition already void');return(await db.query("update recognitions set status='void',void_reason=$2 where id=$1 returning *",[r.id,evidence]))[0];}
 if(cmd==='lock-period'){const p=await getPeriod(db,needle);return(await db.query("update periods set status='locked',evidence=$2,locked_by=$3 where id=$1 returning *",[p.id,evidence,actor]))[0];}
 if(cmd==='review-contract'||cmd==='retain-evidence'){
 const c=await resolve(db,'contracts',needle,{lock:true});const next=date(flags[cmd==='review-contract'?'next':'until']);
 if(cmd==='review-contract'&&next<=today)throw Error('Next review must be in the future');
 if(cmd==='retain-evidence'&&next<c.retain_until)throw Error('Retention can only be extended');
 await insert(db,'notes',{source_id:randomUUID(),name:cmd,contract_id:c.id,summary:evidence,owner:actor});
 return(await db.query(`update contracts set ${cmd==='review-contract'?'review_on':'retain_until'}=$2 where id=$1 returning *`,[c.id,next]))[0];
 }throw Error('Unknown workflow');
}
export async function exportData(db){const out={format:'revenue-schedules-v1'};for(const t of ['source_records','contracts','obligations','periods','recognitions','notes','audit_log'])out[t]=await db.query(`select * from ${t} order by ${t==='audit_log'?'id':'source_id'}`);return out;}
export function saveArtifact(dir,prefix,data){const folder=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);mkdirSync(folder,{recursive:true});const file=path.join(folder,prefix+'-'+randomUUID()+'.json');writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});return {file};}
export async function draft(db,kind,needle){const facts=kind==='weekly-review'?await read(db,'weekly-review'):kind==='contract-memo'?await details(db,needle):kind==='recognition-review'?await read(db,'recognition-due'):null;if(!facts)throw Error('Unknown draft type');return saveArtifact('drafts',kind,{status:'DRAFT: accountant review required; nothing posted or sent',generated_at:new Date().toISOString(),facts});}
