/* ============================================================
   Views: Reports — 日报列表 + 单日报（头条/分节/Claim-Evidence）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  /** 本地化字段：字符串直接返回，{zh,en,ja} 对象按当前语言取 */
  const loc = (v) => (v && typeof v === "object" ? i18n.label(v) : v);

  function docBriefRow(d) {
    const meta = d.metadata || {};
    const extra = [];
    if (meta.stars) extra.push(`⭐ ${Number(meta.stars).toLocaleString()}`);
    if (meta.downloads) extra.push(`⬇ ${Number(meta.downloads).toLocaleString()}`);
    if (meta.categories && meta.categories.length) extra.push(ui.esc(meta.categories.slice(0, 2).join(" ")));
    return `<div class="doc-row">
      <div class="doc-main">
        <p class="doc-title"><a href="${ui.esc(d.url || "#")}" target="_blank" rel="noopener">${ui.esc(d.title)}</a></p>
        <div class="doc-sub"><span>${ui.esc(d.source || "")}</span>
          ${d.entities && d.entities.length ? `<span>${ui.esc(d.entities.slice(0, 3).join(" · "))}</span>` : ""}
          ${extra.length ? `<span>${extra.join(" · ")}</span>` : ""}</div>
        ${d.summary ? `<div class="kv" style="margin-top:4px;display:block">${ui.esc(d.summary.slice(0, 220))}</div>` : ""}
      </div>
      <div class="doc-side">${ui.scoreBar(d.importance_score)}</div>
    </div>`;
  }

  function evidenceList(ev) {
    if (!ev || !ev.length) return "";
    return `<ul class="evidence-list">${ev.map((x) =>
      `<li>↳ ${x.url ? `<a href="${ui.esc(x.url)}" target="_blank" rel="noopener">${ui.esc(x.title || x.url)}</a>` : ui.esc(x.title || "")}
       <span class="ev-src">${ui.esc(x.source || "")}${x.tier ? " · T" + x.tier : ""}</span></li>`).join("")}</ul>`;
  }

  function headlineItem(h, i) {
    return `<div class="glass headline-item">
      <div class="headline-top">
        <span class="headline-rank">${String(i + 1).padStart(2, "0")}</span>
        ${h.event_type ? ui.badge(ui.eventTypeLabel(h.event_type), ui.eventTypeCls(h.event_type)) : ""}
        ${h.category ? ui.badge(ui.catLabel(h.category), ui.catCls(h.category)) : ""}
        ${h.trend_state ? ui.badge(ui.stateLabel(h.trend_state), ui.stateCls(h.trend_state)) : ""}
      </div>
      <h3 class="headline-title">${h.url ? `<a href="${ui.esc(h.url)}" target="_blank" rel="noopener">${ui.esc(loc(h.title_i18n) || h.title)}</a>` : ui.esc(loc(h.title_i18n) || h.title)}</h3>
      ${h.description ? `<div class="kv" style="display:block;margin:6px 0">${ui.esc(h.description)}</div>` : ""}
      <div class="event-meta" style="margin:8px 0">
        <span class="kv">📡 ${h.source_count || 0} sources</span>
        ${typeof h.importance_score === "number" ? `<span class="kv">${i18n.t("common.importance")} ${ui.scoreBar(h.importance_score)}</span>` : ""}
        ${typeof h.confidence_score === "number" ? `<span class="kv">${i18n.t("common.confidence")} ${h.confidence_score.toFixed(2)}</span>` : ""}
      </div>
      ${(h.entities || []).length ? `<div class="chip-row" style="margin-bottom:8px">${h.entities.map((e) => `<span class="badge">${ui.esc(e)}</span>`).join("")}</div>` : ""}
      ${evidenceList(h.evidence)}
    </div>`;
  }

  function trendChangeRow(r, cls) {
    return `<div class="row" style="justify-content:space-between;padding:5px 0">
      <span class="kv">${r.icon || ""} ${ui.esc(i18n.label(r.label) || r.topic)}</span>
      <span class="row" style="gap:8px">${ui.sparkline(r.sparkline, { w: 70, h: 18, fill: false })}
        <b class="mono ${cls}">${r.delta > 0 ? "+" : ""}${(r.delta || 0).toFixed(3)}</b></span>
    </div>`;
  }

  async function renderSingle(el, date) {
    el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
    const rep = await api.report(date);
    if (!rep) { el.innerHTML = ui.emptyState(i18n.t("report.no_report")); return; }
    const s = rep.stats || {};
    const tc = rep.trend_changes || {};

    const sectionBlock = (title, list, keyName) => (!list || !list.length ? "" :
      `<section class="report-section glass card">
        <h3>${ui.esc(title)} <span class="count">${list.length}</span></h3>
        <div class="stack" style="gap:0">${list.map((d) => typeof d === "string" ? `<div>${ui.esc(d)}</div>` : docBriefRow(d)).join("")}</div>
      </section>`);

    el.innerHTML = `<section class="fade-in">
      <div class="report-head glass">
        <div class="row" style="justify-content:space-between">
          <div>
            <div class="kv"><a href="#/reports" data-nav>← ${ui.esc(i18n.t("report.back"))}</a></div>
            <h1>${ui.esc(i18n.label(rep.title) || rep.id)}</h1>
            ${loc(rep.intro) ? `<div class="report-intro">${ui.esc(loc(rep.intro))}</div>` : ""}
            <div class="kv" style="margin-top:8px">${ui.esc(i18n.t("common.updated"))} ${ui.esc(ui.fmtDateTime(rep.generated_at))}
              ${rep.intro_source === "llm" ? ' · <span class="hl">AI</span>' : ""}</div>
          </div>
          <div class="row" style="gap:16px;flex-wrap:wrap">
            ${ui.statBlock(s.documents || 0, i18n.t("common.documents"))}
            ${ui.statBlock(s.events || 0, i18n.t("common.events"))}
            ${ui.statBlock(s.sources || 0, i18n.t("hero.sources"))}
            ${ui.statBlock(s.claims || 0, i18n.t("report.claims"))}
          </div>
        </div>
      </div>

      <section class="report-section">
        <h3>01 · ${ui.esc(i18n.t("report.headlines"))} <span class="count">${(rep.headlines || []).length}</span></h3>
        ${(rep.headlines || []).map(headlineItem).join("") || ui.emptyState()}
      </section>

      <div class="grid dashboard">
        <div class="stack" style="gap:18px">
          ${(rep.sections || []).map((sec) => sectionBlock(`${sec.label ? ui.esc(i18n.label(sec.label)) : sec.key}`, sec.items)).join("")}
        </div>
        <div class="stack" style="gap:18px">
          ${sectionBlock("🧠 " + i18n.t("report.models"), rep.new_models)}
          ${sectionBlock("📄 " + i18n.t("report.papers"), rep.new_papers)}
          ${sectionBlock("🐙 " + i18n.t("report.projects"), rep.new_projects)}
          ${sectionBlock("🗂 " + i18n.t("report.datasets"), rep.new_datasets)}
        </div>
      </div>

      <div class="grid dashboard" style="margin-top:18px">
        <section class="report-section glass card">
          <h3>${ui.esc(i18n.t("report.trends"))}</h3>
          <div class="stack" style="gap:14px">
            <div>
              <div class="badge acc" style="margin-bottom:6px">▲ ${ui.esc(i18n.t("report.rising"))}</div>
              ${(tc.rising || []).map((r) => trendChangeRow(r, "dir-up")).join("") || `<div class="kv">—</div>`}
            </div>
            <div>
              <div class="badge rose" style="margin-bottom:6px">▼ ${ui.esc(i18n.t("report.cooling"))}</div>
              ${(tc.cooling || []).map((r) => trendChangeRow(r, "dir-down")).join("") || `<div class="kv">—</div>`}
            </div>
            <div>
              <div class="badge" style="margin-bottom:6px">✦ ${ui.esc(i18n.t("report.new"))}</div>
              ${(tc.new || []).map((r) => trendChangeRow(r, "dir-flat")).join("") || `<div class="kv">—</div>`}
            </div>
          </div>
        </section>
        <div class="stack" style="gap:18px">
          <section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">👀 ${ui.esc(i18n.t("report.watchlist"))}</h3>
            <div class="stack" style="gap:8px">
              ${(rep.watchlist || []).map((w) => `<div>
                <a href="${ui.esc(w.url || "#")}" target="_blank" rel="noopener" style="font-size:13.5px">${ui.esc(w.title)}</a>
                <div class="kv"><span class="mono">${w.source_count} src</span><span>${(w.sources || []).slice(0, 4).join(" · ")}</span></div>
              </div>`).join("") || ui.emptyState()}
            </div>
          </section>
          <section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🔎 ${ui.esc(i18n.t("report.verification"))}</h3>
            <div class="stack" style="gap:6px">
              <div class="row" style="justify-content:space-between"><span class="kv">${ui.esc(i18n.t("report.headlines"))} w/ evidence</span><b class="mono">${Math.round(((rep.verification || {}).citation_coverage || 0) * 100)}%</b></div>
              <div class="row" style="justify-content:space-between"><span class="kv">Claims corroborated</span><b class="mono">${s.corroborated_claims || 0} / ${s.claims || 0}</b></div>
            </div>
            ${loc((rep.verification || {}).note) ? `<div class="kv" style="display:block;margin-top:8px">${ui.esc(loc(rep.verification.note))}</div>` : ""}
          </section>
        </div>
      </div>

      <section class="report-section glass card" style="margin-top:18px">
        <h3>${ui.esc(i18n.t("report.claims"))} <span class="count">${(rep.claims || []).length}</span></h3>
        <div class="grid cols-2">
          ${(rep.claims || []).map((c) => `<div class="claim-box">
            <div class="claim">${ui.esc(c.claim)}</div>
            <div class="row" style="gap:8px;margin-bottom:6px">
              ${ui.badge(c.status, c.status === "corroborated" ? "acc" : c.status === "supported" ? "" : "warm")}
              <span class="kv">${i18n.t("common.confidence")} <b class="mono">${(c.confidence || 0).toFixed(2)}</b></span>
            </div>
            ${evidenceList(c.evidence)}
          </div>`).join("") || ui.emptyState()}
        </div>
      </section>
    </section>`;
  }

  async function renderList(el) {
    el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
    const idx = await api.reports();
    const list = (idx && idx.reports) || [];
    el.innerHTML = `<section class="fade-in">
      ${ui.sectionHead(i18n.t("reports.title"), `${i18n.t("reports.sub")} · ${list.length}`)}
      <div class="grid cols-3">
        ${list.map((r) => `<a class="glass card hoverable" href="#/reports/${r.date}" data-nav>
          <div class="row" style="justify-content:space-between">
            <span class="badge acc">${ui.esc(r.type || "daily")}</span>
            <span class="mono kv">${r.headline_i18n ? "🌐 " : ""}${ui.esc(r.date)}</span>
          </div>
          <div style="font-size:14.5px;font-weight:600;margin:8px 0 6px">${ui.esc(loc(r.headline_i18n) || r.headline || i18n.t("reports.title"))}</div>
          ${loc(r.intro) ? `<div class="kv" style="display:block;line-height:1.6">${ui.esc(String(loc(r.intro)).slice(0, 150))}…</div>` : ""}
          <div class="event-meta" style="margin-top:10px">
            <span class="kv">📄 ${(r.stats || {}).documents || 0}</span>
            <span class="kv">🧩 ${(r.stats || {}).events || 0}</span>
            <span class="kv">📡 ${(r.stats || {}).sources || 0}</span>
          </div>
        </a>`).join("") || ui.emptyState()}
      </div>
    </section>`;
  }

  window.GECKO.views.reports = {
    render(el, params, route) {
      if (route && route.name === "report" && params.date) return renderSingle(el, params.date);
      return renderList(el);
    },
  };
})();
