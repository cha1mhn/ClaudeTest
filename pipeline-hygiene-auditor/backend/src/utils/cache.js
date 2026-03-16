const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL, 10) || 300,
  checkperiod: 60,
  useClones: false,
});

function withCache(key, ttl, fetchFn) {
  const cached = cache.get(key);
  if (cached !== undefined) return Promise.resolve(cached);
  return fetchFn().then((data) => {
    cache.set(key, data, ttl);
    return data;
  });
}

function invalidate(prefix) {
  cache.keys().filter((k) => k.startsWith(prefix)).forEach((k) => cache.del(k));
}

module.exports = { cache, withCache, invalidate };
