import { Command, Args } from "@effect/cli";
import { Console, Effect } from "effect";
import { getTelegramConfig } from "../services/provider.js";
import { logNotification } from "../services/log.js";
import { TelegramProvider } from "../providers/telegram.js";

// Args for telegram command - using repeated text args to handle 1 or 2 arguments
const messageArgs = Args.text({ name: "args" }).pipe(
  Args.withDescription("The message to send, or recipient and message"),
  Args.repeated
);

// Telegram send command
export const telegram = Command.make(
  "telegram",
  {
    args: messageArgs,
  },
  (input) =>
    Effect.gen(function* () {
      const args = input.args.slice();
      
      if (args.length === 0) {
        yield* Console.error("❌ Usage: notify telegram [recipient] <message>");
        yield* Console.error("   Missing required argument: message");
        return;
      }
      
      // Get Telegram config
      const configResult = yield* Effect.either(getTelegramConfig);
      
      if (configResult._tag === "Left") {
        const error = configResult.left;
        if (error._tag === "ProviderNotConfiguredError") {
          yield* Console.error("❌ Telegram provider is not configured.");
          yield* Console.error("   Run 'notify setup' to configure it first.");
          return;
        }
        yield* Console.error(`❌ Configuration error: ${error.message}`);
        return;
      }
      
      const config = configResult.right;
      
      // Determine recipient and message based on number of args
      let targetRecipient: string | undefined;
      let message: string;
      
      if (args.length === 1) {
        // Only message provided, use default recipient
        message = args[0];
        targetRecipient = config.defaultRecipient;
      } else {
        // First arg is recipient, rest is message
        targetRecipient = args[0];
        message = args.slice(1).join(" ");
      }
      
      if (!targetRecipient) {
        yield* Console.error("❌ No recipient specified and no default recipient configured.");
        yield* Console.error("   Either provide a recipient or set a default during setup.");
        return;
      }

      yield* Console.log(`📤 Sending message to ${targetRecipient}...`);

      // Send message
      const telegramProvider = yield* TelegramProvider;
      const sendResult = yield* Effect.either(
        telegramProvider.sendMessage(config, targetRecipient, message)
      );
      
      if (sendResult._tag === "Left") {
        yield* Console.error(`❌ Failed to send message: ${sendResult.left.message}`);
        return;
      }

      // Log the notification
      yield* logNotification("telegram", targetRecipient, message);

      yield* Console.log("✅ Message sent successfully!");
    })
);
