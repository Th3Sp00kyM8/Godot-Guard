#!/usr/bin/env node
import { initConfig } from "./init.js";
import { formatJson, formatMarkdown, formatText } from "./reporters.js";
import { scan } from "./scan.js";
import type { ScanOptions } from "./types.js";

const SCAN_COMMANDS = new Set(["scan", "project", "resources", "scripts"]);
const VALID_COMMANDS = new Set([...SCAN_COMMANDS, "init"]);

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.command === "init") {
    const result = await initConfig(parsed.root, parsed.force);
    if (result.created) {
      console.log(`Godot Guard: created ${result.configPath}`);
    } else {
      console.log(`Godot Guard: config already exists at ${result.configPath}`);
      console.log("Use --force to overwrite it.");
    }
    return;
  }

  const result = await scan(parsed.options);
  const output = formatResult(result, parsed);
  console.log(output);

  if (result.issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

interface ParsedArgs {
  command: "scan" | "project" | "resources" | "scripts" | "init";
  root: string;
  options: ScanOptions;
  format: "text" | "json" | "markdown";
  force: boolean;
  help: boolean;
  summaryOnly: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let command: ParsedArgs["command"] = "scan";
  let root = ".";
  let format: ParsedArgs["format"] = "text";
  let configPath: string | undefined;
  let force = false;
  let help = false;
  let summaryOnly = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--summary") {
      summaryOnly = true;
      continue;
    }

    if (arg === "--format") {
      const value = args[index + 1];
      if (value !== "text" && value !== "json" && value !== "markdown") {
        throw new Error("--format must be `text`, `json`, or `markdown`.");
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
    command = positionals[0] as ParsedArgs["command"];
    root = positionals[1] ?? ".";
  } else {
    root = positionals[0] ?? ".";
  }

  if (command === "init") {
    return {
      command,
      root,
      options: { root, command: "scan", configPath },
      format,
      force,
      help,
      summaryOnly
    };
  }

  return {
    command,
    root,
    options: { root, command: command as ScanOptions["command"], configPath },
    format,
    force,
    help,
    summaryOnly
  };
}

function formatResult(result: Awaited<ReturnType<typeof scan>>, parsed: ParsedArgs): string {
  if (parsed.format === "json") {
    return formatJson(result);
  }

  if (parsed.format === "markdown") {
    return formatMarkdown(result, { summaryOnly: parsed.summaryOnly });
  }

  return formatText(result, { summaryOnly: parsed.summaryOnly });
}

function printHelp(): void {
  console.log(`Godot Guard

Usage:
  godot-guard init [project-path]
  godot-guard scan [project-path]
  godot-guard project [project-path]
  godot-guard resources [project-path]
  godot-guard scripts [project-path]

Options:
  --format text|json|markdown   Output format. Defaults to text.
  --summary                     Show only counts and categories.
  --config <path>               Config path relative to the project root.
  --force                       Overwrite config when using init.
  -h, --help                    Show this help.
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Godot Guard failed: ${message}`);
  process.exitCode = 1;
});
