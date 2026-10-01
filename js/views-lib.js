/* ============================================================
   Views: Library — Research / Models / Projects / Organizations /
          Benchmarks / Sources / About
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  /* ---------- 通用：文档列表视图 ---------- */
  async function docListView(el, type, titleKey, subKey, opts) {
    const o = opts || {};
    el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
    const { docs, events } = await api.collect(o.days || 7);
    let items = docs.filter((d) => (o.types || [type]).includes(d.content_type));
    if (o.filter) items = items.filter(o.filter);
    items.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
    const shown = items.slice(0, o.limit || 80);

    const relEvents = (events || [])
      .filter((e) => (o.eventTypes || []).includes(e.event_type))
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 6);

    el.innerHTML = `<section class="fade-in">
      ${ui.sectionHead(i18n.t(titleKey), `${i18n.t(subKey)} · ${items.length}`)}
      ${relEvents.length ? `<div class="grid cols-2" style="margin-bottom:22px">${relEvents.map((e) => ui.eventCard(e, { timeline: false })).join("")}</div>` : ""}
      <div class="grid dashboard">
        <div class="stack" style="gap:0">${shown.map((d) => ui.docRow(d)).join("") || ui.emptyState()}</div>
        <div class="stack" style="gap:22px">${o.side ? o.side(items) : ""}</div>
      </div>
    </section>`;
  }

  function topSourcesSide(items) {
    const bySrc = {};
    items.forEach((d) => { bySrc[d.source] = (bySrc[d.source] || 0) + 1; });
    const rows = Object.entries(bySrc).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return `<section class="glass card">${ui.sectionHead(i18n.t("common.sources"))}
      <div class="stack" style="gap:7px">${rows.map(([s, n]) =>
        `<div class="row" style="justify-content:space-between"><span class="kv">${ui.esc(s)}</span><span class="mono kv">${n}</span></div>`).join("") || ui.emptyState()}</div>
    </section>`;
  }

  /* ---------- Research ---------- */
  const research = {
    async render(el, params, route, alive) {
      await docListView(el, "paper", "research.title", "research.sub", {
        types: ["paper"], days: 7, limit: 80, eventTypes: ["paper"],
        side: (items) => {
          const cats = {};
          items.forEach((d) => (d.metadata && d.metadata.categories || []).forEach((c) => { cats[c] = (cats[c] || 0) + 1; }));
          const rows = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 14);
          return `${topSourcesSide(items)}
          <section class="glass card">${ui.sectionHead("arXiv Categories")}
            <div class="chip-row">${rows.map(([c, n]) => `<span class="badge">${ui.esc(c)} <b class="mono">${n}</b></span>`).join("") || ui.emptyState()}</div>
          </section>`;
        },
      });
    },
  };

  /* ---------- Models ---------- */
  const models = {
    async render(el) {
      await docListView(el, "model", "models.title", "models.sub", {
        types: ["model"], days: 7, limit: 70, eventTypes: ["model_release", "release"],
        side: (items) => {
          const top = items.slice().sort((a, b) => ((b.metadata || {}).downloads || 0) - ((a.metadata || {}).downloads || 0)).slice(0, 10);
          return `<section class="glass card">${ui.sectionHead(i18n.lang === "en" ? "Most downloaded" : i18n.lang === "ja" ? "ダウンロード上位" : "下载量领先")}
            <div class="stack" style="gap:7px">${top.map((d) => `<div class="row" style="justify-content:space-between">
              <a href="${ui.esc(d.url)}" target="_blank" rel="noopener" class="kv" style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${ui.esc(d.title)}</a>
              <span class="mono kv">${Number((d.metadata || {}).downloads || 0).toLocaleString()}</span></div>`).join("")}</div>
          </section>`;
        },
      });
    },
  };

  /* ---------- Projects ---------- */
  const projects = {
    async render(el) {
      await docListView(el, "repository", "projects.title", "projects.sub", {
        types: ["repository"], days: 7, limit: 70, eventTypes: ["project", "release"],
        side: (items) => {
          const top = items.slice().sort((a, b) => ((b.metadata || {}).stars || 0) - ((a.metadata || {}).stars || 0)).slice(0, 10);
          const byLang = {};
          items.forEach((d) => { const l = (d.metadata || {}).language; if (l) byLang[l] = (byLang[l] || 0) + 1; });
          return `<section class="glass card">${ui.sectionHead(i18n.lang === "en" ? "Top starred" : i18n.lang === "ja" ? "スター上位" : "Star 领先")}
            <div class="stack" style="gap:7px">${top.map((d) => `<div class="row" style="justify-content:space-between">
              <a href="${ui.esc(d.url)}" target="_blank" rel="noopener" class="kv" style="max-width:210px;overflow:hidden;text-overflow:ellipsis">${ui.esc(d.title.split(" — ")[0])}</a>
              <span class="mono kv">⭐ ${Number((d.metadata || {}).stars || 0).toLocaleString()}</span></div>`).join("")}</div>
          </section>
          <section class="glass card">${ui.sectionHead(i18n.lang === "en" ? "Languages" : "语言")}
            <div class="chip-row">${Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([l, n]) => `<span class="badge">${ui.esc(l)} <b class="mono">${n}</b></span>`).join("")}</div>
          </section>`;
        },
      });
    },
  };

  /* ---------- Organizations / Benchmarks（实体驱动） ---------- */
  async function entityView(el, wantTypes, titleKey, subKey) {
    el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
    const ents = await api.entities();
    const list = ((ents && ents.entities) || []).filter((e) => wantTypes.includes(e.type));
    el.innerHTML = `<section class="fade-in">
      ${ui.sectionHead(i18n.t(titleKey), `${i18n.t(subKey)} · ${list.length}`)}
      <div class="grid cols-3">
        ${list.map((e) => `<article class="glass card hoverable">
          <div class="row" style="justify-content:space-between">
            <div class="trend-name">${e.type === "organization" ? "🏢" : "📊"} ${ui.esc(e.name)}</div>
            <span class="badge ${e.tier === 1 ? "tier1" : ""}">${ui.esc(e.type)}${e.region ? " · " + ui.esc(e.region) : ""}</span>
          </div>
          <div class="kv" style="margin:6px 0">${e.doc_count} documents · ${(e.sources || []).length} sources</div>
          <div class="stack" style="gap:5px">
            ${(e.recent_titles || []).slice(0, 3).map((t) => `<a href="${ui.esc(t.url || "#")}" target="_blank" rel="noopener" class="kv" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">· ${ui.esc(t.title)}</a>`).join("")}
          </div>
          ${(e.relations || []).length ? `<div class="chip-row" style="margin-top:8px">
            ${e.relations.slice(0, 5).map((r) => `<span class="badge">${ui.esc(r.rel)} → ${ui.esc(r.target_name)}</span>`).join("")}
          </div>` : ""}
        </article>`).join("") || ui.emptyState()}
      </div>
    </section>`;
  }

  const organizations = { render: (el) => entityView(el, ["organization"], "orgs.title", "orgs.sub") };
  const benchmarks = { render: (el) => entityView(el, ["benchmark"], "benchmarks.title", "benchmarks.sub") };

  /* ---------- Sources ---------- */
  const sources = {
    async render(el) {
      const idx = await api.index();
      const list = (idx && idx.sources) || [];
      const p = (idx && idx.pipeline) || {};
      const badge = (s) => s === "ok" ? `<span class="badge acc">● ${i18n.t("sources.ok")}</span>`
        : s === "error" ? `<span class="badge rose">● ${i18n.t("sources.error")}</span>`
        : `<span class="badge">○ ${i18n.t("sources.idle")}</span>`;
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(i18n.t("sources.title"), i18n.t("sources.sub"))}
        <div class="grid dashboard">
          <section class="glass card">
            <div class="stack" style="gap:0">
              ${list.map((s) => `<div class="doc-row">
                <div class="doc-main">
                  <p class="doc-title">${ui.esc(i18n.label(s.label) || s.id)}</p>
                  <div class="doc-sub"><span class="mono">${ui.esc(s.id)}</span><span>${ui.esc(s.type)}</span>
                    ${s.error ? `<span class="hl">${ui.esc(String(s.error).slice(0, 80))}</span>` : ""}</div>
                </div>
                <div class="doc-side">${badge(s.status)}
                  <span class="mono kv">${s.count || 0} · ${s.latency_ms ? Math.round(s.latency_ms / 1000) + "s" : "—"}</span></div>
              </div>`).join("") || ui.emptyState()}
            </div>
          </section>
          <div class="stack" style="gap:22px">
            <section class="glass card">${ui.sectionHead(i18n.t("sources.pipeline"))}
              <div class="stack" style="gap:7px">
                <div class="row" style="justify-content:space-between"><span class="kv">${i18n.t("sources.newn")}</span><b class="mono">${(p.new_documents || 0)}</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">${i18n.t("sources.dedup")} (exact/near)</span><b class="mono">${((p.dedup || {}).exact || 0)} / ${((p.dedup || {}).near || 0)}</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">Runtime</span><b class="mono">${Math.round((p.runtime_ms || 0) / 1000)}s</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">LLM</span><b class="mono">${idx && idx.llm_enabled ? "on" : "off"}</b></div>
              </div>
            </section>
            <section class="glass card">${ui.sectionHead(i18n.lang === "en" ? "Category distribution (7d)" : i18n.lang === "ja" ? "カテゴリ分布（7日）" : "分类分布（7 天）")}
              <div class="chip-row">${Object.entries((idx && idx.stats && idx.stats.category_distribution) || {})
                .sort((a, b) => b[1] - a[1]).map(([c, n]) => `<a class="badge" href="#/feed?cat=${c}" data-nav>${ui.catIcon(c)} ${ui.catLabel(c)} <b class="mono">${n}</b></a>`).join("")}</div>
            </section>
          </div>
        </div>
      </section>`;
    },
  };

  /* ---------- About ---------- */
  const about = {
    async render(el) {
      const lang = i18n.lang;
      const T = {
        what: {
          zh: ["事件为中心的数据模型", "文章 → 去重 → 事件聚类 → 实体关联，用户看到的是事件而不是重复新闻。",
               "Claim → Evidence 事实链", "日报中的关键结论绑定来源证据，单来源结论明确标注。",
               "趋势引擎", "TrendScore = 30% 增速 + 20% 新颖度 + 20% 来源多样性 + 15% 权威度 + 10% 采用度 + 5% 新鲜度。",
               "知识图谱", "组织 / 模型 / 概念 / 基准实体与关系（develops / implements / evaluated_on …）。",
               "Hybrid 检索与 Ask AI", "本地全文 + 实体 + 事件检索，带引用回答问题。"],
          en: ["Event-centric data model", "Articles are deduplicated and clustered into events — you see events, not duplicate news.",
               "Claim → Evidence chain", "Key conclusions in daily reports are bound to source evidence; single-source claims are marked.",
               "Trend engine", "TrendScore = 30% velocity + 20% novelty + 20% diversity + 15% authority + 10% adoption + 5% recency.",
               "Knowledge graph", "Organizations / models / concepts / benchmarks with relations (develops, implements, evaluated_on…).",
               "Hybrid retrieval & Ask AI", "Local full-text + entity + event retrieval with cited answers."],
          ja: ["イベント中心のデータモデル", "記事は重複排除されイベントにクラスタリングされます。",
               "Claim → Evidence チェーン", "日報の結論は出典証拠に紐付き、単一ソースは明示されます。",
               "トレンドエンジン", "TrendScore = 30% 速度 + 20% 新規性 + 20% 多様性 + 15% 権威性 + 10% 採用度 + 5% 鮮度。",
               "ナレッジグラフ", "組織・モデル・概念・ベンチマークの関係を保持。",
               "ハイブリッド検索と Ask AI", "ローカル全文＋エンティティ＋イベント検索、引用付き回答。"],
        },
        how: {
          zh: ["1. 采集 Source Adapter", "arXiv / GitHub / Hugging Face / Hacker News / 官方博客 / 媒体 / 社区 RSS",
               "2. 标准化 Normalize", "统一为 Canonical Document（来源、类型、时间、语言、哈希）",
               "3. 三层去重", "URL/内容哈希精确去重 → 标题近似去重 → 语义合并进事件",
               "4. AI 理解层", "规则+词典分类（多标签）、实体抽取、重要性/新颖度评分",
               "5. 事件聚类", "同一事件的多来源报道合并，保留时间线与来源多样性",
               "6. 趋势引擎", "24h/7d/30d 窗口的加权趋势分与方向",
               "7. 日报 Agent", "头条选择 → 分节 → Claim/Evidence 关联 → 发布",
               "运行方式", "GitHub Actions 定时执行 Python 管线，输出静态 JSON，GitHub Pages 直接托管"],
          en: ["1. Ingest (Source Adapters)", "arXiv / GitHub / Hugging Face / Hacker News / official blogs / media / community RSS",
               "2. Normalize", "Unified Canonical Document (source, type, time, language, hashes)",
               "3. Three-level dedup", "URL/content-hash exact → near-duplicate titles → semantic merge into events",
               "4. AI understanding", "Rule + lexicon classification (multi-label), entity extraction, importance/novelty scoring",
               "5. Event clustering", "Multi-source reports of one event merged, keeping timeline and source diversity",
               "6. Trend engine", "Weighted trend scores and direction over 24h/7d/30d windows",
               "7. Report agent", "Headline selection → sections → Claim/Evidence linking → publish",
               "How it runs", "GitHub Actions executes the Python pipeline on a schedule, emitting static JSON served by GitHub Pages"],
          ja: ["1. 収集（Source Adapter）", "arXiv / GitHub / Hugging Face / Hacker News / 公式ブログ / メディア / コミュニティRSS",
               "2. 正規化", "Canonical Document に統一",
               "3. 三段階の重複排除", "URL/ハッシュ → 近似タイトル → 意味的統合",
               "4. AI理解層", "ルール＋辞書による分類、エンティティ抽出、スコアリング",
               "5. イベントクラスタリング", "同一イベントの複数ソース報道を統合",
               "6. トレンドエンジン", "24h/7d/30d の重み付きスコア",
               "7. レポートエージェント", "ヘッドライン選定 → セクション → 根拠リンク → 公開",
               "実行方法", "GitHub Actions が定期実行し、静的JSONを生成して GitHub Pages で配信"],
        },
      };
      const sec = (title, arr) => `<section class="glass card">
        <h2 style="font-size:16px;margin:0 0 12px">${ui.esc(title)}</h2>
        <div class="stack" style="gap:10px">${arr.map((x, i) => i % 2 === 0
          ? `<div style="font-weight:600;font-size:13.5px;margin-top:6px">${ui.esc(x)}</div>`
          : `<div class="kv" style="display:block;line-height:1.7">${ui.esc(x)}</div>`).join("")}</div>
      </section>`;
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead("GECKO", i18n.t("about.sub"))}
        <div class="grid dashboard">
          <div class="stack" style="gap:18px">
            ${sec(i18n.t("about.what"), T.what[lang] || T.what.zh)}
            ${sec(i18n.t("about.how"), T.how[lang] || T.how.zh)}
          </div>
          <div class="stack" style="gap:18px">
            <section class="glass card" style="text-align:center;padding:26px">
              <img src="images/gecko-logo.svg" alt="GECKO" style="width:120px;height:auto;color:var(--acc)">
              <div style="margin-top:10px;letter-spacing:4px;font-weight:700">GECKO</div>
              <div class="kv" style="justify-content:center">${ui.esc(i18n.t("about.sub"))}</div>
            </section>
            <section class="glass card">${ui.sectionHead(i18n.t("about.principles"))}
              <div class="stack" style="gap:8px;font-size:13px;color:var(--fg-muted)">
                <div>① ${lang === "en" ? "Events, not articles, are the core object." : lang === "ja" ? "「記事」ではなく「イベント」が中心です。" : "以事件为核心对象，而不是文章。"}</div>
                <div>② ${lang === "en" ? "Claim → Evidence → Source as the factual base." : lang === "ja" ? "Claim → Evidence → Source を事実の基盤に。" : "以 Claim → Evidence → Source 作为事实基础。"}</div>
                <div>③ ${lang === "en" ? "Deterministic pipeline first; LLM as an optional enhancer." : lang === "ja" ? "決定論的パイプライン優先、LLMは任意の強化。" : "确定性管线优先，LLM 作为可选增强。"}</div>
                <div>④ ${lang === "en" ? "New ≠ important — novelty and importance are scored separately." : lang === "ja" ? "新しさ≠重要度。両者は別に評価。" : "新 ≠ 重要：新颖度与重要性分开计算。"}</div>
              </div>
            </section>
            <section class="glass card">${ui.sectionHead(i18n.t("about.disclaimer"))}
              <div class="kv" style="display:block;line-height:1.7">
                ${lang === "en"
                  ? "All content links to its original source; this site stores titles, short excerpts and metadata for aggregation and analysis, with AI-generated notes marked as such. Data is refreshed automatically."
                  : lang === "ja"
                  ? "すべての内容は原文へリンクします。本サイトはタイトル・短い抜粋・メタデータのみを集約目的で保存し、AI生成の要約はその旨明示されます。データは自動更新されます。"
                  : "所有内容均链接至原文；本站仅聚合标题、简短摘要与元数据用于分析，AI 生成内容会明确标注。数据自动更新。"}
              </div>
            </section>
          </div>
        </div>
      </section>`;
    },
  };

  window.GECKO.views.lib = {
    render(el, params, route, alive) {
      const name = (route && route.name) || "research";
      const v = { research, models, projects, organizations, benchmarks, sources, about }[name] || research;
      return v.render(el, params, route, alive);
    },
  };
  window.GECKO.views.research = research;
  window.GECKO.views.models = models;
})();
