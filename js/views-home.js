/* ============================================================
   View: Home — Dashboard（今日头条 / 趋势雷达 / 最新事件）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  function heroHtml(idx) {
    const s = (idx && idx.stats) || {};
    const llm = idx && idx.llm_enabled;
    return `<section class="hero fade-in">
      <div class="hero-eyebrow"><span class="pulse-dot"></span>${ui.esc(i18n.t("hero.eyebrow"))}
        · ${ui.esc(llm ? i18n.t("hero.llm_on") : i18n.t("hero.llm_off"))}</div>
      <h1><span class="gradient-text">GECKO</span> · ${ui.esc(i18n.t("hero.title"))}</h1>
      <p class="lead">${ui.esc(i18n.t("hero.lead"))}</p>
      <div class="hero-stats">
        ${ui.statBlock(s.documents_total || 0, i18n.t("hero.docs"))}
        ${ui.statBlock(s.events_total || 0, i18n.t("hero.events"))}
        ${ui.statBlock(s.documents_today || 0, i18n.t("hero.today"), true)}
        ${ui.statBlock(s.sources || 0, i18n.t("hero.sources"))}
      </div>
      ${idx && idx.updated_at ? `<div class="kv" style="margin-top:14px">⏱ ${ui.esc(i18n.t("hero.updated"))} ${ui.esc(ui.fmtDateTime(idx.updated_at))}</div>` : ""}
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

  async function render(el, params, route, alive) {
    el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
    const idx = await api.index();
    if (alive && !alive()) return;
    const [day, trends] = await Promise.all([api.latestDay(), api.trends()]);
    if (alive && !alive()) return;

    const events = ((day && day.events) || []).slice()
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
    const topEvents = events.filter((e) => (e.source_count || 0) >= 2 || (e.importance_score || 0) > 0.7);
    const headlines = (topEvents.length ? topEvents : events).slice(0, 6);
    const latest = events.slice(0, 12);
    const docs = ((day && day.documents) || []).slice()
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 8);

    el.innerHTML = `
      ${heroHtml(idx)}
      <div class="grid dashboard" style="margin-top:24px">
        <div class="stack" style="gap:30px">
          <section class="section fade-in">
            ${ui.sectionHead(i18n.t("sec.headlines"), i18n.t("sec.headlines.sub"), "#/reports", i18n.t("nav.reports"))}
            <div class="grid cols-2">${headlines.map((e) => ui.eventCard(e)).join("") || ui.emptyState()}</div>
          </section>
          <section class="section fade-in">
            ${ui.sectionHead(i18n.t("sec.latest"), i18n.t("sec.latest.sub"), "#/feed", i18n.t("nav.feed"))}
            <div class="grid cols-3">${latest.map((e) => ui.eventCard(e, { timeline: false })).join("") || ui.emptyState()}</div>
          </section>
        </div>
        <div class="stack" style="gap:22px">
          <section class="glass card fade-in" style="padding:18px">
            ${ui.sectionHead(i18n.t("sec.trend_radar"), "", "#/trends", i18n.t("nav.trends"))}
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
  }

  window.GECKO.views.home = { render };
})();
