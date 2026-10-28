-- ==============================================================================
-- AICTE Security Deposit / FDR Management Portal - Cron & Automation Functions
-- Migration: 0004_cron_and_functions.sql
-- ==============================================================================

-- 1. Maturity Monitoring Function
create or replace function check_upcoming_maturities()
returns table (
  instrument_id uuid,
  institution_name text,
  days_to_maturity int,
  fdr_number text
) as $$
declare
  item record;
  days_left int;
  inst_profile_id uuid;
begin
  for item in
    select 
      f.id,
      f.fdr_number,
      f.maturity_date,
      f.institution_id,
      i.name as inst_name,
      i.region_id,
      f.submitted_by
    from fdr_instruments f
    join institutions i on i.id = f.institution_id
    where f.status = 'active'
      and f.maturity_date between current_date and (current_date + interval '30 days')
  loop
    days_left := (item.maturity_date - current_date);
    
    if days_left in (30, 15, 7, 3, 1, 0) then
      -- Find institution primary profile
      select id into inst_profile_id from profiles where institution_id = item.institution_id limit 1;

      -- Insert notification for Institution
      if inst_profile_id is not null then
        insert into notifications (user_id, region_id, type, title, message, payload, status)
        values (
          inst_profile_id,
          item.region_id,
          'MATURITY_REMINDER',
          format('Upcoming FDR Maturity: %s days remaining', days_left),
          format('Fixed Deposit Receipt #%s for %s matures on %s (%s days remaining). Please initiate renewal or NOC release proceedings.', item.fdr_number, item.inst_name, item.maturity_date, days_left),
          jsonb_build_object('instrument_id', item.id, 'days_left', days_left, 'fdr_number', item.fdr_number),
          'unread'
        );
      end if;

      -- Insert regional officer broadcast notification
      insert into notifications (role_target, region_id, type, title, message, payload, status)
      values (
        'regional_finance_officer',
        item.region_id,
        'OFFICER_MATURITY_ALERT',
        format('Regional Maturity Alert: %s (%s days)', item.inst_name, days_left),
        format('Instrument #%s belonging to %s matures on %s. Renewal or encashment action required.', item.fdr_number, item.inst_name, item.maturity_date),
        jsonb_build_object('instrument_id', item.id, 'institution_id', item.institution_id, 'days_left', days_left),
        'unread'
      );
    end if;

    instrument_id := item.id;
    institution_name := item.inst_name;
    days_to_maturity := days_left;
    fdr_number := item.fdr_number;
    return next;
  end loop;
end;
$$ language plpgsql security definer;

-- 2. Audit Chain Verification Function (Postgres internal helper)
create or replace function verify_audit_chain(p_entity_id uuid)
returns jsonb as $$
declare
  rec record;
  prev_h text := 'GENESIS';
  computed_h text;
  is_valid boolean := true;
  total_checked int := 0;
  failed_entry_id uuid := null;
begin
  for rec in
    select id, entity_type, entity_id, action, prev_hash, entry_hash, after, created_at
    from audit_logs
    where entity_id = p_entity_id
    order by created_at asc
  loop
    total_checked := total_checked + 1;
    
    if rec.prev_hash is not null and rec.prev_hash != prev_h then
      is_valid := false;
      failed_entry_id := rec.id;
      exit;
    end if;
    
    -- In postgres: encode(digest(string, 'sha256'), 'hex')
    computed_h := encode(digest(rec.prev_hash || coalesce(rec.after::text, '') || rec.action || rec.entity_id::text, 'sha256'), 'hex');
    
    if computed_h != rec.entry_hash then
      is_valid := false;
      failed_entry_id := rec.id;
      exit;
    end if;

    prev_h := rec.entry_hash;
  end loop;

  return jsonb_build_object(
    'is_valid', is_valid,
    'total_checked', total_checked,
    'failed_entry_id', failed_entry_id,
    'last_hash', prev_h
  );
end;
$$ language plpgsql security definer;
