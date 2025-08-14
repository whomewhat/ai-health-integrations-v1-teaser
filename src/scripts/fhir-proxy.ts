#!/usr/bin/env node

/**
 * FHIR Proxy - Stub Implementation
 * Provides a simple Express-based FHIR proxy server for testing
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Sample FHIR Patient data
const samplePatient = {
  resourceType: 'Patient',
  id: '123456',
  meta: {
    versionId: '1',
    lastUpdated: new Date().toISOString(),
  },
  identifier: [
    {
      system: 'http://example.org/fhir/ids',
      value: 'MRN123456',
    },
  ],
  name: [
    {
      family: 'Doe',
      given: ['John'],
    },
  ],
  gender: 'male',
  birthDate: '1980-01-01',
  active: true,
};

// FHIR Patient endpoint
app.get('/Patient/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`[FHIR Proxy] Received request for Patient ID: ${id}`);
  
  // Return sample patient data
  const patient = { ...samplePatient, id };
  
  res.json(patient);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fhir-proxy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`[FHIR Proxy] Server running on port ${PORT}`);
  console.log(`[FHIR Proxy] Try: http://localhost:${PORT}/Patient/123456`);
});
