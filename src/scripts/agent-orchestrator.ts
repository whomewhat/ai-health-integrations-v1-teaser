/**
 * Agent Orchestrator — Queue/File Processing with Policy Hooks (TypeScript, ESM)
 * Processes events with policy validation and metrics collection.
 * - If the in-memory queue has items (same-process demo), it will drain that.
 * - Otherwise it will read a canonical event from samples/normalized.json (cross-process demo).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../observability/logger.js";
import { inc, snapshot } from "../observability/metrics.js";
import { dequeue, size, type QueueItem } from "../events/queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANONICAL_PATH = path.resolve(__dirname, "../../samples/normalized.json");

interface PolicyResult {
  allowed: boolean;
  reason: string;
  metadata?: Record<string, unknown>;
}

interface ProcessingMetrics {
  eventsProcessed: number;
  policyViolations: number;
  successCount: number;
  errorCount: number;
  startTime: Date;
  endTime?: Date;
  processingTimeMs?: number;
}

type NormalizedEvent = {
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
};

function asEvent(item: unknown): NormalizedEvent {
  return item as NormalizedEvent;
}

/** Simple policy engine (stub) */
function validateEventPolicy(event: NormalizedEvent): PolicyResult {
  log("[Agent] Validating policy for event:", event.id);

  const policies = [
    {
      name: "patient-mrn-required",
      check: () => !!event.data.patientMRN && event.data.patientMRN.length > 0,
      reason: "Patient MRN is required",
    },
    {
      name: "valid-message-type",
      check: () => !!event.data.messageType && event.data.messageType.includes("ADT"),
      reason: "Invalid message type - must be ADT",
    },
    {
      name: "facility-whitelist",
      check: () => ["FACILITY_001", "FACILITY_002"].includes(event.facilityId),
      reason: "Facility not in whitelist",
    },
  ] as const;

  for (const p of policies) {
    if (!p.check()) {
      log("[Agent] Policy violation:", p.name, "-", p.reason);
      return { allowed: false, reason: p.reason, metadata: { violatedPolicy: p.name } };
    }
  }

  return { allowed: true, reason: "All policies passed", metadata: { policiesChecked: policies.length } };
}

/** Process a single event */
function processEvent(event: NormalizedEvent, metrics: ProcessingMetrics): void {
  log("\n[Agent] Processing event:", event.id);
  log("[Agent] Event type:", event.type);
  log("[Agent] Patient:", event.data.patientName.given, event.data.patientName.family);

  try {
    const policy = validateEventPolicy(event);

    if (!policy.allowed) {
      log("[Agent] Event rejected:", policy.reason);
      metrics.policyViolations++;
      metrics.errorCount++;
      return;
    }

    // Simulated downstream work
    log("[Agent] → Writing to database (simulated)");
    log("[Agent] → Triggering downstream workflows (simulated)");
    log("[Agent] → Updating patient index (simulated)");

    metrics.successCount++;
    log("[Agent] Event processed successfully");
  } catch (err) {
    console.error("[Agent] Error processing event:", err);
    metrics.errorCount++;
  } finally {
    metrics.eventsProcessed++;
    inc("processed");
  }
}

/** Gather events from queue (if any) or from samples/normalized.json */
function gatherEvents(): NormalizedEvent[] {
  const collected: NormalizedEvent[] = [];

  if (size() > 0) {
    log(`[Agent] Draining in-memory queue (size=${size()})`);
    while (size() > 0) {
      const item = dequeue() as QueueItem | undefined;
      if (!item) break;
      if (item.payload) collected.push(asEvent(item.payload));
    }
    return collected;
  }

  // Fallback to file for cross-process demo
  if (fs.existsSync(CANONICAL_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CANONICAL_PATH, "utf8"));
      collected.push(asEvent(raw));
      log("[Agent] Loaded canonical event from file:", CANONICAL_PATH);
    } catch (e) {
      console.error("[Agent] Failed to read canonical event:", e);
    }
  } else {
    log("[Agent] No events in queue and no canonical file found. Run `npm run hl7` first.");
  }

  return collected;
}

/** Main */
function runOrchestrator(): void {
  log("[Agent] Starting Agent Orchestrator…");

  const metrics: ProcessingMetrics = {
    eventsProcessed: 0,
    policyViolations: 0,
    successCount: 0,
    errorCount: 0,
    startTime: new Date(),
  };

  const events = gatherEvents();
  log(`[Agent] Found ${events.length} event(s) to process\n`);

  for (const ev of events) processEvent(ev, metrics);

  metrics.endTime = new Date();
  metrics.processingTimeMs = metrics.endTime.getTime() - metrics.startTime.getTime();

  const snap = snapshot();
  const successRate =
    metrics.eventsProcessed > 0 ? ((metrics.successCount / metrics.eventsProcessed) * 100).toFixed(1) : "0.0";

  console.log("\n" + "=".repeat(50));
  console.log("[Agent] PROCESSING METRICS");
  console.log("=".repeat(50));
  console.log(`Events Processed: ${metrics.eventsProcessed}`);
  console.log(`Successful:       ${metrics.successCount}`);
  console.log(`Errors:           ${metrics.errorCount}`);
  console.log(`Policy Violations:${metrics.policyViolations}`);
  console.log(`Processing Time:  ${metrics.processingTimeMs}ms`);
  console.log(`Success Rate:     ${successRate}%`);
  console.log("Counters Snapshot:", snap);
  console.log("=".repeat(50));
  log("[Agent] Orchestrator complete");
}

runOrchestrator();
