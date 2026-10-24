/* =========================================================
   Fortune Cookie — app logic
   ========================================================= */
(function () {
  "use strict";
  const CFG = window.FC_CONFIG || {};
  const C = window.FC_CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- dates (always the user's local day) ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDay = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const prettyDay = (k) => parseDay(k).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* =========================================================
     DATA LAYER — Supabase when configured, browser storage otherwise
     ========================================================= */
  const useSupabase = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const sb = useSupabase ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

  const LS = {
    get(k, d) { try { const v = localStorage.getItem("fc_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("fc_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  async function hash(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    return btoa(s);
  }

  const DB = {
    async session() {
      if (sb) { const { data } = await sb.auth.getSession(); return data.session ? { id: data.session.user.id, email: data.session.user.email, name: data.session.user.user_metadata?.name } : null; }
      const id = LS.get("session", null); if (!id) return null;
      const u = LS.get("users", {})[id]; return u ? { id, email: u.email, name: u.name } : null;
    },
    async signUp(name, email, pass) {
      email = email.trim().toLowerCase();
      if (sb) {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { name } } });
        if (error) throw error;
        if (!data.session) {
          const r = await sb.auth.signInWithPassword({ email, password: pass });
          if (r.error) throw new Error("Account created! Check your inbox to confirm your email, then log in.");
        }
        return;
      }
      const users = LS.get("users", {});
      if (Object.values(users).some((u) => u.email === email)) throw new Error("That email already has an account. Try logging in.");
      const id = "u_" + Date.now().toString(36);
      users[id] = { email, name, pass: await hash(pass), plan: "free", onboarded: false };
      LS.set("users", users); LS.set("session", id);
    },
    async signIn(email, pass) {
      email = email.trim().toLowerCase();
      if (sb) { const { error } = await sb.auth.signInWithPassword({ email, password: pass }); if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message); return; }
      const users = LS.get("users", {}); const h = await hash(pass);
      const id = Object.keys(users).find((k) => users[k].email === email);
      if (!id || users[id].pass !== h) throw new Error("That email and password don't match.");
      LS.set("session", id);
    },
    async signOut() { if (sb) await sb.auth.signOut(); else LS.set("session", null); },

    async profile(uid) {
      if (sb) {
        let { data } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
        if (!data) { await sb.from("profiles").insert({ id: uid, name: State.user.name || null }); data = { id: uid, plan: "free", onboarded: false, name: State.user.name }; }
        return data;
      }
      const u = LS.get("users", {})[uid]; return { id: uid, name: u.name, plan: u.plan || "free", onboarded: !!u.onboarded };
    },
    async updateProfile(uid, patch) {
      if (sb) { const { error } = await sb.from("profiles").update(patch).eq("id", uid); if (error) throw error; return; }
      const users = LS.get("users", {}); Object.assign(users[uid], patch); LS.set("users", users);
    },

    async cookies(uid) {
      if (sb) { const { data, error } = await sb.from("cookies").select("*").eq("user_id", uid).order("created_at", { ascending: true }); if (error) throw error; return data || []; }
      return LS.get("cookies_" + uid, []);
    },
    async addCookie(uid, c) {
      const row = { user_id: uid, day: c.day, kind: c.kind, fortune: c.fortune, answers: c.answers };
      if (sb) { const { data, error } = await sb.from("cookies").insert(row).select().single(); if (error) throw error; return data; }
      const list = LS.get("cookies_" + uid, []); const r = { ...row, id: "c_" + Date.now(), created_at: new Date().toISOString() };
      list.push(r); LS.set("cookies_" + uid, list); return r;
    },

    async journals(uid) {
      if (sb) { const { data, error } = await sb.from("journal").select("*").eq("user_id", uid); if (error) throw error; return data || []; }
      return LS.get("journal_" + uid, []);
    },
    async saveJournal(uid, day, entries) {
      if (sb) { const { error } = await sb.from("journal").upsert({ user_id: uid, day, entries, updated_at: new Date().toISOString() }); if (error) throw error; return; }
      const list = LS.get("journal_" + uid, []); const i = list.findIndex((j) => j.day === day);
      const r = { user_id: uid, day, entries, updated_at: new Date().toISOString() };
      if (i >= 0) list[i] = r; else list.push(r); LS.set("journal_" + uid, list);
    }
  };

  /* =========================================================
     STATE
     ========================================================= */
  const State = { user: null, profile: null, cookies: [], journals: [], calMonth: new Date(), current: null };
  const isOwner = () => !!(State.user && State.user.email && (CFG.PLUS_EMAILS || []).map((e) => e.toLowerCase()).includes(State.user.email.toLowerCase()));
  // Owner accounts can preview the Free tier on this device (never saved to the database).
  const previewFree = () => { try { return sessionStorage.getItem("fc_preview_free") === "1"; } catch (e) { return false; } };
  const isPlus = () => (isOwner() && !previewFree()) || (State.profile && State.profile.plan === "plus");
  const todayDaily = () => State.cookies.filter((c) => c.day === dayKey() && c.kind !== "themed" && !(c.answers && c.answers.themed)).slice(-1)[0];
  const latestToday = () => State.cookies.filter((c) => c.day === dayKey()).slice(-1)[0];

  /* =========================================================
     UI HELPERS
     ========================================================= */
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
  const show = (id) => { $("#" + id).hidden = false; document.body.style.overflow = "hidden"; };
  const hide = (id) => { $("#" + id).hidden = true; if (!$$(".overlay").some((o) => !o.hidden)) document.body.style.overflow = ""; };
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => hide(b.dataset.close)));
  $$(".overlay").forEach((o) => o.addEventListener("click", (e) => { if (e.target === o && o.id !== "crackOverlay" && o.id !== "walkOverlay") hide(o.id); }));

  /* =========================================================
     SOUND — cookie crack + chime, made with Web Audio (no files)
     ========================================================= */
  let actx;
  function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (actx && actx.state === "suspended") actx.resume().catch(() => {}); return actx; }

  /* ---- sound files: decoded once, played through Web Audio (works on iPhone too) ---- */
  const SFX = {};
  function loadSound(name) {
    const ctx = audio(); if (!ctx) return Promise.resolve(null);
    if (!SFX[name]) SFX[name] = fetch("sounds/" + name + ".mp3").then((r) => r.arrayBuffer())
      .then((b) => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej))).catch(() => null);
    return SFX[name];
  }
  async function playSfx(name, gain = 1) {
    const ctx = audio(); const buf = ctx && (await loadSound(name)); if (!buf) return false;
    const s = ctx.createBufferSource(); s.buffer = buf; const g = ctx.createGain(); g.gain.value = gain;
    s.connect(g).connect(ctx.destination); s.start(); return true;
  }

  /* ---- background lullaby: gapless loop, low volume, remembers on/off ---- */
  const MUSIC_VOL = typeof CFG.MUSIC_VOLUME === "number" ? CFG.MUSIC_VOLUME : 0.16;
  const Music = { on: LS.get("music", true), src: null, gain: null };
  function musicTo(v, secs = 1.5) {
    if (!Music.gain) return; const ctx = audio(); const g = Music.gain.gain;
    g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(v, ctx.currentTime + secs);
  }
  async function startMusic() {
    if (!Music.on || Music.src) return;
    const ctx = audio(); if (!ctx) return; const buf = await loadSound("lullaby"); if (!buf || Music.src || !Music.on) return;
    Music.gain = ctx.createGain(); Music.gain.gain.value = 0; Music.gain.connect(ctx.destination);
    Music.src = ctx.createBufferSource(); Music.src.buffer = buf; Music.src.loop = true; Music.src.connect(Music.gain); Music.src.start();
    musicTo(MUSIC_VOL, 3);
  }
  function stopMusic() {
    if (!Music.src) return; const src = Music.src; musicTo(0, 0.6);
    setTimeout(() => { try { src.stop(); } catch (e) {} }, 700); Music.src = null;
  }
  function renderMusicBtn() { const b = $("#musicBtn"); b.textContent = Music.on ? "♪ music on" : "♪ music off"; b.classList.toggle("off", !Music.on); b.setAttribute("aria-pressed", Music.on); }
  $("#musicBtn").addEventListener("click", (e) => {
    e.stopPropagation(); Music.on = !Music.on; LS.set("music", Music.on); renderMusicBtn();
    if (Music.on) { audio(); startMusic(); } else stopMusic();
  });
  renderMusicBtn();
  // Browsers only allow sound after the first tap/click/keypress, so the lullaby starts then.
  const firstGesture = () => { audio(); startMusic(); loadSound("crack"); loadSound("paper"); };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => document.addEventListener(ev, firstGesture, { once: true, passive: true }));
  startMusic(); // plays right away where the browser allows it
  function crackSound() {
    const ctx = audio(); if (!ctx) return;
    const now = ctx.currentTime;
    const crunch = (t, dur, freq, gain) => {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const env = Math.pow(1 - i / len, 3); d[i] = (Math.random() * 2 - 1) * env * (Math.random() < 0.2 ? 1 : 0.35); }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 0.9;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(bp).connect(g).connect(ctx.destination); src.start(now + t);
    };
    crunch(0, 0.09, 2400, 1.4); crunch(0.05, 0.14, 1500, 1.2); crunch(0.13, 0.08, 3200, 0.8);
    crunch(0.19, 0.16, 1100, 0.9); crunch(0.3, 0.1, 2800, 0.5); crunch(0.38, 0.12, 1800, 0.35);
  }
  function chime() {
    const ctx = audio(); if (!ctx) return;
    [880, 1318.5, 1760].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); const t = ctx.currentTime + 0.05 + i * 0.09;
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1);
    });
  }

  /* =========================================================
     AUTH SCREEN
     ========================================================= */
  let authMode = "signup";
  function setAuthMode(m) {
    authMode = m;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.mode === m));
    $("#nameField").hidden = m === "login";
    $("#authTitle").textContent = m === "signup" ? "Let's bake your first cookie." : "Welcome back. Your cookie missed you.";
    $("#authSubmit").textContent = m === "signup" ? "CREATE MY ACCOUNT →" : "LOG IN →";
    $("#authSwitch").innerHTML = m === "signup" ? 'Already have an account? <a href="#" data-switch="login">Log in</a>' : 'New here? <a href="#" data-switch="signup">Create an account</a>';
    $("#authPass").autocomplete = m === "signup" ? "new-password" : "current-password";
    $("#authError").textContent = "";
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => setAuthMode(t.dataset.mode)));
  $("#authSwitch").addEventListener("click", (e) => { const a = e.target.closest("[data-switch]"); if (a) { e.preventDefault(); setAuthMode(a.dataset.switch); } });
  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#authName").value.trim(), email = $("#authEmail").value, pass = $("#authPass").value;
    const err = $("#authError"); err.textContent = "";
    if (authMode === "signup" && !name) { err.textContent = "Tell us what to call you ♡"; return; }
    if (pass.length < 6) { err.textContent = "Password needs at least 6 characters."; return; }
    const btn = $("#authSubmit"); btn.disabled = true; const label = btn.textContent; btn.textContent = "ONE SEC…";
    try {
      if (authMode === "signup") await DB.signUp(name, email, pass); else await DB.signIn(email, pass);
      await boot();
    } catch (ex) { err.textContent = ex.message || "Something went wrong. Try again?"; }
    btn.disabled = false; btn.textContent = label;
  });
  $("#logoutBtn").addEventListener("click", async () => { await DB.signOut(); State.user = null; $("#app").hidden = true; $("#auth").hidden = false; setAuthMode("login"); window.scrollTo(0, 0); });

  /* =========================================================
     WALKTHROUGH
     ========================================================= */
  let walkI = 0, walkDone;
  function walkthrough() {
    return new Promise((res) => {
      walkDone = res; walkI = 0; renderWalk(); show("walkOverlay");
    });
  }
  function renderWalk() {
    const s = C.WALKTHROUGH[walkI];
    $("#walkImg").src = "images/" + s.pose + ".png";
    $("#walkTitle").textContent = walkI === 0 && State.user.name ? `Hi ${State.user.name}, I'm your cookie. ♡` : s.title;
    $("#walkBody").textContent = s.body;
    $("#walkDots").innerHTML = C.WALKTHROUGH.map((_, i) => `<i class="${i === walkI ? "on" : ""}"></i>`).join("");
    $("#walkNext").textContent = walkI === C.WALKTHROUGH.length - 1 ? "LET'S CRACK ONE 🥠" : "NEXT →";
    $("#walkSkip").style.visibility = walkI === C.WALKTHROUGH.length - 1 ? "hidden" : "visible";
  }
  async function finishWalk() {
    hide("walkOverlay"); State.profile.onboarded = true;
    try { await DB.updateProfile(State.user.id, { onboarded: true }); } catch (e) {}
    walkDone && walkDone();
  }
  $("#walkNext").addEventListener("click", () => { if (walkI < C.WALKTHROUGH.length - 1) { walkI++; renderWalk(); } else finishWalk(); });
  $("#walkSkip").addEventListener("click", finishWalk);

  /* =========================================================
     QUIZ (daily + themed)
     ========================================================= */
  function seeded(seedStr) { let h = 2166136261; for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
  function dailyQuestions(extraSeed = "") {
    const rnd = seeded(dayKey() + (State.user ? State.user.id : "") + extraSeed);
    const pool = C.DAILY_BANK.slice(); const picked = [];
    // spread across dimensions: shuffle then pick at most 2 per dim
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const per = {};
    for (const q of pool) { if (picked.length >= 8) break; if ((per[q.dim] || 0) >= 2) continue; per[q.dim] = (per[q.dim] || 0) + 1; picked.push(q); }
    return [C.DAILY_CORE[0], ...picked.slice(0, 4), C.DAILY_CORE[1], ...picked.slice(4), C.DAILY_CORE[2]];
  }

  let Q = null;
  function startQuiz(opts) {
    Q = { questions: opts.questions, answers: {}, i: 0, kind: opts.kind || null, title: opts.title };
    $("#quizEyebrow").textContent = opts.title;
    renderQ(); show("quizOverlay");
  }
  function renderQ() {
    const q = Q.questions[Q.i];
    $("#qEmoji").textContent = q.emoji || (Q.kind ? C.KINDS[Q.kind].emoji : "✨");
    const t = $("#qText"); t.textContent = q.q; t.classList.remove("q-anim"); void t.offsetWidth; t.classList.add("q-anim");
    $("#qLeft").textContent = q.left; $("#qRight").textContent = q.right;
    $("#qSlider").value = Q.answers[q.id] ?? 50;
    $("#quizBar").style.width = ((Q.i) / Q.questions.length) * 100 + "%";
    $("#quizCount").textContent = `${Q.i + 1} / ${Q.questions.length}`;
    $("#qBack").style.visibility = Q.i === 0 ? "hidden" : "visible";
    $("#qNext").textContent = Q.i === Q.questions.length - 1 ? "BAKE MY COOKIE 🥠" : "NEXT →";
  }
  $("#qSlider").addEventListener("input", (e) => { Q.answers[Q.questions[Q.i].id] = +e.target.value; });
  $("#qNext").addEventListener("click", () => {
    const q = Q.questions[Q.i]; if (Q.answers[q.id] == null) Q.answers[q.id] = +$("#qSlider").value;
    if (Q.i < Q.questions.length - 1) { Q.i++; renderQ(); } else { $("#quizBar").style.width = "100%"; finishQuiz(); }
  });
  $("#qBack").addEventListener("click", () => { if (Q.i > 0) { Q.i--; renderQ(); } });
  $("#quizClose").addEventListener("click", () => hide("quizOverlay"));
  document.addEventListener("keydown", (e) => {
    if ($("#quizOverlay").hidden) return;
    if (e.key === "Enter") $("#qNext").click();
  });

  /* ---------- fortune engine ---------- */
  function dims(questions, answers) {
    const acc = {};
    questions.forEach((q) => { const v = answers[q.id]; if (v == null) return; (acc[q.dim] = acc[q.dim] || []).push(v); });
    const out = {}; Object.keys(acc).forEach((k) => (out[k] = Math.round(acc[k].reduce((a, b) => a + b, 0) / acc[k].length)));
    return out;
  }
  function chooseKind(d) {
    const g = (k, def = 50) => (d[k] == null ? def : d[k]);
    const score = {
      little: (g("stress") + (100 - g("energy")) + (100 - g("body")) + (100 - g("sleep"))) / 4,
      wake: g("avoid", 40) * 1.05,
      love: g("heart", 40),
      twist: g("chaos", 40),
      mirror: ((100 - g("selfkind")) + (100 - g("social")) + (100 - g("mood"))) / 3,
      sign: (g("drive") + g("mood")) / 2
    };
    Object.keys(score).forEach((k) => (score[k] += Math.random() * 8));
    return Object.keys(score).sort((a, b) => score[b] - score[a])[0];
  }
  function tone(d) {
    const g = (k, def = 50) => (d[k] == null ? def : d[k]);
    const low = g("mood") < 45 || g("stress") > 62 || g("energy") < 35 || g("fear") > 62 || g("selfkind") < 35;
    return low ? "soft" : "bold";
  }
  function pickFortune(kind, t) {
    const bank = C.FORTUNES[kind][t];
    const recent = new Set(State.cookies.slice(-40).map((c) => c.fortune));
    const fresh = bank.filter((f) => !recent.has(f));
    const list = fresh.length ? fresh : bank;
    return list[Math.floor(Math.random() * list.length)];
  }
  function pickPS(d) {
    const r = (a) => a[Math.floor(Math.random() * a.length)];
    if (d.water != null && d.water < 30) return r(C.PS.lowWater);
    if (d.sleep != null && d.sleep < 28) return r(C.PS.lowSleep);
    if (d.stress != null && d.stress > 75) return r(C.PS.highStress);
    if (d.energy != null && d.energy < 25) return r(C.PS.lowEnergy);
    if (d.selfkind != null && d.selfkind < 30) return r(C.PS.lowKind);
    if (d.mood != null && d.mood > 80) return r(C.PS.highJoy);
    return "";
  }
  const luckyNum = () => Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 49)).sort((a, b) => a - b).join(" · ");

  async function finishQuiz() {
    hide("quizOverlay");
    const d = dims(Q.questions, Q.answers);
    const themed = !!Q.kind;
    const kind = themed ? Q.kind : chooseKind(d);
    const t = tone(d);
    const fortune = pickFortune(kind, t);
    const ps = themed ? "" : pickPS(d);
    const answers = { vals: Q.answers, dims: d, ps, tone: t, themed, lucky: luckyNum() };
    let row;
    try { row = await DB.addCookie(State.user.id, { day: dayKey(), kind, fortune, answers }); }
    catch (e) { toast("Couldn't save your cookie. Check your connection."); row = { day: dayKey(), kind, fortune, answers }; }
    State.cookies.push(row);
    State.current = row;
    crackStage(row);
  }

  /* =========================================================
     CRACK STAGE
     ========================================================= */
  let cracked = false;
  function crackStage(row) {
    cracked = false;
    const pose = "cookie-hello";
    $("#crackWhole").src = "images/" + pose + ".png";
    $("#halfL").style.backgroundImage = $("#halfR").style.backgroundImage = `url(images/${pose}.png)`;
    $("#cookieBtn").className = "cookie-btn";
    $("#strip").className = "strip"; $("#stripText").textContent = ""; $("#stripLucky").style.opacity = 0;
    $("#crackActions").hidden = true; $("#crackHint").textContent = "TAP THE COOKIE TO CRACK IT ✦"; $("#crackHint").style.visibility = "visible";
    $("#confetti").innerHTML = "";
    show("crackOverlay");
  }
  $("#cookieBtn").addEventListener("click", () => {
    if (cracked) return; cracked = true;
    const btn = $("#cookieBtn"); audio(); loadSound("crack"); loadSound("paper");
    musicTo(MUSIC_VOL * 0.3, 0.4); // duck the music so the crunch is the star
    btn.classList.add("shake");
    setTimeout(() => {
      playSfx("crack", 1).then((ok) => { if (!ok) crackSound(); });
      btn.classList.add("cracked"); burst();
      $("#crackHint").style.visibility = "hidden";
      setTimeout(() => {
        $("#strip").classList.add("show");
        playSfx("paper", 0.8).then((ok) => { if (!ok) chime(); });
        typeText($("#stripText"), State.current.fortune, () => {
          musicTo(MUSIC_VOL, 2.5);
          const ps = State.current.answers && State.current.answers.ps;
          $("#stripLucky").textContent = (ps ? ps + "  ·  " : "") + "LUCKY NUMBERS " + (State.current.answers?.lucky || luckyNum());
          $("#stripLucky").style.opacity = 1; $("#crackActions").hidden = false;
        });
      }, 420);
    }, 430);
  });
  function typeText(el, text, done) {
    el.textContent = ""; let i = 0;
    const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(tick, 22); else done && done(); };
    setTimeout(tick, 1000); // wait for the paper to crinkle open
  }
  function burst() {
    const box = $("#confetti"); const bits = ["✦", "✧", "♡", "★", "✿", "·"]; const cols = ["#FFE98D", "#FFCDE0", "#F4420C", "#CED98E", "#fff"];
    box.innerHTML = Array.from({ length: 34 }, () => {
      const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
      return `<i style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;--r:${Math.random() * 360}deg;color:${cols[Math.floor(Math.random() * cols.length)]};animation-delay:${Math.random() * 0.15}s">${bits[Math.floor(Math.random() * bits.length)]}</i>`;
    }).join("");
  }
  $("#crackDone").addEventListener("click", () => { hide("crackOverlay"); renderAll(); document.getElementById("today").scrollIntoView(); });
  $("#crackCard").addEventListener("click", () => { hide("crackOverlay"); renderAll(); openShare(State.current); });

  /* =========================================================
     SHARE CARDS (canvas → PNG)
     ========================================================= */
  const STYLES = [
    { id: "classic", name: "Classic", bg: "#FFE98D", ink: "#621D40", accent: "#F4420C", paper: "#FFF8EC", plus: false },
    { id: "blush", name: "Blush", bg: "#FFCDE0", ink: "#621D40", accent: "#F4420C", paper: "#FFFFFF", plus: true },
    { id: "midnight", name: "Midnight", bg: "#621D40", ink: "#FFF8EC", accent: "#FFE98D", paper: "#6E2A4C", plus: true },
    { id: "matcha", name: "Matcha", bg: "#CED98E", ink: "#621D40", accent: "#F4420C", paper: "#FFF8EC", plus: true },
    { id: "sunset", name: "Sunset", bg: "grad", ink: "#FFFFFF", accent: "#FFE98D", paper: "rgba(255,255,255,.14)", plus: true }
  ];
  let share = { fmt: "post", style: "classic", blob: null, url: "" };
  const imgCache = {};
  const loadImg = (src) => imgCache[src] || (imgCache[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

  function wrapLines(ctx, text, maxW) {
    const words = text.split(" "); const lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  async function drawCard(row) {
    const st = STYLES.find((s) => s.id === share.style);
    const W = 1080, H = share.fmt === "story" ? 1920 : share.fmt === "square" ? 1080 : 1350;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d");
    try { await Promise.all([document.fonts.load('80px "DM Serif Display"'), document.fonts.load('40px "Bebas Neue"'), document.fonts.load('30px "DM Sans"')]); } catch (e) {}
    // background
    if (st.bg === "grad") { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#F4420C"); g.addColorStop(0.55, "#C2306A"); g.addColorStop(1, "#621D40"); ctx.fillStyle = g; }
    else ctx.fillStyle = st.bg;
    ctx.fillRect(0, 0, W, H);
    // soft blobs
    ctx.globalAlpha = 0.35; ctx.fillStyle = st.id === "classic" ? "#CED98E" : st.id === "midnight" ? "#8a3a62" : "#ffffff";
    ctx.beginPath(); ctx.arc(W + 40, -40, 300, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-60, H + 40, 280, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // sparkles
    ctx.fillStyle = st.ink; ctx.font = '48px "DM Sans"';
    [["✦", 120, 300], ["✧", W - 150, H * 0.42], ["♡", 150, H * 0.7], ["✦", W - 200, 200]].forEach(([s, x, y]) => { ctx.globalAlpha = 0.5; ctx.fillText(s, x, y); });
    ctx.globalAlpha = 1;
    // header
    const pad = 90;
    ctx.fillStyle = st.ink; ctx.font = '52px "Bebas Neue"'; ctx.textBaseline = "alphabetic";
    ctx.fillText("FORTUNE COOKIE ✿", pad, pad + 40);
    ctx.font = '34px "Bebas Neue"'; ctx.fillStyle = st.accent; ctx.textAlign = "right";
    ctx.fillText(parseDay(row.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }).toUpperCase(), W - pad, pad + 36);
    ctx.textAlign = "left";
    // cookie image
    const kind = C.KINDS[row.kind] || C.KINDS.sign;
    const img = await loadImg("images/" + kind.pose + ".png");
    const imgW = share.fmt === "story" ? 600 : share.fmt === "square" ? 300 : 460;
    const imgH = img ? imgW * img.height / img.width : 300;
    const fs = share.fmt === "square" ? 58 : share.fmt === "story" ? 78 : 70;
    ctx.font = `${fs}px "DM Serif Display"`;
    const lines = wrapLines(ctx, row.fortune, W - pad * 2 - 80);
    const lh = fs * 1.18; const boxH = lines.length * lh + 90;
    // centre the cookie + label + paper block between header and footer
    const top = pad + 90, bottom = H - 140, total = imgH + 110 + boxH;
    const imgY = top + Math.max(0, (bottom - top - total) / 2);
    if (img) { ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.drawImage(img, (W - imgW) / 2, imgY, imgW, imgH); ctx.restore(); }
    const imgBottom = imgY + imgH;
    // kind label
    ctx.font = '40px "Bebas Neue"'; ctx.fillStyle = st.accent; ctx.textAlign = "center";
    ctx.fillText(("TODAY'S COOKIE: " + kind.name).toUpperCase(), W / 2, imgBottom + 64);
    // paper strip with fortune
    ctx.font = `${fs}px "DM Serif Display"`;
    const boxY = imgBottom + 110;
    ctx.save(); ctx.translate(W / 2, boxY + boxH / 2); ctx.rotate(-0.018);
    ctx.fillStyle = st.paper; ctx.shadowColor = "rgba(0,0,0,.14)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    roundRect(ctx, -(W - pad * 2) / 2, -boxH / 2, W - pad * 2, boxH, 14); ctx.fill(); ctx.restore();
    ctx.fillStyle = st.id === "sunset" ? "#fff" : st.id === "midnight" ? "#FFF8EC" : "#621D40";
    lines.forEach((l, i) => ctx.fillText(l, W / 2, boxY + 60 + i * lh + fs * 0.35));
    // footer
    ctx.font = '30px "DM Sans"'; ctx.fillStyle = st.ink; ctx.globalAlpha = 0.85;
    ctx.fillText("crack yours ✦ " + siteHost(), W / 2, H - 80); ctx.globalAlpha = 1; ctx.textAlign = "left";
    return cv;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const siteURL = () => (CFG.SITE_URL || location.origin + location.pathname).replace(/\/$/, "");
  const siteHost = () => siteURL().replace(/^https?:\/\//, "");

  async function openShare(row) {
    State.current = row;
    if (!isPlus() && STYLES.find((s) => s.id === share.style).plus) share.style = "classic";
    $("#styleSwatches").innerHTML = STYLES.map((s) => `<button class="swatch ${s.id === share.style ? "active" : ""} ${s.plus && !isPlus() ? "locked" : ""}" data-style="${s.id}" title="${s.name}${s.plus ? " (Plus)" : ""}" style="background:${s.bg === "grad" ? "linear-gradient(135deg,#F4420C,#621D40)" : s.bg}"></button>`).join("");
    $("#styleNote").textContent = isPlus() ? "Premium card styles unlocked ✦" : "Premium card styles come with Fortune Cookie Plus.";
    show("shareOverlay");
    await renderCard();
  }
  async function renderCard() {
    const cv = await drawCard(State.current);
    share.url = cv.toDataURL("image/png");
    $("#cardImg").src = share.url;
    share.blob = await new Promise((r) => cv.toBlob(r, "image/png"));
  }
  $("#fmtSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("#fmtSeg button").forEach((x) => x.classList.toggle("active", x === b)); share.fmt = b.dataset.fmt; renderCard(); });
  $("#styleSwatches").addEventListener("click", (e) => {
    const b = e.target.closest(".swatch"); if (!b) return;
    const s = STYLES.find((x) => x.id === b.dataset.style);
    if (s.plus && !isPlus()) { toast("That style is part of Fortune Cookie Plus ✦"); return; }
    share.style = s.id; $$(".swatch").forEach((x) => x.classList.toggle("active", x === b)); renderCard();
  });
  $("#shareClose").addEventListener("click", () => hide("shareOverlay"));

  function download() { const a = document.createElement("a"); a.href = share.url; a.download = `fortune-cookie-${State.current.day}.png`; document.body.appendChild(a); a.click(); a.remove(); }
  async function nativeShare(withText = true) {
    const file = share.blob ? new File([share.blob], "fortune-cookie.png", { type: "image/png" }) : null;
    const data = { title: "My fortune cookie 🥠", text: withText ? `"${State.current.fortune}" 🥠 Crack yours: ${siteURL()}` : "" };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ ...data, files: [file] }); return true; }
    if (navigator.share) { await navigator.share({ ...data, url: siteURL() }); return true; }
    return false;
  }
  $$(".share-btn").forEach((b) => b.addEventListener("click", async () => {
    const text = `"${State.current.fortune}" 🥠 Crack your own fortune cookie: ${siteURL()}`;
    const type = b.dataset.share;
    try {
      if (type === "download") { download(); toast("Card saved ♡"); }
      else if (type === "instagram") {
        const ok = await nativeShare(false).catch(() => false);
        if (!ok) { download(); toast("Card downloaded. Post it to your Instagram story ✦"); }
      }
      else if (type === "more") { const ok = await nativeShare().catch(() => false); if (!ok) { download(); toast("Sharing isn't supported here, so we downloaded your card."); } }
      else if (type === "whatsapp") window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
      else if (type === "x") window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text), "_blank");
      else if (type === "pinterest") { download(); window.open("https://www.pinterest.com/pin-builder/?url=" + encodeURIComponent(siteURL()) + "&description=" + encodeURIComponent(text), "_blank"); toast("Card downloaded. Upload it in Pinterest ✦"); }
      else if (type === "email") location.href = "mailto:?subject=" + encodeURIComponent("A fortune cookie for you 🥠") + "&body=" + encodeURIComponent(text);
      else if (type === "copy") { await navigator.clipboard.writeText(text); toast("Copied! Paste it anywhere ✦"); }
    } catch (e) { if (e && e.name !== "AbortError") toast("Couldn't share that one. Try download instead."); }
  }));

  /* =========================================================
     RENDER: TODAY
     ========================================================= */
  function greeting() {
    const h = new Date().getHours(); const n = State.user.name ? ", " + State.user.name.toUpperCase() : "";
    return (h < 5 ? "STILL AWAKE" : h < 12 ? "GOOD MORNING" : h < 17 ? "GOOD AFTERNOON" : "GOOD EVENING") + n + " ✦";
  }
  function streak() {
    const days = new Set(State.cookies.map((c) => c.day)); let s = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }
  function renderToday() {
    $("#greeting").textContent = greeting();
    const c = latestToday();
    $("#todayFilled").hidden = !c; $("#todayEmpty").hidden = !!c;
    $("#streakNum").textContent = streak();
    if (c) {
      const k = C.KINDS[c.kind] || C.KINDS.sign;
      $("#todayKind").textContent = k.emoji + " " + k.name.toUpperCase();
      $("#todayFortune").textContent = c.fortune;
      $("#todayPS").textContent = c.answers?.ps || "";
      $("#todayCookie").src = "images/" + k.pose + ".png";
      $("#todayAgain").textContent = isPlus() ? "CRACK ANOTHER 🥠" : "CRACK ANOTHER (PLUS) 🔒";
      $("#tomorrowNote").textContent = isPlus() ? "Plus: unlimited cookies today. Go wild ✦" : "Your next cookie is baking. Fresh one tomorrow morning ♡";
    } else $("#todayCookie").src = "images/cookie-letter.png";
  }
  $("#todayShare").addEventListener("click", () => { const c = latestToday(); if (c) openShare(c); });
  $("#todayAgain").addEventListener("click", () => {
    if (!isPlus()) { toast("Unlimited cookies come with Plus ✦"); $("#plus").scrollIntoView(); return; }
    startQuiz({ questions: dailyQuestions(String(Date.now())), title: "ANOTHER CHECK-IN ✦" });
  });
  $("#startQuizBtn").addEventListener("click", () => startQuiz({ questions: dailyQuestions(), title: "YOUR DAILY CHECK-IN ✦" }));

  /* =========================================================
     RENDER: CALENDAR
     ========================================================= */
  function renderCalendar() {
    const m = State.calMonth; const y = m.getFullYear(), mo = m.getMonth();
    $("#calTitle").textContent = m.toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();
    const first = new Date(y, mo, 1); const startDow = (first.getDay() + 6) % 7; const days = new Date(y, mo + 1, 0).getDate();
    const byDay = {}; State.cookies.forEach((c) => (byDay[c.day] = byDay[c.day] || []).push(c));
    const jDays = new Set(State.journals.filter((j) => j.entries && Object.values(j.entries).some((v) => v && String(v).trim())).map((j) => j.day));
    const today = dayKey();
    let html = "";
    for (let i = 0; i < startDow; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${pad(mo + 1)}-${pad(d)}`; const cs = byDay[k] || []; const has = cs.length || jDays.has(k);
      const kinds = cs.map((c) => C.KINDS[c.kind] || C.KINDS.sign);
      html += `<button class="cal-day ${has ? "has" : ""} ${k === today ? "today" : ""} ${k > today ? "future" : ""}" data-day="${k}" ${has ? "" : "tabindex='-1'"} aria-label="${prettyDay(k)}${cs.length ? ", " + cs.length + " cookie" + (cs.length > 1 ? "s" : "") : ""}">
        ${jDays.has(k) ? '<span class="c-j">✎</span>' : ""}
        <span>${d}</span>
        ${kinds.length ? `<span class="c-emoji">${kinds[kinds.length - 1].emoji}</span>` : ""}
        ${kinds.length > 1 ? `<span class="c-dots">${kinds.slice(0, 4).map(() => "<i></i>").join("")}</span>` : ""}
      </button>`;
    }
    $("#calGrid").innerHTML = html;
    $("#calLegend").innerHTML = Object.values(C.KINDS).map((k) => `<span>${k.emoji} ${k.name}</span>`).join("") + "<span>✎ journaled</span>";
  }
  $("#calPrev").addEventListener("click", () => { State.calMonth = new Date(State.calMonth.getFullYear(), State.calMonth.getMonth() - 1, 1); renderCalendar(); });
  $("#calNext").addEventListener("click", () => { State.calMonth = new Date(State.calMonth.getFullYear(), State.calMonth.getMonth() + 1, 1); renderCalendar(); });
  $("#calGrid").addEventListener("click", (e) => { const b = e.target.closest(".cal-day.has"); if (b) openDay(b.dataset.day); });

  function openDay(k) {
    const cs = State.cookies.filter((c) => c.day === k);
    const j = State.journals.find((x) => x.day === k);
    $("#dayTitle").textContent = prettyDay(k).toUpperCase();
    let html = cs.length ? "" : `<p class="fine">No cookie cracked this day.</p>`;
    cs.forEach((c, i) => {
      const kd = C.KINDS[c.kind] || C.KINDS.sign;
      html += `<div class="day-cookie"><img src="images/${kd.pose}.png" alt=""><div><span class="label-font" style="color:var(--orange);letter-spacing:1.5px">${kd.emoji} ${esc(kd.name.toUpperCase())}${c.answers?.themed ? " · THEMED" : ""}</span><h3>${esc(c.fortune)}</h3>${c.answers?.ps ? `<p class="fine">${esc(c.answers.ps)}</p>` : ""}<button class="btn btn-ghost btn-sm" data-card="${i}">Get the card ♡</button></div></div>`;
    });
    if (j && j.entries) {
      const rows = C.PROMPTS.filter((p) => j.entries[p.id] && String(j.entries[p.id]).trim()).map((p) => `<dt>${esc(p.label.toUpperCase())}</dt><dd>${esc(j.entries[p.id])}</dd>`).join("");
      if (rows) html += `<dl class="day-j"><p class="eyebrow" style="margin:0">WHAT YOU TOLD THE UNIVERSE</p>${rows}</dl>`;
    }
    $("#dayBody").innerHTML = html;
    $$("[data-card]", $("#dayBody")).forEach((b) => b.addEventListener("click", () => { hide("dayOverlay"); openShare(cs[+b.dataset.card]); }));
    show("dayOverlay");
  }
  $("#dayClose").addEventListener("click", () => hide("dayOverlay"));

  /* =========================================================
     RENDER: JOURNAL
     ========================================================= */
  function renderJournal() {
    const j = State.journals.find((x) => x.day === dayKey()); const e = (j && j.entries) || {};
    $("#promptGrid").innerHTML = C.PROMPTS.map((p) => `<div class="prompt"><label for="p_${p.id}">${esc(p.label.toUpperCase())}</label><textarea id="p_${p.id}" rows="1" maxlength="280" placeholder="${esc(p.ph)}">${esc(e[p.id] || "")}</textarea></div>`).join("");
    $$("#promptGrid textarea").forEach((t) => { const fit = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }; t.addEventListener("input", fit); fit(); });
  }
  $("#saveJournal").addEventListener("click", async () => {
    const entries = {}; C.PROMPTS.forEach((p) => (entries[p.id] = $("#p_" + p.id).value.trim()));
    if (!Object.values(entries).some(Boolean)) { toast("Write at least one tiny thing ♡"); return; }
    const btn = $("#saveJournal"); btn.disabled = true;
    try {
      await DB.saveJournal(State.user.id, dayKey(), entries);
      const i = State.journals.findIndex((x) => x.day === dayKey()); const r = { day: dayKey(), entries };
      if (i >= 0) State.journals[i] = r; else State.journals.push(r);
      toast("Sent to the universe ✦ It's in your calendar now.");
      renderCalendar(); renderDash();
    } catch (e) { toast("Couldn't save. Check your connection and try again."); }
    btn.disabled = false;
  });

  /* =========================================================
     RENDER: PLUS
     ========================================================= */
  function renderPlus() {
    document.body.classList.toggle("is-plus", isPlus());
    const pill = $("#planPill"); pill.textContent = isPlus() ? "PLUS ✦" : "FREE"; pill.classList.toggle("plus", isPlus());
    $("#plusTitle").textContent = isPlus() ? "The whole universe is yours." : "The whole universe.";
    $("#plusSub").textContent = isPlus() ? "Pick the cookie you need today. Five tiny questions, one very specific fortune." : "Not every day needs the same kind of fortune. With Plus, pick the cookie you need, take its tiny quiz, and crack it.";
    $("#kindGrid").innerHTML = Object.entries(C.KINDS).map(([id, k]) => `<button class="kind-card ${isPlus() ? "" : "locked"}" data-kind="${id}">
      ${isPlus() ? "" : '<span class="lock">🔒</span>'}<span class="k-emoji">${k.emoji}</span><h3>${esc(k.name.toUpperCase())}</h3><p>${esc(k.tag)}</p>
      <span class="k-go">${isPlus() ? "Take the 5-question quiz →" : "Unlock with Plus"}</span><img src="images/${k.pose}.png" alt=""></button>`).join("");
    $("#pricing").hidden = isPlus();
    // Testing toggle: owners preview Free/Plus locally; in demo mode (no Supabase) it switches the local plan.
    const canToggle = isOwner() || (!sb && isPlus());
    $("#downgradeRow").hidden = !canToggle;
    $("#downgradeBtn").textContent = isOwner() ? (previewFree() ? "Back to Plus (owner testing)" : "Preview as Free (owner testing)") : "Switch back to Free (demo mode)";
  }
  $("#kindGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".kind-card"); if (!b) return;
    if (!isPlus()) { toast("Themed cookies are part of Plus ✦"); $("#pricing").scrollIntoView({ block: "center" }); return; }
    const k = C.KINDS[b.dataset.kind];
    startQuiz({ questions: k.quiz.map((q) => ({ ...q, emoji: k.emoji })), kind: b.dataset.kind, title: k.name.toUpperCase() + " ✦ THEMED COOKIE" });
  });

  /* ---------- payments (Dodo) ---------- */
  $("#upgradeBtn").addEventListener("click", async () => {
    const link = (CFG.DODO_PAYMENT_LINK || "").trim();
    if (!link) {
      if (confirm("Payments aren't connected yet (no Dodo link in config.js).\n\nUnlock Plus in demo mode so you can try it?")) await setPlan("plus", "Welcome to the whole universe ✦ (demo)");
      return;
    }
    const ret = siteURL() + "/?upgraded=1";
    const sep = link.includes("?") ? "&" : "?";
    // metadata_user_id travels with the subscription, so the webhook knows which account to upgrade.
    location.href = link + sep + "redirect_url=" + encodeURIComponent(ret)
      + "&email=" + encodeURIComponent(State.user.email || "") + "&disableEmail=true"
      + "&metadata_user_id=" + encodeURIComponent(State.user.id);
  });
  $("#downgradeBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    if (isOwner()) {
      try { previewFree() ? sessionStorage.removeItem("fc_preview_free") : sessionStorage.setItem("fc_preview_free", "1"); } catch (err) {}
      renderAll(); toast(previewFree() ? "Previewing Free (only on this device)." : "Back to Plus ✦");
      return;
    }
    await setPlan("free", "Switched back to Free.");
  });
  // Only used in demo mode. With Supabase, the plan is set by the Dodo webhook (api/dodo-webhook.js).
  async function setPlan(plan, msg) {
    try { await DB.updateProfile(State.user.id, { plan }); State.profile.plan = plan; renderAll(); toast(msg); }
    catch (e) { toast("Couldn't update your plan. Try again?"); }
  }
  async function handlePaymentReturn() {
    const p = new URLSearchParams(location.search);
    const status = (p.get("status") || "").toLowerCase();
    const failed = ["failed", "cancelled", "canceled", "expired"].includes(status);
    const returned = p.get("upgraded") === "1" || ["active", "succeeded"].includes(status);
    if (location.search) history.replaceState(null, "", location.pathname + location.hash);
    if (failed) { toast("Payment didn't go through. No worries, try again anytime."); return; }
    if (!returned || isPlus()) return;
    // Demo mode has no server, so the browser upgrades itself.
    if (!sb) { await setPlan("plus", "Welcome to the whole universe ✦ (demo)"); return; }
    // With Supabase, the redirect only means "came back from checkout". The real upgrade is done by
    // the Dodo webhook on the server, so wait for it to flip the plan (usually a few seconds).
    toast("Confirming your payment…");
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { data } = await sb.from("profiles").select("plan").eq("id", State.user.id).maybeSingle();
        if (data && data.plan === "plus") { State.profile.plan = "plus"; renderAll(); toast("Payment received. Welcome to the whole universe ✦"); return; }
      } catch (e) {}
    }
    toast("Payment is still processing. Plus will switch on by itself in a few minutes; just refresh.");
  }

  /* =========================================================
     RENDER: DASHBOARD
     ========================================================= */
  function lineChart(series, n = 14) {
    const W = 600, H = 200, P = 26;
    const len = Math.max(2, ...series.map((s) => s.values.length));
    const x = (i) => P + (i * (W - P * 2)) / (len - 1); const y = (v) => H - P - (v / 100) * (H - P * 2);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend chart">`;
    [0, 50, 100].forEach((v) => (svg += `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="#f1dfe8" stroke-dasharray="4 6"/>`));
    series.forEach((s) => {
      if (!s.values.length) return;
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
      svg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      s.values.forEach((v, i) => (svg += `<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#fff" stroke="${s.color}" stroke-width="3"><title>${s.name}: ${v}</title></circle>`));
    });
    return svg + "</svg>";
  }
  function ring(pct, color = "#F4420C") {
    const r = 22, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 54 54" width="54" height="54"><circle cx="27" cy="27" r="${r}" fill="none" stroke="#f3dfe8" stroke-width="6"/><circle cx="27" cy="27" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(pct / 100) * c} ${c}" transform="rotate(-90 27 27)"/><text x="27" y="31" text-anchor="middle" font-size="12" font-weight="700" fill="#621D40">${Math.round(pct)}%</text></svg>`;
  }
  const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  const word = (v, lo, mid, hi) => (v == null ? "—" : v < 35 ? lo : v < 65 ? mid : hi);

  function renderDash() {
    const daily = State.cookies.filter((c) => !c.answers?.themed);
    const byDay = {}; daily.forEach((c) => (byDay[c.day] = c)); const days = Object.keys(byDay).sort().slice(-14);
    const series = (dim) => days.map((d) => byDay[d].answers?.dims?.[dim]).filter((v) => v != null);
    const water = series("water"), mood = series("mood"), energy = series("energy");
    const kindCount = {}; State.cookies.forEach((c) => (kindCount[c.kind] = (kindCount[c.kind] || 0) + 1));
    const topKind = Object.keys(kindCount).sort((a, b) => kindCount[b] - kindCount[a])[0];
    const now = new Date(); const monthKey = dayKey(now).slice(0, 7);
    const monthCookies = State.cookies.filter((c) => c.day.startsWith(monthKey));
    const monthJ = State.journals.filter((j) => j.day.startsWith(monthKey) && j.entries && Object.values(j.entries).some(Boolean));
    const dayOfMonth = now.getDate();
    const sortedJ = State.journals.slice().sort((a, b) => (a.day < b.day ? -1 : 1));
    const latest = (id) => { for (let i = sortedJ.length - 1; i >= 0; i--) { const v = sortedJ[i].entries?.[id]; if (v && v.trim()) return { v: v.trim(), day: sortedJ[i].day }; } return null; };
    const all = (id) => sortedJ.map((j) => j.entries?.[id]).filter((v) => v && v.trim()).map((v) => v.trim());
    const wantMore = [...new Set(all("more"))].slice(-8), letGo = [...new Set(all("letgo"))].slice(-6);
    const becoming = latest("becoming"), hope = latest("hope");
    const mDims = (dim) => avg(monthCookies.map((c) => c.answers?.dims?.[dim]).filter((v) => v != null));
    const mMood = mDims("mood"), mWater = mDims("water"), mEnergy = mDims("energy"), mStress = mDims("stress");
    const intentDays = (since) => new Set(State.cookies.filter((c) => c.day >= since).map((c) => c.day).concat(State.journals.filter((j) => j.day >= since).map((j) => j.day))).size;
    const intentPct = (since) => { const total = Math.max(1, Math.round((parseDay(dayKey()) - parseDay(since)) / 864e5) + 1); return Math.min(100, (intentDays(since) / total) * 100); };

    const reflection = monthCookies.length
      ? `This month you cracked <b>${monthCookies.length}</b> cookie${monthCookies.length > 1 ? "s" : ""}${topKind ? `, and the universe kept sending you <b>${esc(C.KINDS[topKind].name)}</b>` : ""}. Your mood has been mostly <b>${word(mMood, "cloudy", "fine-ish", "golden")}</b>, energy <b>${word(mEnergy, "low-battery", "steady", "fully charged")}</b>, and hydration <b>${word(mWater, "raisin-level", "okay-ish", "waterfall")}</b>.${mStress != null && mStress > 60 ? " Your brain-kettle has been whistling, so be gentle with yourself." : ""}${becoming ? ` You're becoming <b>${esc(becoming.v)}</b>, and it shows.` : ""}`
      : "Crack a few cookies this month and your reflection will write itself here ✦";

    const html = `
      <div class="tile"><div class="t-num">${streak()}</div><div class="t-lbl">DAY STREAK 🔥</div><div class="t-sub">Days in a row with a cookie</div></div>
      <div class="tile"><div class="t-num">${State.cookies.length}</div><div class="t-lbl">COOKIES CRACKED 🥠</div><div class="t-sub">${monthCookies.length} this month</div></div>
      <div class="tile"><div class="t-num">${monthJ.length}<small style="font-size:22px">/${dayOfMonth}</small></div><div class="t-lbl">DAYS MANIFESTED ✎</div><div class="t-sub">Journal entries this month</div></div>
      <div class="tile"><div class="t-num">${avg(water) == null ? "—" : avg(water) + "%"}</div><div class="t-lbl">HYDRATION 💧</div><div class="t-sub">${word(avg(water), "Raisin alert. Drink up!", "Getting there", "Waterfall energy")}</div></div>

      <div class="tile wide chart"><h4>HOW YOU'VE BEEN (LAST ${days.length || 14} CHECK-INS)</h4>
        ${days.length >= 2 ? lineChart([{ name: "Mood", color: "#F4420C", values: mood }, { name: "Water", color: "#4B9BD8", values: water }, { name: "Energy", color: "#8BA33A", values: energy }]) : '<p class="fine">Crack at least two daily cookies to see your trend line ✦</p>'}
        <div class="chart-legend"><span><i style="background:#F4420C"></i>Mood</span><span><i style="background:#4B9BD8"></i>Water</span><span><i style="background:#8BA33A"></i>Energy</span></div>
      </div>
      <div class="tile wide"><h4>YOUR MONTHLY REFLECTION ✦</h4><p class="reflection">${reflection}</p></div>

      <div class="tile wide"><h4>INTENTIONS YOU'RE LIVING INTO</h4>
        ${becoming || hope ? [becoming && { t: "Becoming " + becoming.v, s: becoming.day }, hope && { t: "Hoping for " + hope.v, s: hope.day }].filter(Boolean).map((x) => `<div class="intent"><div class="ring">${ring(intentPct(x.s))}</div><div><b>${esc(x.t)}</b><small>Showed up ${intentDays(x.s)} day(s) since you wrote it</small></div></div>`).join("") : '<p class="fine">Fill in "A version of me I\'m becoming" in Manifest to start tracking it.</p>'}
      </div>
      <div class="tile wide"><h4>WHAT YOU'RE CALLING IN</h4>
        <div class="chips">${wantMore.length ? wantMore.map((w) => `<span class="chip big">${esc(w)}</span>`).join("") : '<span class="fine">Your "want more of" answers will gather here.</span>'}</div>
        <h4 style="margin-top:18px">WHAT YOU'RE RELEASING</h4>
        <div class="chips">${letGo.length ? letGo.map((w) => `<span class="chip" style="text-decoration:line-through">${esc(w)}</span>`).join("") : '<span class="fine">Your "let go of" answers will gather here.</span>'}</div>
      </div>
      <div class="tile full"><h4>YOUR COOKIE MIX</h4>
        ${Object.entries(C.KINDS).map(([id, k]) => { const n = kindCount[id] || 0; const pct = State.cookies.length ? (n / State.cookies.length) * 100 : 0; return `<div class="bar-row"><span style="width:150px">${k.emoji} ${esc(k.name)}</span><div class="bar"><span style="width:${pct}%;background:${k.color === "#FFE98D" ? "#f2c94c" : k.color}"></span></div><span style="width:28px;text-align:right">${n}</span></div>`; }).join("")}
      </div>`;
    const dash = $("#dash");
    if (isPlus()) dash.innerHTML = html;
    else dash.innerHTML = `<div class="dash-lock"><div class="modal"><img src="images/cookie-shy.png" alt="" style="width:120px;margin:0 auto" class="wobble"><h3 class="serif" style="font-size:30px;margin:8px 0">Your manifestation dashboard</h3><p>Water, mood and energy trends, intention tracking and a monthly reflection, built from your own check-ins.</p><button class="btn btn-primary" onclick="document.getElementById('upgradeBtn').click()">UNLOCK WITH PLUS ✦</button></div></div><div class="dash locked-dash" style="grid-column:1/-1">${html}</div>`;
  }

  /* ---------- footer modals ---------- */
  const TEXT = {
    privacy: `<h2 class="serif">Privacy, simply.</h2><p>We store your email, your check-in answers, your fortunes and your journal entries so we can show you your history. We never sell your data. Payments are processed by Dodo Payments; we never see your card details. You can ask us to delete your account at any time.</p>`,
    terms: `<h2 class="serif">The tiny print.</h2><p>Fortune Cookie is for reflection and fun, not medical, financial or legal advice. Plus is billed monthly at ₹199 and can be cancelled anytime. Be kind, share generously, drink water.</p>`
  };
  $$("[data-modal]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); $("#textBody").innerHTML = TEXT[a.dataset.modal]; show("textOverlay"); }));

  /* =========================================================
     BOOT
     ========================================================= */
  function renderAll() { renderToday(); renderCalendar(); renderJournal(); renderPlus(); renderDash(); }

  async function boot() {
    const loader = $("#loader");
    try {
      State.user = await DB.session();
      if (!State.user) { $("#app").hidden = true; $("#auth").hidden = false; $("#demoNote").hidden = useSupabase; loader.classList.add("done"); return; }
      State.profile = await DB.profile(State.user.id);
      if (!State.user.name && State.profile.name) State.user.name = State.profile.name;
      [State.cookies, State.journals] = await Promise.all([DB.cookies(State.user.id), DB.journals(State.user.id)]);
      State.calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      $("#auth").hidden = true; $("#app").hidden = false;
      renderAll();
      handlePaymentReturn(); // runs in the background so the page isn't blocked while we wait for the webhook
      loader.classList.add("done");
      window.scrollTo(0, 0);
      if (!State.profile.onboarded) await walkthrough();
      if (!todayDaily()) setTimeout(() => startQuiz({ questions: dailyQuestions(), title: "YOUR DAILY CHECK-IN ✦" }), 350);
    } catch (e) {
      console.error(e);
      loader.classList.add("done");
      $("#app").hidden = true; $("#auth").hidden = false;
      $("#authError").textContent = "Couldn't reach the cookie jar. Check your connection (or the Supabase settings in config.js).";
    }
  }
  if (sb) sb.auth.onAuthStateChange((evt) => { if (evt === "SIGNED_OUT") { $("#app").hidden = true; $("#auth").hidden = false; } });
  boot();
})();
