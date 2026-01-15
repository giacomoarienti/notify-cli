import { Command, Options, Args } from "@effect/cli";
import { Console, Effect } from "effect";
import * as readline from "node:readline";
import {
  ProviderService,
  AVAILABLE_PROVIDERS,
  ProviderName,
} from "../services/provider.js";
import { TelegramConfig } from "../schemas.js";
import { TelegramProvider, TelegramProviderLive } from "../providers/telegram.js";

// Helper to create readline interface
const createReadline = () =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

// Helper to ask a question
const question = (rl: readline.Interface, prompt: string): Promise<string> =>
  new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

// Helper to ask a secure question (for passwords/secrets)
const secureQuestion = (prompt: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = createReadline();
    
    // Disable echo for secure input
    process.stdout.write(prompt);
    
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    
    let input = "";
    
    const onData = (char: Buffer) => {
      const c = char.toString();
      
      if (c === "\n" || c === "\r") {
        stdin.removeListener("data", onData);
        if (stdin.isTTY && wasRaw !== undefined) {
          stdin.setRawMode(wasRaw);
        }
        console.log(); // New line after input
        rl.close();
        resolve(input);
      } else if (c === "\x7f" || c === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (c === "\x03") {
        // Ctrl+C
        process.exit(0);
      } else {
        input += c;
        process.stdout.write("*");
      }
    };
    
    stdin.on("data", onData);
  });

// Helper to select from a list
const selectFromList = (
  items: readonly string[],
  prompt: string
): Effect.Effect<string, never> =>
  Effect.async<string>((resume) => {
    const rl = createReadline();
    
    console.log(prompt);
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    
    const askForSelection = () => {
      rl.question("\nEnter number or use arrow keys: ", (answer) => {
        const num = parseInt(answer, 10);
        if (num >= 1 && num <= items.length) {
          rl.close();
          resume(Effect.succeed(items[num - 1]));
        } else {
          console.log("Invalid selection, please try again.");
          askForSelection();
        }
      });
    };
    
    askForSelection();
  });

// Setup Telegram provider
const setupTelegram = Effect.gen(function* () {
  yield* Console.log("\n📱 Setting up Telegram provider\n");

  yield* Console.log("Please enter your Telegram Bot Token.");
  yield* Console.log("(You can get one from @BotFather on Telegram)\n");

  const botToken = yield* Effect.promise(() =>
    secureQuestion("Bot Token: ")
  );

  if (!botToken.trim()) {
    yield* Console.error("❌ Bot token is required");
    return yield* Effect.fail(new Error("Bot token is required"));
  }

  // Test the bot token by calling getMe API
  yield* Console.log("\n🔍 Validating bot token...");
  
  const telegram = yield* TelegramProvider;
  const testResult = yield* telegram.testConnection(botToken.trim()).pipe(
    Effect.match({
      onFailure: (error) => ({ ok: false as const, message: error.message }),
      onSuccess: () => ({ ok: true as const })
    })
  );

  if (!testResult.ok) {
    yield* Console.error(
      `❌ Invalid bot token: ${testResult.message}`
    );
    yield* Console.error("   Configuration was not saved.");
    return yield* Effect.fail(new Error("Telegram bot token validation failed"));
  }

  yield* Console.log("✅ Bot token validated successfully!");

  yield* Console.log("\nDefault recipient chat ID");
  yield* Console.log("(You can retrieve your chat ID by starting the bot @getidsbot on Telegram)\n");

  const rl = createReadline();
  const defaultRecipient = yield* Effect.promise(() =>
    question(rl, "(optional, press Enter to skip): ")
  );
  rl.close();

  const config: TelegramConfig = {
    botToken: botToken.trim(),
    ...(defaultRecipient.trim() && { defaultRecipient: defaultRecipient.trim() }),
  };

  const service = yield* ProviderService;
  yield* service.saveConfig("telegram", config);

  yield* Console.log("\n✅ Telegram provider configured successfully!");
  
  if (config.defaultRecipient) {
    yield* Console.log(`   Default recipient: ${config.defaultRecipient}`);
  } else {
    yield* Console.log("   No default recipient set (you'll need to specify one when sending)");
  }
});

// Main setup command
export const setup = Command.make("setup", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("🔧 Notify CLI Setup\n");

    const selectedProvider = yield* selectFromList(
      AVAILABLE_PROVIDERS,
      "Select a provider to configure:"
    );

    switch (selectedProvider as ProviderName) {
      case "telegram":
        yield* setupTelegram;
        break;
    }
  }).pipe(Effect.provide(TelegramProviderLive))
);