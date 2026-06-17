/* Rate limiter in-memory simples para Vercel serverless.
   Nota: cada instância tem seu próprio store — para rate limiting
   distribuído em produção, use Upstash Redis. */
const store = new Map();

function cleanup() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.reset) store.delete(k);
  }
}

module.exports = function rateLimit(ip, max, windowMs) {
  const now = Date.now();
  if (store.size > 5000) cleanup();
  const key = String(ip || "unknown");
  const entry = store.get(key) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  store.set(key, entry);
  return entry.count <= max;
};
