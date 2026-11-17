  // ---------------- board dressing (2.19): worn tar, rain potholes, corner kerbs, verge jacarandas ----------------
  // All of it is flat decals or plain props, built once with the city, so it costs nothing while the camera rests.
  const puddles = [];
  function roadQuad(s, lat, len, wid) {   // a rectangle lying on the road, aligned with it
    const a = offsetPt(s - len / 2, lat - wid / 2), b = offsetPt(s + len / 2, lat - wid / 2), c = offsetPt(s + len / 2, lat + wid / 2), d = offsetPt(s - len / 2, lat + wid / 2);
    return [[a.x, a.y], [b.x, b.y], [c.x, c.y], [d.x, d.y]];
  }
  function roadBlob(s, lat, rx, ry, n = 12, wob = 0.18, seed = 0) {   // a soft irregular blob aligned with the road
    const p = offsetPt(s, lat), c = Math.cos(p.h), sn = Math.sin(p.h), pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, w = 1 + (hashK(seed + i, 31) - 0.5) * wob * 2, lx = Math.cos(t) * rx * w, ly = Math.sin(t) * ry * w;
      pts.push([p.x + lx * c - ly * sn, p.y + lx * sn + ly * c]);
    }
    return { pts, x: p.x, y: p.y, h: p.h };
  }
  function nearStop(s, rankPad = 1.7, robotPad = 0.9, markPad = 0) {
    for (let i = 0; i < SL_CONFIG.boardSpaces; i++) {
      const d = Math.abs(((s - spaceS(i)) % LEN + LEN * 1.5) % LEN - LEN / 2);
      if (SL.rankAt(i) >= 0 && d < rankPad) return true;
      if (SL.isRobot(i) && d < robotPad) return true;
      if (markPad && Math.abs(((s - spaceS(i) + 0.18) % LEN + LEN * 1.5) % LEN - LEN / 2) < markPad) return true;   // the white space line
    }
    return false;
  }
  function roadDress() {
    puddles.length = 0;
    const lo = quality === "low", half = ROAD_W / 2;
    // tar patches: slightly darker or lighter rectangles where the road was fixed
    for (let k = 0; k < (lo ? 8 : 18); k++) {
      const s = hashK(k, 21) * LEN, lat = (hashK(k, 22) - 0.5) * (ROAD_W - 0.7); if (nearStop(s, 1.4, 0.7)) continue;
      decal(roadQuad(s, lat, 0.5 + hashK(k, 23) * 1.2, 0.3 + hashK(k, 24) * 0.45), hashK(k, 25) < 0.55 ? "#2f3135" : "#4a4c51", { z: 0.0085 });
    }
    // cracks: thin dark zig-zags
    if (!lo) for (let k = 0; k < 26; k++) {
      const s = hashK(k, 41) * LEN, lat = (hashK(k, 42) - 0.5) * (ROAD_W - 0.4), n = 4 + Math.floor(hashK(k, 43) * 3), pts = [], dir = hashK(k, 44) < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) { const o = offsetPt(s + i * 0.16, lat + dir * i * 0.07 + (hashK(k + i, 45) - 0.5) * 0.12); pts.push([o.x, o.y]); }
      decal(pts, null, { stroke: "rgba(16,16,20,.55)", width: 0.03, open: true, z: 0.0088 });
    }
    // oil stains where the taxis stand at the ranks
    for (let r = 0; r < SL_RANKS.length; r++) { const s0 = spaceS(SL.rankSpace(r));
      for (const [ds, dl, rx] of [[-0.35, 0, 0.42], [0.55, 0.05, 0.3]]) decal(roadBlob(s0 + ds, half - 0.45 + dl, rx, rx * 0.55, 10, 0.25, r * 7).pts, "rgba(12,12,18,.22)", { z: 0.0087 }); }
    // potholes full of rain: a broken rim, dark water, a slice of sky on top
    const spots = [[0.07, -0.5], [0.13, 0.55], [0.205, -0.45], [0.29, 0.5], [0.37, -0.55], [0.46, 0.45], [0.545, -0.5], [0.63, 0.55], [0.71, -0.45], [0.79, 0.5], [0.87, -0.55], [0.95, 0.45]];
    spots.forEach(([u, lat], k) => {
      if (lo && k % 2) return;
      let s = u * LEN; const bad = x => nearStop(x, 1.7, 0.9, 0.55); if (bad(s)) s += 1.1; if (bad(s)) s -= 2.2; if (bad(s)) return;
      const r = 0.15 + hashK(k, 51) * 0.1, seed = k * 13;
      const rim = roadBlob(s, lat, r * 1.55, r * 1.1, 14, 0.3, seed), hole = roadBlob(s, lat, r * 1.22, r * 0.84, 12, 0.2, seed + 3), water = roadBlob(s, lat, r * 1.08, r * 0.7, 12, 0.14, seed + 5);
      decal(rim.pts, "#2b2c30", { z: 0.0089 });   // broken tar around the hole
      decal(hole.pts, "#17181b", { z: 0.0090 });
      decal(water.pts, "#3d5568", { z: 0.0091 });
      decal(roadBlob(s - r * 0.25, lat - r * 0.18, r * 0.62, r * 0.28, 10, 0.1, seed + 9).pts, "rgba(175,205,228,.5)", { z: 0.0092 });   // sky reflection
      puddles.push({ x: water.x, y: water.y, h: water.h, r, ph: k * 1.7 });
    });
    // red-and-white kerbs on the four corners, both edges (the ranks already paint their own outer kerb)
    let acc = 0;
    segs.forEach((g, gi) => {
      if (gi % 2 === 1) for (const e of [1, -1]) {
        const pts = [], N = 18;
        for (let i = 0; i <= N; i++) { const s = acc + g.len * i / N; if (e > 0 && nearStop(s, 1.45, 0)) { if (pts.length > 1) kerb(pts.splice(0)); else pts.length = 0; continue; } const o = offsetPt(s, e * (half + 0.03)); pts.push([o.x, o.y]); }
        if (pts.length > 1) kerb(pts);
      }
      acc += g.len;
    });
    function kerb(pts) { decal(pts, null, { stroke: "#f4f1ea", width: 0.12, open: true, z: 0.0105 }); decal(pts, null, { stroke: "#d23a2c", width: 0.12, dash: [0.28, 0.28], open: true, z: 0.011 }); }
    // purple jacarandas along the outer verge, between the stops
    if (!lo) for (let i = 0; i < SL_CONFIG.boardSpaces; i++) {
      if (SL.rankAt(i) >= 0 || SL.isRobot(i)) continue;
      const p = offsetPt(spaceS(i) + 0.4, half + 2.35); jacaranda(p.x, p.y, 0.72 + hashK(i, 61) * 0.18);
    }
  }
  function puddleGlints(out) {   // a slow glint sliding across each puddle and the odd ripple ring
    if (quality !== "high" || reduced || extras.loadshedding) return;
    for (const p of puddles) {
      const c = proj(V(p.x, p.y, 0.012)); if (!c) continue;
      const sc = B_.F / c[2], rw = p.r * sc * 1.05; if (rw < 2.5) continue;
      out.push({ z: 1e7, bb: [c[0] - rw * 1.6, c[1] - rw, c[0] + rw * 1.6, c[1] + rw], draw() {
        const t = time * 0.55 + p.ph, sw = Math.sin(t) * 0.5 + 0.5, rip = (time * 0.45 + p.ph * 0.3) % 1;
        ctx.save();
        ctx.globalAlpha = 0.18 + 0.22 * sw; ctx.fillStyle = "#eaf4fb";
        ctx.beginPath(); ctx.ellipse(c[0] + (sw - 0.5) * rw * 0.9, c[1] - rw * 0.08, rw * 0.32, rw * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 * (1 - rip); ctx.strokeStyle = "#dbe9f3"; ctx.lineWidth = Math.max(0.6, sc * 0.012);
        ctx.beginPath(); ctx.ellipse(c[0] + rw * 0.2, c[1] + rw * 0.05, rw * 0.6 * rip + 1, rw * 0.3 * rip + 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } });
    }
  }
  function paintHaze(loadshed) {   // distance haze toward the top of the screen: the far city fades into warm air
    if (quality === "low" || loadshed || !LOOK.haze) return;
    const [r, g, b, a] = LOOK.haze, top = clamp(1.25 - (cam.pitch + user.pitch), 0.25, 0.75);
    const hz = ctx.createLinearGradient(0, 0, 0, H * top);
    hz.addColorStop(0, `rgba(${r},${g},${b},${a})`); hz.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H * top);
  }
