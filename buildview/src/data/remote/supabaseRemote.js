// =============================================================================
// Supabase remote adapter — the production implementation of the pluggable
// remote used by data/sync.js, plus the real auth calls.
//
// Storage model: one table per collection, each row {id text pk,
// updated_at timestamptz, data jsonb} where `data` is the exact app row.
// That keeps SQL migrations trivial while the product shape evolves.
//
// The client library is imported dynamically so the demo/sandbox bundle
// doesn't pay for it unless a remote is actually configured.
// =============================================================================
import {COLLECTIONS} from '../db.js';

const URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_URL) ||
  '';
const ANON_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  '';

export function isRemoteConfigured() {
  return Boolean(URL && ANON_KEY);
}

let clientPromise = null;

export function getClient() {
  if (!isRemoteConfigured()) {
    return Promise.reject(new Error('Supabase is not configured.'));
  }
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({createClient}) =>
      createClient(URL, ANON_KEY)
    );
  }
  return clientPromise;
}

// ---- sync remote ------------------------------------------------------------
export async function createSupabaseRemote() {
  const supabase = await getClient();
  return {
    async pullAll() {
      const out = {};
      for (const name of COLLECTIONS) {
        const {data, error} = await supabase.from(name).select('data');
        if (error) throw error;
        out[name] = (data || []).map(r => r.data);
      }
      return out;
    },

    async upsert(collection, row) {
      const {error} = await supabase.from(collection).upsert({
        id: row.id,
        updated_at: row.updatedAt || new Date().toISOString(),
        data: row,
      });
      if (error) throw error;
    },

    async remove(collection, id) {
      const {error} = await supabase.from(collection).delete().eq('id', id);
      if (error) throw error;
    },

    subscribe(cb) {
      const channel = supabase
        .channel('buildview-sync')
        .on(
          'postgres_changes',
          {event: '*', schema: 'public'},
          payload => {
            const collection = payload.table;
            if (payload.eventType === 'DELETE') {
              cb(collection, 'delete', payload.old?.id);
            } else if (payload.new?.data) {
              cb(collection, 'upsert', payload.new.data);
            }
          }
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

// ---- auth --------------------------------------------------------------------
export const remoteAuth = {
  // Profile fields ride along in auth metadata so the users row can be created
  // on the first successful sign-in (works with or without email confirmation).
  async signUp(email, password, {name, role, trade}) {
    const supabase = await getClient();
    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {data: {name, role, trade}},
    });
    if (error) throw error;
    return {userId: data.user?.id || null, hasSession: Boolean(data.session)};
  },

  async signIn(email, password) {
    const supabase = await getClient();
    const {data, error} = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
    return {
      userId: data.user.id,
      metadata: data.user.user_metadata || {},
    };
  },

  async getSession() {
    const supabase = await getClient();
    const {data} = await supabase.auth.getSession();
    if (!data.session) return null;
    return {
      userId: data.session.user.id,
      metadata: data.session.user.user_metadata || {},
    };
  },

  async signOut() {
    const supabase = await getClient();
    await supabase.auth.signOut();
  },
};
