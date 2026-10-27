// =====================================================================
// SHO'T LEFT! — GARAGE (Phase 7)
// Looks only: paint, extra stripe, rims, roof, sticker and hooter, saved per driver name on this phone.
// The player's colour band always stays (it's how drivers tell taxis apart, colour-blind safe).
// Free: 4 paints and 2 hooters. Full Tank: everything. Locked items stay visible with the pump badge.
// =====================================================================
const Garage = (() => {
  const KEY = "shotleft.garage.v1";
  const PARTS = ["paint", "stripe", "rims", "roof", "sticker", "hooter"];
  const OPTS = { paint: ["white", "cream", "sky", "mint", "silver", "sunset", "jacaranda", "midnight"], stripe: ["none", "pin", "racing", "flames", "checks"],
    rims: ["steel", "chrome", "gold", "black", "match"], roof: ["standard", "sign", "rack", "lights", "spoiler"], sticker: ["none", "star", "heart", "sharp", "flower"],
    hooter: ["classic", "pip", "toot3", "truck", "twotone", "wheee"] };
  const FREE = { paint: ["white", "cream", "sky", "mint"], stripe: ["none"], rims: ["steel"], roof: ["standard"], sticker: ["none"], hooter: ["classic", "pip"] };
  const DEF = { paint: "white", stripe: "none", rims: "steel", roof: "standard", sticker: "none", hooter: "classic" };
  const SOUND = { paint: "spray", stripe: "tape", rims: "ting", roof: "thunk", sticker: "slap" };
  const k = n => String(n || "").trim().toLowerCase();
  const all = () => store.get(KEY, {});
  const isFree = (part, v) => FREE[part].includes(v);
  function look(name) {   // a refunded or locked item quietly falls back to the standard part
    const L = Object.assign({}, DEF, all()[k(name)] || {});
    for (const p of PARTS) if (!OPTS[p].includes(L[p]) || (!ENT.owned() && !isFree(p, L[p]))) L[p] = DEF[p];
    return L;
  }
  const svgLook = L => ({ paint: L.paint, stripe: L.stripe, rims: L.rims, roof: L.roof === "standard" ? undefined : L.roof, sticker: L.sticker });
  const taxi = (name, ident, w) => SLDS.taxi(ident, w, svgLook(look(name)));
  const pitch = ident => HOOT_PITCH[((ident && ident.n) || 1) - 1] || 1;
  const hoot = (name, ident) => Sound.fx.horn(look(name).hooter, pitch(ident));
  function save(name, L) { const a = all(); a[k(name)] = L; store.set(KEY, a); }

  // ---------------- the screen ----------------
  let who = null, tab = "paint", angle = 0;
  const root = () => document.getElementById("garage");
  function names() {   // the setup crew first, then anyone remembered
    const seen = new Set(), out = [];
    (prefs.names || []).concat(Object.keys(prefs.nameIdent || {})).forEach(n => { const t = String(n || "").trim(); if (t && !seen.has(k(t))) { seen.add(k(t)); out.push(t); } });
    return out.slice(0, 10);
  }
  const identFor = name => { const i = (prefs.names || []).findIndex(n => k(n) === k(name)); const id = (prefs.nameIdent || {})[k(name)] || (prefs.nameIdent || {})[name] || (i >= 0 && prefs.idents && prefs.idents[i]) || 1; return SLDS.PLAYERS[(+id || 1) - 1] || SLDS.PLAYERS[0]; };
  function tile(part, v, L, P) {
    const locked = !ENT.owned() && !isFree(part, v), on = L[part] === v, label = STR.gaOpts[part][v];
    const art = part === "paint" ? `<i class="ga__sw" style="background:${SLDS.PAINT[v]}"></i>`
      : part === "hooter" ? `<i class="ga__horn">${SLDS.icon("bolt")}</i>`
      : SLDS.taxi(P, 74, svgLook(Object.assign({}, L, { [part]: v })));
    return `<button class="ga__opt${on ? " is-on" : ""}${locked ? " is-locked" : ""}" data-ga="opt" data-p="${part}" data-v="${v}" aria-pressed="${on}" aria-label="${esc(label)}${locked ? `, ${esc(STR.stLocked)}` : ""}">
      ${art}<span>${esc(label)}</span>${locked ? `<b class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}</b>` : ""}</button>`;
  }
  function render() {
    const list = names(); if (!who || !list.some(n => k(n) === k(who))) who = list[0] || null;
    const el = document.getElementById("garageBody");
    if (!who) { el.innerHTML = `<div class="hof__empty">${Mascot.svg(110, "is-wave")}<p class="t-title">${esc(STR.gaNoName)}</p><button class="rp-btn" data-a="setup">${esc(STR.hofPlay)}</button></div>`; return; }
    const P = identFor(who), L = look(who);
    el.innerHTML = `<div class="ga__left">
        <div class="ga__stage" id="gaStage" aria-label="${esc(STR.gaSpin)}"><div class="ga__plate"></div><div class="ga__taxi" id="gaTaxi" style="--a:${angle}deg">${taxi(who, P, 250)}</div><span class="t-caption ga__hint">${esc(STR.gaSpin)}</span></div>
        <div class="ga__who"><span class="t-label">${esc(STR.gaWho)}</span><div class="ga__names">${list.map(n => `<button class="ga__name${k(n) === k(who) ? " is-on" : ""}" data-ga="who" data-v="${esc(n)}">${SLDS.badge(identFor(n), 22)}${esc(n)}</button>`).join("")}</div></div>
      </div>
      <div class="ga__right">
        <div class="rp-seg ga__tabs" role="tablist">${PARTS.map(p => `<button role="tab" data-ga="tab" data-v="${p}" aria-selected="${p === tab}">${esc(STR.gaTabs[p])}</button>`).join("")}</div>
        <div class="ga__grid">${OPTS[tab].map(v => tile(tab, v, L, P)).join("")}</div>
        <p class="t-caption ga__note">${esc(STR.gaWhoHint)} ${esc(STR.gaBoardNote)}</p>
        <button class="rp-btn rp-btn--secondary rp-btn--sm" data-ga="reset">${esc(STR.gaReset)}</button>
      </div>`;
    wireSpin();
  }
  function choose(part, v) {
    if (!ENT.owned() && !isFree(part, v)) { Sound.fx.error(); return Store.sheet("garage"); }
    const L = Object.assign({}, all()[k(who)] || DEF); L[part] = v; save(who, L);
    if (part === "hooter") Sound.fx.horn(v, pitch(identFor(who))); else Sound.fx[SOUND[part]]();
    Shell.buzz(10); render();
    const t = document.getElementById("gaTaxi"); if (t && !prefs.reduced) { t.classList.remove("is-pop"); void t.offsetWidth; t.classList.add("is-pop"); }
  }
  // drag to spin: a turntable under the taxi (the side view turns, showing its other side past 90°)
  function wireSpin() {
    const st = document.getElementById("gaStage"), t = document.getElementById("gaTaxi"); if (!st) return;
    let x0 = null, a0 = 0;
    st.onpointerdown = e => { x0 = e.clientX; a0 = angle; st.setPointerCapture(e.pointerId); st.classList.add("is-drag"); };
    st.onpointermove = e => { if (x0 === null) return; angle = a0 + (e.clientX - x0) * 0.8; t.style.setProperty("--a", angle + "deg"); st.style.setProperty("--a", angle + "deg"); };
    st.onpointerup = st.onpointercancel = () => { x0 = null; st.classList.remove("is-drag"); };
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-ga]"); if (!b || !root() || !root().contains(b)) return;
    const a = b.dataset.ga;
    if (a === "tab") { Sound.fx.tap(); tab = b.dataset.v; return render(); }
    if (a === "who") { Sound.fx.tap(); who = b.dataset.v; render(); return hoot(who, identFor(who)); }
    if (a === "opt") return choose(b.dataset.p, b.dataset.v);
    if (a === "reset") { Sound.fx.back(); save(who, Object.assign({}, DEF)); return render(); }
  });
  return { look, taxi, hoot, render, isFree, OPTS, FREE, PARTS, open(name) { if (name) who = name; nav.go("garage"); } };
})();
