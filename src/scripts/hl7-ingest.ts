/**
 * HL7 Ingest — Synthetic Data Processing (TypeScript, ESM)
 * Reads a synthetic HL7v2 message, normalizes it, enqueues it,
 * and also writes a canonical artifact to samples/normalized.json
 * so a separate agent process can pick it up.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { enqueue, type QueueItem } from "../events/queue.js";
import { log } from "../observability/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_PATH = path.resolve(__dirname, "../../samples/adt_oru.hl7");
const OUT_PATH = path.resolve(__dirname, "../../samples/normalized.json");

interface NormalizedEvent {
  id: string;
  type: "admission" | "discharge" | "transfer" | "update";
  patientId: string;
  facilityId: string;
  timestamp: string;
  data: {
    messageType: string;
    patientMRN: string;
    patientName: { family: string; given: string };
    patientDOB: string;
    patientGender: string;
    location?: string;
    attendingPhysician?: string;
  };
  metadata: {
    originalHL7: string;
    processedAt: string;
    source: string;
  };
}

// Minimal HL7 normalizer (good enough for a teaser)
function parseHL7Message(hl7: string): NormalizedEvent {
  const lines = hl7.trim().split(/\r?\n/);

  const msh = (lines.find(l => l.startsWith("MSH")) ?? "").split("|");
  const pid = (lines.find(l => l.startsWith("PID")) ?? "").split("|");
  const pv1 = (lines.find(l => l.startsWith("PV1")) ?? "").split("|");

  const msgType = msh[8] || "ADT^A01"; // MSH-9
  const mrn = pid[3] || "MRN_UNKNOWN"; // PID-3
  const nameParts = (pid[5] || "^").split("^"); // PID-5
  const family = nameParts[0] || "";
  const given = nameParts[1] || "";
  const dob = pid[7] || ""; // PID-7
  const sex = pid[8] || ""; // PID-8
  const location = pv1[3] || ""; // PV1-3
  const attending = pv1[7] || ""; // PV1-7

  const controlId = msh[9] || `MSG${Date.now()}`; // MSH-10
  const eventType =
    msgType.includes("A01") ? "admission" :
    msgType.includes("A03") ? "discharge" :
    msgType.includes("A02") ? "transfer" : "update";

  return {
    id: `evt_${controlId}`,
    type: eventType as NormalizedEvent["type"],
    patientId: mrn,
    facilityId: msh[4] || "FACILITY_001", // MSH-5 (receiving app/facility vary by site)
    timestamp: new Date().toISOString(),
    data: {
      messageType: msgType,
      patientMRN: mrn,
      patientName: { family, given },
      patientDOB: dob,
      patientGender: sex,
      location,
      attendingPhysician: attending
    },
    metadata: {
      originalHL7: hl7,
      processedAt: new Date().toISOString(),
      source: "hl7-ingest"
    }
  };
}

function main() {
  if (!fs.existsSync(SAMPLE_PATH)) {
    log("Missing sample HL7 file:", SAMPLE_PATH);
    process.exit(1);
  }

  const hl7 = fs.readFileSync(SAMPLE_PATH, "utf8");
  log("[HL7 Ingest] Processing HL7 message…");

  const normalized = parseHL7Message(hl7);

  // 1) Enqueue for same-process demos (no-op across processes; just a teaser)
  const item: QueueItem = { id: normalized.id, type: "HL7v2", payload: normalized };
  const ok = enqueue(item);
  log("[HL7 Ingest] Enqueued:", normalized.id, "ok:", ok);

  // 2) Persist for separate process demos (agent reads this file)
  fs.writeFileSync(OUT_PATH, JSON.stringify(normalized, null, 2), "utf8");
  log("[HL7 Ingest] Wrote canonical artifact:", OUT_PATH);

  log("[HL7 Ingest] Done. You can now run: npm run agent");
}

ma
