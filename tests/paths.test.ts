import { describe, it, expect } from "vitest";
import {
  getDataDir,
  getProvidersDir,
  getProviderDir,
  getProviderConfigPath,
  getLogsPath,
} from "../src/utils/paths.js";
import * as Os from "node:os";
import * as Path from "node:path";

describe("Path utilities", () => {
  const expectedBaseDir = Path.join(Os.homedir(), ".notify-cli");

  it("should return data directory in home folder", () => {
    const dataDir = getDataDir();
    expect(dataDir).toBe(expectedBaseDir);
  });

  it("should return providers directory under data dir", () => {
    const providersDir = getProvidersDir();
    expect(providersDir).toBe(Path.join(expectedBaseDir, "providers"));
  });

  it("should return specific provider directory", () => {
    const telegramDir = getProviderDir("telegram");
    expect(telegramDir).toBe(
      Path.join(expectedBaseDir, "providers", "telegram")
    );
  });

  it("should return provider config path", () => {
    const configPath = getProviderConfigPath("telegram");
    expect(configPath).toBe(
      Path.join(expectedBaseDir, "providers", "telegram", "secret.json")
    );
  });

  it("should return logs path", () => {
    const logsPath = getLogsPath();
    expect(logsPath).toBe(Path.join(expectedBaseDir, "logs.jsonl"));
  });
});
