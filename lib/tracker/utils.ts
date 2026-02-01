export function uid() {
  return crypto.randomUUID();
}

export function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function daysSince(iso?: string) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
