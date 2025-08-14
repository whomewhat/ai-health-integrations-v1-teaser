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

```bash
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
