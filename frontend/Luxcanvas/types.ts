export type Role = 'user' | 'ai' | 'system';

export interface MessageStats {
  tokens?: number;
  latency?: string;
  model?: string;
}

export interface Message {
  id: number;
  role: Role;
  text: string;
  timestamp: string;
  stats?: MessageStats;
  isThinking?: boolean;
}

export interface DocState {
  title: string;
  content: string;
  lastUpdated: string;
}

export interface StreamUpdate {
  text?: string;
  functionCall?: {
    name: string;
    args: any;
  };
}

// =============================================================================
// PATCH SYSTEM TYPES - Smart Diff & Merge for Antigravity Strategy
// =============================================================================

export type PatchOperation = 'REPLACE' | 'INSERT_AFTER' | 'INSERT_BEFORE' | 'APPEND';

export interface Patch {
  section_id: string;
  operation: PatchOperation;
  before_anchor?: string;
  new_content: string;
}

export interface PatchResult {
  success: boolean;
  content: string;
  error?: string;
  patchId: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  startLine: number;
  endLine: number;
  content: string;
  children: DocumentSection[];
}

export interface DocumentTree {
  sections: DocumentSection[];
  totalLines: number;
  hash: string;
}

export interface PatchResponse {
  patches: Patch[];
  global_analysis: string;
  affected_dependencies: string[];
}

export interface DocStateExtended extends DocState {
  version: number;
  changelog: Array<{
    patches: string[];
    analysis: string;
    timestamp: string;
  }>;
}
