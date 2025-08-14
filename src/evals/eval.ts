import fs from "fs";
import YAML from "yaml";
import { log } from "../observability/logger.js";

type Task = { name: string; rule: string; expect: boolean };

function evaluateRule(rule: string, payload: string): boolean {
  const m = rule.match(/^contains:(.+)$/i);
  if (!m) return false;
  const needle = m[1];
  return payload.includes(needle);
}

const doc = YAML.parse(
  fs.readFileSync("src/evals/tasks.yaml", "utf8")
) as { tasks: Task[] };

const payload = fs.readFileSync("samples/adt_oru.hl7", "utf8");

let pass = 0,
  fail = 0;

for (const t of doc.tasks) {
  const actual = evaluateRule(t.rule, payload);
  const ok = actual === t.expect;
  ok ? pass++ : fail++;
  log(`Task: ${t.name} (rule=${t.rule}, expect=${t.expect}) => ${ok ? "PASS" : "FAIL"}`);
}

const rollback = fail > 0;
log(`Summary: PASS=${pass} FAIL=${fail} rollback=${rollback}`);
