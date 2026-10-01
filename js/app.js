/* ============================================================
   GECKO App — 路由 / 主题 / 粒子 / 全局搜索
   ============================================================ */
(function () {
  const i18n = window.GECKO.i18n;
  const ui = window.GECKO.ui;
  const api = window.GECKO.api;
  window.GECKO.views = window.GECKO.views || {};

  const viewEl = document.getElementById("view");
  let currentRoute = null;

  /* ---------------- 粒子背景（GECKO 鳞片网络） ---------------- */
  function initParticles() {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles = [];
    const COUNT = Math.min(70, Math.floor(window.innerWidth / 22));
    const dark = () => document.documentElement.getAttribute("data-theme") !== "light";

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.r = Math.random() * 1.8 + 0.4;
        this.a = Math.random() * 0.35 + 0.08;
        this.ph = Math.random() * Math.PI * 2;
        this.hue = Math.random() < 0.7 ? "52,211,153" : "34,211,238";
      }
      update() {
        this.x += this.vx; this.y += this.vy; this.ph += 0.02;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        const a = this.a * (0.6 + 0.4 * Math.sin(this.ph)) * (dark() ? 1 : 0.55);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.hue},${a})`;
        ctx.fill();
      }
    }
    for (let i = 0; i < COUNT; i++) particles.push(new P());

    function lines() {
      const max = 170;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < max) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(52,211,153,${(1 - d / max) * (dark() ? 0.07 : 0.05)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    }
    (function loop() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => { p.update(); p.draw(); });
      lines();
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- 主题 ---------------- */
  function initTheme() {
    const saved = localStorage.getItem("gecko.theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    const btn = document.getElementById("themeToggle");
    btn && btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("gecko.theme", next);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) =>
        m.setAttribute("content", next === "dark" ? "#070b12" : "#f5f8fc"));
    });
  }

  /* ---------------- 语言 ---------------- */
  function initLang() {
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === i18n.lang);
      b.addEventListener("click", () => {
        i18n.setLang(b.dataset.lang);
        document.querySelectorAll(".lang-btn").forEach((x) =>
          x.classList.toggle("active", x.dataset.lang === i18n.lang));
        route(); // 重渲染
      });
    });
    document.addEventListener("gecko:lang", () => {
      document.querySelectorAll(".lang-btn").forEach((x) =>
        x.classList.toggle("active", x.dataset.lang === i18n.lang));
    });
  }

  /* ---------------- 路由 ---------------- */
  const ROUTES = {
    "": "home", "/": "home",
    "/feed": "feed",
    "/trends": "trends",
    "/research": "research", "/models": "models", "/projects": "projects",
    "/organizations": "organizations", "/benchmarks": "benchmarks",
    "/sources": "sources", "/about": "about",
    "/reports": "reports", "/ask": "ask", "/deep-research": "deep",
    "/search": "search",
  };

  function parseHash() {
    let h = location.hash.replace(/^#/, "");
    if (!h) h = "/";
    const [pathPart, queryPart] = h.split("?");
    const params = {};
    (queryPart || "").split("&").forEach((kv) => {
      if (!kv) return;
      const [k, v] = kv.split("=");
      params[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
    });
    const parts = pathPart.split("/").filter(Boolean);
    let name = ROUTES["/" + (parts[0] || "")];
    // /reports/<date>
    if (parts[0] === "reports" && parts[1]) { name = "report"; params.date = parts[1]; }
    if (parts[0] === "entities" && parts[1]) { name = "research"; params.q = parts[1]; }
    if (!name) name = ROUTES["/" + parts.slice(0, 1).join("")] || "home";
    return { name, params, raw: h };
  }

  const VIEW_MAP = {
    home: () => window.GECKO.views.home,
    feed: () => window.GECKO.views.feed,
    trends: () => window.GECKO.views.trends,
    research: () => window.GECKO.views.lib,
    models: () => window.GECKO.views.lib,
    projects: () => window.GECKO.views.lib,
    organizations: () => window.GECKO.views.lib,
    benchmarks: () => window.GECKO.views.lib,
    sources: () => window.GECKO.views.lib,
    about: () => window.GECKO.views.lib,
    reports: () => window.GECKO.views.reports,
    report: () => window.GECKO.views.reports,
    ask: () => window.GECKO.views.ask,
    deep: () => window.GECKO.views.ask,
    search: () => window.GECKO.views.searchView,
  };

  let navToken = 0;
  async function route() {
    const r = parseHash();
    if (r.raw === currentRoute) return;
    currentRoute = r.raw;
    const token = ++navToken;

    // 导航高亮
    document.querySelectorAll(".main-nav a, .nav-more-menu a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      a.classList.toggle("active", href === "#" + r.raw || (href === "#/" && r.raw === "/"));
    });

    const factory = VIEW_MAP[r.name] || VIEW_MAP.home;
    const view = factory();
    if (!view || typeof view.render !== "function") {
      viewEl.innerHTML = ui.emptyState();
      return;
    }
    viewEl.scrollTop = 0;
    window.scrollTo({ top: 0 });
    try {
      await view.render(viewEl, r.params, r, () => token === navToken);
    } catch (err) {
      console.error(err);
      if (token === navToken) viewEl.innerHTML = `<div class="empty">${ui.esc(i18n.t("common.fetch_error"))}</div>`;
    }
  }

  /* ---------------- 全局搜索 ---------------- */
  function initSearch() {
    const overlay = document.getElementById("searchOverlay");
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    const btn = document.getElementById("searchBtn");

    function open() { overlay.classList.add("open"); input.value = ""; results.innerHTML = ""; input.focus(); }
    function close() { overlay.classList.remove("open"); }
    function go(href) { close(); location.hash = href; }

    btn && btn.addEventListener("click", open);
    overlay && overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
          document.activeElement !== input && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        e.preventDefault(); open();
      }
    });

    let timer = null;
    input && input.addEventListener("input", () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { results.innerHTML = ""; return; }
      timer = setTimeout(async () => {
        results.innerHTML = `<div class="search-hint">${ui.esc(i18n.t("common.loading"))}</div>`;
        const hits = await search(q, 14);
        if (!hits.length) {
          results.innerHTML = `<div class="search-hint">${ui.esc(i18n.t("common.no_result"))}</div>`;
          return;
        }
        results.innerHTML = hits.map((h, i) => `
          <div class="search-item" data-idx="${i}" tabindex="0">
            <div class="si-title">${h.type === "event" ? "🧩 " : h.type === "entity" ? "🔗 " : "📄 "}${ui.esc(h.title)}</div>
            <div class="si-sub"><span>${ui.esc(h.sub || "")}</span><span class="mono">${ui.esc(h.meta || "")}</span></div>
          </div>`).join("");
        results.querySelectorAll(".search-item").forEach((el) => {
          el.addEventListener("click", () => go(hits[+el.dataset.idx].href));
        });
      }, 160);
    });
    input && input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = results.querySelector(".search-item");
        if (first) first.click();
        else if (input.value.trim()) go(`#/search?q=${encodeURIComponent(input.value.trim())}`);
      }
    });
  }

  async function search(q, limit) {
    const ql = q.toLowerCase();
    const { docs, events } = await api.searchIndex(14);
    const ents = await api.entities();
    const hits = [];
    const scoreText = (s) => {
      const t = String(s || "").toLowerCase();
      if (!t) return 0;
      if (t.startsWith(ql)) return 3;
      if (t.includes(ql)) return 2;
      return 0;
    };
    (events || []).forEach((e) => {
      const s = scoreText(e.title) * 2 + scoreText(e.canonical_description);
      if (s > 0) hits.push({ type: "event", title: e.title, sub: (e.sources || []).join(" · "),
        meta: ui.relTime(e.last_seen_at), href: `#/search?q=${encodeURIComponent(e.title)}`, s: s + (e.importance_score || 0) });
    });
    (docs || []).forEach((d) => {
      const s = scoreText(d.title) * 2 + scoreText(d.summary);
      if (s > 0) hits.push({ type: "doc", title: d.title, sub: d.source,
        meta: ui.relTime(d.published_at), href: d.url, s: s + (d.importance_score || 0) * 0.5 });
    });
    ((ents && ents.entities) || []).forEach((e) => {
      const s = scoreText(e.name) * 3;
      if (s > 0) hits.push({ type: "entity", title: e.name, sub: e.type,
        meta: `${e.doc_count} docs`, href: `#/search?q=${encodeURIComponent(e.name)}`, s: s + e.doc_count * 0.01 });
    });
    hits.sort((a, b) => b.s - a.s);
    return hits.slice(0, limit || 20);
  }

  /* ---------------- 其它 ---------------- */
  function initMobileNav() {
    const t = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");
    t && t.addEventListener("click", () => nav.classList.toggle("open"));
    nav && nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open")));
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  async function initFooter() {
    const idx = await api.index();
    const el = document.getElementById("footerUpdated");
    if (el && idx && idx.updated_at) {
      el.textContent = `${i18n.t("common.updated")} ${ui.fmtDateTime(idx.updated_at)}`;
    }
  }

  /* ---------------- 引导 ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initParticles();
    initTheme();
    initLang();
    initSearch();
    initMobileNav();
    initFooter();
    i18n.apply();
    if (!location.hash) location.hash = "#/";
    route();
    document.addEventListener("gecko:navigate", route);
    window.addEventListener("hashchange", route);
  });

  window.GECKO.app = { route, toast, search, go: (href) => { location.hash = href; } };
})();
