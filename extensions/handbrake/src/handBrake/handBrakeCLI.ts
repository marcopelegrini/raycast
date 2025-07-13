import fs from "fs";
import os from "os";
import { LocalStorage } from "@raycast/api";
import { execPromise } from "../util/exec";
import { parsePresetOutput, PresetGroup } from "./presetParser";

/**
 * Try to obtain the configured CLI path
 */
export async function getHandBrakeCLIPath(): Promise<string | null> {
  const path = await LocalStorage.getItem("HandBrakeCLIPath");
  if (path && typeof path === "string" && path.trim() && fs.existsSync(path)) {
    console.log(`Found Configured HandBrakeCLI at: ${path}`);
    return path;
  }
  return null;
}

/**
 * Check if HandBrake returns a valid version
 */
export async function checkHandBrakeVersion(path: string): Promise<string | null> {
  let err;
  try {
    const { stdout, stderr } = await execPromise(`${path} --version`);
    const versionMatch = stdout.match(/HandBrake ((?:\d+)\.(?:\d+).(?:\d+))/);
    if (versionMatch) {
      return versionMatch[1];
    }
    err = stderr;
  } catch (error) {
    console.error("Error checking version:", error, err);
  }
  return null;
}

export async function getPresets(): Promise<PresetGroup[]>  {
  try {
    const cli = await getHandBrakeCLIPath();
    const { stdout, stderr } = await execPromise(`${cli} --preset-list`);

    // CLI outputs in the stderr
    const output = stdout && stdout.trim().length > 0 ? stdout : stderr;
    return parsePresetOutput(output);
  } catch (error) {
    console.error("Error loading presets:", error);
  }
  return [];
}

/**
 * Search for HandbrakeCLI in common paths
 */
export async function findHandBrakeCLIPath(): Promise<string | null> {
  try {
    // Check common system installation paths directly
    const platform = os.platform();
    const commonPaths = [];

    if (platform === "darwin") {
      // macOS common paths
      commonPaths.push(
        // Homebrew (Intel)
        "/usr/local/bin/HandBrakeCLI",
        // Homebrew (Apple Silicon)
        "/opt/homebrew/bin/HandBrakeCLI",
      );
    } else if (platform === "win32") {
      // Windows common paths
      const programFiles = process.env.ProgramFiles || "C:\\Program Files";
      const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

      commonPaths.push(
        `${programFiles}\\HandBrake\\HandBrakeCLI.exe`,
        `${programFilesX86}\\HandBrake\\HandBrakeCLI.exe`,
      );
    } else {
      // Linux & Unix common paths
      commonPaths.push("/usr/local/bin/HandBrakeCLI");
    }

    // Check if any of the common paths exist and meet version requirements
    for (const path of commonPaths) {
      if (fs.existsSync(path)) {
        console.log(`Found System HandBreakCLI at: ${path}`);
        return path;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding valid HandBrakeCLI:", error);
    return null;
  }
}
