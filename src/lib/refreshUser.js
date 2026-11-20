// The dashboard keeps a copy of the user in localStorage ("vaultex_user"), saved
// at login. Balances change on the server (deposits approved, investments made,
// payouts released), so that copy goes stale. This pulls the latest numbers
// from the server and updates the copy. Returns the fresh user, or null if the
// request failed (offline etc.), in which case the old copy is simply kept.
export async function refreshUser() {
  try {
    const res = await fetch('/api/user/me');
    if (!res.ok) return null;
    const { user } = await res.json();

    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('vaultex_user') || '{}'); } catch {}

    const merged = { ...stored, ...user };
    localStorage.setItem('vaultex_user', JSON.stringify(merged));
    window.dispatchEvent(new Event('vaultex:user-updated'));
    return merged;
  } catch {
    return null;
  }
}