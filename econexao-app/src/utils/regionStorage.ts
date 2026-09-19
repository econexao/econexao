import { authStorage } from '../auth/storage';

export const VISITOR_REGION_STORAGE_KEY = 'econexao_visitor_active_region';

/**
 * Retrieves the stored region for visitors.
 * Returns null if unset, or explicitly set to 'all' / 'null' (representing "Todas as regiões").
 */
export async function getStoredVisitorRegion(): Promise<string | null> {
  try {
    const stored = await authStorage.getItem(VISITOR_REGION_STORAGE_KEY);
    if (!stored || stored === 'all' || stored === 'null') {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

/**
 * Persists the active region for visitors in local storage.
 * Stores 'all' when regionId is null or 'all'.
 */
export async function setStoredVisitorRegion(regionId: string | null): Promise<void> {
  try {
    const valueToStore = !regionId || regionId === 'all' ? 'all' : regionId;
    await authStorage.setItem(VISITOR_REGION_STORAGE_KEY, valueToStore);
  } catch {
    // Non-blocking fallback for restricted environments
  }
}
