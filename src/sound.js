// =====================================================================
// SHO'T LEFT! — SOUND (Phase 5)
// Everything is synthesised with Web Audio, so the game needs no sound files and works offline.
// Buses: master ← sfx, voice, music (through a duck gain that dips under voice lines and big stings).
// Drop-in audio: put your own files in an "audio" folder next to index.html and they replace the synth:
//   audio/menu.ogg  audio/game.ogg  audio/final.ogg  audio/win.ogg   (music; loops, except win)
//   audio/voice/shotleft.ogg sharp.ogg ayeye.ogg eish.ogg hhayibo.ogg siyaya.ogg fulltaxi.ogg
// A missing file just keeps the synth version. Same API as 2.9.1 (unlock, suspend, fx, engine, music, vol, set).
// =====================================================================
const Sound = (() => {
  let ac = null, master, sfxBus, voiceBus, musicBus, duckGain, engineNode = null, noiseBuf = null, shaper = null;
  const vol = { master: 0.8, sfx: 0.9, music: 0.35, voice: 0.9, muted: false };
  function load() { try { Object.assign(vol, JSON.parse(localStorage.getItem("shotleft.audio") || "{}")); } catch {} }
  function save() { try { localStorage.setItem("shotleft.audio", JSON.stringify(vol)); } catch {} }
  function apply() { if (!ac) return; master.gain.value = vol.muted ? 0 : vol.master; sfxBus.gain.value = vol.sfx; musicBus.gain.value = vol.music; voiceBus.gain.value = vol.voice; }
  function unlock() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    master = ac.createGain(); sfxBus = ac.createGain(); voiceBus = ac.createGain(); musicBus = ac.createGain(); duckGain = ac.createGain();
    // a gentle limiter on the master keeps stacked stings from clipping
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    sfxBus.connect(master); voiceBus.connect(master); musicBus.connect(duckGain); duckGain.connect(master); master.connect(comp); comp.connect(ac.destination);
    // preload: one shared noise buffer and a soft-clip curve, made once so every tap sounds instantly
    const len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    shaper = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; shaper[i] = Math.tanh(x * 2.2); }
    apply(); Files.load();
  }
  const now = () => ac.currentTime;
  function tone(f, d, type = "sine", v = 0.2, t0 = 0, bus, glide) {
    if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), t = now() + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + d + 0.05); return o;
  }
  // noise through a filter, cut from the shared buffer (decays over its length)
  function noise(d, v = 0.2, t0 = 0, freq = 1200, q = 1, type = "bandpass", bus, sweep) {
    if (!ac) return; const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = now() + t0;
    src.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + d); f.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(bus || sfxBus); src.start(t, Math.random() * 1.5, d + 0.05);
  }
  function duck(depth = 0.6, hold = 0.9) {   // music dips to ~60% under voice and big stings, then comes back
    if (!ac) return; const t = now(), g = duckGain.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(depth, t + 0.06); g.setValueAtTime(depth, t + hold); g.linearRampToValueAtTime(1, t + hold + 0.5);
  }
  const fx = {
    // ---- UI ----
    tap() { tone(660, 0.05, "triangle", 0.06); },
    back() { tone(520, 0.05, "triangle", 0.06); tone(390, 0.07, "triangle", 0.05, 0.04); },
    toggleOn() { tone(700, 0.05, "triangle", 0.06); tone(1050, 0.06, "triangle", 0.05, 0.04); },
    toggleOff() { tone(700, 0.05, "triangle", 0.06); tone(470, 0.06, "triangle", 0.05, 0.04); },
    slider() { tone(1800, 0.02, "square", 0.025); },
    error() { tone(150, 0.12, "square", 0.07); tone(140, 0.14, "square", 0.06, 0.13); },
    tick() { tone(1500, 0.03, "square", 0.04); },
    // ---- turn and taxi ----
    turn() { tone(523, 0.12, "triangle", 0.12); tone(784, 0.18, "triangle", 0.1, 0.1); },
    hoot() { for (const t0 of [0, 0.42]) { tone(370, 0.34, "sawtooth", 0.16, t0); tone(466, 0.34, "sawtooth", 0.11, t0); } },
    hootP(m = 1) { for (const t0 of [0, 0.3]) { tone(370 * m, 0.24, "sawtooth", 0.15, t0); tone(466 * m, 0.24, "sawtooth", 0.1, t0); } },
    door() { noise(0.32, 0.25, 0, 700, 0.8, "lowpass"); tone(140, 0.08, "square", 0.05, 0.28); },
    step() { for (let i = 0; i < 4; i++) noise(0.04, 0.12, i * 0.13, 2500, 3); },
    ignition() { noise(0.5, 0.12, 0, 180, 0.8, "lowpass"); tone(55, 0.6, "sawtooth", 0.06, 0.1); },
    blip(high) { tone(high ? 120 : 95, 0.09, "sawtooth", 0.05, 0, null, high ? 160 : 120); noise(0.05, 0.05, 0, 400, 1, "lowpass"); },
    whoosh() { noise(0.45, 0.28, 0, 400, 1.4, "bandpass", null, 3200); noise(0.3, 0.12, 0.12, 2400, 1, "highpass"); },
    bump() { tone(70, 0.25, "sine", 0.3); noise(0.15, 0.2, 0, 300, 0.7, "lowpass"); },
    whistle() { tone(2300, 0.18, "sine", 0.12); tone(2300, 0.38, "sine", 0.12, 0.24); },
    siren() { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), t = now(); o.type = "sine"; g.gain.value = 0.07;
      for (let i = 0; i < 6; i++) { o.frequency.setValueAtTime(700, t + i * 0.3); o.frequency.linearRampToValueAtTime(980, t + i * 0.3 + 0.15); }
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.8); },
    // ---- passengers and money ----
    seat() { tone(880, 0.06, "sine", 0.1, 0, null, 1320); tone(1320, 0.09, "triangle", 0.05, 0.05); },
    coin() { tone(1046, 0.08, "square", 0.06); tone(1568, 0.2, "square", 0.06, 0.07); },
    cash() { for (let i = 0; i < 3; i++) tone(1200 + i * 220, 0.09, "square", 0.05, i * 0.06); },
    chaching() {   // the till drawer, then the bell
      noise(0.08, 0.18, 0, 3000, 2); noise(0.06, 0.12, 0.07, 4200, 2);
      tone(2093, 0.5, "sine", 0.1, 0.13); tone(2637, 0.45, "sine", 0.07, 0.13); tone(3136, 0.35, "sine", 0.04, 0.13);
      for (let i = 0; i < 4; i++) tone(1600 + i * 260, 0.05, "square", 0.025, 0.02 + i * 0.03);
    },
    lose() { tone(220, 0.25, "sawtooth", 0.09); tone(165, 0.3, "sawtooth", 0.08, 0.15); },
    eish() { tone(330, 0.42, "sawtooth", 0.07, 0, null, 180); tone(247, 0.45, "triangle", 0.06, 0.05, null, 150); },   // a deflated slide down
    // ---- maths ----
    right() { tone(659, 0.1, "triangle", 0.14); tone(880, 0.1, "triangle", 0.14, 0.1); tone(1319, 0.22, "triangle", 0.12, 0.2); },
    wrong() { tone(196, 0.32, "square", 0.08); tone(185, 0.36, "square", 0.08, 0.12); },
    // ---- cards and dice ----
    deck() { noise(0.18, 0.16, 0, 1600, 0.8, "bandpass", null, 600); },
    flip() { noise(0.05, 0.22, 0, 2600, 1.5); tone(900, 0.04, "triangle", 0.05, 0.02); },
    good() { duck(0.6, 0.5); [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, "triangle", 0.1, i * 0.07)); tone(2349, 0.4, "sine", 0.04, 0.28); },
    bad() { duck(0.6, 0.6); tone(98, 0.55, "sawtooth", 0.12, 0, null, 70); tone(147, 0.5, "square", 0.05, 0.02, null, 104); noise(0.3, 0.12, 0, 220, 0.7, "lowpass"); },
    diceShake() { for (let i = 0; i < 7; i++) noise(0.035, 0.12, i * 0.07 + Math.random() * 0.02, 1800 + Math.random() * 1500, 2.5); },
    diceLand() { tone(180, 0.08, "sine", 0.18, 0, null, 90); noise(0.05, 0.16, 0, 2200, 2); noise(0.04, 0.08, 0.11, 2400, 2); },
    // ---- big moments ----
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.14)); },
    fanfare() {   // brassy stabs, then a held chord (about 3 s)
      duck(0.3, 3);
      const stab = (fs, t0, d, v = 0.06) => fs.forEach(f => { tone(f, d, "sawtooth", v, t0); tone(f * 1.003, d, "sawtooth", v * 0.6, t0); });
      stab([392, 494, 587], 0, 0.16); stab([392, 494, 587], 0.2, 0.16); stab([440, 554, 659], 0.4, 0.16); stab([523, 659, 784, 1046], 0.62, 1.8, 0.05);
      tone(131, 2, "triangle", 0.12, 0.62); noise(1.4, 0.06, 0.62, 8000, 0.7, "highpass");
    },
    crowd() {   // a swell of cheering plus scattered claps
      noise(2.6, 0.12, 0, 900, 0.5, "bandpass", null, 1400); noise(2.2, 0.06, 0.2, 2200, 0.6, "bandpass", null, 1600);
      for (let i = 0; i < 26; i++) noise(0.03, 0.12, 0.1 + Math.random() * 2.2, 1500 + Math.random() * 1500, 1.2);
    },
    home() { [440, 554, 659, 880].forEach((f, i) => tone(f, 0.3, "triangle", 0.08, i * 0.09)); },
    // ---- Garage ----
    spray() { noise(0.42, 0.16, 0, 5200, 0.6, "highpass"); noise(0.3, 0.08, 0.05, 2600, 0.8); },
    ting() { tone(2637, 0.5, "sine", 0.1); tone(3951, 0.35, "sine", 0.05, 0.01); },
    tape() { noise(0.22, 0.14, 0, 1400, 1.2, "bandpass", null, 3800); },
    thunk() { tone(110, 0.16, "sine", 0.22, 0, null, 60); noise(0.08, 0.12, 0, 600, 1, "lowpass"); },
    slap() { noise(0.06, 0.22, 0, 2000, 0.9); tone(420, 0.05, "triangle", 0.05); },
    // hooter styles (m = the driver's own pitch)
    horn(style = "classic", m = 1) {
      const H = (f, d, t0, v = 0.15) => { tone(f * m, d, "sawtooth", v, t0); tone(f * m * 1.26, d, "sawtooth", v * 0.66, t0); };
      if (style === "toot3") return [0, 0.2, 0.4].forEach(t => H(370, 0.14, t));
      if (style === "pip") return [0, 0.16].forEach(t => H(560, 0.09, t, 0.12));
      if (style === "truck") return H(185, 0.75, 0, 0.2);
      if (style === "twotone") return [0, 0.22, 0.44, 0.66].forEach((t, k) => H(k % 2 ? 311 : 392, 0.18, t));
      if (style === "wheee") { tone(330 * m, 0.6, "sawtooth", 0.14, 0, null, 660 * m); tone(415 * m, 0.6, "sawtooth", 0.09, 0, null, 830 * m); return; }
      [0, 0.3].forEach(t => H(370, 0.24, t));
    },
    purchase() { for (let i = 0; i < 6; i++) tone(180 + i * 14, 0.07, "sine", 0.1, i * 0.08); tone(1568, 0.5, "sine", 0.12, 0.55); tone(2093, 0.6, "sine", 0.08, 0.6); },
  };

  // ---------------- voice lines ----------------
  // Until real recordings are dropped into audio/voice/, each line is a short "talkie" voice: syllables of
  // filtered buzz that follow the rhythm and melody of the words. The caption always shows the real words.
  const VOICE = {
    shotleft: { text: "Sho't left!", syl: [[1.0, 0.13], [1.25, 0.24]] },
    sharp: { text: "Sharp sharp!", syl: [[1.1, 0.12], [1.3, 0.18], [1.1, 0.12], [1.3, 0.2]] },
    ayeye: { text: "Ayeye!", syl: [[1.0, 0.1], [1.3, 0.12], [1.55, 0.26]] },
    eish: { text: "Eish!", syl: [[1.25, 0.34, 0.78]] },
    hhayibo: { text: "Hhayi bo!", syl: [[1.0, 0.12], [1.2, 0.1], [1.45, 0.28, 1.1]] },
    siyaya: { text: "Siyaya!", syl: [[1.0, 0.1], [1.15, 0.1], [1.4, 0.3]] },
    fulltaxi: { text: "Full taxi!", syl: [[1.2, 0.14], [1.05, 0.1], [1.3, 0.24]] },
  };
  function talkie(syl, base = 210) {
    let t = 0;
    for (const [m, d, end] of syl) {
      if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), tt = now() + t;
      o.type = "sawtooth"; o.frequency.setValueAtTime(base * m, tt); o.frequency.exponentialRampToValueAtTime(base * m * (end || 0.94), tt + d);
      f1.type = "bandpass"; f1.frequency.value = 700 + m * 250; f1.Q.value = 5; f2.type = "bandpass"; f2.frequency.value = 1900 + m * 300; f2.Q.value = 7;
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.5, tt + 0.02); g.gain.setValueAtTime(0.5, tt + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
      o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(voiceBus); o.start(tt); o.stop(tt + d + 0.05);
      t += d + 0.03;
    }
  }
  function voice(id) {
    if (!ac || vol.muted || !vol.voice) return; const v = VOICE[id]; if (!v) return;
    duck(0.6, 1.2);
    if (Files.buf["voice/" + id]) return play(Files.buf["voice/" + id], voiceBus);
    talkie(v.syl, 190 + Math.random() * 40);
  }

  // ---------------- drop-in files ----------------
  const Files = {
    buf: {}, tried: false,
    load() {
      if (this.tried || location.protocol === "file:") return; this.tried = true;
      const names = ["menu", "game", "final", "win"].concat(Object.keys(VOICE).map(k => "voice/" + k));
      for (const n of names) fetch(`audio/${n}.ogg`).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => b && ac.decodeAudioData(b)).then(d => { if (d) { this.buf[n] = d; if (Music.mode && (n === Music.mode || n === "final")) Music.restart(); } }).catch(() => {});
    },
  };
  function play(buffer, bus, loop = false, t0 = 0) { const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buffer; s.loop = loop; s.connect(g); g.connect(bus); s.start(now() + t0); return { s, g }; }

  // ---------------- music: original amapiano-flavoured grooves ----------------
  // 112 BPM, 16 steps a bar, scheduled ahead on the audio clock (steady even when the page is busy).
  // menu: the full groove · game: lighter (keys, shaker, a soft log drum) · final layer: log drum fills,
  // claps, open hats and a rising pad fade in for the home stretch.
  const Music = (() => {
    const BPM = 112, SP = 60 / BPM / 4;
    // jazzy chords: Fmaj9 – Em9 – Dm9 – Am9 (Hz, a warm mid voicing), with roots for the log drum
    const CH = [[174.6, 220, 261.6, 329.6, 392], [164.8, 196, 246.9, 293.7, 370], [146.8, 174.6, 220, 261.6, 329.6], [220, 261.6, 329.6, 392, 493.9]];
    const ROOT = [87.3, 82.4, 73.4, 110];
    const LOG = [[0, 0], [3, 0], [6, 1.5], [10, 1], [14, 1.335]];          // [step, pitch ratio over the root]
    const LOG_B = [[0, 0], [3, 0], [7, 1.5], [10, 1], [11, 1.12], [13, 1.335], [15, 1.5]];
    let mode = null, timer = null, step = 0, nextT = 0, finalOn = false, finalGain = null, layerGain = null, fileNodes = [];
    function logdrum(t, f, v) {   // the amapiano log drum: a bouncy, slightly overdriven pitched bass with a glide
      const o = ac.createOscillator(), g = ac.createGain(), ws = ac.createWaveShaper(), lp = ac.createBiquadFilter();
      o.type = "sine"; o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      ws.curve = shaper; lp.type = "lowpass"; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(ws); ws.connect(lp); lp.connect(g); g.connect(layerGain); o.start(t); o.stop(t + 0.5);
    }
    function key(t, f, d, v, bus) {   // electric-piano-ish: sine + a soft octave, slow tremolo
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), trem = ac.createOscillator(), tg = ac.createGain();
      o.type = "sine"; o2.type = "triangle"; o.frequency.value = f; o2.frequency.value = f * 2;
      const g2 = ac.createGain(); g2.gain.value = 0.18; trem.frequency.value = 4.5; tg.gain.value = v * 0.25;
      trem.connect(tg); tg.connect(g.gain);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(v * 0.4, t + d * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus); [o, o2, trem].forEach(x => { x.start(t); x.stop(t + d + 0.05); });
    }
    function hit(t, d, v, freq, q, type, bus, sweep) {
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + d); f.Q.value = q;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random() * 1.5, d + 0.05);
    }
    function kick(t, v) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(layerGain); o.start(t); o.stop(t + 0.25); }
    function schedule(s, t) {
      const bar = Math.floor(s / 16), k = s % 16, c = bar % 4, menu = mode === "menu", alt = bar % 2 === 1;
      // keys: a long chord on the one, a short push on the "and" of beat 3 (menu) — sparser in game
      if (k === 0) CH[c].forEach((f, i) => key(t, f, SP * (menu ? 9 : 14), (menu ? 0.03 : 0.022) * (i === 4 ? 0.6 : 1), layerGain));
      if (menu && k === 10) CH[c].slice(1, 4).forEach(f => key(t, f, SP * 3, 0.022, layerGain));
      // shaker on every 16th, accented off the beat
      hit(t, 0.045, (k % 4 === 2 ? 0.05 : 0.022) * (menu ? 1 : 0.7), 7000, 1, "highpass", layerGain);
      // log drum
      const pat = menu ? (alt ? LOG_B : LOG) : [[0, 0], [10, 1]];
      for (const [ps, r] of pat) if (ps === k) logdrum(t, ROOT[c] * (r || 1), menu ? 0.22 : 0.15);
      // a soft four-on-the-floor kick (menu) and a rim on 2 and 4
      if (menu && k % 4 === 0) kick(t, 0.22);
      if (menu && (k === 4 || k === 12)) hit(t, 0.06, 0.06, 1900, 4, "bandpass", layerGain);
      // the final-round layer (fades in on its own gain)
      if (finalOn) {
        if (k === 4 || k === 12) { hit(t, 0.12, 0.09, 1300, 1.2, "bandpass", finalGain); hit(t + 0.012, 0.1, 0.07, 1600, 1.2, "bandpass", finalGain); }
        if (k % 4 === 2) hit(t, 0.16, 0.035, 9000, 0.8, "highpass", finalGain);
        if (alt && (k === 13 || k === 14 || k === 15)) { const o = ac.createOscillator(), g = ac.createGain(), ws = ac.createWaveShaper(); o.frequency.setValueAtTime(ROOT[c] * 3, t); o.frequency.exponentialRampToValueAtTime(ROOT[c] * 1.5, t + 0.05);
          ws.curve = shaper; g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(ws); ws.connect(g); g.connect(finalGain); o.start(t); o.stop(t + 0.35); }
        if (k === 0) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = CH[c][2]; f.type = "lowpass"; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1800, t + SP * 16);
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.025, t + SP * 8); g.gain.linearRampToValueAtTime(0.0001, t + SP * 16); o.connect(f); f.connect(g); g.connect(finalGain); o.start(t); o.stop(t + SP * 16 + 0.05); }
      }
    }
    function pump() { if (!ac || ac.state !== "running") return; if (nextT < now() - 0.1) nextT = now() + 0.05;   // after a pause, pick up cleanly instead of catching up
      while (nextT < now() + 0.15) { schedule(step, nextT); step++; nextT += SP; } }
    function stopFiles() { fileNodes.forEach(n => { try { n.g.gain.setTargetAtTime(0.0001, now(), 0.3); n.s.stop(now() + 1.2); } catch {} }); fileNodes = []; }
    function start(m) {
      if (!ac) return;
      const fresh = !layerGain; if (fresh) { layerGain = ac.createGain(); finalGain = ac.createGain(); layerGain.connect(musicBus); finalGain.connect(musicBus); finalGain.gain.value = finalOn ? 1 : 0.0001; }
      if (mode === m && (timer || fileNodes.length)) return;
      stop(); mode = m; layerGain.gain.setValueAtTime(0.0001, now()); layerGain.gain.linearRampToValueAtTime(1, now() + 0.8);
      if (Files.buf[m]) { fileNodes.push(play(Files.buf[m], layerGain, true)); if (m === "game" && Files.buf.final) { const n = play(Files.buf.final, finalGain, true); fileNodes.push(n); } return; }
      step = 0; nextT = now() + 0.08; timer = setInterval(pump, 40); pump();
    }
    function stop() { clearInterval(timer); timer = null; stopFiles(); mode = null; }
    function final(on) {
      finalOn = !!on; if (!ac || !finalGain) return;
      const t = now(); finalGain.gain.cancelScheduledValues(t); finalGain.gain.setValueAtTime(Math.max(0.0001, finalGain.gain.value), t); finalGain.gain.linearRampToValueAtTime(on ? 1 : 0.0001, t + (on ? 4 : 1));
    }
    function stinger() { stop(); if (ac && Files.buf.win) return play(Files.buf.win, musicBus); fx.fanfare(); }
    return { start, stop, final, stinger, restart() { const m = mode; stop(); if (m) start(m); }, get mode() { return mode; } };
  })();
  // music(true) = menu groove, music("game") = in-game groove, music(false) = silence
  function music(on) { if (on === false || on == null) return Music.stop(); Music.start(on === true ? "menu" : on); }

  function engine(on, high) {   // a soft idling engine while the taxi moves
    if (!ac) return;
    if (!on) { if (engineNode) { const e = engineNode; e.g.gain.setTargetAtTime(0.0001, now(), 0.12); setTimeout(() => { try { e.o.stop(); e.lfo.stop(); } catch {} }, 500); engineNode = null; } return; }
    if (engineNode) { engineNode.o.frequency.setTargetAtTime(high ? 78 : 52, now(), 0.3); return; }
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = "sawtooth"; o.frequency.value = high ? 78 : 52; f.type = "lowpass"; f.frequency.value = 380; lfo.frequency.value = 14; lg.gain.value = 6;
    lfo.connect(lg); lg.connect(o.frequency); o.connect(f); f.connect(g); g.connect(sfxBus); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.06, now(), 0.15);
    o.start(); lfo.start(); engineNode = { o, g, lfo };
  }
  load();
  const safe = f => (...a) => { try { if (ac && !vol.muted) return f(...a); } catch {} };
  return {
    unlock, suspend(on) { try { if (ac) on ? ac.suspend() : ac.resume(); } catch {} },
    fx: new Proxy(fx, { get: (o, k) => safe(o[k] || (() => {})) }),
    voice: safe(voice), VOICE, duck: safe(duck),
    engine, music, final: Music.final, stinger: safe(Music.stinger), get musicMode() { return Music.mode; },
    vol, set(k, v) { vol[k] = v; apply(); save(); },
  };
})();
