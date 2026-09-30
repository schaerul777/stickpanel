import { useSyncExternalStore } from 'react';
import { getMasterState } from './masterStore';

// ─── Prototype-only simulation state for Client Profile pages ─────────────────
// "Active Company" (which company you're viewing Client Profile data as) and a
// dev-only permission-toggle panel. Both are scoped to Client Profile pages only
// and persist to localStorage, mirroring how core selection persists.

const ACTIVE_COMPANY_KEY = 'stickpanel.clientProfile.activeCompany';
const PERMISSIONS_KEY = 'stickpanel.clientProfile.permissions';

export const PERMISSION_KEYS = [
  'client-profile:write',
  'client-profile:delete',
  'client-profile:verify',
  'client-profile.company:write',
  'client-contact:write',
  'client-billing:read',
  'client-billing:write',
  'client-bank-account:read',
  'client-bank-account:write',
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'client-profile:write': 'Create / edit client profile',
  'client-profile:delete': 'Delete client profile',
  'client-profile:verify': 'Verify client profile',
  'client-profile.company:write': 'Add / edit / remove company link',
  'client-contact:write': 'Create / edit contact',
  'client-billing:read': 'View billings',
  'client-billing:write': 'Create / edit / delete billing',
  'client-bank-account:read': 'View bank accounts',
  'client-bank-account:write': 'Create / edit / delete bank account',
};

type Listener = () => void;

interface UIState {
  activeCompanyId: string;
  permissions: Record<PermissionKey, boolean>;
}

function defaultCompanyId(): string {
  const companies = getMasterState().companies.filter(c => c.deletedAt === null);
  return companies[0]?.id ?? '';
}

function loadActiveCompanyId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_COMPANY_KEY);
    if (stored && getMasterState().companies.some(c => c.id === stored)) return stored;
  } catch { /* ignore */ }
  return defaultCompanyId();
}

function defaultPermissions(): Record<PermissionKey, boolean> {
  return Object.fromEntries(PERMISSION_KEYS.map(k => [k, true])) as Record<PermissionKey, boolean>;
}

function loadPermissions(): Record<PermissionKey, boolean> {
  try {
    const stored = localStorage.getItem(PERMISSIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPermissions(), ...parsed };
    }
  } catch { /* ignore */ }
  return defaultPermissions();
}

let state: UIState = {
  activeCompanyId: loadActiveCompanyId(),
  permissions: loadPermissions(),
};

const listeners = new Set<Listener>();
function emit() { listeners.forEach(l => l()); }

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() { return state; }

export function useClientProfileUI(): UIState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setActiveCompany(companyId: string) {
  state = { ...state, activeCompanyId: companyId };
  try { localStorage.setItem(ACTIVE_COMPANY_KEY, companyId); } catch { /* ignore */ }
  emit();
}

export function setPermission(key: PermissionKey, value: boolean) {
  state = { ...state, permissions: { ...state.permissions, [key]: value } };
  try { localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(state.permissions)); } catch { /* ignore */ }
  emit();
}

export function getActiveCompanyId(): string {
  return state.activeCompanyId;
}

export function hasPermission(key: PermissionKey): boolean {
  return state.permissions[key];
}
