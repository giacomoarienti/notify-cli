import * as Path from "node:path";
import * as Os from "node:os";

// Get the base directory for storing CLI data
export const getDataDir = (): string => {
  // Use a directory in user's home for storing provider configs and logs
  const homeDir = Os.homedir();
  return Path.join(homeDir, ".notify-cli");
};

export const getProvidersDir = (): string => {
  return Path.join(getDataDir(), "providers");
};

export const getProviderDir = (providerName: string): string => {
  return Path.join(getProvidersDir(), providerName);
};

export const getProviderConfigPath = (providerName: string): string => {
  return Path.join(getProviderDir(providerName), "secret.json");
};

export const getLogsPath = (): string => {
  return Path.join(getDataDir(), "logs.jsonl");
};
