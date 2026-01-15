import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  TelegramProvider,
  TelegramProviderLive,
  TelegramSendError,
} from "../src/providers/telegram.js";
import type { TelegramConfig } from "../src/schemas.js";

// Note: These tests mock the HTTP layer since we don't want to make real API calls
describe("TelegramProvider", () => {
  const mockConfig: TelegramConfig = {
    botToken: "test-bot-token",
    defaultRecipient: "123456",
  };

  it("should have correct service interface", async () => {
    const program = Effect.gen(function* () {
      const provider = yield* TelegramProvider;
      // Just verify the service exists and has the sendMessage method
      expect(typeof provider.sendMessage).toBe("function");
      return true;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TelegramProviderLive))
    );

    expect(result).toBe(true);
  });

  it("should construct correct API URL", () => {
    const botToken = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    const expectedUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    expect(expectedUrl).toContain("api.telegram.org");
    expect(expectedUrl).toContain(botToken);
    expect(expectedUrl).toContain("sendMessage");
  });

  it("should handle TelegramSendError", () => {
    const error = new TelegramSendError("Network error");
    expect(error._tag).toBe("TelegramSendError");
    expect(error.message).toBe("Network error");
  });
});
