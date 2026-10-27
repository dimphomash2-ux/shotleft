// =====================================================================
// SHO'T LEFT! — DESIGN SYSTEM HELPERS + STYLE GUIDE SCREEN (Phase 1)
// SLDS: tokens and small builders that later phases reuse (player badges, icons, contrast).
// StyleGuide: a hidden screen that shows every token and component. Opened by tapping the
// version number 7 times in About (or #styleguide in the address, for previews).
// =====================================================================
const SLDS = (() => {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const lum = hex => { const c = hex.replace("#", "").match(/../g).map(h => parseInt(h, 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  // the 7 player identities: colour + pattern + icon (never colour alone)
  const PLAYERS = [
    { n: 1, name: "Orange", hex: "#E69F00", pattern: "stripes", icon: "star" },
    { n: 2, name: "Sky blue", hex: "#56B4E9", pattern: "dots", icon: "circle" },
    { n: 3, name: "Bluish green", hex: "#009E73", pattern: "chevrons", icon: "triangle" },
    { n: 4, name: "Yellow", hex: "#F0E442", pattern: "zigzag", icon: "bolt" },
    { n: 5, name: "Blue", hex: "#0072B2", pattern: "checks", icon: "square" },
    { n: 6, name: "Vermillion", hex: "#D55E00", pattern: "waves", icon: "heart" },
    { n: 7, name: "Reddish purple", hex: "#CC79A7", pattern: "diamonds", icon: "diamond" },
  ];
  const ICON = {
    star: '<path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    triangle: '<path d="M12 3l9.5 17h-19z"/>',
    bolt: '<path d="M13.5 2L4.5 13.5H11L9.5 22l10-12.5H13z"/>',
    square: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/>',
    heart: '<path d="M12 21s-7.6-4.6-9.6-9.2C1 8.3 3.2 4.4 7 4.4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.8 0 6 3.9 4.6 7.4C19.6 16.4 12 21 12 21z"/>',
    diamond: '<path d="M12 2l9 10-9 10-9-10z"/>',
    pump: '<rect x="4" y="3" width="10" height="17" rx="1.6"/><rect x="6.2" y="5.2" width="5.6" height="4.6" rx=".6" fill="var(--hole,#fff)"/><path d="M14 8.5h2.2a1.6 1.6 0 0 1 1.6 1.6v6.4a1.6 1.6 0 0 0 3.2 0V7.4L18.4 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="2.5" y="19" width="13" height="2.6" rx="1"/>',
    coin: '<circle cx="12" cy="12" r="9"/><text x="12" y="16.2" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="11" fill="var(--hole,#fff)">R</text>',
    seat: '<path d="M7 3h7a2 2 0 0 1 2 2v7h1.5a2 2 0 0 1 2 2v3H6.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><rect x="6" y="18" width="2.4" height="4" rx="1"/><rect x="16" y="18" width="2.4" height="4" rx="1"/>',
    back: '<path d="M10 5l-7 7 7 7M3.5 12H21" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    minus: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    plus: '<path d="M5 12h14M12 5v14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    arrowBack: '<path d="M20 12H6m5-6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const icon = (k, extra = "") => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ${extra}>${ICON[k] || ""}</svg>`;
  // pattern overlay: dark ink on light colours, light ink on dark ones, so it shows on every swatch
  const ink = hex => (lum(hex) > 0.3 ? "rgba(27,28,34,.38)" : "rgba(255,255,255,.62)");
  const PAT = {
    stripes: c => `<path d="M-2 14 L14 -2 M6 18 L18 6" stroke="${c}" stroke-width="3.2"/>`,
    dots: c => `<circle cx="4" cy="4" r="2.2" fill="${c}"/><circle cx="12" cy="12" r="2.2" fill="${c}"/>`,
    chevrons: c => `<path d="M0 6 L8 2 L16 6 M0 14 L8 10 L16 14" fill="none" stroke="${c}" stroke-width="2.4"/>`,
    zigzag: c => `<path d="M0 10 L4 5 L8 10 L12 5 L16 10" fill="none" stroke="${c}" stroke-width="2.6"/>`,
    checks: c => `<rect x="0" y="0" width="8" height="8" fill="${c}"/><rect x="8" y="8" width="8" height="8" fill="${c}"/>`,
    waves: c => `<path d="M0 8 Q4 3 8 8 T16 8" fill="none" stroke="${c}" stroke-width="2.6"/>`,
    diamonds: c => `<path d="M8 1 L15 8 L8 15 L1 8 Z" fill="${c}"/>`,
  };
  let uid = 0;
  // a square badge: colour + pattern, with the player's icon in a white disc
  function badge(p, size = 40) {
    const id = "slp" + ++uid;
    return `<svg class="rp-chip__badge" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">${PAT[p.pattern](ink(p.hex))}</pattern></defs>
      <rect width="40" height="40" fill="${p.hex}"/><rect width="40" height="40" fill="url(#${id})"/><circle cx="20" cy="20" r="11.5" fill="#fff" stroke="#1B1C22" stroke-width="2"/>
      <g transform="translate(12.5 12.5) scale(.625)" fill="#1B1C22">${ICON[p.icon]}</g></svg>`;
  }
  const tick = () => { if (typeof Shell !== "undefined") Shell.buzz(8); };
  const pattern = (p, id, scale = 1) => `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="scale(${scale})">${PAT[p.pattern](ink(p.hex))}</pattern>`;
  const nextId = () => "slp" + ++uid;
  // side view of the player's minibus: their colour + pattern on the stripe (always: it's how players tell taxis apart),
  // their icon on the door. An optional Garage look changes the paint, extra stripe, rims, roof and sticker.
  const PAINT = { white: "#F8F5EE", cream: "#F3E3BF", silver: "#C9CDD2", sky: "#BFE0F5", mint: "#BDE8D0", sunset: "#FFC9A3", jacaranda: "#D8CCF5", midnight: "#3A3F55" };
  const RIM = { steel: "#C9CDD2", chrome: "#EEF3F7", gold: "#FFB300", black: "#3A3B40", match: null };
  function taxi(p, w = 72, look) {
    const id = nextId(), L = look || {}, body = PAINT[L.paint] || PAINT.white, dark = L.paint === "midnight";
    const rim = L.rims === "match" ? p.hex : RIM[L.rims] || RIM.steel, win = dark ? "#8FC6EA" : "#2C4B63";
    const stripe = {
      pin: `<rect x="6" y="20" width="62" height="1.6" fill="#1B1C22"/><rect x="6" y="33.4" width="60" height="1.2" fill="#1B1C22"/>`,
      racing: `<path d="M12 8.5h36l2 3.5H12z" fill="#1B1C22"/><rect x="6" y="20" width="62" height="2" fill="${p.hex}"/>`,
      flames: `<path d="M68 23c-5 0-6-3-10-3 2 2 0 3-3 3-3-2-6-2-9 0h22z" fill="#D0342A" stroke="#1B1C22" stroke-width=".8"/><path d="M66 23c-3 0-4-1.6-6-1.6 1 1 0 1.6-2 1.6z" fill="#FFB300"/>`,
      checks: `<g fill="#1B1C22">${Array.from({ length: 15 }, (_, k) => `<rect x="${7 + k * 4}" y="${k % 2 ? 20 : 21.4}" width="2" height="1.4"/>`).join("")}</g>`,
    }[L.stripe] || "";
    const roof = {
      rack: `<rect x="14" y="4.5" width="30" height="2" rx="1" fill="#1B1C22"/><rect x="18" y="0" width="10" height="5" rx="1" fill="#B07A00" stroke="#1B1C22" stroke-width="1.2"/><rect x="29" y="1.2" width="9" height="3.8" rx="1" fill="#7B5BD6" stroke="#1B1C22" stroke-width="1.2"/>`,
      lights: `<rect x="18" y="5" width="22" height="3.5" rx="1.5" fill="#1B1C22"/><circle cx="22" cy="4.5" r="2.4" fill="#FFB300" stroke="#1B1C22" stroke-width="1"/><circle cx="29" cy="4.5" r="2.4" fill="#FFB300" stroke="#1B1C22" stroke-width="1"/><circle cx="36" cy="4.5" r="2.4" fill="#FFB300" stroke="#1B1C22" stroke-width="1"/>`,
      sign: `<rect x="16" y="1.5" width="26" height="7" rx="1.5" fill="#FFB300" stroke="#1B1C22" stroke-width="1.6"/><text x="29" y="7" text-anchor="middle" font-family="Bungee,sans-serif" font-size="4.4" fill="#1B1C22">SHO'T LEFT</text>`,
      spoiler: `<path d="M8 8.5l-3-3h10l-1 3z" fill="${p.hex}" stroke="#1B1C22" stroke-width="1.4" stroke-linejoin="round"/>`,
    }[L.roof];
    const sticker = {
      star: `<path d="M27 16l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#FFB300" stroke="#1B1C22" stroke-width=".7" transform="translate(-14 -4) scale(1)"/>`,
      heart: `<path d="M16 15.5c-1-1.6-3.5-1-3.2 1 .3 1.5 3.2 3.2 3.2 3.2s2.9-1.7 3.2-3.2c.3-2-2.2-2.6-3.2-1z" fill="#D0342A" stroke="#1B1C22" stroke-width=".7"/>`,
      sharp: `<rect x="11.5" y="14" width="11" height="4.4" rx="1" fill="#FFB300" stroke="#1B1C22" stroke-width=".7"/><text x="17" y="17.4" text-anchor="middle" font-family="Bungee,sans-serif" font-size="3" fill="#1B1C22">SHARP</text>`,
      flower: `<g transform="translate(16 16)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-2" rx="1.3" ry="2" fill="#9B7BE6" stroke="#1B1C22" stroke-width=".5" transform="rotate(${a})"/>`).join("")}<circle r="1" fill="#FFB300"/></g>`,
    }[L.sticker] || "";
    return `<svg viewBox="0 -2 72 46" width="${w}" height="${Math.round(w * 46 / 72)}" aria-hidden="true"><defs>${pattern(p, id, 0.55)}</defs>
      <path d="M6 33V14q0-6 6-6h38q5 0 8 4l8 10q2 2 2 5v6z" fill="${body}"/>${stripe}
      <rect x="6" y="23" width="62" height="9" fill="${p.hex}"/><rect x="6" y="23" width="62" height="9" fill="url(#${id})"/>
      <rect x="11" y="12" width="10" height="8" rx="1.5" fill="${win}"/><rect x="24" y="12" width="10" height="8" rx="1.5" fill="${win}"/><rect x="37" y="12" width="9" height="8" rx="1.5" fill="${win}"/>
      <path d="M50 12h4l7 9H50z" fill="${win}"/><rect x="64.5" y="24" width="3" height="3" rx=".5" fill="#FFF6C9" stroke="#1B1C22" stroke-width="1"/>${sticker}
      <path d="M6 33V14q0-6 6-6h38q5 0 8 4l8 10q2 2 2 5v6z" fill="none" stroke="#1B1C22" stroke-width="2.5" stroke-linejoin="round"/>
      ${roof !== undefined ? roof : `<rect x="18" y="3.5" width="22" height="5" rx="1.5" fill="${p.hex}" stroke="#1B1C22" stroke-width="2"/>`}
      <circle cx="40" cy="27.5" r="6" fill="#fff" stroke="#1B1C22" stroke-width="1.8"/><g transform="translate(36 23.5) scale(.333)" fill="#1B1C22">${ICON[p.icon]}</g>
      <circle cx="18" cy="34" r="6.2" fill="#26272B" stroke="#1B1C22" stroke-width="2"/><circle cx="18" cy="34" r="2.6" fill="${rim}" stroke="#1B1C22" stroke-width=".6"/>
      <circle cx="56" cy="34" r="6.2" fill="#26272B" stroke="#1B1C22" stroke-width="2"/><circle cx="56" cy="34" r="2.6" fill="${rim}" stroke="#1B1C22" stroke-width=".6"/></svg>`;
  }
  // a fuzzy die (the kind that hangs from the rear-view mirror) in the player's colour
  const PIPS = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
  const FUZZ = (() => { const pts = []; for (let k = 0; k < 64; k++) { const t = k / 64 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), r = 27 + 1.7 * Math.sin(k * 2.5);
    pts.push(`${(32 + r * Math.sign(c) * Math.pow(Math.abs(c), 0.42)).toFixed(1)},${(32 + r * Math.sign(s) * Math.pow(Math.abs(s), 0.42)).toFixed(1)}`); } return pts.join(" "); })();
  function die(p, face, size = 64) {
    const pip = lum(p.hex) > 0.3 ? "#1B1C22" : "#FFFFFF";
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><polygon points="${FUZZ}" fill="${p.hex}" stroke="#1B1C22" stroke-width="2.5" stroke-linejoin="round"/>
      ${(PIPS[face] || []).map(([x, y]) => `<circle cx="${12 + x * 10}" cy="${12 + y * 10}" r="4.6" fill="${pip}" stroke="#1B1C22" stroke-width="1.2"/>`).join("")}</svg>`;
  }
  return { css, lum, contrast, PLAYERS, ICON, icon, badge, tick, pattern, nextId, taxi, die, ink, PAINT, RIM };
})();

const StyleGuide = (() => {
  let built = false, from = "about", toastT = null;
  const el = () => document.getElementById("styleguide");
  const TOKENS = [
    ["asphalt-900", "#1B1C22", "Main text, outlines, dark backgrounds", "#FFFFFF"],
    ["asphalt-700", "#2E3039", "Dark surfaces and sheets", "#FFFFFF"],
    ["taxi-white", "#F8F5EE", "Light surfaces and cards", "#1B1C22"],
    ["kerb-grey", "#D9D4C7", "Dividers, disabled fills", "#1B1C22"],
    ["robot-amber", "#FFB300", "Primary buttons, money (dark text)", "#1B1C22"],
    ["robot-red", "#D0342A", "Danger, bad events (white text)", "#FFFFFF"],
    ["robot-green", "#1E9E57", "Success, good events (dark text)", "#1B1C22"],
    ["jacaranda", "#7B5BD6", "Signature accent, Full Tank (white text)", "#FFFFFF"],
    ["sky", "#1A6AAE", "Info and links (white text)", "#FFFFFF"],
  ];
  const TYPE = [
    ["display-xl", "48/52 Bungee", "t-display-xl", "Thabo wins!"],
    ["display-l", "34/40 Bungee", "t-display-l", "Load the taxi"],
    ["display-m", "24/30 Bungee", "t-display-m", "Police roadblock!"],
    ["button", "20/24 Bungee", "t-button", "Siyaya!"],
    ["title", "20/26 Nunito 800", "t-title", "Leaving the rank?"],
    ["body-l", "18/26 Nunito 700", "t-body-l", "Your newest passenger pays half."],
    ["body", "16/24 Nunito 600", "t-body", "Two players can't share a colour."],
    ["label", "14/18 Nunito 800", "t-label", "Restore purchase"],
    ["caption", "12/16 Nunito 700", "t-caption", "One-time purchase through Google Play."],
  ];
  const MOTION = [
    ["press", "--sl-t-press", "--sl-ease-out", "90 ms"], ["quick", "--sl-t-quick", "--sl-ease-out", "150 ms"],
    ["standard", "--sl-t-standard", "--sl-ease-standard", "250 ms"], ["hop", "--sl-t-hop", "--sl-ease-inout", "180 ms / space"],
    ["big", "--sl-t-big", "--sl-ease-spring", "300–400 ms"], ["celebrate", "--sl-t-celebrate", "--sl-ease-spring", "800–1,200 ms"],
  ];
  const sec = (title, sub, body, wide) => `<section class="sg__sec${wide ? " sg__sec--wide" : ""}"><h2 class="sg__h">${title}${sub ? `<small>${sub}</small>` : ""}</h2>${body}</section>`;

  function chip(p, name, money, seats, active) {
    return `<div class="rp-chip${active ? " is-active" : ""}" style="--pc:${p.hex}">${SLDS.badge(p)}
      <div style="min-width:0"><div class="rp-chip__name">${name}</div><div class="rp-chip__sub">${seats}/15 seats · Next: Town</div></div>
      <div class="rp-chip__money t-num" data-money="${money}">R${money}</div><div class="rp-chip__seats"><i style="width:${seats / 15 * 100}%"></i></div></div>`;
  }
  function gauge() {
    return `<svg class="rp-gauge" viewBox="0 0 180 110" aria-label="Fuel gauge"><path d="M18 90 A72 72 0 0 1 162 90" fill="none" stroke="#1B1C22" stroke-width="16" stroke-linecap="round"/>
      <path d="M18 90 A72 72 0 0 1 162 90" fill="none" stroke="url(#sgG)" stroke-width="10" stroke-linecap="round"/>
      <defs><linearGradient id="sgG" x1="0" x2="1"><stop offset="0" stop-color="#D0342A"/><stop offset=".5" stop-color="#FFB300"/><stop offset="1" stop-color="#1E9E57"/></linearGradient></defs>
      <text x="22" y="108" font-family="Bungee,sans-serif" font-size="14" fill="#1B1C22">E</text><text x="148" y="108" font-family="Bungee,sans-serif" font-size="14" fill="#1B1C22">F</text>
      <g class="rp-gauge__needle"><path d="M90 90 L87 30 L90 22 L93 30 Z" fill="#1B1C22"/></g><circle cx="90" cy="90" r="9" fill="#F8F5EE" stroke="#1B1C22" stroke-width="3"/></svg>`;
  }
  function build() {
    const P = SLDS.PLAYERS, I = SLDS.icon;
    const swatches = TOKENS.map(([n, hex, use, fg]) => {
      const c = SLDS.contrast(hex, fg), ok = c >= 4.5;
      return `<div class="sg__swatch"><b style="background:${hex};color:${fg}">Aa</b><span>${n} · ${hex}<br><em>${use}</em><br><span class="${ok ? "sg__ok" : "sg__bad"}" style="padding:0">${c.toFixed(1)}:1 ${ok ? "passes" : "large text only"}</span></span></div>`;
    }).join("") + `<div class="sg__swatch"><b style="background:var(--sl-sunset)">Aa</b><span>sunset · #FF6B35 → #FFB300<br><em>Gradient for hero moments only</em></span></div>`;
    const players = P.map(p => `<div class="sg__swatch">${SLDS.badge(p, 56).replace('class="rp-chip__badge"', 'style="display:block;width:100%;height:56px;border-bottom:2px solid #1B1C22" preserveAspectRatio="xMidYMid slice"')}<span>Player ${p.n} · ${p.name}<br><em>${p.hex} · ${p.pattern} · ${p.icon}</em></span></div>`).join("");
    const type = TYPE.map(([k, spec, cls, s]) => `<div><code>${k}<br>${spec}</code><span class="${cls}">${s}</span></div>`).join("");
    const spacing = [4, 8, 12, 16, 24, 32, 48, 64].map(v => `<span><i style="width:${v}px"></i>${v}</span>`).join("");
    const shapes = [["chip", 8], ["button", 14], ["card", 20], ["sheet", 28], ["full", 999]].map(([n, r]) => `<div style="border-radius:${r}px">${n}<br>${r === 999 ? "pill" : r + "dp"}</div>`).join("") +
      `<div style="border-radius:14px;box-shadow:var(--sl-shadow-1)">shadow-1</div><div style="border-radius:14px;box-shadow:var(--sl-shadow-2)">shadow-2</div>`;
    const motion = MOTION.map(([k, t, e, label]) => `<div class="sg__mrow"><span>${k}<br>${label}</span><div class="sg__track" style="--dur:var(${t});--ease:var(${e})"><i></i></div></div>`).join("");
    el().innerHTML = `
      <header class="sg__bar"><img src="${SL_BRAND.sm}" alt="Sho't Left!"><div><div class="t-label" style="color:var(--sl-amber)">STYLE GUIDE</div><div class="t-caption">Rank-side Pop · v${SL_VERSION}</div></div><span class="sp"></span>
        <label class="rp-toggle"><input type="checkbox" data-sg="fast"><span class="rp-toggle__track"></span>Fast Mode</label>
        <label class="rp-toggle"><input type="checkbox" data-sg="reduced" ${prefs.reduced ? "checked" : ""}><span class="rp-toggle__track"></span>Reduce Motion</label>
        <button class="rp-iconbtn" data-sg="close" aria-label="Close style guide">${I("close")}</button></header>
      <div class="sg__main">
        ${sec("Colour", "contrast checked live", `<div class="sg__sw">${swatches}</div>`, true)}
        ${sec("Player colours", "colour + pattern + icon, never colour alone", `<div class="sg__sw">${players}</div><p class="sg__note">Every swatch keeps a 2dp asphalt outline, so even yellow reads on white.</p>`, true)}
        ${sec("Type", "Bungee + Nunito, built into the app", `<div class="sg__type">${type}</div><p class="sg__note">Bungee only for titles, buttons, card names and big numbers; never under 16sp. Nunito digits are equal width: <b class="t-num">R1 111 · R8 888</b></p>`)}
        ${sec("Spacing, shape, depth", "4dp grid", `<div class="sg__space">${spacing}</div><div class="sg__shape">${shapes}</div><p class="sg__note">Margins 16dp, 20dp from 400dp wide. Hard "sticker" shadows, never soft blurs.</p>`)}
        ${sec("Buttons", "one primary per screen · 56dp", `<div class="sg__row">
            <button class="rp-btn" data-sg="press">Siyaya!</button><button class="rp-btn rp-btn--secondary" data-sg="press">Garage</button>
            <button class="rp-btn rp-btn--go" data-sg="press">Rematch</button><button class="rp-btn rp-btn--danger" data-sg="press">End game</button>
            <button class="rp-btn rp-btn--fulltank" data-sg="press">${I("pump", 'style="--hole:var(--sl-jacaranda)"')}Fill up</button>
            <button class="rp-btn" aria-disabled="true" data-sg="disabled" data-why="Two players can't share a colour">Start</button></div>
          <div class="sg__row"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="press">Restore purchase</button><button class="rp-btn rp-btn--sm" data-sg="press">How to Play</button>
            <button class="rp-iconbtn" data-sg="press" aria-label="Back">${I("arrowBack")}</button></div>
          <p class="sg__note">Press: drops 3dp, the lip shrinks, light haptic. Tap the grey button to hear why it's disabled.</p>`)}
        ${sec("Controls", "48dp touch targets", `<div class="sg__row"><div class="rp-stepper"><button class="rp-iconbtn" data-sg="step" data-d="-1" aria-label="Fewer players">${I("minus")}</button><output id="sgStep" aria-live="polite">4</output><button class="rp-iconbtn" data-sg="step" data-d="1" aria-label="More players">${I("plus")}</button></div><span class="t-label">players</span></div>
          <label class="rp-toggle"><input type="checkbox" checked><span class="rp-toggle__track"></span>Keep the screen on during games</label>
          <label class="rp-slider">Music<input type="range" min="0" max="100" value="60" data-sg="slide" style="--v:60%" aria-label="Music volume"></label>
          <div class="rp-seg" role="group" aria-label="Maths level"><button data-sg="seg" aria-pressed="false">Easy</button><button data-sg="seg" aria-pressed="true">Medium</button><button data-sg="seg" aria-pressed="false">Hard</button></div>`)}
        ${sec("Player chips", "the in-game strip", `<div class="sg__strip">${chip(P[0], "Thabo", 240, 9, true)}${chip(P[1], "Lindi", 180, 4)}${chip(P[3], "Sipho", 95, 12)}${chip(P[4], "Naledi", 310, 2)}</div>
          <div class="sg__row"><button class="rp-btn rp-btn--sm" data-sg="money">+R40 fare to Thabo</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="turn">Next driver</button></div>`, true)}
        ${sec("Event cards", "good · bad · Kasi Chaos", `<div class="sg__sw" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
          <div class="rp-card rp-card--good"><div class="rp-card__kicker">Road card</div><div class="rp-card__title">Payday!</div><div class="rp-card__text">Fares are doubled on everyone's next turn.</div><div class="rp-card__fx"><span class="rp-pill rp-pill--plus">${I("coin", 'style="--hole:#CFEFD9"')}×2 fares</span></div></div>
          <div class="rp-card rp-card--bad"><div class="rp-card__kicker">Road card</div><div class="rp-card__title">Police roadblock!</div><div class="rp-card__text">Pay the fine, or try to talk your way out.</div><div class="rp-card__fx"><span class="rp-pill rp-pill--minus">${I("coin", 'style="--hole:#F7D3CF"')}−R50</span></div></div>
          <div class="rp-card rp-card--chaos"><div class="rp-card__kicker">Kasi Chaos <span class="rp-lock">${I("pump", 'style="--hole:var(--sl-jacaranda)"')}Full Tank</span></div><div class="rp-card__title">Last number!</div><div class="rp-card__text">The marshal squeezes one more passenger in.</div><div class="rp-card__fx"><span class="rp-pill rp-pill--plus">${I("seat")}+1 passenger</span></div></div></div>`, true)}
        ${sec("Overlays", "sheet · dialog · toast · tooltip", `<div class="sg__row"><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="sheet">Bottom sheet</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="dialog">Dialog</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="toast">Toast</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="hold">Press and hold me</button></div>`)}
        ${sec("Full Tank", "lock badge · fuel gauge · confetti", `<div class="sg__row"><span class="rp-lock">${I("pump", 'style="--hole:var(--sl-jacaranda)"')}Full Tank</span>${gauge()}</div>
          <div class="sg__row"><button class="rp-btn rp-btn--fulltank" data-sg="fill">${I("pump", 'style="--hole:var(--sl-jacaranda)"')}Fill the tank</button></div>`)}
        ${sec("Motion", "Fast Mode halves every duration", `<div class="sg__motion" id="sgMotion">${motion}</div><div class="sg__row"><button class="rp-btn rp-btn--sm" data-sg="motion">Play all</button></div>
          <p class="sg__note">Transform and opacity only. Reduce Motion swaps movement for fades.</p>`)}
        <section class="sg__sec sg__dev" id="sgDev"></section>
      </div>
      <div class="rp-scrim" id="sgScrim" hidden data-sg="scrim"></div>
      <div class="rp-toast" id="sgToast" role="status"></div><div class="rp-tip" id="sgTip" role="tooltip"></div>`;
    built = true;
  }
  function renderDev() {   // read-only: the store build has no test unlock
    const box = document.getElementById("sgDev");
    box.innerHTML = `<h2 class="sg__h">Full Tank status</h2><p class="sg__note">Now: ${esc(ENT.label())}. Full Tank only unlocks through a Google Play purchase; this build has no test unlock.</p>`;
  }

  function toast(t) { const n = document.getElementById("sgToast"); n.textContent = t; n.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => n.classList.remove("is-on"), 1800); }
  function overlay(kind) {
    const s = document.getElementById("sgScrim");
    s.innerHTML = kind === "sheet"
      ? `<div class="rp-sheet" role="dialog" aria-label="Full Tank"><div class="rp-sheet__grab"></div><div class="sg__row" style="justify-content:space-between"><span class="t-display-m">Full Tank</span><span class="rp-lock">${SLDS.icon("pump", 'style="--hole:var(--sl-jacaranda)"')}Locked</span></div>
          <p class="t-body">More routes, Kasi Chaos cards and the whole Garage. One payment. Yours forever. No ads.</p><div class="sg__row"><button class="rp-btn rp-btn--fulltank" data-sg="close-ov">Fill up – R29</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="close-ov">Maybe later</button></div></div>`
      : `<div class="rp-dialog" role="alertdialog" aria-label="Leaving the rank?"><div class="t-title">Leaving the rank?</div><p class="t-body" style="margin:8px 0 16px">Your game is saved.</p><div class="sg__row"><button class="rp-btn" data-sg="close-ov">Stay</button><button class="rp-btn rp-btn--secondary rp-btn--sm" data-sg="close-ov">Exit</button></div></div>`;
    s.hidden = false; requestAnimationFrame(() => s.classList.add("is-on"));
  }
  function closeOverlay() { const s = document.getElementById("sgScrim"); if (s.hidden) return false; s.classList.remove("is-on"); setTimeout(() => { s.hidden = true; s.innerHTML = ""; }, 260); return true; }
  function confetti() {
    if (prefs.reduced) return toast("Full Tank! Everything's unlocked. Sharp sharp.");
    const cols = SLDS.PLAYERS.map(p => p.hex).concat(["#FFB300", "#7B5BD6"]);
    for (let i = 0; i < 44; i++) {
      const c = document.createElement("i"); c.className = "rp-confetti";
      c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length];
      c.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); c.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      c.style.setProperty("--d", Math.round((1100 + Math.random() * 900) * (document.documentElement.classList.contains("fast") ? 0.5 : 1)) + "ms");
      c.style.animationDelay = Math.random() * 180 + "ms"; document.body.appendChild(c); setTimeout(() => c.remove(), 2600);
    }
    toast("Full Tank! Everything's unlocked. Sharp sharp.");
  }
  function countUp(node, to) {
    const from = +node.dataset.money, t0 = performance.now(), dur = prefs.reduced ? 0 : 600 * (document.documentElement.classList.contains("fast") ? 0.5 : 1);
    node.dataset.money = to;
    const step = t => { const k = dur ? Math.min(1, (t - t0) / dur) : 1; node.textContent = "R" + Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  let holdT = null;
  function wire() {
    const root = el();
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-sg]"); if (!b) return;
      const k = b.dataset.sg;
      if (k === "scrim") { if (e.target === b) closeOverlay(); return; }
      if (k !== "fast" && k !== "reduced" && k !== "slide") Sound.fx.tap();
      switch (k) {
        case "close": return close();
        case "close-ov": return closeOverlay();
        case "fast": return document.documentElement.classList.toggle("fast", b.checked);
        case "reduced": prefs.reduced = b.checked; savePrefs(); R3.setReduced(prefs.reduced); return document.documentElement.classList.toggle("reduced", prefs.reduced);
        case "disabled": return toast(b.dataset.why);
        case "step": { const o = document.getElementById("sgStep"); o.textContent = Math.max(2, Math.min(6, +o.textContent + +b.dataset.d)); return; }
        case "seg": b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); return;
        case "money": { const m = root.querySelector(".rp-chip.is-active .rp-chip__money"); Sound.fx.cash(); return countUp(m, +m.dataset.money + 40); }
        case "turn": { const cs = [...root.querySelectorAll(".sg__strip .rp-chip")], i = cs.findIndex(c => c.classList.contains("is-active")); cs[i].classList.remove("is-active"); cs[(i + 1) % cs.length].classList.add("is-active"); Sound.fx.turn(); return; }
        case "sheet": case "dialog": return overlay(k);
        case "toast": return toast("+R40 fare · Sharp!");
        case "hold": return toast("Hold it a little longer…");
        case "fill": { const g = root.querySelector(".rp-gauge"); g.classList.remove("is-full"); void g.getBoundingClientRect(); g.classList.add("is-full"); Sound.fx.hoot(); return setTimeout(confetti, prefs.reduced ? 0 : 500); }
        case "motion": { const m = document.getElementById("sgMotion"); m.classList.toggle("go"); return; }
      }
    });
    root.addEventListener("input", e => { const t = e.target; if (t.dataset.sg === "slide") t.style.setProperty("--v", t.value + "%"); });
    root.addEventListener("pointerdown", e => {
      const h =e.target.closest('[data-sg="hold"]'); if (!h) return;
      clearTimeout(holdT); holdT = setTimeout(() => { const tip = document.getElementById("sgTip"), r = h.getBoundingClientRect(); tip.textContent = "Long-press any space or card to see what it does."; tip.style.left = Math.max(8, r.left) + "px"; tip.style.top = Math.max(8, r.top - 56) + "px"; tip.classList.add("is-on"); setTimeout(() => tip.classList.remove("is-on"), 2200); }, 450);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(t => root.addEventListener(t, () => clearTimeout(holdT)));
  }
  function open(src = "about") {
    if (!built) { build(); wire(); }
    from = src; renderDev(); R3.pause(); nav.go("styleguide"); el().scrollTop = 0;
  }
  function close() {
    closeOverlay(); document.documentElement.classList.toggle("fast", !!prefs.fast); R3.resume();
    nav.back();
  }
  const isOpen = () => !el().hidden;
  return { open, close, isOpen, closeOverlay };
})();
