// =====================================================================
// SHO'T LEFT! — APP SHELL (Phase 2)
// Launch intro, door transition, living menu, first run, dialogs, settings, pause,
// about, exit, wake lock, autosave backup and the friendly error screen.
// The shell only drives screens. It never changes the rules.
// =====================================================================
const Shell = (() => {
  const H = document.documentElement;
  const speed = () => (prefs.fast ? 0.5 : 1);
  const wait = ms => new Promise(r => setTimeout(r, Math.round(ms * speed())));
  const buzz = pattern => { if (!prefs.haptics) return; try { navigator.vibrate && navigator.vibrate(pattern); } catch {} };
  const introVisible = () => !$("#intro").hidden;
  const ago = t => { const s = Math.max(0, (Date.now() - t) / 1000); if (s < 60) return "just now"; const m = Math.round(s / 60); if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`; const d = Math.round(h / 24); return d === 1 ? "yesterday" : `${d} days ago`; };

  // ---------------- dialogs (one host, Back closes the top one) ----------------
  let dlg = null;
  function dialog({ title, body = "", html = "", actions = [], dismiss = true, label }) {
    closeDialog(true);
    const host = document.createElement("div"); host.className = "rp-scrim shx"; host.id = "shDialog";
    host.innerHTML = `<div class="rp-dialog" role="alertdialog" aria-label="${esc(label || title)}"><div class="t-title">${esc(title)}</div>${body ? `<p class="t-body">${esc(body)}</p>` : ""}${html}
      <div class="shx__acts">${actions.map((a, i) => `<button class="rp-btn ${a.kind === "secondary" ? "rp-btn--secondary rp-btn--sm" : a.kind === "danger" ? "rp-btn--danger" : ""}" data-dx="${i}">${esc(a.label)}</button>`).join("")}</div></div>`;
    host.addEventListener("click", e => {
      if (e.target === host && dismiss) return closeDialog();
      const b = e.target.closest("[data-dx]"); if (!b) return;
      Sound.fx.tap(); const a = actions[+b.dataset.dx]; if (a.keep !== true) closeDialog(); a.fn && a.fn();
    });
    document.body.appendChild(host); dlg = { host, dismiss, onClose: null };
    requestAnimationFrame(() => host.classList.add("is-on"));
    const first = host.querySelector("[data-dx]"); first && first.focus({ preventScroll: true });
    return host;
  }
  function closeDialog(instant) {
    if (!dlg) return false;
    const { host } = dlg; dlg = null; host.classList.remove("is-on");
    if (instant) host.remove(); else setTimeout(() => host.remove(), 260);
    return true;
  }
  const dialogOpen = () => !!dlg;
  const dialogDismissable = () => !!dlg && dlg.dismiss;
  const confirm = (o, yes) => dialog({ title: o.title, body: o.body, actions: [{ label: o.yes, kind: o.danger ? "danger" : "", fn: yes }, { label: o.no, kind: "secondary" }] });

  // ---------------- the sliding-door transition ----------------
  let dooring = false;
  async function door(fn) {
    if (dooring) return fn();
    if (prefs.reduced) { fn(); const s = document.querySelector(".screen:not([hidden])"); if (s) { s.classList.remove("sh-fade"); void s.offsetWidth; s.classList.add("sh-fade"); } return; }
    dooring = true; const d = $("#door"); d.hidden = false; void d.offsetWidth;
    Sound.fx.door(); d.classList.add("is-closed"); buzz(12);
    await wait(170);
    try { fn(); } finally { await wait(60); d.classList.remove("is-closed"); await wait(170); d.hidden = true; dooring = false; }
  }

  // ---------------- launch intro (cold start only, tap to skip) ----------------
  let launching = false, launchDone = null;
  function launch() {
    const L = $("#launch");
    const warm = (() => { try { return sessionStorage.getItem("sl.warm") === "1"; } catch { return false; } })();
    try { sessionStorage.setItem("sl.warm", "1"); } catch {}
    if (warm || prefs.reduced) { L.hidden = true; return Promise.resolve(); }
    launching = true;
    return new Promise(res => {
      let finished = false;
      const finish = () => { if (finished) return; finished = true; launching = false; L.classList.add("is-out"); setTimeout(() => { L.hidden = true; }, 240 * speed()); res(); };
      launchDone = finish;
      L.addEventListener("pointerdown", finish, { once: true });
      const d = $("#door"); d.hidden = false; d.classList.add("is-closed");
      setTimeout(() => { Sound.fx.hoot(); }, 60);
      setTimeout(() => { d.classList.remove("is-closed"); L.classList.add("is-open"); Sound.fx.door(); setTimeout(() => (d.hidden = true), 200); }, 320 * speed());
      setTimeout(finish, 1500 * speed());
    });
  }
  const skipLaunch = () => { if (launchDone) launchDone(); };

  // ---------------- first run (shown once) ----------------
  let firstRun = false;
  function maybeFirstRun() {
    if (prefs.firstRunDone || prefs.played) return;
    firstRun = true;
    const steps = n => `<div class="shx__steps"><i class="${n === 0 ? "on" : ""}"></i><i class="${n === 1 ? "on" : ""}"></i></div>`;
    const done = () => { firstRun = false; prefs.firstRunDone = true; savePrefs(); };
    const step2 = () => dialog({ title: STR.fr2Title, body: STR.fr2Body, html: steps(1), dismiss: false,
      actions: [{ label: STR.fr2Yes, fn: () => { done(); Tutorial.start(0); } }, { label: STR.fr2No, kind: "secondary", fn: done }] });
    const host = dialog({ title: STR.fr1Title, body: STR.fr1Body, dismiss: false,
      html: `<button class="shx__hoot" data-sh="hoot" aria-label="${esc(STR.fr1Test)}">PEEP<br>PEEP</button>${steps(0)}`,
      actions: [{ label: STR.fr1Yes, fn: () => { Sound.set("muted", false); step2(); } }, { label: STR.fr1No, kind: "secondary", fn: () => { Sound.set("muted", true); step2(); } }] });
    host.querySelector('[data-sh="hoot"]').addEventListener("click", () => { Sound.unlock(); Sound.set("muted", false); Sound.fx.hoot(); buzz([90, 50, 90]); });
  }
  const skipFirstRun = () => { closeDialog(); firstRun = false; prefs.firstRunDone = true; savePrefs(); };

  // ---------------- living menu ----------------
  const MENU_TAXIS = Engine.create(["", "", "", "", "", ""], 500, 1).players.map((p, i) => ({ ...p, name: "", pos: [0, 4, 8, 12, 16, 20][i] }));
  let attractT = null, tipT = null, tipI = -1, lookT = null, attractBusy = false;
  const lookForHour = h => (h >= 5 && h < 9 ? "classic" : h >= 9 && h < 16 ? "toy" : h >= 16 && h < 19 ? "golden" : "night");
  function applyLook() { const L = prefs.look === "auto" ? lookForHour(new Date().getHours()) : prefs.look; if (R3.looks.includes(L)) R3.setLook(L); }
  function nextTip() {
    const t = $("#shTip"); if (!t) return;
    let i; do { i = Math.floor(Math.random() * STR.tips.length); } while (i === tipI && STR.tips.length > 1); tipI = i;
    const paint = () => { t.innerHTML = `<span class="k">${SLDS.icon("bolt")}${esc(STR.tipK)}</span><p>${esc(STR.tips[i])}</p>`; t.classList.remove("is-swap"); };
    if (!t.innerHTML || prefs.reduced) return paint();
    t.classList.add("is-swap"); setTimeout(paint, 220 * speed());
  }
  async function attractTick() {
    if (attractBusy || !introVisible() || prefs.reduced || R3.busy || document.hidden || dlg) return;
    attractBusy = true;
    try {
      const i = Math.floor(Math.random() * MENU_TAXIS.length), from = MENU_TAXIS[i].pos, path = [];
      for (let k = 1; k <= 4; k++) path.push((from + k) % SL_CONFIG.boardSpaces);
      await R3.drive(MENU_TAXIS, i, path, Math.random() < 0.5 ? "low" : "high", false);
      MENU_TAXIS[i].pos = path[path.length - 1];
    } finally { attractBusy = false; }
  }
  function season() {
    const z = $("#season"); const m = (location.hash.match(/season=(\w+)/) || [])[1];
    const now = new Date(), mon = now.getMonth(), hr = now.getHours();
    const kind = m || (mon === 9 || mon === 10 ? "petals" : mon === 11 ? "lights" : "") ;
    const rain = m === "rain" || (!m && (mon === 11 || mon <= 1) && hr >= 14 && hr < 19);
    let html = "";
    if (kind === "petals") for (let k = 0; k < 16; k++) html += `<i class="petal" style="left:${(k * 6.3 + Math.random() * 5).toFixed(1)}%;--d:${(10 + Math.random() * 8).toFixed(1)}s;--del:-${(Math.random() * 16).toFixed(1)}s;--sw:${Math.round(20 + Math.random() * 50) * (k % 2 ? 1 : -1)}px"></i>`;
    if (kind === "lights") {
      const cols = ["#FFB300", "#D0342A", "#1E9E57", "#56B4E9", "#7B5BD6"];
      html += `<div class="wire"></div>`;
      for (let k = 0; k < 17; k++) { const t = k / 16, x = 2 + t * 96, y = 4 + Math.sin(t * Math.PI) * 30;
        html += `<i class="bulb" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}px;background:${cols[k % 5]};--del:-${(k * 0.27).toFixed(2)}s"></i>`; }
    }
    if (rain) { html += `<div class="dim"></div>`; for (let k = 0; k < 34; k++) html += `<i class="drop" style="left:${(k * 3.2 + Math.random() * 3).toFixed(1)}%;--d:${(0.6 + Math.random() * 0.4).toFixed(2)}s;--del:-${Math.random().toFixed(2)}s"></i>`; }
    z.innerHTML = html;
  }
  function menuOn(on) {
    const z = $("#season");
    clearInterval(attractT); clearInterval(tipT); attractT = tipT = null;
    if (on) {
      z.hidden = false; if (!z.innerHTML) season(); applyLook();
      nextTip(); tipT = setInterval(nextTip, 9000);
      attractT = setInterval(attractTick, 4500); setTimeout(attractTick, 900);
    } else { z.hidden = true; if (R3.busy && attractBusy) R3.skip(); }
  }
  function resetMenuTaxis() { R3.syncTaxis(MENU_TAXIS, -1); }
  // tap the city on the menu: a little hooter and a shout
  let downAt = null;
  function wireEggs() {
    const cv = $("#board");
    cv.addEventListener("pointerdown", e => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener("pointerup", e => {
      if (!downAt || !introVisible() || dlg) return; const d = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y), dt = performance.now() - downAt.t; downAt = null;
      if (d > 8 || dt > 400) return;
      Sound.unlock(); Sound.fx.hoot(); buzz(20);
      const b = document.createElement("div"); b.className = "sh-egg"; b.textContent = STR.eggs[Math.floor(Math.random() * STR.eggs.length)];
      b.style.left = e.clientX + "px"; b.style.top = e.clientY + "px"; document.body.appendChild(b); setTimeout(() => b.remove(), 1400 * speed());
    });
  }

  // ---------------- screen hook: living menu, wake lock ----------------
  let wake = null;
  async function wakeOn(on) {
    try {
      if (on && prefs.keepAwake && "wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => (wake = null)); }
      else if (!on && wake) { await wake.release(); wake = null; }
    } catch { wake = null; }
  }
  function onScreen(id) { menuOn(id === "intro"); wakeOn(id === "none"); }

  // ---------------- saves: keep the previous good save as a fallback ----------------
  const PREV = "shotleft3d.save.v2.prev";
  const _save = FT.Saves.save, _clear = FT.Saves.clear;
  FT.Saves.save = (st, g) => { const cur = st.get(FT.Saves.V2, null); if (cur && cur.game && cur.game.players) st.set(PREV, cur); _save(st, g); };
  FT.Saves.clear = st => { _clear(st); st.del(PREV); };
  function savedGame() { const w = store.get(FT.Saves.V2, null); return w && w.game && Array.isArray(w.game.players) && w.game.players.length ? w : null; }
  function openGame(g) { G = g; shown.length = 0; $("#players").innerHTML = ""; screen("none"); R3.syncTaxis(G.players, G.turn); R3.focusTaxi(G.turn); Juice.reset(); Sound.music("game"); resumePhase(); }
  function continueGame() {
    let g = null;
    try { g = FT.Saves.load(store); if (g) return openGame(g); } catch (e) { console.error(e); }
    try { const p = store.get(PREV, null); if (p && p.game && p.game.players) { store.set(FT.Saves.V2, p); return openGame(FT.Saves.upgradeGame(p.game)); } } catch (e) { console.error(e); }
    FT.Saves.clear(store); G = null; renderIntro(); screen("intro");
    dialog({ title: STR.badSaveT, body: STR.badSaveB, actions: [{ label: STR.ok }] });
  }

  // ---------------- a message above every screen (the in-game toast sits under full screens) ----------------
  let sayT = null;
  function say(text) {
    let n = document.getElementById("shSay"); if (!n) { n = document.createElement("div"); n.id = "shSay"; n.className = "rp-toast"; n.setAttribute("role", "status"); document.body.appendChild(n); }
    n.textContent = text; n.classList.add("is-on"); clearTimeout(sayT); sayT = setTimeout(() => n.classList.remove("is-on"), 2000);
  }

  // ---------------- exit ----------------
  function exitApp() {
    try { const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App; if (A && A.exitApp) return A.exitApp(); } catch {}
    try { if (window.SLNative && typeof window.SLNative.exit === "function") return window.SLNative.exit(); } catch {}
    if (IN_APP) { ignoreHash = true; history.back(); say(STR.backAgain); }
  }
  const confirmExit = () => dialog({ title: STR.exitT, body: STR.exitB, actions: [{ label: STR.stay }, { label: STR.exit, kind: "secondary", fn: exitApp }] });

  // ---------------- friendly error screen ----------------
  let oopsShown = 0;
  // a small local error log (last 20), attached when a player emails support from Settings › Help
  function logErr(err) { try { const L = store.get("shotleft.log", []); L.push(`${new Date().toISOString()} ${SL_VERSION} ${String((err && (err.stack || err.message)) || err).slice(0, 300)}`); store.set("shotleft.log", L.slice(-20)); } catch {} }
  function oops(err) {
    logErr(err);
    console.error(err);
    try { save(); } catch {}
    if (Date.now() - oopsShown < 3000 || dlg) return; oopsShown = Date.now();
    dialog({ title: STR.oopsT, body: STR.oopsB, dismiss: false, actions: [
      { label: STR.tryAgain, fn: () => { lock = false; if (G && $("#game").classList.contains("ingame")) { try { resumePhase(); } catch (e) { console.error(e); } } } },
      { label: STR.toMenu, kind: "secondary", fn: () => { lock = false; G = null; hidePanel(); $("#players").innerHTML = ""; nav.toMenu(); } }] });
  }
  window.addEventListener("error", e => { if (e && e.message && !/ResizeObserver/.test(e.message)) oops(e.error || e.message); });
  window.addEventListener("unhandledrejection", e => oops(e.reason));

  // ---------------- boot ----------------
  function boot() {
    applyLook(); setInterval(() => { if (introVisible() || G) applyLook(); }, 5 * 60 * 1000);
    H.classList.toggle("fast", !!prefs.fast); H.classList.toggle("large", !!prefs.textLarge);
    wireEggs();
    // Android app (Capacitor): the system back gesture goes through the game's own back map. The App plugin
    // handles it with an OnBackPressedCallback, so predictive back on Android 16 works and never exits by accident.
    try { const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (A && A.addListener) A.addListener("backButton", () => { try { window.__onBack(); } catch (e) { oops(e); } }); } catch {}
    // after an update: a one-time "What's new at the rank" card on the menu, easy to dismiss
    setTimeout(function whatsNew() {
      if (prefs.seenVersion === SL_VERSION) return;
      if (!prefs.played || !introVisible() || dlg || launching || firstRun) { if (!prefs.played) { prefs.seenVersion = SL_VERSION; savePrefs(); } return; }
      prefs.seenVersion = SL_VERSION; savePrefs();
      dialog({ title: STR.wnTitle, html: `<ul class="wn">${STR.wnItems.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`, actions: [{ label: STR.wnOk }] });
    }, 2600);
    document.addEventListener("pointerdown", e => { if (e.target.closest(".rp-btn:not([aria-disabled=true]),.rp-iconbtn,.shm__cont")) buzz(8); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { wake = null; return; }
      if (G && $("#game").classList.contains("ingame")) { wakeOn(true); toast(STR.welcomeBack); } });
    $("#shTip").addEventListener("click", () => { Sound.fx.tap(); nextTip(); clearInterval(tipT); tipT = setInterval(nextTip, 9000); });
    renderIntro(); screen("intro");
    launch().then(maybeFirstRun);
  }
  return { say, boot, door, dialog, confirm, closeDialog, dialogOpen, dialogDismissable, confirmExit, exitApp, onScreen, continueGame, savedGame, resetMenuTaxis, oops, buzz, ago,
    get introPlaying() { return launching; }, skipLaunch, get firstRunOpen() { return firstRun; }, skipFirstRun, applyLook, nextTip };
})();

// ---------------- main menu ----------------
function renderIntro() {
  const w = Shell.savedGame(), g = w && w.game;
  const ftSub = ENT.owned() ? "Unlocked" : ENT.state === "pending" ? "Pending" : "Premium";
  const cont = g ? `<button class="shm__cont" data-a="continue" aria-label="Continue your saved game">
      <span><b>${esc(STR.continueK)}</b>${esc(STR.continueLine(g.round || 1, g.cfgTarget || 500, Shell.ago(w.savedAt || Date.now())))}</span>
      <span class="shm__dots">${g.players.slice(0, 6).map(p => `<i style="background:${esc(p.color)}" title="${esc(p.name)}">${esc((p.name || "?").trim().charAt(0).toUpperCase())}</i>`).join("")}</span></button>` : "";
  $("#introActions").innerHTML = `${cont}
    <button class="rp-btn shm__play" data-a="setup" aria-label="${esc(STR.playLabel)}">${esc(STR.play)}</button>
    <div class="shm__grid">
      <button class="rp-btn rp-btn--secondary rp-btn--sm${prefs.played ? "" : " is-new"}" data-a="help">${esc(STR.howTo)}</button>
      <button class="rp-btn rp-btn--fulltank rp-btn--sm" data-a="shop">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}<span>${esc(STR.fullTank)}<small>${esc(ftSub)}</small></span></button>
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="garage">${esc(STR.gaTitle)}</button>
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="settings">${esc(STR.settings)}</button>
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="hof">${esc(STR.hofTitle)}</button></div>`;
}

// ---------------- settings ----------------
function renderSettings() {
  const v = Sound.vol, pct = x => Math.round(x * 100) + "%";
  const seg = (k, opts, cur) => `<div class="rp-seg" role="group">${opts.map(([val, lab]) => `<button data-sh="seg" data-k="${k}" data-v="${val}" aria-pressed="${String(cur) === String(val)}">${esc(lab)}</button>`).join("")}</div>`;
  const tog = (attr, key, on, label, hint) => `<div class="shs__row"><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span><label class="rp-toggle" aria-label="${esc(label)}"><input type="checkbox" ${attr}="${key}" ${on ? "checked" : ""}><span class="rp-toggle__track"></span></label></div>`;
  const sld = (k, label) => `<div class="shs__row"><span>${esc(label)}</span><label class="rp-slider" aria-label="${esc(label)}"><input type="range" min="0" max="1" step="0.05" value="${v[k]}" data-s="${k}" style="--v:${pct(v[k])}"></label></div>`;
  $("#settingsBody").innerHTML = `
    <section class="shs__card"><h2>${esc(STR.gSound)}</h2>${sld("master", STR.master)}${sld("sfx", STR.sfx)}${sld("music", STR.music)}${sld("voice", STR.voiceVol)}${tog("data-s", "muted", v.muted, STR.mute)}</section>
    <section class="shs__card"><h2>${esc(STR.gFeel)}</h2>${tog("data-p", "haptics", prefs.haptics, STR.haptics)}${tog("data-p", "fast", prefs.fast, STR.fast, STR.fastHint)}${tog("data-p", "reduced", prefs.reduced, STR.reduced, STR.reducedHint)}</section>
    <section class="shs__card"><h2>${esc(STR.gDisplay)}</h2>
      <div class="shs__row"><span>${esc(STR.textSize)}</span>${seg("textLarge", [[false, STR.textNormal], [true, STR.textLarge]], !!prefs.textLarge)}</div>
      <div class="shs__row shs__stack"><span>${esc(STR.look)}<small>${esc(STR.lookHint)}</small></span>${seg("look", [["auto", STR.lookAuto], ["classic", STR.lookDay], ["golden", STR.lookSunset], ["night", STR.lookNight], ["toy", STR.lookBright]], prefs.look)}</div>
      <div class="shs__row shs__stack"><span>${esc(STR.quality)}</span>${seg("quality", [["auto", STR.qAuto], ["low", STR.qLow], ["medium", STR.qMed], ["high", STR.qHigh]], prefs.quality)}</div>
      ${tog("data-p", "keepAwake", prefs.keepAwake, STR.keepAwake)}</section>
    <section class="shs__card"><h2>${esc(STR.gGame)}</h2>
      <div class="shs__row shs__stack"><span>${esc(STR.setHandoff)}<small>${esc(STR.setHandoffHint)}</small></span>${seg("handoff", [["card", STR.setHandoffCard], ["banner", STR.setHandoffBanner]], prefs.handoff === "banner" ? "banner" : "card")}</div>
      ${tog("data-p", "tableMode", prefs.tableMode, STR.setTable, STR.setTableHint)}${tog("data-p", "hints", prefs.hints, STR.hints)}</section>
    <section class="shs__card"><h2>${esc(STR.gHelp)}</h2><div class="shs__btns">
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="restore">${esc(STR.restore)}</button>
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="help">${esc(STR.howTo)}</button>
      ${SL_SUPPORT_EMAIL ? `<button class="rp-btn rp-btn--secondary rp-btn--sm" data-sh="contact">${esc(STR.contact)}</button>` : ""}
      ${SL_PRIVACY_URL ? `<button class="rp-btn rp-btn--secondary rp-btn--sm" data-sh="privacy">${esc(STR.privacy)}</button>` : ""}
      <button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="about">${esc(STR.about)}</button></div>
      <div class="shs__row shs__stack" style="border-top:1px dashed var(--sl-kerb-grey)"><button class="rp-btn rp-btn--danger rp-btn--sm sh-hold" data-sh="reset">${esc(STR.reset)}</button><span><small>${esc(STR.resetHint)}</small></span></div></section>`;
}
(function wireSettings() {
  const root = document.getElementById("settings");
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-sh]"); if (!b) return;
    const k = b.dataset.sh;
    if (k === "seg") {
      Sound.fx.tap(); const key = b.dataset.k, val = b.dataset.v;
      if (key === "textLarge") { prefs.textLarge = val === "true"; document.documentElement.classList.toggle("large", prefs.textLarge); }
      if (key === "look") { prefs.look = val; Shell.applyLook(); }
      if (key === "quality") { prefs.quality = val; R3.setQuality(autoQuality()); }
      if (key === "handoff") prefs.handoff = val === "banner" ? "banner" : "card";
      savePrefs(); return renderSettings();
    }
    if (k === "contact") { const body = encodeURIComponent(`\n\n— Sho't Left ${SL_VERSION} · ${navigator.userAgent}\n\nRecent errors:\n${(store.get("shotleft.log", []).slice(-5).join("\n")) || "none"}`); location.href = `mailto:${SL_SUPPORT_EMAIL}?subject=${encodeURIComponent("Sho't Left support")}&body=${body}`; return; }
    if (k === "privacy") { window.open(SL_PRIVACY_URL, "_blank"); return; }
  });
  // hold-to-confirm reset
  let holdT = null;
  root.addEventListener("pointerdown", e => {
    const b = e.target.closest('[data-sh="reset"]'); if (!b) return;
    b.classList.add("is-holding");
    holdT = setTimeout(() => {
      b.classList.remove("is-holding"); Shell.buzz([60, 40, 60]);
      [PREF_KEY, "shotleft.audio"].forEach(k => store.del(k)); FT.Saves.clear(store); try { sessionStorage.clear(); } catch {}
      Shell.say(STR.resetDone); setTimeout(() => location.reload(), 700);
    }, 1500);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(t => root.addEventListener(t, () => { clearTimeout(holdT); root.querySelectorAll(".is-holding").forEach(x => x.classList.remove("is-holding")); }));
  root.addEventListener("input", e => {
    const t = e.target;
    if (t.type === "range") t.style.setProperty("--v", Math.round(t.value * 100) + "%");
    if (t.dataset.p === "fast") document.documentElement.classList.toggle("fast", t.checked);
    if (t.dataset.p === "keepAwake" && !t.checked) Shell.onScreen("settings");
  });
  root.addEventListener("change", e => { const t = e.target;
    if (t.type === "checkbox") return t.checked ? Sound.fx.toggleOn() : Sound.fx.toggleOff();
    if (t.type !== "range") return;
    if (t.dataset.s === "music") { if (!Sound.musicMode) Sound.music(G ? "game" : true); }
    else if (t.dataset.s === "voice") Sound.voice("sharp");
    else t.dataset.s === "master" ? Sound.fx.hoot() : Sound.fx.cash(); });
})();

// ---------------- about ----------------
function renderAbout() {
  devTaps = 0;
  $("#aboutBody").innerHTML = `<img src="${SL_BRAND.big}" alt="Sho't Left!"><p class="t-body-l">${esc(STR.aboutMade)}<br>${esc(STR.aboutCredits)}</p>
    <p class="muted2">${esc(STR.aboutPrivacy)}</p><p class="muted2">${esc(STR.aboutLic)}</p>
    <p class="t-caption" id="aboutVersion" data-a="devtap" style="padding:12px 24px;cursor:default">${esc(STR.version(SL_VERSION))}</p>`;
}

// ---------------- pause menu ----------------
function renderPause() { if (G) $("#pauseInfo").textContent = STR.pauseInfo(G.round, G.cfgTarget); }
