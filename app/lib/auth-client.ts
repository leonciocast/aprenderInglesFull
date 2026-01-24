export type FetchMeOptions = {
  allowRefresh?: boolean;
};

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('aif_refresh') || '';
}

export async function refreshSessionFromStorage() {
  const token = getStoredRefreshToken();
  if (!token) return false;
  const res = await fetch('/uploader/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });
  return res.ok;
}

export async function fetchMeWithRefresh(options: FetchMeOptions = {}) {
  const { allowRefresh = true } = options;
  const token = getStoredRefreshToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  let res = await fetch('/uploader/api/auth/me', {
    headers,
    credentials: 'include',
  });
  if (res.ok || res.status !== 401 || !allowRefresh) {
    return res;
  }
  const refreshed = await refreshSessionFromStorage();
  if (!refreshed) return res;
  const retryHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  res = await fetch('/uploader/api/auth/me', {
    headers: retryHeaders,
    credentials: 'include',
  });
  return res;
}
