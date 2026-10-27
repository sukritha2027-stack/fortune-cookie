/* =========================================================
   Fortune Cookie — "Manage or cancel subscription"
   URL: POST https://<your-site>/api/customer-portal

   The signed-in user sends their Supabase access token. We check it,
   look up their Dodo customer id (saved by api/dodo-webhook.js) and
   ask Dodo for a one-time customer portal link, where they can cancel,
   change their payment method or download invoices.

   Environment variables (Vercel → Settings → Environment Variables):
     DODO_PAYMENTS_API_KEY       Dodo (Live mode) → Developer → API Keys
     SUPABASE_SERVICE_ROLE_KEY   already added for the webhook
     DODO_PAYMENTS_BASE_URL      optional, defaults to live mode
     SUPABASE_URL                optional, defaults to the project URL below
   ========================================================= */
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://hrsjwgaxkpxturmquadj.supabase.co";
const DEFAULT_DODO_BASE_URL = "https://live.dodopayments.com";
const DEFAULT_RETURN_URL = "https://www.fortunecookie.fit/#plus";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Health check: open https://<your-site>/api/customer-portal in a browser.
// It says whether the secrets are set and whether Dodo accepts the API key,
// without ever showing the keys themselves.
export async function GET() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const base = (process.env.DODO_PAYMENTS_BASE_URL || DEFAULT_DODO_BASE_URL).replace(/\/$/, "");
  let dodo = "missing";
  if (apiKey) {
    try {
      const r = await fetch(`${base}/customers?page_size=1`, { headers: { authorization: `Bearer ${apiKey}` } });
      dodo = r.ok ? "works" : r.status === 401 || r.status === 403 ? "rejected (wrong key, or a Test-mode key)" : `error ${r.status}`;
    } catch (e) { dodo = "could not reach Dodo"; }
  }
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing";
  const webhook = process.env.DODO_PAYMENTS_WEBHOOK_KEY ? "set" : "missing";
  const ok = dodo === "works" && supabase === "set" && webhook === "set";
  return json({ ok, dodo_api_key: dodo, supabase_service_role_key: supabase, dodo_webhook_key: webhook });
}

export async function POST(request) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !serviceKey) {
    console.error("Missing DODO_PAYMENTS_API_KEY or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Subscription management isn't set up yet." }, 500);
  }

  // 1. Who is asking? Verify their Supabase login token.
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please log in again." }, 401);
  const sb = createClient(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await sb.auth.getUser(token);
  if (userError || !userData || !userData.user) return json({ error: "Please log in again." }, 401);

  // 2. Find their Dodo customer id.
  const { data: profile } = await sb.from("profiles").select("dodo_customer_id").eq("id", userData.user.id).maybeSingle();
  const customerId = profile && profile.dodo_customer_id;
  if (!customerId) return json({ error: "We couldn't find a subscription on this account." }, 404);

  // 3. Ask Dodo for a portal link. Only send people back to our own site.
  let returnUrl = DEFAULT_RETURN_URL;
  try {
    const body = await request.json();
    const u = new URL(body && body.return_url);
    if (u.protocol === "https:" && /(^|\.)fortunecookie\.fit$|\.vercel\.app$/.test(u.hostname)) returnUrl = u.toString();
  } catch (e) {}

  const base = (process.env.DODO_PAYMENTS_BASE_URL || DEFAULT_DODO_BASE_URL).replace(/\/$/, "");
  const url = `${base}/customers/${encodeURIComponent(customerId)}/customer-portal/session?return_url=${encodeURIComponent(returnUrl)}`;
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    console.error("Dodo portal session failed:", res.status, await res.text().catch(() => ""));
    return json({ error: "Couldn't open subscription settings. Try again in a minute." }, 502);
  }
  const data = await res.json();
  if (!data || !data.link) return json({ error: "Couldn't open subscription settings." }, 502);
  return json({ link: data.link });
}
