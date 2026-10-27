// =====================================================================
// SHO'T LEFT! — RESULTS, AWARDS, SHARE CARD, HALL OF FAME (Phase 6)
// Presentation only. Extra stats for the awards are counted from the events the engine already sends,
// and kept in G.tally so they survive a save and reload. The Hall of Fame lives on this phone only.
// =====================================================================
const Mascot = {
  // the rank's mascot: a cheeky little minibus in a gaartjie cap (original art)
  svg(size = 120, cls = "") {
    return `<svg class="ms ${cls}" viewBox="0 0 120 124" width="${size}" height="${Math.round(size * 124 / 120)}" aria-hidden="true">
      <ellipse cx="60" cy="118" rx="40" ry="5" fill="rgba(27,28,34,.28)"/>
      <g class="ms-arm ms-arm--l"><path d="M18 72 Q4 62 8 46" stroke="#1B1C22" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="8" cy="44" r="6" fill="#F8F5EE" stroke="#1B1C22" stroke-width="3"/></g>
      <g class="ms-arm ms-arm--r"><path d="M102 72 Q116 62 112 46" stroke="#1B1C22" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="112" cy="44" r="6" fill="#F8F5EE" stroke="#1B1C22" stroke-width="3"/></g>
      <g class="ms-body">
        <rect x="26" y="98" width="18" height="16" rx="5" fill="#1B1C22"/><rect x="76" y="98" width="18" height="16" rx="5" fill="#1B1C22"/>
        <rect x="16" y="30" width="88" height="74" rx="20" fill="#F8F5EE" stroke="#1B1C22" stroke-width="4"/>
        <rect x="24" y="38" width="72" height="30" rx="11" fill="#8FC6EA" stroke="#1B1C22" stroke-width="3.5"/>
        <path d="M30 44 Q48 40 60 42" stroke="rgba(255,255,255,.7)" stroke-width="3" fill="none" stroke-linecap="round"/>
        <g class="ms-eyes"><circle cx="46" cy="54" r="9" fill="#fff" stroke="#1B1C22" stroke-width="2.5"/><circle cx="74" cy="54" r="9" fill="#fff" stroke="#1B1C22" stroke-width="2.5"/>
          <circle class="ms-pupil" cx="48" cy="55" r="4.4" fill="#1B1C22"/><circle class="ms-pupil" cx="76" cy="55" r="4.4" fill="#1B1C22"/></g>
        <path d="M46 74 Q60 86 74 74" fill="#1B1C22"/><path d="M53 79 Q60 84 67 79" fill="#D0342A"/>
        <rect x="16" y="86" width="88" height="10" fill="#FFB300" stroke="#1B1C22" stroke-width="3.5"/>
        <circle cx="27" cy="80" r="5" fill="#FFE08A" stroke="#1B1C22" stroke-width="2.5"/><circle cx="93" cy="80" r="5" fill="#FFE08A" stroke="#1B1C22" stroke-width="2.5"/>
        <g class="ms-cap"><path d="M34 32 Q36 12 60 12 Q84 12 86 32 Z" fill="#7B5BD6" stroke="#1B1C22" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M60 30 Q86 26 100 33 Q86 38 60 34Z" fill="#5E43B3" stroke="#1B1C22" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="13" r="3.5" fill="#FFB300" stroke="#1B1C22" stroke-width="2"/></g>
      </g></svg>`;
  },
};

const Results = (() => {
  // ---------------- extra stats for the awards ----------------
  let FXT = null;
  const blank = () => ({ spaces: 0, high: 0, low: 0, cops: 0, bad: 0, good: 0, hooter: 0, slow: 0, overtakes: 0, maths: 0, caught: 0, lost: 0 });
  const T = i => { if (!G) return blank(); if (!G.tally) G.tally = G.players.map(blank); if (!G.tally[i]) G.tally[i] = blank(); return G.tally[i]; };
  function track(ev) {
    if (!G) return;
    try {
      switch (ev.type) {
        case "move": { const t = T(ev.pi); t.spaces += ev.n || 0; t[ev.gear === "high" ? "high" : "low"]++; if (ev.cop) t.cops++; break; }
        case "road": { const id = ev.card && ev.card.id, t = T(G.turn); if (!id) break; const tone = ((FXT || (FXT = STR.cardFx(SL_CONFIG)))[id] || ["fun"])[0];
          if (tone === "bad") t.bad++; if (tone === "good") t.good++; if (id === "hooter") t.hooter++; if (id === "cop" && !ev.police) t.cops++; break; }
        case "money": if (ev.amount < 0 && /slowest on the hooter/i.test(ev.reason || "")) T(ev.pi).slow++; break;
        case "answer": if (ev.right && ev.answerer != null) T(ev.answerer).maths++; break;
        case "fare": if (ev.caught) T(G.turn).caught++; break;
        case "alight": if (ev.lost) T(ev.pi).lost++; break;
        case "escaped": T(ev.pi).lost++; break;
      }
    } catch {}
  }
  const bump = (i, k) => { T(i)[k] = (T(i)[k] || 0) + 1; };

  // ---------------- awards: three that somebody clearly earned ----------------
  const AW = [
    ["bank", p => p.stats.earned], ["gaartjie", p => p.stats.delivered], ["clean", p => -p.stats.fines, "min"], ["spender", p => p.stats.fines],
    ["robot", (p, t) => t.spaces], ["speed", (p, t) => t.high], ["safe", (p, t) => t.low], ["roadblock", (p, t) => t.cops],
    ["pothole", (p, t) => t.bad], ["lucky", (p, t) => t.good], ["maths", (p, t) => t.maths], ["overtake", (p, t) => t.overtakes],
    ["hooter", (p, t) => t.hooter], ["slowhand", (p, t) => t.slow], ["eagle", (p, t) => t.caught], ["leaky", (p, t) => t.lost],
  ];
  const ICON = { bank: "coin", gaartjie: "seat", clean: "star", spender: "coin", robot: "bolt", speed: "bolt", safe: "heart", roadblock: "diamond",
    pothole: "triangle", lucky: "star", maths: "square", overtake: "bolt", hooter: "circle", slowhand: "circle", eagle: "diamond", leaky: "seat" };
  function awards() {
    const cand = [];
    for (const [id, f, kind] of AW) {
      const vals = G.players.map((p, i) => f(p, T(i)));
      const top = Math.max(...vals), lo = Math.min(...vals), who = vals.indexOf(top);
      if (vals.filter(v => v === top).length !== 1) continue;            // a clear winner only
      if (kind === "min" ? top === lo : top <= 0) continue;               // "fewest fines" needs someone with more
      cand.push({ id, who });
    }
    // a stable shuffle per game, then spread the awards across different drivers where possible
    let s = G.players.reduce((h, p) => [...p.name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, h), G.round) >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    cand.sort(() => rnd() - 0.5);
    const out = [], got = new Set();
    for (const c of cand) if (out.length < 3 && !got.has(c.who)) { out.push(c); got.add(c.who); }
    for (const c of cand) if (out.length < 3 && !out.includes(c)) out.push(c);
    return out;
  }

  // ---------------- the podium ----------------
  let skipT = null, last = null;
  function show(pi) {
    const w = G.players[pi];
    const ranked = G.players.map((p, i) => ({ p, i })).sort((a, b) => b.p.money - a.p.money || (a.i === pi ? -1 : b.i === pi ? 1 : 0));
    const ident = i => SLDS.PLAYERS[identOf(G.players[i], i) - 1];
    const aw = awards();
    last = { pi, ranked: ranked.map(r => ({ i: r.i, name: r.p.name, money: r.p.money, pax: r.p.stats.delivered, ident: ident(r.i) })), aw: aw.map(a => ({ ...a, name: G.players[a.who].name })), rounds: G.round, rules: G.rules };
    HallOfFame.record(G, pi);
    // Play's in-app review: on the podium after the 3rd finished game on this phone (the app only, never mid-game)
    try { const R = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.InAppReview;
      if (R && HallOfFame.load().games === 3) setTimeout(() => R.requestReview().catch(() => {}), 3000); } catch {}
    const podium = [ranked[1], ranked[0], ranked[2]].map((r, k) => r ? `<div class="rs-pod rs-pod--${k === 1 ? 1 : k === 0 ? 2 : 3}" style="--pc:${ident(r.i).hex}">
        <div class="rs-pod__taxi">${Garage.taxi(r.p.name, ident(r.i), k === 1 ? 104 : 80)}</div><div class="rs-pod__block"><b>${k === 1 ? 1 : k === 0 ? 2 : 3}</b><span>${esc(r.p.name)}</span></div></div>` : `<div class="rs-pod rs-pod--empty"></div>`).join("");
    const mode = G.rules && G.rules.preset !== "classic" ? ` · ${esc((FT.Rules.PRESETS[G.rules.preset] || {}).name || "Custom")}` : "";
    $("#winBody").innerHTML = `
      <div class="rs__left">
        <div class="rs__head"><div class="t-label rs__k">${esc(STR.rsKicker)}${mode}</div>
          <h1 class="rs__name" style="--pc:${ident(pi).hex}">${esc(STR.rsWins(w.name))}</h1>
          <p class="rs__line">${esc(STR.rsLine(w.money, G.round, w.stats.delivered))}</p></div>
        <div class="rs__stage"><div class="rs__mascot">${Mascot.svg(76, "is-dance")}</div><div class="rs__podium">${podium}</div></div>
        <div class="rs__awards" aria-label="${esc(STR.rsAwards)}">${aw.map(a => `<div class="rs-aw" style="--pc:${ident(a.who).hex}" title="${esc(STR.awards[a.id][1])}"><span class="rs-aw__i">${SLDS.icon(ICON[a.id] || "star")}</span><span><b>${esc(STR.awards[a.id][0])}</b><small>${esc(G.players[a.who].name)}</small></span><span class="sr-only">${esc(STR.awards[a.id][1])}</span></div>`).join("")}</div>
      </div>
      <div class="rs__right">
        <ol class="rs__rank">${ranked.map((r, k) => `<li style="--pc:${ident(r.i).hex}" class="${r.i === pi ? "is-win" : ""}"><span class="rs__pos">${k + 1}</span>${SLDS.badge(ident(r.i), 30)}<span class="rs__who">${esc(r.p.name)}<small>${r.p.stats.delivered} ${esc(STR.rsCols.pax)} · R${r.p.stats.earned} ${esc(STR.rsCols.earned)} · R${r.p.stats.fines} ${esc(STR.rsCols.fines)}</small></span><b class="rs__money">R${r.p.money}</b></li>`).join("")}</ol>
        <div class="rs__btns">
          <button class="rp-btn" data-a="replay">${esc(STR.rsRematch)}</button>
          <div class="rs__row"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-rs="new">${esc(STR.rsNew)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-rs="share">${esc(STR.rsShare)}</button></div>
          <div class="rs__row rs__row--small"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="mainmenu">${esc(STR.rsMenu)}</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-rs="hof">${esc(STR.rsHof)}</button></div>
        </div>
      </div>`;
    const root = $("#win"); root.classList.remove("is-done"); clearTransient(); screen("win");
    if (prefs.reduced) root.classList.add("is-done");
    // a hooter chorus from last place up to the winner, then confetti in the winner's colour
    ranked.slice().reverse().forEach((r, k) => setTimeout(() => Garage.hoot(r.p.name, ident(r.i)), (500 + k * 220) * (fast() ? 0.55 : 1)));
    clearTimeout(skipT); skipT = setTimeout(() => root.classList.add("is-done"), 2400 * (fast() ? 0.55 : 1));
    if (!prefs.reduced) confetti(ident(pi).hex);
    Store.maybeUpsell();
  }
  function confetti(hex) {
    const cols = [hex, hex, "#FFB300", "#F8F5EE", hex];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i"); c.className = "rp-confetti";
      c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length];
      c.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); c.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      c.style.setProperty("--d", Math.round((1500 + Math.random() * 1200) * (fast() ? 0.55 : 1)) + "ms");
      c.style.animationDelay = (900 + Math.random() * 700) * (fast() ? 0.55 : 1) + "ms"; document.body.appendChild(c); setTimeout(() => c.remove(), 4400);
    }
  }
  document.getElementById("win").addEventListener("click", e => {
    const root = document.getElementById("win"); if (!root.classList.contains("is-done") && !e.target.closest("button")) { root.classList.add("is-done"); return; }
    const b = e.target.closest("[data-rs]"); if (!b) return; Sound.fx.tap();
    if (b.dataset.rs === "new") return nav.go("setup");
    if (b.dataset.rs === "hof") return nav.go("hof");
    if (b.dataset.rs === "share") return share();
  });

  // ---------------- the share card: 1080 × 1920, made offline ----------------
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const svgUrl = svg => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
  async function card() {
    const L = last, W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    try { await document.fonts.ready; } catch {}
    const win = L.ranked.find(r => r.i === L.pi);
    // asphalt, a road, the amber stripe band
    x.fillStyle = "#1B1C22"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W / 2, 760, 60, W / 2, 760, 760); g.addColorStop(0, win.ident.hex + "AA"); g.addColorStop(1, "rgba(27,28,34,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.translate(0, 120); for (let k = -4; k < 30; k++) { x.fillStyle = k % 2 ? "#FFB300" : "#1B1C22"; x.beginPath(); x.moveTo(k * 60, 0); x.lineTo(k * 60 + 60, 0); x.lineTo(k * 60 + 20, 40); x.lineTo(k * 60 - 40, 40); x.fill(); } x.restore();
    try { const logo = await loadImg(SL_BRAND.big); const lw = 520, lh = lw * logo.height / logo.width; x.drawImage(logo, (W - lw) / 2, 200, lw, lh); } catch {}
    x.textAlign = "center"; x.fillStyle = "#FFB300"; x.font = '800 44px "Nunito", sans-serif'; x.fillText(STR.rsKicker.toUpperCase().split("").join(" "), W / 2, 720);
    // the winner's name, as big as fits
    let fs = 190; x.font = `400 ${fs}px "Bungee", sans-serif`; const nm = win.name.toUpperCase(); while (x.measureText(nm).width > W - 120 && fs > 80) { fs -= 8; x.font = `400 ${fs}px "Bungee", sans-serif`; }
    x.lineWidth = 16; x.strokeStyle = "#1B1C22"; x.lineJoin = "round"; x.strokeText(nm, W / 2, 900); x.fillStyle = win.ident.hex; x.fillText(nm, W / 2, 900);
    x.fillStyle = "#F8F5EE"; x.font = '400 64px "Bungee", sans-serif'; x.fillText(`R${win.money}`, W / 2, 990);
    try { const taxi = await loadImg(svgUrl(Garage.taxi(win.name, win.ident, 720))); x.drawImage(taxi, (W - 720) / 2, 1000, 720, 460); } catch {}
    // the scores
    let y = 1520; x.textAlign = "left";
    for (const [k, r] of L.ranked.slice(0, 6).entries()) {
      const rowY = y + k * 58; x.fillStyle = r.ident.hex; x.beginPath(); x.arc(170, rowY - 14, 16, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#F8F5EE"; x.font = '800 40px "Nunito", sans-serif'; x.fillText(`${k + 1}. ${r.name}`, 210, rowY);
      x.textAlign = "right"; x.fillStyle = "#FFB300"; x.font = '400 40px "Bungee", sans-serif'; x.fillText(`R${r.money}`, W - 150, rowY); x.textAlign = "left";
    }
    // the call to action
    x.textAlign = "center"; const cy = H - 120;
    x.fillStyle = "#FFB300"; x.beginPath(); x.roundRect ? x.roundRect(150, cy - 70, W - 300, 100, 50) : x.rect(150, cy - 70, W - 300, 100); x.fill();
    x.fillStyle = "#1B1C22"; x.font = '400 40px "Bungee", sans-serif'; x.fillText(STR.shareCta.toUpperCase(), W / 2, cy - 6);
    x.fillStyle = "#B9B4A8"; x.font = '700 30px "Nunito", sans-serif'; x.fillText(STR.shareBy, W / 2, H - 30);
    return c;
  }
  async function share() {
    if (!last) return;
    Shell.say(STR.shareMaking);
    let canvas; try { canvas = await card(); } catch (e) { return Shell.say(STR.shareFail); }
    const blob = await new Promise(r => canvas.toBlob(r, "image/png")); const url = canvas.toDataURL("image/png");
    const file = blob && typeof File === "function" ? new File([blob], "shotleft-winner.png", { type: "image/png" }) : null;
    const text = STR.shareText(last.ranked[0].name, last.ranked[0].money);
    const cap = window.Capacitor && window.Capacitor.Plugins;
    const send = async () => {
      try {
        if (cap && cap.Share && cap.Filesystem) {   // the Android app: write to cache, then the system share sheet
          const w = await cap.Filesystem.writeFile({ path: "shotleft-winner.png", data: url.split(",")[1], directory: "CACHE" });
          return cap.Share.share({ title: "Sho't Left", text, url: w.uri, dialogTitle: STR.shareSend });
        }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text });
        saveImg();
      } catch (e) { if (e && e.name === "AbortError") return; Shell.say(STR.shareFail); }
    };
    // in the claude.ai viewer a save goes through its downloads capability; elsewhere a normal download link
    const dlP = window.claude && typeof window.claude.use === "function" ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
    const saveImg = async () => {
      const dl = await dlP;
      if (dl) { try { await dl.save({ filename: "shotleft-winner.png", data: blob }); Shell.say(STR.shareDone); } catch (e) { if (!e || e.code !== "declined") Shell.say(STR.shareFail); } return; }
      const a = document.createElement("a"); a.href = url; a.download = "shotleft-winner.png"; document.body.appendChild(a); a.click(); a.remove(); Shell.say(STR.shareDone);
    };
    Shell.dialog({ title: STR.shareTitle, html: `<img class="rs-share" src="${url}" alt="${esc(text)}">`,
      actions: [{ label: STR.shareSend, fn: send }, { label: STR.shareSave, kind: "secondary", fn: saveImg }] });
  }
  return { track, bump, show, share, awards, card, confetti, get last() { return last; } };
})();

// ---------------- Hall of Fame: local stats only ----------------
const HallOfFame = (() => {
  const KEY = "shotleft.hof.v1";
  const load = () => store.get(KEY, { games: 0, names: {}, best: null, streak: null });
  function record(g, winner) {
    if (!g || g._hof) return; g._hof = true;
    const H = load(); H.games++;
    g.players.forEach((p, i) => {
      const k = p.name.trim().toLowerCase(), n = H.names[k] || (H.names[k] = { name: p.name, games: 0, wins: 0, best: 0, streak: 0, bestStreak: 0, idents: {} });
      n.name = p.name; n.games++; n.best = Math.max(n.best, p.money);
      const id = identOf(p, i); n.idents[id] = (n.idents[id] || 0) + 1;
      if (i === winner) { n.wins++; n.streak++; n.bestStreak = Math.max(n.bestStreak, n.streak); } else n.streak = 0;
      if (!H.best || p.money > H.best.money) H.best = { money: p.money, name: p.name };
      if (!H.streak || n.bestStreak > H.streak.n) H.streak = { n: n.bestStreak, name: p.name };
    });
    store.set(KEY, H);
  }
  function render() {
    const H = load(), el = document.getElementById("hofBody"), list = Object.values(H.names).sort((a, b) => b.wins - a.wins || b.best - a.best);
    if (!H.games) {
      el.innerHTML = `<div class="hof__empty">${Mascot.svg(120, "is-wave")}<p class="t-title">${esc(STR.hofEmpty)}</p><button class="rp-btn" data-a="setup" aria-label="${esc(STR.playLabel)}">${esc(STR.hofPlay)}</button></div>`;
      return;
    }
    const fav = n => { const best = Object.entries(n.idents).sort((a, b) => b[1] - a[1])[0]; return SLDS.PLAYERS[(best ? +best[0] : 1) - 1]; };
    el.innerHTML = `<div class="hof__tiles">
        <div class="hof__tile"><small>${esc(STR.hofGames)}</small><b>${H.games}</b></div>
        <div class="hof__tile"><small>${esc(STR.hofBest)}</small><b>${H.best ? esc(STR.hofBestVal(H.best.money, H.best.name)) : "–"}</b></div>
        <div class="hof__tile"><small>${esc(STR.hofStreak)}</small><b>${H.streak && H.streak.n ? esc(STR.hofStreakVal(H.streak.n, H.streak.name)) : "–"}</b></div></div>
      <section class="shs__card"><h2>${esc(STR.hofDrivers)}</h2><ol class="hof__list">${list.map((n, k) => `<li><span class="hof__pos">${k + 1}</span>${Garage.taxi(n.name, fav(n), 58)}<span class="hof__who"><b>${esc(n.name)}</b><small>${esc(STR.hofFav)}: ${esc(fav(n).name)}</small></span>
        <span class="hof__n"><b>${n.wins}</b><small>${esc(STR.hofWins)}</small></span><span class="hof__n"><b>${n.games}</b><small>${esc(STR.hofPlayed)}</small></span><span class="hof__n"><b>R${n.best}</b><small>${esc(STR.hofTop)}</small></span></li>`).join("")}</ol>
        <p class="t-caption">${esc(STR.hofLocal)}</p></section>`;
  }
  return { record, render, load };
})();
