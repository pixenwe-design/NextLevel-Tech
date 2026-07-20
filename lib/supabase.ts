import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las variables públicas de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
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
