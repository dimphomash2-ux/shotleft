// =====================================================================
// SHO'T LEFT! — GAME FEEL (Phase 5)
// Motion, sound and touch for every meaningful moment. Presentation only: nothing here changes
// money, seats, positions or the dice. Fast Mode trims the timings; Reduce Motion drops the movement
// (no flights, shakes, flips or speed lines) but keeps the colours, sounds, captions and haptics.
// =====================================================================
const Juice = (() => {
  const reduced = () => !!prefs.reduced;
  const k = () => (fast() ? 0.55 : 1);                                   // Fast Mode / Rush Hour pace
  const hold = ms => new Promise(r => setTimeout(r, Math.round(ms * k())));   // real time, even with Reduce Motion
  const ICON = {
    skip: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M6 18L18 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    back: '<path d="M10 6l-6 6 6 6M4 12h10a6 6 0 010 12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"/>',
    rain: '<path d="M7 14a5 5 0 01.6-10A6 6 0 0119 7a4 4 0 01-1 7z" fill="currentColor"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    gear: '<circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  };
  const icon = id => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id] || SLDS.ICON[id] || ""}</svg>`;
  const COIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FFB300" stroke="#1B1C22" stroke-width="2.2"/><circle cx="12" cy="12" r="6" fill="none" stroke="#B07A00" stroke-width="1.6"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="900" fill="#1B1C22" font-family="sans-serif">R</text></svg>`;

  // ---------------- haptics: light, medium, heavy, double, success ----------------
  const HP = { light: 10, medium: 24, heavy: [45], double: [14, 70, 14], success: [30, 60, 30, 60, 120] };
  function haptic(kind = "light") {
    if (!prefs.haptics) return;
    const cap = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
    if (cap) { try {
      if (kind === "success") return cap.notification({ type: "SUCCESS" });
      if (kind === "double") { cap.impact({ style: "LIGHT" }); return setTimeout(() => cap.impact({ style: "LIGHT" }), 80); }
      return cap.impact({ style: kind === "heavy" ? "HEAVY" : kind === "medium" ? "MEDIUM" : "LIGHT" });
    } catch {} }
    Shell.buzz(HP[kind] || 10);
  }

  // ---------------- screen points ----------------
  const layer = () => { let l = document.getElementById("jz"); if (!l) { l = document.createElement("div"); l.id = "jz"; l.setAttribute("aria-hidden", "true"); document.body.appendChild(l); } return l; };
  const chip = pi => document.querySelector(`.pcard[data-pi="${pi}"]`);
  const centreOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const chipPt = pi => { const c = chip(pi); if (!c) return null; const m = c.querySelector(".pc-money") || c; return centreOf(m); };
  const taxiPt = pi => { const p = R3.taxiScreen(pi); return p && p.x > 0 && p.y > 0 && p.x < innerWidth && p.y < innerHeight ? p : { x: innerWidth * 0.35, y: innerHeight * 0.45 }; };
  function spawn(cls, html, x, y) { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; e.style.left = x + "px"; e.style.top = y + "px"; layer().appendChild(e); return e; }
  function flight(el, from, to, dur, delay = 0, arc = -60, end = 0.7) {
    const mx = (from.x + to.x) / 2, my = Math.min(from.y, to.y) + arc;
    const a = el.animate([
      { transform: `translate(${from.x}px,${from.y}px) translate(-50%,-50%) scale(.5)`, opacity: 0 },
      { transform: `translate(${from.x}px,${from.y - 14}px) translate(-50%,-50%) scale(1.1)`, opacity: 1, offset: 0.16 },
      { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${to.x}px,${to.y}px) translate(-50%,-50%) scale(${end})`, opacity: 0.85 },
    ], { duration: dur * k(), delay: delay * k(), easing: "cubic-bezier(.45,0,.55,1)", fill: "both" });
    a.finished.then(() => el.remove(), () => el.remove()); return a;
  }
  function pop(el, cls, ms = 700) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms * k()); }

  // ---------------- money: coins fly, the number counts in green or red ----------------
  // The chip keeps showing the old amount until the coins land (renderPlayers holds it), then counts.
  let pend = {}, pendT = null;
  function holdFor(events) {
    pend = {}; clearTimeout(pendT);
    for (const ev of events) { if (["fare", "sneaky", "road", "strike", "gear", "stepDone", "next", "win"].includes(ev.type)) break; if (ev.type === "money" && ev.amount) pend[ev.pi] = (pend[ev.pi] || 0) + 1; }
    pendT = setTimeout(() => { pend = {}; renderPlayers(); }, 6000);   // never leave a chip stuck
  }
  const held = i => (pend[i] || 0) > 0;
  function countTo(i, to, up) {
    const el = chip(i) && chip(i).querySelector(".pc-money"); if (!el) { shown[i] = to; return; }
    const from = shown[i] === undefined ? to : shown[i], dur = reduced() ? 0 : 600 * k(), t0 = performance.now();
    el.classList.remove("jz-up", "jz-down"); void el.offsetWidth; el.classList.add(up ? "jz-up" : "jz-down");
    setTimeout(() => el.classList.remove("jz-up", "jz-down"), 1100 * k());
    const step = now => { const p = dur ? Math.min(1, (now - t0) / dur) : 1; shown[i] = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); el.textContent = "R" + shown[i]; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  async function money(ev) {
    const up = ev.amount > 0, amt = Math.abs(ev.amount), i = ev.pi;
    const label = `${up ? "+" : "−"}R${amt} ${ev.reason || ""}`.trim();
    up ? Sound.fx.chaching() : Sound.fx.eish(); haptic("medium");
    const settle = () => { const target = (shown[i] === undefined ? G.players[i].money - ev.amount : shown[i]) + ev.amount;
      countTo(i, target, up); pop(chip(i), up ? "jz-bump" : "jz-hurt", 500);
      if (pend[i]) { pend[i]--; if (!pend[i]) setTimeout(() => animateMoney(i), 650 * k()); } };
    const to = chipPt(i);
    if (reduced() || !to) { toast(label, up ? "good" : "bad", i); settle(); return; }
    if (up) {
      const from = taxiPt(i), n = Math.max(3, Math.min(8, Math.round(amt / 10)));
      flight(spawn("jz-fly " + "is-up", esc(label), 0, 0), from, { x: to.x, y: to.y - 30 }, 900, 0, -70, 0.9);
      for (let c = 0; c < n; c++) flight(spawn("jz-coin", COIN, 0, 0), { x: from.x + (Math.random() * 30 - 15), y: from.y }, to, 640, 60 + c * 45, -40 - Math.random() * 50, 0.5);
      await hold(560); settle();
    } else {
      settle();
      flight(spawn("jz-fly is-down", esc(label), 0, 0), { x: to.x, y: to.y - 20 }, { x: to.x + 20, y: to.y - 110 }, 1000, 0, -10, 1);
      const n = Math.max(2, Math.min(6, Math.round(amt / 10)));
      for (let c = 0; c < n; c++) flight(spawn("jz-coin is-lost", COIN, 0, 0), to, { x: to.x + (Math.random() * 140 - 70), y: to.y - 60 - Math.random() * 60 }, 620, c * 50, -30, 0.4);
      await hold(220);
    }
  }

  // ---------------- driving: a hop, a puff of dust and an engine blip on every space ----------------
  function drive(ev) {
    const p = G.players[ev.pi], last = ev.path.length - 1, others = G.players.map((x, i) => i).filter(i => i !== ev.pi);
    let t0 = 0;
    return (kIdx, space) => {
      const nowMs = performance.now(), quiet = reduced() && kIdx < last;
      if (!quiet && nowMs - t0 > 70) { Sound.fx.blip(ev.gear === "high"); haptic("light"); t0 = nowMs; }
      if (!reduced()) dust(ev.pi);
      if (kIdx < last) for (const o of others) if (G.players[o].pos === space) overtake(ev.pi, o);
    };
  }
  function dust(pi) {
    const at = taxiPt(pi);
    for (let c = 0; c < 3; c++) {
      const d = spawn("jz-dust", "", 0, 0), dx = (Math.random() - 0.5) * 30, s = 0.6 + Math.random() * 0.6;
      d.animate([{ transform: `translate(${at.x + dx * 0.3}px,${at.y + 8}px) translate(-50%,-50%) scale(${s * 0.4})`, opacity: 0.75 },
        { transform: `translate(${at.x + dx}px,${at.y - 4 - Math.random() * 10}px) translate(-50%,-50%) scale(${s})`, opacity: 0 }],
        { duration: 520 * k(), delay: c * 40, easing: "ease-out", fill: "both" }).finished.then(() => d.remove(), () => d.remove());
    }
  }
  function overtake(pi, other) {
    Sound.fx.whoosh(); setTimeout(() => Garage.hoot(G.players[pi].name, playerIdent(pi)), 160); haptic("double");
    G.log.push(STR.overtookLog(G.players[pi].name, G.players[other].name)); Results.bump(pi, "overtakes");
    if (reduced()) return toast(STR.overtook(G.players[other].name), "", pi);
    speedLines(); const at = taxiPt(pi);
    flight(spawn("jz-fly is-info", esc(STR.overtook(G.players[other].name)), 0, 0), at, { x: at.x, y: at.y - 80 }, 1100, 0, -20, 1);
  }
  function speedLines() { if (reduced()) return; const s = spawn("jz-speed", "", 0, 0); setTimeout(() => s.remove(), 700 * k()); }

  // ---------------- the fuzzy dice: drop from the mirror, tumble, land, show the result big ----------------
  const MIRROR = `<svg class="jz-mirror" viewBox="0 0 220 64" aria-hidden="true"><rect x="96" y="0" width="28" height="12" rx="3" fill="#2E3039"/>
    <rect x="6" y="10" width="208" height="48" rx="22" fill="#1B1C22"/><rect x="13" y="16" width="194" height="36" rx="17" fill="url(#jzSky)"/>
    <path d="M60 52 L100 30 L120 30 L160 52Z" fill="#3a3d47"/><path d="M110 33 V37 M110 41 V46" stroke="#FFB300" stroke-width="2.4"/>
    <path d="M24 22 Q70 14 150 20" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <defs><linearGradient id="jzSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FC6EA"/><stop offset=".62" stop-color="#FFD27A"/><stop offset=".63" stop-color="#5D6270"/></linearGradient></defs></svg>`;
  async function dice(ev) {
    const P = playerIdent(ev.pi), dieSize = innerHeight <= 420 ? 72 : 92;
    panel(`<div class="eyebrow">${esc(ev.gear === "high" ? STR.diceHigh : STR.diceLow)}</div>
      <div class="jz-dice">${MIRROR}<div class="jz-hang"><i class="jz-string"></i><div class="jz-die" id="jzDie">${SLDS.die(P, 1 + Math.floor(Math.random() * 6), dieSize)}</div></div></div>
      <p class="jz-res" id="jzRes" aria-live="polite">&nbsp;</p>`);
    const hang = $("#panel .jz-hang"), die = $("#jzDie"), res = $("#jzRes");
    Sound.fx.diceShake(); haptic("light");
    if (!reduced()) {
      hang.classList.add("is-drop");
      let f = 0; const end = performance.now() + 720 * k();
      while (performance.now() < end) { let n; do n = 1 + Math.floor(Math.random() * 6); while (n === f); f = n; die.innerHTML = SLDS.die(P, f, dieSize); await new Promise(r => setTimeout(r, 80)); }
    } else await hold(250);
    die.innerHTML = SLDS.die(P, ev.face, dieSize); hang.classList.remove("is-drop"); hang.classList.add("is-land");
    Sound.fx.diceLand(); haptic("medium");
    const copSafe = !ev.cop && ev.face === SL_CONFIG.die.copFace && ev.gear === "low" && Engine.rules(G).police !== "off";
    res.innerHTML = `<b>${esc(STR.diceSpaces(ev.n))}</b><small>${esc(ev.cop ? STR.diceCop(ev.face) : copSafe ? STR.diceCopLow : ev.gear === "low" ? STR.diceHalved(ev.face, ev.n) : STR.diceFull(ev.face))}</small>`;
    if (ev.cop) { $("#panel .jz-dice").classList.add("is-cop"); Sound.fx.whistle(); haptic("heavy"); }
    const eb = $("#panel .eyebrow"); if (eb) eb.textContent = ev.gear === "high" ? STR.diceHighDone : STR.diceLowDone;
    res.classList.add("is-on");
    await hold(ev.cop ? 900 : 650);   // the result stays big and clear before the taxi moves
  }

  // ---------------- road cards: the deck slides up, the card flips, good glows green, bad flashes red ----------------
  let fxTable = null;
  const cardFx = id => (fxTable || (fxTable = STR.cardFx(SL_CONFIG)))[id] || ["fun", []];
  function decorate(card) {
    const el = $("#panel .ecard"); if (!el) return;
    const [tone, chips] = cardFx(card.id);
    el.classList.add("jz-card", "jz-" + tone);
    if (STR.cardText[card.id]) { const d = el.querySelector(".e-d"); if (d) d.textContent = STR.cardText[card.id]; }
    if (chips.length) el.insertAdjacentHTML("beforeend", `<div class="jz-chips">${chips.map(([ic, t]) => `<span class="jz-chip">${icon(ic)}${esc(t)}</span>`).join("")}</div>`);
    el.insertAdjacentHTML("afterbegin", `<i class="jz-back" aria-hidden="true"><img data-logo="sm" alt="" src="${SL_BRAND.sm || SL_BRAND.big}"></i>`);
    if (!reduced()) el.classList.add("is-flip");
    fitPanel();
  }
  function reveal(card) {
    const [tone] = cardFx(card.id), el = $("#panel .ecard");
    Sound.fx.deck(); setTimeout(() => Sound.fx.flip(), 200 * k());
    setTimeout(() => {
      if (tone === "good") { Sound.fx.good(); haptic("medium"); flash("good"); if (el && !reduced()) sparkle(el); }
      else if (tone === "bad") { Sound.fx.bad(); haptic("heavy"); flash("bad"); if (el && !reduced()) pop(el, "jz-shake", 500);
        say(card.id === "cop" || card.id === "pothole" ? "hhayibo" : "eish", G.turn); }
      else haptic("light");
    }, (reduced() ? 120 : 420) * k());
  }
  function flash(kind) { const f = spawn("jz-flash is-" + kind, "", 0, 0); setTimeout(() => f.remove(), 700 * k()); }
  function sparkle(el) {
    const r = el.getBoundingClientRect();
    for (let c = 0; c < 9; c++) {
      const s = spawn("jz-spark", "", 0, 0), x = r.left + Math.random() * r.width, y = r.top + Math.random() * r.height * 0.8;
      s.animate([{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(0) rotate(0)`, opacity: 1 }, { transform: `translate(${x}px,${y - 18}px) translate(-50%,-50%) scale(1) rotate(90deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x}px,${y - 30}px) translate(-50%,-50%) scale(0) rotate(180deg)`, opacity: 0 }], { duration: 700 * k(), delay: c * 50, easing: "ease-out", fill: "both" }).finished.then(() => s.remove(), () => s.remove());
    }
  }

  // ---------------- other moments ----------------
  function board(pi) {
    Sound.fx.seat(); haptic("light"); const c = chip(pi); pop(c && c.querySelector(".seats"), "jz-seat", 600);
    const p = G.players[pi];
    if (Engine.seatsUsed(p) >= Engine.rules(G).seats) { toast(STR.fullTaxi, "good", pi); say("fulltaxi", pi, true); }
    else if (Math.random() < 0.4) say("shotleft", pi);
  }
  function answer(right) {
    const box = $("#panel .mq-box"); haptic(right ? "medium" : "heavy");
    if (box) pop(box, right ? "jz-right" : reduced() ? "jz-wrong-still" : "jz-wrong", 700);
    if (right) say("sharp", G.turn);
  }
  function caught(ok) { if (ok) { haptic("medium"); say("sharp", G.turn); } else { haptic("heavy"); say("eish", G.turn); } }
  function bump() { haptic("heavy"); if (!reduced()) pop(document.getElementById("board"), "jz-quake", 520); }

  // ---------------- voice lines + captions: at most one every 3 turns, never the same twice in a row ----------------
  let turnNo = 0, lastTurn = -9, lastId = null;
  function say(id, pi, force) {
    if (!force && (turnNo - lastTurn < 3 || id === lastId)) return false;
    lastTurn = turnNo; lastId = id; Sound.voice(id);
    const at = pi != null && chipPt(pi) ? chipPt(pi) : { x: innerWidth / 2, y: innerHeight * 0.3 };
    const b = spawn("jz-bubble", `<span>${esc(STR.voice[id])}</span>`, 0, 0);
    b.style.left = Math.max(70, Math.min(innerWidth - 70, at.x)) + "px"; b.style.top = Math.max(60, at.y - 46) + "px";
    setTimeout(() => b.classList.add("is-out"), 1300 * k()); setTimeout(() => b.remove(), 1700 * k());
    return true;
  }
  const turnDone = () => { turnNo++; };

  // ---------------- home stretch: the light turns golden and the music builds ----------------
  let stretchG = null;
  function check() {
    const game = document.getElementById("game");
    if (!G || G.phase === "GAME_COMPLETE") { if (stretchG) { stretchG = null; game.classList.remove("jz-stretch"); Sound.final(false); } return; }
    if (stretchG === G) return;
    const lead = G.players.reduce((b, p) => (p.money > b.money ? p : b), G.players[0]);
    if (lead.money < G.cfgTarget * 0.8) { if (stretchG) { stretchG = null; game.classList.remove("jz-stretch"); Sound.final(false); } return; }
    if (!document.getElementById("jzTint")) document.getElementById("board").insertAdjacentHTML("afterend", '<div id="jzTint" aria-hidden="true"></div>');
    stretchG = G; game.classList.add("jz-stretch"); Sound.final(true);
    banner(STR.homeStretch, STR.homeStretchSub(lead.name, G.cfgTarget)); Sound.fx.home(); say("siyaya", null, true);
  }

  // ---------------- the win: fanfare, crowd, confetti, a celebration buzz ----------------
  function win() {
    Sound.stinger(); setTimeout(() => Sound.fx.crowd(), 500); haptic("success"); say("ayeye", null, true);
    if (reduced()) return;
    const cols = SLDS.PLAYERS.map(p => p.hex).concat(["#FFB300", "#7B5BD6"]);
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("i"); c.className = "rp-confetti";
      c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length];
      c.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); c.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      c.style.setProperty("--d", Math.round((1300 + Math.random() * 1000) * k()) + "ms");
      c.style.animationDelay = Math.random() * 400 + "ms"; document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
    }
  }
  function reset() { turnNo = 0; lastTurn = -9; lastId = null; pend = {}; }

  return { icon, haptic, holdFor, held, money, drive, dice, decorate, reveal, board, answer, caught, bump, say, turnDone, check, win, reset, speedLines };
})();
