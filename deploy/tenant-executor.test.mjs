/* Continuum physician platform: tenant-scoped executor suite (CI, no network). Proves the
   app-layer half of the tenancy guardrail (Prompt 51, decision 50a b): every unit of work runs as
   ONE transaction that injects app.organisation_id server side before the query, fails closed when
   no valid tenant is set, and rolls back on error. Injects a fake connection so no database is
   needed. No dashes anywhere. */

import { createTenantScopedExecute } from "./tenant-executor.mjs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error("  FAIL: " + n); } };

const ORG = "11111111-1111-1111-1111-111111111111";

// a fake connection: records every statement run on the one session, returns canned rows.
function fakeConn(rowsFor) {
  const stmts = [];
  const withConnection = async (fn) => {
    const raw = async (sql) => { stmts.push(sql); return rowsFor ? rowsFor(sql) : []; };
    return await fn(raw);
  };
  return { withConnection, stmts };
}

// -- constructor guard -------------------------------------------------------
ok("requires an injected withConnection", (() => {
  try { createTenantScopedExecute({ organisationId: ORG }); return false; } catch { return true; }
})());

// -- happy path: begin, inject tenant, run query, commit ---------------------
{
  const c = fakeConn((sql) => /select \* from clinical\.worker/.test(sql) ? [{ id: "w1" }] : []);
  const exec = createTenantScopedExecute({ withConnection: c.withConnection, organisationId: ORG });
  const rows = await exec("select * from clinical.worker");
  ok("returns the payload rows", rows.length === 1 && rows[0].id === "w1");
  ok("runs exactly begin, set_config, query, commit in order",
    c.stmts.length === 4 &&
    /^begin/i.test(c.stmts[0]) &&
    /set_config\('app\.organisation_id',\s*'11111111-1111-1111-1111-111111111111',\s*true\)/i.test(c.stmts[1]) &&
    /select \* from clinical\.worker/.test(c.stmts[2]) &&
    /^commit/i.test(c.stmts[3]));
  ok("tenant is injected BEFORE the payload query",
    c.stmts.findIndex(s => /set_config/i.test(s)) < c.stmts.findIndex(s => /clinical\.worker/.test(s)));
  ok("set_config is transaction local (third arg true)", /,\s*true\)/.test(c.stmts[1]));
}

// -- fail closed: a missing or malformed tenant runs NOTHING -----------------
{
  for (const bad of [undefined, null, "", "   ", "not-a-uuid", "1234"]) {
    const c = fakeConn();
    const exec = createTenantScopedExecute({ withConnection: c.withConnection, organisationId: bad });
    let threw = false;
    try { await exec("select 1"); } catch { threw = true; }
    ok("fail closed on tenant " + JSON.stringify(bad) + ": throws", threw);
    ok("fail closed on tenant " + JSON.stringify(bad) + ": no statements reached the connection", c.stmts.length === 0);
  }
}

// -- rollback on error: payload throws, we rollback and never commit ---------
{
  const c = fakeConn((sql) => { if (/boom/.test(sql)) throw new Error("boom"); return []; });
  const exec = createTenantScopedExecute({ withConnection: c.withConnection, organisationId: ORG });
  let msg = null;
  try { await exec("select boom"); } catch (e) { msg = e.message; }
  ok("the payload error propagates", msg === "boom");
  ok("rolled back and did not commit", c.stmts.some(s => /^rollback/i.test(s)) && !c.stmts.some(s => /^commit/i.test(s)));
}

// -- a spoofed tenant cannot inject SQL (validated as a uuid) ----------------
{
  const c = fakeConn();
  const exec = createTenantScopedExecute({ withConnection: c.withConnection, organisationId: "1'; drop table clinical.worker; --" });
  let threw = false;
  try { await exec("select 1"); } catch { threw = true; }
  ok("a non-uuid tenant is refused and never reaches the connection", threw && c.stmts.length === 0);
}

console.log("\ntenant-scoped executor suite: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
