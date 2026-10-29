# Day 1 brainstorm · Fri 2026-10-30

Pieces due (from `.agents/content-calendar.md`): Instagram profile setup, Reel 1, friends DM. Day target: 60 signups.

Learnings table in product-marketing.md: empty, so no overrides.

## Research

**Tools used:** built-in web search and fetch. Exa, Firecrawl and Apify are not connected. Reddit pages are blocked from this workspace, so no fresh verbatim comments could be mined today.

**Channel pulse: Instagram Reels (Sept 2026 guidance).** SocialPilot's Reels algorithm guide, updated 23 Sep 2026, says:
- DM sends are the strongest signal for reaching non-followers, ahead of likes. Design every reel around "send this to the friend who…".
- Viewers decide in about the first 3 seconds; motion or on-screen text should start within half a second.
- Short reels with high completion beat longer ones. Our target is under 20 seconds.
- Original content is favoured; reposts and watermarked videos from other apps are demoted. Record on the phone and edit in-app or in CapCut without an export watermark.
- Trial Reels need 1,000+ followers, so the new account can't use them yet.
- A new account's early viewers shape its audience; stay on one niche.

Source: [SocialPilot, Instagram Reels Algorithm 2026](https://www.socialpilot.co/blog/instagram-reels-algorithm)

**Instagram limits** (Sendcove, updated 21 Oct 2026): bio 150 chars, display name 30 chars, username 30 chars (letters, numbers, periods, underscores), caption 2,200 chars, 5 hashtags per post. Source: [Sendcove, Instagram character limits](https://www.sendcove.app/integrations/instagram/character-limits)

**Audience language** (from earlier research, not fresh this week):
- "sometimes you need a pick-me-up" — young Delhi engineer ([New Lines](https://newlinesmag.com/spotlight/young-indians-make-a-beeline-to-online-apps-to-share-their-woes/))
- callers "just want to be heard and accepted" — tarot reader on young clients (same source)
- "literally the same as yesterday" — Co–Star reviewer on repetitive horoscopes ([Kimola](https://kimola.com/reports/unlock-astrology-app-insights-co-star-user-feedback-report-google-play-153861))
- Desi affirmation pages win with ironic, funny, reassuring lines ([VICE](https://www.vice.com/en/article/india-gen-z-viral-affirmations-desi-mental-health/))

Gap: fewer than 5 fresh verbatim phrases. Connect Exa or Apify before Day 4 (Reddit) and Day 5 (pages).

**Occasion:** Day 1 is a Friday. Diwali is Sun 8 Nov 2026 ([Dekho Panchang](https://dekhopanchang.com/en/festivals/diwali)), held for Days 8–10. Nothing else dated is worth using today.

**Product facts used** (checked in the repo):
- Water slider below 30 adds one of two P.S. lines at random: "P.S. drink some water, little raisin. 💧" or "P.S. hydrate. Your brain is mostly water and it's thirsty." (`app.js` pickPS, `content.js` PS)
- Water question copy: "Hydration check. How much water has entered the chat?", left label "I am a raisin" (`content.js` DAILY_CORE)
- The card footer reads "crack yours ✦ fortunecookie.fit"; share card formats are Post 4:5, Story 9:16 and Square (`app.js`, README)
- Free = one personalised cookie a day; Plus = ₹199/month (README, index.html)
- Founder account is on the Plus owner list (`config.js` PLUS_EMAILS), so retakes are possible. Use the **Classic** card style on camera so free users see what they'll get.

## Piece 1 · Instagram profile setup

| Angle | Idea | ICP | Voice | Share/save | Effort | Total |
|---|---|---|---|---|---|---|
| A | Site tagline as bio: "A little something you needed to hear." + what you do + link | 4 | 5 | 3 | 5 | 17 |
| B | Promise-led: "Daily fortunes that are a little too specific 🥠" + 60-second how + link | 5 | 5 | 3 | 5 | **18** |
| C | Bakery joke: "Baked fresh every morning. Cracked by you." | 3 | 4 | 3 | 5 | 15 |

**Pick B.** "A little too specific" is the claim we own and the reason someone follows; A's tagline goes in the display name area instead.

## Piece 2 · Reel 1

| Angle | Hook + idea | ICP | Voice | Share/save | Effort | Total |
|---|---|---|---|---|---|---|
| A | "POV: you tell the universe you've had zero water today" — drag the water slider to "I am a raisin", crack, the P.S. calls you a raisin | 5 | 5 | 5 | 4 | **19** |
| B | Sound-first: "the most satisfying crack of your day 🔊" — pure ASMR crack and paper unroll | 4 | 4 | 3 | 5 | 16 |
| C | Founder story: "I built an app that gently roasts you every morning" | 4 | 4 | 3 | 4 | 15 |

**Pick A**, using B's crack sound as the audio hook. It shows the personalisation in 15 seconds, it's funny, and it begs to be sent to "the friend who survives on chai". Risk: the low-water P.S. is picked at random from two lines; the founder may need one retake to get "little raisin".

## Piece 3 · Friends DM (15 close friends)

| Angle | Idea | ICP | Voice | Share/save | Effort | Total |
|---|---|---|---|---|---|---|
| A | Honest favour: "I launched my term project today. Crack your cookie and post the card on your story?" | 5 | 5 | 4 | 5 | 19 |
| B | Teaser: "your fortune today is weirdly specific, go check" | 3 | 4 | 3 | 5 | 15 |
| C | Reply hook: "screenshot your fortune and tell me if it's too accurate" | 4 | 5 | 4 | 5 | 18 |

**Pick A with C's reply hook.** Friends say yes to a clear favour, and asking them to reply with their fortune gives Day 1 its first real customer language.
