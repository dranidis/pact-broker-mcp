import * as z from "zod";

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

export const ConsumerProviderNamesSchema = z.object({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
  provider_name: z.string().describe("Name of the provider pacticipant"),
});

export const ConsumerProviderConsumerVersionSchema = z.object({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
  provider_name: z.string().describe("Name of the provider pacticipant"),
  consumer_version: z
    .string()
    .describe(
      "Consumer version number uniquely identifying the consumer version. For git, this could be a commit SHA or a tag.",
    ),
});

export const ConsumerProviderPactVersionSchema = z.object({
  consumer_name: z.string().describe("Name of the consumer pacticipant"),
  provider_name: z.string().describe("Name of the provider pacticipant"),
  pact_version: z
    .string()
    .describe(
      "Pact Broker pact-version UUID identifying the specific pact content.",
    ),
});

export const CanIDeploySchema = z.object({
  pacticipant: z.string().describe("Name of the pacticipant to deploy"),
  version: z.string().describe("Version number or tag of the pacticipant"),
  environment: z
    .string()
    .describe("Target environment name (e.g., 'production', 'staging')"),
});

export const PacticipantBranchSchema = z.object({
  pacticipant: z.string().describe("Name of the pacticipant"),
  branch: z.string().describe("Name of the branch"),
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
    "List all providers registered in the Pact Broker — i.e. pacticipants that appear as the provider in at least one of the latest pacts.",
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
  schema: ConsumerProviderNamesSchema,
} as const;

export const TOOL_GET_PREVIOUS_DISTINCT_PACT = {
  name: "get_previous_distinct_pact",
  description:
    "Fetch the previous distinct pact for a provider/consumer at a given consumer version. Returns the full pact JSON for the previous distinct pact, or null if there isn't one.",
  schema: ConsumerProviderConsumerVersionSchema,
} as const;

export const TOOL_GET_PACT_VERSION = {
  name: "get_pact_version",
  description:
    "Get the Pact Broker pact-version UUID for a pact identified by provider, consumer, and consumer version. A specific pact can belong to multiple consumer versions if the pact  content hasn't changed between versions. The pact-version UUID that can be used to fetch verification results.",
  schema: ConsumerProviderConsumerVersionSchema,
} as const;

export const TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION = {
  name: "get_latest_verification_results_for_pact_version",
  description:
    "Get the latest verification result(s) for a pact-version UUID for a given provider/consumer pair. Returns null if no verification results exist.",
  schema: ConsumerProviderPactVersionSchema,
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

export const TOOL_GET_PACTICIPANT_BRANCHES = {
  name: "get_pacticipant_branches",
  description:
    "Get all branches for a specific pacticipant. Branches are used for versioning and tracking different development streams.",
  schema: PacticipantNameSchema,
} as const;

export const TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION = {
  name: "get_pacticipant_branch_latest_version",
  description: "Get the latest version for a specific branch of a pacticipant.",
  schema: PacticipantBranchSchema,
} as const;
