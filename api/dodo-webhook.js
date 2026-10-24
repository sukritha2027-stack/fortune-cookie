/* =========================================================
   Fortune Cookie — Dodo Payments webhook (Vercel serverless function)
   URL once deployed: https://<your-site>/api/dodo-webhook

   Dodo calls this whenever a subscription changes. We verify the
   signature, work out which Fortune Cookie account it belongs to,
   and set profiles.plan to "plus" or "free" with the Supabase
   service-role key. Browsers can't change the plan themselves
   (see supabase/dodo-payments.sql).

   Environment variables (Vercel → Settings → Environment Variables):
     DODO_PAYMENTS_WEBHOOK_KEY   signing secret from Dodo → Developer → Webhooks
     SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API → service_role
     SUPABASE_URL                optional, defaults to the project URL below
   ========================================================= */
import { Webhook } from "standardwebhooks";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://hrsjwgaxkpxturmquadj.supabase.co";

// Subscription statuses that keep Plus switched on. A subscription the customer
// has cancelled stays "active" until the paid month runs out, then expires.
const PLUS_STATUSES = new Set(["active"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Visiting the URL in a browser confirms the function is deployed.
export function GET() {
  return json({ ok: true, message: "Fortune Cookie Dodo webhook is live. Dodo sends POST requests here." });
}

export async function POST(request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  if (!secret || !serviceKey) {
    console.error("Missing DODO_PAYMENTS_WEBHOOK_KEY or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Server not configured" }, 500);
  }

  // 1. Verify the request really came from Dodo (signature over the raw body).
  const rawBody = await request.text();
  try {
    new Webhook(secret).verify(rawBody, {
      "webhook-id": request.headers.get("webhook-id") || "",
      "webhook-signature": request.headers.get("webhook-signature") || "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
    });
  } catch (e) {
    console.warn("Rejected webhook with an invalid signature");
    return json({ error: "Invalid signature" }, 401);
  }

  const event = JSON.parse(rawBody);
  const type = event.type || "";
  const data = event.data || {};
  console.log("Dodo event:", type, data.subscription_id || data.payment_id || "", "status:", data.status);

  // Plus is a subscription, so only subscription events change the plan.
  // (payment.* events are acknowledged and ignored.)
  if (!type.startsWith("subscription.")) return json({ ok: true, ignored: type });

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 2. Find the account. The app sends metadata_user_id on the checkout link;
  //    fall back to the subscription id we stored earlier, then the customer's email.
  let userId = data.metadata && data.metadata.user_id;
  if (!userId && data.subscription_id) {
    const { data: row } = await sb.from("profiles").select("id").eq("dodo_subscription_id", data.subscription_id).maybeSingle();
    if (row) userId = row.id;
  }
  const email = data.customer && data.customer.email;
  if (!userId && email) userId = await findUserIdByEmail(sb, email);
  if (!userId) {
    // Answer 200 so Dodo doesn't retry an event we can never match; it's in the Vercel logs.
    console.error("Could not match subscription to a user", data.subscription_id, email);
    return json({ ok: true, matched: false });
  }

  // 3. Save the new plan.
  const status = String(data.status || "").toLowerCase();
  const plan = PLUS_STATUSES.has(status) ? "plus" : "free";
  const { error } = await sb
    .from("profiles")
    .update({
      plan,
      subscription_status: status || null,
      dodo_subscription_id: data.subscription_id || null,
      dodo_customer_id: (data.customer && data.customer.customer_id) || null,
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) {
    // 500 makes Dodo retry later.
    console.error("Supabase update failed:", error.message);
    return json({ error: "Database update failed" }, 500);
  }

  console.log(`User ${userId} → ${plan} (${type}, ${status})`);
  return json({ ok: true, user: userId, plan });
}

async function findUserIdByEmail(sb, email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data || !data.users.length) return null;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === target);
    if (u) return u.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
