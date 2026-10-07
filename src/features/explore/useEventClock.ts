import { useEffect, useState } from 'react';
import type { EventItem } from '../../types';

/** Refresh at event boundaries and when returning to a backgrounded tab. */
export function useEventClock(events: EventItem[]): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      const nextBoundary = events
        .filter(event => event.status === 'published')
        .flatMap(event => [new Date(event.date).getTime(), new Date(event.endDate).getTime()])
        .filter(timestamp => timestamp > current)
        .reduce((next, timestamp) => Math.min(next, timestamp), Infinity);
      if (Number.isFinite(nextBoundary)) {
        timer = setTimeout(refresh, Math.min(nextBoundary - current, 2_147_483_647));
      }
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [events]);

  return now;
}
