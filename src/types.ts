export type Severity = "error" | "warn" | "info";

export interface Issue {
  code: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface GuardConfig {
  requiredAutoloads?: string[];
  requiredInputActions?: string[];
  gdscript?: {
    requireReturnTypes?: boolean;
    requireTypedVars?: boolean;
  };
  allowedMissingResourcePatterns?: string[];
}

export interface ScanOptions {
  root: string;
  command: "scan" | "project" | "resources" | "scripts";
  configPath?: string;
}

export interface ScanResult {
  root: string;
  issues: Issue[];
}
