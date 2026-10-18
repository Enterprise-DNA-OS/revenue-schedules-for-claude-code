create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table audit_log(id bigint generated always as identity primary key, entity text not null, record_id uuid not null, action text not null, actor text not null, before_row jsonb, after_row jsonb, created_at timestamptz not null default now());
create function record_change() returns trigger language plpgsql as $$ begin
 insert into audit_log(entity,record_id,action,actor,before_row,after_row) values(TG_TABLE_NAME,new.id,TG_OP,coalesce(nullif(current_setting('app.actor',true),''),'database-operator'),case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new)); return new; end $$;
create table source_records(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, source text not null, object_type text not null check(object_type in ('contract','line-item')), external_id text not null, amount_cents bigint not null check(amount_cents>=0), currency text not null check(currency in ('NZD','AUD','USD','GBP','EUR')), starts_on date, ends_on date, payload jsonb not null, fingerprint text not null, unique(source,object_type,external_id), check(ends_on>=starts_on), created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table contracts(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, customer text not null, owner text not null, currency text not null check(currency in ('NZD','AUD','USD','GBP','EUR')), amount_cents bigint not null check(amount_cents>0), starts_on date not null, ends_on date not null, jurisdiction text not null check(jurisdiction in ('NZ','AU')), review_on date not null, retention_basis_on date not null, retain_until date not null, status text not null default 'draft' check(status in ('draft','approved')), basis text, approval_evidence text, approved_by text, approved_on date, check(ends_on>=starts_on and ends_on<=starts_on+interval '20 years'), check(retention_basis_on>=ends_on), check(retain_until>=retention_basis_on), check(status='draft' or (nullif(btrim(basis),'') is not null and nullif(btrim(approval_evidence),'') is not null and nullif(btrim(approved_by),'') is not null and approved_on is not null)), created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table obligations(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, contract_id uuid not null references contracts(id), source_record_id uuid references source_records(id), amount_cents bigint not null check(amount_cents>0), method text not null check(method in ('daily','point')), starts_on date not null, ends_on date not null, basis text not null check(length(btrim(basis))>0), evidence text not null check(length(btrim(evidence))>0), check(ends_on>=starts_on), check(method<>'point' or starts_on=ends_on), created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index on obligations(contract_id);
create table periods(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, month date not null unique check(month=date_trunc('month',month)::date), status text not null default 'open' check(status in ('open','locked')), evidence text, locked_by text, check(status='open' or (nullif(btrim(evidence),'') is not null and nullif(btrim(locked_by),'') is not null)), created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table recognitions(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, obligation_id uuid not null references obligations(id), period_id uuid not null references periods(id), amount_cents bigint not null check(amount_cents>0), evidence text not null check(length(btrim(evidence))>0), reviewer text not null check(length(btrim(reviewer))>0), status text not null default 'recorded' check(status in ('recorded','void')), void_reason text, check(status<>'void' or nullif(btrim(void_reason),'') is not null), created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index one_recognition on recognitions(obligation_id,period_id) where status='recorded';
create index on recognitions(period_id);
create table notes(id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null, contract_id uuid not null references contracts(id), summary text not null check(length(btrim(summary))>0), owner text not null, created_at timestamptz not null default now(),updated_at timestamptz not null default now());

-- Exact cumulative rounding allocates every cent once, including leap days.
create view v_schedule with (security_invoker=true) as
 with months as (
 select o.*,c.name as contract,c.owner,c.currency,c.status as contract_status,m::date as month,
 greatest(o.starts_on,m::date) as first_day,least(o.ends_on,(m+interval '1 month - 1 day')::date) as last_day
 from obligations o join contracts c on c.id=o.contract_id
 cross join lateral generate_series(date_trunc('month',o.starts_on)::timestamp,date_trunc('month',o.ends_on)::timestamp,interval '1 month') m
 ) select id as obligation_id,source_id,name as obligation,contract_id,contract,owner,currency,contract_status,month,method,
 (round(amount_cents::numeric*(last_day-starts_on+1)/(ends_on-starts_on+1))-round(amount_cents::numeric*(first_day-starts_on)/(ends_on-starts_on+1)))::bigint as scheduled_cents from months;
create view v_revenue_review with (security_invoker=true) as
 select s.*,coalesce(r.amount_cents,0)::bigint as recorded_cents,(s.scheduled_cents-coalesce(r.amount_cents,0))::bigint as pending_cents,coalesce(p.status,'open') as period_status
 from v_schedule s left join periods p on p.month=s.month left join recognitions r on r.period_id=p.id and r.obligation_id=s.obligation_id and r.status='recorded';
create view v_contracts with (security_invoker=true) as
 select c.*,coalesce((select sum(o.amount_cents) from obligations o where o.contract_id=c.id),0)::bigint as allocated_cents,
 coalesce((select sum(r.amount_cents) from recognitions r join obligations o on o.id=r.obligation_id where o.contract_id=c.id and r.status='recorded'),0)::bigint as recorded_cents from contracts c;
create view v_attention with (security_invoker=true) as
 select source_id,name as item,owner,'Contract review overdue'::text as issue,review_on as due_on from contracts where review_on<current_date
 union all select source_id,name,owner,'Allocation differs from contract consideration',review_on from v_contracts where amount_cents<>allocated_cents
 union all select source_id,obligation,owner,'Past month awaits recognition review',(month+interval '1 month - 1 day')::date from v_revenue_review where month<date_trunc('month',current_date) and pending_cents>0 and contract_status='approved'
 union all select source_id,name,source,'Imported line has no linked obligation',coalesce(starts_on,current_date) from source_records s where object_type='line-item' and not exists(select 1 from obligations o where o.source_record_id=s.id);
create view v_compliance with (security_invoker=true) as
 select source_id,'IFRS15-22-73'::text as rule,'Review performance obligations and allocation evidence'::text as finding from v_contracts where amount_cents<>allocated_cents or status<>'approved'
 union all select source_id,'RECORDS-7Y','Retention date is less than seven years after the recorded retention basis' from contracts where retain_until<(retention_basis_on+interval '7 years')::date
 union all select source_id,'POLICY-REVIEW','Internal policy review date is overdue' from contracts where review_on<current_date;

create function guard_obligation() returns trigger language plpgsql as $$ declare c contracts%rowtype;s source_records%rowtype;m date;p periods%rowtype;begin
 select * into c from contracts where id=new.contract_id for update;
 if c.status='approved' then raise exception 'Approved contract obligations are immutable';end if;
 if TG_OP='UPDATE' and new.contract_id<>old.contract_id then raise exception 'Cannot move an obligation between contracts';end if;
 if new.starts_on<c.starts_on or new.ends_on>c.ends_on then raise exception 'Obligation outside contract dates';end if;
 for m in select generate_series(date_trunc('month',new.starts_on)::timestamp,date_trunc('month',new.ends_on)::timestamp,interval '1 month')::date loop
 insert into periods(source_id,name,month) values(m::text,m::text,m) on conflict(month) do nothing;
 select * into p from periods where month=m for update;
 if p.status='locked' then raise exception 'Cannot change a schedule in a locked period';end if;
 end loop;
 if new.source_record_id is not null then
 select * into s from source_records where id=new.source_record_id;
 if s.object_type<>'line-item' or s.currency<>c.currency then raise exception 'Source must be a line item in the contract currency';end if;
 end if;
 return new;end $$;
create trigger obligations_guard before insert or update on obligations for each row execute function guard_obligation();
create function guard_contract() returns trigger language plpgsql as $$ begin
 if TG_OP='UPDATE' and old.status='approved' and (to_jsonb(new)-array['review_on','retain_until','updated_at']) is distinct from (to_jsonb(old)-array['review_on','retain_until','updated_at']) then raise exception 'Approved contract facts are immutable';end if;
 if TG_OP='UPDATE' and old.status='approved' and new.retain_until<old.retain_until then raise exception 'Retention can only be extended';end if;
 if exists(select 1 from obligations where contract_id=new.id and (starts_on<new.starts_on or ends_on>new.ends_on)) then raise exception 'Contract dates exclude an obligation';end if;
 if new.status='approved' then
 if new.amount_cents<>coalesce((select sum(amount_cents) from obligations where contract_id=new.id),0) then raise exception 'Allocation must equal contract consideration';end if;
 if new.approved_on>current_date then raise exception 'Approval cannot be in the future';end if;
 end if;return new;end $$;
create trigger contracts_guard before insert or update on contracts for each row execute function guard_contract();
create function guard_recognition() returns trigger language plpgsql as $$ declare p periods%rowtype;s record;begin
 select * into p from periods where id=new.period_id for update;
 if p.status='locked' then raise exception 'Period is locked';end if;
 if p.month>=date_trunc('month',current_date)::date then raise exception 'Only completed months can be recorded';end if;
 select * into s from v_schedule where obligation_id=new.obligation_id and month=p.month;
 if not found or s.contract_status<>'approved' or s.scheduled_cents<>new.amount_cents then raise exception 'Recognition must match an approved schedule';end if;
 if TG_OP='UPDATE' and ((to_jsonb(new)-array['status','void_reason','updated_at']) is distinct from (to_jsonb(old)-array['status','void_reason','updated_at']) or old.status='void' or new.status<>'void') then raise exception 'Only voiding with a reason is allowed';end if;
 return new;end $$;
create trigger recognitions_guard before insert or update on recognitions for each row execute function guard_recognition();
create function guard_period() returns trigger language plpgsql as $$ begin
 if TG_OP='UPDATE' and (old.status='locked' or old.month<>new.month) then raise exception 'Locked periods and period dates are immutable';end if;
 if new.status='locked' then
 if new.month>=date_trunc('month',current_date)::date then raise exception 'Cannot lock an incomplete month';end if;
 if exists(select 1 from v_revenue_review where month=new.month and pending_cents>0) then raise exception 'Month has unreviewed scheduled revenue';end if;
 end if;return new;end $$;
create trigger periods_guard before insert or update on periods for each row execute function guard_period();
create function deny_change() returns trigger language plpgsql as $$ begin raise exception 'History is append-only';end $$;
create trigger source_immutable before update or delete on source_records for each row execute function deny_change();
create trigger audit_immutable before update or delete on audit_log for each row execute function deny_change();
do $$ declare t text;begin foreach t in array array['source_records','contracts','obligations','periods','recognitions','notes'] loop
 execute format('create trigger %I before update on %I for each row execute function touch_updated()',t||'_touch',t);
 execute format('create trigger %I after insert or update on %I for each row execute function record_change()',t||'_audit',t);
 execute format('create trigger %I before delete on %I for each row execute function deny_change()',t||'_no_delete',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;end $$;
alter table audit_log enable row level security;
revoke all on audit_log,v_schedule,v_revenue_review,v_contracts,v_attention,v_compliance from public;
