"""Builds dist/index.html (the single-file game) from the 2.9.1 original plus each phase's sources.
Every replacement must match exactly once, so a changed original fails loudly instead of silently."""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
FONTS = ROOT / "fonts"
src = (ROOT / "original-2.9.1.html").read_text()
VERSION = "2.17.0"

def b64(p, mime): return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()
def read(p): return (ROOT / p).read_text()
def once(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f"build: expected 1 match, found {n}: {old[:80]!r}")
    src = src.replace(old, new)
def block(start, end, new):
    """replace from `start` through the first `end` after it (both must exist, start exactly once)"""
    global src
    if src.count(start) != 1: sys.exit(f"build: block start not unique: {start[:60]!r}")
    i = src.index(start); j = src.index(end, i) + len(end)
    src = src[:i] + new + src[j:]
def section(sid, new):
    global src
    pat = re.compile(r'<section id="%s"[^>]*>.*?</section>' % re.escape(sid), re.S)
    if len(pat.findall(src)) != 1: sys.exit(f"build: section {sid} not found once")
    src = pat.sub(lambda m: new, src, count=1)

# ===================== Phase 1: design system + Style Guide =====================
css = read("src/design-system.css").replace("__BUNGEE__", b64(FONTS / "bungee.woff", "font/woff")).replace("__NUNITO__", b64(FONTS / "nunito.woff", "font/woff"))
once('<div id="game">', f'<style id="sl-design-system">\n{css}\n</style>\n<style id="sl-shell">\n{read("src/shell.css")}\n</style>\n<style id="sl-setup">\n{read("src/setup.css")}\n</style>\n<style id="sl-ingame">\n{read("src/ingame.css")}\n</style>\n<div id="game">')
once('<section id="shop" class="screen scrim-full" hidden>', '<section id="styleguide" class="screen sg" hidden aria-label="Style guide"></section>\n\n  <section id="shop" class="screen scrim-full" hidden>')
once('const SL_VERSION = "2.9.1";', f'const SL_VERSION = "{VERSION}";')
once('case "devtap": { devTaps++; if (devTaps >= 7) renderDev(); return; }', 'case "devtap": { devTaps++; if (devTaps >= 7) { devTaps = 0; StyleGuide.open("about"); } return; }')

# ===================== Phase 2: app shell =====================
# fonts: everything uses the bundled Nunito; no internet font
once('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;600;800;900&display=swap">', '')
once('--font:"Overpass","Arial Narrow",system-ui,-apple-system,"Segoe UI",sans-serif;', '--font:var(--sl-font-ui);')
# markup: seasonal layer, launch intro + door, new menu / settings / pause / about
once('<canvas id="board" aria-label="3D game board: a miniature South African city with a taxi route"></canvas>',
     '<canvas id="board" aria-label="3D game board: a miniature South African city with a taxi route"></canvas>\n  <div id="season" class="shz" hidden aria-hidden="true"></div>')
section("splash", "")
section("intro", '''<section id="intro" class="screen shm">
    <div class="shm__panel">
      <img data-logo="big" class="shm__logo" alt="Sho't Left!">
      <p class="shm__tag t-label">The minibus taxi board game · Mash Made</p>
      <div id="introActions" class="shm__actions"></div>
    </div>
    <aside class="shm__tip" id="shTip" aria-live="polite"></aside>
  </section>''')
section("settings", '''<section id="settings" class="screen shs" hidden>
    <header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">Settings</h1></header>
    <div id="settingsBody" class="shs__grid"></div>
  </section>''')
section("menu", '''<section id="menu" class="screen shp" hidden>
    <div class="rp-dialog" role="dialog" aria-label="Paused">
      <div class="t-display-l">Paused</div><p class="t-body" id="pauseInfo" style="margin:0 0 4px"></p>
      <button class="rp-btn" data-a="resume">Back to the game</button>
      <div class="shp__row"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="help">How to Play</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="settings">Settings</button></div>
      <div class="shp__row"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="restart">Restart</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-a="quit">Save &amp; quit</button></div>
    </div>
  </section>''')
section("about", '''<section id="about" class="screen shs" hidden>
    <header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">About</h1></header>
    <div class="sha" id="aboutBody"></div>
  </section>''')
once('<div id="rotate" hidden>', '''<div id="launch" class="shl" aria-hidden="true"><div class="shl__glow"></div><img data-logo="big" class="shl__logo" alt=""><div class="shl__by t-label">a Mash Made game</div></div>
<div id="door" class="shd" hidden aria-hidden="true"><i class="shd__l"></i><i class="shd__r"></i></div>
<div id="rotate" hidden>''')
# prefs: new settings with safe defaults; the city look now follows the clock unless chosen
once('look: "classic", reduced: false', 'look: "auto", reduced: false, fast: false, haptics: true, textLarge: false, keepAwake: true, firstRunDone: false')
# Fast Mode trims every pause, like Rush Hour does
once('const fast = () => !!(G && G.rules && G.rules.pace === "fast");', 'const fast = () => !!(prefs.fast || (G && G.rules && G.rules.pace === "fast"));')
# any error inside an action: save and show the friendly screen
once('catch (e) { console.error(e); } finally', 'catch (e) { Shell.oops(e); } finally')
once('try { navigator.vibrate && navigator.vibrate([90, 50, 90]); } catch {}', 'Shell.buzz([90, 50, 90]);')
# Back: the app keeps one history entry everywhere, so Back always reaches the game first
block('function backTrap(onIntro) {', '\n}\n', 'function backTrap() {\n  if (!IN_APP) return;\n  if (location.hash !== "#play") location.hash = "play";\n}\n')
once('backTrap(id === "intro"); }', 'backTrap(); if (typeof Shell !== "undefined") Shell.onScreen(id); }')
once('!$("#intro").hidden && land ? Math.min(420, innerWidth * 0.42) : 0', '!$("#intro").hidden && land ? (document.querySelector(".shm__panel") ? document.querySelector(".shm__panel").getBoundingClientRect().right + 8 : 420) : 0')
once('screen("none"); R3.syncTaxis(G.players, 0);', 'hist.length = 0; screen("none"); R3.syncTaxis(G.players, 0);')
once('if (m.premium && !ENT.owned()) { backTo = "setup"; renderShop(); return screen("shop"); }', 'if (m.premium && !ENT.owned()) return nav.go("shop");')
# the old menu/settings renderers are replaced by the shell versions
block('function renderIntro() {', '\n}\n', '')
block('function renderSettings() {', '\n}\n', '')
# navigation: a small history stack, so Back always returns to where you came from
block('let backTo = "intro";\nconst nav = {', '\n};\n', read("src/nav.js"))
block('window.__onBack = () => {', '\n};\n', '''window.__onBack = () => {
  if (StyleGuide.isOpen()) { if (!StyleGuide.closeOverlay()) StyleGuide.close(); return; }
  if (Shell.introPlaying) return Shell.skipLaunch();
  if (Shell.firstRunOpen) return Shell.skipFirstRun();
  if (Shell.dialogOpen()) { if (Shell.dialogDismissable()) Shell.closeDialog(); return; }
  if (document.querySelector(".ro")) return;          // the roll-off is a second or two; let it finish
  if (Handoff.open) return nav.menu();
  if (!$("#menu").hidden) return nav.resume();
  if (!$("#settings").hidden || !$("#help").hidden || !$("#about").hidden || !$("#shop").hidden || !$("#setup").hidden) return nav.back();
  if (!$("#win").hidden) return nav.mainmenu();
  if (G && $("#game").classList.contains("ingame")) return nav.menu();
  if (!$("#intro").hidden) return Shell.confirmExit();
};
''')
# renderer performance: Sunset / Night / Bright filtered every sprite on every draw (1-2 fps on a slow phone).
# Now the sprite sheet is filtered once per look and drawn plainly.
once('if (sprImg) sprImg.src = SPR.src;', '''if (sprImg) sprImg.src = SPR.src;
  let sprLook = null, sprCanvas = null;
  function sprSource() {   // the sprite sheet with the current look's colour filter baked in, made once per look
    if (!LOOK.imgFilter || !sprImg.complete || !sprImg.naturalWidth) return sprImg;
    if (sprLook === lookName && sprCanvas) return sprCanvas;
    const c = document.createElement("canvas"); c.width = sprImg.naturalWidth; c.height = sprImg.naturalHeight;
    const x = c.getContext("2d"); x.filter = LOOK.imgFilter; x.drawImage(sprImg, 0, 0); sprCanvas = c; sprLook = lookName; return c;
  }''')
once('if (o.top) { imgOn(); ctx.drawImage(sprImg, o.r[0], o.r[1], o.r[2], o.r[3], o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); imgOff(); return; }',
     'if (o.top) { ctx.drawImage(sprSource(), o.r[0], o.r[1], o.r[2], o.r[3], o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); return; }')
once('imgOn(); ctx.drawImage(sprImg, o.r[0], o.r[1], o.r[2], o.r[3], o.x - o.w / 2, o.y - o.h, o.w, o.h); imgOff();',
     'ctx.drawImage(sprSource(), o.r[0], o.r[1], o.r[2], o.r[3], o.x - o.w / 2, o.y - o.h, o.w, o.h);')

# ===================== Phase 3: load the taxi, who goes first, pass the phone =====================
section("setup", """<section id="setup" class="screen shs su" hidden>
    <header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">Load the taxi</h1><span class="sp"></span></header>
    <div class="su__body">
      <section class="shs__card">
        <div class="su__head"><h2>Drivers</h2><div class="rp-stepper"><button class="rp-iconbtn" id="setupFewer" data-su="count" data-d="-1" aria-label="Fewer drivers"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button><output id="setupCount" aria-live="polite">4</output><button class="rp-iconbtn" id="setupMore" data-su="count" data-d="1" aria-label="More drivers"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button></div></div>
        <p class="su__hint">Sit in this order around the table. The driver on your left does your front-seat maths.</p>
        <div id="setupSame"></div><div id="setupDrivers"></div>
      </section>
      <section class="shs__card">
        <h2>Game</h2><div id="setupMode" class="su__modes"></div><p class="su__sum" id="setupSummary"></p>
        <div id="setupCustom" hidden></div>
        <div class="shs__row shs__stack" id="setupTargetRow"><span>Play to</span><div class="rp-seg" id="setupTarget"></div></div>
        <div class="shs__row shs__stack" id="setupLevelRow"><span>Maths time</span><div class="rp-seg" id="setupLevel"></div></div>
        <div class="shs__row"><span>Hand-sign hints</span><label class="rp-toggle" aria-label="Hand-sign hints"><input type="checkbox" id="hintsT"><span class="rp-toggle__track"></span></label></div>
      </section>
    </div>
    <footer class="su__go"><span class="su__foot"><span id="setupFoot"></span><br><span class="su__why" id="setupWhy" aria-live="polite"></span></span><button class="rp-btn" data-a="start" id="setupStart">Start the engines</button></footer>
  </section>""")
block('function renderCustom() {', '\n}\n', '')
block('function renderSetup() {', '\n}\n', '')
block('case "start": {', 'chosenRules()); }', 'case "start": return Setup.start();')
once('function startGame(names, rules) {\n  G = Engine.create(names, 0, (Date.now() ^ (Math.random() * 1e9)) >>> 0, rules);',
     'function startGame(names, rules, crew) {\n  G = Engine.create(names, 0, (Date.now() ^ (Math.random() * 1e9)) >>> 0, rules); applyCrew(G, crew);')
block('function showTurnStart() {', '\n}\n', """function showTurnStart() {
  const p = Engine.cur(G);
  R3.syncTaxis(G.players, G.turn); R3.extras.highlightRank = -1; R3.focusTaxi(G.turn);
  if (prefs.handoff !== "banner") { hidePanel(); return Handoff.show(G.turn); }
  banner(`${p.name.toUpperCase()}, YOU'RE DRIVING!`, `Round ${G.round}`); Garage.hoot(p.name, SLDS.PLAYERS[identOf(p, G.turn) - 1]); Shell.buzz([30, 60, 30]); R3.idleStart(G.turn);
  panel(`<div class="eyebrow">Round ${G.round}</div><h2><span class="dot" style="background:${p.color}"></span>${esc(p.name)}, you're driving</h2>
    <p class="muted">Seats ${Engine.seatsUsed(p)}/${Engine.rules(G).seats} · ${esc(nextDest(p))}</p>
    <button class="btn primary" data-a="begin">Call a passenger</button>`);
}
""")
once('const panel = (html, cls = "") => { const p = $("#panel");', 'const panel = (html, cls = "") => { if (G) Seat.face(G.turn); const p = $("#panel");')
once('panel(fareHTML(d, ps, nb.name, caught), "wide");', 'panel(fareHTML(d, ps, nb.name, caught), "wide"); Seat.face(Engine.neighbourIdx(G));')
once('hoot() { for (const t0 of [0, 0.42]) { tone(370, 0.34, "sawtooth", 0.16, t0); tone(466, 0.34, "sawtooth", 0.11, t0); } },',
     'hoot() { for (const t0 of [0, 0.42]) { tone(370, 0.34, "sawtooth", 0.16, t0); tone(466, 0.34, "sawtooth", 0.11, t0); } },\n    hootP(m = 1) { for (const t0 of [0, 0.3]) { tone(370 * m, 0.24, "sawtooth", 0.15, t0); tone(466 * m, 0.24, "sawtooth", 0.1, t0); } },')
once('case "restore": return ENT.restore().then(() => { toast(', 'case "restore": return ENT.restore().then(() => { Shell.say(')
once('keepAwake: true, firstRunDone: false', 'keepAwake: true, firstRunDone: false, handoff: "card", tableMode: false, idents: null, far: null, lastCrew: null, nameIdent: {}')


# ===================== Phase 4: board and HUD =====================
once("""  <header id="hud">
    <span class="brand"><img data-logo="sm" class="brand-logo" alt="Sho't Left!"><small>Mash Made</small></span>
    <div id="hudInfo"></div><span class="sp"></span>
    <button class="iconbtn" data-a="overview" aria-label="Show the whole board">Board</button>
    <button class="iconbtn" data-a="camreset" aria-label="Reset camera">Reset view</button>
    <button class="iconbtn" data-a="menu" aria-label="Open menu">Menu</button>
  </header>""", """  <header id="hud">
    <span class="brand"><img data-logo="sm" class="brand-logo" alt="Sho't Left!"></span>
    <div id="hudInfo"></div><span class="sp"></span>
    <div class="ig-hudbtns">
      <button class="rp-iconbtn" data-a="log" aria-label="What happened? The last moves"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="4" cy="6" r="1.6" fill="currentColor"/><circle cx="4" cy="12" r="1.6" fill="currentColor"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/></svg></button>
      <button class="rp-iconbtn" data-a="overview" aria-label="Show the whole board"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg></button>
      <button class="rp-iconbtn" data-a="camreset" aria-label="Back to the driver's taxi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      <button class="rp-iconbtn" data-a="menu" aria-label="Pause"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg></button>
    </div>
  </header>""")
# player chips: colour + pattern + icon badge; tap for that driver's details
once('`<div class="pcard" data-pi="${i}"><span class="sw"></span>', '`<div class="pcard" data-pi="${i}" data-a="pinfo" data-i="${i}" role="button" aria-label="${esc(p.name)}: details">${SLDS.badge(SLDS.PLAYERS[identOf(p, i) - 1], 40)}')
block('function showRace() {', '\n}\n', '')
once('p.classList.remove("enter"); void p.offsetWidth; p.classList.add("enter"); insets(); };', 'p.classList.remove("enter"); void p.offsetWidth; p.classList.add("enter"); insets(); fitPanel(); };')
# the player strip stops at the panel's left edge on short landscape screens (the panel runs to the bottom there)
once('const right = !p.hidden && land ? p.getBoundingClientRect().width + 16 : 0;', 'const right = !p.hidden && land ? p.getBoundingClientRect().width + 16 : 0;\n  pl.style.right = right && innerHeight <= 500 ? `${right}px` : "";')

# the dice go into the turn log, so nobody can say they were rigged
once('case "move": {\n        R3.extras.highlightRank = -1; hidePanel();', 'case "move": {\n        G.log.push(`${G.players[ev.pi].name} rolled a ${ev.face} in ${ev.gear} gear: ${ev.n} space${ev.n === 1 ? "" : "s"}${ev.cop ? " · roadblock!" : ""}`);\n        R3.extras.highlightRank = -1; hidePanel(); BoardTips.hide();')
once('case "hoot": Sound.fx.hoot();', 'case "pinfo": return PlayerInfo.show(i);\n    case "log": return TurnLog.show();\n    case "hoot": Sound.fx.hoot();')
once('overview, focus, focusTaxi, focusRank, resetUser, skip, wait, tween, extras, rankPoint:', 'spaceScreen(i) { const q = offsetPt(spaceS(i), 0), p = proj(V(q.x, q.y, 0.05)); return p ? { x: p[0], y: p[1] } : null; },\n    overview, focus, focusTaxi, focusRank, resetUser, skip, wait, tween, extras, rankPoint:')

# ===================== Phase 5: game feel =====================
once('<div id="game">', f'<style id="sl-juice">\n{read("src/juice.css")}\n</style>\n<div id="game">')
# sound: the same API, plus new effects, a voice bus, ducking, layered amapiano music and drop-in audio files
block('const Sound = (() => {', '\n})();\n', read("src/sound.js").strip() + "\n")
# the renderer: each space on the path gets a callback as the taxi crosses it (hop, dust, blip, tick)
block('  async function drive(players, pi, path, gear, follow = true) {', '\n  }\n', read("src/r3-drive.js"))
once('spaceScreen(i) { const q', 'taxiScreen(i) { const t = taxis[i]; if (!t) return null; const p = proj(V(t.x, t.y, 0.4)); return p ? { x: p[0], y: p[1] } : null; },\n    spaceScreen(i) { const q')
# money: the chip waits for the coins, then counts up green or down red
once('async function present(events) {\n  renderHud(); renderPlayers(); save();', 'async function present(events) {\n  Juice.holdFor(events); renderHud(); renderPlayers(); save();')
once('const target = G.players[i].money, from = shown[i];', 'if (Juice.held(i)) return;\n  const target = G.players[i].money, from = shown[i];')
block('case "money": if (ev.amount) { toast(', 'await sleep(260); } break;', 'case "money": if (ev.amount) { await Juice.money(ev); await sleep(160); } break;')
once('animateMoney(i);\n  });\n}', 'animateMoney(i);\n  });\n  Juice.check();\n}')
# passengers board with a seat pop (and sometimes a "Sho't left!")
once('Sound.fx.coin(); toast(`${ev.passenger.name} boards`, "", ev.pi); renderPlayers(); break; }', 'toast(`${ev.passenger.name} boards`, "", ev.pi); renderPlayers(); Juice.board(ev.pi); break; }')
# the fuzzy dice replace the speedometer; the drive hops, puffs and overtakes
once('await revealSpeed(ev); hidePanel();', 'await Juice.dice(ev); hidePanel();')
block('async function revealSpeed(ev) {', '\n}\n', '')
once('await R3.drive(G.players, ev.pi, ev.path, ev.gear);', 'await R3.drive(G.players, ev.pi, ev.path, ev.gear, true, Juice.drive(ev));')
# maths, sneaky passengers, potholes
once('  ev.right ? Sound.fx.right() : Sound.fx.wrong();\n}', '  ev.right ? Sound.fx.right() : Sound.fx.wrong(); Juice.answer(ev.right);\n}')
once('if (caught) Sound.fx.right();', 'if (caught) { Sound.fx.right(); Juice.caught(true); }')
once('got away without paying!`, "bad"); Sound.fx.lose();', 'got away without paying!`, "bad"); Sound.fx.lose(); Juice.caught(false);')
once('if (ev.fx === "pothole") { Sound.fx.bump(); await R3.bump(G.turn); }', 'if (ev.fx === "pothole") { Sound.fx.bump(); Juice.bump(); await R3.bump(G.turn); }')
# road cards: decorate (tone, icons, card back) and reveal (flip, sting, flash, haptic)
once('  if (card.id === "frontseat" || card.ui === "mq") startTimer(qTime(), () => act.frontseat(-1));', '  Juice.decorate(card);\n  if (card.id === "frontseat" || card.ui === "mq") startTimer(qTime(), () => act.frontseat(-1));')
once('showRoad(ev.card, ev.police); return; }', 'showRoad(ev.card, ev.police); Juice.reveal(ev.card); return; }')
# turns, the home stretch, the win, music in game
once('case "next": R3.police(null, false);', 'case "next": Juice.turnDone(); R3.police(null, false);')
once('R3.extras.highlightRank = SL.rankAt(ahead[ahead.length - 1]); Sound.fx.win();', 'R3.extras.highlightRank = SL.rankAt(ahead[ahead.length - 1]); Juice.win();')
once('Sound.music(false); showTurnStart();', 'Sound.music("game"); showTurnStart();')
once('applyCrew(G, crew);', 'applyCrew(G, crew); Juice.reset();')
once('Shell.onScreen(id); }', 'Shell.onScreen(id); try { Juice.check(); } catch {} }')

# ===================== Phase 6: results and learning =====================
once('<div id="game">', f'<style id="sl-results">\n{read("src/results.css")}\n{read("src/learn.css")}\n</style>\n<div id="game">')
section("win", '<section id="win" class="screen rs" hidden aria-label="Results"><div id="winBody"></div></section>')
section("help", '<section id="help" class="screen shs ht" hidden><header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">How to Play</h1></header><div id="helpBody"></div></section>')
once('<section id="settings" class="screen shs" hidden>', '<section id="hof" class="screen shs" hidden><header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">Hall of Fame</h1></header><div class="hof__body" id="hofBody"></div></section>\n  <section id="tutorial" class="screen tu" hidden aria-label="How to Play: the lesson"></section>\n  <section id="settings" class="screen shs" hidden>')
once('if (!$("#settings").hidden || !$("#help").hidden', 'if (Tutorial.open) return Tutorial.exit();\n  if (!$("#hof").hidden || !$("#settings").hidden || !$("#help").hidden')
# the podium, awards and Hall of Fame take over from the old results list
block('  const ranked = G.players.map((p, i) => ({ ...p, i })).sort(', 'clearTransient(); screen("win");', '  prefs.played = true; savePrefs();\n  Results.show(pi);')
once('  for (const ev of events) {\n    switch (ev.type) {', '  for (const ev of events) {\n    Results.track(ev);\n    switch (ev.type) {')
once('case "pinfo": return PlayerInfo.show(i);', 'case "hof": return nav.go("hof");\n    case "pinfo": return PlayerInfo.show(i);')

# ===================== Phase 7: Garage and Full Tank =====================
once('<div id="game">', f'<style id="sl-store">\n{read("src/store.css")}\n</style>\n<div id="game">')
# no owner edition and no test unlock in any build: Full Tank only unlocks through a purchase
once('var SL_OWNER = true;', 'var SL_OWNER = false;')
once('if (c && c.source === "dev" && c.state === "verified") this.state = "verified", this.source = "dev";', 'if (c && c.source === "dev") { /* old test unlocks are not honoured */ }')
block('    setDevUnlock(on) {', '\n', '    setDevUnlock() {},\n')
# a purchase only shows "pending" when the store says so; cancels and errors are told apart
once('      this._set("pending", "store", "Waiting for Google Play…");\n', '')
once('this._set("not_purchased", null, ""); return { ok: false, why: (r && r.why) || "Purchase cancelled." };', 'if (this.source !== "store" || this.state !== "verified") this._set(this.state === "pending" ? "pending" : "not_purchased", this.state === "pending" ? "store" : null, ""); return { ok: false, why: (r && r.why) || "", cancelled: !!(r && r.cancelled), error: !!(r && r.error) };')
once('() => { this._set("not_purchased", null); return { ok: false, why: "The purchase didn\'t go through." }; });', '() => ({ ok: false, why: "", error: true }));')
# the billing bridge must exist before the entitlement loads
once('const FT = SL_FT, ENT = FT.Entitlement;', 'PREVIEW_FLAG' + read("src/billing.js") + '\nconst FT = SL_FT, ENT = FT.Entitlement;')
section("shop", '<section id="shop" class="screen st" hidden aria-label="Full Tank Edition"><button class="rp-iconbtn st__close" data-a="back" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg></button><div class="st__hero" id="stHero" aria-hidden="true"></div><div class="st__body" id="stBody" aria-live="polite"></div></section>')
once('<section id="hof" class="screen shs" hidden>', '<section id="garage" class="screen shs" hidden><header class="shs__bar"><button class="rp-iconbtn" data-a="back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 class="t-display-l">Garage</h1></header><div class="ga" id="garageBody"></div></section>\n  <section id="hof" class="screen shs" hidden>')
block('function renderShop() {', '\n}\n', 'function renderShop() { Store.render(true); }\n')
once('if (m.premium && !ENT.owned()) return nav.go("shop");', 'if (m.premium && !ENT.owned()) return Store.sheet("mode");')
once('if (Tutorial.open) return Tutorial.exit();', 'if (Store.sheetOpen) return Store.closeSheet();\n  if (Tutorial.open) return Tutorial.exit();')
once('if (!$("#hof").hidden ||', 'if (!$("#garage").hidden || !$("#hof").hidden ||')
once('case "hof": return nav.go("hof");', 'case "hof": return nav.go("hof");\n    case "garage": return nav.go("garage");')

# ===================== Phase 8: polish =====================
once('<div id="game">', f'<style id="sl-polish">\n{read("src/polish.css")}\n</style>\n<div id="game">')

# wording: "1 fare", not "1 fares"; the gogo quirk always goes to a gogo (it used to land on any name, e.g. "Sbu")
once('const show = v => (g.unit === "R" ? R$(v) : g.unit === "name" ? v : `${v} ${g.unit}`);', 'const show = v => (g.unit === "R" ? R$(v) : g.unit === "name" ? v : `${v} ${v === 1 ? g.unit.replace(/s$/, "") : g.unit}`);')
once('if (q.id === "pastor") name = "Pastor Khumalo";', 'if (q.id === "pastor") name = "Pastor Khumalo";\n    if (q.id === "gogo") name = "Gogo Zodwa";')

# modules: strings, design-system helpers + Style Guide, shell; then boot through the shell
once('// boot\nR3.init(', read("src/strings.js") + "\n" + read("src/styleguide.js") + "\n" + read("src/shell.js") + "\n" + read("src/setup.js") + "\n" + read("src/ingame.js") + "\n" + read("src/juice.js") + "\n" + read("src/results.js") + "\n" + read("src/learn.js") + "\n" + read("src/garage.js") + "\n" + read("src/store.js") + '\n// boot\nR3.init(')
once('renderIntro(); screen("splash"); orient();', 'Shell.boot(); orient();\nif (location.hash === "#styleguide") StyleGuide.open("intro");')

out = ROOT / "dist"; out.mkdir(exist_ok=True)
assert src.count("PREVIEW_FLAG") == 1
(out / "index.html").write_text(src.replace("PREVIEW_FLAG", "window.SL_PREVIEW_STORE = true;   // artifact preview only: a labelled test store\n"))
storeb = src.replace("PREVIEW_FLAG", "")
assert "SL_PREVIEW_STORE = true" not in storeb and "var SL_OWNER = false;" in storeb
(out / "store").mkdir(exist_ok=True); (out / "store" / "index.html").write_text(storeb)
www = ROOT / "android-app" / "www"; www.mkdir(parents=True, exist_ok=True); (www / "index.html").write_text(storeb)
print("built", out / "index.html", f"{len(src.encode()) / 1024:.0f} KB", "v" + VERSION)
