export const DEFAULT_DB_POOL_MAX = 5;
export const DEFAULT_DB_IDLE_TIMEOUT_MS = 30000;
export const DEFAULT_DB_CONNECTION_TIMEOUT_MS = 10000;

export interface DatabasePoolConfig {
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDatabasePoolConfig(
  getValue: (key: string) => string | undefined,
): DatabasePoolConfig {
  return {
    max: parsePositiveInteger(getValue('DB_POOL_MAX'), DEFAULT_DB_POOL_MAX),
    idleTimeoutMillis: parsePositiveInteger(
      getValue('DB_IDLE_TIMEOUT_MS'),
      DEFAULT_DB_IDLE_TIMEOUT_MS,
    ),
    connectionTimeoutMillis: parsePositiveInteger(
      getValue('DB_CONNECTION_TIMEOUT_MS'),
      DEFAULT_DB_CONNECTION_TIMEOUT_MS,
    ),
  };
}
