import { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from './client';

export function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiClientError) {
    // 500 (Internal Server Error) and 4xx are deterministic; do not auto-retry to prevent UI freezing.
    // 503 (Service Unavailable) and 0 (Network drop) are transient and eligible for limited retry.
    return error.status === 0 || error.status === 503;
  }
  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: process.env.NODE_ENV === 'test' ? Infinity : 30 * 60_000,
        retry: shouldRetry,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
        gcTime: process.env.NODE_ENV === 'test' ? Infinity : 30 * 60_000,
        // Execute the mutationFn so ApiClient can reject immediately with an
        // explicit offline error instead of silently queueing a write.
        networkMode: 'always',
      },
    },
  });
}

export async function removeAuthenticatedQueries(
  client: QueryClient,
  previousUserId?: string
): Promise<void> {
  const targets = new Set(
    client
      .getQueryCache()
      .findAll({
        predicate: (query) =>
          query.meta?.authenticated === true &&
          (previousUserId === undefined ||
            query.meta?.authUserId === undefined ||
            query.meta?.authUserId === previousUserId),
      })
      .map((query) => query.queryHash)
  );
  const isTarget = (query: { queryHash: string }) => targets.has(query.queryHash);

  await client.cancelQueries({ predicate: isTarget });
  client.removeQueries({ predicate: isTarget });
}

export const queryClient = createQueryClient();
