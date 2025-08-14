# AI Health Integrations v1 — Teaser (Node/TypeScript)

Tiny, runnable teaser of how I’d stand up a **secure, reliable EHR integrations foundation** with an **agentic eval gate**.  
**All data is synthetic. No PHI. Local-only demo.**

## What this shows (in minutes)
- **FHIR proxy (stub)** — Express route for `/Patient/:id`
- **HL7v2 ingest (synthetic)** → **canonical mapping** → **idempotent enqueue**
- **Agent orchestrator** with a simple **policy hook** and **metrics**
- **YAML-driven eval harness** that prints **PASS/FAIL** and a **rollback flag**
- Clear extension points for **SQL/NoSQL**, **cloud queues**, **CI/CD**, and **observability**

---

## Quick start

**Prereqs**
- Node **v20** (see `.nvmrc`)
- `npm` v10+

~~~bash
# 1) Use the right Node version
nvm use

# 2) Install deps
npm install

# 3) Compile TypeScript -> dist/
npm run build

# 4) Run the data path (ingest → queue/file → process)
npm run hl7     # reads a synthetic HL7 message and enqueues + writes samples/normalized.json
npm run agent   # drains queue OR reads samples/normalized.json; prints metrics

# 5) Run the eval gate
npm run eval    # YAML tasks → PASS/FAIL per rule + rollback flag

# Optional: start the stubbed FHIR proxy (GET /Patient/:id on :3000)
npm run fhir
~~~

---

## Expected output (examples)

**Agent path**
~~~text
... - [HL7 Ingest] Enqueued: evt_... ok: true
... - [Agent] Processing event: evt_...
... - [Agent] Event processed successfully
... - Metrics: { processed: 1, pass: 1, fail: 0 }
~~~

**Eval gate — green path (both PASS)**
~~~text
Task: Medication reconciliation (rule=contains:HL7, expect=true) => PASS
Task: Discharge summary extraction (rule=contains:DISCHARGE, expect=true) => PASS
Summary: PASS=2 FAIL=0 rollback=false
~~~

**Eval gate — rollback demo (set the second task in `src/evals/tasks.yaml` to `expect: false`)**
~~~text
Task: Medication reconciliation (...) => PASS
Task: Discharge summary extraction (...) => FAIL
Summary: PASS=1 FAIL=1 rollback=true
~~~

> Toggle behavior by editing `src/evals/tasks.yaml`.

---

## Project structure
~~~text
.
├─ .nvmrc
├─ LICENSE
├─ SECURITY.md
├─ package.json
├─ tsconfig.json
├─ samples/
│  ├─ adt_oru.hl7            # synthetic HL7 ORU/ADT sample
│  └─ normalized.json        # canonical artifact written by hl7-ingest
└─ src/
   ├─ observability/
   │  ├─ logger.ts           # ISO-timestamped console logger
   │  └─ metrics.ts          # tiny counters (inc/snapshot)
   ├─ events/
   │  └─ queue.ts            # in-memory queue + idempotency on enqueue
   ├─ scripts/
   │  ├─ fhir-proxy.ts       # Express proxy: GET /Patient/:id (stub)
   │  ├─ hl7-ingest.ts       # reads synthetic HL7 → canonical → enqueue + write file
   │  └─ agent-orchestrator.ts # drains queue or reads file; policies + metrics
   └─ evals/
      ├─ tasks.yaml          # rules (contains:FOO) with expect true/false
      └─ eval.ts             # prints PASS/FAIL + rollback flag
~~~

---

## Scripts (for reference)
~~~json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "fhir": "node dist/scripts/fhir-proxy.js",
    "hl7": "node dist/scripts/hl7-ingest.js",
    "agent": "node dist/scripts/agent-orchestrator.js",
    "eval": "node dist/evals/eval.js"
  }
}
~~~

> Optional QoL: add `"prefhir": "tsc"`, `"prehl7": "tsc"`, `"preagent": "tsc"`, `"preeval": "tsc"` so each command auto-builds before running.

---

## SLOs & guardrails (teaser-level)
- **Idempotency** on enqueue (drop duplicates by ID)
- **Visible metrics**: processed/pass/fail counters and simple snapshots
- **Eval gate**: `rollback=true` if any task fails (demo discipline)

**Production targets to set during implementation**
- Ingest→available **P95 < 5s**, availability **≥ 99.9%**
- Error budgets, retry/replay/backpressure, MTTR, on-call runbooks & dashboards

---

## Extending this teaser
- **Queues:** swap in SQS/Kafka/Pub/Sub; add retry/replay & backpressure  
- **Storage:** plug **SQL/NoSQL** for canonical events & immutable audit trails  
- **Observability:** OpenTelemetry traces/metrics, dashboards, alerts  
- **CI/CD:** pipeline with tests, contract checks, environment gates  
- **Agentic evals:** replace demo rules with dataset-backed checks & reports

---

## Security & licensing
- See **`SECURITY.md`** — synthetic data only, **no PHI**, local-only demo, not production-ready.
- Licensed under **Apache-2.0** (see **`LICENSE`**).
