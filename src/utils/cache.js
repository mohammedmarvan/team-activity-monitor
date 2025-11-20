const cache = {};
const TTL = 60 * 1000;

export function setCache(key, data) {
  cache[key] = {
    data,
    expiry: Date.now() + TTL,
  };
}

export function getCache(key) {
  const cached = cache[key];
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    delete cache[key];
    return null;
  }
  return cached.data;
}
