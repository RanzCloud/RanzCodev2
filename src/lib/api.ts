export const TOKEN_KEY = 'ranzcloud_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request gagal (${res.status})`);
  }
  return data;
}

export function formatRupiah(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  return `Rp${n.toLocaleString('id-ID')}`;
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  hosting: 'Hosting SA-MP',
  bot: 'Script Bot',
  gamemode: 'Gamemode SA-MP',
  website: 'Script Website',
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  paid: { label: 'Lunas', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  completed: { label: 'Selesai', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  failed: { label: 'Gagal', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  expired: { label: 'Kedaluwarsa', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
};
