# Day 1 audit · Fri 2026-10-30

Two passes. **Pass 1** was an independent reviewer (separate agent, did not see the drafting), checking every product claim against the code with file and line references, counting characters, words and emoji, and opening each external source. **Pass 2** re-checked every fix. All 3 pieces are now `READY`.

## 01 · Instagram profile setup

| Check | Pass 1 | Pass 2 | Note |
|---|---|---|---|
| A1 Product claims | PASS | PASS | "11 sliders": 3 core + 8 rotating (`app.js` 264–266). "One free cookie" (`app.js` 560, 565). |
| A3 Sources opened | PASS | PASS | Sendcove: bio 150, display name 30, username 30. |
| A6 Link + ref | FAIL (minor) | PASS | Permanent `ig-bio` tag kept on purpose; reel piece now agrees. |
| Character limits | PASS | PASS | Bio A 126, Bio B under 150 after fix, display name 22, username 17. |
| B1–B4, B6, B7 Brand | PASS | PASS | Only 🥠 and ✦. |
| B5 AI tells | FAIL (Bio B) | PASS | Three stacked fragments rewritten as one sentence. |
| C Channel | PASS | PASS | |
| D Safety | PASS | PASS | |
| Assets | PASS | PASS | "waving" corrected to "smiling" to match the image. |

## 02 · Instagram Reel 1

| Check | Pass 1 | Pass 2 | Note |
|---|---|---|---|
| A1 Product claims | FAIL | PASS | Button is "GET MY CARD ♡", not "Get the card". Card footer prints `www.fortunecookie.fit`. Both fixed. |
| A2 Fortune / P.S. real | PASS | PASS | Both low-water P.S. lines match `content.js` 326; dragging water to "I am a raisin" always triggers it (`app.js` 330–332). |
| A2 Consistency | FAIL | PASS | Fallback now also swaps caption line and cover text if the "hydrate" P.S. appears. |
| A3 Sources opened | PASS | PASS | SocialPilot (23 Sep 2026), Sendcove. |
| A6 Link + ref | FAIL | PASS | Now matches 01: bio link stays `ig-bio`. |
| B4 Emoji | FAIL | PASS | `crack 🔊` → `crack ✦`. One non-brand emoji left (💧, which also appears in the app's own P.S.). |
| B1–B3, B5–B7 Brand | PASS | PASS | |
| C Reel spec | PASS (weak hook audio) | PASS | Sliders sped to 4x so the crack sound lands by 3 s; total about 14 s. |
| D Safety | PASS | PASS | Own synthesised app audio; no music; hydration played as a joke. |

## 03 · DM / WhatsApp to friends

| Check | Pass 1 | Pass 2 | Note |
|---|---|---|---|
| A1 Product claims | FAIL | PASS | "The link is on the card" was misleading: the card prints the address as text, and the Instagram share sends the image only (`app.js` 479, 522). Now asks for a link sticker. Unverified "1 minute" claim removed. |
| A6 Link + ref | PASS | PASS | `dm-friends-day1` on its own line. |
| Word count (< 80) | PASS | PASS | 76 / 75 words; Hinglish 50. |
| B7 / C One ask | FAIL | PASS | Single ask: crack today. Story post is a "bonus", reply is a P.S. |
| C Personalised opener | FAIL | PASS | Openers now require one real line per friend. |
| Hinglish version | FAIL (minor) | PASS | States what it replaces, has its own link line, no false claim. |
| B1–B6 Brand | PASS | PASS | Only 🥠 ✦ ♡. |
| D Safety | PASS | PASS | |

## Flag for the founder (not a piece failure)

**Ref tags are not stored anywhere yet.** `app.js` never reads `?ref=`, and nothing saves it to Supabase `profiles`. After login, `handlePaymentReturn()` clears the query string (`app.js` 715). The only trace is the landing URL in Microsoft Clarity. Until ref tracking is built, Day 7's "which channel works" call will be rough.
