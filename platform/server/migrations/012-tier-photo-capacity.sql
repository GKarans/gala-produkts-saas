-- Increase only the stored-byte ceiling. Photo counts and all other event
-- entitlements remain unchanged. Apply to existing snapshots and future passes.
do $$
declare
  entitlement_table text;
begin
  foreach entitlement_table in array array['events', 'event_publications', 'event_passes'] loop
    execute format($sql$
      update %I
      set entitlement = jsonb_set(
        entitlement,
        '{bytes}',
        case entitlement->>'id'
          when 'trial' then '104857600'::jsonb
          when 'single' then '1048576000'::jsonb
          when 'gathering' then '1048576000'::jsonb
          when 'studio' then '2097152000'::jsonb
        end,
        true
      )
      where entitlement->>'id' in ('trial', 'single', 'gathering', 'studio')
        and (entitlement->>'bytes')::bigint < case entitlement->>'id'
          when 'trial' then 104857600
          when 'single' then 1048576000
          when 'gathering' then 1048576000
          when 'studio' then 2097152000
        end
    $sql$, entitlement_table);
  end loop;
end $$;
