const API = '';

async function request(path, options = {}) {
  const url = `${API}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export function get(path) { return request(path); }
export function post(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); }
export function patch(path, body) { return request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
export function put(path, body) { return request(path, { method: 'PUT', body: JSON.stringify(body) }); }
