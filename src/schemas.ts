import { Schema } from "effect";

export const LogEntrySchema = Schema.Struct({
  timestamp: Schema.String,
  provider: Schema.String,
  recipient: Schema.String,
  message: Schema.String,
});

export type LogEntry = Schema.Schema.Type<typeof LogEntrySchema>;

export const TelegramConfigSchema = Schema.Struct({
  botToken: Schema.String,
  defaultRecipient: Schema.optional(Schema.String),
});

export type TelegramConfig = Schema.Schema.Type<typeof TelegramConfigSchema>;

export const ProviderConfigSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("telegram"),
    config: TelegramConfigSchema,
  })
);

export type ProviderConfig = Schema.Schema.Type<typeof ProviderConfigSchema>;
