-- Continuum Prompt 40 (Prompt 39A Section 5, Prompt 40 Section 9.7): the board
-- error code catalogue. No board error code catalogue exists in the package, so
-- this table is built to grow from real rejections. It maps a board code and
-- description to AN ELEMENT and nothing more. It deliberately has NO column for a
-- required value, a polarity, or a correction, so it CANNOT store one: the board's
-- 2007 sample rejection text carries inverted polarity versus the current field
-- (39A Section 5), and inferring a value from a board message is how a vendor
-- ships the wrong fix. An unmapped code, or one below the 0.80 confidence floor,
-- surfaces the board's raw text to a named human (Prompt 39 rule).
--
-- Apply after 001_migration_wcb_engine.sql. Idempotent, one transaction. Hand
-- applied by Gary. No dashes anywhere.

begin;

create table if not exists clinical.wcb_error_catalogue (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code varchar(4) not null,
  board_code varchar(20) not null,
  -- the element the board code is about. Null means the code is not yet mapped;
  -- the engine then surfaces the raw board text to a human.
  element_name varchar(200),
  -- confidence in the ELEMENT mapping only (0 to 1). Below 0.80 the engine treats
  -- the code as unmapped and surfaces the raw text (Prompt 39 confidence floor).
  confidence numeric(3,2) not null default 0
    check (confidence >= 0 and confidence <= 1),
  -- a human note only (for example the 2007 inverted polarity caveat). Never a
  -- value or a correction.
  legacy_note text,
  source varchar(200) not null,
  unique (jurisdiction_code, board_code)
);
create index if not exists ix_error_catalogue on clinical.wcb_error_catalogue(jurisdiction_code, board_code);

commit;
