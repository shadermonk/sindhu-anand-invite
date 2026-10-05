// Falling petals (marigold, jasmine, rose) drawn on #petals.
window.Petals = (() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s) => document.querySelector(s);
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
    function clear() { ps = []; }
    return { burst, clear };
})();

