import { Command, Args } from "@effect/cli";
import { Console, Effect, Option } from "effect";
import { LogService } from "../services/log.js";

// Optional provider argument
const providerArg = Args.text({ name: "provider" }).pipe(
  Args.withDescription("Filter logs by provider"),
  Args.optional
);

// Log command
export const log = Command.make(
  "log",
  {
    args: providerArg,
  },
  (provider) =>
    Effect.gen(function* () {
      const logService = yield* LogService;
      
      // provider is wrapped in { args: Option<string> }
      const providerValue = Option.getOrUndefined(provider.args);
      const logsResult = yield* Effect.either(logService.getLogs(providerValue));
      
      if (logsResult._tag === "Left") {
        yield* Console.error(`❌ Failed to read logs: ${logsResult.left.message}`);
        return;
      }
      
      const logs = logsResult.right;

      if (logs.length === 0) {
        if (providerValue) {
          yield* Console.log(`📋 No notifications found for provider: ${providerValue}`);
        } else {
          yield* Console.log("📋 No notifications logged yet.");
        }
        return;
      }

      yield* Console.log(
        providerValue
          ? `📋 Notification history for ${providerValue}:\n`
          : "📋 Notification history:\n"
      );

      for (const entry of logs) {
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleString();
        
        yield* Console.log(`[${formattedDate}] [${entry.provider}]`);
        yield* Console.log(`  To: ${entry.recipient}`);
        yield* Console.log(`  Message: ${entry.message}`);
        yield* Console.log("");
      }

      yield* Console.log(`Total: ${logs.length} notification(s)`);
    })
);
