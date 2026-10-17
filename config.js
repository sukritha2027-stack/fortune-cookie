/* =========================================================
   Fortune Cookie — configuration
   Fill these in, then redeploy. Leave SUPABASE_URL empty to run
   in "demo mode" (accounts stored only in this browser).
   ========================================================= */
window.FC_CONFIG = {
  // Supabase → Project Settings → API
  SUPABASE_URL: "https://hrsjwgaxkpxturmquadj.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_GHpke9MthFz9U7wDxiaTrw_xAoSoQWw",

  // Dodo Payments → Products → your ₹199/month product → checkout / payment link
  // e.g. "https://test.checkout.dodopayments.com/buy/pdt_XXXXXXXX?quantity=1"
  DODO_PAYMENT_LINK: "",

  // These accounts always get Plus for free (owner / testing accounts)
  PLUS_EMAILS: ["sukrithakrishna@gmail.com"],

  // Background music volume, 0 to 1 (keep it low and mellow)
  MUSIC_VOLUME: 0.16,

  // Shown on share cards and used for "copy link"
  APP_NAME: "Fortune Cookie",
  SITE_URL: "" // leave empty to use the current website address
};
