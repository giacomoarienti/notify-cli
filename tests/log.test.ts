import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as Fs from "node:fs";
import { Effect } from "effect";
import { LogService, LogServiceLive, logNotification } from "../src/services/log.js";
import { getDataDir, getLogsPath } from "../src/utils/paths.js";
import type { LogEntry } from "../src/schemas.js";

describe("LogService", () => {
  const testDir = getDataDir();
  const logsPath = getLogsPath();

  const cleanupDir = () => {
    try {
      if (Fs.existsSync(testDir)) {
        Fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  beforeEach(() => {
    cleanupDir();
  });

  afterEach(() => {
    cleanupDir();
  });

  it("should return empty array when no logs exist", async () => {
    const program = Effect.gen(function* () {
      const service = yield* LogService;
      return yield* service.getLogs();
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result).toEqual([]);
  });

  it("should add and retrieve log entries", async () => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider: "telegram",
      recipient: "123456",
      message: "Test message",
    };

    const program = Effect.gen(function* () {
      const service = yield* LogService;
      yield* service.addLog(entry);
      return yield* service.getLogs();
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result.length).toBe(1);
    expect(result[0].provider).toBe("telegram");
    expect(result[0].recipient).toBe("123456");
    expect(result[0].message).toBe("Test message");
  });

  it("should filter logs by provider", async () => {
    const entries: LogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        provider: "telegram",
        recipient: "123456",
        message: "Telegram message",
      },
      {
        timestamp: new Date().toISOString(),
        provider: "slack",
        recipient: "general",
        message: "Slack message",
      },
    ];

    const program = Effect.gen(function* () {
      const service = yield* LogService;
      for (const entry of entries) {
        yield* service.addLog(entry);
      }
      return yield* service.getLogs("telegram");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result.length).toBe(1);
    expect(result[0].provider).toBe("telegram");
  });

  it("should store logs in JSONL format", async () => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider: "telegram",
      recipient: "123456",
      message: "Test message",
    };

    const program = Effect.gen(function* () {
      const service = yield* LogService;
      yield* service.addLog(entry);
    });

    await Effect.runPromise(program.pipe(Effect.provide(LogServiceLive)));

    expect(Fs.existsSync(logsPath)).toBe(true);
    
    const content = Fs.readFileSync(logsPath, "utf-8");
    const lines = content.trim().split("\n");
    
    expect(lines.length).toBe(1);
    
    const parsed = JSON.parse(lines[0]);
    expect(parsed.provider).toBe("telegram");
    expect(parsed.message).toBe("Test message");
  });

  it("should append multiple log entries", async () => {
    const program = Effect.gen(function* () {
      const service = yield* LogService;
      
      yield* service.addLog({
        timestamp: new Date().toISOString(),
        provider: "telegram",
        recipient: "123",
        message: "First message",
      });
      
      yield* service.addLog({
        timestamp: new Date().toISOString(),
        provider: "telegram",
        recipient: "456",
        message: "Second message",
      });
      
      return yield* service.getLogs();
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result.length).toBe(2);
  });

  it("should clear logs", async () => {
    const program = Effect.gen(function* () {
      const service = yield* LogService;
      
      yield* service.addLog({
        timestamp: new Date().toISOString(),
        provider: "telegram",
        recipient: "123",
        message: "Test message",
      });
      
      const beforeClear = yield* service.getLogs();
      yield* service.clearLogs();
      const afterClear = yield* service.getLogs();
      
      return { beforeClear, afterClear };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result.beforeClear.length).toBe(1);
    expect(result.afterClear.length).toBe(0);
  });

  it("should be case-insensitive when filtering by provider", async () => {
    const program = Effect.gen(function* () {
      const service = yield* LogService;
      
      yield* service.addLog({
        timestamp: new Date().toISOString(),
        provider: "Telegram",
        recipient: "123",
        message: "Test",
      });
      
      return yield* service.getLogs("telegram");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    expect(result.length).toBe(1);
  });
});

describe("logNotification helper", () => {
  const testDir = getDataDir();

  const cleanupDir = () => {
    try {
      if (Fs.existsSync(testDir)) {
        Fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  beforeEach(() => {
    cleanupDir();
  });

  afterEach(() => {
    cleanupDir();
  });

  it("should log notification with current timestamp", async () => {
    const beforeTime = new Date();

    const program = Effect.gen(function* () {
      yield* logNotification("telegram", "123456", "Hello world");
      const service = yield* LogService;
      return yield* service.getLogs();
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(LogServiceLive))
    );

    const afterTime = new Date();

    expect(result.length).toBe(1);
    const logTime = new Date(result[0].timestamp);
    expect(logTime >= beforeTime).toBe(true);
    expect(logTime <= afterTime).toBe(true);
  });
});
