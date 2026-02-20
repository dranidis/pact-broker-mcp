#!/usr/bin/env node
/**
 * Pact Broker MCP Server
 *
 * Exposes Pact Broker capabilities as MCP tools so that AI assistants can
 * query pacts, providers, consumers, and provider states.
 *
 * Usage (stdio transport — the standard for MCP):
 *   node dist/index.js
 *
 * Or with npx/tsx for development:
 *   tsx src/index.ts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";

import {
  canIDeploy,
  getBranches,
  getCurrentlyDeployedVersions,
  getCurrentlySupportedVersions,
  getPacticipantBranchLatestVersion,
  getConsumerLatestPacts,
  getLatestPact,
  getPacticipant,
  getPactVersion,
  getLatestVerificationResultsForPactVersion,
  getPreviousDistinctPact,
  getProviderLatestPacts,
  getProviderStates,
  listEnvironments,
  listPacticipants,
  listProviders,
  type PactBrokerConfig,
} from "./pact-broker-client.js";

import {
  PacticipantBranchSchema,
  CanIDeploySchema,
  ConsumerNameSchema,
  EnvironmentSchema,
  EmptySchema,
  ConsumerProviderPactVersionSchema,
  ConsumerProviderConsumerVersionSchema,
  PacticipantNameSchema,
  ConsumerProviderNamesSchema,
  ProviderNameSchema,
  TOOL_CAN_I_DEPLOY,
  TOOL_GET_PACTICIPANT_BRANCHES,
  TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION,
  TOOL_GET_CURRENTLY_DEPLOYED_VERSIONS,
  TOOL_GET_CURRENTLY_SUPPORTED_VERSIONS,
  TOOL_GET_CONSUMER_PACTS,
  TOOL_GET_PACT,
  TOOL_GET_PACTICIPANT,
  TOOL_GET_PACT_VERSION,
  TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION,
  TOOL_GET_PREVIOUS_DISTINCT_PACT,
  TOOL_GET_PROVIDER_PACTS,
  TOOL_GET_PROVIDER_STATES,
  TOOL_LIST_ENVIRONMENTS,
  TOOL_LIST_PACTICIPANT_NAMES,
  TOOL_LIST_PROVIDER_NAMES,
} from "./tools.js";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const mcpServer = new McpServer(
  {
    name: "pact-broker-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Access underlying server for low-level request handlers
const server = mcpServer.server;

// ---------------------------------------------------------------------------
// Tool listing
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: TOOL_LIST_PACTICIPANT_NAMES.name,
      description: TOOL_LIST_PACTICIPANT_NAMES.description,
      inputSchema: zodToJsonSchema(TOOL_LIST_PACTICIPANT_NAMES.schema),
    },
    {
      name: TOOL_LIST_PROVIDER_NAMES.name,
      description: TOOL_LIST_PROVIDER_NAMES.description,
      inputSchema: zodToJsonSchema(TOOL_LIST_PROVIDER_NAMES.schema),
    },
    {
      name: TOOL_GET_PACTICIPANT.name,
      description: TOOL_GET_PACTICIPANT.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PACTICIPANT.schema),
    },
    {
      name: TOOL_GET_PROVIDER_STATES.name,
      description: TOOL_GET_PROVIDER_STATES.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PROVIDER_STATES.schema),
    },
    {
      name: TOOL_GET_PROVIDER_PACTS.name,
      description: TOOL_GET_PROVIDER_PACTS.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PROVIDER_PACTS.schema),
    },
    {
      name: TOOL_GET_CONSUMER_PACTS.name,
      description: TOOL_GET_CONSUMER_PACTS.description,
      inputSchema: zodToJsonSchema(TOOL_GET_CONSUMER_PACTS.schema),
    },
    {
      name: TOOL_GET_PACT.name,
      description: TOOL_GET_PACT.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PACT.schema),
    },
    {
      name: TOOL_GET_PACT_VERSION.name,
      description: TOOL_GET_PACT_VERSION.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PACT_VERSION.schema),
    },
    {
      name: TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION.name,
      description:
        TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION.description,
      inputSchema: zodToJsonSchema(
        TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION.schema,
      ),
    },
    {
      name: TOOL_GET_PREVIOUS_DISTINCT_PACT.name,
      description: TOOL_GET_PREVIOUS_DISTINCT_PACT.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PREVIOUS_DISTINCT_PACT.schema),
    },
    {
      name: TOOL_CAN_I_DEPLOY.name,
      description: TOOL_CAN_I_DEPLOY.description,
      inputSchema: zodToJsonSchema(TOOL_CAN_I_DEPLOY.schema),
    },
    {
      name: TOOL_LIST_ENVIRONMENTS.name,
      description: TOOL_LIST_ENVIRONMENTS.description,
      inputSchema: zodToJsonSchema(TOOL_LIST_ENVIRONMENTS.schema),
    },
    {
      name: TOOL_GET_PACTICIPANT_BRANCHES.name,
      description: TOOL_GET_PACTICIPANT_BRANCHES.description,
      inputSchema: zodToJsonSchema(TOOL_GET_PACTICIPANT_BRANCHES.schema),
    },
    {
      name: TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION.name,
      description: TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION.description,
      inputSchema: zodToJsonSchema(
        TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION.schema,
      ),
    },
    {
      name: TOOL_GET_CURRENTLY_DEPLOYED_VERSIONS.name,
      description: TOOL_GET_CURRENTLY_DEPLOYED_VERSIONS.description,
      inputSchema: zodToJsonSchema(TOOL_GET_CURRENTLY_DEPLOYED_VERSIONS.schema),
    },
    {
      name: TOOL_GET_CURRENTLY_SUPPORTED_VERSIONS.name,
      description: TOOL_GET_CURRENTLY_SUPPORTED_VERSIONS.description,
      inputSchema: zodToJsonSchema(
        TOOL_GET_CURRENTLY_SUPPORTED_VERSIONS.schema,
      ),
    },
  ],
}));

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // -----------------------------------------------------------------------
      case TOOL_LIST_PACTICIPANT_NAMES.name: {
        EmptySchema.parse(args);
        const config = buildConfig();
        const pacticipants = await listPacticipants(config);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                pacticipants.map((p) => ({
                  name: p.name,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_LIST_PROVIDER_NAMES.name: {
        EmptySchema.parse(args);
        const config = buildConfig();
        const providers = await listProviders(config);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                providers.map((p) => ({
                  name: p.name,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PACTICIPANT.name: {
        const input = PacticipantNameSchema.parse(args);
        const config = buildConfig();
        const pacticipant = await getPacticipant(config, input.name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: pacticipant.name,
                  displayName: pacticipant.displayName,
                  repositoryUrl: pacticipant.repositoryUrl,
                  repositoryName: pacticipant.repositoryName,
                  mainBranch: pacticipant.mainBranch,
                  createdAt: pacticipant.createdAt,
                  updatedAt: pacticipant.updatedAt,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PROVIDER_STATES.name: {
        const input = ProviderNameSchema.parse(args);
        const config = buildConfig();
        const statesWithConsumer = await getProviderStates(
          config,
          input.provider_name,
        );

        if (statesWithConsumer.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No pacts found for provider "${input.provider_name}".`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(statesWithConsumer, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PROVIDER_PACTS.name: {
        const input = ProviderNameSchema.parse(args);
        const config = buildConfig();
        const pacts = await getProviderLatestPacts(config, input.provider_name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                pacts.map((p) => ({
                  consumer: p.consumer.name,
                  provider: p.provider.name,
                  pactUrl: p.pactUrl || p._links.self.href,
                  createdAt: p.createdAt,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_CONSUMER_PACTS.name: {
        const input = ConsumerNameSchema.parse(args);
        const config = buildConfig();
        const pacts = await getConsumerLatestPacts(config, input.consumer_name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                pacts.map((p) => ({
                  consumer: p.consumer.name,
                  provider: p.provider.name,
                  pactUrl: p.pactUrl || p._links.self.href,
                  createdAt: p.createdAt,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PACT.name: {
        const input = ConsumerProviderNamesSchema.parse(args);
        const config = buildConfig();
        const pact = await getLatestPact(
          config,
          input.consumer_name,
          input.provider_name,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pact, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PACT_VERSION.name: {
        const input = ConsumerProviderConsumerVersionSchema.parse(args);
        const config = buildConfig();
        const result = await getPactVersion(
          config,
          input.consumer_name,
          input.provider_name,
          input.consumer_version,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_LATEST_VERIFICATION_RESULTS_FOR_PACT_VERSION.name: {
        const input = ConsumerProviderPactVersionSchema.parse(args);
        const config = buildConfig();

        const result = await getLatestVerificationResultsForPactVersion(
          config,
          input.consumer_name,
          input.provider_name,
          input.pact_version,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PREVIOUS_DISTINCT_PACT.name: {
        const input = ConsumerProviderConsumerVersionSchema.parse(args);
        const config = buildConfig();

        const previous = await getPreviousDistinctPact(
          config,
          input.consumer_name,
          input.provider_name,
          input.consumer_version,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(previous, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_CAN_I_DEPLOY.name: {
        const input = CanIDeploySchema.parse(args);
        const config = buildConfig();
        const result = await canIDeploy(
          config,
          input.pacticipant,
          input.version,
          input.environment,
        );

        const deployable = result.summary.deployable;
        const emoji = deployable ? "✅" : "❌";
        const status = deployable ? "CAN DEPLOY" : "CANNOT DEPLOY";

        return {
          content: [
            {
              type: "text",
              text:
                `${emoji} ${status}\n\n${result.summary.reason}\n\n` +
                JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_LIST_ENVIRONMENTS.name: {
        EmptySchema.parse(args);
        const config = buildConfig();
        const environments = await listEnvironments(config);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                environments.map((e) => ({
                  name: e.name,
                  displayName: e.displayName,
                  production: e.production,
                  uuid: e.uuid,
                  createdAt: e.createdAt,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PACTICIPANT_BRANCHES.name: {
        const input = PacticipantNameSchema.parse(args);
        const config = buildConfig();
        const branches = await getBranches(config, input.name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                branches.map((b) => ({
                  name: b.name,
                  createdAt: b.createdAt,
                  updatedAt: b.updatedAt,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_PACTICIPANT_BRANCH_LATEST_VERSION.name: {
        const input = PacticipantBranchSchema.parse(args);
        const config = buildConfig();
        const version = await getPacticipantBranchLatestVersion(
          config,
          input.pacticipant,
          input.branch,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  version: version.number,
                  branch: version.branch,
                  buildUrl: version.buildUrl,
                  createdAt: version.createdAt,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_CURRENTLY_DEPLOYED_VERSIONS.name: {
        const input = EnvironmentSchema.parse(args);
        const config = buildConfig();

        const result = await getCurrentlyDeployedVersions(
          config,
          input.environment,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  environment: {
                    uuid: result.environment.uuid,
                    name: result.environment.name,
                    displayName: result.environment.displayName,
                    production: result.environment.production,
                  },
                  deployedVersions: result.deployedVersions.map((dv) => ({
                    uuid: dv.uuid,
                    currentlyDeployed: dv.currentlyDeployed,
                    createdAt: dv.createdAt,
                    pacticipant: dv._embedded?.pacticipant?.name,
                    version: dv._embedded?.version?.number,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_GET_CURRENTLY_SUPPORTED_VERSIONS.name: {
        const input = EnvironmentSchema.parse(args);
        const config = buildConfig();

        const result = await getCurrentlySupportedVersions(
          config,
          input.environment,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  environment: {
                    uuid: result.environment.uuid,
                    name: result.environment.name,
                    displayName: result.environment.displayName,
                    production: result.environment.production,
                  },
                  releasedVersions: result.releasedVersions.map((rv) => ({
                    uuid: rv.uuid,
                    currentlySupported: rv.currentlySupported,
                    createdAt: rv.createdAt,
                    pacticipant: rv._embedded?.pacticipant?.name,
                    version: rv._embedded?.version?.number,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }
      // -----------------------------------------------------------------------
      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: "${name}"`,
            },
          ],
          isError: true,
        };
    }
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? `Invalid arguments: ${err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")}`
        : err instanceof Error
          ? err.message
          : String(err);

    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildConfig(): PactBrokerConfig {
  const brokerUrl = process.env.PACT_BROKER_BASE_URL;
  if (!brokerUrl) {
    throw new Error("PACT_BROKER_BASE_URL environment variable is required");
  }

  const username = process.env.PACT_BROKER_USERNAME;
  const password = process.env.PACT_BROKER_PASSWORD;
  const bearerToken = process.env.PACT_BROKER_TOKEN;

  let authToken: string | undefined;
  if (username && password) {
    // Create base64 encoded basic auth token
    authToken = Buffer.from(`${username}:${password}`).toString("base64");
  }

  return {
    brokerUrl: brokerUrl.replace(/\/$/, ""), // strip trailing slash
    authToken,
    bearerToken,
  };
}

/**
 * Zod → JSON Schema converter.
 *
 * Zod v4 includes a native `z.toJSONSchema()` implementation, which avoids
 * relying on Zod internal types/fields (which changed between v3 and v4).
 */
function zodToJsonSchema(schema: z.ZodType): object {
  return z.toJSONSchema(schema, {
    target: "draft-07",
    unrepresentable: "any",
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  // MCP servers communicate over stdio — logging goes to stderr
  console.error("Pact Broker MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
