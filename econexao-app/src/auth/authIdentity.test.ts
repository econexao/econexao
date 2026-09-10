import type { Session } from '@supabase/supabase-js';

import { getAuthIdentity } from './AuthProvider';

function session(user: Partial<Session['user']>): Session {
  return { user: { id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated', ...user } } as Session;
}

describe('auth identity classification for favorites scope', () => {
  it('keeps no session as visitor, even if a protected request later returns 401', () => {
    expect(getAuthIdentity('signed_out', null)).toBe('visitor');
  });

  it('distinguishes an authenticated anonymous Supabase guest', () => {
    expect(getAuthIdentity('authenticated', session({ is_anonymous: true, email: undefined }))).toBe('guest');
    expect(getAuthIdentity('authenticated', session({ is_anonymous: true, email: 'transient@example.com' }))).toBe('guest');
  });

  it('treats linked/email users as accounts', () => {
    expect(getAuthIdentity('authenticated', session({ is_anonymous: false, email: 'test@example.com' }))).toBe('account');
  });
});
