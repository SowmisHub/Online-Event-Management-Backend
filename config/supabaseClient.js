const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

/* 🔐 ADMIN CLIENT (Service Role Key) */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* 👤 PUBLIC CLIENT (Anon Key) */
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = {
  supabaseAdmin,
  supabasePublic,
};