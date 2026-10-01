/* ============================================================
   View: Trends — 趋势雷达（话题 / 实体 / 指标分解 / 权重）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  function metricBars(m) {
    if (!m) return "";
    const rows = [
      ["trends.w.velocity", m.velocity],
      ["trends.w.novelty", m.novelty],
      ["trends.w.diversity", m.source_diversity],
      ["trends.w.authority", m.authority],
      ["trends.w.adoption", m.adoption],
      ["trends.w.recency", m.recency],
    ];
    return `<div class="stack" style="gap:6px">${rows.map(([k, v]) =>
      `<div class="row" style="gap:8px">
        <span class="kv" style="width:92px">${ui.esc(i18n.t(k))}</span>
        <span class="score-bar" style="width:120px"><i style="width:${Math.round((v || 0) * 100)}%"></i></span>
        <span class="mono kv">${(v || 0).toFixed(2)}</span>
      </div>`).join("")}</div>`;
  }

  function topicCard(t) {
    const counts = (t.metrics && t.metrics.counts) || {};
    return `<article class="glass card hoverable">
      <div class="row" style="justify-content:space-between">
        <div class="trend-name" style="font-size:15px">${t.icon || ""} ${ui.esc(i18n.label(t.label) || t.topic)}</div>
        <div class="trend-right">${ui.sparkline(t.sparkline, { w: 110, h: 26 })} ${ui.dirArrow(t.direction)}</div>
      </div>
      <div class="row" style="gap:14px;margin:8px 0 10px">
        <span class="kv">${i18n.t("trends.score")} <b class="mono hl">${(t.score || 0).toFixed(3)}</b></span>
        <span class="kv">24h <b class="mono">${counts["24h"] || 0}</b></span>
        <span class="kv">7d <b class="mono">${counts["7d"] || 0}</b></span>
        <span class="kv">30d <b class="mono">${counts["30d"] || 0}</b></span>
      </div>
      ${metricBars(t.metrics)}
      ${(t.top_titles || []).length ? `<div class="stack" style="gap:4px;margin-top:10px">
        ${t.top_titles.slice(0, 3).map((x) => `<div class="kv" style="display:block">· ${ui.esc(x)}</div>`).join("")}
      </div>` : ""}
    </article>`;
  }

  async function render(el, params, route, alive) {
    el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
    const trends = await api.trends();
    if (alive && !alive()) return;
    if (!trends) { el.innerHTML = ui.emptyState(); return; }

    const topics = trends.topics || [];
    const entities = trends.entities || [];
    const orgs = entities.filter((e) => e.type === "organization");
    const models = entities.filter((e) => e.type === "model");
    const concepts = entities.filter((e) => ["concept", "benchmark"].includes(e.type));
    const w = trends.weights || {};

    const weightsRow = Object.keys(w).map((k) =>
      `<span class="badge">${ui.esc({ velocity: i18n.t("trends.w.velocity"), novelty: i18n.t("trends.w.novelty"),
        source_diversity: i18n.t("trends.w.diversity"), authority: i18n.t("trends.w.authority"),
        adoption: i18n.t("trends.w.adoption"), recency: i18n.t("trends.w.recency") }[k] || k)}
        <b class="mono">${Math.round(w[k] * 100)}%</b></span>`).join("");

    el.innerHTML = `
      <section class="fade-in">
        ${ui.sectionHead(i18n.t("trends.title"), i18n.t("trends.sub"))}
        <div class="filter-bar">
          <span class="kv">${i18n.t("trends.weights")}:</span>
          <div class="chip-row">${weightsRow}</div>
          <span class="kv dim">${ui.esc(i18n.t("trends.window"))}: 24h · 7d · 30d</span>
        </div>

        <div class="grid cols-3" style="margin-bottom:26px">
          ${topics.map(topicCard).join("")}
        </div>

        <div class="grid dashboard">
          <div class="stack" style="gap:22px">
            <section class="glass card">
              ${ui.sectionHead(i18n.t("trends.entities") + " · " + (i18n.lang === "en" ? "Models" : i18n.lang === "ja" ? "モデル" : "模型"))}
              <div class="stack" style="gap:2px">${models.slice(0, 10).map((e, i) => ui.trendRow(e, i, { entity: true })).join("") || ui.emptyState()}</div>
            </section>
            <section class="glass card">
              ${ui.sectionHead((i18n.lang === "en" ? "Concepts & Benchmarks" : i18n.lang === "ja" ? "概念とベンチマーク" : "概念与基准"))}
              <div class="stack" style="gap:2px">${concepts.slice(0, 12).map((e, i) => ui.trendRow(e, i, { entity: true })).join("") || ui.emptyState()}</div>
            </section>
          </div>
          <div class="stack" style="gap:22px">
            <section class="glass card">
              ${ui.sectionHead(i18n.t("nav.organizations"), "", "#/organizations", i18n.t("common.more"))}
              <div class="stack" style="gap:2px">${orgs.slice(0, 12).map((e, i) => ui.trendRow(e, i, { entity: true })).join("") || ui.emptyState()}</div>
            </section>
            <section class="glass card">
              <div class="kv" style="display:block;line-height:1.7">
                <b>${ui.esc(i18n.t("trends.sub"))}</b><br>
                <span class="dim">${ui.esc(i18n.lang === "en"
                  ? "Trends are computed on the pipeline side from the last 30 days of documents, with weights configurable in config.py."
                  : i18n.lang === "ja"
                  ? "トレンドは直近30日の文書からパイプライン側で計算され、重みは config.py で設定可能です。"
                  : "趋势在管线侧基于最近 30 天文档计算，权重可在 config.py 中配置。")}</span>
              </div>
            </section>
          </div>
        </div>
      </section>`;
  }

  window.GECKO.views.trends = { render };
})();
