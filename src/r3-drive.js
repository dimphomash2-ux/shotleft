  async function drive(players, pi, path, gear, follow = true, onSpace) {
    const t = taxis[pi]; if (!path.length) return;
    const ln = laneFor(players, pi);
    const s0 = t.s;
    let total = ((spaceS(path[path.length - 1]) + ln.ds - s0) % LEN + LEN) % LEN; if (total < 0.2) total += LEN;
    // how far along the road each space on the path is, so each one can hop, puff and tick as the taxi crosses it
    const marks = path.map((sp, k) => k === path.length - 1 ? total : ((spaceS(sp) + ln.ds - s0) % LEN + LEN) % LEN);
    const lat0 = t.lat, dur = (gear === "high" ? 230 : 380) * path.length + 300;
    let prev = 0, next = 0, hop = 0;
    await tween(dur, p => {
      // accelerate, cruise, brake: smootherstep for position
      const e = p * p * p * (p * (p * 6 - 15) + 10), sNow = s0 + total * e, q = offsetPt(sNow, lerp(lat0, ln.lat, p));
      const v = e - prev; prev = e;
      while (next < marks.length && total * e >= marks[next] - 0.02) { if (onSpace) onSpace(next, path[next]); next++; hop = 1; }
      hop = Math.max(0, hop - 0.12);
      t.x = q.x; t.y = q.y; t.yaw = q.h; t.s = sNow; t.wheel -= v * total / 0.19;
      t.pitch = p < 0.2 ? -0.04 * Math.sin(p / 0.2 * Math.PI) : p > 0.8 ? 0.05 * Math.sin((p - 0.8) / 0.2 * Math.PI) : 0;
      t.bounce = (gear === "high" ? Math.sin(p * 60) * 0.008 : 0) + Math.sin(hop * Math.PI) * 0.07;
      if (follow) { want.tx = lerp(want.tx, q.x + Math.cos(q.h) * 2.2, 0.25); want.ty = lerp(want.ty, q.y + Math.sin(q.h) * 2.2, 0.25); want.yaw = kerbYaw(q.h); }
    });
    while (next < marks.length) { if (onSpace) onSpace(next, path[next]); next++; }   // Reduce Motion jumps straight there
    t.pitch = 0; t.bounce = 0; t.lat = ln.lat;
  }
