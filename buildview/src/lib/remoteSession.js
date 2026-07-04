// =============================================================================
// Remote session orchestration: ties auth + namespace + sync together.
//
// Modes:
//   sandbox (default) — classic local storage; demo & fake user picker.
//   remote            — real Supabase account; cache under ':remote' and the
//                       sync engine running. Sandbox data is never mixed in.
// =============================================================================
import {db} from '../data/db.js';
import {startSync, stopSync} from '../data/sync.js';
import {
  isRemoteConfigured,
  createSupabaseRemote,
  remoteAuth,
} from '../data/remote/supabaseRemote.js';
import {ROLES, TRADES} from '../domain/constants.js';

export {isRemoteConfigured};

const MODE_KEY = 'buildview:mode:v1';

export function getMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'remote' ? 'remote' : 'sandbox';
  } catch {
    return 'sandbox';
  }
}

function setMode(mode) {
  try {
    if (mode === 'remote') localStorage.setItem(MODE_KEY, 'remote');
    else localStorage.removeItem(MODE_KEY);
  } catch {
    /* non-fatal */
  }
}

// Bring the synced store up for an authenticated user and make sure their
// profile row exists (created from auth metadata on first sign-in).
async function enterRemote(userId, metadata) {
  db.__setNamespace(':remote');
  await startSync(await createSupabaseRemote());
  if (!db.users.get(userId)) {
    db.users.create({
      id: userId,
      name: metadata.name || 'New user',
      role: metadata.role === ROLES.WORKER ? ROLES.WORKER : ROLES.FOREMAN,
      trade: metadata.trade || TRADES.NONE,
    });
  }
  setMode('remote');
  db.session.setCurrentUserId(userId);
  return userId;
}

export async function remoteSignIn(email, password) {
  const {userId, metadata} = await remoteAuth.signIn(email, password);
  return enterRemote(userId, metadata);
}

// Returns {userId} on instant session, or {pendingConfirmation: true} when the
// project requires email confirmation first.
export async function remoteSignUp(email, password, profile) {
  const {userId, hasSession} = await remoteAuth.signUp(email, password, profile);
  if (!hasSession) return {pendingConfirmation: true};
  await enterRemote(userId, profile);
  return {userId};
}

// On app boot: resume a still-valid Supabase session (returns userId or null).
export async function resumeRemoteSession() {
  if (!isRemoteConfigured() || getMode() !== 'remote') return null;
  try {
    const session = await remoteAuth.getSession();
    if (!session) {
      leaveRemoteLocal();
      return null;
    }
    return await enterRemote(session.userId, session.metadata);
  } catch (err) {
    // Offline boot: keep the cached remote copy usable; sync will catch up
    // next launch. If we can't even read the cache user, fall back to logout.
    console.error('BuildView: could not resume remote session.', err);
    db.__setNamespace(':remote');
    return db.session.getCurrentUserId();
  }
}

function leaveRemoteLocal() {
  stopSync();
  setMode('sandbox');
  db.session.clear();
  db.__setNamespace('');
}

export async function remoteSignOut() {
  try {
    await remoteAuth.signOut();
  } catch {
    /* signing out locally regardless */
  }
  leaveRemoteLocal();
}
