import { join } from "path";
import { app } from "electron";

let cachedRngTestsDir = null;

export function rngTestsDir() {
  if (cachedRngTestsDir) {
    return cachedRngTestsDir;
  }

  let resolvedPath;
  if (app.isPackaged) {
    // packaged build – electron-builder puts unpacked files under app.asar.unpacked
    resolvedPath = join(process.resourcesPath, "app.asar.unpacked", "rngTests");
  } else {
    // development mode
    resolvedPath = join(process.cwd(), "rngTests");
  }

  console.log("[RNG_TESTS_DIR]", resolvedPath);
  cachedRngTestsDir = resolvedPath;
  return resolvedPath;
}
