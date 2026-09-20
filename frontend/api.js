export async function api(path, options={}) {
  const res = await fetch(path, {
    headers: {
      "Content-Type":"application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

export const endpoints = {
  campaigns: "/campaigns",
  approvals: "/approvals?status=pending",
  meetings: "/meetings",
  health: "/health/services",
  killSwitch: "/global-settings/kill-switch"
};