  // ---------------- motion director (2.18): spring camera, crane flights, chase framing, shake, orbit ----------------
  // The camera is a critically damped spring on every axis, so it never stops dead between moves.
  // On a long flight it cranes up and back, then settles down behind the next taxi. Reduce Motion snaps.
  const MO = { chase: false, crane: 0, craneV: 0, shake: 0, sx: 0, sy: 0, rp: 0, fov: 0, orbit: 0, orbitUntil: 0, streak: null };
  const camV = { tx: 0, ty: 0, pitch: 0, dist: 0, yaw: 0 };
  const hooks = {};   // the presentation layer listens here: launch, speed (0..1 each frame), brake
  const hook = (k, v) => { try { if (hooks[k]) hooks[k](v); } catch {} };
  function camStep(dt) {
    if (reduced) {
      for (const key of ["tx", "ty", "pitch", "dist", "yaw"]) { cam[key] = want[key]; camV[key] = 0; }
      MO.crane = MO.craneV = MO.shake = MO.sx = MO.sy = MO.rp = MO.fov = 0; MO.orbit = 0; return;
    }
    if (MO.orbit) { if (performance.now() > MO.orbitUntil) MO.orbit = 0; else want.yaw += dt * 0.2; }
    const w = MO.chase ? 9 : 4.4, sub = dt > 0.025 ? 2 : 1, h = dt / sub;   // chasing a moving taxi: a stiffer spring, the look-ahead absorbs its lag
    for (let n = 0; n < sub; n++) {
      for (const key of ["tx", "ty", "pitch", "dist"]) { const a = -2 * w * camV[key] - w * w * (cam[key] - want[key]); camV[key] += a * h; cam[key] += camV[key] * h; }
      const dy = angDiff(cam.yaw, want.yaw), ay = -2 * w * camV.yaw + w * w * dy; camV.yaw += ay * h; cam.yaw += camV.yaw * h;
      // crane: the further the camera still has to travel, the higher and wider it rides
      const far = Math.hypot(want.tx - cam.tx, want.ty - cam.ty), ct = MO.chase ? 0 : clamp((far - 4) * 0.62, 0, 16), wc = 4.6;
      const ac = -2 * wc * MO.craneV - wc * wc * (MO.crane - ct); MO.craneV += ac * h; MO.crane += MO.craneV * h;
    }
    const near = Math.abs(cam.tx - want.tx) < 0.01 && Math.abs(cam.ty - want.ty) < 0.01 && Math.abs(cam.dist - want.dist) < 0.02 && Math.abs(cam.pitch - want.pitch) < 0.002 && Math.abs(angDiff(cam.yaw, want.yaw)) < 0.002;
    const slow = Math.abs(camV.tx) + Math.abs(camV.ty) + Math.abs(camV.dist) < 0.06 && Math.abs(camV.yaw) + Math.abs(camV.pitch) < 0.01;
    if (near && slow) { for (const key in camV) camV[key] = 0; cam.yaw = want.yaw; }
    if (Math.abs(MO.crane) < 0.004 && Math.abs(MO.craneV) < 0.01) MO.crane = MO.craneV = 0;
    // a jolt that decays: the world shakes, not the page
    if (MO.shake > 0.003) { MO.shake *= Math.exp(-dt * 6.5); const s = MO.shake; MO.sx = s * (Math.sin(time * 43) + 0.5 * Math.sin(time * 71)); MO.sy = s * (Math.cos(time * 37) + 0.5 * Math.sin(time * 59)); MO.rp = s * 0.025 * Math.sin(time * 53); }
    else MO.shake = MO.sx = MO.sy = MO.rp = 0;
  }
  const camMoving = () => Math.abs(MO.crane) > 0.004 || MO.shake > 0.003 || MO.orbit > 0 || Math.abs(camV.tx) + Math.abs(camV.ty) + Math.abs(camV.dist) > 0.02 || Math.abs(camV.yaw) > 0.003;
  function shake(amp = 0.3) { if (reduced) return; MO.shake = Math.max(MO.shake, amp); busyUntil = performance.now() + 900; }
  function orbit(on, ms = 26000) { MO.orbit = on && !reduced ? 1 : 0; MO.orbitUntil = performance.now() + ms; busyUntil = performance.now() + 300; }
  // speed streaks: thin trails that follow the road's curve behind a fast taxi (relative motion, not a screen overlay)
  function drawStreaks() {
    const S = MO.streak; if (!S || reduced || quality === "low" || S.amt < 0.2) return;
    const t = taxis[S.pi]; if (!t) return;
    const night = LOOK.lit || extras.loadshedding, len = 0.5 + 3.4 * S.amt, n = 7;
    ctx.save(); ctx.lineCap = "round";
    for (const [lat, z, wd] of [[0.34, 0.16, 3], [-0.34, 0.16, 3], [0, 0.08, 2]]) {   // road level only: from behind-above, roof-height trails would cross the body
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const q = offsetPt(t.s - 1.2 - len * i / n, (t.latNow ?? t.lat) + lat), p = proj(V(q.x, q.y, z + t.bounce));
        if (p && prev) {
          ctx.strokeStyle = night ? `rgba(255,214,120,${(0.6 * S.amt * (1 - i / n)).toFixed(3)})` : `rgba(255,255,255,${(0.62 * S.amt * (1 - i / n)).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.6, wd * (1 - i / (n + 2)) * clamp(B_.F / p[2] * 0.02, 0.5, 2.2));
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
        prev = p;
      }
    }
    ctx.restore();
  }
