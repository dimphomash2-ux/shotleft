  async function drive(players, pi, path, gear, follow = true, onSpace) {
    const t = taxis[pi]; if (!path.length) return;
    const ln = laneFor(players, pi);
    const s0 = t.s;
    let total = ((spaceS(path[path.length - 1]) + ln.ds - s0) % LEN + LEN) % LEN; if (total < 0.2) total += LEN;
    // how far along the road each space on the path is, so each one can hop, puff and tick as the taxi crosses it
    const marks = path.map((sp, k) => k === path.length - 1 ? total : ((spaceS(sp) + ln.ds - s0) % LEN + LEN) % LEN);
    const lat0 = t.lat, dur = (gear === "high" ? 230 : 380) * path.length + 300;
    const others = taxis.map((o, i) => i).filter(i => i !== pi && taxis[i]), rocked = new Set();
    const base = { dist: want.dist, pitch: want.pitch }; MO.chase = follow;
    // 1. launch: the tail squats as the engine revs
    hook("launch", gear);
    await tween(200, p => { const q = Math.sin(p * Math.PI / 2); t.pitch = -0.065 * q; t.bounce = -0.018 * q; });
    let prev = 0, next = 0, hop = 0, last = performance.now(), yawPrev = t.yaw, roll = 0, rollV = 0, swYaw = 0;
    await tween(dur, p => {
      const nowT = performance.now(), dt = clamp((nowT - last) / 1000, 0.001, 0.05); last = nowT;
      // accelerate, cruise, brake: smootherstep for position
      const e = p * p * p * (p * (p * 6 - 15) + 10), sNow = s0 + total * e, v = e - prev; prev = e;
      const speed = p >= 1 ? 0 : total * 30 * p * p * (p * (p - 2) + 1) / (dur / 1000), amt = clamp(speed / 16, 0, 1);   // units per second, 0..1
      // 2. overtake: swing out to the right (inside of the loop) past a parked taxi, then tuck back in
      let sw = 0;
      for (const o of others) {
        let d = ((taxis[o].s - sNow) % LEN + LEN) % LEN; if (d > LEN / 2) d -= LEN;
        if (Math.abs(d) < 3.6) { const u = 1 - Math.abs(d) / 3.6; sw = Math.max(sw, u * u * (3 - 2 * u)); }
        if (Math.abs(d) < 0.35 && !rocked.has(o) && p < 0.97) { rocked.add(o); rock(o); }
      }
      const lat = lerp(lat0, ln.lat, p) - 0.72 * sw, q = offsetPt(sNow, lat);
      while (next < marks.length && total * e >= marks[next] - 0.02) { if (onSpace) onSpace(next, path[next]); next++; hop = 1; }
      hop = Math.max(0, hop - 0.12);
      // heading follows the road, plus the swerve's own angle
      const latPrev = t.latNow ?? lat0, dsx = Math.max(0.001, total * v), swT = dsx > 0.004 ? clamp(Math.atan2(lat - latPrev, dsx), -0.22, 0.22) : 0;
      swYaw = lerp(swYaw, swT, 1 - Math.exp(-dt * 14)); const yaw = q.h + swYaw;
      // 3. body roll: the body leans out of a corner on a spring, and swings back past upright when the road straightens
      const yawRate = angDiff(yawPrev, q.h) / dt; yawPrev = q.h;
      const rollT = clamp(yawRate * 0.028, -0.1, 0.1), ar = -2 * 0.42 * 8 * rollV - 64 * (roll - rollT);; rollV += ar * dt; roll += rollV * dt;   // underdamped: it swings back past upright once
      t.x = q.x; t.y = q.y; t.yaw = yaw; t.s = sNow; t.latNow = lat; t.wheel -= v * total / 0.19; t.roll = roll;
      // nose lifts on launch, dives into the brake
      t.pitch = p < 0.25 ? -0.065 * Math.pow(1 - p / 0.25, 2) : p > 0.82 ? 0.055 * Math.sin((p - 0.82) / 0.18 * Math.PI / 2) : 0;
      t.bounce = (gear === "high" ? Math.sin(p * 60) * 0.008 * amt : 0) + Math.sin(hop * Math.PI) * 0.07;
      MO.streak = gear === "high" || amt > 0.55 ? { pi, amt } : null;
      hook("speed", amt);
      if (follow) {
        // chase framing: with speed the camera pulls back, drops lower, widens and looks further ahead
        const ahead = 2.2 + 2.6 * amt;
        want.tx = lerp(want.tx, q.x + Math.cos(q.h) * ahead, 0.25); want.ty = lerp(want.ty, q.y + Math.sin(q.h) * ahead, 0.25); want.yaw = kerbYaw(q.h);
        want.dist = base.dist * (1 + 0.08 * amt); want.pitch = base.pitch - 0.035 * amt; MO.fov = 0.05 * amt;
      }
    });
    while (next < marks.length) { if (onSpace) onSpace(next, path[next]); next++; }   // Reduce Motion jumps straight there
    MO.streak = null; MO.fov = 0; MO.chase = false; t.lat = ln.lat; t.latNow = ln.lat; t.yaw = offsetPt(t.s, ln.lat).h;
    if (follow) { want.dist = base.dist; want.pitch = base.pitch; }   // the camera eases back in on the stop
    // 4. the stop: suspension rebound that settles; the presentation layer squeals the brakes and puffs the tyres
    hook("brake", pi);
    const roll0 = t.roll || 0;
    tween(620, p => { const d = Math.exp(-5.2 * p); t.pitch = 0.055 * d * Math.cos(p * 13); t.bounce = -0.016 * d * Math.cos(p * 13 + 0.6) * (1 - p); t.roll = roll0 * d * Math.cos(p * 10); })
      .then(() => { t.pitch = 0; t.bounce = 0; t.roll = 0; });
    await wait(160);
  }
  function rock(o) {   // a parked taxi rocks in the wash of an overtake
    const t = taxis[o];
    tween(700, p => { t.roll = -0.05 * Math.exp(-4.5 * p) * Math.sin(p * 17); }).then(() => { t.roll = 0; });
  }
