import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const vite = join(dirname(require.resolve("vite/package.json")), "bin/vite.js");
const child = spawn(process.execPath, [vite, "--port", "5174", "--strictPort", "--host", "127.0.0.1"], {
  cwd: root + "/apps/web", stdio: "inherit", env: { ...process.env, VITE_CONNECTED_MODE: "true" },
});
child.on("exit", code => process.exit(code ?? 1));
