import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared argument schemas
// ---------------------------------------------------------------------------
// Note: Broker URL and authentication are now configured via environment variables:
// - PACT_BROKER_BASE_URL: Base URL of the Pact Broker
// - PACT_BROKER_USERNAME: Username for basic auth (optional)
// - PACT_BROKER_PASSWORD: Password for basic auth (optional)
// - PACT_BROKER_TOKEN: Bearer token for authentication (optional)

export const EmptySchema = z.object({});

export const ProviderNameSchema = z.object({
  provider_name: z.string().describe("Name of the provider pacticipant"),
});

export const ConsumerNameSchema = z.object({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
});

export const PacticipantNameSchema = z.object({
  name: z.string().describe("Name of the pacticipant"),
});

export const PactPairSchema = z.object({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
  provider_name: z.string().describe("Name of the provider pacticipant"),
});

export const CanIDeploySchema = z.object({
  pacticipant: z.string().describe("Name of the pacticipant to deploy"),
  version: z.string().describe("Version number or tag of the pacticipant"),
  environment: z
    .string()
    .describe("Target environment name (e.g., 'production', 'staging')"),
});

// ---------------------------------------------------------------------------
// Tool metadata (name + description used when registering with MCP)
// ---------------------------------------------------------------------------

export const TOOL_LIST_PACTICIPANTS = {
  name: "list_pacticipants",
  description:
    "List all pacticipants (both consumers and providers) registered in the Pact Broker.",
  schema: EmptySchema,
} as const;

export const TOOL_LIST_PROVIDERS = {
  name: "list_providers",
  description:
    "List all providers registered in the Pact Broker — i.e. pacticipants that appear as the provider in at least one pact.",
  schema: EmptySchema,
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

export const TOOL_CAN_I_DEPLOY = {
  name: "can_i_deploy",
  description:
    "Check if a pacticipant version can be safely deployed to an environment. Returns deployment status based on verification results.",
  schema: CanIDeploySchema,
} as const;

export const TOOL_LIST_ENVIRONMENTS = {
  name: "list_environments",
  description:
    "List all environments registered in the Pact Broker where pacticipants can be deployed.",
  schema: EmptySchema,
} as const;

export const TOOL_GET_BRANCHES = {
  name: "get_branches",
  description:
    "Get all branches for a specific pacticipant. Branches are used for versioning and tracking different development streams.",
  schema: PacticipantNameSchema,
} as const;
