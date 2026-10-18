/* GECKO · 静态页：Agent 接入 / 使用规则 / 隐私 / 更新日志 */
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};
  window.GECKO.views = window.GECKO.views || {};

  const T = (zh, en, ja) => (window.GECKO.i18n.lang === "en" ? en : window.GECKO.i18n.lang === "ja" ? ja : zh);
  const base = () => (window.GECKO.api && window.GECKO.api.base) || "data/";

  const ENDPOINTS = [
    ["data/index.json", "站点状态：更新时间、统计、分类分布、信源健康", "Site state: updated_at, stats, categories, source health"],
    ["data/days/&lt;YYYY-MM-DD&gt;.json", "单日文档与事件（含 heat / timeline）", "One day of documents and events (with heat, timeline)"],
    ["data/trends.json", "趋势雷达（10 个方向 + 实体热度 + 权重）", "Trend radar (topics, entity heat, weights)"],
    ["data/entities.json", "实体图谱（组织 / 模型 / 概念 / 基准）", "Entity graph (orgs, models, concepts, benchmarks)"],
    ["data/topics.json", "主题聚合（方向 / 组织 / 形态）", "Topic aggregation (directions / orgs / formats)"],
    ["data/reports/index.json", "日报 / 周报 / 月报索引", "Daily / weekly / monthly report index"],
    ["data/reports/&lt;date&gt;.json", "某日三语日报（headlines / timeline / claims）", "Trilingual daily report for a date"],
    ["data/feed.xml", "RSS：全部事件（按热度排序）", "RSS: all events, ordered by heat"],
    ["data/feed-top.xml", "RSS：精选（热度 ≥ 3 且多来源）", "RSS: curated (heat ≥ 3, multi-source)"],
  ];

  const agent = {
    async render(el) {
      const { ui } = window.GECKO;
      const site = "https://HuanMoovo.github.io/gecko";
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("Agent 接入", "Agent access", "エージェント接続"),
          T("静态 JSON API 与 RSS，匿名只读，无需 API Key", "Static JSON API and RSS — anonymous read-only, no API key", "静的 JSON API と RSS。匿名・読み取り専用・APIキー不要"))}

        <div class="glass card" style="padding:20px 22px">
          <p style="margin:0 0 14px;font-size:14px;line-height:1.75">
            ${T("本站是纯静态站点：所有数据以 JSON 与 RSS 形式公开在同一份仓库里，没有鉴权、没有请求次数限制。任何脚本、Agent 或 MCP 服务都可以直接抓取。",
              "This site is fully static: every dataset is published as plain JSON and RSS in the same repository, with no auth and no rate limit. Any script, agent or MCP server can fetch it directly.",
              "当サイトは完全静的です。全データは同じリポジトリ内に JSON / RSS として公開され、認証も回数制限もありません。")}
          </p>
          <div class="chip-row">
            <a class="badge acc" href="data/feed.xml" target="_blank" rel="noopener">RSS · feed.xml</a>
            <a class="badge acc" href="data/feed-top.xml" target="_blank" rel="noopener">RSS · feed-top.xml</a>
            <a class="badge" href="data/index.json" target="_blank" rel="noopener">index.json</a>
            <a class="badge" href="data/topics.json" target="_blank" rel="noopener">topics.json</a>
          </div>
        </div>

        <div class="section">
          ${ui.sectionHead(T("可用端点", "Endpoints", "エンドポイント"), String(ENDPOINTS.length))}
          <div class="glass card" style="padding:6px 0">
            ${ENDPOINTS.map(([path, zh, en]) => `<div class="api-row">
              <code class="mono">/${path}</code>
              <span class="kv">${ui.esc(T(zh, en, zh))}</span>
            </div>`).join("")}
          </div>
        </div>

        <div class="section">
          ${ui.sectionHead(T("示例", "Examples", "例"), "")}
          <div class="glass card" style="padding:16px 18px">
            <pre class="api-pre"># 最新日报的事件时间线
curl -s ${site}/data/reports/index.json | jq '.reports[0].date'

# 取某天的全部事件，按热度排序
curl -s ${site}/data/days/2026-10-18.json \\
  | jq '.events | sort_by(-.heat) | .[0:5] | .[] | {title, heat, source_count}'

# 订阅精选（热度 ≥ 3 且多来源）
curl -s ${site}/data/feed-top.xml</pre>
          </div>
        </div>

        <div class="glass card hot-explain">
          <h3 style="font-size:15px;margin:0 0 10px">📌 ${T("字段约定", "Field contract", "フィールド規約")}</h3>
          <ul class="doc-list">
            <li><b class="mono">heat</b> — ${T("事件热度（独立来源 × 层级权重，18 小时半衰期）", "event heat (distinct sources × tier weight, 18h half-life)", "イベント熱度")}</li>
            <li><b class="mono">heat_state</b> — surging / rising / active / cooling</li>
            <li><b class="mono">source_count</b> — ${T("该事件的文档数；sources 为去重来源", "documents in the event; sources are de-duplicated", "文書数 / sources は重複除去済み")}</li>
            <li><b class="mono">tier</b> — 1 ${T("官方一手", "first-party", "一次情報")} / 2 ${T("准官方", "near-official", "準公式")} / 3 ${T("媒体", "media", "メディア")} / 4 ${T("个人", "individual", "個人")}</li>
            <li><b class="mono">intro / title_i18n / narrative_i18n</b> — ${T("中英日三语", "zh / en / ja", "中英日")}</li>
          </ul>
        </div>
      </section>`;
    },
  };

  const terms = {
    async render(el) {
      const { ui } = window.GECKO;
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("使用规则", "Terms of use", "利用規約"), T("本站网页、RSS 与公开数据的适用范围", "Scope for the site, RSS and public data", "サイト・RSS・公開データの利用範囲"))}
        <div class="glass card doc-page">
          <h3>${T("这是什么", "What this is", "概要")}</h3>
          <p>${T("GECKO 是一个自动化的 AI 前沿情报聚合站：程序从公开信源抓取标题与摘要，去重、聚类为事件，计算热度与趋势，并生成中英日三语的日报、周报与月报。",
            "GECKO is an automated AI-frontier intelligence aggregator: it collects public titles and summaries, de-duplicates and clusters them into events, computes heat and trends, and generates trilingual daily/weekly/monthly reports.",
            "GECKO は自動化された AI 情報アグリゲータです。公開ソースから見出しと要約を収集し、重複排除・イベント化・熱度算出を行い、中英日のレポートを生成します。")}</p>

          <h3>${T("内容与版权", "Content and copyright", "コンテンツと著作権")}</h3>
          <p>${T("站内展示的标题、摘要与链接均来自原始发布方，版权归原作者与发布机构所有。本站仅做索引与聚合，不转载全文；所有条目都提供原文链接，点击即可回到发布方页面。若你是权利方并希望下架某条内容，请通过仓库 Issue 联系，我们会在下一次管线运行时移除。",
            "Titles, summaries and links displayed here belong to their original publishers. This site indexes and aggregates only — it does not republish full text, and every item links back to the source. Rights holders can request removal via the repository issues and we will drop the item on the next pipeline run.",
            "見出し・要約・リンクは原配信元に帰属します。当サイトは索引と集約のみを行い、全文は転載しません。権利者はリポジトリの Issue で削除を依頼できます。")}</p>

          <h3>${T("数据使用", "Using the data", "データ利用")}</h3>
          <p>${T("JSON 与 RSS 对所有人开放，无需授权：你可以自由订阅、二次分析或接入自己的 Agent。转载时请保留指向原文与本站事件页的链接。请勿以高于每 4 小时的频率反复请求同一静态文件（数据本身就每 4 小时更新一次）。",
            "JSON and RSS are open to everyone with no authorisation: subscribe, analyse, or wire them into your own agent. When republishing, keep links to the original and to the event page. Please avoid re-fetching the same static file more often than every 4 hours — the data itself only updates that often.",
            "JSON と RSS は誰でも利用できます。再配布の際は原文とイベントページへのリンクを残してください。同じ静的ファイルを4時間未満の間隔で連続取得しないでください。")}</p>

          <h3>${T("免责", "Disclaimer", "免責")}</h3>
          <p>${T("分类、热度、置信度与综述由程序自动生成，可能存在偏差或错误，不构成任何投资、法律或采购建议。热度衡量的是讨论热度，不代表报道质量。",
            "Categories, heat, confidence and summaries are machine-generated and may be wrong. Nothing here is investment, legal or procurement advice. Heat measures buzz, not quality.",
            "分類・熱度・信頼度・要約は自動生成であり、誤りを含む可能性があります。投資・法務・調達の助言ではありません。")}</p>
        </div>
      </section>`;
    },
  };

  const privacy = {
    async render(el) {
      const { ui } = window.GECKO;
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("隐私说明", "Privacy", "プライバシー"), T("本站如何处理你的数据", "How this site handles your data", "データの取り扱い"))}
        <div class="glass card doc-page">
          <h3>${T("不收集个人数据", "No personal data collected", "個人データの収集なし")}</h3>
          <p>${T("本站是纯静态页面，没有后端服务、没有账号系统、没有埋点脚本、没有第三方统计。我们不设置追踪 Cookie，也不会把你的阅读行为上传到任何服务器。",
            "This is a fully static site: no backend, no accounts, no analytics scripts, no third-party trackers. No tracking cookies are set and no reading behaviour leaves your browser.",
            "完全な静的サイトです。バックエンド・アカウント・解析スクリプト・第三者トラッカーはありません。")}</p>

          <h3>${T("本地存储了哪些东西", "What is stored locally", "ローカル保存されるもの")}</h3>
          <p>${T("仅三类，全部保存在你自己的浏览器 localStorage：主题（深/浅）、语言（中/英/日）、阅读设置（字号 / 字体 / 密度），以及你的收藏列表。清除站点数据即可全部删除；也可以在「阅读设置」里导出或导入 JSON 备份。",
            "Only three things, all in your own localStorage: theme, language, reading preferences (size / typeface / density), and your favorites. Clearing site data removes everything; the reading-settings page can export or import a JSON backup.",
            "localStorage に保存されるのは、テーマ・言語・表示設定（文字サイズ/書体/密度）・お気に入りのみです。サイトデータを消去すればすべて削除されます。")}</p>

          <h3>${T("托管方日志", "Hosting logs", "ホスティングのログ")}</h3>
          <p>${T("页面由 GitHub Pages 提供，访问日志由 GitHub 按其隐私政策处理，本站无法访问也无法导出这些日志。",
            "Pages are served by GitHub Pages; access logs are handled by GitHub under its privacy policy and are not accessible to this site.",
            "ページは GitHub Pages から配信され、アクセスログは GitHub のプライバシーポリシーに従って処理されます。")}</p>

          <h3>${T("外部链接", "External links", "外部リンク")}</h3>
          <p>${T("打开原文会跳转到发布方网站，其数据实践由该网站决定。",
            "Opening an original article takes you to the publisher's site, whose data practices are their own.",
            "原文を開くと配信元サイトへ移動します。")}</p>
        </div>
      </section>`;
    },
  };

  const CHANGELOG = [
    ["v2.1", "2026-10-18", "日系手账视觉：浅蓝场景、照片卡 / 便签 / 胶带 / 星星 / 曲线持续漂浮；默认浅色主题",
      "Journal visual: light-blue scrapbook scene with drifting photo cards, notes, tape, stars and curves; light theme by default"],
    ["v2.0", "2026-10-18", "热度引擎（按事件算，18h 半衰期）· 主题雷达（方向/组织/形态）· 热点榜 · 事件综述 · 搜索高亮 · 精选 RSS",
      "Heat engine (per event, 18h half-life) · topic radar · hot board · event digest · highlighted search · curated RSS"],
    ["v1.9", "2026-10-18", "社区源 AI 相关性守卫；清理 762 篇无关文档 / 682 个孤立事件",
      "Community source relevance guard; removed 762 off-topic docs and 682 orphan events"],
    ["v1.8", "2026-10-18", "磨砂玻璃与线稿视觉；周报 / 月报；收藏与阅读设置（可导出备份）",
      "Frosted-glass look; weekly/monthly reports; favorites and reading settings with export"],
    ["v1.7", "2026-10-01", "三语日报（中/英/日）+ 事件时间线",
      "Trilingual daily reports with event timeline"],
    ["v1.0", "2026-10-01", "GECKO 重构为事件中心的情报平台：去重、聚类、趋势、日报",
      "GECKO rebuilt as an event-centric intelligence platform"],
  ];

  const changelog = {
    async render(el) {
      const { ui } = window.GECKO;
      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("更新日志", "Changelog", "更新履歴"), T("功能更新与优化记录", "Feature updates and refinements", "機能更新の記録"))}
        <div class="glass card" style="padding:8px 0">
          ${CHANGELOG.map(([v, d, zh, en]) => `<div class="log-row">
            <div class="log-ver mono">${ui.esc(v)}</div>
            <div class="log-body">
              <div class="kv mono">${ui.esc(d)}</div>
              <div style="font-size:13.5px;line-height:1.6;margin-top:3px">${ui.esc(T(zh, en, zh))}</div>
            </div>
          </div>`).join("")}
        </div>
      </section>`;
    },
  };

  window.GECKO.views.agent = agent;
  window.GECKO.views.terms = terms;
  window.GECKO.views.privacy = privacy;
  window.GECKO.views.changelog = changelog;
})();
