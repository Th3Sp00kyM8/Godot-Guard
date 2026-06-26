#!/usr/bin/env node
import { formatJson, formatText } from "./reporters.js";
import { scan } from "./scan.js";
import type { ScanOptions } from "./types.js";

const VALID_COMMANDS = new Set(["scan", "project", "resources", "scripts"]);

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printHelp();
    return;
  }

  const result = await scan(parsed.options);
  const output = parsed.format === "json" ? formatJson(result) : formatText(result);
  console.log(output);

  if (result.issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

interface ParsedArgs {
  options: ScanOptions;
  format: "text" | "json";
  help: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let command: ScanOptions["command"] = "scan";
  let root = ".";
  let format: "text" | "json" = "text";
  let configPath: string | undefined;
  let help = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--format") {
      const value = args[index + 1];
      if (value !== "text" && value !== "json") {
        throw new Error("--format must be `text` or `json`.");
      }
      format = value;
      index += 1;
      continue;
    }

    if (arg === "--config") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--config requires a path.");
      }
      configPath = value;
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  if (positionals[0] && VALID_COMMANDS.has(positionals[0])) {
    command = positionals[0] as ScanOptions["command"];
    root = positionals[1] ?? ".";
  } else {
    root = positionals[0] ?? ".";
  }

  return {
    options: { root, command, configPath },
    format,
    help
  };
}

function printHelp(): void {
  console.log(`Godot Guard

Usage:
  godot-guard scan [project-path]
  godot-guard project [project-path]
  godot-guard resources [project-path]
  godot-guard scripts [project-path]

Options:
  --format text|json   Output format. Defaults to text.
  --config <path>      Config path relative to the project root.
  -h, --help           Show this help.
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Godot Guard failed: ${message}`);
  process.exitCode = 1;
});
