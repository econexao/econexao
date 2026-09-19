import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  getStoredVisitorRegion,
  setStoredVisitorRegion,
  VISITOR_REGION_STORAGE_KEY,
} from './regionStorage';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      store.set(key, val);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    __store: store,
  };
});

describe('regionStorage', () => {
  beforeEach(async () => {
    (SecureStore as any).__store.clear();
  });

  it('returns null by default when unset', async () => {
    const region = await getStoredVisitorRegion();
    expect(region).toBeNull();
  });

  it('returns null when stored as "all" or "null"', async () => {
    await setStoredVisitorRegion('all');
    expect(await getStoredVisitorRegion()).toBeNull();

    await setStoredVisitorRegion(null);
    expect(await getStoredVisitorRegion()).toBeNull();
  });

  it('persists and retrieves a specific region ID', async () => {
    await setStoredVisitorRegion('reg-altamira-123');
    const stored = await getStoredVisitorRegion();
    expect(stored).toBe('reg-altamira-123');
  });

  it('stores "all" when setStoredVisitorRegion is called with null', async () => {
    await setStoredVisitorRegion('reg-altamira-123');
    await setStoredVisitorRegion(null);
    expect(await getStoredVisitorRegion()).toBeNull();
    const raw = await SecureStore.getItemAsync(VISITOR_REGION_STORAGE_KEY);
    expect(raw).toBe('all');
  });
});
