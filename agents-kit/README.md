# Continuum Agents Kit

A drop-in Claude Code agent group for the Continuum site repo. Zeus governs the
main thread through CLAUDE.md; five sub agents live in .claude/agents/; a seeded
mission queue lives in zeus-missions.md.

## The autonomy model, stated honestly

This kit is built on Claude Code's real agent architecture, not on aspiration.

- Sub agents are markdown files with YAML frontmatter that Claude Code
  discovers in .claude/agents/.
- Zeus's doctrine lives in CLAUDE.md, where it governs every session run in
  this repo.
- The mission queue (zeus-missions.md) is a file Zeus reads, executes, and
  updates. It is his memory between runs, alongside git history.

Autonomy here means scheduled invocation, and nothing more. A cron job or a
GitHub Actions step runs Zeus headlessly against the queue on a schedule. The
kit does not claim, and Zeus does not have, continuous background
consciousness. He runs when invoked, remembers through the repo, and by his own
doctrine stops at every human gate even when a schedule invoked him, because a
schedule is never a reason to bypass a gate.

Human gates that always stop for Gary: consent language, legal pages, pricing,
schema, and the ruling on which portals go public.

## Install (four steps)

1. Copy CLAUDE.md to the root of the Continuum site repo. If a CLAUDE.md
   already exists there, merge Zeus's doctrine into it rather than overwriting.
2. Copy the .claude/agents/ directory into the repo root so the five agent
   files sit at .claude/agents/athena.md, apollo.md, heracles.md, hermes.md,
   and argus.md.
3. Copy zeus-missions.md to the root of the repo.
4. Open Claude Code in the repo and say the one sentence: Zeus, run the queue.

## Running Zeus on a schedule (optional)

Zeus runs the same way whether a person or a scheduler invokes him. To invoke
him headlessly against the queue:

    claude -p "Zeus, run the queue"

### cron

Run Zeus every weekday morning. Adjust the path and time to your setup:

    # m h dom mon dow  command
    0 9 * * 1-5  cd /path/to/continuum && claude -p "Zeus, run the queue" >> .zeus/run.log 2>&1

### GitHub Actions

A scheduled workflow that runs Zeus against the queue. This runs Zeus; it does
not remove the human gates, which still stop the run and surface to Gary.

    name: zeus-queue
    on:
      schedule:
        - cron: "0 9 * * 1-5"
      workflow_dispatch: {}
    jobs:
      run-zeus:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - name: Run Zeus against the queue
            run: claude -p "Zeus, run the queue"
            env:
              ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

## What is in the kit

- CLAUDE.md: Zeus's doctrine. Routing table, the eight inherited laws, the four
  gates, the canon ledger, the escalation list, the propagation rule.
- zeus-missions.md: the seeded queue. Four pending site-repo missions, a first
  full Argus patrol, and a backlog.
- .claude/agents/athena.md: architecture and code.
- .claude/agents/apollo.md: content and design.
- .claude/agents/heracles.md: quality and tests.
- .claude/agents/hermes.md: release.
- .claude/agents/argus.md: the watcher.

## The roster

Zeus, Athena, Apollo, Heracles, Hermes, Argus. These names are deliberately
distinct from the ViaConnect roster; different platform, different crew, no
cross-contamination. What crosses over is law, not personnel: the dash rule,
the resilience pattern, the migration and package.json locks, and the paired-
document delivery standard bind both rosters because they are project law.
