export const PLATFORM_MIGRATIONS = Object.freeze([
  {version:'001-platform',file:'schema.sql'},
  {version:'002-delivery-leases',file:'migrations/002-delivery-leases.sql'},
  {version:'003-publication-allowances',file:'migrations/003-publication-allowances.sql'},
  {version:'004-account-profile',file:'migrations/004-account-profile.sql'},
  {version:'005-gallery-curation',file:'migrations/005-gallery-curation.sql'},
  {version:'006-r2-usage-guard',file:'migrations/006-r2-usage-guard.sql'},
  {version:'007-jsonb-parameter-encoding',file:'migrations/007-jsonb-parameter-encoding.sql'},
  {version:'008-organized-r2-keys',file:'migrations/008-organized-r2-keys.sql'},
  {version:'009-organizer-design-defaults',file:'migrations/009-organizer-design-defaults.sql'},
  {version:'010-event-isolated-designs',file:'migrations/010-event-isolated-designs.sql'},
  {version:'011-queue-job-dispatch',file:'migrations/011-queue-job-dispatch.sql'}
]);
