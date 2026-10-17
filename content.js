/* =========================================================
   Fortune Cookie — content bank
   Questions, cookie types, fortunes and journal prompts.
   Every slider answer is 0–100. "dim" is what it measures.
   ========================================================= */

window.FC_CONTENT = (function () {

  /* ---------- DAILY CHECK-IN QUESTION BANK (40) ----------
     Each day: 3 core questions (mood, water, energy) + 8 rotating ones,
     picked deterministically from the date so the day feels "set". */
  const DAILY_CORE = [
    { id: "mood",   dim: "mood",   emoji: "🌤️", q: "If today were weather, what's the forecast?", left: "Indoor thunderstorm", right: "Golden hour all day" },
    { id: "water",  dim: "water",  emoji: "💧", q: "Hydration check. How much water has entered the chat?", left: "I am a raisin", right: "I am a waterfall" },
    { id: "energy", dim: "energy", emoji: "🔋", q: "Your social-battery-and-also-actual-battery level?", left: "1% and dimming", right: "Fully charged gremlin" }
  ];

  const DAILY_BANK = [
    { id: "sleep1",  dim: "sleep",    emoji: "🛌", q: "How did last night's sleep treat you?", left: "Blinked, it was morning", right: "Slept like a cat in sun" },
    { id: "sleep2",  dim: "sleep",    emoji: "😴", q: "How many snooze buttons were harmed?", left: "All of them", right: "Woke up before the alarm", },
    { id: "stress1", dim: "stress",   emoji: "🫖", q: "How full is your brain-kettle right now?", left: "Cool and quiet", right: "Whistling loudly" },
    { id: "stress2", dim: "stress",   emoji: "🗂️", q: "How many tabs are open in your head?", left: "One calm tab", right: "47 tabs, music playing somewhere" },
    { id: "stress3", dim: "stress",   emoji: "🌊", q: "Is life a gentle stream or a washing machine today?", left: "Gentle stream", right: "Spin cycle" },
    { id: "social1", dim: "social",   emoji: "🫂", q: "How much do you want people today?", left: "Leave me in my burrow", right: "Group hug, everyone" },
    { id: "social2", dim: "social",   emoji: "📱", q: "Texting energy today?", left: "Left on read (by me)", right: "Sending voice notes" },
    { id: "heart1",  dim: "heart",    emoji: "💌", q: "How loud is your heart being today?", left: "On mute", right: "Full karaoke" },
    { id: "heart2",  dim: "heart",    emoji: "🌹", q: "Is someone living rent-free in your head?", left: "Vacant property", right: "They've redecorated" },
    { id: "heart3",  dim: "heart",    emoji: "🍯", q: "How soft are you feeling?", left: "Armoured croissant", right: "Warm honey" },
    { id: "drive1",  dim: "drive",    emoji: "🚀", q: "How ready are you to do the Big Thing?", left: "What big thing", right: "Already halfway there" },
    { id: "drive2",  dim: "drive",    emoji: "🏃", q: "Main character energy level?", left: "Background extra", right: "Opening credits" },
    { id: "drive3",  dim: "drive",    emoji: "🎯", q: "How clear is today's mission?", left: "Fog machine", right: "Laser beam" },
    { id: "chaos1",  dim: "chaos",    emoji: "🪩", q: "How much do you want something unexpected to happen?", left: "Please, routine only", right: "Surprise me, universe" },
    { id: "chaos2",  dim: "chaos",    emoji: "🎲", q: "Would you say yes to a random adventure right now?", left: "Absolutely not", right: "Shoes are already on" },
    { id: "chaos3",  dim: "chaos",    emoji: "🌀", q: "How bored of your own routine are you?", left: "Routine is my religion", right: "I'd fight my alarm clock" },
    { id: "kind1",   dim: "selfkind", emoji: "🧸", q: "How nice have you been to yourself today?", left: "Inner critic is on mic", right: "Hyping myself up" },
    { id: "kind2",   dim: "selfkind", emoji: "🛁", q: "Did you do one thing just for you?", left: "Not even a snack", right: "Full spa of the soul" },
    { id: "kind3",   dim: "selfkind", emoji: "🪞", q: "If you saw yourself in the mirror, what's the vibe?", left: "Side-eye", right: "Oh hello, gorgeous" },
    { id: "avoid1",  dim: "avoid",    emoji: "📬", q: "That thing you've been avoiding. How avoided is it?", left: "Handled it", right: "Hiding under my bed" },
    { id: "avoid2",  dim: "avoid",    emoji: "🦆", q: "How many ducks are in a row?", left: "Ducks perfectly lined up", right: "Ducks are at a rave" },
    { id: "avoid3",  dim: "avoid",    emoji: "⏳", q: "How much are you 'doing it tomorrow'?", left: "Doing it today", right: "Tomorrow, forever" },
    { id: "focus1",  dim: "focus",    emoji: "🔭", q: "How focused is your brain today?", left: "Goldfish mode", right: "Owl mode" },
    { id: "focus2",  dim: "focus",    emoji: "📚", q: "Could you read 10 pages without checking your phone?", left: "Not even one", right: "A whole chapter" },
    { id: "body1",   dim: "body",     emoji: "🌿", q: "How has your body been feeling?", left: "Creaky old door", right: "Freshly watered plant" },
    { id: "body2",   dim: "body",     emoji: "🥗", q: "Have you eaten something that wasn't beige?", left: "Beige buffet", right: "Rainbow plate" },
    { id: "body3",   dim: "body",     emoji: "🚶", q: "How much did you move today?", left: "Bed to couch", right: "Steps for days" },
    { id: "joy1",    dim: "mood",     emoji: "🍓", q: "How many tiny good things happened so far?", left: "Still waiting", right: "Lost count" },
    { id: "joy2",    dim: "mood",     emoji: "🎧", q: "What's the soundtrack of today?", left: "Sad indie in the rain", right: "Bollywood dance number" },
    { id: "grat1",   dim: "mood",     emoji: "🌻", q: "How grateful are you feeling right now?", left: "Running on empty", right: "Overflowing" },
    { id: "money1",  dim: "stress",   emoji: "🪙", q: "How's your wallet feeling about the week?", left: "Thriving", right: "Hiding from me" },
    { id: "brave1",  dim: "drive",    emoji: "🦁", q: "How brave are you feeling?", left: "Tiny mouse", right: "Lion with a blow-dry" },
    { id: "creative",dim: "chaos",    emoji: "🎨", q: "How creative is your brain today?", left: "Plain toast", right: "Glitter explosion" },
    { id: "screen",  dim: "focus",    emoji: "📵", q: "How much did you doomscroll today?", left: "Scrolled into the void", right: "Barely touched my phone" },
    { id: "nature",  dim: "body",     emoji: "☀️", q: "Did you touch grass (or at least see the sky)?", left: "What is sky", right: "Basically a tree now" },
    { id: "future",  dim: "drive",    emoji: "🔮", q: "How excited are you about the next month?", left: "Dreading it", right: "Counting down" },
    { id: "lonely",  dim: "social",   emoji: "🌙", q: "How seen do you feel by people around you?", left: "Invisible today", right: "Very seen, very loved" }
  ];

  /* ---------- COOKIE TYPES + PLUS THEMED QUIZZES ---------- */
  const KINDS = {
    sign: {
      name: "The Sign", emoji: "✨", tag: "For when you need a little push.",
      color: "#FFE98D", pose: "cookie-hello",
      quiz: [
        { id: "s1", dim: "drive", q: "There's a decision on your mind. How close are you to deciding?", left: "Haven't even looked at it", right: "Finger hovering over the button" },
        { id: "s2", dim: "fear",  q: "How scared is the tiny voice in your head?", left: "Chill, sipping tea", right: "Screaming into a pillow" },
        { id: "s3", dim: "heart", q: "Is this something your heart wants or your head wants?", left: "Purely head", right: "Purely heart" },
        { id: "s4", dim: "chaos", q: "How big is the leap?", left: "A small hop", right: "Jumping off a cliff (metaphorically)" },
        { id: "s5", dim: "selfkind", q: "Do you trust yourself on this one?", left: "Not really", right: "Completely" }
      ]
    },
    mirror: {
      name: "The Mirror", emoji: "🪞", tag: "For when you need some perspective.",
      color: "#FFCDE0", pose: "cookie-shy",
      quiz: [
        { id: "m1", dim: "stress", q: "How stuck in your own head are you?", left: "Floating free", right: "Locked in the attic" },
        { id: "m2", dim: "selfkind", q: "If your best friend acted like you this week, how would you rate them?", left: "Concerning", right: "Iconic" },
        { id: "m3", dim: "avoid", q: "How much are you comparing yourself to other people?", left: "Not at all", right: "Constantly, with a spreadsheet" },
        { id: "m4", dim: "focus", q: "How clearly can you see what you actually want?", left: "Foggy bathroom mirror", right: "Freshly cleaned glass" },
        { id: "m5", dim: "mood", q: "How proud are you of who you are lately?", left: "Not very", right: "Quietly very" }
      ]
    },
    love: {
      name: "The Love Note", emoji: "💌", tag: "For when your heart needs attention.",
      color: "#FFCDE0", pose: "cookie-letter",
      quiz: [
        { id: "l1", dim: "heart", q: "Situationship status, scientifically measured?", left: "Fully single and thriving", right: "Deeply, embarrassingly involved" },
        { id: "l2", dim: "fear", q: "How much are you overthinking a text right now?", left: "What text", right: "Drafted it 11 times" },
        { id: "l3", dim: "selfkind", q: "How much love are you giving yourself?", left: "None, I'm busy", right: "I'm my own valentine" },
        { id: "l4", dim: "social", q: "Do you want to be held or left alone?", left: "Left alone", right: "Held, immediately" },
        { id: "l5", dim: "chaos", q: "Are you ready to say the thing you feel?", left: "Taking it to my grave", right: "Typing it right now" }
      ]
    },
    wake: {
      name: "The Wake-Up Call", emoji: "🧨", tag: "For when you're avoiding the obvious.",
      color: "#F4420C", pose: "cookie-wink",
      quiz: [
        { id: "w1", dim: "avoid", q: "How long has the thing been on your to-do list?", left: "Since this morning", right: "Since a past life" },
        { id: "w2", dim: "avoid", q: "How many excuses have you made this week?", left: "Zero", right: "I could write a book" },
        { id: "w3", dim: "stress", q: "How much does avoiding it actually stress you out?", left: "Not at all", right: "It lives in my chest" },
        { id: "w4", dim: "drive", q: "If you started in the next 10 minutes, how would you feel?", left: "Terrified", right: "Weirdly relieved" },
        { id: "w5", dim: "focus", q: "Honestly, do you already know what to do?", left: "Truly no idea", right: "Yes, and I hate that" }
      ]
    },
    little: {
      name: "The Little Thing", emoji: "🌱", tag: "For when life feels overwhelming.",
      color: "#CED98E", pose: "cookie-sleepy",
      quiz: [
        { id: "t1", dim: "stress", q: "How heavy does today feel?", left: "Like a feather", right: "Like a piano on my back" },
        { id: "t2", dim: "energy", q: "How much energy is left in the tank?", left: "Fumes", right: "Plenty to spare" },
        { id: "t3", dim: "body", q: "When did you last drink water, eat, or stretch?", left: "Can't remember", right: "Just now, thank you" },
        { id: "t4", dim: "social", q: "Is there someone you could lean on today?", left: "Not really", right: "Yes, a whole squad" },
        { id: "t5", dim: "selfkind", q: "Can you let one thing be 'good enough' today?", left: "Absolutely not", right: "Yes, I'm letting go" }
      ]
    },
    twist: {
      name: "The Plot Twist", emoji: "🪩", tag: "For when you need a little chaos.",
      color: "#CED98E", pose: "cookie-note",
      quiz: [
        { id: "p1", dim: "chaos", q: "How predictable has your life been lately?", left: "Wildly unpredictable", right: "Same episode on repeat" },
        { id: "p2", dim: "drive", q: "How ready are you for a new chapter?", left: "Still on the last page", right: "Already turning it" },
        { id: "p3", dim: "fear", q: "How scary is change for you right now?", left: "Bring it on", right: "Please no" },
        { id: "p4", dim: "chaos", q: "Pick your energy: cosy cardigan or sequinned jacket?", left: "Cosy cardigan", right: "Sequinned jacket" },
        { id: "p5", dim: "heart", q: "Is there a door you're secretly hoping opens?", left: "Not really", right: "Yes, and I keep peeking" }
      ]
    }
  };

  /* ---------- FORTUNES ----------
     Each kind has a "soft" bank (low mood / high stress days)
     and a "bold" bank (good days, high drive). */
  const FORTUNES = {
    sign: {
      soft: [
        "This is your sign to start small. Small still counts.",
        "You don't need to be ready. You need to be willing.",
        "The door is open a crack. That's enough light to walk toward.",
        "You're allowed to want it quietly before you want it out loud.",
        "Take the first step badly. Polish it later.",
        "You've waited long enough for the perfect moment. This one will do.",
        "Courage today might just look like replying to the email.",
        "The universe is nodding. Gently, but it's nodding.",
        "Your gut has been right before. Let it drive for a bit.",
        "It's okay to go slowly. You're still going.",
        "The answer is yes. The pace is up to you.",
        "One brave sentence can change a whole month.",
        "You keep circling it because it matters. Land the plane.",
        "This is the softest possible push: go on, then."
      ],
      bold: [
        "You don't need another sign. You need to send the email. ♡",
        "This is it. This is the sign. Go.",
        "Book it. Apply. Text them. The universe has done its part.",
        "You're more ready than you think and less ready than you'll be. Start anyway.",
        "Say yes before your overthinking files the paperwork.",
        "Today rewards the person who just does the thing.",
        "Somewhere, a future you is very grateful you started today.",
        "Stop asking for permission. You're the one who signs off.",
        "The leap is shorter than it looks from up here.",
        "Big energy today. Spend it on something you'll brag about later.",
        "Main character moment detected. Do not waste it.",
        "Your timing is better than you think. Move.",
        "The stars aligned; you just have to show up.",
        "Shoot your shot. Worst case, you get a great story."
      ]
    },
    mirror: {
      soft: [
        "You are not behind. You are on your own clock.",
        "You've survived every hard day so far. That's a perfect record.",
        "Look how far you've come, and stop measuring against someone else's map.",
        "You're being harder on yourself than anyone else is.",
        "The person you were a year ago would be proud of you.",
        "Some of your best growth looks like doing less.",
        "Being gentle with yourself is not the same as giving up.",
        "You are a work in progress, and the progress is real.",
        "Your feelings aren't too much. They're information.",
        "Not knowing is a place, not a failure. You can stay a while.",
        "You're allowed to outgrow things you once loved.",
        "Underneath the overthinking, you already know.",
        "Someone admires you for something you don't even notice."
      ],
      bold: [
        "Notice what you're proud of. Then say it out loud.",
        "You've become someone your younger self would follow on Instagram.",
        "The comparison game has no winners. Log off.",
        "Your standards aren't too high. Your circle might be too small.",
        "You're not hard to love. You're just choosy. Good.",
        "You keep waiting to feel like the person who does it. You already are.",
        "Look at you, figuring it out as you go. That's the whole trick.",
        "Your vibe today is 'quietly unstoppable'. Own it.",
        "The version of you that you're becoming is already here, practising.",
        "You're not lost. You're exploring.",
        "Name one thing you're good at. Now name three more. Exactly.",
        "Stop editing yourself down to fit rooms you've outgrown.",
        "You are the plot, not the subplot."
      ]
    },
    love: {
      soft: [
        "The love you keep giving away? Save some for yourself today.",
        "You deserve someone who replies like they mean it.",
        "Your heart isn't broken. It's being renovated.",
        "Not every feeling needs a decision today.",
        "Being soft in a hard world is a superpower.",
        "You don't have to earn rest, love, or a second helping.",
        "The right people won't make you guess.",
        "Let someone take care of you today. Even if it's just you.",
        "Your heart knows the way back to itself.",
        "Loving yourself counts. It might count the most.",
        "If it costs you your peace, it's too expensive.",
        "You were never too much. They were not enough.",
        "Send a nice text to someone you love. Include yourself."
      ],
      bold: [
        "Say it. The worst case is that you were brave.",
        "Someone is thinking about you right now. Smile accordingly.",
        "Romance is coming. Possibly with yourself. Still counts.",
        "Love is loud today. Let it be.",
        "You're the catch. Act accordingly.",
        "Text first. It's chic.",
        "Your heart's been practising. It's ready for the real thing.",
        "Fall in love with your life a little today.",
        "Kiss the cheek. Write the letter. Take the photo.",
        "Somebody's favourite person? Yeah. You.",
        "Let yourself be adored without asking why.",
        "Your love language today: a long walk and a big laugh.",
        "Be the warm, honest thing you've been waiting to receive."
      ]
    },
    wake: {
      soft: [
        "You already know. You've known for a while. It's okay to admit it.",
        "The thing you're avoiding is smaller than the dread around it.",
        "Five minutes. Just open it. That's the whole assignment.",
        "Avoiding it is also a choice, and it's costing you sleep.",
        "Feeling it is how you get through it.",
        "Rest is not the same as hiding. Check which one you're doing.",
        "You can't heal what you keep scrolling past.",
        "Be honest with yourself first. The rest gets easier.",
        "The obvious answer is usually the right one. Annoying, but true.",
        "Ask for help. That is also a way of doing it.",
        "The pile won't shrink by staring at it. Pick one thing.",
        "You're tired because you're carrying it. Put it down by finishing it."
      ],
      bold: [
        "Lovingly: stop. Do the thing.",
        "Your future self is waiting at the finish line holding snacks. Go.",
        "No more 'tomorrow'. Tomorrow is busy.",
        "That task? 20 minutes, max. You've spent hours avoiding it.",
        "Close this app and do the scary email. We'll be here.",
        "You don't need motivation. You need to start, and then motivation shows up.",
        "The plot can't move forward while you're stuck in the loading screen.",
        "Delete the app. Make the call. Drink the water.",
        "Today's dare: finish one thing you started.",
        "Yes, you have to text them back. Yes, today.",
        "Stop researching. Start doing.",
        "You're not confused, you're stalling. Lovingly: go."
      ]
    },
    little: {
      soft: [
        "Drink a glass of water. That's today's whole quest.",
        "Open a window. Let some new air in.",
        "Do one tiny thing, then let that be enough.",
        "Make your bed. Future you will feel like a functioning adult.",
        "Eat something warm. Things look better after soup.",
        "You don't have to fix your whole life today. Just the next hour.",
        "Put on a song you loved at 15. Trust the process.",
        "A shower can be a reset button. Press it.",
        "Step outside for five minutes. The sky misses you.",
        "Cross one thing off. Then cross off 'cross something off'.",
        "Breathe in for four. Out for six. Repeat until shoulders drop.",
        "Today, 'good enough' is excellent.",
        "Call someone who makes you laugh. That's medicine.",
        "Tidy one corner. It counts as tidying your mind."
      ],
      bold: [
        "Tiny wins add up to big ones. Bank one today.",
        "Go for a walk with no destination. Notice three pretty things.",
        "Buy yourself flowers. Or steal one from a bush (kindly).",
        "Light a candle, sit down, sip something nice. You earned it.",
        "Make a playlist for exactly how you feel today.",
        "Send a meme to an old friend. Rebuild the bridge.",
        "Write down three things that went right. They did.",
        "Cook something you've never made before. Low stakes, high joy.",
        "Romanticise the boring stuff. Groceries can be a montage.",
        "Stretch like a cat. Have the confidence of a cat. Be the cat.",
        "Take a photo of something beautiful you'd normally walk past.",
        "Clean your phone screen. Look how clear things get."
      ]
    },
    twist: {
      soft: [
        "Maybe the plot twist is that you stop waiting for permission.",
        "Things are rearranging. It feels messy because it's working.",
        "The ending you're worried about isn't written yet.",
        "Something you lost is making room for something you'll love.",
        "Change is coming, and it's kinder than you think.",
        "What feels like a detour might be the scenic route.",
        "The story gets good right after the part where you almost quit.",
        "Plot twist: it was never about being perfect.",
        "You'll laugh about this in a year. Possibly sooner.",
        "A small surprise is on its way. Keep an eye out.",
        "Not everything needs a plan. Some things need a yes.",
        "Your next chapter is already drafting itself."
      ],
      bold: [
        "Do something today that your routine would never allow.",
        "Take a different route home. Something's waiting on it.",
        "Plot twist: you're the lucky one this time.",
        "Wear the outfit. Go to the thing. Talk to the stranger.",
        "Something unexpected and wonderful is warming up backstage.",
        "Say yes to the next invite. The universe planned it.",
        "Change one tiny thing and watch the whole day shift.",
        "Expect the unexpected and dress accordingly.",
        "Life is about to get interesting. Grab popcorn.",
        "Your boredom is a costume. The adventure is underneath.",
        "Book the trip, even a small one. Plot twists love a train ride.",
        "A door you forgot about is about to swing open."
      ]
    }
  };

  /* Little personalised P.S. lines based on quiz answers */
  const PS = {
    lowWater: ["P.S. drink some water, little raisin. 💧", "P.S. hydrate. Your brain is mostly water and it's thirsty."],
    lowSleep: ["P.S. early night tonight. Non-negotiable. 🌙", "P.S. a nap is a valid plan."],
    lowEnergy: ["P.S. half-speed is still a speed.", "P.S. you're allowed to recharge before you reply."],
    highStress: ["P.S. unclench your jaw. Drop your shoulders. There.", "P.S. one tab at a time."],
    lowKind: ["P.S. talk to yourself like someone you love.", "P.S. your inner critic is not invited today."],
    highJoy: ["P.S. bottle today's vibe. You'll want it later. ✨", "P.S. tell someone about your good day."]
  };

  /* ---------- MANIFEST / JOURNAL PROMPTS ---------- */
  const PROMPTS = [
    { id: "more",    label: "Something I want more of",          ph: "e.g. adventure" },
    { id: "letgo",   label: "Something I'm ready to let go of",  ph: "e.g. overthinking" },
    { id: "hope",    label: "Something I hope happens this month", ph: "e.g. a plot twist" },
    { id: "becoming",label: "A version of me I'm becoming",      ph: "e.g. braver" },
    { id: "grateful",label: "A tiny thing I'm grateful for today", ph: "e.g. the good chai" },
    { id: "note",    label: "A note to future me",               ph: "e.g. you were right to try" }
  ];

  const WALKTHROUGH = [
    { pose: "cookie-hello", title: "Hi, I'm your cookie. ♡", body: "Every day, a fresh fortune cookie is baked just for you. Here's how it works, in four tiny steps." },
    { pose: "cookie-wink", title: "1. Answer a few silly questions", body: "Drag each slider to wherever feels right. No wrong answers, no overthinking, just vibes." },
    { pose: "cookie-letter", title: "2. Crack your cookie", body: "Tap the cookie to crack it open. Your answers decide what kind of fortune you get." },
    { pose: "cookie-note", title: "3. Keep it, share it", body: "Every fortune becomes a pretty card to download or share, and lands in your cookie calendar." },
    { pose: "cookie-shy", title: "4. Tell the universe", body: "Jot down tiny intentions in your manifest journal. Come back tomorrow for a new cookie." }
  ];

  return { DAILY_CORE, DAILY_BANK, KINDS, FORTUNES, PS, PROMPTS, WALKTHROUGH };
})();
