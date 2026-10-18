/* ============================================================
   Views: Reports — 日报列表 + 单日报（头条/分节/Claim-Evidence）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  /* 日报独立语言（默认跟随站点语言） */
  let reportLang = localStorage.getItem("gecko.reportLang") || null;
  const rl = () => reportLang || i18n.lang || "zh";
  function setReportLang(lang) {
    reportLang = lang;
    localStorage.setItem("gecko.reportLang", lang);
  }

  /** 本地化字段：字符串直接返回，{zh,en,ja} 对象按日报语言取 */
  const loc = (v) => {
    if (!v || typeof v !== "object") return v;
    return v[rl()] || v.zh || v.en || v.ja || "";
  };

  function langSwitch() {
    const langs = [["zh", "中文"], ["en", "English"], ["ja", "日本語"]];
    return `<div class="row" style="gap:6px" id="reportLangs">
      ${langs.map(([k, label]) =>
        `<button class="tab ${rl() === k ? "active" : ""}" data-rlang="${k}">${label}</button>`).join("")}
    </div>`;
  }

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
      <h3 class="headline-title">${h.url ? `<a href="#/event/${h.event_id}" data-nav>${ui.esc(loc(h.title_i18n) || h.title)}</a>` : ui.esc(loc(h.title_i18n) || h.title)}</h3>
      ${loc(h.narrative_i18n) ? `<div class="event-desc" style="display:block;margin:6px 0;-webkit-line-clamp:unset">${ui.esc(loc(h.narrative_i18n))}</div>` : ""}
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

  /* ---------- 事件时间线（日报扁平 / 周报月报按天分组） ---------- */
  function evTimelineRow(it) {
    return `<div class="doc-row">
      <div class="doc-main">
        <div class="doc-sub" style="margin-bottom:3px">
          ${it.time ? `<span class="mono">${ui.esc(it.time.slice(5))}</span>` : ""}
          ${it.event_type ? ui.badge(ui.eventTypeLabel(it.event_type), ui.eventTypeCls(it.event_type)) : ""}
          ${it.category ? `<span>${ui.catIcon(it.category)} ${ui.esc(ui.catLabel(it.category))}</span>` : ""}
        </div>
        <p class="doc-title"><a href="#/event/${it.event_id}" data-nav>${ui.esc(loc(it.title_i18n) || it.title)}</a></p>
        ${loc(it.narrative_i18n) ? `<div class="kv" style="display:block">${ui.esc(loc(it.narrative_i18n))}</div>` : ""}
      </div>
      <div class="doc-side">
        <span class="mono kv">${it.source_count || 0} src</span>
        ${it.url ? `<a class="kv hl" href="${ui.esc(it.url)}" target="_blank" rel="noopener">↗</a>` : ""}
      </div>
    </div>`;
  }

  function timelineBlock(rep) {
    const tl = rep.timeline || [];
    if (!tl.length) return "";
    const meta = rep.timeline_meta || {};
    const m = meta[rl()] || meta.zh || {};
    const grouped = tl[0] && Array.isArray(tl[0].events);
    return `<section class="report-section glass card">
      <h3>🕒 ${ui.esc(m.title || "Event Timeline")} <span class="count">${grouped ? tl.reduce((a, d) => a + d.events.length, 0) : tl.length}</span></h3>
      ${m.sub ? `<div class="kv dim" style="margin:-6px 0 10px">${ui.esc(m.sub)}</div>` : ""}
      ${grouped
        ? `<div class="stack" style="gap:16px">${tl.map((day) => `<div>
            <div class="badge" style="margin-bottom:6px">${ui.esc(day.date)}</div>
            <div class="stack" style="gap:0">${(day.events || []).map(evTimelineRow).join("")}</div>
          </div>`).join("")}</div>`
        : `<div class="stack" style="gap:0">${tl.map(evTimelineRow).join("")}</div>`}
    </section>`;
  }

  function bindLangSwitch(el, date) {
    el.querySelectorAll("[data-rlang]").forEach((b) => b.addEventListener("click", () => {
      setReportLang(b.dataset.rlang);
      renderSingle(el, date);
    }));
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
    bindLangSwitch(el, date);
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
            <div class="kv" style="margin-bottom:6px"><a href="#/reports" data-nav>← ${ui.esc(i18n.t("report.back"))}</a></div>
            ${langSwitch()}
            <h1>${ui.esc(loc(rep.title) || rep.id)}</h1>
            ${rep.period ? `<div class="kv" style="margin-bottom:4px">📅 ${ui.esc(rep.period.start)} → ${ui.esc(rep.period.end)}
              · ${rep.period.days} ${i18n.lang === "en" ? "days" : i18n.lang === "ja" ? "日間" : "天"}</div>` : ""}
            ${loc(rep.intro) ? `<div class="report-intro">${ui.esc(loc(rep.intro))}</div>` : ""}
            <div class="kv" style="margin-top:8px">${ui.esc(i18n.t("common.updated"))} ${ui.esc(ui.fmtDateTime(rep.generated_at))}
              ${rep.intro_source === "llm" ? ' · <span class="hl">AI</span>' : ""}</div>
          </div>
          <div class="row" style="gap:16px;flex-wrap:wrap">
            ${ui.statBlock(s.documents || 0, i18n.t("common.documents"))}
            ${ui.statBlock(s.events || 0, i18n.t("common.events"))}
            ${ui.statBlock(s.sources || 0, i18n.t("hero.sources"))}
            ${(s.claims || 0) > 0
              ? ui.statBlock(s.claims, i18n.t("report.claims"))
              : ui.statBlock(s.days || 0, i18n.lang === "en" ? "Days" : i18n.lang === "ja" ? "日数" : "覆盖天数")}
          </div>
        </div>
      </div>

      <section class="report-section">
        <h3>01 · ${ui.esc(rep.type && rep.type !== "daily"
          ? (i18n.lang === "en" ? "Period Highlights" : i18n.lang === "ja" ? "期間の重要ニュース" : "本期要闻")
          : i18n.t("report.headlines"))} <span class="count">${(rep.headlines || []).length}</span></h3>
        ${(rep.headlines || []).map(headlineItem).join("") || ui.emptyState()}
      </section>

      ${timelineBlock(rep)}

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
          ${(rep.watchlist || []).length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">👀 ${ui.esc(i18n.t("report.watchlist"))}</h3>
            <div class="stack" style="gap:8px">
              ${(rep.watchlist || []).map((w) => `<div>
                <a href="${ui.esc(w.url || "#")}" target="_blank" rel="noopener" style="font-size:13.5px">${ui.esc(w.title)}</a>
                <div class="kv"><span class="mono">${w.source_count} src</span><span>${(w.sources || []).slice(0, 4).join(" · ")}</span></div>
              </div>`).join("") || ui.emptyState()}
            </div>
          </section>` : ""}
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

      ${(rep.claims || []).length ? `<section class="report-section glass card" style="margin-top:18px">
        <h3>${ui.esc(i18n.t("report.claims"))} <span class="count">${rep.claims.length}</span></h3>
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
      </section>` : ""}
    </section>`;
  }

  function reportCard(r, kind) {
    const id = r.id || r.date;
    const kindLabel = {
      daily: i18n.lang === "en" ? "Daily" : i18n.lang === "ja" ? "日報" : "日报",
      weekly: i18n.lang === "en" ? "Weekly" : i18n.lang === "ja" ? "週報" : "周报",
      monthly: i18n.lang === "en" ? "Monthly" : i18n.lang === "ja" ? "月報" : "月报",
    }[kind] || kind;
    const when = r.period ? `${(r.period.start || "").slice(5)} → ${(r.period.end || "").slice(5)}` : (r.date || "");
    return `<a class="glass card hoverable" href="#/reports/${id}" data-nav>
      <div class="row" style="justify-content:space-between">
        <span class="badge ${kind === "daily" ? "acc" : ""}">${kindLabel}${kind !== "daily" && r.key ? " · " + ui.esc(r.key) : ""}</span>
        <span class="mono kv">${r.headline_i18n ? "🌐 " : ""}${ui.esc(when)}</span>
      </div>
      <div style="font-size:14.5px;font-weight:600;margin:8px 0 6px">${ui.esc(loc(r.headline_i18n) || r.headline || i18n.t("reports.title"))}</div>
      ${loc(r.intro) ? `<div class="kv" style="display:block;line-height:1.6">${ui.esc(String(loc(r.intro)).slice(0, 150))}…</div>` : ""}
      <div class="event-meta" style="margin-top:10px">
        <span class="kv">📄 ${(r.stats || {}).documents || 0}</span>
        <span class="kv">🧩 ${(r.stats || {}).events || 0}</span>
        <span class="kv">📡 ${(r.stats || {}).sources || 0}</span>
      </div>
    </a>`;
  }

  /** 从 hash 判断当前是日报 / 周报 / 月报专属入口（对应 AIHOT 的 /daily /weekly /monthly） */
  function kindFromHash() {
    const h = (location.hash || "").replace(/^#/, "");
    if (h.startsWith("/weekly")) return "weekly";
    if (h.startsWith("/monthly")) return "monthly";
    if (h.startsWith("/daily")) return "daily";
    return null;
  }

  async function renderList(el) {
    el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
    const idx = (await api.reports()) || {};
    const daily = idx.reports || [];
    const weekly = idx.weekly || [];
    const monthly = idx.monthly || [];
    const label = (zh, en, ja) => (i18n.lang === "en" ? en : i18n.lang === "ja" ? ja : zh);
    const kind = kindFromHash();
    const group = (title, list, k) => (!list.length ? "" : `
      <section class="section">
        ${ui.sectionHead(title, String(list.length))}
        <div class="grid cols-3">${list.map((r) => reportCard(r, k)).join("")}</div>
      </section>`);

    const titles = {
      daily: [label("AI 日报", "Daily reports", "日報"), label("每日自动生成的情报报告，永久保存", "Auto-generated daily intelligence, kept forever", "毎日自動生成・永続保存")],
      weekly: [label("AI 周报", "Weekly reports", "週報"), label("本周主线、重要发布与值得回看的讨论", "This week's themes, key releases and discussions worth revisiting", "今週の主线・重要発表・見直す価値のある議論")],
      monthly: [label("AI 月报", "Monthly reports", "月報"), label("一个月的变化：主线与关键事件回顾", "A month of change: themes and key events", "1か月の変化：主线と重要イベント")],
    };
    const head = kind ? titles[kind] : [i18n.t("reports.title"), i18n.t("reports.sub")];

    const body = kind === "weekly" ? group(label("周报", "Weekly Reports", "週報"), weekly, "weekly")
      : kind === "monthly" ? group(label("月报", "Monthly Reports", "月報"), monthly, "monthly")
      : kind === "daily" ? group(label("日报", "Daily Reports", "日報"), daily, "daily")
      : `${group(label("周报", "Weekly Reports", "週報"), weekly, "weekly")}
         ${group(label("月报", "Monthly Reports", "月報"), monthly, "monthly")}
         ${group(label("日报", "Daily Reports", "日報"), daily, "daily")}`;

    el.innerHTML = `<section class="fade-in">
      ${ui.sectionHead(head[0], head[1])}
      <div style="margin-bottom:18px">${langSwitch()}</div>
      ${body}
    </section>`;

    el.querySelectorAll("[data-rlang]").forEach((b) => b.addEventListener("click", () => {
      setReportLang(b.dataset.rlang);
      renderList(el);
    }));
  }

  window.GECKO.views.reports = {
    render(el, params, route) {
      if (route && route.name === "report" && params.date) {
        if (params.lang) setReportLang(params.lang);   // 支持 #/reports/<date>?lang=en 分享指定语言
        return renderSingle(el, params.date);
      }
      if (params && params.lang) setReportLang(params.lang);
      return renderList(el);
    },
  };
})();
