update accounts set design_defaults='{}'::jsonb where design_defaults<>'{}'::jsonb;
