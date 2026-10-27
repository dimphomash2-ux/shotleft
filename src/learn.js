// =====================================================================
// SHO'T LEFT! — HOW TO PLAY: tutorial, rules reference, card guide, slang (Phase 6)
// The rules pages reuse the illustrated walkthrough from 2.9.1 (Help.pages). The tutorial is a
// scripted mini turn: nothing in it touches a real game or a save.
// =====================================================================
const HowTo = (() => {
  let tab = "learn", query = "", scroll = {};
  const el = () => document.getElementById("helpBody");
  // which tutorial step each rules page can replay
  const SHOW = { "Every turn": 0, "Step 1": 1, "The hand signs": 1, "Step 2": 2, "Step 3": 4, "Step 4": 3 };
  const plain = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  function tabs() {
    return `<div class="rp-seg ht__tabs" role="tablist">${Object.entries(STR.htTabs).map(([k, l]) => `<button role="tab" data-ht="tab" data-v="${k}" aria-selected="${k === tab}" class="${k === tab ? "is-on" : ""}">${esc(l)}</button>`).join("")}</div>`;
  }
  function learn() {
    return `<div class="ht__learn"><div class="ht__ms">${Mascot.svg(130, "is-wave")}</div>
      <div><h2 class="t-display-m">${esc(STR.htLearnH)}</h2><p class="t-body">${esc(STR.htTeachLine)}</p>
      <ol class="ht__steps">${STR.tuSteps.map(s => `<li>${esc(s.k.replace(/^\d+ · /, ""))}</li>`).join("")}</ol>
      <button class="rp-btn" data-ht="teach">${esc(prefs.tutorialDone ? STR.htAgain : STR.htTeach)}</button></div></div>`;
  }
  function rules() {
    const q = query.trim().toLowerCase();
    const pages = Help.pages.filter(P => P.k !== "You're ready" && (!q || (P.k + " " + P.t + " " + plain(P.body)).toLowerCase().includes(q)));
    return `<label class="ht__search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>
        <input type="search" id="htQ" placeholder="${esc(STR.htSearch)}" value="${esc(query)}" aria-label="${esc(STR.htSearch)}"></label>
      ${pages.length ? pages.map(P => `<article class="ht__rule">${P.art ? `<div class="ht__art">${P.art()}</div>` : ""}<div class="ht__txt"><div class="t-label">${esc(P.k)}</div><h3>${esc(P.t)}</h3>${P.body}
        ${SHOW[P.k] != null ? `<button class="rp-btn rp-btn--secondary rp-btn--sm" data-ht="show" data-v="${SHOW[P.k]}">${esc(STR.htShowMe)}</button>` : ""}</div></article>`).join("")
        : `<p class="ht__none">${esc(STR.htNoHits(query))}</p>`}`;
  }
  function cardTile(c, locked) {
    const [tone, chips] = (STR.cardFx(SL_CONFIG)[c.id] || ["fun", []]);
    return `<div class="ht__card jz-${tone}${locked ? " is-locked" : ""}"><b>${esc(c.title)}</b><p>${esc(STR.cardText[c.id] || c.text)}</p>
      ${chips.length ? `<div class="jz-chips">${chips.map(([ic, t]) => `<span class="jz-chip">${Juice.icon(ic)}${esc(t)}</span>`).join("")}</div>` : ""}
      ${locked ? `<span class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}${esc(STR.htLocked)}</span>` : ""}</div>`;
  }
  function paxTile(q, locked) {
    if (!q.label) return "";
    return `<div class="ht__card ht__card--pax${locked ? " is-locked" : ""}"><b>${esc(q.label)}</b><p>${esc(q.text)}</p>${locked ? `<span class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}${esc(STR.htLocked)}</span>` : ""}</div>`;
  }
  function cards() {
    const own = ENT.owned();
    return `<p class="t-body ht__lead">${esc(STR.htCardsLine)}</p>
      <h3 class="ht__h">${esc(STR.htCore)}</h3><div class="ht__grid">${SL_ROAD.map(c => cardTile(c, false)).join("")}</div>
      <h3 class="ht__h">${esc(STR.htChaos)}</h3><div class="ht__grid">${FT.CHAOS.map(c => cardTile(c, !own)).join("")}</div>
      <h3 class="ht__h">${esc(STR.htPax)}</h3><div class="ht__grid">${SL_QUIRKS.map(q => paxTile(q, false)).join("")}</div>
      <h3 class="ht__h">${esc(STR.htSpecials)}</h3><div class="ht__grid">${FT.SPECIALS.map(q => paxTile(q, !own)).join("")}</div>`;
  }
  function slang() {
    return `<p class="t-body ht__lead">${esc(STR.htSlangLine)}</p><dl class="ht__slang">${STR.slang.map(([w, d]) => `<div><dt>${esc(w)}</dt><dd>${esc(d)}</dd></div>`).join("")}</dl>`;
  }
  function render() {
    const body = { learn, rules, cards, slang }[tab]();
    el().innerHTML = `${tabs()}<div class="ht__pane" id="htPane">${body}</div>`;
    const pane = document.getElementById("htPane"); pane.scrollTop = scroll[tab] || 0;
    pane.addEventListener("scroll", () => (scroll[tab] = pane.scrollTop), { passive: true });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ht]"); if (!b || !el().contains(b)) return;
    Sound.fx.tap();
    if (b.dataset.ht === "tab") { tab = b.dataset.v; return render(); }
    if (b.dataset.ht === "teach") return Tutorial.start(0);
    if (b.dataset.ht === "show") return Tutorial.start(+b.dataset.v, true);
  });
  document.addEventListener("input", e => {
    if (e.target.id !== "htQ") return; query = e.target.value; const pos = e.target.selectionStart;
    render(); const i = document.getElementById("htQ"); i.focus(); try { i.setSelectionRange(pos, pos); } catch {}
  });
  return { open(t) { if (t) tab = t; render(); }, render, get tab() { return tab; } };
})();

// ---------------- the tutorial: a 60-second mini turn with a ghost finger ----------------
const Tutorial = (() => {
  let step = 0, single = false, money = 100, fingerT = null, busy = false;
  const root = () => document.getElementById("tutorial");
  const P = () => SLDS.PLAYERS[0], P2 = () => SLDS.PLAYERS[1];
  const FINGER = `<svg viewBox="0 0 48 60" aria-hidden="true"><path d="M18 6a5 5 0 0110 0v20l3-1a5 5 0 015 2l1 1 2-1a5 5 0 016 4v12c0 9-7 15-16 15h-2c-6 0-10-3-13-8L5 38a4.5 4.5 0 017-5l6 6z" fill="#F8F5EE" stroke="#1B1C22" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const k = () => (fast() ? 0.55 : 1);
  const wait = ms => new Promise(r => setTimeout(r, ms * k()));
  function frame(inner, target) {
    const S = STR.tuSteps[step] || {};
    root().innerHTML = `<header class="shs__bar"><button class="rp-iconbtn" data-tu="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <h1 class="t-display-l">${esc(STR.htTitle)}</h1><span class="sp"></span>
        <div class="tu__dots" aria-hidden="true">${STR.tuSteps.map((_, i) => `<i class="${i < step ? "is-done" : i === step ? "is-on" : ""}"></i>`).join("")}</div>
        <button class="rp-btn rp-btn--secondary rp-btn--sm" data-tu="skip">${esc(STR.tuSkip)}</button></header>
      <div class="tu__body">
        <div class="tu__coach">${Mascot.svg(110, "is-talk")}<div class="tu__say" aria-live="polite"><span class="t-label">${esc(S.k || STR.tuDoneK)}</span><p id="tuSay">${esc(S.say || STR.tuDone)}</p></div></div>
        <div class="tu__panel"><div class="tu__money"><span>${esc(STR.tuMoney)}</span><b id="tuMoney">R${money}</b></div><div id="tuStage">${inner}</div></div>
      </div><div class="tu__finger" id="tuFinger" hidden>${FINGER}</div>`;
    point(target);
  }
  function point(sel) {
    clearTimeout(fingerT); const f = document.getElementById("tuFinger"); if (!f) return;
    if (!sel) { f.hidden = true; return; }
    fingerT = setTimeout(() => { const t = root().querySelector(sel); if (!t) return; const r = t.getBoundingClientRect();
      f.style.left = (r.left + r.width * 0.55) + "px"; f.style.top = (r.top + r.height * 0.55) + "px"; f.hidden = false; f.classList.remove("is-in"); void f.offsetWidth; f.classList.add("is-in"); }, 350 * k());
  }
  const say = t => { const s = document.getElementById("tuSay"); if (s) s.textContent = t; };
  function setMoney(v) {
    const from = money, to = v, el = document.getElementById("tuMoney"), t0 = performance.now(), dur = prefs.reduced ? 0 : 600 * k(); money = v;
    if (!el) return; el.classList.remove("jz-up"); void el.offsetWidth; el.classList.add("jz-up");
    const f = now => { const p = dur ? Math.min(1, (now - t0) / dur) : 1; el.textContent = "R" + Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  }
  // ---- the five steps ----
  const steps = [
    () => frame(`<div class="tu__card"><div class="eyebrow">Round 1</div><h2>${SLDS.badge(P(), 30)} Thabo, you're driving</h2><p class="t-caption">0/15 seats · Empty</p>
      <button class="rp-btn" data-tu="go">${esc(STR.tuSteps[0].btn)}</button></div>`, '[data-tu="go"]'),
    () => { const S = STR.tuSteps[1];
      frame(`<div class="tu__race"><div class="tu__sign"><span class="t-label">Going to</span><b>${esc(S.dest)}</b><div class="tu__hand">${(Help.pages[3].body.match(/<div class="hp-sign">[\s\S]*?<\/div>/g) || [])[2] || ""}</div></div>
        <div class="tu__who"><p class="t-caption">Tap the first correct hand:</p>
        <button class="btn pbtn tu__p" style="--pc:${P().hex}" data-tu="go">${SLDS.badge(P(), 22)}Thabo</button>
        <button class="btn pbtn tu__p" style="--pc:${P2().hex}" data-tu="go">${SLDS.badge(P2(), 22)}Lindiwe</button></div></div>`, '[data-tu="go"]'); },
    () => { const S = STR.tuSteps[2];
      frame(`<div class="grid2 gears tu__gears"><button class="btn gear low" data-tu="go" data-v="low"><span class="g-t">${esc(S.low)}</span><span class="g-s">${esc(S.lowS)}</span></button>
        <button class="btn gear high" data-tu="go" data-v="high"><span class="g-t">${esc(S.high)}</span><span class="g-s">${esc(S.highS)}</span></button></div>`, '[data-v="high"]'); },
    () => { const c = Engine.card("carwash");
      frame(`<div class="ecard jz-card jz-good${prefs.reduced ? "" : " is-flip"}"><i class="jz-back" aria-hidden="true"><img alt="" src="${SL_BRAND.sm || SL_BRAND.big}"></i><div class="e-t">${esc(c.title)}</div><div class="e-d">${esc(c.text)}</div>
        <div class="jz-chips"><span class="jz-chip">${SLDS.icon("coin")}+R20</span></div></div><button class="rp-btn tu__ok" data-tu="go">${esc(STR.tuSteps[3].ok)}</button>`, '[data-tu="go"]');
      Sound.fx.deck(); setTimeout(() => { Sound.fx.flip(); }, 200 * k()); setTimeout(() => { Sound.fx.good(); Juice.haptic("medium"); }, 420 * k()); },
    () => { const S = STR.tuSteps[4];
      frame(`<div class="mq-box"><div class="mq-who">Front seat maths · <b>Lindiwe</b> answers</div><p class="mq">${esc(S.q)}</p>
        <div class="answers">${S.opts.map((o, i) => `<button class="btn ans" data-tu="ans" data-i="${i}">${esc(o)}</button>`).join("")}</div></div>`, `[data-i="${S.ans}"]`); },
  ];
  function done() {
    prefs.tutorialDone = true; prefs.played = true; savePrefs(); step = STR.tuSteps.length;
    frame(`<div class="tu__end"><h2 class="t-display-m">${esc(STR.tuDoneK)}</h2><p class="t-body">${esc(STR.tuDone)}</p>
      <div class="tu__endbtns"><button class="rp-btn" data-tu="play" aria-label="${esc(STR.playLabel)}">${esc(STR.tuPlay)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-tu="rules">${esc(STR.tuRules)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-tu="again">${esc(STR.htAgain)}</button></div></div>`);
    const ms = root().querySelector(".ms"); if (ms) ms.classList.add("is-dance");
    Sound.fx.home(); Juice.say("siyaya", null, true);
  }
  async function advance(b) {
    if (busy) return; busy = true; point(null);
    try {
      if (step === 0) { Sound.fx.door(); }
      if (step === 1) { Sound.fx.seat(); Juice.haptic("light"); say(STR.tuBoards); b.classList.add("is-picked"); await wait(900); }
      if (step === 2) {   // a mini dice roll from the mirror
        const high = b.dataset.v === "high", face = 4, n = high ? face : Math.ceil(face / 2);
        document.getElementById("tuStage").innerHTML = `<div class="jz-dice"><svg class="jz-mirror" viewBox="0 0 220 64" aria-hidden="true"><rect x="96" y="0" width="28" height="12" rx="3" fill="#2E3039"/><rect x="6" y="10" width="208" height="48" rx="22" fill="#1B1C22"/><rect x="13" y="16" width="194" height="36" rx="17" fill="#8FC6EA"/></svg>
          <div class="jz-hang${prefs.reduced ? "" : " is-drop"}"><i class="jz-string"></i><div class="jz-die" id="tuDie">${SLDS.die(P(), 1, 76)}</div></div></div><p class="jz-res" id="tuRes"></p>`;
        Sound.fx.diceShake();
        if (!prefs.reduced) for (let i = 0; i < 8; i++) { document.getElementById("tuDie").innerHTML = SLDS.die(P(), 1 + ((i * 5 + 2) % 6), 76); await wait(80); }
        document.getElementById("tuDie").innerHTML = SLDS.die(P(), face, 76); Sound.fx.diceLand(); Juice.haptic("medium");
        const r = document.getElementById("tuRes"); r.innerHTML = `<b>${esc(STR.diceSpaces(n))}</b><small>${esc(high ? STR.diceFull(face) : STR.diceHalved(face, n))}</small>`; r.classList.add("is-on");
        say(STR.tuMoved(n)); await wait(1300);
      }
      if (step === 3) { setMoney(money + 20); Sound.fx.chaching(); await wait(700); }
      if (step === 4) {
        const S = STR.tuSteps[4], i = +b.dataset.i;
        if (i !== S.ans) { Sound.fx.wrong(); Juice.haptic("heavy"); b.classList.add("wrongpick"); say(STR.tuWrong); busy = false; point(`[data-i="${S.ans}"]`); return; }
        b.classList.add("right"); Sound.fx.right(); Juice.haptic("medium"); say(S.explain + " " + STR.voice.sharp); setMoney(money + 35); Sound.fx.chaching(); await wait(1500);
      }
      if (single) { busy = false; return exit(); }
      step++; busy = false;
      if (step >= steps.length) return done();
      steps[step]();
    } finally { busy = false; }
  }
  function exit() { clearTimeout(fingerT); nav.back(); }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-tu]"); if (!b || !root() || !root().contains(b)) return;
    const a = b.dataset.tu;
    if (a !== "go" && a !== "ans") Sound.fx.tap();
    if (a === "back" || a === "skip") { if (a === "skip") { prefs.tutorialDone = true; prefs.played = true; savePrefs(); } return exit(); }
    if (a === "go" || a === "ans") { Sound.fx.tap(); return advance(b); }
    if (a === "play") { nav.go("setup"); hist.length = 0; hist.push("intro"); return; }
    if (a === "rules") { nav.back(); if (curScreen() !== "help") nav.go("help"); return HowTo.open("rules"); }
    if (a === "again") { step = 0; money = 100; return steps[0](); }
  });
  window.addEventListener("resize", () => { if (root() && !root().hidden) { const t = root().querySelector('[data-tu="go"],[data-tu="ans"]'); if (t && !busy) point(step === 2 ? '[data-v="high"]' : step === 4 ? `[data-i="${STR.tuSteps[4].ans}"]` : '[data-tu="go"]'); } });
  return {
    start(s = 0, only = false) { step = s; single = only; money = 100; nav.go("tutorial"); },
    render() { R3.overview(); if (step >= steps.length) return done(); steps[step](); },
    get open() { return root() && !root().hidden; }, exit,
  };
})();
