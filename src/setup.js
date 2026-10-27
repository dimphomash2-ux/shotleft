// =====================================================================
// SHO'T LEFT! — LOAD THE TAXI (setup), WHO GOES FIRST, PASS THE PHONE (Phase 3)
// Setup only decides names, seats, colours and rules. The engine is untouched:
// player colours are applied right after Engine.create, and the roll-off only rotates
// the seating order (so who sits on whose left, and who does whose maths, never changes).
// =====================================================================
const MAX_DRIVERS = 6;
const HOOT_PITCH = [1, 1.12, 0.89, 1.26, 0.8, 1.06, 0.94];
const identOf = (p, i) => p.ident || (i % 7) + 1;
const capWords = s => s.replace(/\s+/g, " ").trim().replace(/(^|\s|')(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// player colours come from the crew picked at setup (identity = colour + pattern + icon)
function applyCrew(S, crew) {
  S.players.forEach((p, i) => {
    const c = (crew && crew[i]) || {}, id = c.ident >= 1 && c.ident <= 7 ? c.ident : (i % 7) + 1, P = SLDS.PLAYERS[id - 1];
    p.ident = id; p.color = P.hex; p.colorId = P.name.toLowerCase().replace(/ /g, "-"); p.far = !!c.far;
  });
}
// Table Mode: turn the action panel to face a driver sitting across the table
const Seat = { face(pi) { const p = G && G.players[pi]; $("#game").classList.toggle("far", !!(prefs.tableMode && p && p.far)); } };

const Setup = (() => {
  let openPick = -1;
  const P = () => SLDS.PLAYERS;
  function rows() {   // keep names, colours and seats lined up and valid
    if (!Array.isArray(prefs.names) || prefs.names.length < 2) prefs.names = ["Thabo", "Lindi", "Sipho", "Naledi"];
    prefs.names = prefs.names.slice(0, MAX_DRIVERS);
    const n = prefs.names.length, used = new Set();
    prefs.idents = (Array.isArray(prefs.idents) ? prefs.idents : []).slice(0, n);
    for (let i = 0; i < n; i++) {
      let id = prefs.idents[i];
      if (!(id >= 1 && id <= 7) || used.has(id)) { id = 1; while (used.has(id)) id++; }
      prefs.idents[i] = id; used.add(id);
    }
    prefs.far = Array.from({ length: n }, (_, i) => !!(prefs.far && prefs.far[i]));
    return n;
  }
  const shownName = (i) => (prefs.names[i] || "").trim() || STR.suNamePh(i + 1);
  function dupName() { const seen = new Set(); for (let i = 0; i < prefs.names.length; i++) { const k = shownName(i).toLowerCase(); if (seen.has(k)) return true; seen.add(k); } return false; }
  function sameCrewOffer() {
    const L = prefs.lastCrew; if (!L || !Array.isArray(L.names)) return "";
    const same = L.names.length === prefs.names.length && L.names.every((n, i) => n === shownName(i) && L.idents[i] === prefs.idents[i]);
    if (same) return "";
    const who = L.names.slice(0, 3).join(", ") + (L.names.length > 3 ? ` +${L.names.length - 3}` : "");
    return `<button class="su__same" data-su="same"><span class="dots">${L.names.map((n, i) => SLDS.badge(P()[(L.idents[i] || i + 1) - 1], 26)).join("")}</span><span><b>${esc(STR.suSame)}</b><small>${esc(who)}</small></span></button>`;
  }
  function driverRow(i) {
    const p = P()[prefs.idents[i] - 1], name = shownName(i);
    let h = `<div class="su__row" style="--pc:${p.hex}">
      <button class="su__taxi" data-su="pick" data-i="${i}" aria-label="${esc(STR.suPick(name))}" aria-expanded="${openPick === i}">${Garage.taxi(name, p, 66)}</button>
      <input type="text" maxlength="12" data-i="${i}" value="${esc(prefs.names[i] || "")}" placeholder="${esc(STR.suNamePh(i + 1))}" aria-label="${esc(STR.suName(i + 1))}" autocapitalize="words" autocomplete="off" spellcheck="false" enterkeyhint="done">
      <button class="rp-iconbtn" data-su="dice" data-i="${i}" aria-label="${esc(STR.suDice)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="8.5" cy="8.5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.8" fill="currentColor"/></svg></button>
      ${prefs.tableMode ? `<label class="rp-toggle su__far" title="${esc(STR.suFarHint)}"><input type="checkbox" data-su="far" data-i="${i}" ${prefs.far[i] ? "checked" : ""}><span class="rp-toggle__track"></span><span class="t-caption">${esc(STR.suFar)}</span></label>` : ""}</div>`;
    if (openPick === i) {
      h += `<div class="su__pick" role="group" aria-label="${esc(STR.suPick(name))}">${P().map((q, k) => {
        const owner = prefs.idents.indexOf(q.n), taken = owner >= 0 && owner !== i;
        return `<button class="su__swatch${owner === i ? " is-on" : ""}" data-su="ident" data-i="${i}" data-v="${q.n}" ${taken ? `aria-disabled="true" aria-label="${esc(q.name)}, taken by ${esc(shownName(owner))}"` : `aria-label="${esc(q.name)}"`}>${SLDS.badge(q, 40)}${taken ? `<i>${esc(shownName(owner).charAt(0).toUpperCase())}</i>` : ""}</button>`;
      }).join("")}</div>`;
    }
    return h;
  }
  function renderDrivers() {
    const n = rows();
    $("#setupCount").textContent = n;
    $("#setupFewer").setAttribute("aria-disabled", n <= 2); $("#setupMore").setAttribute("aria-disabled", n >= MAX_DRIVERS);
    $("#setupDrivers").innerHTML = prefs.names.map((_, i) => driverRow(i)).join("");
    validate();
  }
  function validate() {
    const bad = dupName(), btn = $("#setupStart");
    btn.setAttribute("aria-disabled", bad); $("#setupWhy").textContent = bad ? STR.suWhyName : "";
    // rebuild the offer only when the crew changes, so a tap on it is never swapped out mid-press
    const key = JSON.stringify([prefs.names.map((_, i) => shownName(i)), prefs.idents, prefs.lastCrew && prefs.lastCrew.names]), box = $("#setupSame");
    if (box.dataset.key !== key) { box.innerHTML = sameCrewOffer(); box.dataset.key = key; }
    const r = chosenRules(), m = FT.Rules.PRESETS[r.preset];
    $("#setupFoot").textContent = STR.suSummary(prefs.names.length, m ? m.name : "Classic", r.target);
  }
  function renderGame() {
    if (prefs.mode !== "classic" && !ENT.owned()) prefs.mode = "classic";
    const owned = ENT.owned();
    $("#setupMode").innerHTML = MODES.map(id => { const m = FT.Rules.PRESETS[id], locked = m.premium && !owned;
      return `<button class="su__mode${prefs.mode === id ? " is-on" : ""}${locked ? " is-locked" : ""}" data-a="mode" data-v="${id}" aria-pressed="${prefs.mode === id}">
        ${m.premium ? `<span class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}${esc(STR.suLocked)}</span>` : ""}<b>${esc(m.name)}</b><small>${esc(m.blurb)}</small></button>`; }).join("");
    const r = chosenRules(), pr = FT.Rules.PRESETS[r.preset].rules || {}, d = FT.Rules.describe(r);
    $("#setupSummary").textContent = r.preset === "classic" ? "The original Sho't Left rules." : d.join(" · ");
    $("#setupCustom").hidden = r.preset !== "custom"; if (r.preset === "custom") renderCustom();
    $("#setupTargetRow").hidden = r.preset === "custom" || pr.target !== undefined;
    $("#setupLevelRow").hidden = r.preset === "custom" || pr.level !== undefined;
    const lab = { 300: STR.suQuick, 500: STR.suNormal, 800: STR.suLong };
    $("#setupTarget").innerHTML = SL_CONFIG.targets.map(t => `<button data-a="target" data-v="${t}" aria-pressed="${prefs.target === t}">R${t}<small>${esc(lab[t] || "")}</small></button>`).join("");
    $("#setupLevel").innerHTML = Object.entries(LEVELS).map(([k, L]) => `<button data-a="level" data-v="${k}" aria-pressed="${prefs.level === k}">${esc(L.l)}<small>${esc(L.d)}</small></button>`).join("");
    $("#hintsT").checked = prefs.hints;
  }
  function render() { renderDrivers(); renderGame(); validate(); }
  function renderCustomRules() {
    const r = FT.Rules.normalise(prefs.customRules || {}), cap = v => String(v).charAt(0).toUpperCase() + String(v).slice(1);
    $("#setupCustom").innerHTML = CUSTOM_ROWS.map(([k, l, vals, f]) => `<div class="shs__row shs__stack"><span>${esc(l)}</span><div class="rp-seg">${vals.map(v => `<button data-a="rule" data-k="${k}" data-v="${v}" aria-pressed="${r[k] === v}">${esc(f ? f(v) : cap(v))}</button>`).join("")}</div></div>`).join("") +
      `<button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="ruleReset" style="margin-top:8px">${esc(STR.suCustomReset)}</button>`;
  }
  function freeIdent() { let id = 1; while (prefs.idents.includes(id)) id++; return id; }
  function randomName(exclude) { const taken = new Set(prefs.names.map(n => n.trim().toLowerCase())); const pool = STR.taxiNames.filter(n => !taken.has(n.toLowerCase()) && n !== exclude); return pool[Math.floor(Math.random() * pool.length)] || "Driver"; }
  // remembered favourite colour per name (applied when it's free)
  function rememberedIdent(i) { const fav = prefs.nameIdent && prefs.nameIdent[shownName(i).toLowerCase()]; if (fav && !prefs.idents.some((x, k) => x === fav && k !== i)) prefs.idents[i] = fav; }

  // events (inputs keep focus: only the Start state re-renders while typing)
  const root = document.getElementById("setup");
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-su]"); if (!b) return;
    const k = b.dataset.su, i = +b.dataset.i;
    if (k === "far") return;   // handled on change
    Sound.fx.tap();
    if (k === "count") { if (b.getAttribute("aria-disabled") === "true") { Sound.fx.error(); return Shell.say(+b.dataset.d < 0 ? STR.suMin : STR.suMax(MAX_DRIVERS)); }
      if (+b.dataset.d > 0) { prefs.names.push(randomName()); prefs.idents.push(freeIdent()); prefs.far.push(false); } else { prefs.names.pop(); prefs.idents.pop(); prefs.far.pop(); }
      openPick = -1; savePrefs(); return renderDrivers(); }
    if (k === "pick") { openPick = openPick === i ? -1 : i; return renderDrivers(); }
    if (k === "ident") { if (b.getAttribute("aria-disabled") === "true") { Sound.fx.error(); return Shell.say(b.getAttribute("aria-label")); }
      prefs.idents[i] = +b.dataset.v; openPick = -1; savePrefs(); Garage.hoot(shownName(i), P()[+b.dataset.v - 1]); return renderDrivers(); }
    if (k === "dice") { prefs.names[i] = randomName(prefs.names[i]); rememberedIdent(i); savePrefs(); renderDrivers(); const inp = root.querySelector(`input[data-i="${i}"]`); inp && inp.classList.add("is-new"); return; }
    if (k === "same") { const L = prefs.lastCrew; prefs.names = L.names.slice(); prefs.idents = L.idents.slice(); prefs.far = (L.far || []).slice(); openPick = -1; savePrefs(); return renderDrivers(); }
  });
  root.addEventListener("change", e => { const t = e.target; if (t.dataset.su === "far") { prefs.far[+t.dataset.i] = t.checked; savePrefs(); } });
  root.addEventListener("input", e => { const t = e.target; if (t.matches("input[type=text][data-i]")) { prefs.names[+t.dataset.i] = t.value; validate(); } });
  root.addEventListener("focusout", e => {
    const t = e.target; if (!t.matches("input[type=text][data-i]")) return;
    const i = +t.dataset.i, v = capWords(t.value);
    if (v !== t.value) { t.value = v; prefs.names[i] = v; }
    const before = prefs.idents[i]; rememberedIdent(i); savePrefs();
    if (prefs.idents[i] !== before) renderDrivers(); else validate();
  });
  root.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("input[type=text]")) e.target.blur(); });

  function start() {
    rows();
    if (dupName()) { Shell.buzz([40, 40, 40]); Sound.fx.error(); return Shell.say(STR.suWhyName); }
    const names = prefs.names.map((_, i) => capWords(shownName(i)));
    const crew = names.map((_, i) => ({ ident: prefs.idents[i], far: prefs.far[i] }));
    prefs.names = names.slice(); prefs.lastCrew = { names: names.slice(), idents: crew.map(c => c.ident), far: crew.map(c => c.far) };
    prefs.nameIdent = Object.assign({}, prefs.nameIdent); names.forEach((n, i) => (prefs.nameIdent[n.toLowerCase()] = crew[i].ident));
    savePrefs();
    const rules = chosenRules();
    const go = () => RollOff.run(names, crew).then(k => {
      const rot = a => a.slice(k).concat(a.slice(0, k));   // same seating circle, the winner drives first
      Shell.door(() => startGame(rot(names), rules, rot(crew)));
    });
    return Shell.savedGame() ? Shell.confirm({ title: STR.newGameT, body: STR.newGameB, yes: STR.newGameYes, no: STR.keepSaved }, go) : go();
  }
  return { render, renderCustom: renderCustomRules, start };
})();
function renderSetup() { Setup.render(); }
function renderCustom() { Setup.renderCustom(); }

// ---------------- who goes first: a fuzzy-dice roll-off ----------------
const RollOff = (() => {
  function run(names, crew) {
    return new Promise(resolve => {
      const host = document.createElement("div"); host.className = "rp-scrim ro"; host.setAttribute("role", "dialog"); host.setAttribute("aria-label", STR.roTitle);
      host.innerHTML = `<div class="ro__card"><div class="t-display-l">${esc(STR.roTitle)}</div><div class="ro__cols">${names.map((n, i) => `<div class="ro__col" data-i="${i}"><div class="ro__die">${SLDS.die(SLDS.PLAYERS[crew[i].ident - 1], 1 + (i % 6), 64)}</div><b>${esc(n)}</b></div>`).join("")}</div>
        <p class="ro__msg t-title" aria-live="polite"></p><p class="t-caption ro__skip">${esc(STR.roSkip)}</p></div>`;
      document.body.appendChild(host); requestAnimationFrame(() => host.classList.add("is-on"));
      let skip = prefs.reduced, done = false;
      host.addEventListener("pointerdown", () => { skip = true; if (done) finish(); });
      const cols = [...host.querySelectorAll(".ro__col")], msg = host.querySelector(".ro__msg");
      const sp = () => (prefs.fast ? 0.5 : 1), pause = ms => new Promise(r => setTimeout(r, skip ? 0 : ms * sp()));
      const face = (i, f) => { cols[i].querySelector(".ro__die").innerHTML = SLDS.die(SLDS.PLAYERS[crew[i].ident - 1], f, 64); };
      let winner = 0;
      const finish = () => { if (host.dataset.out) return; host.dataset.out = 1; host.classList.remove("is-on"); setTimeout(() => host.remove(), 260); resolve(winner); };
      (async () => {
        let contenders = names.map((_, i) => i), rolls = [];
        for (let round = 0; round < 8; round++) {
          cols.forEach((c, i) => c.classList.toggle("is-out", !contenders.includes(i)));
          if (!skip) { Sound.fx.step(); contenders.forEach(i => cols[i].classList.add("is-rolling")); }
          for (let t = 0; t < 9 && !skip; t++) { contenders.forEach(i => face(i, 1 + Math.floor(Math.random() * 6))); await pause(70); }
          rolls = names.map(() => 0); contenders.forEach(i => { rolls[i] = 1 + Math.floor(Math.random() * 6); face(i, rolls[i]); cols[i].classList.remove("is-rolling"); });
          Sound.fx.tick();
          const top = Math.max(...contenders.map(i => rolls[i])), best = contenders.filter(i => rolls[i] === top);
          if (best.length === 1) { winner = best[0]; break; }
          msg.textContent = STR.roTie; await pause(750); msg.textContent = ""; contenders = best;
          if (round === 7) winner = best[0];
        }
        cols.forEach((c, i) => { c.classList.toggle("is-win", i === winner); c.classList.toggle("is-out", i !== winner); });
        msg.textContent = STR.roWins(names[winner]); Garage.hoot(names[winner], SLDS.PLAYERS[crew[winner].ident - 1]); Shell.buzz([30, 60, 30]);
        done = true; host.querySelector(".ro__skip").textContent = "";
        await new Promise(r => setTimeout(r, skip ? 500 : 1300 * sp())); finish();
      })();
    });
  }
  return { run };
})();

// ---------------- pass the phone ----------------
const Handoff = (() => {
  let host = null;
  function show(pi) {
    hide(true);
    const p = G.players[pi], P = SLDS.PLAYERS[identOf(p, pi) - 1], id = SLDS.nextId(), seats = Engine.seatsUsed(p), max = Engine.rules(G).seats;
    host = document.createElement("div"); host.className = "ho" + (prefs.tableMode && p.far ? " is-far" : ""); host.setAttribute("role", "dialog"); host.setAttribute("aria-label", `${STR.hoKicker} ${p.name}`);
    host.style.setProperty("--pc", P.hex);
    host.innerHTML = `<svg class="ho__bg" aria-hidden="true"><defs>${SLDS.pattern(P, id, 2.4)}</defs><rect width="100%" height="100%" fill="${P.hex}"/><rect width="100%" height="100%" fill="url(#${id})"/></svg>
      <button class="rp-iconbtn ho__pause" data-a="menu" aria-label="${esc(STR.hoPause)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg></button>
      <div class="ho__card"><div class="ho__taxi">${Garage.taxi(p.name, P, 210)}</div>
        <div class="ho__text"><div class="t-label ho__k">${esc(STR.hoKicker)}</div><div class="ho__name">${esc(p.name)}</div>
        <div class="t-body ho__line">${esc(STR.hoLine(G.round, p.money, seats, max))}</div>
        <button class="rp-btn ho__go" data-ho="go">${esc(STR.hoGo(p.name))}</button></div></div>`;
    host.addEventListener("click", e => { if (e.target.closest('[data-ho="go"]')) { Sound.fx.tap(); hide(); R3.idleStart(G.turn); act.begin(); } });
    document.body.appendChild(host); requestAnimationFrame(() => host && host.classList.add("is-on"));
    Garage.hoot(p.name, P); Shell.buzz([30, 60, 30]);
    const go = host.querySelector(".ho__go"); go && go.focus({ preventScroll: true });
  }
  function hide(instant) { if (!host) return; const h = host; host = null; h.classList.remove("is-on"); if (instant) h.remove(); else setTimeout(() => h.remove(), 240); }
  return { show, hide, get open() { return !!host; } };
})();
