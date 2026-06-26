#!/usr/bin/env node
import { createRequire } from "node:module";
import { parseFailOn, shouldFail, type FailOn } from "./failure.js";
import { initConfig } from "./init.js";
import { formatJson, formatMarkdown, formatSarif, formatText } from "./reporters.js";
import { scan } from "./scan.js";
import type { ScanOptions } from "./types.js";

const SCAN_COMMANDS = new Set(["scan", "project", "resources", "scripts"]);
const VALID_COMMANDS = new Set([...SCAN_COMMANDS, "init"]);
const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.version) {
    console.log(packageJson.version);
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

  if (shouldFail(result.issues, parsed.failOn)) {
    process.exitCode = 1;
  }
}

interface ParsedArgs {
  command: "scan" | "project" | "resources" | "scripts" | "init";
  root: string;
  options: ScanOptions;
  format: "text" | "json" | "markdown" | "sarif";
  failOn: FailOn;
  force: boolean;
  help: boolean;
  summaryOnly: boolean;
  version: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  let command: ParsedArgs["command"] = "scan";
  let root = ".";
  let format: ParsedArgs["format"] = "text";
  let failOn: FailOn = "error";
  let configPath: string | undefined;
  let force = false;
  let help = false;
  let summaryOnly = false;
  let version = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      version = true;
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
      if (value !== "text" && value !== "json" && value !== "markdown" && value !== "sarif") {
        throw new Error("--format must be `text`, `json`, `markdown`, or `sarif`.");
      }
      format = value;
      index += 1;
      continue;
    }

    if (arg === "--fail-on") {
      failOn = parseFailOn(args[index + 1]);
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
      failOn,
      force,
      help,
      summaryOnly,
      version
    };
  }

  return {
    command,
    root,
    options: { root, command: command as ScanOptions["command"], configPath },
    format,
    failOn,
    force,
    help,
    summaryOnly,
    version
  };
}

function formatResult(result: Awaited<ReturnType<typeof scan>>, parsed: ParsedArgs): string {
  if (parsed.format === "json") {
    return formatJson(result);
  }

  if (parsed.format === "markdown") {
    return formatMarkdown(result, { summaryOnly: parsed.summaryOnly });
  }

  if (parsed.format === "sarif") {
    return formatSarif(result);
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
  --format text|json|markdown|sarif
                                Output format. Defaults to text.
  --summary                     Show only counts and categories.
  --fail-on error|warn|none     Exit with code 1 on this severity threshold. Defaults to error.
  --config <path>               Config path relative to the project root.
  --force                       Overwrite config when using init.
  -v, --version                 Show the package version.
  -h, --help                    Show this help.
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Godot Guard failed: ${message}`);
  process.exitCode = 1;
});
