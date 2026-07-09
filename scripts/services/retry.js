function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff on transient errors
 * (rate limits, timeouts, 5xx). Non-transient errors (e.g. a 404 for a
 * deleted Drive file) are rethrown immediately without wasting retries.
 */
export async function withRetry(fn, { retries = 3, baseDelayMs = 500, label = "operation" } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.code || err.status || err.response?.status;
      const retryable = status === 429 || status === 503 || (typeof status === "number" && status >= 500);
      if (!retryable || attempt === retries) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`  ⚠ ${label} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms: ${err.message}`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Runs `worker` over `items` with at most `limit` running concurrently.
 * Simple hand-rolled pool — avoids pulling in an extra dependency for
 * something this small.
 */
export async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runNext() {
    const i = nextIndex++;
    if (i >= items.length) return;
    results[i] = await worker(items[i], i);
    return runNext();
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, runNext);
  await Promise.all(workers);
  return results;
}
