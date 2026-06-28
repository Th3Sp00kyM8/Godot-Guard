import { getIssueExplanation } from "./explain.js";
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

  lines.push("", "Plain-language guide:");
  lines.push(...formatPlainLanguageGuide(result, "text"));
  lines.push("");

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

  lines.push("", "## Plain-Language Guide", "");
  lines.push(...formatPlainLanguageGuide(result, "markdown"));
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

export function formatGithub(result: ScanResult, options: ReporterOptions = {}): string {
  const lines = ["## Godot Guard"];

  if (result.issues.length === 0) {
    lines.push("", "No issues found.");
    return lines.join("\n");
  }

  lines.push("", `Found **${result.issues.length}** issue(s).`);
  lines.push("");
  lines.push(...formatSummaryLines(result).map((line) => `- ${line}`));

  if (options.summaryOnly) {
    return lines.join("\n");
  }

  lines.push("", "### Plain-language guide", "");
  lines.push(...formatPlainLanguageGuide(result, "github"));

  lines.push("", "| Severity | Code | Location | Message |");
  lines.push("| --- | --- | --- | --- |");

  for (const issue of result.issues.slice(0, 20)) {
    const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : result.root;
    lines.push([
      issue.severity,
      codeCell(issue.code),
      codeCell(location),
      escapeTableCell(issue.message)
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  if (result.issues.length > 20) {
    lines.push("", `<sub>${result.issues.length - 20} additional issue(s) omitted. Use \`--format markdown\` or \`--format json\` for the full report.</sub>`);
  }

  return lines.join("\n");
}

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatSarif(result: ScanResult): string {
  const rules = [...new Set(result.issues.map((issue) => issue.code))]
    .sort()
    .map((code) => {
      const explanation = getIssueExplanation(code);
      return {
        id: code,
        name: code,
        shortDescription: {
          text: explanation?.title ?? code
        },
        fullDescription: {
          text: explanation ? `${explanation.meaning} ${explanation.impact}` : code
        },
        help: {
          text: explanation?.fix ?? code
        }
      };
    });

  const sarif = {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: {
        driver: {
          name: "Godot Guard",
          informationUri: "https://github.com/Th3Sp00kyM8/Godot-Guard",
          rules
        }
      },
      results: result.issues.map((issue) => ({
        ruleId: issue.code,
        level: sarifLevel(issue.severity),
        message: {
          text: issue.suggestion ? `${issue.message} Suggestion: ${issue.suggestion}` : issue.message
        },
        locations: [{
          physicalLocation: {
            artifactLocation: {
              uri: issue.file ?? "."
            },
            region: {
              startLine: issue.line ?? 1
            }
          }
        }]
      }))
    }]
  };

  return JSON.stringify(sarif, null, 2);
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

function formatPlainLanguageGuide(result: ScanResult, format: "text" | "markdown" | "github"): string[] {
  const codes = [...new Set(result.issues.map((issue) => issue.code))].sort();
  const lines: string[] = [];

  for (const code of codes) {
    const explanation = getIssueExplanation(code);
    if (!explanation) {
      lines.push(format === "text"
        ? `- ${code}: Review the issue message and location. Risk: this may point to project drift. Fix: inspect the referenced file or config.`
        : `- \`${code}\`: Review the issue message and location. **Risk:** this may point to project drift. **Fix:** inspect the referenced file or config.`);
      continue;
    }

    if (format === "text") {
      lines.push(`- ${code}: ${explanation.meaning} Risk: ${explanation.impact} Fix: ${explanation.fix}`);
    } else {
      lines.push(`- \`${code}\`: ${explanation.meaning} **Risk:** ${explanation.impact} **Fix:** ${explanation.fix}`);
    }
  }

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

function codeCell(value: string): string {
  return `\`${escapeTableCell(value)}\``;
}

function escapeTableCell(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function sarifLevel(severity: string): "error" | "warning" | "note" {
  if (severity === "error") {
    return "error";
  }

  if (severity === "warn") {
    return "warning";
  }

  return "note";
}
