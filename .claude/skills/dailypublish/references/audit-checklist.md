# Audit checklist

Run every check on every piece. Record `PASS` / `FAIL` + one line in `audit.md`. A piece is `READY` only when every applicable check passes.

## A. Facts

| # | Check | How to verify |
|---|---|---|
| A1 | Every product claim matches the product | Price (₹199/month for Plus), what is free (one cookie a day, calendar, journal, classic card), features, flow. Verify against `README.md`, `index.html`, `config.js`. If the code and README disagree, the code wins; flag it. |
| A2 | Every fortune quoted is real | Exact string match in `content.js`. Paraphrased or invented "fortunes" fail. |
| A3 | Every external fact, stat, date or quote has a source that was opened | Source URL listed in the piece's Sources line. Search snippets do not count. Unsourced → remove the claim. |
| A4 | No numbers we don't have | No user counts, ratings, "thousands of users", testimonials or press mentions unless they are real and logged. Pre-launch = say nothing about scale. |
| A5 | Dates and occasions are right | Festival and event dates checked against a calendar source for 2026. |
| A6 | Links work and carry a ref tag | `https://www.fortunecookie.fit/?ref=<channel>-day<N>`; partner and society links have their own ref. |
| A7 | Partner handles are real | Each handle opened during brainstorm; follower count and a recent post recorded. |

## B. Brand (from `.agents/product-marketing.md`)

| # | Check |
|---|---|
| B1 | Reads as **warm-cheeky, specific, light, gentle** (the four voice attributes). Read it aloud: would the cookie say this? |
| B2 | Uses brand words where natural: crack, cookie, fortune, "a little too specific", "crack yours ✦", "the whole universe" (Plus). |
| B3 | None of the words to avoid: therapy, mental health treatment, cure, anxiety fix, prediction, astrology (as a claim about the product), guaranteed, AI-generated / AI fortune teller, hustle. |
| B4 | Emoji limited to the brand set (🥠 ✦ ♡) plus at most one other per piece. |
| B5 | No AI tells (per `copywriting/references/ai-tells.md`): no "it's not X, it's Y" reveals, no "no X, no Y, no Z" lists, no trailing comma-clause sentences, no "dive in", "elevate", "unlock", "game-changer". |
| B6 | Speaks to the piece's named ICP, using at least one phrase from Customer Language or the day's brainstorm verbatim bank. |
| B7 | One clear CTA, and it matches the day's goal (crack today's cookie / post your card / reply yes). |

## C. Channel fit

| Channel | Must have |
|---|---|
| Instagram reel | 9:16; hook in first 3 seconds with visual + spoken/sound + on-screen text; 15–30 s; on-screen text max 2 lines, 3–5 words per line; caption hook within first ~125 characters; 3–5 hashtags; caption ≤ 2,200 chars; cover-frame text readable at thumbnail size |
| Instagram story | 9:16; one idea per frame; text kept clear of the top and bottom ~250 px (UI overlays); link sticker with ref link; poll or question sticker where it invites a reply |
| Instagram post / carousel | 4:5; first slide works alone; caption hook within ~125 chars; 3–5 hashtags |
| LinkedIn post | Hook within first ~210 characters (before "see more"); short paragraphs; 3–5 hashtags max; link in the post body is acceptable for a personal launch post; first-person founder voice |
| X post | ≤ 280 chars unless the account is Premium; 1–2 hashtags |
| Reddit post | Current subreddit rules fetched during brainstorm and quoted in the piece; self-promotion allowed (or post framed as the rules require); no hashtags; no marketing voice; founder discloses they built it |
| WhatsApp message | Fits on one phone screen (≈ 60–90 words); personal opener; link on its own line; no forward-bait phrasing ("forward to 10 people") |
| DM (Instagram / LinkedIn) | Under 80 words; personalised first line referencing a real recent post of theirs; one ask; easy yes |

Platform limits source: `social/references/platform-limits.md`. If a platform has changed a limit, the brainstorm's live research wins; note it.

## D. Safety and compliance

| # | Check |
|---|---|
| D1 | Audience is 18+: no school, teen or under-18 communities, pages or hashtags; no content that reads as aimed at minors. |
| D2 | No health or mental-health promises. Fortunes are encouragement, not advice. Never position the app as a substitute for therapy or medical care. |
| D3 | Partner disclosure (ASCI influencer guidelines): any page, society or person who gets something from us (free Plus, barter, custom card) must label the post upfront with "Ad" or "Collab" or use the platform's paid-partnership tag. On reels and stories the label goes on the video or image itself; never only in a hashtag pile, never only in the bio. Outreach DMs must state this ask. |
| D4 | No personal data: no screenshots showing other users' names, emails or journal entries without their written OK in the DM thread. Reposted cards are the user's own public posts. |
| D5 | No real public figures quoted or impersonated; no copyrighted music, characters or lyrics. Default audio = the app's own crack sound or the platform's licensed library. |
| D6 | Nothing misleading about payments: Plus is ₹199/month, cancel anytime; never imply Plus is free unless it is a stated partner perk. |
