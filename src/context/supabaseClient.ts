import { createClient } from "@supabase/supabase-js";
import {
  IS_SUPABASE_CONFIGURED,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./config";

const IS_TEST_ENV =
  import.meta.env.MODE === "test" || import.meta.env.VITEST === "true";

export const supabase =
  IS_SUPABASE_CONFIGURED && !IS_TEST_ENV
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
