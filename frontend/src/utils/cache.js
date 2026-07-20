// Global in-memory cache shared across all pages
// TTL: 30s for live data, 5min for static data (members, summaries)
const store = {};

export function getCache(key) {
  const e = store[key];
  if (!e) return null;
  if (Date.now() - e.ts > e.ttl) { delete store[key]; return null; }
  return e.data;
}

export function setCache(key, data, ttl = 30000) {
  store[key] = { data, ts: Date.now(), ttl };
}

export function clearCache(...keys) {
  if (keys.length === 0) Object.keys(store).forEach(k => delete store[k]);
  else keys.forEach(k => delete store[k]);
}

export function clearCachePrefix(prefix) {
  Object.keys(store).filter(k => k.startsWith(prefix)).forEach(k => delete store[k]);
}
