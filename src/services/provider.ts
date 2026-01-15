import { Context, Effect, Layer, Schema } from "effect";
import * as Fs from "node:fs";
import { getProviderConfigPath, getProviderDir } from "../utils/paths.js";
import type { TelegramConfig } from "../schemas.js";
import { TelegramConfigSchema } from "../schemas.js";

// Available providers
export const AVAILABLE_PROVIDERS = ["telegram"] as const;
export type ProviderName = (typeof AVAILABLE_PROVIDERS)[number];

// Errors
export class ProviderNotConfiguredError {
  readonly _tag = "ProviderNotConfiguredError";
  constructor(readonly provider: string) {}
}

export class ProviderConfigInvalidError {
  readonly _tag = "ProviderConfigInvalidError";
  constructor(
    readonly provider: string,
    readonly message: string
  ) {}
}

export class ProviderSaveError {
  readonly _tag = "ProviderSaveError";
  constructor(
    readonly provider: string,
    readonly message: string
  ) {}
}

// Provider Service interface
export interface ProviderService {
  readonly getConfigRaw: (
    provider: ProviderName
  ) => Effect.Effect<unknown, ProviderNotConfiguredError>;
  readonly saveConfig: (
    provider: ProviderName,
    config: unknown
  ) => Effect.Effect<void, ProviderSaveError>;
  readonly isConfigured: (provider: ProviderName) => Effect.Effect<boolean>;
  readonly listConfigured: () => Effect.Effect<ProviderName[]>;
}

// Provider Service tag
export const ProviderService = Context.GenericTag<ProviderService>("ProviderService");

// Live implementation
export const ProviderServiceLive = Layer.succeed(
  ProviderService,
  {
    getConfigRaw: (
      provider: ProviderName
    ): Effect.Effect<unknown, ProviderNotConfiguredError> =>
      Effect.try({
        try: () => {
          const configPath = getProviderConfigPath(provider);

          if (!Fs.existsSync(configPath)) {
            throw new ProviderNotConfiguredError(provider);
          }

          const content = Fs.readFileSync(configPath, "utf-8");
          return JSON.parse(content);
        },
        catch: (error) => 
          error instanceof ProviderNotConfiguredError 
            ? error 
            : new ProviderNotConfiguredError(provider)
      }),

    saveConfig: (
      provider: ProviderName,
      config: unknown
    ): Effect.Effect<void, ProviderSaveError> =>
      Effect.try({
        try: () => {
          const providerDir = getProviderDir(provider);
          const configPath = getProviderConfigPath(provider);

          Fs.mkdirSync(providerDir, { recursive: true });
          Fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        },
        catch: (error) =>
          new ProviderSaveError(
            provider,
            `Failed to save config: ${error instanceof Error ? error.message : String(error)}`
          )
      }),

    isConfigured: (provider: ProviderName): Effect.Effect<boolean> =>
      Effect.sync(() => {
        const configPath = getProviderConfigPath(provider);
        return Fs.existsSync(configPath);
      }),

    listConfigured: (): Effect.Effect<ProviderName[]> =>
      Effect.sync(() => {
        return AVAILABLE_PROVIDERS.filter((provider) => {
          const configPath = getProviderConfigPath(provider);
          return Fs.existsSync(configPath);
        });
      }),
  }
);

// Helper to get Telegram config
export const getTelegramConfig: Effect.Effect<
  TelegramConfig,
  ProviderNotConfiguredError | ProviderConfigInvalidError,
  ProviderService
> = Effect.gen(function* () {
  const service = yield* ProviderService;
  const raw = yield* service.getConfigRaw("telegram");
  return yield* Schema.decodeUnknown(TelegramConfigSchema)(raw).pipe(
    Effect.mapError(
      (error) =>
        new ProviderConfigInvalidError(
          "telegram",
          `Invalid configuration: ${error.message}`
        )
    )
  );
});
