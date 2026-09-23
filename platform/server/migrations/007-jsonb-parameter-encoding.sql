-- Earlier postgres.js writes JSON.stringify(text) into JSONB parameters,
-- storing the serialized object as a JSON string scalar.
update accounts set preferences=(preferences #>> '{}')::jsonb
where jsonb_typeof(preferences)='string' and left(ltrim(preferences #>> '{}'),1) in ('{','[');
update accounts set profile=(profile #>> '{}')::jsonb
where jsonb_typeof(profile)='string' and left(ltrim(profile #>> '{}'),1) in ('{','[');
update auth_tokens set payload=(payload #>> '{}')::jsonb
where jsonb_typeof(payload)='string' and left(ltrim(payload #>> '{}'),1) in ('{','[');
update events set appearance=(appearance #>> '{}')::jsonb
where jsonb_typeof(appearance)='string' and left(ltrim(appearance #>> '{}'),1) in ('{','[');
update events set entitlement=(entitlement #>> '{}')::jsonb
where jsonb_typeof(entitlement)='string' and left(ltrim(entitlement #>> '{}'),1) in ('{','[');
update event_passes set entitlement=(entitlement #>> '{}')::jsonb
where jsonb_typeof(entitlement)='string' and left(ltrim(entitlement #>> '{}'),1) in ('{','[');
update event_publications set entitlement=(entitlement #>> '{}')::jsonb
where jsonb_typeof(entitlement)='string' and left(ltrim(entitlement #>> '{}'),1) in ('{','[');
update jobs set payload=(payload #>> '{}')::jsonb
where jsonb_typeof(payload)='string' and left(ltrim(payload #>> '{}'),1) in ('{','[');
update jobs set result=(result #>> '{}')::jsonb
where jsonb_typeof(result)='string' and left(ltrim(result #>> '{}'),1) in ('{','[');
update audit set detail=(detail #>> '{}')::jsonb
where jsonb_typeof(detail)='string' and left(ltrim(detail #>> '{}'),1) in ('{','[');
