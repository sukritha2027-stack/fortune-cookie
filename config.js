/* =========================================================
   Fortune Cookie — configuration
   Fill these in, then redeploy. Leave SUPABASE_URL empty to run
   in "demo mode" (accounts stored only in this browser).
   ========================================================= */
window.FC_CONFIG = {
  // Supabase → Project Settings → API
  SUPABASE_URL: "https://hrsjwgaxkpxturmquadj.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_GHpke9MthFz9U7wDxiaTrw_xAoSoQWw",

  // Dodo Payments (LIVE) → Products → Fortune Cookie Plus (₹199/month) → payment link.
  // Plus is switched on by the webhook in api/dodo-webhook.js, not by the browser.
  DODO_PAYMENT_LINK: "https://checkout.dodopayments.com/buy/pdt_0NqR4iQ9XsXR1KbqIYtrs?quantity=1",

  // Owner / tester accounts are set in the database (profiles.is_owner),
  // see supabase/migrations/20261115000000_owner_flag.sql.

  // Background music volume, 0 to 1 (keep it low and mellow)
  MUSIC_VOLUME: 0.16,

  // Shown on share cards and used for "copy link"
  APP_NAME: "Fortune Cookie",
  SITE_URL: "https://www.fortunecookie.fit" // used for share links and the return page after checkout
};
