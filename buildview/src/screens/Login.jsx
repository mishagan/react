import React, {useState} from 'react';
import {db} from '../data/db.js';
import {useDbVersion} from '../lib/useDb.js';
import {createUser} from '../domain/entities.js';
import {loadDemoData} from '../demo/seed.js';
import {
  isRemoteConfigured,
  remoteSignIn,
  remoteSignUp,
} from '../lib/remoteSession.js';
import {
  ROLES,
  ROLE_LIST,
  TRADES,
  WORKER_TRADES,
} from '../domain/constants.js';
import {
  Button,
  Card,
  SectionTitle,
  Field,
  TextInput,
  Select,
} from '../components/ui.jsx';

// Real team account (remote mode): Supabase email/password sign-in + sign-up.
// Profile fields are captured at sign-up and become the users row on first
// successful session. Shown only when a remote is configured at build time.
function RemoteAuth({onLogin}) {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES.FOREMAN);
  const [trade, setTrade] = useState(WORKER_TRADES[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (tab === 'signin') {
        const userId = await remoteSignIn(email, password);
        onLogin(userId);
      } else {
        const profile = {
          name: name.trim() || email.split('@')[0],
          role,
          trade: role === ROLES.FOREMAN ? TRADES.NONE : trade,
        };
        const res = await remoteSignUp(email, password, profile);
        if (res.pendingConfirmation) {
          setMessage('Check your email to confirm the account, then sign in.');
          setTab('signin');
        } else {
          onLogin(res.userId);
        }
      }
    } catch (err) {
      setMessage(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const tabCls = active =>
    `flex-1 rounded-md px-3 py-2 text-sm font-bold transition ${
      active ? 'bg-steel text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    }`;

  return (
    <section>
      <SectionTitle>Team account</SectionTitle>
      <Card className="p-4">
        <div className="mb-4 flex gap-2">
          <button type="button" className={tabCls(tab === 'signin')} onClick={() => setTab('signin')}>
            Sign in
          </button>
          <button type="button" className={tabCls(tab === 'signup')} onClick={() => setTab('signup')}>
            Create account
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Email">
            <TextInput
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            />
          </Field>
          {tab === 'signup' && (
            <>
              <Field label="Name">
                <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Role">
                <Select
                  value={role}
                  onChange={e => setRole(e.target.value)}>
                  {ROLE_LIST.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              {role === ROLES.WORKER && (
                <Field label="Trade">
                  <Select value={trade} onChange={e => setTrade(e.target.value)}>
                    {WORKER_TRADES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Working…' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
          {message && <p className="text-sm font-medium text-steel">{message}</p>}
        </form>
      </Card>
    </section>
  );
}

// Screen 1: Login / pick user (prototype only, no passwords).
// Pick an existing user, or create one (name, role, trade).
export default function Login({onLogin, onBack}) {
  useDbVersion();
  const users = db.users.list();

  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES.FOREMAN);
  const [trade, setTrade] = useState(TRADES.NONE);

  // Foremen are trade "none"; workers pick a real trade.
  const isForeman = role === ROLES.FOREMAN;

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const finalTrade = isForeman ? TRADES.NONE : trade;
    const user = createUser({name: name.trim(), role, trade: finalTrade});
    setName('');
    onLogin(user.id);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-brand/20 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-electric/20 blur-3xl animate-float" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 self-start text-sm font-semibold text-white/70 transition hover:text-white">
            ← Back to home
          </button>
        )}
        <div className="animate-fade-up text-center">
          <span className="font-display text-4xl font-bold tracking-tight">
            BUILD<span className="text-brand">VIEW</span>
          </span>
          <p className="mt-2 text-sm text-white/60">
            Sign in, create an account, or load the demo site.
          </p>
        </div>

        <div className="animate-fade-up delay-1 mt-6 space-y-5 rounded-3xl border border-white/10 bg-white p-5 text-zinc-900 shadow-[var(--shadow-lift)]">
        {isRemoteConfigured() && <RemoteAuth onLogin={onLogin} />}
        <section>
          <SectionTitle>{isRemoteConfigured() ? 'Local sandbox demo' : 'Demo'}</SectionTitle>
          <Card className="space-y-3 p-4">
            <p className="text-sm text-zinc-600">
              Load a ready-made demo site (foreman, workers, rooms, tasks,
              photos and an open issue) and jump straight in as the foreman.
              This replaces any existing data.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                const {foremanId} = loadDemoData();
                onLogin(foremanId);
              }}>
              Load demo site &amp; enter as foreman
            </Button>
          </Card>
        </section>

        <section>
          <SectionTitle>Pick a user</SectionTitle>
          <Card className="p-4">
            {users.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No users yet. Create one below.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200">
                {users.map(u => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm">
                      <span className="font-semibold text-zinc-800">
                        {u.name}
                      </span>{' '}
                      <span className="text-zinc-500">
                        · {u.role}
                        {u.role === ROLES.WORKER ? ` · ${u.trade}` : ''}
                      </span>
                    </span>
                    <Button onClick={() => onLogin(u.id)}>Log in</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle>Or create a user</SectionTitle>
          <Card className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <Field label="Name">
                <TextInput
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Role">
                <Select
                  value={role}
                  onChange={e => {
                    const r = e.target.value;
                    setRole(r);
                    setTrade(r === ROLES.FOREMAN ? TRADES.NONE : WORKER_TRADES[0]);
                  }}>
                  {ROLE_LIST.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              {!isForeman && (
                <Field label="Trade">
                  <Select
                    value={trade}
                    onChange={e => setTrade(e.target.value)}>
                    {WORKER_TRADES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Button type="submit" className="w-full">
                Create &amp; log in
              </Button>
            </form>
          </Card>
        </section>
        </div>
      </div>
    </div>
  );
}
