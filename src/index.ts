/**
 * AI Health Integrations SDK - Teaser Version
 * 
 * This is a preview/teaser version showcasing the core architecture
 * and interfaces for AI-powered health data integrations.
 * 
 * @version 1.0.0
 * @author whomewhat
 * @license MIT
 */

import { HealthDataProvider } from './providers/HealthDataProvider';
import { AIProcessor } from './processors/AIProcessor';
import { SecurityManager } from './security/SecurityManager';

// Main SDK class
export class AIHealthSDK {
  private provider: HealthDataProvider;
  private processor: AIProcessor;
  private security: SecurityManager;

  constructor(config: SDKConfig) {
    this.security = new SecurityManager(config.security);
    this.provider = new HealthDataProvider(config.provider);
    this.processor = new AIProcessor(config.ai);
  }

  /**
   * Initialize the SDK with authentication and security checks
   */
  async initialize(): Promise<void> {
    await this.security.validateConfiguration();
    await this.provider.connect();
    await this.processor.initialize();
  }

  /**
   * Process health data with AI analysis
   */
  async processHealthData(data: HealthData): Promise<ProcessedHealthData> {
    // Security validation
    await this.security.validateHealthData(data);
    
    // Data processing
    const normalizedData = await this.provider.normalizeData(data);
    const insights = await this.processor.generateInsights(normalizedData);
    
    return {
      original: data,
      normalized: normalizedData,
      insights,
      metadata: {
        processedAt: new Date(),
        version: '1.0.0',
        securityLevel: this.security.getSecurityLevel()
      }
    };
  }

  /**
   * Get available AI models for health analysis
   */
  getAvailableModels(): string[] {
    return this.processor.getAvailableModels();
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.provider.disconnect();
    await this.processor.cleanup();
  }
}

// Type definitions
export interface SDKConfig {
  security: SecurityConfig;
  provider: ProviderConfig;
  ai: AIConfig;
}

export interface SecurityConfig {
  encryptionKey: string;
  hipaaCompliance: boolean;
  auditLogging: boolean;
}

export interface ProviderConfig {
  type: 'fhir' | 'hl7' | 'custom';
  endpoint: string;
  authentication: {
    type: 'oauth2' | 'apikey' | 'jwt';
    credentials: Record<string, string>;
  };
}

export interface AIConfig {
  models: string[];
  endpoint: string;
  apiKey: string;
}

export interface HealthData {
  patientId: string;
  dataType: 'vitals' | 'labs' | 'imaging' | 'clinical-notes';
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}

export interface ProcessedHealthData {
  original: HealthData;
  normalized: NormalizedHealthData;
  insights: AIInsights;
  metadata: ProcessingMetadata;
}

export interface NormalizedHealthData {
  standardFormat: string;
  data: Record<string, any>;
  qualityScore: number;
}

export interface AIInsights {
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
  model: string;
}

export interface ProcessingMetadata {
  processedAt: Date;
  version: string;
  securityLevel: string;
}

// Export all classes for individual use
export { HealthDataProvider } from './providers/HealthDataProvider';
export { AIProcessor } from './processors/AIProcessor';
export { SecurityManager } from './security/SecurityManager';

// Default export
export default AIHealthSDK;
