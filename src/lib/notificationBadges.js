'use client';

// Notification badges for the History pages in the dashboard sidebar.
//
// How it works:
//   • Every deposit / withdrawal / investment the user submits, and every status
//     change an admin makes to one, creates a row in the existing Notification
//     table (type DEPOSIT / WITHDRAWAL / INVESTMENT, isRead = false).
//   • The badge on a History page is simply the number of UNREAD notifications
//     of that type.
//   • Opening a History page marks that type as read, which clears its badge.
//
// The dashboard layout mounts <NotificationBadgesProvider> once. It fetches the
// counts, then keeps them fresh by re-checking every 30 seconds, whenever the
// tab regains focus, and instantly when any page calls announceBadgeChange()
// (for example right after the user submits a deposit).

import { createContext, useContext, useState, useEffect } from 'react';

// Notification types that feed a History page badge.
export const BADGE_TYPES = ['INVESTMENT', 'DEPOSIT', 'WITHDRAWAL', 'KYC'];

export const BADGES_EVENT = 'vaultex:badges-changed';
const POLL_MS = 30 * 1000;

const EMPTY_COUNTS = { INVESTMENT: 0, DEPOSIT: 0, WITHDRAWAL: 0, KYC: 0 };

// Tell the provider to re-fetch the counts right now.
export function announceBadgeChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BADGES_EVENT));
}

// Called by a History page once it has shown the user their records.
export async function markHistorySeen(type) {
  try {
    await fetch('/api/user/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    announceBadgeChange();
  } catch {
    // Not critical: the badge just clears next time.
  }
}

const BadgesContext = createContext(EMPTY_COUNTS);

// { INVESTMENT: n, DEPOSIT: n, WITHDRAWAL: n }
export function useBadges() {
  return useContext(BadgesContext);
}

export function NotificationBadgesProvider({ children }) {
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/user/notifications/badges', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const next = { ...EMPTY_COUNTS, ...data.counts };
        // Keep the same object when nothing changed so the sidebar doesn't re-render for no reason.
        setCounts((prev) =>
          BADGE_TYPES.every((t) => prev[t] === next[t]) ? prev : next
        );
      } catch {
        // Offline or a server hiccup: keep showing the last known counts.
      }
    };

    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    window.addEventListener('focus', load);
    window.addEventListener(BADGES_EVENT, load);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', load);
      window.removeEventListener(BADGES_EVENT, load);
    };
  }, []);

  return <BadgesContext.Provider value={counts}>{children}</BadgesContext.Provider>;
}
