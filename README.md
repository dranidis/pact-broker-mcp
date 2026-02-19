# pact-broker-mcp

An MCP (Model Context Protocol) server for interacting with a [Pact Broker](https://docs.pact.io/pact_broker).

Exposes Pact Broker data — providers, consumers, pacts, and provider states — as MCP tools so that AI assistants (Claude, Cursor, etc.) can query them in context.

---

## Available Tools

| Tool                                               | Description                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `list_pacticipants`                                | List every consumer & provider registered in the broker                                             |
| `list_providers`                                   | List only providers (pacticipants that appear as provider in ≥1 pact)                               |
| `get_pacticipant`                                  | Get details for a single pacticipant by name                                                        |
| `get_provider_states`                              | Get all provider states for a provider, grouped by consumer                                         |
| `get_provider_pacts`                               | Get latest pact versions for a provider (one per consumer)                                          |
| `get_consumer_pacts`                               | Get latest pact versions for a consumer (one per provider)                                          |
| `get_pact`                                         | Fetch the full latest pact JSON for a consumer/provider pair                                        |
| `get_previous_distinct_pact`                       | Fetch the previous distinct pact for a consumer/provider at a given consumer version (or `null`)    |
| `get_pact_version`                                 | Get the Pact Broker pact-version UUID for a pact identified by consumer/provider + consumer version |
| `get_latest_verification_results_for_pact_version` | Get the latest verification results for a pact-version UUID (or `null` if none exist)               |
| `can_i_deploy`                                     | Check if a pacticipant version can be safely deployed to an environment                             |
| `list_environments`                                | List all environments registered in the Pact Broker                                                 |
| `get_currently_deployed_versions`                  | Get pacticipant versions currently deployed to an environment                                       |
| `get_currently_supported_versions`                 | Get pacticipant versions currently supported in an environment                                      |
| `get_pacticipant_branches`                         | Get all branches for a specific pacticipant                                                         |
| `get_pacticipant_branch_latest_version`            | Get the latest version for a specific branch of a pacticipant                                       |

---

## Configuration

The Pact Broker connection is configured via environment variables:

| Environment Variable   | Required | Description                                                        |
| ---------------------- | -------- | ------------------------------------------------------------------ |
| `PACT_BROKER_BASE_URL` | **Yes**  | Base URL of the Pact Broker, e.g. `https://broker.example.com`     |
| `PACT_BROKER_USERNAME` | No       | Username for basic authentication                                  |
| `PACT_BROKER_PASSWORD` | No       | Password for basic authentication                                  |
| `PACT_BROKER_TOKEN`    | No       | Bearer token for authentication (alternative to username/password) |

**Authentication priority**: If both basic auth (username/password) and bearer token are provided, bearer token takes precedence.

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

**Important**: After installing dependencies, restart Claude Desktop to pick up the changes.

### Development (with hot reload)

```bash
npm run dev
```

---

## Using with Claude Desktop

Add the server to your `claude_desktop_config.json` with environment variables:

```json
{
  "mcpServers": {
    "pact-broker": {
      "command": "node",
      "args": ["/absolute/path/to/pact-broker-mcp/dist/index.js"],
      "env": {
        "PACT_BROKER_BASE_URL": "https://broker.example.com",
        "PACT_BROKER_USERNAME": "your-username",
        "PACT_BROKER_PASSWORD": "your-password"
      }
    }
  }
}
```

Or with bearer token authentication:

```json
{
  "mcpServers": {
    "pact-broker": {
      "command": "node",
      "args": ["/absolute/path/to/pact-broker-mcp/dist/index.js"],
      "env": {
        "PACT_BROKER_BASE_URL": "https://broker.example.com",
        "PACT_BROKER_TOKEN": "your-bearer-token"
      }
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

## Using Codex CLI:

```bash
codex mcp add pact-broker-mcp --env PACT_BROKER_BASE_URL=https://broker.example.com -- node /absolute/path/to/pact-broker-mcp/dist/index.js
```

---

## Example Prompts

Once connected, you can ask Claude things like:

> "List all providers in my pact broker"

> "What provider states does the OrderService have?"

> "Show me the full pact between the PaymentConsumer and PaymentProvider"

> "Can I deploy PaymentService version 1.2.3 to production?"

> "Is it safe to deploy the OrderConsumer version abc123 to staging?"

> "What environments are available in the Pact Broker?"

> "Show me all branches for the PaymentService"

> "What's the latest version of the main branch for BarProvider?"

> "What's the pact-version UUID for the pact between FooConsumer and BarProvider for consumer version abc123?"

> "Get the latest verification results for pact-version 2f74c58b-0d16-4a3c-9aa2-3c5a2a5eb1d3 between FooConsumer and BarProvider"

> "Show me the previous distinct pact for FooConsumer/BarProvider at consumer version abc123"

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

- [x] Can-I-deploy checks
- [ ] Webhook management
- [ ] Version/tag management
- [ ] Verification result publishing
- [ ] Network (dependency graph) queries
