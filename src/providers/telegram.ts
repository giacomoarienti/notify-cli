import { Context, Effect, Layer } from "effect";
import * as https from "node:https";
import { TelegramConfig } from "../schemas.js";

// Telegram Provider interface
export interface TelegramProvider {
  readonly sendMessage: (
    config: TelegramConfig,
    recipient: string,
    message: string
  ) => Effect.Effect<void, TelegramSendError>;
  readonly testConnection: (
    botToken: string
  ) => Effect.Effect<void, TelegramSendError>;
}

// Errors
export class TelegramSendError {
  readonly _tag = "TelegramSendError";
  constructor(readonly message: string) {}
}

export class TelegramNoDefaultRecipientError {
  readonly _tag = "TelegramNoDefaultRecipientError";
  constructor() {}
}

// Telegram Provider tag
export const TelegramProvider = Context.GenericTag<TelegramProvider>("TelegramProvider");

// Live implementation using Telegram Bot API
export const TelegramProviderLive = Layer.succeed(
  TelegramProvider,
  {
    sendMessage: (
      config: TelegramConfig,
      recipient: string,
      message: string
    ): Effect.Effect<void, TelegramSendError> =>
      Effect.async<void, TelegramSendError>((resume) => {
        const { botToken } = config;
        
        // Use Telegram Bot API: https://core.telegram.org/bots/api#sendmessage
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const data = JSON.stringify({
          chat_id: recipient,
          text: message,
        });

        const urlObj = new URL(url);
        
        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              const response = JSON.parse(responseData);
              if (response.ok) {
                resume(Effect.succeed(void 0));
              } else {
                resume(
                  Effect.fail(
                    new TelegramSendError(
                      response.description || "Unknown Telegram API error"
                    )
                  )
                );
              }
            } catch {
              resume(
                Effect.fail(new TelegramSendError(`Invalid response: ${responseData}`))
              );
            }
          });
        });

        req.on("error", (error) => {
          resume(Effect.fail(new TelegramSendError(error.message)));
        });

        req.write(data);
        req.end();
      }),

    testConnection: (botToken: string): Effect.Effect<void, TelegramSendError> =>
      Effect.async<void, TelegramSendError>((resume) => {
        // Use Telegram Bot API getMe endpoint to test connection
        const url = `https://api.telegram.org/bot${botToken.trim()}/getMe`;
        
        const urlObj = new URL(url);
        
        const options = {
          hostname: urlObj.hostname,
          port: 443,
          path: urlObj.pathname,
          method: "GET",
        };

        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              const response = JSON.parse(responseData);
              if (response.ok) {
                resume(Effect.succeed(void 0));
              } else {
                resume(
                  Effect.fail(
                    new TelegramSendError(
                      response.description || "Authentication failed"
                    )
                  )
                );
              }
            } catch {
              resume(
                Effect.fail(new TelegramSendError("Invalid response from Telegram API"))
              );
            }
          });
        });

        req.on("error", (error) => {
          resume(Effect.fail(new TelegramSendError(error.message)));
        });

        req.end();
      }),
  }
);
