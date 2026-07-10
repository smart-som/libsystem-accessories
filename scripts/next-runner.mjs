import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const command = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!command) {
  console.error("Missing Next command. Use: node scripts/next-runner.mjs <dev|build>");
  process.exit(1);
}

const nextBin = require.resolve("next/dist/bin/next");
const wasmDir = path.join(process.cwd(), "node_modules", "@next", "swc-wasm-nodejs");

const args = [nextBin, command];
if (command === "dev" || command === "build") {
  args.push("--webpack");
}
args.push(...extraArgs);

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TEST_WASM: "1",
    NEXT_TEST_WASM_DIR: wasmDir,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
