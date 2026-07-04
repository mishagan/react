// Base-aware asset URLs. Vite rewrites import.meta.env.BASE_URL at build time
// ('/' in dev, the configured base on e.g. GitHub Pages). The guard keeps this
// importable from plain Node (flow checks / SSR tooling), where import.meta.env
// does not exist.
const BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.BASE_URL) ||
  '/';

// asset('demo-assets/x.jpg') -> '/demo-assets/x.jpg' or '/react/demo-assets/x.jpg'
export function asset(path) {
  return BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}
