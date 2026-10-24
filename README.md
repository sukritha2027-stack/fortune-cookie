# Fortune Cookie 🥠

*A little something you needed to hear.*

Fortune Cookie is a daily ritual app for 18–28-year-olds. Users answer a whimsical slider check-in, crack an animated fortune cookie, and get a personalised fortune they can save, journal about, and share as an Instagram/Pinterest-ready card.

Built for **AI in Business**, PGP Technology & Business Management, Masters Union.

---

## The product

| | Free (₹0) | Fortune Cookie Plus (₹199/month) |
|---|---|---|
| Daily whimsical check-in (11 slider questions from a 40-question bank) | ✅ | ✅ |
| One personalised cookie per day | ✅ | Unlimited |
| Cookie calendar (history of every fortune + journal entry) | ✅ | ✅ |
| Manifest journal (6 prompts, saved per day) | ✅ | ✅ |
| Shareable fortune card (Post 4:5, Story 9:16, Square) | Classic style | 5 premium styles |
| Six themed cookies, each with its own 5-question quiz | — | ✅ |
| Manifestation dashboard: mood/water/energy trends, intention tracking, monthly reflection | — | ✅ |

### User flow
1. **Sign up / log in** with email + password.
2. **First-time walkthrough** (5 slides, shown once per account).
3. **Daily check-in pops up automatically** the first time the app is opened each day. Answers are dragged on sliders.
4. **Crack the cookie**: tap it → crack sound → cookie splits → paper strip unrolls with the fortune, a personalised P.S. and lucky numbers.
5. **Share card**: generated in the browser as a PNG. Share to Instagram (native share sheet on mobile, download on desktop), WhatsApp, Pinterest, X, email, copy link, download, or the device share menu.
6. **Home page**: today's cookie → calendar → manifest journal → Plus → dashboard. Opening the app again the same day goes straight here.

### How fortunes are chosen
Each slider question measures a dimension (mood, water, energy, sleep, stress, social, heart, drive, chaos, self-kindness, avoidance, focus, body). The engine averages answers per dimension, scores the six cookie types (e.g. high avoidance → *The Wake-Up Call*, high stress + low energy → *The Little Thing*), then picks a **soft** or **bold** tone based on mood and stress. A fortune is drawn from that bank (~160 hand-written fortunes), avoiding the user's recent ones. Extreme answers add a P.S. (e.g. low water → "drink some water, little raisin").

---

## Tech stack

- **Frontend:** plain HTML, CSS and JavaScript (no build step). Deploys anywhere as static files.
- **Auth + database:** [Supabase](https://supabase.com) (email/password auth, Postgres, Row Level Security so users can only read their own data).
- **Payments:** [Dodo Payments](https://dodopayments.com) checkout link for the ₹199/month subscription, confirmed by a signed webhook (`api/dodo-webhook.js`, a Vercel function).
- **Hosting:** Vercel.
- **Sound:** an original music-box lullaby (low-volume loop, toggleable), an ASMR cookie-crack and a paper-crinkle-and-pling effect. All three were synthesised for this project (`sounds/`) and played through the Web Audio API so volume works on iPhone too.
- **Share cards:** drawn on an HTML canvas and exported as PNG.

```
index.html     page structure
styles.css     design system (colours, fonts, animations, responsive layout)
app.js         auth, quiz, fortune engine, cracking animation, share cards, calendar, journal, Plus, dashboard
content.js     question bank, cookie types, fortunes, journal prompts, walkthrough copy
config.js      Supabase keys + Dodo payment link
api/           dodo-webhook.js: Vercel function that switches Plus on/off
supabase/      dodo-payments.sql: columns + locks the plan column
images/        cookie character poses
sounds/        lullaby.mp3, crack.mp3, paper.mp3
```

### Database (Supabase)
- `profiles`: name, plan (`free` / `plus`), onboarded flag. Created automatically on sign-up by a trigger.
- `cookies`: one row per cookie: day, type, fortune, and the raw slider answers (JSON).
- `journal`: one row per user per day with the manifest entries (JSON).

All tables have Row Level Security: `auth.uid() = user_id`.

### Demo mode
If `SUPABASE_URL` / `SUPABASE_ANON_KEY` are left empty in `config.js`, the app runs fully in the browser using localStorage, so it can be tested with zero setup.

---

## Payments (Dodo Payments, live)

Plus is a ₹199/month subscription sold through a Dodo Payments checkout link.

1. **Get the whole universe** opens Dodo checkout with the user's email prefilled and `metadata_user_id` set to their account id.
2. After paying, Dodo sends a signed webhook to `api/dodo-webhook.js` (a Vercel serverless function).
3. The function verifies the signature (Standard Webhooks), finds the account from `metadata_user_id`, and sets `profiles.plan` to `plus` with the Supabase service-role key. Renewals keep it on; when a subscription is cancelled and runs out, expires or fails, the plan goes back to `free`.
4. Back on the site, the app shows "Confirming your payment…" and waits for the webhook to flip the plan.

Browsers **cannot** change their own plan: `supabase/dodo-payments.sql` revokes update rights on `plan` from signed-in users, so adding `?upgraded=1` to the URL does nothing.

**Setup:** run `supabase/dodo-payments.sql` once in the Supabase SQL editor; add `DODO_PAYMENTS_WEBHOOK_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel → Settings → Environment Variables; register `https://<site>/api/dodo-webhook` in Dodo → Developer → Webhooks (live mode).

Owner/test accounts listed in `PLUS_EMAILS` in `config.js` see Plus for free and get a **Preview as Free** toggle (stored only on that device) to test both tiers.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Test it (for graders)
1. Create an account → walkthrough → check-in → tap the cookie (sound on 🔊).
2. Get the card → try Post / Story / Square and the share buttons.
3. Write something in Manifest → *Send it to the universe* → see the ✎ on today in the calendar.
4. Payments are live (real ₹199 charge). To see Plus without paying, ask the owner to add your email to `PLUS_EMAILS`, or use an owner account and the *Preview as Free* toggle.
5. As Plus: open any themed cookie, crack another daily cookie, view the dashboard.
