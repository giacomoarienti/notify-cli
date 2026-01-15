import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as Fs from "node:fs";
import * as Path from "node:path";
import * as Os from "node:os";
import { Effect, Layer } from "effect";
import {
  ProviderService,
  ProviderServiceLive,
  ProviderNotConfiguredError,
  getTelegramConfig,
} from "../src/services/provider.js";
import { getDataDir, getProviderConfigPath } from "../src/utils/paths.js";

describe("ProviderService", () => {
  const testDir = getDataDir();
  const telegramConfigPath = getProviderConfigPath("telegram");

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

  it("should return ProviderNotConfiguredError when provider is not configured", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      return yield* Effect.either(service.getConfigRaw("telegram"));
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ProviderNotConfiguredError");
    }
  });

  it("should save and retrieve provider config", async () => {
    const testConfig = {
      botToken: "test-token-123",
      defaultRecipient: "12345",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      yield* service.saveConfig("telegram", testConfig);
      return yield* service.getConfigRaw("telegram");
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result).toEqual(testConfig);
  });

  it("should check if provider is configured", async () => {
    const testConfig = {
      botToken: "test-token-123",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      const beforeSave = yield* service.isConfigured("telegram");
      yield* service.saveConfig("telegram", testConfig);
      const afterSave = yield* service.isConfigured("telegram");
      return { beforeSave, afterSave };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result.beforeSave).toBe(false);
    expect(result.afterSave).toBe(true);
  });

  it("should list configured providers", async () => {
    const testConfig = {
      botToken: "test-token-123",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      const beforeSave = yield* service.listConfigured();
      yield* service.saveConfig("telegram", testConfig);
      const afterSave = yield* service.listConfigured();
      return { beforeSave, afterSave };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result.beforeSave).toEqual([]);
    expect(result.afterSave).toContain("telegram");
  });

  it("should store config file in correct location", async () => {
    const testConfig = {
      botToken: "test-token-123",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      yield* service.saveConfig("telegram", testConfig);
    });

    await Effect.runPromise(program.pipe(Effect.provide(ProviderServiceLive)));

    expect(Fs.existsSync(telegramConfigPath)).toBe(true);
    const content = JSON.parse(Fs.readFileSync(telegramConfigPath, "utf-8"));
    expect(content.botToken).toBe("test-token-123");
  });
});

describe("getTelegramConfig", () => {
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

  it("should validate Telegram config schema", async () => {
    const testConfig = {
      botToken: "valid-token",
      defaultRecipient: "123456",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      yield* service.saveConfig("telegram", testConfig);
      return yield* getTelegramConfig;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result.botToken).toBe("valid-token");
    expect(result.defaultRecipient).toBe("123456");
  });

  it("should handle optional defaultRecipient", async () => {
    const testConfig = {
      botToken: "valid-token",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      yield* service.saveConfig("telegram", testConfig);
      return yield* getTelegramConfig;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result.botToken).toBe("valid-token");
    expect(result.defaultRecipient).toBeUndefined();
  });

  it("should fail with ProviderConfigInvalidError for invalid config", async () => {
    const invalidConfig = {
      // Missing required botToken
      defaultRecipient: "123456",
    };

    const program = Effect.gen(function* () {
      const service = yield* ProviderService;
      yield* service.saveConfig("telegram", invalidConfig);
      return yield* Effect.either(getTelegramConfig);
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ProviderServiceLive))
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ProviderConfigInvalidError");
    }
  });
});
