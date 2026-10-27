let backTo = "intro";   // kept for older code paths; navigation now uses the history stack below
const hist = [];
const curScreen = () => { const s = [...document.querySelectorAll(".screen")].find(x => !x.hidden); return s ? s.id : "none"; };
const RENDER = { intro: () => renderIntro(), setup: () => renderSetup(), settings: () => renderSettings(), about: () => renderAbout(), menu: () => renderPause(),
  shop: () => Store.render(), garage: () => Garage.render(), help: () => HowTo.open(), hof: () => HallOfFame.render(), tutorial: () => Tutorial.render() };
const nav = {
  go(id) { const c = curScreen(); if (c !== id) hist.push(c); (RENDER[id] || (() => {}))(); screen(id); },
  back() { Sound.fx.back();
    let prev = hist.pop();
    if (prev === "none" || prev === "menu") { if (G) { if (prev === "menu") { renderPause(); return screen("menu"); } return nav.resume(); } prev = null; }
    if (prev === "win" && G && G.phase === "GAME_COMPLETE") return screen("win");
    if (!prev || prev === "win") return nav.toMenu();
    (RENDER[prev] || (() => {}))(); screen(prev);
  },
  toMenu() { hist.length = 0; R3.extras.cheer = false; if (!G) Shell.resetMenuTaxis(); R3.overview(); renderIntro(); screen("intro"); Sound.music(true); },
  continue() { Shell.door(() => Shell.continueGame()); },
  setup() { Shell.door(() => nav.go("setup")); },
  help() { nav.go("help"); },
  about() { nav.go("about"); },
  settings() { nav.go("settings"); },
  shop() { nav.go("shop"); },
  menu() { if (!G) return; Handoff.hide(); stopTimer(); clearTransient(); hist.length = 0; hist.push("none"); renderPause(); screen("menu"); },
  resume() { hist.length = 0; screen("none"); resumePhase(); },
  restart() { if (!G) return; Shell.confirm({ title: STR.restartT, body: STR.restartB, yes: STR.restartYes, no: STR.keepPlaying, danger: true }, () => { const names = G.players.map(p => p.name), rules = G.rules, crew = G.players.map(p => ({ ident: p.ident, far: p.far })); Shell.door(() => startGame(names, rules, crew)); }); },
  quit() { save(); Shell.door(() => { G = null; hidePanel(); $("#players").innerHTML = ""; nav.toMenu(); }); },
  replay() { const names = G.players.map(p => p.name), rules = G.rules, crew = G.players.map(p => ({ ident: p.ident, far: p.far })); Shell.door(() => startGame(names, rules, crew)); },
  mainmenu() { Shell.door(() => { G = null; hidePanel(); $("#players").innerHTML = ""; nav.toMenu(); }); },
  camreset() { R3.resetUser(); if (G) R3.focusTaxi(G.turn); else R3.overview(); },
  overview() { R3.overview(); },
};
