  // ---------------- inner city (2.20): built toward the reference board art ----------------
  // the big rank under long striped canopies, white minibuses in rows, a shop row with a car park
  function minibus(x, y, yaw, k) {
    vehicle(x, y, yaw, { col: "#f4f4f1", L: 1.12, W: 0.5, H: 0.24, van: true, stripe: pick(["#f2c230", "#2e9e5b", "#d62828", "#2f6fd6", "#ee7a1e"], k) });
  }
  function stripedCanopy(cx, cy, len, dep, h, cols) {   // one long butterfly roof in coloured strips, posts along both sides
    const seg = cols.length, sl = len / seg, hd = dep / 2 + 0.12, posts = Math.max(2, Math.round(len / (quality === "low" ? 2.6 : 1.35)) + 1);
    for (let k = 0; k < posts; k++) { const x = cx - len / 2 + 0.15 + k * (len - 0.3) / (posts - 1); for (const e of [-1, 1]) pole(x, cy + e * (dep / 2 - 0.1), h + 0.1, "#ece7dc", 0, 0.07); }
    for (let k = 0; k < seg; k++) {
      const x0 = cx - len / 2 + k * sl, x1 = x0 + sl, col = cols[k], st = { type: "stripes", n: 3, color: "rgba(255,255,255,.22)" };
      S_([face([V(x0, cy - hd, h + 0.26), V(x1, cy - hd, h + 0.26), V(x1, cy, h + 0.08), V(x0, cy, h + 0.08)], col, { out: V(0, 0, 1), detail: st }),
        face([V(x0, cy, h + 0.08), V(x1, cy, h + 0.08), V(x1, cy + hd, h + 0.26), V(x0, cy + hd, h + 0.26)], shadeHex(col, 1.08), { out: V(0, 0, 1), detail: st })]);
    }
    if (quality !== "low") for (const e of [-1, 1]) S_(box(cx, cy + e * hd, len + 0.1, 0.06, 0.1, "#ece7dc", "#ece7dc", { z0: h + 0.2, noShadow: true }));
    addShadow(rectPoly(cx, cy, len + 0.2, dep + 0.24), h + 0.2);
    lamps.push({ x: cx - len / 4, y: cy, z: h, r: 1.4 }, { x: cx + len / 4, y: cy, z: h, r: 1.4 });
  }
  function bigRank(cx, cy) {
    decal(rectPoly(cx, cy, 5.9, 3.9), "#cfc6b3", { z: 0.007 });
    decal(rectPoly(cx, cy, 5.8, 0.62), "#55575c", { z: 0.008 });   // the loading lane between the two shelters
    for (const e of [-1, 1]) decal([[cx - 2.85, cy + e * 0.31], [cx + 2.85, cy + e * 0.31]], null, { stroke: "#f2c230", width: 0.06, open: true, z: 0.011 });
    const A = ["#5bb592", "#e0636f", "#5bb592", "#e0636f", "#5bb592"], B = ["#e0636f", "#4fa7b0", "#e0636f", "#4fa7b0", "#e0636f"];
    for (const [e, cols] of [[1, A], [-1, B]]) {
      const y = cy + e * 1.12;
      decal(rectPoly(cx, y, 5.6, 1.5), "#8e9196", { z: 0.0085 });
      for (let k = 0; k <= 6; k++) decal([[cx - 2.7 + k * 0.9, y - 0.7], [cx - 2.7 + k * 0.9, y + 0.7]], null, { stroke: "rgba(255,255,255,.75)", width: 0.04, open: true, z: 0.011 });
      for (let k = 0; k < 6; k++) if (!(quality === "low" && k % 2)) minibus(cx - 2.25 + k * 0.9, y + e * 0.05, -e * Math.PI / 2, k + (e > 0 ? 0 : 3));   // reversed in, nose to the lane
      stripedCanopy(cx, y + e * 0.05, 5.6, 1.45, 1.2, cols);
    }
    // the rank sign on its yellow gantry, high above the roofs
    for (const e of [-1, 1]) pole(cx + 1.0 + e * 1.0, cy + 1.95, 2.5, "#f2c230", 0, 0.1);
    S_(box(cx + 1.0, cy + 1.95, 2.3, 0.14, 0.6, "#1b1c1f", "#1b1c1f", { z0: 2.0, noShadow: true, detail: i => (i === 0 || i === 2 ? [TXT("TAXI RANK", "#f2c230", null, 0.08, 0.92)] : null) }));
    for (const x of [-2.6, 2.6]) bench(cx + x, cy - 1.95, 0);
  }
  function shopRow3(cx, cy) {   // a row of bright two-storey shops facing a small car park
    decal(rectPoly(cx, cy + 1.15, 3.9, 1.6), "#d9cfba", { z: 0.007 });
    const U = [["#f2c230", "#d62f2f", 1.35], ["#ec6fa0", "#2f6fd6", 1.7], ["#4fb3a2", "#ee7a1e", 1.25], ["#f39a3c", "#2e9e5b", 1.55]];
    U.forEach(([wall, awn, h], k) => {
      const x = cx - 1.43 + k * 0.95;
      solid(rectPoly(x, cy + 1.3, 0.93, 1.1), 0, h, wall, shadeHex(wall, 0.9), { detail: i => (i === 0 ? [{ type: "shop", awn, glass: "#2e4a5c" }, { type: "sign", color: "#fff7e6", from: 0.82, to: 0.95, plain: true }] : i === 2 ? null : W1(1, 2, { v0: 0.45, v1: 0.9 })) });
      S_(box(x, cy + 0.68, 0.9, 0.36, 0.05, awn, awn, { z0: 0.78, noShadow: true, detail: () => ({ type: "stripes", n: 4, color: "rgba(255,255,255,.5)" }) }));   // awning
      if (k % 2 === 0) S_(box(x + 0.15, cy + 1.45, 0.3, 0.3, 0.25, "#8d6e63", "#a1887f", { z0: h, noShadow: true }));   // water tank
    });
    decal(rectPoly(cx, cy - 0.85, 3.9, 1.7), "#6f7177", { z: 0.008 });   // car park
    for (let k = 0; k <= 6; k++) decal([[cx - 1.8 + k * 0.6, cy - 0.15], [cx - 1.8 + k * 0.6, cy - 0.95]], null, { stroke: "#f4f4f4", width: 0.035, open: true, z: 0.011 });
    [0, 1, 3, 5].forEach((k, i) => vehicle(cx - 1.5 + k * 0.6, cy - 0.55, Math.PI / 2, { col: pick(carCols, i * 2 + 3), L: 0.58, W: 0.34, H: 0.2 }));
    for (const x of [-1.9, 1.9]) palm(cx + x, cy - 1.55, 0.85, x);
    lamp(cx, cy - 1.6, Math.PI / 2);
  }
