"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getGuestProfile, getSettings } from "@/lib/storage/profile";
import type { AppSettings, GuestProfile } from "@/lib/types/game";

interface AppContextValue {
  profile: GuestProfile | null;
  settings: AppSettings | null;
  ready: boolean;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue>({
  profile: null,
  settings: null,
  ready: false,
  refresh: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ready, setReady] = useState(false);

  const load = () => {
    setProfile(getGuestProfile());
    setSettings(getSettings());
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  return <AppContext.Provider value={{ profile, settings, ready, refresh: load }}>{children}</AppContext.Provider>;
}
