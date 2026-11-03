import { createContext, useCallback, useContext, useState } from 'react';
import type { AccessProfile, EventAccess } from '../../types';
import { DEMO_USER, type EventViewer } from '../../lib/events';
import { readStorage, writeStorage } from '../../lib/storage';

// Demo access only. Production signs internal staff in with corporate SSO and
// validates external invitations on the server; see docs/orbita/accesos.md.
export const ACCESS_KEY = 'orbita-access-v1';
export const DEMO_INVITATION_CODE = 'ORBITA-2026';
export const INTERNAL_DEMO_PROFILE: AccessProfile = { kind: 'internal', name: DEMO_USER.name, email: DEMO_USER.email, organization: 'Personal' };
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ACCESS_LABELS: Record<EventAccess, string> = {
  internal: 'Personal interno',
  external: 'Personal externo',
  all: 'Interno y externo',
};

function isAccessProfile(value: unknown): value is AccessProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<AccessProfile>;
  return (profile.kind === 'internal' || profile.kind === 'external') && typeof profile.name === 'string' && profile.name.trim().length > 0
    && typeof profile.email === 'string' && EMAIL_PATTERN.test(profile.email) && typeof profile.organization === 'string';
}

export function readAccess(): AccessProfile | null {
  const stored = readStorage<unknown>(ACCESS_KEY, null);
  return isAccessProfile(stored) ? stored : null;
}

export function useAccessSession() {
  const [access, setAccess] = useState<AccessProfile | null>(readAccess);
  const [signedOut, setSignedOut] = useState(false);
  const signIn = useCallback((profile: AccessProfile) => {
    writeStorage(ACCESS_KEY, profile);
    setSignedOut(false);
    setAccess(profile);
  }, []);
  const signOut = useCallback(() => {
    try { localStorage.removeItem(ACCESS_KEY); } catch { /* the session still closes in memory */ }
    setSignedOut(true);
    setAccess(null);
  }, []);
  return { access, signedOut, signIn, signOut };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'Ó';
}

export function toViewer(profile: AccessProfile): EventViewer {
  return { kind: profile.kind, email: profile.email };
}

export const AccessContext = createContext<AccessProfile>(INTERNAL_DEMO_PROFILE);
export function useAccessProfile() { return useContext(AccessContext); }
export function useViewer(): EventViewer { return toViewer(useContext(AccessContext)); }
