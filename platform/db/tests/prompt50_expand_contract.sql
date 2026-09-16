-- Prompt 50 Section 10.3 / 12.5: synthetic expand and contract.
-- Adds a column, dual writes, backfills, then reads the new column.
-- Does not rename or drop a column in use on a live table.
-- No em dashes or en dashes anywhere.

\set ON_ERROR_STOP on

create schema if not exists prompt50_probe;

create table if not exists prompt50_probe.item (
  id    uuid primary key,
  label text not null
);

insert into prompt50_probe.item (id, label)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'alpha')
on conflict (id) do nothing;

-- expand
alter table prompt50_probe.item add column if not exists label_new text;

-- dual write
create or replace function prompt50_probe.dual_write_label()
returns trigger language plpgsql as $$
begin
  new.label_new := new.label;
  return new;
end
$$;

drop trigger if exists tr_item_dual_write on prompt50_probe.item;
create trigger tr_item_dual_write
  before insert or update on prompt50_probe.item
  for each row execute function prompt50_probe.dual_write_label();

-- backfill
update prompt50_probe.item set label_new = label where label_new is null;

-- switch read
do $$
declare v text;
begin
  select label_new into v from prompt50_probe.item where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  if v is distinct from 'alpha' then
    raise exception 'FAIL: expand and contract backfill expected alpha, got %', v;
  end if;
end $$;

insert into prompt50_probe.item (id, label)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'beta');

do $$
declare v text;
begin
  select label_new into v from prompt50_probe.item where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
  if v is distinct from 'beta' then
    raise exception 'FAIL: dual write expected beta, got %', v;
  end if;
end $$;
