const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
  const response = await fetch(`${base}${path}`, { ...init, credentials: 'include', headers });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'Request failed');
  return body as T;
}
