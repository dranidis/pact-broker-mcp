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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ZodError } from "zod";

import {
  canIDeploy,
  getBranches,
  getConsumerPacts,
  getPact,
  getPacticipant,
  getProviderPacts,
  getProviderStates,
  listEnvironments,
  listPacticipants,
  listProviders,
  type PactBrokerConfig,
} from "./pact-broker-client.js";

import {
  CanIDeploySchema,
  ConsumerNameSchema,
  EmptySchema,
  PacticipantNameSchema,
  PactPairSchema,
  ProviderNameSchema,
  TOOL_CAN_I_DEPLOY,
  TOOL_GET_BRANCHES,
  TOOL_GET_CONSUMER_PACTS,
  TOOL_GET_PACT,
  TOOL_GET_PACTICIPANT,
  TOOL_GET_PROVIDER_PACTS,
  TOOL_GET_PROVIDER_STATES,
  TOOL_LIST_ENVIRONMENTS,
  TOOL_LIST_PACTICIPANTS,
  TOOL_LIST_PROVIDERS,
} from "./tools.js";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
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

// ---------------------------------------------------------------------------
// Tool listing
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: TOOL_LIST_PACTICIPANTS.name,
      description: TOOL_LIST_PACTICIPANTS.description,
      inputSchema: zodToJsonSchema(TOOL_LIST_PACTICIPANTS.schema),
    },
    {
      name: TOOL_LIST_PROVIDERS.name,
      description: TOOL_LIST_PROVIDERS.description,
      inputSchema: zodToJsonSchema(TOOL_LIST_PROVIDERS.schema),
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
      name: TOOL_GET_BRANCHES.name,
      description: TOOL_GET_BRANCHES.description,
      inputSchema: zodToJsonSchema(TOOL_GET_BRANCHES.schema),
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
      case TOOL_LIST_PACTICIPANTS.name: {
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
                  displayName: p.displayName,
                  repositoryUrl: p.repositoryUrl,
                  mainBranch: p.mainBranch,
                  createdAt: p.createdAt,
                  updatedAt: p.updatedAt,
                })),
                null,
                2,
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      case TOOL_LIST_PROVIDERS.name: {
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
                  displayName: p.displayName,
                  repositoryUrl: p.repositoryUrl,
                  mainBranch: p.mainBranch,
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
        const pacts = await getProviderPacts(config, input.provider_name);
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
        const pacts = await getConsumerPacts(config, input.consumer_name);
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
        const input = PactPairSchema.parse(args);
        const config = buildConfig();
        const pact = await getPact(
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
      case TOOL_GET_BRANCHES.name: {
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
      err instanceof ZodError
        ? `Invalid arguments: ${err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
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
 * Minimal Zod → JSON Schema converter (handles the subset we use here).
 * For a full implementation you would use `zod-to-json-schema` package,
 * but we keep dependencies minimal.
 */
function zodToJsonSchema(
  schema: ReturnType<typeof EmptySchema.extend> | typeof EmptySchema,
): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape = (schema as any)._def?.shape?.() ?? {};
  const properties: Record<string, object> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = value as any;
    const typeName = v._def?.typeName;
    const description = v._def?.description ?? v.description;

    const isOptional =
      typeName === "ZodOptional" ||
      v._def?.innerType?._def?.typeName === "ZodOptional";

    const innerTypeName =
      typeName === "ZodOptional" ? v._def?.innerType?._def?.typeName : typeName;

    const jsonType =
      innerTypeName === "ZodString"
        ? "string"
        : innerTypeName === "ZodNumber"
          ? "number"
          : innerTypeName === "ZodBoolean"
            ? "boolean"
            : "string";

    properties[key] = {
      type: jsonType,
      ...(description ? { description } : {}),
    };

    if (!isOptional) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // MCP servers communicate over stdio — logging goes to stderr
  console.error("Pact Broker MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
