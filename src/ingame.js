// =====================================================================
// SHO'T LEFT! — IN-GAME UI (Phase 4)
// The race panel, player details, the "What happened?" log and board tooltips.
// Presentation only: nothing here changes money, seats or positions.
// =====================================================================
const IG_ICON = {
  die: '<rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="8.5" cy="8.5" r="2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="2" fill="currentColor"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="4" cy="6" r="1.6" fill="currentColor"/><circle cx="4" cy="12" r="1.6" fill="currentColor"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  target: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/>',
  run: '<circle cx="14" cy="4.5" r="2.3" fill="currentColor"/><path d="M10 21l2.5-6 3 2.5V22M7 12l3-4h4l2.5 3.5H20M12.5 15l-1-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
};
const igIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${IG_ICON[k] || SLDS.ICON[k] || ""}</svg>`;
const playerIdent = i => SLDS.PLAYERS[identOf(G.players[i], i) - 1];

// ---------------- the passenger race ----------------
function showRace() {
  const ps = G.pending.passenger, rank = SL_RANKS[ps.dest];
  R3.extras.highlightRank = ps.dest; R3.waiting(ps.fromRank, ps.sprite);
  const sign = ps.riddle
    ? `<div class="sign riddle"><span class="sign-k">"Take me to…"</span><span class="sign-d" style="font-size:16px;line-height:1.15">${esc(ps.riddle)}</span><span class="sign-h">Work it out, then flash the sign!</span></div>`
    : `<div class="sign"><span class="sign-k">Going to</span><span class="sign-d">${esc(rank.name)}</span>${prefs.hints ? `<span class="sign-h">${esc(rank.sign)}</span>` : ""}</div>`;
  const who = G.players.map((p, i) => { const ok = Engine.canBoard(G, i);
    return `<button class="btn pbtn" style="--pc:${p.color}" data-a="claim" data-i="${i}" ${ok ? "" : "disabled"}>${SLDS.badge(playerIdent(i), 22)}${esc(p.name)}${ok ? "" : "<small>Taxi full</small>"}</button>`; }).join("");
  const wrong = G.players.map((p, i) => `<button class="btn sm red" data-a="wrong" data-i="${i}" aria-label="${esc(p.name)}: wrong sign, −R${SL_CONFIG.fines.wrongSign}" ${G.pending.wrong.includes(i) ? "disabled" : ""}>${esc(p.name)}</button>`).join("");
  panel(`<div class="ig-race"><div class="eyebrow">Passenger ${G.pending.flipNo} of ${G.pending.flips} · race for it</div>
    <div class="ig-race__top">${sign}${passengerHTML(ps, false)}</div>
    <p class="ig-race__ask">Everyone flash the sign. Tap the first correct hand:</p>
    <div class="ig-race__who">${who}</div>
    <div class="ig-race__more"><button class="btn sm" data-a="claim" data-i="-1">Nobody got it</button>
      <details><summary>Wrong sign? −R${SL_CONFIG.fines.wrongSign}</summary><div class="grid">${wrong}</div></details></div></div>`, "wide");
}

// ---------------- player details (tap a chip) ----------------
const PlayerInfo = {
  show(i) {
    if (!G || !G.players[i]) return;
    const p = G.players[i], P = playerIdent(i), used = Engine.seatsUsed(p), max = Engine.rules(G).seats;
    const pax = p.pass.length ? `<ul class="ig-list">${p.pass.map(ps => `<li><span>${SLDS.icon("seat")}</span><span><b>${esc(ps.name)}</b> → ${esc(SL_RANKS[ps.dest].name)} · R${ps.fare}${ps.seats > 1 ? ` · ${ps.seats} seats` : ""}${ps.label ? `<br><small style="color:#A3271A">${esc(ps.label)}</small>` : ""}</span></li>`).join("")}</ul>`
      : `<p class="ig-empty">No passengers yet. ${i === G.turn ? "Call one in!" : ""}</p>`;
    Shell.dialog({ title: `${p.name}'s taxi`, label: `${p.name}'s taxi`, html: `<div class="ig-pi__head">${SLDS.badge(P, 48)}<div><div class="t-label">${esc(P.name)} · ${used}/${max} seats</div><div class="t-caption">${esc(nextDest(p))}${p.blessed ? " · Blessed by the pastor" : ""}${p.skip ? " · Misses next turn" : ""}</div></div><div class="ig-pi__money">R${p.money}</div></div>
      <div class="ig-pi__stats"><div><b>${p.stats.delivered}</b>delivered</div><div><b>R${p.stats.earned}</b>earned</div><div><b>R${p.stats.fines}</b>fines</div></div>${pax}`,
      actions: [{ label: "Close" }] });
  },
};

// ---------------- "What happened?" — the last moves, newest first ----------------
const TurnLog = {
  show() {
    if (!G) return;
    const lines = G.log.slice(-14).reverse();
    const row = t => {
      const plus = /\+R\d/.test(t), minus = /−R\d|missed a turn|got away/.test(t);
      const icon = /rolled a/.test(t) ? "die" : /picked up/.test(t) ? "seat" : /got away/.test(t) ? "run" : plus || minus ? "coin" : "bolt";
      const owner = G.players.findIndex(p => t.startsWith(p.name));
      return `<li class="${plus ? "plus" : minus ? "minus" : ""}"><span ${owner >= 0 ? `style="background:${G.players[owner].color}"` : ""}>${igIcon(icon)}</span><span>${esc(t)}</span></li>`;
    };
    Shell.dialog({ title: "What happened?", html: lines.length ? `<ul class="ig-list">${lines.map(row).join("")}</ul>` : `<p class="ig-empty">Nothing yet. The rank is quiet.</p>`, actions: [{ label: "Back to the game" }] });
  },
};

// ---------------- long-press the board: what is this space? ----------------
const BoardTips = (() => {
  let t = null, at = null, tip = null;
  const ingame = () => $("#game").classList.contains("ingame") && G && !Shell.dialogOpen() && !Handoff.open;
  function hide() { if (tip) { tip.remove(); tip = null; } }
  function describe(i) {
    const r = SL.rankAt(i), here = G.players.filter(p => p.pos === i).map(p => p.name);
    let title = "Open road", text = "Nothing happens here. Keep driving.";
    if (r >= 0) { const R = SL_RANKS[r], waiting = G.players.reduce((n, p) => n + p.pass.filter(ps => ps.dest === r).length, 0);
      title = `${R.name} rank`; text = `Passengers going to ${R.name} get off here and pay. Hand sign: ${R.sign}${waiting ? ` ${waiting} passenger${waiting > 1 ? "s are" : " is"} heading here.` : ""}`; }
    else if (SL.isRobot(i)) { title = "Robot"; text = "Drive past this traffic light and you draw a road card."; }
    if (here.length) text += ` On this spot: ${here.join(", ")}.`;
    return { title, text };
  }
  function show(x, y) {
    let best = -1, bd = 46;
    for (let i = 0; i < SL_CONFIG.boardSpaces; i++) { const s = R3.spaceScreen(i); if (!s) continue; const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    const d = describe(best), s = R3.spaceScreen(best);
    hide(); tip = document.createElement("div"); tip.className = "ig-tip"; tip.setAttribute("role", "tooltip");
    tip.innerHTML = `<b>${esc(d.title)}</b>${esc(d.text)}`;
    tip.style.transform = "none"; document.body.appendChild(tip);
    // above the space when it fits, otherwise below it; always fully on screen
    const w = tip.offsetWidth, h = tip.offsetHeight, m = 8;
    const left = Math.min(innerWidth - w - m, Math.max(m, s.x - w / 2));
    let top = s.y - h - 14; if (top < m) top = Math.min(innerHeight - h - m, s.y + 14);
    tip.style.left = left + "px"; tip.style.top = Math.max(m, top) + "px";
    Shell.buzz(15); setTimeout(hide, 3200);
  }
  const cv = document.getElementById("board");
  cv.addEventListener("pointerdown", e => { if (!ingame()) return; at = { x: e.clientX, y: e.clientY }; clearTimeout(t); t = setTimeout(() => { if (at) show(at.x, at.y); }, 450); });
  cv.addEventListener("pointermove", e => { if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > 10) { clearTimeout(t); at = null; } });
  ["pointerup", "pointercancel"].forEach(k => cv.addEventListener(k, () => { clearTimeout(t); at = null; }));
  return { hide };
})();

// ---------------- fit the panel without scrolling ----------------
// Long money questions and wordy cards step down in size (never below 13px) until the panel fits.
function fitPanel() {
  const p = $("#panel"); if (!p || p.hidden) return;
  const targets = [...p.querySelectorAll(".mq, .e-d, .sign-h, .pax-t, .fb-e")];
  targets.forEach(t => (t.style.fontSize = t.style.lineHeight = ""));
  const over = () => p.scrollHeight > p.clientHeight + 1;
  const shrink = () => { for (let k = 0; k < 8 && over(); k++) {
    let changed = false;
    for (const t of targets) { const f = parseFloat(getComputedStyle(t).fontSize); if (f > 13) { t.style.fontSize = (f - 1) + "px"; t.style.lineHeight = Math.round((f - 1) * 1.35) + "px"; changed = true; } }
    if (!changed) break;
  } };
  shrink();
  // short amounts can go four across, but only when every button still fits its label
  const box = p.querySelector(":scope > .mq-box > .answers");
  if (over() && box && [...box.children].every(b => b.textContent.trim().length <= 5)) {
    box.classList.add("is-short");
    if ([...box.children].some(b => b.scrollWidth > b.clientWidth + 1)) box.classList.remove("is-short");
  }
  // last resort for a long road-card question: move its answers under the card (two-column layout only)
  // (a money question's answers move; for a row of driver buttons, what sits above them moves instead)
  const card = p.querySelector(":scope > .ecard"), ans = p.querySelector(":scope > .mq-box > .answers"), grid = p.querySelector(":scope > .grid");
  if (over() && card && (ans || grid) && getComputedStyle(p).display === "grid") {
    targets.forEach(t => (t.style.fontSize = t.style.lineHeight = ""));
    if (ans) { p.classList.add("ig-split"); card.after(ans); }
    else { p.classList.add("ig-split-g"); [...p.children].filter(e => e !== card && e !== grid && !e.classList.contains("eyebrow")).reverse().forEach((e, k, all) => { card.after(e); e.style.gridRow = String(3 + all.length - 1 - k); }); }
    shrink();
  }
}
window.addEventListener("resize", () => requestAnimationFrame(fitPanel));
