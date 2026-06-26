import type { ScanResult } from "./types.js";

export interface ReporterOptions {
  summaryOnly?: boolean;
}

export function formatText(result: ScanResult, options: ReporterOptions = {}): string {
  if (result.issues.length === 0) {
    return "Godot Guard: no issues found.";
  }

  const lines = [`Godot Guard: ${result.issues.length} issue(s) found.`];
  lines.push(...formatSummaryLines(result));

  if (options.summaryOnly) {
    return lines.join("\n");
  }

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

export function formatMarkdown(result: ScanResult, options: ReporterOptions = {}): string {
  const lines = ["# Godot Guard Report", ""];

  if (result.issues.length === 0) {
    lines.push("No issues found.");
    return lines.join("\n");
  }

  lines.push(`Found ${result.issues.length} issue(s).`, "");
  lines.push("## Summary", "");
  lines.push(...formatSummaryLines(result).map((line) => `- ${line}`));

  if (options.summaryOnly) {
    return lines.join("\n");
  }

  lines.push("", "## Issues", "");

  for (const issue of result.issues) {
    const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : result.root;
    lines.push(`### ${issue.code}`);
    lines.push("");
    lines.push(`- Severity: ${issue.severity}`);
    lines.push(`- Location: \`${location}\``);
    lines.push(`- Message: ${issue.message}`);

    if (issue.suggestion) {
      lines.push(`- Suggestion: ${issue.suggestion}`);
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

function formatSummaryLines(result: ScanResult): string[] {
  const severityCounts = countBy(result.issues.map((issue) => issue.severity));
  const codeCounts = countBy(result.issues.map((issue) => issue.code));

  const lines = [
    `Severity: ${formatCounts(severityCounts)}`,
    `Codes: ${formatCounts(codeCounts)}`
  ];

  return lines;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}
