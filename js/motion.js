/* ============================================================
   GECKO Motion — 卡片 3D 倾斜 / 视口显现 / 数字滚动 / sparkline 描边
   视图渲染后调用 GECKO.motion.refresh(root)
   ============================================================ */
window.GECKO = window.GECKO || {};

(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 卡片 3D 倾斜（鼠标跟随 + 光斑） ---------- */
  const TILT_MAX = 5.5;
  function bindTilt(root) {
    if (reduce) return;
    (root || document).querySelectorAll(".card.hoverable:not(.tilt), .tilt-auto:not(.tilt)").forEach((el) => {
      el.classList.add("tilt");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
        const py = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
        el.style.setProperty("--rx", (-py * TILT_MAX).toFixed(2) + "deg");
        el.style.setProperty("--ry", (px * TILT_MAX).toFixed(2) + "deg");
        el.style.setProperty("--mx", ((px + 0.5) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((py + 0.5) * 100).toFixed(1) + "%");
      }, { passive: true });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }, { passive: true });
    });
  }

  /* ---------- 2. 视口显现 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });

  function bindReveal(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.in)");
    els.forEach((el, i) => {
      if (reduce) { el.classList.add("in"); return; }
      el.style.transitionDelay = Math.min(8, i % 8) * 45 + "ms";
      io.observe(el);
    });
  }

  /* ---------- 3. 数字滚动 ---------- */
  function countUps(root) {
    (root || document).querySelectorAll(".stat-num[data-count]:not(.counted)").forEach((el) => {
      el.classList.add("counted");
      const target = parseFloat(el.dataset.count) || 0;
      if (reduce || target === 0) { el.textContent = String(target); return; }
      const start = performance.now();
      const dur = 900;
      const from = 0;
      function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(from + (target - from) * eased);
        el.textContent = v.toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- 4. sparkline 描边动画 ---------- */
  function animateSparklines(root) {
    if (reduce) return;
    (root || document).querySelectorAll("svg.spark:not(.drawn)").forEach((svg) => {
      svg.classList.add("drawn");
      svg.querySelectorAll("path").forEach((path, i) => {
        if (path.getAttribute("fill") && path.getAttribute("fill") !== "none") return;
        try {
          const len = path.getTotalLength();
          if (!len || len > 2000) return;
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
          path.style.transition = "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1) " + (i * 60) + "ms";
          requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
        } catch (e) { /* ignore */ }
      });
    });
  }

  /* ---------- 5. 视图切换过渡 ---------- */
  function enterView(root) {
    if (!root) return;
    root.querySelectorAll(".section, .report-section, .glass, .hero").forEach((el, i) => {
      if (el.dataset.mIn) return;
      el.dataset.mIn = "1";
      el.classList.add("reveal");
    });
    bindReveal(root);
  }

  function refresh(root) {
    const scope = root || document;
    bindTilt(scope);
    bindReveal(scope);
    countUps(scope);
    animateSparklines(scope);
  }

  window.GECKO.motion = { refresh, enterView, countUps };

  // 首次渲染
  document.addEventListener("DOMContentLoaded", () => {
    refresh(document);
    setTimeout(() => refresh(document), 400); // 动态内容二次扫描
  });
})();
