// =====================================================================
// SHO'T LEFT! — BILLING BRIDGE (Phase 7)
// window.SLBilling is what FT.Entitlement talks to: query(id) and purchase(id), plus restore().
//  · In the Android app: Google Play Billing through cordova-plugin-purchase (CdvPurchase, 13.13.1+,
//    Billing Library 8). One non-consumable product, full_tank_edition. Approved purchases are finished
//    (acknowledged) straight away; pending ones never unlock. Prices come from Google Play, localised.
//  · In the artifact preview only (SL_PREVIEW_STORE): a labelled test store, no money involved.
//  · Anywhere else: no bridge, so the store says purchases need the Google Play version.
// =====================================================================
(function () {
  const PID = "full_tank_edition";
  const native = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
  if (native) {
    let ready = null; const waiters = [];
    const init = () => ready || (ready = new Promise((res, rej) => {
      const go = () => {
        const C = window.CdvPurchase; if (!C) return rej(new Error("Billing plugin missing"));
        const { store, ProductType, Platform } = C;
        store.register([{ id: PID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
        store.when()
          .approved(t => t.finish())                                    // PURCHASED: acknowledge with Google Play
          .finished(() => waiters.splice(0).forEach(w => w("done")))
          .pending(() => waiters.splice(0).forEach(w => w("pending")));
        store.error(e => console.warn("billing", e && e.code, e && e.message));
        store.initialize([Platform.GOOGLE_PLAY]).then(() => res(C), rej);
      };
      if (window.CdvPurchase) go(); else document.addEventListener("deviceready", go, { once: true });
      setTimeout(() => rej(new Error("Billing timed out")), 8000);
    }));
    const pending = C => (C.store.localReceipts || []).some(r => (r.transactions || []).some(t => t.state === C.TransactionState.PENDING && (t.products || []).some(p => p.id === PID)));
    window.SLBilling = {
      async query() {
        try {
          const C = await init(); await C.store.update();
          const p = C.store.get(PID, C.Platform.GOOGLE_PLAY); if (!p) return { error: true };
          const owned = !!p.owned;
          return { price: p.pricing && p.pricing.price, owned, acknowledged: owned, pending: !owned && pending(C) };
        } catch (e) { return { error: true }; }
      },
      async purchase() {
        try {
          const C = await init(), p = C.store.get(PID, C.Platform.GOOGLE_PLAY), offer = p && p.getOffer();
          if (!offer) return { error: true, why: "" };
          const done = new Promise(r => { waiters.push(r); setTimeout(() => r("timeout"), 120000); });
          const err = await offer.order();
          if (err) return err.code === C.ErrorCode.PAYMENT_CANCELLED ? { cancelled: true } : { error: true, why: "" };
          const how = await done;
          if (how === "done" || C.store.owned(PID)) return { ok: true, acknowledged: true };
          return { pending: true };
        } catch (e) { return { error: true, why: "" }; }
      },
      async restore() { try { const C = await init(); await C.store.restorePurchases(); } catch (e) {} },
    };
    return;
  }
  if (!window.SL_PREVIEW_STORE) return;
  // ---- preview store: only in the artifact build, always labelled, never real money ----
  const K = "shotleft.preview.ft";
  const get = () => { try { return localStorage.getItem(K) || "none"; } catch { return "none"; } };
  const set = v => { try { localStorage.setItem(K, v); } catch {} };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  window.SLBilling = {
    preview: true,
    async query() { await wait(700); const s = get(); return { price: "R29,00", owned: s === "owned", acknowledged: true, pending: s === "pending" }; },
    purchase() {
      return new Promise(res => {
        const pick = v => () => { if (v === "buy") { set("owned"); res({ ok: true, acknowledged: true }); } else if (v === "pending") { set("pending"); res({ pending: true }); } else if (v === "error") res({ error: true }); else res({ cancelled: true }); };
        Shell.dialog({ title: STR.stPreviewTitle, body: STR.stPreviewBody, dismiss: false,
          actions: [{ label: STR.stPreviewBuy, fn: pick("buy") }, { label: STR.stPreviewPending, kind: "secondary", fn: pick("pending") }, { label: STR.stPreviewError, kind: "secondary", fn: pick("error") }, { label: STR.stPreviewCancel, kind: "secondary", fn: pick("cancel") }] });
      });
    },
    async restore() {},
    reset() { set("none"); }, clearPending() { if (get() === "pending") set("owned"); },
  };
})();
