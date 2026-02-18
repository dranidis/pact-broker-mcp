# pact-broker-mcp

An MCP (Model Context Protocol) server for interacting with a [Pact Broker](https://docs.pact.io/pact_broker).

Exposes Pact Broker data — providers, consumers, pacts, and provider states — as MCP tools so that AI assistants (Claude, Cursor, etc.) can query them in context.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `list_pacticipants` | List every consumer & provider registered in the broker |
| `list_providers` | List only providers (pacticipants that appear as provider in ≥1 pact) |
| `get_pacticipant` | Get details for a single pacticipant by name |
| `get_provider_states` | Get all provider states for a provider, grouped by consumer |
| `get_provider_pacts` | Get latest pact versions for a provider (one per consumer) |
| `get_consumer_pacts` | Get latest pact versions for a consumer (one per provider) |
| `get_pact` | Fetch the full pact JSON for a consumer/provider pair |

Every tool accepts these authentication arguments (all optional):

| Argument | Description |
|----------|-------------|
| `broker_url` | **Required.** Base URL, e.g. `https://broker.example.com` |
| `auth_token` | Basic auth token (base64 of `user:password`) |
| `bearer_token` | Bearer token |

---

## Setup

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn

### Install & Build

```bash
npm install
npm run build
```

### Development (with hot reload)

```bash
npm run dev
```

---

## Using with Claude Desktop

Add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pact-broker": {
      "command": "node",
      "args": ["/absolute/path/to/pact-broker-mcp/dist/index.js"]
    }
  }
}
```

Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Using with Claude Code / other MCP clients

```bash
# From within Claude Code:
claude mcp add pact-broker node /absolute/path/to/pact-broker-mcp/dist/index.js
```

---

## Example Prompts

Once connected, you can ask Claude things like:

> "List all providers in my pact broker at https://broker.mycompany.com"

> "What provider states does the OrderService have, according to the pact broker?"

> "Show me the full pact between the PaymentConsumer and PaymentProvider"

---

## Project Structure

```
src/
  index.ts               # MCP server — tool registration & request handling
  pact-broker-client.ts  # HTTP client for the Pact Broker REST API
  tools.ts               # Zod schemas & tool metadata
```

---

## Roadmap

- [ ] Webhook management
- [ ] Can-I-deploy checks
- [ ] Version/tag management
- [ ] Verification result publishing
- [ ] Network (dependency graph) queries
