import { Context, Effect, Layer } from "effect";
import * as Fs from "node:fs";
import { getLogsPath, getDataDir } from "../utils/paths.js";
import type { LogEntry } from "../schemas.js";

// Log Service interface
export interface LogService {
  readonly addLog: (entry: LogEntry) => Effect.Effect<void, LogWriteError>;
  readonly getLogs: (provider?: string) => Effect.Effect<LogEntry[], LogReadError>;
  readonly clearLogs: () => Effect.Effect<void, LogWriteError>;
}

// Errors
export class LogWriteError {
  readonly _tag = "LogWriteError";
  constructor(readonly message: string) {}
}

export class LogReadError {
  readonly _tag = "LogReadError";
  constructor(readonly message: string) {}
}

// Log Service tag
export const LogService = Context.GenericTag<LogService>("LogService");

// Live implementation
export const LogServiceLive = Layer.succeed(
  LogService,
  {
    addLog: (entry: LogEntry): Effect.Effect<void, LogWriteError> =>
      Effect.try({
        try: () => {
          const logsPath = getLogsPath();
          const dataDir = getDataDir();

          // Ensure directory exists
          Fs.mkdirSync(dataDir, { recursive: true });
          
          // Append log entry as JSONL
          const line = JSON.stringify(entry) + "\n";
          Fs.appendFileSync(logsPath, line);
        },
        catch: (error) => 
          new LogWriteError(
            `Failed to write log: ${error instanceof Error ? error.message : String(error)}`
          )
      }),

    getLogs: (provider?: string): Effect.Effect<LogEntry[], LogReadError> =>
      Effect.try({
        try: () => {
          const logsPath = getLogsPath();

          if (!Fs.existsSync(logsPath)) {
            return [];
          }

          const content = Fs.readFileSync(logsPath, "utf-8");
          const lines = content.trim().split("\n").filter(Boolean);
          
          const entries: LogEntry[] = lines.map((line) => {
            return JSON.parse(line) as LogEntry;
          });

          // Filter by provider if specified
          if (provider) {
            return entries.filter(
              (entry) => entry.provider.toLowerCase() === provider.toLowerCase()
            );
          }

          return entries;
        },
        catch: (error) =>
          new LogReadError(
            `Failed to read logs: ${error instanceof Error ? error.message : String(error)}`
          )
      }),

    clearLogs: (): Effect.Effect<void, LogWriteError> =>
      Effect.try({
        try: () => {
          const logsPath = getLogsPath();

          if (Fs.existsSync(logsPath)) {
            Fs.unlinkSync(logsPath);
          }
        },
        catch: (error) =>
          new LogWriteError(
            `Failed to clear logs: ${error instanceof Error ? error.message : String(error)}`
          )
      }),
  }
);

// Helper to log a notification
export const logNotification = (
  provider: string,
  recipient: string,
  message: string
) =>
  Effect.gen(function* () {
    const service = yield* LogService;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider,
      recipient,
      message,
    };
    return yield* service.addLog(entry);
  });
