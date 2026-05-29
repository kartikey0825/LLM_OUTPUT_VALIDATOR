export type SchemaDefinition = {
  id: string;
  name: string;
  description?: string;
  schemaJson: Record<string, unknown>;
  difficulty: number;
  createdAt: string;
};

export type Attempt = {
  id: string;
  attemptNumber: number;
  rawResponse: string;
  parsedJson?: unknown;
  validationError?: string;
  valid: boolean;
  latencyMs: number;
};

export type Metrics = {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  firstAttemptPassRate: number;
  correctionRate: number;
  averageAttempts: number;
  averageLatencyMs: number;
  strategyPerformance: Array<{
    strategy: string;
    totalCalls: number;
    successRate: number;
    firstAttemptPassRate: number;
    averageAttempts: number;
  }>;
  promptReliability: Array<{
    schemaName: string;
    difficulty: number;
    totalCalls: number;
    reliabilityScore: number;
    firstAttemptPassRate: number;
  }>;
};
