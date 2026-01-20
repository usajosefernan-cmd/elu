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
  parts?: any[];
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