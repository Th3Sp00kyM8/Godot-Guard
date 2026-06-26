import type { ScanResult } from "./types.js";

export function formatText(result: ScanResult): string {
  if (result.issues.length === 0) {
    return "Godot Guard: no issues found.";
  }

  const lines = [`Godot Guard: ${result.issues.length} issue(s) found.`];

  for (const issue of result.issues) {
    const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : result.root;
    lines.push(`[${issue.severity}] ${issue.code} ${location}`);
    lines.push(`  ${issue.message}`);

    if (issue.suggestion) {
      lines.push(`  Suggestion: ${issue.suggestion}`);
    }
  }

  return lines.join("\n");
}

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}
