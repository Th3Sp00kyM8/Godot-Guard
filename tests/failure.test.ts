import { describe, expect, it } from "vitest";
import { parseFailOn, shouldFail } from "../src/failure.js";
import type { Issue } from "../src/types.js";

const warnIssue: Issue = {
  code: "example.warn",
  severity: "warn",
  message: "Warning"
};

const errorIssue: Issue = {
  code: "example.error",
  severity: "error",
  message: "Error"
};

describe("failure threshold", () => {
  it("fails only on errors by default behavior", () => {
    expect(shouldFail([warnIssue], "error")).toBe(false);
    expect(shouldFail([errorIssue], "error")).toBe(true);
  });

  it("can fail on warnings", () => {
    expect(shouldFail([warnIssue], "warn")).toBe(true);
    expect(shouldFail([errorIssue], "warn")).toBe(true);
  });

  it("can suppress failure exit codes", () => {
    expect(shouldFail([warnIssue, errorIssue], "none")).toBe(false);
  });

  it("parses supported fail-on modes", () => {
    expect(parseFailOn("error")).toBe("error");
    expect(parseFailOn("warn")).toBe("warn");
    expect(parseFailOn("none")).toBe("none");
    expect(() => parseFailOn("info")).toThrow("--fail-on must be `error`, `warn`, or `none`.");
  });
});
