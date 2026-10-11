import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveSpawnArgv } from "./run.ts";

const shim = [
  "@ECHO off",
  'IF EXIST "%dp0%\\node.exe" (SET "_prog=%dp0%\\node.exe") ELSE (SET "_prog=node")',
  '"%_prog%"  "%dp0%\\node_modules\\@openai\\codex\\bin\\codex.js" %*',
].join("\r\n");

test.skipIf(process.platform !== "win32")(
  "npm .cmd shim resolves to node plus script so quoted args survive",
  () => {
    const dir = mkdtempSync(join(tmpdir(), "shim-"));
    const cmd = join(dir, "codex.cmd");
    writeFileSync(cmd, shim);
    const arg = 'model_reasoning_effort="max"';
    const argv = resolveSpawnArgv(cmd, ["exec", "--config", arg]);
    expect(argv[1]).toBe(join(dir, "node_modules", "@openai", "codex", "bin", "codex.js"));
    expect(argv.slice(2)).toEqual(["exec", "--config", arg]);
  }
);

test("non-shim executables pass through unchanged", () => {
  expect(resolveSpawnArgv("/usr/bin/grok", ["a"])).toEqual(["/usr/bin/grok", "a"]);
});
