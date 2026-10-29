# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-29

> Auto-drafted from the codebase (README, index.html, content.js) plus desk research. Anything marked *(hypothesis)* has not been confirmed by real users yet. Replace with first-party evidence as it arrives.

## Product Overview
**One-liner:** A daily fortune cookie that feels a little too specific.
**What it does:** Users drag through a whimsical 11-slider check-in (mood, water, sleep, stress, chaos, self-kindness…), tap to crack an animated cookie (with ASMR crack sound), and get a personalised fortune with a P.S. and lucky numbers. Every fortune becomes a share card (Story 9:16, Post 4:5, Square) and lands in a cookie calendar with a tiny manifest journal.
**Product category:** Daily self-care / affirmation ritual (the shelf people search: "daily affirmations", "manifestation app", "daily horoscope", "fortune for today").
**Product type:** Mobile-first web app (no install), fortunecookie.fit.
**Business model:** Freemium. Free = one cookie a day, calendar, journal, classic card. Fortune Cookie Plus = ₹199/month (unlimited cookies, six themed cookies, premium card styles, manifestation dashboard). Payments via Dodo (card/UPI).

## Target Audience
**Who:** Indians aged 18–28, skewing young women; college students and first-jobbers in metros (start: Delhi NCR).
**Primary use case:** A 60-second daily pick-me-up that feels personal, plus something pretty to post.
**Jobs to be done:**
- Functional: give me one line to carry into today.
- Emotional: make me feel seen and less alone in "figuring it out" (*hypothesis, backed by proxy research*).
- Social: give me something cute and on-brand to put on my story / send to a friend.
**Use cases:**
- Morning ritual before class/work
- Late-night overthinking ("STILL AWAKE" greeting)
- Sending a fortune to a friend instead of a forward (festivals, birthdays, exams)
- Journaling-lite for people who hate journaling

## Personas (provisional, proxy-sourced)
| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| **The Story-Poster** (19–23, college) | Aesthetic, being relatable, inside jokes with friends | Wants daily content for stories that isn't cringe | A cute card every day that says something about her |
| **The Quiet Overthinker** (22–27, first job / grad school) | Reassurance, career and relationship uncertainty | Therapy feels like a big step; astrology apps upsell paid chats | A gentle, specific nudge in 60 seconds, free, no astrologer |
| **The Manifester** (18–26) | Intentions, vision boards, Pinterest | Manifestation content is generic | Prompts + a dashboard that tracks intentions over time (Plus) |

Sources: InstaAstro reports 61% of its users are Gen Z and most queries are about relationships (sponsored data, unverified); New Lines Magazine (Jan 2024) on young Indians using astrology/tarot apps as a non-judgmental, affordable listener; VICE (2021) on desi affirmation meme pages on Instagram.

## Problems & Pain Points
**Core problem:** Feeling unsure and a bit alone in your twenties, and wanting a small daily signal that you're on track.
**Why alternatives fall short:**
- Astrology apps (Astrotalk, InstaAstro): per-minute paid chats, upsell pressure, can tell you what you want to hear.
- Co–Star / The Pattern: Western astrology, needs birth time; users complain daily horoscopes repeat.
- Affirmation apps: generic lines that don't know how your day is going.
- Instagram affirmation pages: funny but not about *you*.
**Emotional tension:** Overthinking, comparison, "am I behind?", tired of forced positivity.

## Competitive Landscape
**Direct:** Co–Star, The Pattern, daily affirmation apps (I Am, ThinkUp) — not personal to today / need birth data / generic.
**Secondary:** Astrotalk, InstaAstro, tarot "pick a card" reels — paid, long, or not personal.
**Indirect:** Pinterest quote boards, WhatsApp good-morning forwards, journaling apps, Finch.

## Differentiation
- Personalised to *today* in 60 seconds from sliders, not birth charts.
- Free daily, no account-level astrology jargon, no paid human.
- Built-in share card designed for Stories, with "crack yours ✦ fortunecookie.fit" on every card (a built-in referral loop).
- Playful, slightly cheeky voice (fortunes like "The comparison game has no winners. Log off.").
- Sensory: crack sound, music-box lullaby, paper unroll.

## Objections
| Objection | Response |
|---|---|
| "Another app to download?" | No download. Open the link, crack in a minute. |
| "Do I really need to sign up?" | Account saves your calendar and journal. *(Current friction point: signup comes before the first crack.)* |
| "Isn't this just random?" | Your sliders decide the cookie type and tone. That's why it feels specific. |
| "₹199/month?" | Daily cookie is free forever. Plus is for unlimited cookies and the dashboard. |

**Anti-persona:** People wanting real astrology, predictions or mental-health treatment. Under-18s (app and marketing target 18+).

## Switching Dynamics
**Push:** generic affirmations, paid astrology upsells, repetitive horoscopes.
**Pull:** "too specific" fortunes, cute share card, zero cost, 60 seconds.
**Habit:** scrolling reels, existing horoscope app, WhatsApp forwards.
**Anxiety:** signing up with email, privacy of journal entries.

## Customer Language
**How they describe the problem (proxy sources):**
- "sometimes you need a pick-me-up" (young Delhi engineer, New Lines)
- users want "to be heard and accepted" (tarot reader on callers, New Lines)
- complaint about horoscopes repeating ("literally the same as yesterday") (Co–Star review)
**How we describe ourselves (site copy):** "A little something you needed to hear." / "a fortune that somehow feels a little too specific" / "made for people figuring it out as they go."
**Words to use:** crack, cookie, fortune, little, too specific, the universe, vibes, main character, figuring it out.
**Words to avoid:** therapy, mental health treatment, prediction, astrology, AI-generated (fortunes are hand-written), "hustle".
**Glossary:**
| Term | Meaning |
|---|---|
| Crack | Open today's fortune |
| Check-in | The slider quiz |
| Manifest | The journal |
| Plus / "the whole universe" | Paid tier |

## Brand Voice
| Attribute | Means | Doesn't mean | Example line |
|---|---|---|---|
| Warm-cheeky | Teasing like a best friend | Snarky or mean | "drink some water, little raisin" |
| Specific | Names the real feeling | Vague positivity | "You're being harder on yourself than anyone else is." |
| Light | Small, playful, emoji-sparse (🥠 ✦ ♡) | Childish or meme-spammy | "Tiny prompts. Big intentions. Zero journaling homework." |
| Gentle | Never prescriptive about health | Clinical | "Being gentle with yourself is not the same as giving up." |

**Tone by context:** Social: cheeky, lowercase OK. Launch: excited but small ("we baked a thing"). Errors: apologetic and cute. Sales/Plus: "get the whole universe", no pressure.
**Terms we own:** "crack yours ✦", "a little too specific", "the whole universe".
**Never use:** "cure", "anxiety fix", "guaranteed", "AI fortune teller".

## Proof Points
**Metrics:** none yet (pre-launch). Microsoft Clarity installed; signups visible in Supabase `profiles`.
**Testimonials:** none yet. Collect screenshots of shared cards from Day 1.
**Value themes:** Personal (slider engine) · Pretty (share cards) · Fast (60s) · Free.

## Goals
**Business goal:** 1,000 signed-up users in 10 days (Oct 30 – Nov 8, 2026), zero budget.
**Conversion action:** Account created + first cookie cracked.
**Secondary:** card shared; Plus upgrade.
**Current metrics:** unknown, pre-launch.

## Learnings
*Decisions and tested lessons. Newest first.*
| Date | Learning | Evidence | Applies to | Status |
|---|---|---|---|---|
| | | | | |

## Changelog
- v1 (2026-10-29) — Initial context, auto-drafted from repo + desk research for the 10-day 1,000-user sprint.
