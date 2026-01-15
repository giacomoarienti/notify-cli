#!/usr/bin/env node

import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { setup, telegram, log } from "./commands/index.js";
import { ProviderServiceLive } from "./services/provider.js";
import { LogServiceLive } from "./services/log.js";
import { TelegramProviderLive } from "./providers/telegram.js";

// Create the main CLI command
const cli = Command.make("notify", {}, () =>
  Effect.gen(function* () {
    yield* Effect.log("Notify CLI - Send notifications when AFK");
    yield* Effect.log("");
    yield* Effect.log("Available commands:");
    yield* Effect.log("  setup     - Configure notification providers");
    yield* Effect.log("  telegram  - Send a message via Telegram");
    yield* Effect.log("  log       - View notification history");
    yield* Effect.log("");
    yield* Effect.log("Run 'notify <command> --help' for more information.");
  })
).pipe(
  Command.withSubcommands([setup, telegram, log])
);

// Run the CLI
const main = Command.run(cli, {
  name: "notify",
  version: "1.0.0",
});

// Compose layers
const MainLayer = Layer.mergeAll(
  ProviderServiceLive,
  LogServiceLive,
  TelegramProviderLive
).pipe(Layer.merge(NodeContext.layer));

// Execute
main(process.argv).pipe(
  Effect.provide(MainLayer),
  NodeRuntime.runMain
);
