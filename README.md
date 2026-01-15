# Notify CLI

A CLI app to receive notifications when AFK.

## Installation

```bash
# Install globally
npm install -g notify-cli

# Or run locally with npm
npm run dev
```

## Usage

### Setup

Configure notification providers:

```bash
notify setup
```

This will prompt you to select a provider and enter the required credentials.

### Telegram

Send notifications via Telegram:

```bash
# Send to default recipient (must be configured during setup)
notify telegram "Your message here"

# Send to a specific recipient
notify telegram 123456789 "Your message here"
```

### Logs

View notification history:

```bash
# View all notifications
notify log

# Filter by provider
notify log telegram
```

## Providers

### Telegram

Required credentials:
- **Bot Token**: Get one from [@BotFather](https://t.me/BotFather) on Telegram
- **Default Recipient** (optional): Chat ID of the default recipient

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── commands/       # CLI commands (setup, telegram, log)
├── providers/      # Notification provider implementations
├── services/       # Core services (provider config, logging)
├── utils/          # Utility functions
├── schemas.ts      # Effect Schema definitions
└── index.ts        # CLI entry point

tests/              # Test files
plan/               # PRD and planning files
```

## License

ISC
