import { ApiClientError } from './client';
import { createQueryClient, removeAuthenticatedQueries, shouldRetry } from './queryClient';

describe('queryClient retry and cache management', () => {
  describe('shouldRetry policy', () => {
    it('permite retry para erros de rede offline (status 0) abaixo de 2 tentativas', () => {
      const netError = new ApiClientError('Network error', 0, 'NETWORK_ERROR');
      expect(shouldRetry(0, netError)).toBe(true);
      expect(shouldRetry(1, netError)).toBe(true);
      expect(shouldRetry(2, netError)).toBe(false);
    });

    it('permite retry para 503 Service Unavailable transitório abaixo de 2 tentativas', () => {
      const serviceUnavailable = new ApiClientError('Service unavailable', 503, 'SERVICE_UNAVAILABLE');
      expect(shouldRetry(0, serviceUnavailable)).toBe(true);
      expect(shouldRetry(1, serviceUnavailable)).toBe(true);
      expect(shouldRetry(2, serviceUnavailable)).toBe(false);
    });

    it('não repete automaticamente erros 500 para evitar congelamento de UI em loading', () => {
      const serverError = new ApiClientError('Internal error', 500, 'INTERNAL_SERVER_ERROR');
      expect(shouldRetry(0, serverError)).toBe(false);
      expect(shouldRetry(1, serverError)).toBe(false);
    });

    it('não repete erros 4xx de cliente (400, 401, 403, 404, 422)', () => {
      expect(shouldRetry(0, new ApiClientError('Bad request', 400, 'BAD_REQUEST'))).toBe(false);
      expect(shouldRetry(0, new ApiClientError('Unauthorized', 401, 'UNAUTHORIZED'))).toBe(false);
      expect(shouldRetry(0, new ApiClientError('Forbidden', 403, 'FORBIDDEN'))).toBe(false);
      expect(shouldRetry(0, new ApiClientError('Not found', 404, 'NOT_FOUND'))).toBe(false);
      expect(shouldRetry(0, new ApiClientError('Validation error', 422, 'VALIDATION_ERROR'))).toBe(false);
    });

    it('permite retry de erros genéricos desconhecidos abaixo do limite', () => {
      const genericError = new Error('Unknown error');
      expect(shouldRetry(0, genericError)).toBe(true);
      expect(shouldRetry(1, genericError)).toBe(true);
      expect(shouldRetry(2, genericError)).toBe(false);
    });
  });

  describe('createQueryClient', () => {
    it('cria QueryClient com opções padronizadas de staleTime e retry', () => {
      const client = createQueryClient();
      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(60_000);
      expect(defaultOptions.queries?.retry).toBe(shouldRetry);
      expect(defaultOptions.mutations?.retry).toBe(false);
    });
  });

  describe('removeAuthenticatedQueries', () => {
    it('cancela e remove apenas queries autenticadas correspondentes', async () => {
      const client = createQueryClient();
      client.setQueryData(['public', 'data'], { ok: true });
      client.setQueryDefaults(['auth', 'user-1'], {
        meta: { authenticated: true, authUserId: 'user-1' },
      });
      client.setQueryData(['auth', 'user-1'], { secret: 'data' });

      await removeAuthenticatedQueries(client, 'user-1');
      expect(client.getQueryData(['public', 'data'])).toEqual({ ok: true });
      expect(client.getQueryData(['auth', 'user-1'])).toBeUndefined();
    });
  });
});
