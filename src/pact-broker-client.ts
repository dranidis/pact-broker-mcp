/**
 * Pact Broker API Client
 *
 * Handles all HTTP communication with a Pact Broker instance.
 * The Pact Broker follows HAL (Hypertext Application Language) for its API responses.
 */

export interface PactBrokerConfig {
  brokerUrl: string;
  /** Basic auth token (base64 of user:password) — optional */
  authToken?: string;
  /** Bearer token — optional */
  bearerToken?: string;
}

export interface Pacticipant {
  name: string;
  displayName?: string;
  repositoryUrl?: string;
  repositoryName?: string;
  mainBranch?: string;
  createdAt?: string;
  updatedAt?: string;
  _links: {
    self: { href: string; name: string };
    [key: string]: unknown;
  };
}

export interface PacticipantsResponse {
  pacticipants: Pacticipant[];
}

export interface ProviderState {
  name: string;
  params?: Record<string, unknown>;
}

export interface Interaction {
  description: string;
  providerStates?: ProviderState[];
  /** Legacy field (Pact v1/v2) */
  providerState?: string;
}

export interface Pact {
  consumer: { name: string };
  provider: { name: string };
  interactions: Interaction[];
  metadata?: Record<string, unknown>;
}

export interface PactVersion {
  consumer: { name: string };
  provider: { name: string };
  pactUrl: string;
  createdAt?: string;
  _links: {
    self: { href: string; name: string; title?: string };
    [key: string]: unknown;
  };
}

export interface LatestPactsResponse {
  pacts: PactVersion[];
}

export interface VerificationResult {
  success: boolean;
  providerApplicationVersion?: string;
  buildUrl?: string;
  publishedAt?: string;
}

export interface ProviderWithConsumers {
  provider: string;
  consumers: string[];
}

export interface ProviderStateWithConsumers {
  name: string;
  consumers: string[];
}

export interface ProviderStatesResponse {
  providerStates: ProviderStateWithConsumers[];
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function buildHeaders(config: PactBrokerConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/hal+json, application/json",
  };

  if (config.bearerToken) {
    headers["Authorization"] = `Bearer ${config.bearerToken}`;
  } else if (config.authToken) {
    headers["Authorization"] = `Basic ${config.authToken}`;
  }

  return headers;
}

async function fetchJSON<T>(url: string, config: PactBrokerConfig): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Pact Broker request failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`,
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

/**
 * List all pacticipants (consumers + providers) registered in the broker.
 */
export async function listPacticipants(
  config: PactBrokerConfig,
): Promise<Pacticipant[]> {
  const url = `${config.brokerUrl}/pacticipants`;
  const data = await fetchJSON<{ _embedded: PacticipantsResponse }>(
    url,
    config,
  );
  return data._embedded?.pacticipants ?? [];
}

/**
 * Get a single pacticipant by name.
 */
export async function getPacticipant(
  config: PactBrokerConfig,
  name: string,
): Promise<Pacticipant> {
  const url = `${config.brokerUrl}/pacticipants/${encodeURIComponent(name)}`;
  return fetchJSON<Pacticipant>(url, config);
}

/**
 * List all providers (pacticipants that have at least one pact where they
 * are the provider).
 */
export async function listProviders(
  config: PactBrokerConfig,
): Promise<Pacticipant[]> {
  const allPacticipants = await listPacticipants(config);

  // Get the latest pacts to determine which pacticipants act as providers
  const latestPacts = await getLatestPacts(config);
  const providerNames = new Set(latestPacts.map((p) => p.provider.name));

  return allPacticipants.filter((p) => providerNames.has(p.name));
}

/**
 * Get all latest pacts (across all consumer/provider pairs).
 */
export async function getLatestPacts(
  config: PactBrokerConfig,
): Promise<PactVersion[]> {
  const url = `${config.brokerUrl}/pacts/latest`;
  const data = await fetchJSON<{ _embedded: LatestPactsResponse }>(url, config);
  return data._embedded?.pacts ?? [];
}

/**
 * Get provider states for a specific provider by inspecting all pacts
 * where this pacticipant is the provider.
 */
export async function getProviderStates(
  config: PactBrokerConfig,
  providerName: string,
): Promise<ProviderStateWithConsumers[]> {
  const url = `${config.brokerUrl}/pacts/provider/${encodeURIComponent(
    providerName,
  )}/provider-states`;
  const data = await fetchJSON<ProviderStatesResponse>(url, config);
  return data.providerStates ?? [];
}

/**
 * Get pacts for a specific provider (latest version from each consumer).
 */
export async function getProviderPacts(
  config: PactBrokerConfig,
  providerName: string,
): Promise<PactVersion[]> {
  const latestPacts = await getLatestPacts(config);
  return latestPacts.filter(
    (p) => p.provider.name.toLowerCase() === providerName.toLowerCase(),
  );
}

/**
 * Get pacts for a specific consumer (latest version for each provider).
 */
export async function getConsumerPacts(
  config: PactBrokerConfig,
  consumerName: string,
): Promise<PactVersion[]> {
  const latestPacts = await getLatestPacts(config);
  return latestPacts.filter(
    (p) => p.consumer.name.toLowerCase() === consumerName.toLowerCase(),
  );
}

/**
 * Fetch and return the raw pact JSON between a specific consumer and provider.
 */
export async function getPact(
  config: PactBrokerConfig,
  consumerName: string,
  providerName: string,
): Promise<Pact> {
  const url = `${config.brokerUrl}/pacts/provider/${encodeURIComponent(
    providerName,
  )}/consumer/${encodeURIComponent(consumerName)}/latest`;
  return fetchJSON<Pact>(url, config);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractProviderStates(pact: Pact): string[] {
  const stateSet = new Set<string>();

  for (const interaction of pact.interactions ?? []) {
    // Pact v3/v4 style
    for (const ps of interaction.providerStates ?? []) {
      if (ps.name) stateSet.add(ps.name);
    }
    // Pact v1/v2 style
    if (interaction.providerState) {
      stateSet.add(interaction.providerState);
    }
  }

  return [...stateSet].sort();
}
