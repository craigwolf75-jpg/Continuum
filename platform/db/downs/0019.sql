-- Down for platform/db/0019_prompt50_foundations.sql.
-- Drops only objects this migration added. Does not DELETE clinical, audit,
-- consent or event data. The pg_trgm extension is left in place because
-- dropping it could affect later objects. No em dashes or en dashes.

drop function if exists platform.employer_release_permitted(uuid, text, timestamptz);
drop function if exists platform.board_submission_permitted(uuid, text, timestamptz);
drop function if exists platform.expire_break_glass(uuid, timestamptz);
drop function if exists platform.activate_break_glass(uuid, uuid, text, timestamptz, timestamptz, uuid);
drop function if exists config.evaluate_flag(text, uuid, uuid, uuid, timestamptz);
drop function if exists config.set_flag(text, text, uuid, boolean, text);
drop function if exists platform.authorize(uuid, text, text, uuid);
drop function if exists tenancy.provision_tenant(uuid, uuid, uuid, text, text, text, text, uuid, uuid);
drop function if exists tenancy.transition_status(uuid, text, uuid);
drop function if exists tenancy.assert_allowed_transition(text, text);
drop function if exists tenancy.lifecycle_privileges(text);
drop function if exists platform.migrations_current(text);
drop function if exists platform.ensure_future_partitions(int);
drop function if exists platform.is_range_partitioned(text, text);

drop table if exists platform.partition_watch;
drop table if exists events.event_schema;
drop table if exists platform.role_permission;
drop table if exists platform.permission_definition;

delete from platform.schema_migration where version = '0019';
