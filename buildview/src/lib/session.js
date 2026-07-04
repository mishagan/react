import {useEffect, useState} from 'react';
import {db} from '../data/db.js';
import {useDbVersion} from './useDb.js';
import {
  getMode,
  isRemoteConfigured,
  resumeRemoteSession,
  remoteSignOut,
} from './remoteSession.js';

// The current logged-in user. Sandbox mode resolves the fake session id from
// the seam; remote mode resumes the Supabase session on boot (async, hence
// `booting`) and signs out through the remote. Re-renders on any data change.
export function useSession() {
  useDbVersion();
  const [booting, setBooting] = useState(
    () => isRemoteConfigured() && getMode() === 'remote'
  );

  useEffect(() => {
    if (!booting) return;
    let alive = true;
    resumeRemoteSession().finally(() => {
      if (alive) setBooting(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userId = db.session.getCurrentUserId();
  const user = userId ? db.users.get(userId) : null;

  return {
    user, // null when logged out (or the stored id no longer exists)
    booting, // true while a remote session is being resumed
    login: id => db.session.setCurrentUserId(id),
    logout: () => {
      if (getMode() === 'remote') void remoteSignOut();
      else db.session.clear();
    },
  };
}
