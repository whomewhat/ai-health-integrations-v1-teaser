/**
 * FHIR Proxy - Stub Implementation (TypeScript, ESM)
 * Provides a simple Express-based FHIR proxy server for testing.
 */

import express, { type Request, type Response } from "express";
import { log } from "../observability/logger.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// Middleware
app.use(express.json());

// Sample FHIR Patient data (stub)
const samplePatient = {
  resourceType: "Patient",
  id: "123456",
  meta: {
    versionId: "1",
    lastUpdated: new Date().toISOString(),
  },
  identifier: [
    { system: "http://example.org/fhir/ids", value: "MRN123456" },
  ],
  name: [{ family: "Doe", given: ["John"] }],
  gender: "male",
  birthDate: "1980-01-01",
  active: true,
} as const;

// FHIR Patient endpoint
app.get("/Patient/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  log("[FHIR Proxy] Received request for Patient ID:", id);

  // Return sample patient data with requested id
  const patient = { ...samplePatient, id };
  res.json(patient);
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "fhir-proxy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  log(`[FHIR Proxy] Server running on port ${PORT}`);
  log(`[FHIR Proxy] Try: http://localhost:${PORT}/Patient/123456`);
});
