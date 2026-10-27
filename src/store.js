// =====================================================================
// SHO'T LEFT! — FULL TANK STORE (Phase 7)
// Full screen from the menu, a bottom sheet from any lock badge. Every state is designed:
// loading (shimmer, offline after 8 s), offline, buying, pending, success (+ a quick tour), cancelled
// (closes quietly), error (Try again), already owned (thank you). The price always comes from the store.
// =====================================================================
const Store = (() => {
  let ui = "idle", priceT = null, upsold = false, tour = false, sheetEl = null;
  const root = () => document.getElementById("shop");
  const crewName = () => (prefs.names || [])[0] || "";
  const crewIdent = () => SLDS.PLAYERS[((prefs.idents || [])[0] || 1) - 1] || SLDS.PLAYERS[0];
  const GAUGE = full => `<svg class="rp-gauge st__gauge${full ? " is-full" : ""}" viewBox="0 0 180 110" aria-hidden="true"><path d="M18 90 A72 72 0 0 1 162 90" fill="none" stroke="#1B1C22" stroke-width="16" stroke-linecap="round"/>
      <path d="M18 90 A72 72 0 0 1 162 90" fill="none" stroke="url(#stG)" stroke-width="10" stroke-linecap="round"/>
      <defs><linearGradient id="stG" x1="0" x2="1"><stop offset="0" stop-color="#D0342A"/><stop offset=".5" stop-color="#FFB300"/><stop offset="1" stop-color="#1E9E57"/></linearGradient></defs>
      <text x="16" y="108" font-family="Bungee,sans-serif" font-size="15" fill="#F8F5EE">E</text><text x="150" y="108" font-family="Bungee,sans-serif" font-size="15" fill="#F8F5EE">F</text>
      <g class="rp-gauge__needle"><path d="M90 90 L87 30 L90 22 L93 30 Z" fill="#F8F5EE" stroke="#1B1C22" stroke-width="1.5"/></g><circle cx="90" cy="90" r="9" fill="#FFB300" stroke="#1B1C22" stroke-width="3"/></svg>`;
  const PUMP = `<svg class="st__pump" viewBox="0 0 90 150" aria-hidden="true"><rect x="10" y="20" width="56" height="122" rx="8" fill="#7B5BD6" stroke="#1B1C22" stroke-width="4"/>
      <rect x="20" y="32" width="36" height="28" rx="4" fill="#BFE0F5" stroke="#1B1C22" stroke-width="3"/><text x="38" y="52" text-anchor="middle" font-family="Bungee,sans-serif" font-size="13" fill="#1B1C22">FT</text>
      <rect x="20" y="72" width="36" height="8" rx="3" fill="#FFB300" stroke="#1B1C22" stroke-width="2"/><path d="M66 50 h10 q8 0 8 8 v50 q0 8 -6 8" fill="none" stroke="#1B1C22" stroke-width="5" stroke-linecap="round"/>
      <rect x="4" y="138" width="68" height="8" rx="3" fill="#1B1C22"/><rect x="24" y="10" width="28" height="12" rx="3" fill="#FFB300" stroke="#1B1C22" stroke-width="3"/></svg>`;
  function hero(full) {
    return `<div class="st__canopy"><span>FULL TANK</span></div>${PUMP}
      <div class="st__car">${Garage.taxi(crewName(), crewIdent(), 220)}</div>${GAUGE(full)}`;
  }
  const benefits = (n = 5) => `<ul class="st__list">${STR.stBenefits.slice(0, n).map(([ic, t, d]) => `<li><span class="st__tick">${SLDS.icon(ic)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></li>`).join("")}</ul>`;
  function buyButton() {
    const has = ENT.hasStore();
    if (!has) return `<button class="rp-btn" aria-disabled="true" disabled>${esc(STR.stFill("…"))}</button><p class="st__msg">${esc(STR.stNoStore)}</p>`;
    if (ENT.state === "pending") return `<button class="rp-btn" disabled>${esc(STR.stFill(ENT.price || "…"))}</button><p class="st__msg is-wait">${esc(STR.stPending)}</p>${window.SLBilling.preview ? `<button class="st__link" data-st="clear">${esc(STR.stPreviewClear)}</button>` : ""}`;
    if (ui === "buying") return `<button class="rp-btn" disabled>${esc(STR.stBuying)}</button>`;
    if (ui === "offline") return `<p class="st__msg">${esc(STR.stOffline)}</p><button class="rp-btn rp-btn--secondary" data-st="retry">${esc(STR.stRetry)}</button>`;
    if (ui === "error") return `<p class="st__msg is-bad">${esc(STR.stError)}</p><button class="rp-btn" data-st="buy">${esc(STR.stRetry)}</button>`;
    if (!ENT.price) return `<button class="rp-btn st__shimmer" disabled>${esc(STR.stLoading)}</button>`;
    return `<button class="rp-btn" data-st="buy">${esc(STR.stFill(ENT.price))}</button>`;
  }
  function body() {
    const owned = ENT.owned(), prev = ENT.hasStore() && window.SLBilling.preview;
    if (owned) return `<h1 class="st__title">${esc(tour ? STR.stDoneT : STR.stOwned)}</h1><p class="st__sub">${esc(tour ? STR.stDoneS + " " + STR.stOwnedLine : STR.stOwnedLine)}</p>
      ${tour ? `<p class="t-label st__k">${esc(STR.stTour)}</p><div class="st__tour"><button class="rp-btn rp-btn--sm" data-st="go" data-v="chaos">${esc(STR.stTourGo.chaos)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-st="go" data-v="garage">${esc(STR.stTourGo.garage)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-st="go" data-v="custom">${esc(STR.stTourGo.rules)}</button></div>` : benefits()}
      <div class="st__foot"><button class="st__link" data-st="restore">${esc(STR.stRestore)}</button>${prev ? `<button class="st__link" data-st="reset">${esc(STR.stPreviewReset)}</button>` : ""}</div>`;
    return `<h1 class="st__title">${esc(STR.stTitle)}</h1><p class="st__sub">${esc(STR.stSub)}</p>${ENT.state === "revoked" ? `<p class="st__msg is-bad">${esc(STR.stRevoked)}</p>` : ""}${benefits()}
      <div class="st__buy">${buyButton()}</div>
      <div class="st__foot"><button class="st__link" data-st="restore">${esc(STR.stRestore)}</button><small>${esc(STR.stSmall)}</small></div>${prev ? `<p class="st__preview">${esc(STR.stPreview)}</p>` : ""}`;
  }
  // ask the store for the price; after 8 s with no answer, show the offline state
  function loadPrice() {
    if (!ENT.hasStore() || ENT.price || ENT.owned()) return;
    clearTimeout(priceT); priceT = setTimeout(() => { if (!ENT.price) { ui = "offline"; paint(); } }, 8000);
    ENT.refresh().then(() => { clearTimeout(priceT); if (!ENT.price && ui !== "offline") ui = "offline"; paint(); });
  }
  function paint() {
    const r = root(), sb = document.getElementById("stBody"); if (r && sb) { sb.innerHTML = body(); r.classList.toggle("is-buying", ui === "buying"); }
    if (sheetEl) sheetEl.querySelector(".st-sheet__buy").innerHTML = ENT.owned() ? `<p class="st__msg">${esc(STR.stDone)}</p>` : buyButton();
  }
  function render(soft) {
    if (!soft) { ui = "idle"; tour = false; document.getElementById("stHero").innerHTML = hero(ENT.owned());
      setTimeout(() => { const c = root().querySelector(".st__car"); c && c.classList.add("is-in"); if (!prefs.reduced) Sound.fx.ignition(); }, 120); }
    paint(); if (!soft) loadPrice();
  }
  async function buy() {
    if (ui === "buying" || !ENT.hasStore()) return;
    ui = "buying"; paint(); Sound.fx.tap();
    const r = await ENT.purchase();
    if (r.ok) return celebrate();
    ui = r.cancelled ? "idle" : ENT.state === "pending" ? "idle" : "error";   // a cancel just closes the sheet, no guilt message
    paint();
  }
  function celebrate() {
    ui = "idle"; tour = true; closeSheet();
    if (root().hidden) nav.go("shop");
    document.getElementById("stHero").innerHTML = hero(false); paint();
    requestAnimationFrame(() => requestAnimationFrame(() => { const g = root().querySelector(".st__gauge"), c = root().querySelector(".st__car"); g && g.classList.add("is-full"); c && c.classList.add("is-in"); }));
    Sound.fx.purchase(); Juice.haptic("success");
    (prefs.names || []).slice(0, 6).forEach((n, i) => setTimeout(() => Garage.hoot(n, SLDS.PLAYERS[((prefs.idents || [])[i] || i + 1) - 1]), 700 + i * 200));
    setTimeout(() => { if (!prefs.reduced) Results.confetti("#7B5BD6"); }, 600);
  }
  // ---------------- the bottom sheet from a lock badge ----------------
  function sheet(from) {
    if (ENT.owned()) return;
    closeSheet(); Sound.fx.tap();
    sheetEl = document.createElement("div"); sheetEl.className = "st-sheet"; sheetEl.setAttribute("role", "dialog"); sheetEl.setAttribute("aria-label", STR.stTitle);
    sheetEl.innerHTML = `<div class="st-sheet__scrim" data-st="close"></div><div class="st-sheet__panel">
        <button class="rp-iconbtn st-sheet__x" data-st="close" aria-label="Close">${SLDS.icon("close")}</button>
        <div class="st-sheet__head">${GAUGE(false)}<div><span class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}${esc(STR.stLocked)}</span><h2 class="st__title">${esc(STR.stTitle)}</h2><p class="st__sub">${esc(STR.stSheetLine)}</p></div></div>
        ${benefits(3)}<div class="st-sheet__buy">${buyButton()}</div>
        <div class="st__foot"><button class="st__link" data-st="see">${esc(STR.stSee)}</button><small>${esc(STR.stSmall)}</small></div></div>`;
    document.body.appendChild(sheetEl); requestAnimationFrame(() => sheetEl && sheetEl.classList.add("is-on"));
    loadPrice();
  }
  function closeSheet() { if (!sheetEl) return false; const s = sheetEl; sheetEl = null; s.classList.remove("is-on"); setTimeout(() => s.remove(), 260); return true; }
  // ---------------- one gentle prompt per session, after a finished game ----------------
  function maybeUpsell() {
    if (upsold || ENT.owned() || !ENT.hasStore()) return; upsold = true;
    setTimeout(() => {
      const w = document.getElementById("win"); if (!w || w.hidden) return;
      const c = document.createElement("div"); c.className = "st-up"; c.innerHTML = `<span>${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}${esc(STR.stUpsell)}</span><button class="rp-btn rp-btn--fulltank rp-btn--sm" data-st="see">${esc(STR.stUpsellGo)}</button><button class="st__link" data-st="later">${esc(STR.stLater)}</button>`;
      w.appendChild(c);
    }, 3500 * (fast() ? 0.55 : 1));
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    const a = b.dataset.st;
    if (a === "buy") return buy();
    if (a === "retry") { ui = "idle"; ENT.price = null; paint(); return loadPrice(); }
    if (a === "restore") { Sound.fx.tap(); return (window.SLBilling && window.SLBilling.restore ? window.SLBilling.restore() : Promise.resolve()).then(() => ENT.restore()).then(() => { Shell.say(ENT.owned() ? STR.stRestored : ENT.hasStore() ? STR.stNothing : STR.stNoStore); render(true); }); }
    if (a === "reset") { window.SLBilling.reset(); ENT._set("not_purchased", null); ENT.price = null; return render(); }
    if (a === "clear") { window.SLBilling.clearPending(); return ENT.refresh().then(() => ENT.owned() ? celebrate() : paint()); }
    if (a === "close") { Sound.fx.back(); return closeSheet(); }
    if (a === "see") { closeSheet(); const u = document.querySelector(".st-up"); u && u.remove(); return nav.go("shop"); }
    if (a === "later") { Sound.fx.tap(); const u = document.querySelector(".st-up"); return u && u.remove(); }
    if (a === "go") { const v = b.dataset.v; if (v === "garage") return nav.go("garage"); prefs.mode = v === "custom" ? "custom" : "chaos"; savePrefs(); return nav.go("setup"); }
  });
  // check purchases again whenever the app comes back (restores, refunds, payments that cleared while closed)
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ENT.hasStore()) ENT.refresh(); });
  ENT.on(() => { paint(); if (typeof renderIntro === "function" && !document.getElementById("intro").hidden) renderIntro(); });
  return { render, sheet, closeSheet, maybeUpsell, get sheetOpen() { return !!sheetEl; } };
})();
