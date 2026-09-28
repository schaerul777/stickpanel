import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CORE_IDS, CORE_META, type CoreId } from './coreConfig';

const STORAGE_KEY = 'stickpanel.activeCore';
const DEFAULT_CORE: CoreId = 'core-2';

function coreFromPathname(pathname: string): CoreId | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return (CORE_IDS as readonly string[]).includes(segment) ? (segment as CoreId) : null;
}

export function getPersistedCore(): CoreId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (CORE_IDS as readonly string[]).includes(stored)) return stored as CoreId;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_CORE;
}

interface CoreContextValue {
  activeCore: CoreId;
  setActiveCore: (core: CoreId) => void;
}

const CoreContext = createContext<CoreContextValue | null>(null);

export function CoreProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeCore = useMemo<CoreId>(
    () => coreFromPathname(location.pathname) ?? DEFAULT_CORE,
    [location.pathname],
  );

  // Keep localStorage in sync with whatever core the URL says is active, so a
  // reload at "/" or a direct link restores the last core visited.
  useEffect(() => {
    const urlCore = coreFromPathname(location.pathname);
    if (urlCore) {
      try { localStorage.setItem(STORAGE_KEY, urlCore); } catch { /* ignore */ }
    }
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${CORE_META[activeCore].label} · StickPanel`;
  }, [activeCore]);

  const setActiveCore = (core: CoreId) => {
    if (core === activeCore) return;
    navigate(CORE_META[core].defaultPath);
  };

  const value = useMemo(() => ({ activeCore, setActiveCore }), [activeCore]);

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}

export function useCore(): CoreContextValue {
  const ctx = useContext(CoreContext);
  if (!ctx) throw new Error('useCore must be used within a CoreProvider');
  return ctx;
}
