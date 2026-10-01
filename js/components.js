/* ============================================================
   GECKO Components — 卡片 / 徽章 / sparkline / 时间线
   ============================================================ */
window.GECKO = window.GECKO || {};

(function () {
  const i18n = window.GECKO.i18n;

  const CATS = {
    foundation_models: { zh: "基础模型", en: "Foundation Models", ja: "基盤モデル", icon: "🧠", cls: "violet" },
    agents: { zh: "智能体", en: "Agents", ja: "エージェント", icon: "🧩", cls: "acc" },
    generative: { zh: "生成式", en: "Generative", ja: "生成AI", icon: "🎨", cls: "rose" },
    robotics: { zh: "机器人", en: "Robotics", ja: "ロボティクス", icon: "🦾", cls: "warm" },
    infrastructure: { zh: "基础设施", en: "Infrastructure", ja: "インフラ", icon: "⚙️", cls: "" },
    research: { zh: "研究", en: "Research", ja: "研究", icon: "📄", cls: "violet" },
    open_source: { zh: "开源", en: "Open Source", ja: "OSS", icon: "🐙", cls: "acc" },
    safety: { zh: "安全", en: "Safety", ja: "安全性", icon: "🛡️", cls: "rose" },
    science: { zh: "科学", en: "Science", ja: "科学AI", icon: "🔬", cls: "" },
    industry: { zh: "行业", en: "Industry", ja: "業界", icon: "🌏", cls: "warm" },
  };

  const TYPES = {
    paper: { zh: "论文", en: "Paper", ja: "論文", cls: "violet" },
    model: { zh: "模型", en: "Model", ja: "モデル", cls: "acc" },
    repository: { zh: "仓库", en: "Repo", ja: "リポジトリ", cls: "acc" },
    dataset: { zh: "数据集", en: "Dataset", ja: "データセット", cls: "" },
    product: { zh: "产品", en: "Product", ja: "製品", cls: "warm" },
    news: { zh: "新闻", en: "News", ja: "ニュース", cls: "" },
    blog: { zh: "博客", en: "Blog", ja: "ブログ", cls: "" },
    video: { zh: "视频", en: "Video", ja: "動画", cls: "rose" },
  };

  const EVENT_TYPES = {
    model_release: { zh: "模型发布", en: "Model Release", ja: "モデル発表", cls: "acc" },
    release: { zh: "发布", en: "Release", ja: "リリース", cls: "acc" },
    paper: { zh: "论文", en: "Paper", ja: "論文", cls: "violet" },
    project: { zh: "开源项目", en: "Project", ja: "プロジェクト", cls: "acc" },
    funding: { zh: "融资", en: "Funding", ja: "資金調達", cls: "warm" },
    policy: { zh: "政策", en: "Policy", ja: "政策", cls: "rose" },
    product: { zh: "产品", en: "Product", ja: "製品", cls: "warm" },
    news: { zh: "动态", en: "News", ja: "ニュース", cls: "" },
  };

  const TREND_STATE = {
    surging: { zh: "激增", en: "Surging", ja: "急上昇", cls: "rose" },
    rising: { zh: "上升", en: "Rising", ja: "上昇", cls: "acc" },
    active: { zh: "活跃", en: "Active", ja: "活発", cls: "" },
    cooling: { zh: "降温", en: "Cooling", ja: "冷却", cls: "" },
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function pick(dict, key) {
    const item = dict[key];
    if (!item) return key || "";
    return item[i18n.lang] || item.zh || item.en || key;
  }

  function catLabel(cat) { return pick(CATS, cat); }
  function catIcon(cat) { return (CATS[cat] || {}).icon || "📌"; }
  function catCls(cat) { return (CATS[cat] || {}).cls || ""; }
  function typeLabel(t) { return pick(TYPES, t); }
  function typeCls(t) { return (TYPES[t] || {}).cls || ""; }
  function eventTypeLabel(t) { return pick(EVENT_TYPES, t); }
  function eventTypeCls(t) { return (EVENT_TYPES[t] || {}).cls || ""; }
  function stateLabel(s) { return pick(TREND_STATE, s); }
  function stateCls(s) { return (TREND_STATE[s] || {}).cls || ""; }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso).slice(0, 10);
    const lang = i18n.lang;
    const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
    if (lang === "en") return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${dd}`;
    return `${m}月${dd}日`;
  }

  function fmtDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function relTime(iso) {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    const mins = Math.max(0, (Date.now() - t) / 60000);
    if (mins < 60) return `${Math.round(mins)}m`;
    const hrs = mins / 60;
    if (hrs < 24) return `${Math.round(hrs)}h`;
    const days = hrs / 24;
    return `${Math.round(days)}d`;
  }

  /** sparkline SVG */
  function sparkline(values, opts) {
    const o = Object.assign({ w: 84, h: 22, color: "var(--acc)", fill: true }, opts || {});
    const v = (values || []).slice(-14);
    if (!v.length) return "";
    const max = Math.max(...v, 1);
    const step = o.w / Math.max(1, v.length - 1);
    const pts = v.map((n, i) => [i * step, o.h - 3 - (n / max) * (o.h - 6)]);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${o.w} ${o.h} L0 ${o.h} Z`;
    const gid = "sg" + Math.random().toString(36).slice(2, 8);
    return `<svg class="spark" width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}" aria-hidden="true">
      ${o.fill ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${o.color}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${o.color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/>` : ""}
      <path d="${line}" fill="none" stroke="${o.color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="2" fill="${o.color}"/>
    </svg>`;
  }

  function dirArrow(dir) {
    if (dir === "up") return `<span class="dir-up" title="up">▲</span>`;
    if (dir === "down") return `<span class="dir-down" title="down">▼</span>`;
    return `<span class="dir-flat" title="flat">▶</span>`;
  }

  function scoreBar(v) {
    const pct = Math.round(Math.max(0, Math.min(1, v || 0)) * 100);
    return `<span class="score-pill"><span class="score-bar"><i style="width:${pct}%"></i></span>${(v || 0).toFixed(2)}</span>`;
  }

  function sourceChip(name) {
    return `<span class="src-chip">${esc(name)}</span>`;
  }

  function badge(text, cls) {
    return `<span class="badge ${cls || ""}">${esc(text)}</span>`;
  }

  /** 事件卡 */
  function eventCard(ev, opts) {
    const o = opts || {};
    const timeline = (ev.timeline || []).slice(-4).reverse();
    const tl = timeline.length > 1
      ? `<ul class="timeline-list">${timeline.slice(0, 3).map((t) =>
          `<li><span class="t-date">${esc((t.date || "").slice(5))}</span>
           ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.title || "")}</a>` : esc(t.title || "")}
           ${t.source ? `<span class="dim">· ${esc(t.source)}</span>` : ""}</li>`).join("")}</ul>`
      : "";
    const sources = (ev.sources || []).slice(0, 6).map(sourceChip).join("");
    const entities = (ev.entities || []).slice(0, 4)
      .map((e) => `<a class="badge" href="#/entity/${encodeURIComponent(e.id)}" data-nav>${esc(e.name)}</a>`).join("");
    const evUrl = ev.event_id ? `#/event/${ev.event_id}` : (ev.main_url || "#/feed");
    const srcUrl = ev.main_url || "";
    return `<article class="glass card hoverable event-card ${o.cls || ""}">
      <div class="event-top">
        ${badge(eventTypeLabel(ev.event_type), eventTypeCls(ev.event_type))}
        ${ev.category ? badge(`${catIcon(ev.category)} ${catLabel(ev.category)}`, catCls(ev.category)) : ""}
        ${ev.trend_state ? badge(stateLabel(ev.trend_state), stateCls(ev.trend_state)) : ""}
        ${ev.tier && ev.tier <= 2 ? badge("T" + ev.tier, "tier1") : ""}
      </div>
      <h3 class="event-title"><a href="${esc(evUrl)}" data-nav>${esc(ev.title || "")}</a></h3>
      ${ev.canonical_description ? `<p class="event-desc">${esc(ev.canonical_description)}</p>` : ""}
      <div class="event-meta">
        <span class="kv">🕒 ${esc(relTime(ev.last_seen_at) || "")}</span>
        ${srcUrl ? `<a class="kv hl" href="${esc(srcUrl)}" target="_blank" rel="noopener" title="${esc(i18n.t("common.open"))}">↗ ${esc(i18n.t("common.open"))}</a>` : ""}
        <span class="kv" title="${i18n.t("common.documents")}">📄 ${ev.source_count || (ev.sources || []).length}</span>
        <span class="kv" title="${i18n.t("common.sources")}">📡 ${(ev.sources || []).length}</span>
        ${typeof ev.importance_score === "number" ? `<span class="kv">${i18n.t("common.importance")} ${scoreBar(ev.importance_score)}</span>` : ""}
        ${typeof ev.confidence_score === "number" ? `<span class="kv">${i18n.t("common.confidence")} ${ev.confidence_score.toFixed(2)}</span>` : ""}
      </div>
      ${sources ? `<div class="event-sources">${sources}</div>` : ""}
      ${entities ? `<div class="event-sources">${entities}</div>` : ""}
      ${o.timeline !== false ? tl : ""}
    </article>`;
  }

  /** 文档行 */
  function docRow(doc, opts) {
    const o = opts || {};
    const meta = doc.metadata || {};
    let extra = [];
    if (meta.stars) extra.push(`⭐ ${Number(meta.stars).toLocaleString()}`);
    if (meta.downloads) extra.push(`⬇ ${Number(meta.downloads).toLocaleString()}`);
    if (meta.points) extra.push(`▲ ${meta.points}`);
    if (meta.language) extra.push(esc(meta.language));
    if (meta.pipeline_tag) extra.push(esc(meta.pipeline_tag));
    if (doc.author && doc.author.length) extra.push(esc(doc.author.slice(0, 2).join(", ")));
    return `<div class="doc-row">
      <div class="doc-main">
        <p class="doc-title"><a href="${esc(doc.url || "#")}" target="_blank" rel="noopener">${esc(doc.title || "")}</a></p>
        <div class="doc-sub">
          <span>${esc(doc.source || "")}</span>
          ${doc.category ? `<span>${catIcon(doc.category)} ${esc(catLabel(doc.category))}</span>` : ""}
          ${extra.length ? `<span>${extra.join(" · ")}</span>` : ""}
          <span class="mono">${esc(relTime(doc.published_at || doc.discovered_at))}</span>
        </div>
      </div>
      <div class="doc-side">
        ${doc.content_type ? badge(typeLabel(doc.content_type), typeCls(doc.content_type)) : ""}
        ${typeof doc.importance_score === "number" && o.score !== false ? scoreBar(doc.importance_score) : ""}
      </div>
    </div>`;
  }

  /** 趋势行 */
  function trendRow(item, idx, opts) {
    const o = opts || {};
    const m = item.metrics || {};
    const counts = m.counts || {};
    const sub = o.entity
      ? `${counts["30d"] || item.document_count || 0} docs · ${esc(item.type || "")}`
      : `${i18n.t("trends.docs_7d")} ${counts["7d"] || item.document_count || 0}`;
    return `<div class="trend-row">
      <span class="trend-rank">${String(idx + 1).padStart(2, "0")}</span>
      <div>
        <div class="trend-name">${item.icon ? item.icon + " " : ""}${esc(i18n.label(item.label) || item.name || item.topic)}
          <span class="dim mono" style="font-size:11px">${(item.score || 0).toFixed(2)}</span></div>
        <div class="trend-sub">${sub}${item.region ? " · " + esc(item.region) : ""}</div>
      </div>
      <div class="trend-right">
        ${sparkline(item.sparkline, { color: item.direction === "down" ? "#fb7185" : "var(--acc)" })}
        ${dirArrow(item.direction)}
      </div>
    </div>`;
  }

  function statBlock(num, label, accent) {
    return `<div class="stat"><span class="stat-num ${accent ? "accent" : ""}">${num}</span>
      <span class="stat-label">${esc(label)}</span></div>`;
  }

  function sectionHead(title, sub, moreHref, moreText) {
    return `<div class="section-head">
      <h2>${esc(title)}</h2>
      <div>
        ${sub ? `<span class="sub">${esc(sub)}</span>` : ""}
        ${moreHref ? ` <a class="more" href="${esc(moreHref)}" data-nav>${esc(moreText || i18n.t("common.more"))} →</a>` : ""}
      </div>
    </div>`;
  }

  function emptyState(text) {
    return `<div class="empty">${esc(text || i18n.t("common.empty"))}</div>`;
  }

  function loadingState() {
    return `<div class="loading">${esc(i18n.t("common.loading"))}</div>`;
  }

  function skeletons(n) {
    return `<div class="grid cols-2">${Array.from({ length: n || 4 }, () => `<div class="skeleton"></div>`).join("")}</div>`;
  }

  window.GECKO.ui = {
    esc, CATS, TYPES, EVENT_TYPES, TREND_STATE,
    catLabel, catIcon, catCls, typeLabel, typeCls, eventTypeLabel, eventTypeCls, stateLabel, stateCls,
    fmtDate, fmtDateTime, relTime, sparkline, dirArrow, scoreBar, badge, sourceChip,
    eventCard, docRow, trendRow, statBlock, sectionHead, emptyState, loadingState, skeletons,
  };
})();
