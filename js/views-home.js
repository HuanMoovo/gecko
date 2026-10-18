/* ============================================================
   View: Home — Dashboard（今日头条 / 趋势雷达 / 最新事件）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  function heroHtml(idx) {
    const s = (idx && idx.stats) || {};
    const llm = idx && idx.llm_enabled;
    const stat = (v, label, accent) =>
      `<div class="stat"><span class="stat-num ${accent ? "accent" : ""}" data-count="${v || 0}">0</span>
       <span class="stat-label">${ui.esc(label)}</span></div>`;
    return `<section class="hero fade-in">
      <div class="hero-grid">
        <div class="hero-copy">
          <div class="hero-eyebrow"><span class="pulse-dot"></span>${ui.esc(i18n.t("hero.eyebrow"))}
            · ${ui.esc(llm ? i18n.t("hero.llm_on") : i18n.t("hero.llm_off"))}</div>
          <h1><span class="gradient-text">GECKO</span> · ${ui.esc(i18n.t("hero.title"))}</h1>
          <p class="lead">${ui.esc(i18n.t("hero.lead"))}</p>
          <div class="hero-stats">
            ${stat(s.documents_total, i18n.t("hero.docs"))}
            ${stat(s.events_total, i18n.t("hero.events"))}
            ${stat(s.documents_today, i18n.t("hero.today"), true)}
            ${stat(s.sources, i18n.t("hero.sources"))}
          </div>
          ${idx && idx.updated_at ? `<div class="kv" style="margin-top:14px">⏱ ${ui.esc(i18n.t("hero.updated"))} ${ui.esc(ui.fmtDateTime(idx.updated_at))}</div>` : ""}
        </div>
        <div class="hero-scene" aria-hidden="true">
          <span class="blob blob-1"></span>
          <span class="blob blob-2"></span>

          <div class="photo photo-a"><div class="photo-img"></div><span class="tape tape-blue"></span></div>
          <div class="photo photo-b"></div>
          <div class="photo photo-c"></div>

          <div class="photo photo-main" style="z-index:4">
            <span class="tape tape-top"></span>
            <div class="photo-img"></div>
            <div class="photo-cap">GECKO · AI FRONTIER</div>
          </div>

          <div class="note" style="z-index:3"><b>Today</b>AI 前沿<br>手账 · 每日</div>
          <div class="paper" style="z-index:2"></div>

          <svg class="scene-star star-1" width="19" height="19" viewBox="0 0 24 24" fill="currentColor" style="z-index:5">
            <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"/></svg>
          <svg class="scene-star s2 star-2" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="z-index:5">
            <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"/></svg>
          <svg class="scene-star s3 star-3" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="z-index:5">
            <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"/></svg>

          <svg class="scene-curve curve-1" width="190" height="62" viewBox="0 0 190 62" fill="none"
               stroke="currentColor" stroke-width="1.6" stroke-dasharray="7 9" style="z-index:1">
            <path d="M2 48 C 34 12, 68 14, 96 38 S 158 58, 188 26"/></svg>
          <svg class="scene-curve curve-2" width="170" height="56" viewBox="0 0 170 56" fill="none"
               stroke="currentColor" stroke-width="1.6" stroke-dasharray="6 8" style="z-index:1">
            <path d="M2 20 C 30 44, 62 44, 90 24 S 146 8, 168 34"/></svg>
        </div>
      </div>
    </section>`;
  }

  function trendRadarHtml(trends) {
    if (!trends || !trends.topics || !trends.topics.length) return ui.emptyState();
    return trends.topics.slice(0, 8).map((t, i) => ui.trendRow(t, i)).join("");
  }

  function catChipsHtml(idx) {
    const dist = (idx && idx.stats && idx.stats.category_distribution) || {};
    const cats = Object.keys(dist).sort((a, b) => dist[b] - dist[a]).slice(0, 8);
    if (!cats.length) return "";
    return cats.map((c) => `<a class="tab" href="#/feed?cat=${encodeURIComponent(c)}" data-nav>
      ${ui.catIcon(c)} ${ui.catLabel(c)} <span class="mono dim">${dist[c]}</span></a>`).join("");
  }

  /** 今日速览：把 24 小时内的事件压成一句话 + 3 条要点 */
  function hoursAgo(iso) {
    const t = new Date(iso || 0).getTime();
    return isNaN(t) || !t ? 999 : (Date.now() - t) / 3600000;
  }

  function tldrBlock(events, docs, idx) {
    const fresh = events.filter((e) => hoursAgo(e.first_seen_at || e.last_seen_at) <= 24);
    const freshDocs = docs.filter((d) => hoursAgo(d.published_at || d.discovered_at) <= 24);
    const hot = events.filter((e) => (e.heat || 0) >= 1.5).slice(0, 3);
    const picks = (hot.length ? hot : fresh.slice(0, 3));
    if (!picks.length && !freshDocs.length) return "";

    const zh = i18n.lang === "zh", ja = i18n.lang === "ja";
    const lead = zh
      ? `过去 24 小时新增 ${fresh.length} 个事件、${freshDocs.length} 篇文档，${hot.length} 个进入高热度区间。`
      : ja
        ? `過去24時間で ${fresh.length} 件のイベントと ${freshDocs.length} 件の文書が追加され、${hot.length} 件が高熱度に入りました。`
        : `${fresh.length} events and ${freshDocs.length} documents in the last 24h; ${hot.length} reached high heat.`;

    return `<section class="glass card tldr fade-in">
      <div class="tldr-head">
        <span class="tldr-tag">${zh ? "今日速览" : ja ? "今日の要点" : "At a glance"}</span>
        <span class="kv mono">${ui.esc(ui.fmtDateTime((idx || {}).updated_at))}</span>
      </div>
      <p class="tldr-lead">${ui.esc(lead)}</p>
      <ul class="tldr-list">
        ${picks.map((e, i) => `<li>
          <span class="idx mono">${String(i + 1).padStart(2, "0")}</span>
          <a href="#/event/${e.event_id}" data-nav>${ui.esc((e.title || "").slice(0, 96))}</a>
          <span class="kv nowrap">🔥 ${(e.heat || 0).toFixed(1)} · 📡 ${e.source_count || 0}</span>
        </li>`).join("")}
      </ul>
    </section>`;
  }

  async function render(el, params, route, alive) {
    el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
    const idx = await api.index();
    if (alive && !alive()) return;
    // 跨天聚合：单日分片可能因清理或抓取中断而稀疏，用最近 3 天兜底
    const [collected, trends] = await Promise.all([api.collect(3), api.trends()]);
    if (alive && !alive()) return;

    let events = (collected.events || []).slice();
    let docsPool = (collected.docs || []).slice();
    if (!events.length || !docsPool.length) {
      const day = await api.latestDay();
      events = ((day && day.events) || []).slice();
      docsPool = ((day && day.documents) || []).slice();
    }
    const seen = new Set();
    const rank = (e) => (e.heat || 0) * 3 + (e.importance_score || 0) * 2 + Math.min(3, e.source_count || 0) * 0.2;
    events = events
      .filter((e) => (seen.has(e.event_id) ? false : (seen.add(e.event_id), true)))
      .sort((a, b) => rank(b) - rank(a));
    const topEvents = events.filter((e) => (e.source_count || 0) >= 2 || (e.heat || 0) >= 1.5 || (e.importance_score || 0) > 0.7);
    const headlines = (topEvents.length ? topEvents : events).slice(0, 6);
    const latest = events.slice(0, 12);
    const docs = docsPool
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 8);

    el.innerHTML = `
      ${heroHtml(idx)}
      ${tldrBlock(events, docsPool, idx)}
      <div class="grid dashboard" style="margin-top:24px">
        <div class="stack" style="gap:30px">
          <section class="section fade-in">
            ${ui.sectionHead(i18n.t("sec.headlines"), i18n.t("sec.headlines.sub"), "#/reports", i18n.t("common.more"))}
            <div class="grid cols-2">${headlines.map((e) => ui.eventCard(e)).join("") || ui.emptyState()}</div>
          </section>
          <section class="section fade-in">
            ${ui.sectionHead(i18n.t("sec.latest"), i18n.t("sec.latest.sub"), "#/feed", i18n.t("nav.feed"))}
            <div class="grid cols-3">${latest.map((e) => ui.eventCard(e, { timeline: false })).join("") || ui.emptyState()}</div>
          </section>
        </div>
        <div class="stack" style="gap:22px">
          <section class="glass card fade-in" style="padding:18px">
            ${ui.sectionHead(i18n.t("sec.trend_radar"), "", "#/trends", i18n.t("common.more"))}
            <div class="stack" style="gap:2px">${trendRadarHtml(trends)}</div>
          </section>
          <section class="glass card fade-in" style="padding:18px">
            ${ui.sectionHead(i18n.t("sec.today_docs"), "", "#/feed?view=docs", i18n.t("common.all"))}
            <div class="stack" style="gap:0">
              ${docs.map((d) => `<div style="padding:9px 0;border-bottom:1px solid var(--border)">
                <a href="${ui.esc(d.url)}" target="_blank" rel="noopener" style="font-size:13.5px">${ui.esc(d.title.slice(0, 90))}</a>
                <div class="kv" style="margin-top:3px"><span>${ui.esc(d.source)}</span><span class="mono">${ui.relTime(d.published_at)}</span></div>
              </div>`).join("") || ui.emptyState()}
            </div>
          </section>
          <section class="glass card fade-in" style="padding:18px">
            ${ui.sectionHead(i18n.t("sec.by_cat"))}
            <div class="chip-row">${catChipsHtml(idx)}</div>
          </section>
        </div>
      </div>`;

    // 3D 场景 + 动效（数字滚动 / 卡片倾斜 / 视口显现）
    if (window.GECKO.initHero3D) window.GECKO.initHero3D();
    if (window.GECKO.motion) window.GECKO.motion.refresh(el);
    // CDN 加载失败 / WebGL 不可用 → 收起 3D 容器，保持布局整洁
    setTimeout(() => {
      const h3 = el.querySelector("#hero3d");
      if (h3 && !h3.classList.contains("is-live")) h3.classList.add("is-off");
    }, 6000);
  }

  window.GECKO.views.home = { render };
})();
