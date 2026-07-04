import React, {useEffect, useRef, useState} from 'react';
import {asset} from '../lib/assets.js';

// -----------------------------------------------------------------------------
// Landing / cover page — shown before sign-in. Animated, modern marketing page:
// a CSS-3D isometric "site hologram" hero with mouse parallax, scroll-reveal
// sections, a tilted product-screenshot gallery, and the sign-in/demo funnel.
//
// Motion is CSS-first: SSR/no-JS renders fully visible (screenshot-safe);
// IntersectionObserver and the parallax tilt are hydration-only enhancements.
// prefers-reduced-motion is respected globally (index.css) and per-effect.
// -----------------------------------------------------------------------------
export default function Landing({onSignIn, onLaunchDemo}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white selection:bg-brand selection:text-brand-fg">
      <Nav onSignIn={onSignIn} onLaunchDemo={onLaunchDemo} />
      <Hero onSignIn={onSignIn} onLaunchDemo={onLaunchDemo} />
      <Marquee />
      <Stats />
      <Pipeline />
      <Screens />
      <Features />
      <Personas onLaunchDemo={onLaunchDemo} />
      <CTA onSignIn={onSignIn} onLaunchDemo={onLaunchDemo} />
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------- motion helpers */
// Scroll reveal: visible by default (SSR/no-JS/above-fold); below-fold content
// is hidden after hydration and animates in when it enters the viewport.
function Reveal({children, className = '', delay = 0}) {
  const ref = useRef(null);
  const [phase, setPhase] = useState('static');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setPhase('pre');
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPhase('anim');
          io.disconnect();
        }
      },
      {threshold: 0.12}
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${phase === 'pre' ? 'reveal-pre' : phase === 'anim' ? 'reveal-in' : ''} ${className}`}
      style={phase === 'anim' && delay ? {animationDelay: `${delay}ms`} : undefined}>
      {children}
    </div>
  );
}

// Pointer parallax for the 3D hero (no-op before hydration / reduced motion).
function useTilt(max = 7) {
  const [tilt, setTilt] = useState({x: 0, y: 0});
  const onMouseMove = e => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2 * max,
      y: ((e.clientY - r.top) / r.height - 0.5) * -2 * max,
    });
  };
  const onMouseLeave = () => setTilt({x: 0, y: 0});
  return {tilt, onMouseMove, onMouseLeave};
}

/* ------------------------------------------------------------------ buttons */
function Accent({className = '', ...p}) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-brand-fg shadow-[0_10px_30px_-8px_rgba(245,158,11,0.6)] transition duration-150 hover:bg-amber-400 hover:shadow-[0_14px_40px_-8px_rgba(245,158,11,0.8)] active:scale-[0.98] ${className}`}
      {...p}
    />
  );
}
function Ghost({className = '', ...p}) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition duration-150 hover:border-white/40 hover:bg-white/10 active:scale-[0.98] ${className}`}
      {...p}
    />
  );
}
function Logo({className = ''}) {
  return (
    <span className={`font-display text-xl font-bold tracking-tight ${className}`}>
      BUILD<span className="text-brand">VIEW</span>
    </span>
  );
}

/* ---------------------------------------------------------------------- nav */
function Nav({onSignIn, onLaunchDemo}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 glass">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Logo />
        <nav className="ml-6 hidden gap-6 text-sm text-white/70 md:flex">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#screens" className="transition hover:text-white">Product</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#teams" className="transition hover:text-white">For teams</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Ghost className="hidden sm:inline-flex" onClick={onSignIn}>Sign in</Ghost>
          <Accent onClick={onLaunchDemo}>Launch demo</Accent>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------------- hero */
function Hero({onSignIn, onLaunchDemo}) {
  const {tilt, onMouseMove, onMouseLeave} = useTilt(7);
  return (
    <section
      className="noise relative"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}>
      <Backdrop />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">
            <span className="size-2 rounded-full bg-go animate-blink" />
            Construction execution platform
          </span>
          <h1 className="animate-fade-up delay-1 text-hero mt-5 font-display font-bold">
            Run the whole site
            <br />
            from <span className="text-gradient">one screen.</span>
          </h1>
          <p className="animate-fade-up delay-2 mt-5 max-w-md text-lg leading-relaxed text-white/70">
            BuildView turns plans into action: project → building → floor →
            room → task → photo → issue → dashboard. Every trade, every
            status, live.
          </p>
          <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <Accent onClick={onLaunchDemo}>
              Launch live demo
              <Arrow />
            </Accent>
            <Ghost onClick={onSignIn}>Sign in / Register</Ghost>
          </div>
          <div className="animate-fade-in delay-5 mt-8 flex items-center gap-5 text-xs text-white/50">
            <span>No setup — demo loads instantly</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Foreman & worker views</span>
          </div>
        </div>

        <SiteHologram tilt={tilt} />
      </div>
    </section>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-48 -left-32 size-[42rem] rounded-full bg-brand/20 blur-3xl animate-float-slow" />
      <div className="absolute top-10 -right-40 size-[36rem] rounded-full bg-electric/20 blur-3xl animate-float" />
      <div className="absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-progress/20 blur-3xl animate-float-slow" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
    </div>
  );
}

// The 3D hero: an isometric stack of floor plates ("the building"), the top
// floor showing live room statuses. Parallax-tilts with the pointer.
const PLATE_ROOMS = [
  ['rgba(37,99,235,0.75)', 'rgba(22,163,74,0.75)', 'rgba(255,255,255,0.14)', 'rgba(220,38,38,0.75)'],
  ['rgba(255,255,255,0.10)', 'rgba(37,99,235,0.45)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.10)'],
  ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(22,163,74,0.35)', 'rgba(255,255,255,0.08)'],
];

function SiteHologram({tilt}) {
  return (
    <div className="animate-scale-in delay-2 relative mx-auto w-full max-w-md">
      <div className="persp">
        <div
          className="transition-transform duration-300 ease-out will-change-transform"
          style={{transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`}}>
          <div className="preserve-3d iso-sway relative mx-auto aspect-square w-72 sm:w-80">
            {/* glow under the stack */}
            <div className="absolute inset-6 rounded-3xl bg-brand/25 blur-3xl" />
            {PLATE_ROOMS.map((rooms, i) => {
              const z = (PLATE_ROOMS.length - 1 - i) * 64;
              return (
                <div
                  key={i}
                  className="plate-rise absolute inset-0 rounded-2xl border border-white/25 bg-ink-2/70 p-3 shadow-2xl backdrop-blur"
                  style={{
                    '--z': `${z}px`,
                    animationDelay: `${0.25 + (PLATE_ROOMS.length - 1 - i) * 0.18}s`,
                  }}>
                  <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
                    {rooms.map((c, j) => (
                      <div
                        key={j}
                        className="rounded-lg border border-white/15"
                        style={{backgroundColor: c}}
                      />
                    ))}
                  </div>
                  {i === 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[11px] font-bold whitespace-nowrap text-brand-fg shadow-lg">
                      Floor 3 · live
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* floating notification chips (outside the 3D transform) */}
      <Chip className="-top-2 -left-2 animate-float" color="bg-hazard">⚠ Issue raised · Bedroom</Chip>
      <Chip className="-bottom-3 right-0 animate-float-slow" color="bg-go">✓ Task done · Bathroom</Chip>
      <Chip className="top-1/2 -right-3 animate-float" color="bg-progress">📷 Photo uploaded</Chip>
    </div>
  );
}

function Chip({children, className = '', color}) {
  return (
    <div className={`absolute z-10 ${className} flex items-center gap-2 rounded-full border border-white/15 bg-ink-2/90 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur`}>
      <span className={`size-2 rounded-full ${color}`} />
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- marquee */
function Marquee() {
  const items = ['Electrician', 'Plumber', 'Painter', 'Tiler', 'Drywall', 'HVAC', 'General', 'Foreman'];
  const row = [...items, ...items];
  return (
    <div className="mask-x border-y border-white/10 bg-white/[0.02] py-4">
      <div className="flex w-max animate-marquee gap-3 whitespace-nowrap hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/60">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- stats */
function Stats() {
  const stats = [
    ['5', 'guided site flows'],
    ['57', 'automated checks'],
    ['4', 'live room statuses'],
    ['1', 'click to full demo'],
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 pt-14">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([n, label], i) => (
          <Reveal key={label} delay={i * 90}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <div className="font-display text-4xl font-bold text-gradient">{n}</div>
              <div className="mt-1 text-xs font-semibold tracking-wide text-white/60 uppercase">
                {label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- pipeline */
function Pipeline() {
  const steps = [
    ['Project', '🏗'],
    ['Building', '🏢'],
    ['Floor', '🗺'],
    ['Room', '🚪'],
    ['Task', '🧰'],
    ['Photo / Issue', '📷'],
    ['Dashboard', '📊'],
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-display mt-3 max-w-2xl font-display font-bold">
          One clear chain from the plan to the proof.
        </h2>
      </Reveal>
      <Reveal delay={120}>
        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-4">
          {steps.map(([label, icon], i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition duration-300 hover:border-brand/40 hover:bg-white/10">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <span className="text-brand">
                  <Arrow />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------- product screenshots */
function Screens() {
  const shots = [
    [asset('demo-assets/screens/floor-plan.jpg'), 'Plan-first floor view', 'md:rotate-y-12 md:rotate-1 md:hover:rotate-y-0 md:hover:rotate-0'],
    [asset('demo-assets/screens/site-control.jpg'), 'Foreman site control', 'z-10 md:scale-105'],
    [asset('demo-assets/screens/job-card.jpg'), 'Worker job card', 'md:-rotate-y-12 md:-rotate-1 md:hover:rotate-y-0 md:hover:rotate-0'],
  ];
  return (
    <section id="screens" className="relative mx-auto max-w-6xl px-5 py-20">
      <Reveal className="text-center">
        <Eyebrow center>The product</Eyebrow>
        <h2 className="text-display mx-auto mt-3 max-w-xl font-display font-bold">
          Real screens. Real data. Zero mockups.
        </h2>
      </Reveal>
      <div className="persp mt-12 grid gap-6 md:grid-cols-3">
        {shots.map(([src, label, pose], i) => (
          <Reveal key={label} delay={i * 130}>
            <figure
              className={`group overflow-hidden rounded-3xl border border-white/15 bg-ink-2 shadow-[var(--shadow-lift)] transition duration-500 ${pose}`}>
              <img
                src={src}
                alt={label}
                className="w-full transition duration-500 group-hover:scale-[1.02]"
              />
              <figcaption className="border-t border-white/10 px-4 py-3 text-sm font-semibold text-white/80">
                {label}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- features */
function Features() {
  const features = [
    ['Plan-first floor view', 'A clean floor map where every room is colour-coded by live status — to do, in progress, blocked, done.', planIcon],
    ['Worker job card', 'Field-first task cards: next job, instruction, and one-tap Start, Photo, Issue, Done.', cardIcon],
    ['Site control', 'The foreman runs the whole site from one screen: blocked rooms, open issues, work for review.', controlIcon],
    ['Issues & photos', 'Raise issues with evidence photos; attach completion shots to any task. Nothing gets lost.', issueIcon],
    ['Report / investor view', 'A read-only transparency snapshot: progress, blockers and recent photos for stakeholders.', reportIcon],
    ['Instant demo data', 'Load a realistic site in one click — rooms, trades, tasks, photos and a live issue.', boltIcon],
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Eyebrow>Features</Eyebrow>
        <h2 className="text-display mt-3 max-w-2xl font-display font-bold">
          Built like a tool you'd actually use on site.
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([title, desc, Icon], i) => (
          <Reveal key={title} delay={(i % 3) * 110}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand/40">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand/15 text-brand transition group-hover:bg-brand group-hover:text-brand-fg">
                <Icon />
              </div>
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{desc}</p>
              <div className="mt-4 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- personas */
function Personas({onLaunchDemo}) {
  const people = [
    ['Foreman', 'Control the build', 'Assign work, approve access, clear blockers and watch progress climb.', asset('demo-assets/floor-plans/demo-apartment.svg'), 'object-contain bg-white'],
    ['Worker', 'Just the next job', 'Open the app, see your task, do it, snap a photo, mark it done.', asset('demo-assets/site-photos/workers-on-site-mekis.jpg'), 'object-cover'],
    ['Investor', 'Total transparency', 'A live report proves the site is on track — no site visit required.', asset('demo-assets/site-photos/construction-site-ahsmann.jpg'), 'object-cover'],
  ];
  return (
    <section id="teams" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Eyebrow>For everyone on site</Eyebrow>
        <h2 className="text-display mt-3 max-w-2xl font-display font-bold">
          One platform, every role.
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {people.map(([role, tag, desc, img, fit], i) => (
          <Reveal key={role} delay={i * 120}>
            <div className="group h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:border-white/25">
              <div className="h-44 overflow-hidden bg-ink-2">
                <img
                  src={img}
                  alt={role}
                  className={`h-full w-full ${fit} transition duration-500 group-hover:scale-105`}
                />
              </div>
              <div className="p-6">
                <div className="text-xs font-semibold tracking-wide text-brand uppercase">{role}</div>
                <h3 className="mt-1 font-display text-xl font-bold">{tag}</h3>
                <p className="mt-2 text-sm text-white/65">{desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={200}>
        <div className="mt-10 text-center">
          <Accent onClick={onLaunchDemo}>See all three views in the demo</Accent>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------------------- CTA */
function CTA({onSignIn, onLaunchDemo}) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <Reveal>
        <div className="noise relative overflow-hidden rounded-[2rem] border border-brand/30 bg-gradient-to-br from-brand/25 via-ink-2 to-ink-2 p-10 text-center animate-gradient sm:p-16">
          <div className="pointer-events-none absolute -top-20 left-1/2 size-80 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold sm:text-5xl">
            See a live construction site
            <br className="hidden sm:block" /> in 30 seconds.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-white/70">
            No sign-up needed for the demo. Or create an account and start your
            own project.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Accent onClick={onLaunchDemo}>Launch live demo</Accent>
            <Ghost onClick={onSignIn}>Create an account</Ghost>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */
function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-white/50 sm:flex-row">
        <Logo className="text-base" />
        <span>Construction execution platform · demo build</span>
        <span>© BuildView</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ shared */
function Eyebrow({children, center}) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand uppercase ${center ? 'justify-center' : ''}`}>
      <span className="h-px w-8 bg-brand" />
      {children}
      {center && <span className="h-px w-8 bg-brand" />}
    </span>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* icons (inline, currentColor) */
const ico = {width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true};
const stroke = {stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'};
function planIcon() { return (<svg {...ico}><rect x="3" y="3" width="18" height="18" rx="2" {...stroke} /><path d="M12 3v18M3 12h9M12 8h9" {...stroke} /></svg>); }
function cardIcon() { return (<svg {...ico}><rect x="4" y="3" width="16" height="18" rx="2" {...stroke} /><path d="M8 8h8M8 12h8M8 16h4" {...stroke} /></svg>); }
function controlIcon() { return (<svg {...ico}><path d="M4 6h16M4 12h16M4 18h16" {...stroke} /><circle cx="9" cy="6" r="2" {...stroke} /><circle cx="15" cy="12" r="2" {...stroke} /><circle cx="8" cy="18" r="2" {...stroke} /></svg>); }
function issueIcon() { return (<svg {...ico}><path d="M12 3l9 16H3z" {...stroke} /><path d="M12 10v4M12 17h.01" {...stroke} /></svg>); }
function reportIcon() { return (<svg {...ico}><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" {...stroke} /><path d="M9 9h6M9 13h6M9 17h3" {...stroke} /></svg>); }
function boltIcon() { return (<svg {...ico}><path d="M13 3L4 14h7l-1 7 9-11h-7z" {...stroke} /></svg>); }
