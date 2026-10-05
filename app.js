(() => {
  "use strict";

  const cfg = window.INVITE_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  // ───────── Artwork: one transparent PNG (1091×1442) cut into layers by region ─────────
  const BG = { src: "assets/bg.png", w: 1091, h: 1442 };
  const S = 576 / BG.w; // image px → design units (card is 576 units wide)

  function sprite(el, img, [x, y, w, h]) {
    el.style.backgroundImage = `url("${img.src}")`;
    el.style.backgroundSize = `${(img.w / w) * 100}% ${(img.h / h) * 100}%`;
    el.style.backgroundPosition = `${w >= img.w ? 0 : (x / (img.w - w)) * 100}% ${h >= img.h ? 0 : (y / (img.h - h)) * 100}%`;
  }

  // Corner layers, each lifted to its own depth for parallax.
  const LAYERS = {
    tl: { r: [0, 0, 440, 575], z: 30 },
    tr: { r: [815, 0, 276, 470], z: 22 },
    bl: { r: [0, 865, 420, 577], z: 26 },
    br: { r: [605, 925, 486, 517], z: 36 },
  };

  const MAPS = cfg.mapsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("SDB Grand Palace, Devaraj Nagar, Agaram Main Road, Selaiyur, Tambaram, Chennai 600073");
  const ADDRESS = "SDB Grand Palace, No.22, Devaraj Nagar, Agaram Main Road, Selaiyur, Tambaram, Chennai - 600073";

  const ITEMS = [
    { id: "ganesha", kind: "tile", hd: "assets/hd/ganesha.webp", r: [105, 150, 260, 335],
      ta: "பிள்ளையார்", tl: "Pillaiyar", title: "Lord Ganesha",
      body: "Every Tamil wedding begins with a prayer to Pillaiyar, the remover of obstacles. His mark sits at the top of the invitation so that everything that follows goes smoothly." },
    { id: "leaves", kind: "tile", hd: "assets/hd/leaves.webp", r: [0, 0, 440, 575], hs: [["tl", [30, 40, 300, 380]]],
      ta: "வாழை", tl: "Vazhai", title: "Banana leaves",
      body: "Banana trees heavy with fruit are tied at the entrance of the wedding hall. The plant keeps sending up new shoots, so it stands for a family that grows and prospers for generations. The wedding feast is served on its leaf, too." },
    { id: "marigold", kind: "tile", hd: "assets/hd/marigold.webp", r: [22, 1178, 130, 130], hs: [["bl", [30, 1185, 115, 115]], ["tr", [1010, 185, 75, 70]]],
      ta: "சாமந்தி", tl: "Saamandhi", title: "Marigold",
      body: "Golden marigolds are strung into the garlands and the mandapam decoration. Their saffron colour is the colour of auspicious beginnings." },
    { id: "jasmine", kind: "tile", hd: "assets/hd/jasmine.webp", r: [8, 1055, 130, 130], hs: [["bl", [30, 1080, 85, 80]], ["tr", [965, 95, 70, 60]]],
      ta: "மல்லிகை", tl: "Malligai", title: "Jasmine",
      body: "Fresh Madurai malli is woven into the bride's hair and into the couple's garlands. Its fragrance stands for purity and love, and it fills the hall all day." },
    { id: "lotus", kind: "tile", hd: "assets/hd/lotus.webp", r: [90, 1088, 130, 130], hs: [["bl", [120, 1115, 70, 75]], ["tr", [838, 25, 62, 55]]],
      ta: "தாமரை மொட்டு", tl: "Thamarai mottu", title: "Lotus buds",
      body: "The lotus rises clean out of muddy water. Its buds stand for grace, new beginnings and the blessings of Goddess Lakshmi on the new home." },
    { id: "strands", kind: "tile", hd: "assets/hd/strands.webp", r: [961, 260, 130, 200], hs: [["tr", [1005, 340, 70, 120]]],
      ta: "தோரணம்", tl: "Thoranam", title: "Gold strands",
      body: "Strings of gold beads hang from the garland like the festoons over a temple doorway, welcoming everyone into a house of celebration." },
    { id: "saree", kind: "tile", hd: "assets/hd/saree.webp", r: [745, 1040, 280, 230], hs: [["br", [770, 1070, 190, 160]]],
      ta: "கூறைப் புடவை", tl: "Koorai pudavai", title: "Silk saree",
      body: "The koorai pudavai is the silk saree given by the groom's family. The bride changes into it for the muhurtham, the moment the thaali is tied. It arrives on a brass tray with the rest of the seer gifts." },
    { id: "veshti", kind: "tile", hd: "assets/hd/veshti.webp", r: [925, 1160, 166, 250], hs: [["br", [940, 1225, 145, 165]]],
      ta: "பட்டு வேட்டி", tl: "Pattu veshti", title: "Silk veshti",
      body: "The groom's silk veshti and angavastram, white with a gold zari border, are given to him on the wedding day as part of the seer." },
    { id: "sweets", kind: "tile", hd: "assets/hd/sweets.webp", r: [845, 1245, 130, 130], hs: [["br", [860, 1265, 95, 95]]],
      ta: "சீர் பட்சணம்", tl: "Seer bakshanam", title: "Wedding sweets",
      body: "Trays of laddu, athirasam and other sweets come with the seer from the bride's family, and are shared with relatives and guests." },
    { id: "betel", kind: "tile", hd: "assets/hd/betel.webp", r: [934, 1054, 130, 130], hs: [["br", [960, 1080, 62, 62]]],
      ta: "வெற்றிலை பாக்கு", tl: "Vetrilai paakku", title: "Betel leaves & areca nut",
      body: "Betel leaves and areca nut are exchanged when the families fix the wedding, and every guest takes some home in the thamboolam bag as thanks." },
    { id: "manjal", kind: "tile", hd: "assets/hd/manjal.webp", r: [961, 1106, 130, 130], hs: [["br", [1008, 1140, 80, 60]]],
      ta: "மஞ்சள் குங்குமம்", tl: "Manjal kungumam", title: "Turmeric & kumkum",
      body: "Turmeric and kumkum are signs of a blessed marriage. They are offered to married women at the wedding, and the sacred thread of the thaali is dipped in turmeric." },
    { id: "reception", kind: "calendar", month: "NOV", day: "14", weekday: "Saturday",
      ta: "வரவேற்பு", tl: "Varaverpu", title: "Reception",
      body: "Saturday, 14th November 2026, 7 PM to 9 PM at SDB Grand Palace. Come meet the couple, with dinner and music.",
      cal: { text: "Sindhu & Anand · Reception", start: "20261114T133000Z", end: "20261114T153000Z" } },
    { id: "wedding", kind: "calendar", month: "NOV", day: "15", weekday: "Sunday",
      ta: "முகூர்த்தம்", tl: "Muhurtham", title: "Wedding",
      body: "Sunday, 15th November 2026, 9:45 AM to 11:15 AM at SDB Grand Palace. The thaali is tied during this auspicious window, so please arrive a little early.",
      cal: { text: "Sindhu & Anand · Wedding (Muhurtham)", start: "20261115T041500Z", end: "20261115T054500Z" } },
  ];
  const byId = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

  // Venue opens Google Maps directly.
  $("#venueLink").href = MAPS;

  // ───────── Build the card's art layers + tappable hotspots ─────────
  const artLayers = $("#artLayers");
  const u = (n) => `calc(${(n * S).toFixed(2)} * var(--u))`;
  for (const [id, L] of Object.entries(LAYERS)) {
    const [x, y, w, h] = L.r;
    const el = document.createElement("div");
    el.className = "art";
    el.dataset.layer = id;
    el.style.width = u(w);
    el.style.height = u(h);
    if (id[0] === "t") el.style.top = u(y); else el.style.bottom = u(BG.h - y - h);
    if (id[1] === "l") el.style.left = u(x); else el.style.right = u(BG.w - x - w);
    el.style.setProperty("--z", L.z + "px");
    el.style.setProperty("--zs", (1 - L.z / 1300).toFixed(4));
    const img = document.createElement("div"); // the artwork itself, faded like the print; hotspots stay full strength
    img.className = "art-img";
    sprite(img, BG, L.r);
    el.appendChild(img);
    artLayers.appendChild(el);
  }
  let delay = 0;
  for (const it of ITEMS) {
    for (const [layerId, [hx, hy, hw, hh]] of it.hs || []) {
      const L = LAYERS[layerId].r;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hs";
      b.dataset.item = it.id;
      b.setAttribute("aria-label", `${it.title} — what it means`);
      b.dataset.label = it.title;
      const cx = hx + hw / 2; // keep the hover label inside the card near its edges
      if (cx < 220) b.dataset.align = "start"; else if (cx > 900) b.dataset.align = "end";
      b.style.left = `${((hx - L[0]) / L[2]) * 100}%`;
      b.style.top = `${((hy - L[1]) / L[3]) * 100}%`;
      b.style.width = `max(40px, ${(hw / L[2]) * 100}%)`;
      b.style.height = `max(40px, ${(hh / L[3]) * 100}%)`;
      b.style.setProperty("--delay", (delay = (delay + 0.37) % 2.8).toFixed(2) + "s");
      artLayers.querySelector(`[data-layer="${layerId}"]`).appendChild(b);
    }
  }

  // Seal on the envelope uses the same flower as the card's divider.
  const flowerPath = $(".accent path").getAttribute("d");
  $("#seal").innerHTML = `<svg viewBox="232 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round"><path d="${flowerPath}"/></svg>`;

  // Miniature copy of the card that slides out of the envelope.
  const miniScale = $("#miniScale");
  const clone = $("#cardFace").cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  clone.setAttribute("inert", "");
  clone.setAttribute("aria-hidden", "true");
  miniScale.appendChild(clone);
  // The miniature is the real card laid out at the real card's width, then scaled down,
  // so the two have exactly the same shape and the hand-off between them is seamless.
  const fitMini = () => {
    const m = $("#mini");
    if (!m.clientWidth) return;
    const w = Math.min(576, document.documentElement.clientWidth - 24);
    miniScale.style.width = w + "px";
    const k = m.clientWidth / w;
    miniScale.style.transform = `scale(${k})`;
    m.style.height = miniScale.offsetHeight * k + "px";
  };
  // Where the envelope goes while the card is out: the card clears the envelope completely
  // and the pair is centred on screen (scaled down if they don't fit).
  function liftPlan() {
    const r = env.getBoundingClientRect();
    const mini = $("#mini");
    const gap = 10;
    const lift = (mini.getBoundingClientRect().top - r.top) + mini.offsetHeight + gap;
    const stack = mini.offsetHeight + gap + r.height;
    const s = Math.min(1, (innerHeight - 48) / stack);
    const top = Math.max(24, (innerHeight - stack * s) / 2);
    return { dy: top + s * (mini.offsetHeight + gap) - r.top, s, lift };
  }

  // ───────── Personalisation: ?to=Priya ─────────
  const params = new URLSearchParams(location.search);
  const invitee = (params.get("to") || "").trim().slice(0, 60);
  if (invitee) {
    $("#coverToName").textContent = invitee;
    $("#coverTo").hidden = false;
    $("#env").setAttribute("aria-label", `Open the invitation for ${invitee}`);
  }

  // ───────── Opening sequence ─────────
  const env = $("#env");
  let opened = false;

  function askMotionPermission() {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      D.requestPermission().then((s) => { if (s === "granted") listenGyro(); }).catch(() => {});
    } else if (D) listenGyro();
  }

  // Every envelope animation is kept so closing can play the same motion backwards.
  const envAnims = [];
  const keep = (anim) => { envAnims.push(anim); return anim; };
  let busy = false;
  let openedInstantly = false;
  const fadeIns = () => document.querySelectorAll(".explore, .rsvp-cta, .foot, .to-cover");

  const lockScroll = (on) => document.documentElement.classList.toggle("locked", on);

  let pendingOpen = false;
  let closing = false;
  async function openInvite(instant = false) {
    if (closing) { pendingOpen = true; return; } // still closing: open again as soon as it's done
    if (opened || busy) return;
    busy = true;
    lockScroll(true);
    env.classList.add("is-opening");
    $("#tapHint").classList.add("gone");
    opened = true;
    openedInstantly = instant || reduceMotion;
    askMotionPermission();
    env.style.animation = "none";

    if (!openedInstantly) {
      const inner = $("#envInner");
      await keep(inner.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }], { duration: 320, easing: "ease-in", fill: "forwards" })).finished;
      env.classList.add("show-back");
      fitMini();
      // the card stays hidden while the envelope turns: 3D rotation can defeat the clip
      // that tucks its lower half inside the envelope
      // and while the flap is shut (its anti-aliased edges would show a hairline of the white card)
      $("#mini").style.visibility = "hidden";
      await keep(inner.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0)" }], { duration: 380, easing: "ease-out", fill: "forwards" })).finished;
      await wait(120);
      keep($("#seal").animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.4)" }], { duration: 260, fill: "forwards" }));
      const flapOpen = keep($("#flap").animate([{ transform: "rotateX(0)" }, { transform: "rotateX(180deg)" }], { duration: 620, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }));
      await wait(220);
      $("#mini").style.visibility = "";
      await flapOpen.finished;
      $("#flap").style.zIndex = 1;
      const plan = liftPlan();
      keep(env.animate([
        { transformOrigin: "50% 0", transform: "none" },
        { transformOrigin: "50% 0", transform: `translateY(${plan.dy}px) scale(${plan.s})` },
      ], { duration: 1000, easing: "cubic-bezier(.45,.05,.2,1)", fill: "forwards" }));
      await keep($("#mini").animate([{ transform: "translateY(0)" }, { transform: `translateY(${-plan.lift}px)` }], { duration: 1000, easing: "cubic-bezier(.45,.05,.2,1)", fill: "forwards" })).finished;
    }

    const from = $("#mini").getBoundingClientRect();
    document.body.classList.add("is-open");
    window.scrollTo(0, 0);
    const wrap = $("#cardWrap");
    const to = wrap.getBoundingClientRect();
    if (!openedInstantly && from.width) {
      // the envelope stays on screen under the growing card and fades away
      document.body.classList.add("env-overlay");
      $("#mini").style.visibility = "hidden";
      const stage = $(".cover-stage");
      stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: "ease-out", fill: "forwards" })
        .finished.then(() => { document.body.classList.remove("env-overlay"); stage.getAnimations().forEach((x) => x.cancel()); $("#mini").style.visibility = ""; });
      wrap.animate([
        { transformOrigin: "0 0", transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})` },
        { transformOrigin: "0 0", transform: "none" },
      ], { duration: 850, easing: "cubic-bezier(.2,.8,.2,1)" });
      fadeIns().forEach((el, i) =>
        el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 550 + i * 120, easing: "ease-out", fill: "backwards" }));
      setTimeout(() => petals.burst(70), 450);
    }
    tilt.paused = false;
    startTilt();
    busy = false;
    lockScroll(false);
    preloadHd();
  }

  let hdLoaded = false;
  function preloadHd() {
    if (hdLoaded) return;
    hdLoaded = true;
    const load = () => ITEMS.forEach((it) => { if (it.hd) new Image().src = it.hd; });
    setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(load, { timeout: 3000 }) : load()), 1200);
  }

  // Back to the cover: the card shrinks into the envelope, the flap closes, the envelope turns over.
  async function closeInvite() {
    if (!opened || busy) return;
    busy = true;
    closing = true;
    pendingOpen = false;
    tilt.paused = true;
    if (params.has("open")) { params.delete("open"); history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : "")); }

    const wrap = $("#cardWrap");
    if (scrollY > 0) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      await new Promise((r) => { const t0 = performance.now(); const tick = () => (scrollY < 2 || performance.now() - t0 > 900) ? r() : requestAnimationFrame(tick); tick(); });
    }
    lockScroll(true);
    if (openedInstantly) {
      // No envelope state to rewind: put the envelope back in its closed, front-facing state.
      petals.clear?.();
      if (!reduceMotion) await wrap.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(30px) scale(.9)" }], { duration: 380, easing: "ease-in" }).finished;
      document.body.classList.remove("is-open");
      resetEnvelope();
      if (!reduceMotion) env.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
    } else {
      // 1. the open envelope fades in underneath while the card shrinks onto the lifted miniature
      const to = wrap.getBoundingClientRect();
      document.body.classList.add("env-overlay");
      fitMini();
      const miniEl = $("#mini");
      const mini = miniEl.getBoundingClientRect();
      miniEl.style.visibility = "hidden";
      petals.clear?.();
      const stage = $(".cover-stage");
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
      fadeIns().forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }));
      await wrap.animate([
        { transformOrigin: "0 0", transform: "none" },
        { transformOrigin: "0 0", transform: `translate(${mini.left - to.left}px, ${mini.top - to.top}px) scale(${mini.width / to.width})` },
      ], { duration: 700, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }).finished;
      miniEl.style.visibility = "";
      document.body.classList.remove("is-open", "env-overlay");
      card.style.transform = "";
      wrap.getAnimations().forEach((x) => x.cancel());
      fadeIns().forEach((el) => el.getAnimations().forEach((x) => x.cancel()));

      // 2. rewind the envelope: card slides in, flap closes, seal returns, envelope turns to the front
      const [flip1, flip2, sealA, flapA, dropA, miniA] = envAnims;
      miniA.reverse(); dropA.reverse();
      await miniA.finished;
      $("#flap").style.zIndex = "";
      flapA.reverse();
      await wait(430); // flap has covered the card
      $("#mini").style.visibility = "hidden";
      await flapA.finished;
      sealA.reverse(); await sealA.finished;
      flip2.reverse(); await flip2.finished;
      env.classList.remove("show-back");
      flip1.reverse(); await flip1.finished;
      resetEnvelope();
    }
    opened = false;
    busy = false;
    closing = false;
    env.focus({ preventScroll: true });
    if (pendingOpen) { pendingOpen = false; openInvite(); }
  }

  function resetEnvelope() {
    envAnims.splice(0).forEach((x) => x.cancel());
    env.classList.remove("is-opening");
    $("#mini").style.visibility = "";
    env.classList.remove("show-back");
    $("#flap").style.zIndex = "";
    env.style.animation = "";
    $("#tapHint").classList.remove("gone");
  }

  env.addEventListener("click", () => openInvite());
  $("#tapHint").addEventListener("click", () => openInvite());
  $("#toCover").addEventListener("click", closeInvite);
  // Cover button gets out of the way while reading (scrolling down) and returns on scroll up
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY, btn = $("#toCover");
    if (y > lastY + 6 && y > 60) btn.classList.add("away");
    else if (y < lastY - 6 || y < 60) btn.classList.remove("away");
    lastY = y;
  }, { passive: true });
  if (params.has("open")) { // coming back from the RSVP page: skip the envelope
    queueMicrotask(() => openInvite(true)); // after the rest of this script has set up tilt etc.
    addEventListener("pointerdown", askMotionPermission, { once: true });
  }

  // ───────── Card tilt: gyroscope on phones, pointer on desktop, gentle sway otherwise ─────────
  const card = $("#card");
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, last: 0, running: false, paused: false };
  let gyroBase = null;

  let gyroOn = false;
  function listenGyro() {
    if (gyroOn) return;
    gyroOn = true;
    window.addEventListener("deviceorientation", (e) => {
      if (e.beta == null || e.gamma == null) return;
      if (!gyroBase) gyroBase = { b: e.beta, g: e.gamma };
      gyroBase.b += (e.beta - gyroBase.b) * 0.01; // slowly re-centre
      gyroBase.g += (e.gamma - gyroBase.g) * 0.01;
      tilt.tx = clamp((e.beta - gyroBase.b) * -0.7, -12, 12);
      tilt.ty = clamp((e.gamma - gyroBase.g) * 0.8, -14, 14);
      tilt.last = performance.now();
    });
  }
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !opened) return;
    const r = card.getBoundingClientRect();
    tilt.tx = clamp(((e.clientY - (r.top + r.height / 2)) / innerHeight) * -14, -10, 10);
    tilt.ty = clamp(((e.clientX - (r.left + r.width / 2)) / innerWidth) * 18, -12, 12);
    tilt.last = performance.now();
  });

  function startTilt() {
    if (reduceMotion || tilt.running) return;
    tilt.running = true;
    const frame = (t) => {
      if (!tilt.paused) {
        if (t - tilt.last > 2500) { // idle sway
          tilt.tx = Math.sin(t / 2600) * 3;
          tilt.ty = Math.cos(t / 3300) * 5;
        }
        tilt.x += (tilt.tx - tilt.x) * 0.07;
        tilt.y += (tilt.ty - tilt.y) * 0.07;
        card.style.transform = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // ───────── Inspector: 3D object + callout ─────────
  const insp = $("#inspector");
  const stage = $("#inspStage");
  const pop = $("#objPop");
  const order = ITEMS.map((i) => i.id);
  let current = null;
  let lastFocus = null;
  let obj = null;
  const rot = { x: -8, y: 0, vx: 0, vy: 0, dragging: false, px: 0, py: 0 };

  function layer(cls, z) {
    const d = document.createElement("div");
    d.className = "ly " + cls;
    d.style.transform = `translateZ(${z}px)`;
    return d;
  }

  // Every illustration opens as a shimmering card showing its upscaled artwork; the dates as a desk calendar.
  function buildObject(it) {
    const sr = stage.getBoundingClientRect();
    const box = Math.max(170, Math.min(sr.width * 0.72, sr.height * 0.74, 440));
    const o = document.createElement("div");
    o.className = "obj tile";
    let w = box, h = box;
    if (it.kind === "tile") {
      const ar = it.r[2] / it.r[3];
      if (ar > 1) h = box / ar; else w = box * ar;
    } else { w = box * 0.78; h = box * 0.92; }
    o.style.width = w + "px";
    o.style.height = h + "px";

    for (let i = 10; i >= 1; i--) o.appendChild(layer("slab edge", -i * 1.4));
    const f = layer("face", 0);
    if (it.kind === "tile") {
      f.style.backgroundImage = `url("${it.hd}")`;
      f.style.backgroundSize = "100% 100%";
    } else {
      f.classList.add("cal-face");
      f.innerHTML = `<div class="cal-top">${it.month} 2026</div><div class="cal-num">${it.day}</div><div class="cal-day">${it.weekday}</div>`;
    }
    o.appendChild(f);
    const shine = document.createElement("div"); shine.className = "ly shine"; shine.style.transform = "translateZ(1px)";
    o.appendChild(shine);
    const shadow = document.createElement("div"); shadow.className = "shadow"; o.appendChild(shadow);
    return o;
  }


  function icsFor(it) {
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sindhu & Anand//Invite//EN", "BEGIN:VEVENT",
      `UID:${it.id}-sindhu-anand-2026@invite`, `DTSTAMP:${now}`, `DTSTART:${it.cal.start}`, `DTEND:${it.cal.end}`,
      `SUMMARY:${it.cal.text}`, `LOCATION:${ADDRESS.replace(/,/g, "\\,")}`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
  }

  function actionsFor(it) {
    const box = $("#cActions");
    box.innerHTML = "";
    const link = (label, href, primary) => {
      const a = document.createElement("a");
      a.textContent = label; a.href = href; a.target = "_blank"; a.rel = "noopener";
      if (primary) a.className = "primary";
      box.appendChild(a); return a;
    };
    if (it.kind === "calendar") {
      const q = new URLSearchParams({ action: "TEMPLATE", text: it.cal.text, dates: `${it.cal.start}/${it.cal.end}`, location: ADDRESS, details: "Wedding of Sindhu & Anand" });
      link("Add to Google Calendar", "https://calendar.google.com/calendar/render?" + q, true);
      const a = link("Apple / Outlook (.ics)", URL.createObjectURL(new Blob([icsFor(it)], { type: "text/calendar" })));
      a.download = `sindhu-anand-${it.id}.ics`; a.removeAttribute("target");
    }
    box.hidden = !box.children.length;
  }

  function show(id) {
    const it = byId[id];
    current = id;
    $("#cTa").textContent = it.ta;
    $("#cTl").textContent = it.tl;
    $("#cTitle").textContent = it.title;
    $("#cBody").textContent = it.body;
    $("#cCount").textContent = `${order.indexOf(id) + 1} / ${order.length}`;
    actionsFor(it);
    pop.innerHTML = "";
    obj = buildObject(it);
    pop.appendChild(obj);
    rot.x = -3; rot.y = -6; rot.vy = 0; rot.vx = 0; // settle almost face-on so the art is easy to see
    pop.style.animation = "none"; void pop.offsetWidth; pop.style.animation = "";
  }

  function openInspector(id) {
    lastFocus = document.activeElement;
    insp.hidden = false;
    document.documentElement.style.overflow = "hidden";
    tilt.paused = true;
    show(id);
    requestAnimationFrame(() => insp.classList.add("on"));
    $("#closeBtn").focus({ preventScroll: true });
    spin();
  }
  function closeInspector() {
    insp.classList.remove("on");
    tilt.paused = false;
    document.documentElement.style.overflow = "";
    setTimeout(() => { insp.hidden = true; pop.innerHTML = ""; obj = null; }, 300);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  const step = (d) => show(order[(order.indexOf(current) + d + order.length) % order.length]);

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-item]");
    if (!t || t.closest(".mini") || !opened || busy) return;
    t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
    openInspector(t.dataset.item);
  });
  $("#closeBtn").onclick = closeInspector;
  $("#prevBtn").onclick = () => step(-1);
  $("#nextBtn").onclick = () => step(1);
  document.addEventListener("keydown", (e) => {
    if (insp.hidden) return;
    if (e.key === "Escape") closeInspector();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "Tab") { // keep focus in the dialog
      const f = [...insp.querySelectorAll("button, a[href]")].filter((n) => n.offsetParent);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
    }
  });

  // drag to turn; a quick horizontal swipe on the stage also spins
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    rot.dragging = true; rot.px = e.clientX; rot.py = e.clientY; rot.vx = rot.vy = 0;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!rot.dragging) return;
    const dx = e.clientX - rot.px, dy = e.clientY - rot.py;
    rot.px = e.clientX; rot.py = e.clientY;
    rot.y += dx * 0.6; rot.x = clamp(rot.x - dy * 0.4, -60, 60);
    rot.vy = dx * 0.6; rot.vx = -dy * 0.2;
  });
  const endDrag = () => { rot.dragging = false; };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  let spinning = false;
  function spin() {
    if (spinning) return;
    spinning = true;
    const frame = (t) => {
      if (insp.hidden) { spinning = false; return; }
      if (obj) {
        if (!rot.dragging) {
          rot.y += rot.vy; rot.x += rot.vx;
          rot.vy *= 0.95; rot.vx *= 0.9;
          if (Math.abs(rot.vy) < 0.15) {
            const idleY = reduceMotion ? 0 : Math.sin(t / 2600) * 5; // a gentle sway, just enough to catch the shimmer
            const idleX = -2 + (reduceMotion ? 0 : Math.sin(t / 3400) * 1.5);
            rot.y = idleY + ((((rot.y - idleY + 180) % 360) + 360) % 360) - 180;
            rot.y += (idleY - rot.y) * 0.03;
            rot.x += (idleX - rot.x) * 0.04;
          }
        }
        // very subtle life: the card floats a few pixels and the light drifts slowly across it
        const float = reduceMotion ? 0 : Math.sin(t / 1900) * 3;
        const drift = reduceMotion ? 0 : Math.sin(t / 3200) * 18;
        obj.style.transform = `translateY(${float.toFixed(2)}px) rotateX(${rot.x.toFixed(2)}deg) rotateY(${rot.y.toFixed(2)}deg)`;
        obj.style.setProperty("--sx", `${(50 + drift - (((rot.y % 360) + 540) % 360 - 180) * 0.8).toFixed(1)}%`);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const petals = window.Petals;

  // ───────── Couple photo (tap the names) ─────────
  const photoBox = $("#photoBox");
  const print = $("#print");
  let photoFocus = null;
  function openPhoto() {
    photoFocus = document.activeElement;
    photoBox.hidden = false;
    document.documentElement.style.overflow = "hidden";
    tilt.paused = true;
    requestAnimationFrame(() => photoBox.classList.add("on"));
    $("#photoClose").focus({ preventScroll: true });
    petals.burst(40);
  }
  function closePhoto() {
    photoBox.classList.remove("on");
    tilt.paused = false;
    document.documentElement.style.overflow = "";
    setTimeout(() => { photoBox.hidden = true; print.style.transform = ""; }, 350);
    if (photoFocus) photoFocus.focus({ preventScroll: true });
  }
  $("#names").addEventListener("click", openPhoto);
  $("#photoClose").onclick = closePhoto;
  photoBox.addEventListener("click", (e) => { if (e.target === photoBox) closePhoto(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !photoBox.hidden) closePhoto(); });
  // the print leans toward the pointer / finger
  photoBox.addEventListener("pointermove", (e) => {
    if (reduceMotion) return;
    const r = print.getBoundingClientRect();
    const rx = clamp(((e.clientY - (r.top + r.height / 2)) / r.height) * -10, -8, 8);
    const ry = clamp(((e.clientX - (r.left + r.width / 2)) / r.width) * 12, -10, 10);
    print.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  photoBox.addEventListener("pointerleave", () => { print.style.transform = ""; });

  // ───────── RSVP button (the form lives on rsvp.html) ─────────
  $("#rsvpBy").textContent = cfg.rsvpBy || "1st November 2026";
  const rsvpUrl = new URL("rsvp.html", location.href);
  if (invitee) rsvpUrl.searchParams.set("to", invitee);
  $("#rsvpBtn").href = rsvpUrl.pathname.split("/").pop() + rsvpUrl.search;
  const answered = store.get("rsvp");
  if (answered && answered.name) {
    $("#rsvpBtn").textContent = "View or change your RSVP";
    $("#rsvpStatus").textContent = answered.attending === "Yes"
      ? `You've replied: attending, ${answered.guests} ${answered.guests === "1" ? "guest" : "guests"}. Thank you!`
      : "You've replied: can't make it. Thank you for letting us know.";
    $("#rsvpStatus").hidden = false;
  }

  // ───────── Visitor count (one count per device) ─────────
  (async () => {
    const seenKey = cfg.sheetUrl ? "visited-sheet" : "visited";
    const seen = store.get(seenKey);
    const action = seen ? "get" : "hit";
    const url = cfg.sheetUrl
      ? `${cfg.sheetUrl}?action=${action}`
      : `https://abacus.jasoncameron.dev/${action}/${encodeURIComponent(cfg.counterKey || "sindhu-anand-2026")}/visits`;
    try {
      const res = await fetch(url);
      const j = await res.json();
      const n = Number(j.value ?? j.count);
      if (n > 0) {
        $("#visits").textContent = `${n.toLocaleString("en-IN")} ${n === 1 ? "visitor" : "visitors"} so far`;
        store.set(seenKey, true);
      }
    } catch { /* counter is optional */ }
  })();
})();
