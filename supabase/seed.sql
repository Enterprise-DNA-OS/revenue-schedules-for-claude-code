
insert into contracts(id,source_id,name,customer,owner,currency,amount_cents,starts_on,ends_on,jurisdiction,review_on,retention_basis_on,retain_until)
values
('00000000-0000-0000-0000-000000000001','con1','Harbour annual service','Harbour Demo Ltd','Alex','NZD',1200000,(date_trunc('month',current_date)-interval '2 months')::date,(date_trunc('month',current_date)+interval '10 months - 1 day')::date,'NZ',current_date-10,(date_trunc('year',current_date)+interval '2 years')::date,(date_trunc('year',current_date)+interval '9 years')::date),
('00000000-0000-0000-0000-000000000002','con2','Harbour setup project','Harbour Demo Ltd','Alex','AUD',300000,(date_trunc('month',current_date)-interval '1 month')::date,(date_trunc('month',current_date)-interval '1 day')::date,'AU',current_date+20,current_date,current_date+365),
('00000000-0000-0000-0000-000000000003','con3','Coastal bundled service','Coastal Demo Ltd','Morgan','USD',900000,(date_trunc('month',current_date)-interval '1 month')::date,(date_trunc('month',current_date)+interval '5 months - 1 day')::date,'NZ',current_date-5,(date_trunc('year',current_date)+interval '2 years')::date,(date_trunc('year',current_date)+interval '9 years')::date)
on conflict(source_id) do nothing;
insert into obligations(id,source_id,name,contract_id,amount_cents,method,starts_on,ends_on,basis,evidence)
select '00000000-0000-0000-0000-000000000011','obl1','Annual access','00000000-0000-0000-0000-000000000001',1200000,'daily',starts_on,ends_on,'Even daily service; approved fixed consideration allocation','Fictional signed service agreement' from contracts where source_id='con1' and not exists(select 1 from obligations where source_id='obl1')
on conflict(source_id) do nothing;
insert into obligations(id,source_id,name,contract_id,amount_cents,method,starts_on,ends_on,basis,evidence)
select '00000000-0000-0000-0000-000000000012','obl2','Setup handover','00000000-0000-0000-0000-000000000002',300000,'point',ends_on,ends_on,'Control transfers on accepted handover','Fictional signed acceptance' from contracts where source_id='con2' and not exists(select 1 from obligations where source_id='obl2')
on conflict(source_id) do nothing;
insert into obligations(id,source_id,name,contract_id,amount_cents,method,starts_on,ends_on,basis,evidence)
select '00000000-0000-0000-0000-000000000013','obl3','Bundled access','00000000-0000-0000-0000-000000000003',600000,'daily',starts_on,ends_on,'Draft allocation; implementation obligation still missing','Fictional contract memo' from contracts where source_id='con3' and not exists(select 1 from obligations where source_id='obl3')
on conflict(source_id) do nothing;
update contracts set status='approved',basis='Accountant demo assessment of fixed consideration and distinct obligations',approval_evidence='Fictional approval memo',approved_by='Demo accountant',approved_on=current_date where source_id in ('con1','con2') and status='draft';
insert into source_records(source_id,name,source,object_type,external_id,amount_cents,currency,starts_on,ends_on,payload,fingerprint)
values('demo:line-item:orphan','Unmapped setup line','demo','line-item','orphan',10000,'NZD',current_date-30,current_date-1,'{"id":"orphan","objectType":"line-item"}','fictional-demo') on conflict(source_id) do nothing;
insert into notes(source_id,name,contract_id,summary,owner) values('note1','Allocation follow-up','00000000-0000-0000-0000-000000000003','Implementation allocation still needs approval.','Morgan') on conflict(source_id) do nothing;
