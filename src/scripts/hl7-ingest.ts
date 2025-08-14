#!/usr/bin/env node

/**
 * HL7 Ingest - Synthetic Data Processing
 * Processes synthetic HL7v2 messages and enqueues normalized events
 */

// Sample synthetic HL7v2 ADT message
const sampleHL7Message = `MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20230813110800||ADT^A01|MSG123456|P|2.5
EVN||202308131108
PID|1||MRN123456^^^HOSPITAL^MR||DOE^JOHN^||19800101|M|||123 MAIN ST^^ANYTOWN^ST^12345||(555)123-4567||||||||||
PV1|1|I|ICU^101^01||||12345^SMITH^JANE^M^^^DR|||||||||||||||||||||||202308131100`;

interface NormalizedEvent {
  id: string;
  type: 'admission' | 'discharge' | 'transfer' | 'update';
  patientId: string;
  facilityId: string;
  timestamp: string;
  data: {
    messageType: string;
    patientMRN: string;
    patientName: {
      family: string;
      given: string;
    };
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

// Simple HL7 parser (stub implementation)
function parseHL7Message(hl7: string): NormalizedEvent {
  const lines = hl7.split('\n');
  const mshSegment = lines[0].split('|');
  const pidSegment = lines.find(line => line.startsWith('PID'))?.split('|') || [];
  const pv1Segment = lines.find(line => line.startsWith('PV1'))?.split('|') || [];
  
  const messageType = mshSegment[8] || 'ADT^A01';
  const patientName = pidSegment[5] ? pidSegment[5].split('^') : ['', ''];
  
  const normalizedEvent: NormalizedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: messageType.includes('A01') ? 'admission' : 'update',
    patientId: pidSegment[3] || 'unknown',
    facilityId: mshSegment[4] || 'FACILITY_001',
    timestamp: new Date().toISOString(),
    data: {
      messageType,
      patientMRN: pidSegment[3] || '',
      patientName: {
        family: patientName[0] || '',
        given: patientName[1] || '',
      },
      patientDOB: pidSegment[7] || '',
      patientGender: pidSegment[8] || '',
      location: pv1Segment[3] || '',
      attendingPhysician: pv1Segment[7] || '',
    },
    metadata: {
      originalHL7: hl7,
      processedAt: new Date().toISOString(),
      source: 'hl7-ingest',
    },
  };
  
  return normalizedEvent;
}

// Queue simulation (in real implementation, this would be Redis/RabbitMQ/etc)
const eventQueue: NormalizedEvent[] = [];

function enqueueEvent(event: NormalizedEvent): void {
  eventQueue.push(event);
  console.log(`[HL7 Ingest] Event queued: ${event.id} (${event.type})`);
  console.log(`[HL7 Ingest] Patient: ${event.data.patientName.given} ${event.data.patientName.family}`);
  console.log(`[HL7 Ingest] Queue length: ${eventQueue.length}`);
}

function processHL7Message(hl7Message: string): void {
  console.log('[HL7 Ingest] Processing HL7 message...');
  
  try {
    // Parse and normalize the HL7 message
    const normalizedEvent = parseHL7Message(hl7Message);
    
    // Idempotent check (stub - in real implementation, check against processed events)
    const isDuplicate = eventQueue.some(event => 
      event.data.patientMRN === normalizedEvent.data.patientMRN &&
      event.data.messageType === normalizedEvent.data.messageType &&
      Math.abs(new Date(event.timestamp).getTime() - new Date(normalizedEvent.timestamp).getTime()) < 60000 // 1 minute window
    );
    
    if (isDuplicate) {
      console.log('[HL7 Ingest] Duplicate message detected, skipping...');
      return;
    }
    
    // Enqueue the normalized event
    enqueueEvent(normalizedEvent);
    
    console.log('[HL7 Ingest] HL7 message processed successfully');
    
  } catch (error) {
    console.error('[HL7 Ingest] Error processing HL7 message:', error);
  }
}

// Main execution
console.log('[HL7 Ingest] Starting HL7 message processing...');
console.log('[HL7 Ingest] Processing synthetic HL7 ADT message\n');

processHL7Message(sampleHL7Message);

// Display queue contents
console.log('\n[HL7 Ingest] Current queue contents:');
eventQueue.forEach((event, index) => {
  console.log(`${index + 1}. ${event.id} - ${event.type} - ${event.data.patientName.given} ${event.data.patientName.family}`);
});

console.log('\n[HL7 Ingest] Processing complete');
