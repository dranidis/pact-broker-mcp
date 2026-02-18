import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared argument schemas
// ---------------------------------------------------------------------------

export const BrokerUrlSchema = z.object({
  broker_url: z
    .string()
    .url()
    .describe("Base URL of the Pact Broker, e.g. https://broker.example.com"),
  auth_token: z
    .string()
    .optional()
    .describe(
      "Optional Basic auth token (base64 of user:password). Takes precedence over bearer_token.",
    ),
  bearer_token: z
    .string()
    .optional()
    .describe("Optional Bearer token for authentication."),
});

export const ProviderNameSchema = BrokerUrlSchema.extend({
  provider_name: z.string().describe("Name of the provider pacticipant"),
});

export const ConsumerNameSchema = BrokerUrlSchema.extend({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
});

export const PacticipantNameSchema = BrokerUrlSchema.extend({
  name: z.string().describe("Name of the pacticipant"),
});

export const PactPairSchema = BrokerUrlSchema.extend({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
  provider_name: z.string().describe("Name of the provider pacticipant"),
});

// ---------------------------------------------------------------------------
// Tool metadata (name + description used when registering with MCP)
// ---------------------------------------------------------------------------

export const TOOL_LIST_PACTICIPANTS = {
  name: "list_pacticipants",
  description:
    "List all pacticipants (both consumers and providers) registered in the Pact Broker.",
  schema: BrokerUrlSchema,
} as const;

export const TOOL_LIST_PROVIDERS = {
  name: "list_providers",
  description:
    "List all providers registered in the Pact Broker — i.e. pacticipants that appear as the provider in at least one pact.",
  schema: BrokerUrlSchema,
} as const;

export const TOOL_GET_PACTICIPANT = {
  name: "get_pacticipant",
  description:
    "Get detailed information about a single pacticipant by name (consumer or provider).",
  schema: PacticipantNameSchema,
} as const;

export const TOOL_GET_PROVIDER_STATES = {
  name: "get_provider_states",
  description:
    "Get all provider states defined across every pact where the given pacticipant is the provider. Returns states with their associated consumers.",
  schema: ProviderNameSchema,
} as const;

export const TOOL_GET_PROVIDER_PACTS = {
  name: "get_provider_pacts",
  description:
    "Get the latest pact versions for a specific provider (one pact per consumer).",
  schema: ProviderNameSchema,
} as const;

export const TOOL_GET_CONSUMER_PACTS = {
  name: "get_consumer_pacts",
  description:
    "Get the latest pact versions for a specific consumer (one pact per provider).",
  schema: ConsumerNameSchema,
} as const;

export const TOOL_GET_PACT = {
  name: "get_pact",
  description:
    "Fetch the full latest pact JSON between a specific consumer and provider, including all interactions.",
  schema: PactPairSchema,
} as const;
