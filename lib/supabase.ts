import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las variables públicas de Supabase.");
}

const ADMIN_AUTH_STORAGE_PREFIX = "nlt-admin-auth-";
const ADMIN_AUTH_TAB_KEY = "nlt-admin-auth-tab";

const getAdminAuthStorageKey = () => {
  if (typeof window === "undefined") return `${ADMIN_AUTH_STORAGE_PREFIX}server`;
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const savedTabId = window.sessionStorage.getItem(ADMIN_AUTH_TAB_KEY);
  const tabId = navigation?.type === "reload" && savedTabId ? savedTabId : window.crypto.randomUUID();
  window.sessionStorage.setItem(ADMIN_AUTH_TAB_KEY, tabId);
  return `${ADMIN_AUTH_STORAGE_PREFIX}${tabId}`;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: getAdminAuthStorageKey(),
    storage: {
      getItem: (key) => typeof window === "undefined" ? null : window.sessionStorage.getItem(key),
      setItem: (key, value) => {
        if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
      },
    },
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
