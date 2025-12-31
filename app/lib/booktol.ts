type BooktolAuthResponse = {
  token?: string;
  access_token?: string;
};

export function sqlString(value: string) {
  return value.replace(/'/g, "''");
}

export function coerceRows(result: any) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

async function getBooktolToken() {
  const baseUrl = process.env.BOOKTOL_BASE_URL;
  const user = process.env.BOOKTOL_AUTH_USER;
  const pass = process.env.BOOKTOL_AUTH_PASS;

  if (!baseUrl || !user || !pass) {
    throw new Error('Missing Booktol credentials');
  }

  const basic = Buffer.from(`${user}:${pass}`).toString('base64');
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/auth`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'User-Agent': 'BooktolClient/1.0 (Next.js)',
      Accept: 'application/json',
    },
  });

  const data = (await res.json()) as BooktolAuthResponse;
  if (!res.ok) {
    throw new Error(`Booktol auth failed: ${res.status}`);
  }

  const token = data.access_token ?? data.token;
  if (!token) {
    throw new Error('Booktol auth response missing token');
  }

  return token;
}

export async function runBooktolQuery(sql: string) {
  const baseUrl = process.env.BOOKTOL_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing Booktol base URL');
  }

  const token = await getBooktolToken();
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BooktolClient/1.0 (Next.js)',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();
  if (!res.ok) {
    const detail =
      (typeof data === 'string' ? data : data?.error || data?.message || data?.detail) ||
      '';
    const message = `Booktol query failed: ${res.status}${detail ? ` - ${detail}` : ''}`;
    const err = new Error(message);
    (err as any).detail = detail;
    throw err;
  }

  return data;
}
