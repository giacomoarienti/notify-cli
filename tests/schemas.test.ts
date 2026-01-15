import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  LogEntrySchema,
  TelegramConfigSchema,
} from "../src/schemas.js";

describe("LogEntrySchema", () => {
  it("should validate a valid log entry", () => {
    const entry = {
      timestamp: "2024-01-15T10:30:00.000Z",
      provider: "telegram",
      recipient: "123456",
      message: "Test message",
    };

    const result = Schema.decodeUnknownSync(LogEntrySchema)(entry);
    expect(result).toEqual(entry);
  });

  it("should fail for missing timestamp", () => {
    const entry = {
      provider: "telegram",
      recipient: "123456",
      message: "Test message",
    };

    expect(() => Schema.decodeUnknownSync(LogEntrySchema)(entry)).toThrow();
  });

  it("should fail for missing provider", () => {
    const entry = {
      timestamp: "2024-01-15T10:30:00.000Z",
      recipient: "123456",
      message: "Test message",
    };

    expect(() => Schema.decodeUnknownSync(LogEntrySchema)(entry)).toThrow();
  });
});

describe("TelegramConfigSchema", () => {
  it("should validate config with botToken only", () => {
    const config = {
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    };

    const result = Schema.decodeUnknownSync(TelegramConfigSchema)(config);
    expect(result.botToken).toBe(config.botToken);
    expect(result.defaultRecipient).toBeUndefined();
  });

  it("should validate config with botToken and defaultRecipient", () => {
    const config = {
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      defaultRecipient: "987654321",
    };

    const result = Schema.decodeUnknownSync(TelegramConfigSchema)(config);
    expect(result.botToken).toBe(config.botToken);
    expect(result.defaultRecipient).toBe(config.defaultRecipient);
  });

  it("should fail for missing botToken", () => {
    const config = {
      defaultRecipient: "987654321",
    };

    expect(() => Schema.decodeUnknownSync(TelegramConfigSchema)(config)).toThrow();
  });

  it("should fail for non-string botToken", () => {
    const config = {
      botToken: 12345,
    };

    expect(() => Schema.decodeUnknownSync(TelegramConfigSchema)(config)).toThrow();
  });
});
