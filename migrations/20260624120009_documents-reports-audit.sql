
create or replace function public.audit_row_change() returns trigger language plpgsql security definer set search_path=public as $$
declare v_row jsonb:=coalesce(to_jsonb(new),to_jsonb(old)); v_org uuid;
begin v_org:=(v_row->>'organization_id')::uuid; if v_org is not null then insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(v_org,auth.uid(),lower(TG_OP),TG_TABLE_NAME,(v_row->>'id')::uuid,case when TG_OP in('UPDATE','DELETE') then to_jsonb(old) end,case when TG_OP in('INSERT','UPDATE') then to_jsonb(new) end); end if; if TG_OP='DELETE' then return old; end if; return new; end $$;
create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.audit_row_change();
create trigger audit_reports after insert or update or delete on public.reports for each row execute function public.audit_row_change();
create index if not exists reports_organization_created_idx on public.reports(organization_id,generated_at desc);
