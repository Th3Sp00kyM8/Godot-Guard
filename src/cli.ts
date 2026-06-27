#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { DEFAULT_BASELINE_FILE, writeBaseline } from "./baseline.js";
import { formatExplainOutput, getIssueExplanation } from "./explain.js";
import { parseFailOn, shouldFail, type FailOn } from "./failure.js";
import { initCiWorkflow } from "./initCi.js";
import { initConfig, type InitProfile } from "./init.js";
import { formatGithub, formatJson, formatMarkdown, formatSarif, formatText } from "./reporters.js";
import { scan } from "./scan.js";
import type { ScanOptions } from "./types.js";

const SCAN_COMMANDS = new Set(["scan", "project", "resources", "scripts"]);
const VALID_COMMANDS = new Set([...SCAN_COMMANDS, "init", "init-ci", "baseline", "explain"]);
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
    const result = await initConfig(parsed.root, parsed.force, parsed.profile);
    if (result.created) {
      console.log(`Godot Guard: created ${result.configPath}`);
    } else {
      console.log(`Godot Guard: config already exists at ${result.configPath}`);
      console.log("Use --force to overwrite it.");
    }
    return;
  }

  if (parsed.command === "init-ci") {
    const result = await initCiWorkflow(parsed.root, parsed.force, { prComment: parsed.prComment, sarif: parsed.sarif });
    if (result.created) {
      console.log(`Godot Guard: created ${result.workflowPath}`);
      if (result.prComment) {
        console.log("Godot Guard: workflow will post pull request comments");
      }
      if (result.sarif) {
        console.log("Godot Guard: workflow will upload SARIF to GitHub code scanning");
      }
      if (result.usedBaseline) {
        console.log(`Godot Guard: workflow will use ${DEFAULT_BASELINE_FILE}`);
      }
    } else {
      console.log(`Godot Guard: workflow already exists at ${result.workflowPath}`);
      console.log("Use --force to overwrite it.");
    }
    return;
  }

  if (parsed.command === "baseline") {
    const result = await scan({
      root: parsed.root,
      command: "scan",
      configPath: parsed.options.configPath
    });
    const baseline = await writeBaseline(parsed.root, result.issues, parsed.baselinePath ?? DEFAULT_BASELINE_FILE);
    console.log(`Godot Guard: wrote ${baseline.issueCount} baseline issue(s) to ${baseline.baselinePath}`);
    return;
  }

  if (parsed.command === "explain") {
    console.log(formatExplainOutput(parsed.explainCode));
    if (parsed.explainCode && !getIssueExplanation(parsed.explainCode)) {
      process.exitCode = 1;
    }
    return;
  }

  const result = await scan(parsed.options);
  const output = formatResult(result, parsed);

  if (parsed.outputPath) {
    await writeOutput(parsed.outputPath, output);
  } else {
    console.log(output);
  }

  if (shouldFail(result.issues, parsed.failOn)) {
    process.exitCode = 1;
  }
}

interface ParsedArgs {
  command: "scan" | "project" | "resources" | "scripts" | "init" | "init-ci" | "baseline" | "explain";
  root: string;
  options: ScanOptions;
  format: "text" | "json" | "markdown" | "github" | "sarif";
  failOn: FailOn;
  outputPath?: string;
  baselinePath?: string;
  explainCode?: string;
  prComment: boolean;
  sarif: boolean;
  profile: InitProfile;
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
  let outputPath: string | undefined;
  let baselinePath: string | undefined;
  let profile: InitProfile = "default";
  let configPath: string | undefined;
  let force = false;
  let prComment = false;
  let sarif = false;
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

    if (arg === "--pr-comment") {
      prComment = true;
      continue;
    }

    if (arg === "--sarif") {
      sarif = true;
      continue;
    }

    if (arg === "--format") {
      const value = args[index + 1];
      if (value !== "text" && value !== "json" && value !== "markdown" && value !== "github" && value !== "sarif") {
        throw new Error("--format must be `text`, `json`, `markdown`, `github`, or `sarif`.");
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

    if (arg === "--output") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--output requires a path.");
      }
      outputPath = value;
      index += 1;
      continue;
    }

    if (arg === "--baseline") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--baseline requires a path.");
      }
      baselinePath = value;
      index += 1;
      continue;
    }

    if (arg === "--profile") {
      const value = args[index + 1];
      if (value !== "default" && value !== "mature-project") {
        throw new Error("--profile must be `default` or `mature-project`.");
      }
      profile = value;
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  if (positionals[0] && VALID_COMMANDS.has(positionals[0])) {
    command = positionals[0] as ParsedArgs["command"];
    root = command === "explain" ? "." : positionals[1] ?? ".";
  } else {
    root = positionals[0] ?? ".";
  }

  if (command === "init-ci" && prComment && sarif) {
    throw new Error("Use either --pr-comment or --sarif with init-ci, not both.");
  }

  if (command === "init" || command === "init-ci" || command === "baseline" || command === "explain") {
    return {
      command,
      root,
      options: { root, command: "scan", configPath },
      format,
      failOn,
      outputPath,
      baselinePath,
      explainCode: command === "explain" ? positionals[1] : undefined,
      prComment,
      sarif,
      profile,
      force,
      help,
      summaryOnly,
      version
    };
  }

  return {
    command,
    root,
    options: { root, command: command as ScanOptions["command"], configPath, baselinePath },
    format,
    failOn,
    outputPath,
    baselinePath,
    explainCode: undefined,
    prComment,
    sarif,
    profile,
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

  if (parsed.format === "github") {
    return formatGithub(result, { summaryOnly: parsed.summaryOnly });
  }

  if (parsed.format === "sarif") {
    return formatSarif(result);
  }

  return formatText(result, { summaryOnly: parsed.summaryOnly });
}

async function writeOutput(outputPath: string, output: string): Promise<void> {
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${output}\n`, "utf8");
}

function printHelp(): void {
  console.log(`Godot Guard

Usage:
  godot-guard init [project-path]
  godot-guard init-ci [project-path]
  godot-guard baseline [project-path]
  godot-guard explain [issue-code]
  godot-guard scan [project-path]
  godot-guard project [project-path]
  godot-guard resources [project-path]
  godot-guard scripts [project-path]

Options:
  --format text|json|markdown|github|sarif
                                Output format. Defaults to text.
  --summary                     Show only counts and categories.
  --fail-on error|warn|none     Exit with code 1 on this severity threshold. Defaults to error.
  --output <path>               Write report output to a file instead of stdout.
  --baseline <path>             Write or apply a baseline file. Defaults to ${DEFAULT_BASELINE_FILE} for baseline.
  --pr-comment                  Generate a pull request comment workflow when using init-ci.
  --sarif                       Generate a GitHub code scanning workflow when using init-ci.
  --profile default|mature-project
                                Config profile for init. Defaults to default.
  --config <path>               Config path relative to the project root.
  --force                       Overwrite config or workflow when using init commands.
  -v, --version                 Show the package version.
  -h, --help                    Show this help.
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Godot Guard failed: ${message}`);
  process.exitCode = 1;
});
