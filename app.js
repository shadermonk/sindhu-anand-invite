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
  const GANESHA = { src: "assets/ganesha.png", w: 450, h: 555 };
  const S = 576 / BG.w; // image px → design units (card is 576 units wide)

  function sprite(el, img, [x, y, w, h]) {
    el.style.backgroundImage = `url("${img.src}")`;
    el.style.backgroundSize = `${(img.w / w) * 100}% ${(img.h / h) * 100}%`;
    el.style.backgroundPosition = `${w >= img.w ? 0 : (x / (img.w - w)) * 100}% ${h >= img.h ? 0 : (y / (img.h - h)) * 100}%`;
  }
  const square = ([x, y, w, h]) => { const s = Math.max(w, h); return [x + w / 2 - s / 2, y + h / 2 - s / 2, s, s]; };

  // Corner layers, each lifted to its own depth for parallax.
  const LAYERS = {
    tl: { r: [0, 0, 440, 575], z: 30 },
    tr: { r: [815, 0, 276, 470], z: 22 },
    bl: { r: [0, 865, 420, 577], z: 26 },
    br: { r: [605, 925, 486, 517], z: 36 },
  };

  const MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("SDB Grand Palace, Devaraj Nagar, Agaram Main Road, Selaiyur, Tambaram, Chennai 600073");
  const ADDRESS = "SDB Grand Palace, No.22, Devaraj Nagar, Agaram Main Road, Selaiyur, Tambaram, Chennai - 600073";

  const ITEMS = [
    { id: "ganesha", kind: "cutout", img: GANESHA, r: [105, 150, 260, 335],
      ta: "பிள்ளையார்", tl: "Pillaiyar", title: "Lord Ganesha",
      body: "Every Tamil wedding begins with a prayer to Pillaiyar, the remover of obstacles. His mark sits at the top of the invitation so that everything that follows goes smoothly." },
    { id: "leaves", kind: "cutout", r: LAYERS.tl.r, hs: [["tl", [30, 40, 300, 380]]],
      ta: "வாழை", tl: "Vazhai", title: "Banana leaves",
      body: "Banana trees heavy with fruit are tied at the entrance of the wedding hall. The plant keeps sending up new shoots, so it stands for a family that grows and prospers for generations. The wedding feast is served on its leaf, too." },
    { id: "marigold", kind: "coin", r: [30, 1185, 115, 115], hs: [["bl", [30, 1185, 115, 115]], ["tr", [1010, 185, 75, 70]]],
      ta: "சாமந்தி", tl: "Saamandhi", title: "Marigold",
      body: "Golden marigolds are strung into the garlands and the mandapam decoration. Their saffron colour is the colour of auspicious beginnings." },
    { id: "jasmine", kind: "coin", r: [30, 1080, 85, 80], hs: [["bl", [30, 1080, 85, 80]], ["tr", [965, 95, 70, 60]]],
      ta: "மல்லிகை", tl: "Malligai", title: "Jasmine",
      body: "Fresh Madurai malli is woven into the bride's hair and into the couple's garlands. Its fragrance stands for purity and love, and it fills the hall all day." },
    { id: "lotus", kind: "coin", r: [120, 1115, 70, 75], hs: [["bl", [120, 1115, 70, 75]], ["tr", [838, 25, 62, 55]]],
      ta: "தாமரை மொட்டு", tl: "Thamarai mottu", title: "Lotus buds",
      body: "The lotus rises clean out of muddy water. Its buds stand for grace, new beginnings and the blessings of Goddess Lakshmi on the new home." },
    { id: "strands", kind: "cutout", r: [1005, 260, 70, 200], hs: [["tr", [1005, 340, 70, 120]]],
      ta: "தோரணம்", tl: "Thoranam", title: "Gold strands",
      body: "Strings of gold beads hang from the garland like the festoons over a temple doorway, welcoming everyone into a house of celebration." },
    { id: "saree", kind: "tile", r: [745, 1040, 280, 230], hs: [["br", [770, 1070, 190, 160]]],
      ta: "கூறைப் புடவை", tl: "Koorai pudavai", title: "Silk saree",
      body: "The koorai pudavai is the silk saree given by the groom's family. The bride changes into it for the muhurtham, the moment the thaali is tied. It arrives on a brass tray with the rest of the seer gifts." },
    { id: "veshti", kind: "tile", r: [925, 1160, 166, 250], hs: [["br", [940, 1225, 145, 165]]],
      ta: "பட்டு வேட்டி", tl: "Pattu veshti", title: "Silk veshti",
      body: "The groom's silk veshti and angavastram, white with a gold zari border, are given to him on the wedding day as part of the seer." },
    { id: "sweets", kind: "coin", r: [850, 1250, 120, 120], hs: [["br", [860, 1265, 95, 95]]],
      ta: "சீர் பட்சணம்", tl: "Seer bakshanam", title: "Wedding sweets",
      body: "Trays of laddu, athirasam and other sweets come with the seer from the bride's family, and are shared with relatives and guests." },
    { id: "betel", kind: "coin", r: [962, 1082, 75, 75], hs: [["br", [960, 1080, 62, 62]]],
      ta: "வெற்றிலை பாக்கு", tl: "Vetrilai paakku", title: "Betel leaves & areca nut",
      body: "Betel leaves and areca nut are exchanged when the families fix the wedding, and every guest takes some home in the thamboolam bag as thanks." },
    { id: "manjal", kind: "coin", r: [1000, 1138, 91, 65], hs: [["br", [1008, 1140, 80, 60]]],
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
    { id: "venue", kind: "map",
      ta: "மண்டபம்", tl: "Mandapam", title: "SDB Grand Palace",
      body: "No.22, Devaraj Nagar, Agaram Main Road, Selaiyur, Tambaram, Chennai - 600073." },
  ];
  const byId = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

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
    sprite(el, BG, L.r);
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
      b.style.left = `${((hx - L[0]) / L[2]) * 100}%`;
      b.style.top = `${((hy - L[1]) / L[3]) * 100}%`;
      b.style.width = `max(36px, ${(hw / L[2]) * 100}%)`;
      b.style.height = `max(36px, ${(hh / L[3]) * 100}%)`;
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
  const fitMini = () => { const m = $("#mini"); if (m.clientWidth) miniScale.style.transform = `scale(${m.clientWidth / 576})`; };

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

  async function openInvite() {
    if (opened) return;
    opened = true;
    askMotionPermission();
    $("#tapHint").style.visibility = "hidden";
    env.style.animation = "none";

    if (!reduceMotion) {
      const inner = $("#envInner");
      await inner.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }], { duration: 320, easing: "ease-in", fill: "forwards" }).finished;
      env.classList.add("show-back");
      fitMini();
      await inner.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0)" }], { duration: 380, easing: "ease-out", fill: "forwards" }).finished;
      await wait(120);
      $("#seal").animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.4)" }], { duration: 260, fill: "forwards" });
      await $("#flap").animate([{ transform: "rotateX(0)" }, { transform: "rotateX(180deg)" }], { duration: 620, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).finished;
      $("#flap").style.zIndex = 1;
      env.animate([{ transform: "translateY(0)" }, { transform: "translateY(22%)" }], { duration: 900, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" });
      await $("#mini").animate([{ transform: "translateY(0)" }, { transform: "translateY(-64%)" }], { duration: 900, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).finished;
    }

    const from = $("#mini").getBoundingClientRect();
    document.body.classList.add("is-open");
    window.scrollTo(0, 0);
    const wrap = $("#cardWrap");
    const to = wrap.getBoundingClientRect();
    if (!reduceMotion && from.width) {
      wrap.animate([
        { transformOrigin: "0 0", transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
        { transformOrigin: "0 0", transform: "none" },
      ], { duration: 800, easing: "cubic-bezier(.2,.8,.2,1)" });
      document.querySelectorAll(".explore, .rsvp, .foot").forEach((el, i) =>
        el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 550 + i * 120, easing: "ease-out", fill: "backwards" }));
      setTimeout(() => petals.burst(70), 450);
    }
    startTilt();
  }
  env.addEventListener("click", openInvite);
  if (params.has("open")) openInvite();

  // ───────── Card tilt: gyroscope on phones, pointer on desktop, gentle sway otherwise ─────────
  const card = $("#card");
  const tilt = { x: 0, y: 0, tx: 0, ty: 0, last: 0, running: false, paused: false };
  let gyroBase = null;

  function listenGyro() {
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
        card.style.setProperty("--sheen", `${(50 - tilt.y * 5).toFixed(1)}%`);
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

  function buildObject(it) {
    const sr = stage.getBoundingClientRect();
    const box = Math.max(150, Math.min(sr.width * 0.66, sr.height * 0.72, 320));
    const o = document.createElement("div");
    o.className = "obj " + it.kind;
    let w = box, h = box;
    const img = it.img || BG;

    if (it.kind === "cutout" || it.kind === "tile") {
      const ar = it.r[2] / it.r[3];
      if (ar > 1) h = box / ar; else w = box * ar;
    } else if (it.kind === "coin") { w = h = box * 0.86; }
    else { w = box * 0.78; h = box * 0.92; }
    o.style.width = w + "px";
    o.style.height = h + "px";

    if (it.kind === "cutout") {
      for (let i = 9; i >= 1; i--) { const l = layer("edge", -i * 1.6); sprite(l, img, it.r); o.appendChild(l); }
      const f = layer("face", 0); sprite(f, img, it.r); o.appendChild(f);
    } else if (it.kind === "coin") {
      for (let i = 10; i >= 0; i--) o.appendChild(layer("rim" + (i ? " edge-rim" : ""), -i * 1.5));
      const f = layer("face", 0.6); sprite(f, BG, square(it.r)); o.appendChild(f);
    } else {
      for (let i = 10; i >= 1; i--) o.appendChild(layer("slab edge", -i * 1.4));
      const f = layer("face", 0);
      if (it.kind === "tile") sprite(f, BG, it.r);
      else if (it.kind === "calendar") {
        f.classList.add("cal-face");
        f.innerHTML = `<div class="cal-top">${it.month} 2026</div><div class="cal-num">${it.day}</div><div class="cal-day">${it.weekday}</div>`;
      } else {
        f.classList.add("map-face");
        f.innerHTML = `<span class="pond"></span>`;
      }
      o.appendChild(f);
      if (it.kind === "map") {
        const sh = document.createElement("div"); sh.className = "pin-shadow"; o.appendChild(sh);
        const pin = document.createElement("div"); pin.className = "pin";
        pin.innerHTML = `<svg viewBox="0 0 48 64"><path d="M24 2C12 2 3 11 3 23c0 16 21 39 21 39s21-23 21-39C45 11 36 2 24 2z" fill="#7e2a34"/><circle cx="24" cy="23" r="9" fill="#fbe2ad"/></svg>`;
        o.appendChild(pin);
      }
    }
    const shine = document.createElement("div"); shine.className = "ly shine"; shine.style.transform = "translateZ(1px)";
    if (it.kind === "coin") shine.style.borderRadius = "50%";
    if (it.kind !== "cutout") o.appendChild(shine);
    const shadow = document.createElement("div"); shadow.className = "shadow"; o.appendChild(shadow);
    return o;
  }
  // coin rims get the gold gradient via the .rim class
  const styleFix = document.createElement("style");
  styleFix.textContent = ".obj.coin .edge-rim{filter:brightness(.6)}";
  document.head.appendChild(styleFix);

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
    } else if (it.kind === "map") {
      link("Open in Google Maps", MAPS, true);
      const b = document.createElement("button");
      b.type = "button"; b.textContent = "Copy address";
      b.onclick = async () => {
        try { await navigator.clipboard.writeText(ADDRESS); b.textContent = "Copied"; }
        catch { b.textContent = "Couldn't copy"; }
        setTimeout(() => (b.textContent = "Copy address"), 1800);
      };
      box.appendChild(b);
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
    rot.x = -10; rot.y = -25; rot.vy = 3.2; rot.vx = 0;
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
    if (!t || t.closest(".mini") || !opened) return;
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
            const idleY = reduceMotion ? 0 : Math.sin(t / 1500) * 26;
            const idleX = -8 + (reduceMotion ? 0 : Math.sin(t / 2300) * 6);
            rot.y = idleY + ((((rot.y - idleY + 180) % 360) + 360) % 360) - 180;
            rot.y += (idleY - rot.y) * 0.03;
            rot.x += (idleX - rot.x) * 0.04;
          }
        }
        obj.style.transform = `rotateX(${rot.x.toFixed(2)}deg) rotateY(${rot.y.toFixed(2)}deg)`;
        obj.style.setProperty("--sx", `${(50 - (((rot.y % 360) + 540) % 360 - 180) * 0.8).toFixed(1)}%`);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // ───────── Petals (marigold, jasmine, rose) ─────────
  const petals = (() => {
    const c = $("#petals"), ctx = c.getContext("2d");
    const colors = ["#e9a23b", "#f2b84b", "#d9822b", "#fffaf0", "#fff4dc", "#e8a0a8"];
    let ps = [], raf = 0, dpr = 1;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    addEventListener("resize", size); size();
    function burst(n = 50) {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) ps.push({
        x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6,
        r: 4 + Math.random() * 5, vy: 1 + Math.random() * 1.6, sway: Math.random() * 6.28, rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.08, c: colors[(Math.random() * colors.length) | 0],
      });
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps = ps.filter((p) => p.y < innerHeight + 30);
      for (const p of ps) {
        p.sway += 0.03; p.y += p.vy; p.x += Math.sin(p.sway) * 0.9; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.cos(p.sway * 1.3)) * 0.7 + 0.3);
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.92;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      raf = ps.length ? requestAnimationFrame(tick) : 0;
      if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
    return { burst };
  })();
  $("#names").addEventListener("click", () => petals.burst(45));

  // ───────── RSVP ─────────
  const form = $("#rsvpForm");
  const guestsOut = $("#f-guests");
  let guests = 1;
  const setGuests = (n) => {
    guests = clamp(n, 1, 10);
    guestsOut.textContent = guests;
    $("#g-minus").disabled = guests <= 1;
    $("#g-plus").disabled = guests >= 10;
  };
  $("#g-minus").onclick = () => setGuests(guests - 1);
  $("#g-plus").onclick = () => setGuests(guests + 1);
  setGuests(1);
  $("#rsvpBy").textContent = cfg.rsvpBy || "1st November 2026";
  if (invitee) $("#f-name").value = invitee;
  const syncAttending = () => form.classList.toggle("declining", $("#f-no").checked);
  form.addEventListener("change", syncAttending);

  function showThanks(d) {
    const first = d.name.split(/[\s&,]/)[0] || d.name;
    $("#thanksTitle").textContent = d.attending === "Yes" ? `Thank you, ${first}!` : `Thank you, ${first}`;
    if (d.attending === "Yes") {
      const ev = [d.reception === "Yes" && "the reception", d.wedding === "Yes" && "the wedding"].filter(Boolean).join(" and ");
      $("#thanksText").textContent = `We've saved ${d.guests} ${d.guests === "1" ? "seat" : "seats"} for ${ev}. We can't wait to celebrate with you.`;
    } else {
      $("#thanksText").textContent = "We'll miss you there, and we're grateful for your blessings.";
    }
    form.hidden = true;
    $("#thanks").hidden = false;
  }
  const saved = store.get("rsvp");
  if (saved && saved.name) showThanks(saved);
  $("#editRsvp").onclick = () => {
    const d = store.get("rsvp") || {};
    $("#f-name").value = d.name || "";
    $("#f-phone").value = d.phone || "";
    $("#f-msg").value = d.message || "";
    (d.attending === "No" ? $("#f-no") : $("#f-yes")).checked = true;
    $("#f-reception").checked = d.reception !== "No";
    $("#f-wedding").checked = d.wedding !== "No";
    setGuests(Number(d.guests) || 1);
    syncAttending();
    $("#thanks").hidden = true;
    form.hidden = false;
    $("#f-name").focus();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#formMsg");
    msg.textContent = "";
    const name = $("#f-name").value.trim();
    const yes = $("#f-yes").checked;
    if (!name) { msg.textContent = "Please add your name so we know who's coming."; $("#f-name").focus(); return; }
    if (yes && !$("#f-reception").checked && !$("#f-wedding").checked) { msg.textContent = "Pick at least one event, or choose Regretfully decline."; return; }
    const d = {
      name, attending: yes ? "Yes" : "No",
      reception: yes && $("#f-reception").checked ? "Yes" : "No",
      wedding: yes && $("#f-wedding").checked ? "Yes" : "No",
      guests: yes ? String(guests) : "0",
      phone: $("#f-phone").value.trim(),
      message: $("#f-msg").value.trim(),
      invitee,
      updated: store.get("rsvp") ? "Yes" : "No",
    };
    const btn = $("#submitBtn");
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      if (cfg.sheetUrl) {
        await fetch(cfg.sheetUrl, { method: "POST", mode: "no-cors", body: new URLSearchParams(d) });
      } else if (cfg.hostWhatsApp) {
        const lines = [`RSVP for Sindhu & Anand's wedding`, `Name: ${d.name}`, `Attending: ${d.attending}`];
        if (yes) lines.push(`Events: ${[d.reception === "Yes" && "Reception", d.wedding === "Yes" && "Wedding"].filter(Boolean).join(", ")}`, `Guests: ${d.guests}`);
        if (d.message) lines.push(`Wishes: ${d.message}`);
        window.open(`https://wa.me/${cfg.hostWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
      } else {
        throw new Error("not-configured");
      }
      store.set("rsvp", d);
      showThanks(d);
      if (yes) petals.burst(90);
    } catch (err) {
      msg.textContent = err.message === "not-configured"
        ? "RSVP isn't connected yet. Please reply to the family on WhatsApp for now."
        : "Couldn't send your RSVP. Check your connection and try again.";
    } finally {
      btn.disabled = false; btn.textContent = "Send RSVP";
    }
  });

  // ───────── Visitor count (one count per device) ─────────
  (async () => {
    const seen = store.get("visited");
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
        store.set("visited", true);
      }
    } catch { /* counter is optional */ }
  })();
})();
