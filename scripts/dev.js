const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const nodeCommand = process.execPath;

function startProcess(name, command, args, cwd, options = {}) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: options.shell ?? false,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason =
      signal ? `${name} stopped from signal ${signal}` : `${name} exited with code ${code}`;
    console.error(reason);
    shutdown(code ?? 1);
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    console.error(`Failed to start ${name}:`, error);
    shutdown(1);
  });

  return child;
}

function startFrontend() {
  if (isWindows) {
    return startProcess(
      "frontend",
      "cmd.exe",
      ["/d", "/s", "/c", "npm run dev"],
      path.join(rootDir, "frontend"),
      { shell: false }
    );
  }

  return startProcess("frontend", "npm", ["run", "dev"], path.join(rootDir, "frontend"));
}

function startBackend() {
  return startProcess(
    "backend",
    nodeCommand,
    ["server.js"],
    path.join(rootDir, "backend")
  );
}

const children = [
  startFrontend(),
  startBackend(),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
