/* GECKO · 主题页（方向 / 组织 / 形态）
   #/topics        三栏总览
   #/topic/<id>    单主题详情：规模、趋势、代表事件、关联分类
*/
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};
  window.GECKO.views = window.GECKO.views || {};

  const T = (zh, en, ja) => (window.GECKO.i18n.lang === "en" ? en : window.GECKO.i18n.lang === "ja" ? ja : zh);
  const loc = (obj) => {
    if (!obj || typeof obj !== "object") return obj || "";
    const l = window.GECKO.i18n.lang;
    return obj[l] || obj.zh || obj.en || "";
  };

  const KIND_TITLE = () => ({
    direction: T("方向", "Directions", "領域"),
    organization: T("组织", "Organizations", "組織"),
    format: T("形态", "Formats", "形式"),
  });

  function heatBar(v, max) {
    const pct = max > 0 ? Math.min(100, Math.round((v / max) * 100)) : 0;
    return `<span class="heat-bar"><i style="width:${pct}%"></i></span>`;
  }

  function sparkline(arr, w = 108, h = 24) {
    if (!arr || arr.length < 2) return "";
    const max = Math.max(...arr, 1);
    const step = w / (arr.length - 1);
    const pts = arr.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`);
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <polyline fill="none" stroke="var(--acc-2)" stroke-width="1.6" stroke-linecap="round"
        stroke-linejoin="round" points="${pts.join(" ")}"/></svg>`;
  }

  function topicCard(t, maxHeat) {
    const urgent = (t.heat_max || 0) >= maxHeat * 0.6;
    return `<a class="glass card hoverable topic-card" href="#/topic/${encodeURIComponent(t.id)}" data-nav>
      <div class="event-top">
        <div class="event-badges">
          <span class="badge">${t.icon || "•"} ${window.GECKO.ui.esc(loc(t.label) || t.name || t.id)}</span>
          ${t.heat_state ? window.GECKO.ui.badge(t.heat_state, "acc") : ""}
        </div>
        ${urgent ? `<span class="mono kv">🔥 ${(t.heat_max || 0).toFixed(1)}</span>` : ""}
      </div>
      <div class="topic-scale">
        <div><b class="mono">${t.docs_7d || 0}</b><span class="kv">7天文档</span></div>
        <div><b class="mono">${t.docs_30d || 0}</b><span class="kv">30天文档</span></div>
        <div><b class="mono">${t.events_total || 0}</b><span class="kv">事件</span></div>
      </div>
      ${t.trend && t.trend.sparkline && t.trend.sparkline.length > 1
        ? `<div class="topic-trend">${sparkline(t.trend.sparkline)}<span class="kv">趋势 ${(t.trend.score || 0).toFixed(2)}</span></div>`
        : `<div class="topic-trend">${heatBar(t.heat_max || 0, maxHeat)}<span class="kv">热度</span></div>`}
      <ul class="topic-events">
        ${(t.top_events || []).slice(0, 3).map((e) => `<li>
          <span class="mono dim">${((e.last_seen_at || "").slice(5, 10))}</span>
          ${window.GECKO.ui.esc((loc(e.title_i18n) || e.title || "").slice(0, 64))}
        </li>`).join("")}
      </ul>
    </a>`;
  }

  const topics = {
    async render(el, params, route) {
      const { ui, api } = window.GECKO;
      el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
      const data = (await api.topics()) || {};
      const dirs = data.directions || [];
      const orgs = data.organizations || [];
      const formats = data.formats || [];
      if (!dirs.length && !orgs.length) {
        el.innerHTML = `<section class="fade-in">${ui.sectionHead(T("主题", "Topics", "トピック"), "")}
          <div class="empty">${T("主题数据尚未生成，下次管线运行后可见。", "Topics not generated yet — available after the next pipeline run.", "トピックは次回のパイプライン実行後に生成されます。")}</div>
        </section>`;
        return;
      }
      const all = [...dirs, ...orgs, ...formats];
      const maxHeat = Math.max(1, ...all.map((t) => t.heat_max || 0));
      const K = KIND_TITLE();

      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("主题雷达", "Topic Radar", "トピックレーダー"),
          T("按方向、组织与内容形态自动聚合，每类都带规模、热度与代表事件",
            "Auto-grouped by direction, organization and format — each with scale, heat and key events",
            "領域・組織・形式ごとに自動集約。規模・熱度・代表イベント付き"))}

        <div class="section">
          ${ui.sectionHead(K.direction, String(dirs.length))}
          <div class="grid cols-3">${dirs.map((t) => topicCard(t, maxHeat)).join("")}</div>
        </div>

        ${orgs.length ? `<div class="section">
          ${ui.sectionHead(K.organization, String(orgs.length))}
          <div class="grid cols-3">${orgs.map((t) => topicCard(t, maxHeat)).join("")}</div>
        </div>` : ""}

        ${formats.length ? `<div class="section">
          ${ui.sectionHead(K.format, String(formats.length))}
          <div class="grid cols-3">${formats.map((t) => topicCard(t, maxHeat)).join("")}</div>
        </div>` : ""}
      </section>`;
      if (window.GECKO.motion) window.GECKO.motion.refresh(el);
    },
  };

  const topic = {
    async render(el, params) {
      const { ui, api } = window.GECKO;
      const id = decodeURIComponent((params && params.id) || "");
      el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
      const data = (await api.topics()) || {};
      const all = [...(data.directions || []), ...(data.organizations || []), ...(data.formats || [])];
      const t = all.find((x) => x.id === id);
      if (!t) {
        el.innerHTML = `<section class="fade-in">${ui.sectionHead(T("主题不存在", "Topic not found", "トピックが見つかりません"), "")}
          <div class="empty"><a class="hl" href="#/topics" data-nav>${T("返回主题索引", "Back to topics", "トピック一覧へ")}</a></div></section>`;
        return;
      }
      const maxHeat = Math.max(1, ...all.map((x) => x.heat_max || 0));
      const K = KIND_TITLE();
      const cats = Object.entries(t.categories || {});

      el.innerHTML = `<section class="fade-in">
        <a class="kv" href="#/topics" data-nav>← ${T("主题索引", "Topics", "トピック一覧")}</a>
        <div class="glass card" style="margin:14px 0 22px">
          <div class="event-top">
            <div class="event-badges">
              <span class="badge">${t.icon || "•"} ${ui.esc(K[t.kind] || t.kind)}</span>
              ${t.heat_state ? ui.badge(t.heat_state, "acc") : ""}
            </div>
            <span class="mono kv">🔥 ${(t.heat_max || 0).toFixed(1)} max</span>
          </div>
          <h1 style="font-size:26px;margin:8px 0 4px">${ui.esc(loc(t.label) || t.name || t.id)}</h1>
          <div class="row" style="gap:22px;flex-wrap:wrap;margin-top:12px">
            ${ui.statBlock(t.docs_7d || 0, T("7 天文档", "7-day docs", "7日文書"))}
            ${ui.statBlock(t.docs_30d || 0, T("30 天文档", "30-day docs", "30日文書"))}
            ${ui.statBlock(t.events_total || 0, T("事件", "events", "イベント"))}
            ${ui.statBlock((t.heat_avg || 0).toFixed(2), T("平均热度", "avg heat", "平均熱度"))}
          </div>
          ${t.trend && t.trend.sparkline ? `<div class="topic-trend" style="margin-top:14px">${sparkline(t.trend.sparkline, 220, 40)}</div>` : ""}
          ${cats.length ? `<div class="event-sources" style="margin-top:14px">${cats.map(([c, n]) =>
            `<span class="badge">${ui.catIcon(c)} ${ui.esc(ui.catLabel(c))} · ${n}</span>`).join("")}</div>` : ""}
        </div>

        <div class="section">
          ${ui.sectionHead(T("代表事件", "Key events", "代表イベント"), String((t.top_events || []).length),
            "#/feed", T("信息流", "Feed", "フィード"))}
          <div class="stack" style="gap:8px">
            ${(t.top_events || []).map((e) => `<a class="glass card hoverable doc-row" href="#/event/${e.event_id}" data-nav style="text-decoration:none">
              <div class="doc-main">
                <div class="doc-sub" style="margin-bottom:2px">
                  <span class="mono">${(e.last_seen_at || "").slice(5, 10)}</span>
                  ${e.event_type ? ui.badge(ui.eventTypeLabel(e.event_type), ui.eventTypeCls(e.event_type)) : ""}
                  <span class="kv">🔥 ${(e.heat || 0).toFixed(1)}</span>
                  <span class="kv">📡 ${e.source_count || 0}</span>
                </div>
                <p class="doc-title">${ui.esc(loc(e.title_i18n) || e.title || "")}</p>
              </div>
              <div class="doc-side"><span class="kv hl">↗</span></div>
            </a>`).join("") || ui.emptyState()}
          </div>
        </div>
      </section>`;
      if (window.GECKO.motion) window.GECKO.motion.refresh(el);
    },
  };

  window.GECKO.views.topics = topics;
  window.GECKO.views.topic = topic;
})();
