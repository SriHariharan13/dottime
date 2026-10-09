export const deviceId = (() => {
  let id = localStorage.getItem('dottime-device');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('dottime-device', id); }
  return id;
})();

async function call(url, opts = {}) {
  const res = await fetch('/api' + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

export const getSettings = () => call(`/settings/${deviceId}`);
export const saveSettings = (s) => call(`/settings/${deviceId}`, { method: 'PUT', body: JSON.stringify(s) });
export const logSession = (s) => call('/sessions', { method: 'POST', body: JSON.stringify({ deviceId, ...s }) });
export const getStats = () => {
  const since = new Date(); since.setHours(0, 0, 0, 0);
  return call(`/sessions/${deviceId}/stats?since=${since.toISOString()}`);
};
