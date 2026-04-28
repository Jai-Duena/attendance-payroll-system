import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { companyApi, type CompanyProfile } from '@/lib/api';

// ── Module-level variable for non-React access (e.g. print windows) ──────────
export let currentCompanyName = 'Family Care Hospital';

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: CompanyProfile = {
  id: 1,
  company_name: 'Family Care Hospital',
  address: null,
  contact: null,
  email: null,
  logo_path: null,
  logo_url: null,
  bg_image_path: null,
  bg_image_url: null,
  color_primary: '#2563eb',
  color_secondary: '#1d4ed8',
  color_tertiary: null,
  updated_at: null,
};

// ── Luminance helper ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  // Expand shorthand #abc → #aabbcc
  const full = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, '#$1$1$2$2$3$3');
  const m = full.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function contrastColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance per WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1f2937' : '#ffffff';
}

function lighten(hex: string, amount = 0.7): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// ── Apply CSS custom properties to :root ──────────────────────────────────────
function applyTheme(profile: CompanyProfile) {
  const root = document.documentElement;
  const p  = profile.color_primary   || '#2563eb';
  const s  = profile.color_secondary || '#1d4ed8';
  const t  = profile.color_tertiary  || null;

  root.style.setProperty('--brand-primary',        p);
  root.style.setProperty('--brand-secondary',      s);
  root.style.setProperty('--brand-primary-fg',     contrastColor(p));
  root.style.setProperty('--brand-secondary-fg',   contrastColor(s));
  root.style.setProperty('--brand-primary-light',  lighten(p));
  root.style.setProperty('--brand-primary-subtle', lighten(p, 0.92));

  if (t) {
    root.style.setProperty('--brand-tertiary',    t);
    root.style.setProperty('--brand-tertiary-fg', contrastColor(t));
  } else {
    root.style.removeProperty('--brand-tertiary');
    root.style.removeProperty('--brand-tertiary-fg');
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface CompanyContextValue {
  profile: CompanyProfile;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: CompanyProfile) => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  profile:    DEFAULT_PROFILE,
  loading:    true,
  refresh:    async () => {},
  setProfile: () => {},
});

export function useCompany() {
  return useContext(CompanyContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [loading, setLoading]      = useState(true);

  const setProfile = useCallback((p: CompanyProfile) => {
    setProfileState(p);
    currentCompanyName = p.company_name || 'Family Care Hospital';
    applyTheme(p);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await companyApi.get();
      setProfile(res.data);
    } catch {
      // On failure fall back to defaults -- theme not broken
      applyTheme(DEFAULT_PROFILE);
    } finally {
      setLoading(false);
    }
  }, [setProfile]);

  useEffect(() => {
    // Apply defaults immediately to avoid flash
    applyTheme(DEFAULT_PROFILE);
    refresh();
  }, [refresh]);

  return (
    <CompanyContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </CompanyContext.Provider>
  );
}
