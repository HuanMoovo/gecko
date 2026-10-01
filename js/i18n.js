/* ============================================================
   GECKO i18n — zh / en / ja
   ============================================================ */
window.GECKO = window.GECKO || {};

(function () {
  const DICT = {
    zh: {
      "brand.sub": "AI 前沿情报平台",
      "nav.home": "首页", "nav.feed": "信息流", "nav.trends": "趋势雷达", "nav.research": "论文",
      "nav.models": "模型", "nav.projects": "开源", "nav.reports": "日报", "nav.ask": "Ask AI",
      "nav.more": "更多", "nav.organizations": "组织动态", "nav.benchmarks": "基准评测",
      "nav.deep": "深度研究", "nav.sources": "来源健康", "nav.about": "关于",

      "hero.eyebrow": "AI Frontier Intelligence",
      "hero.title": "把海量 AI 信息，压缩成可追踪的技术情报",
      "hero.lead": "聚合论文、模型发布、开源项目、官方博客与行业动态；自动去重、事件聚类、实体关联与趋势计算，每日生成带证据链的情报报告。",
      "hero.docs": "文档", "hero.events": "事件", "hero.sources": "信源", "hero.today": "今日新增",
      "hero.updated": "更新于", "hero.llm_on": "AI 增强已启用", "hero.llm_off": "规则模式运行",

      "sec.headlines": "今日头条", "sec.headlines.sub": "按重要性 · 来源数 · 来源多样性排序",
      "sec.trend_radar": "趋势雷达", "sec.trend_radar.sub": "Velocity · Novelty · Diversity · Authority",
      "sec.latest": "最新事件", "sec.latest.sub": "文章已按事件归并",
      "sec.by_cat": "分类浏览", "sec.today_docs": "今日文档",

      "feed.title": "信息流", "feed.all": "全部", "feed.day": "日期",
      "feed.sort": "排序", "feed.sort.importance": "重要性", "feed.sort.time": "时间", "feed.sort.sources": "来源数",
      "feed.view.events": "事件", "feed.view.docs": "全部文档", "feed.search.ph": "过滤当前视图…",
      "feed.empty": "这一天还没有数据",

      "trends.title": "趋势雷达", "trends.sub": "综合增速、新颖度、来源多样性、权威度、采用度与新鲜度加权计算",
      "trends.window": "窗口", "trends.topics": "技术方向", "trends.entities": "组织与模型",
      "trends.weights": "权重配置", "trends.w.velocity": "增速", "trends.w.novelty": "新颖度",
      "trends.w.diversity": "来源多样性", "trends.w.authority": "权威度", "trends.w.adoption": "采用度",
      "trends.w.recency": "新鲜度", "trends.metrics": "指标", "trends.docs_7d": "7 天文档",
      "trends.score": "趋势分",

      "research.title": "研究论文", "research.sub": "来自 arXiv 等来源的最新论文，按重要性排序",
      "models.title": "模型中心", "models.sub": "Hugging Face 趋势模型与相关发布事件",
      "projects.title": "开源项目", "projects.sub": "GitHub 活跃热门 AI 仓库",
      "orgs.title": "组织动态", "orgs.sub": "机构 / 实验室的近期动向与关联",
      "benchmarks.title": "基准评测", "benchmarks.sub": "Benchmark 相关的信息与事件",
      "deep.title": "深度研究", "deep.sub": "跨来源检索 · 事件时间线 · 证据链汇编",

      "reports.title": "AI 日报", "reports.sub": "每日自动生成的情报报告，永久保存",
      "report.headlines": "今日头条", "report.sections": "今日重点", "report.models": "新模型",
      "report.papers": "新论文", "report.projects": "开源项目", "report.datasets": "数据集",
      "report.trends": "趋势变化", "report.rising": "上升", "report.cooling": "降温", "report.new": "新出现",
      "report.watchlist": "持续追踪", "report.claims": "关键结论与证据", "report.stats": "今日数据",
      "report.verification": "验证", "report.evidence": "证据", "report.back": "返回日报列表",
      "report.no_report": "该日暂无报告",

      "ask.title": "Ask AI Frontier", "ask.sub": "基于本地知识库（事件 / 文档 / 实体）检索并组织答案，所有结论附来源引用",
      "ask.ph": "例如：最近 Agent 方向有什么突破？", "ask.btn": "提问",
      "ask.examples": "示例问题", "ask.empty": "输入问题后，将检索事件库与实体图谱生成带引用的答案",
      "ask.llm.note": "可选：配置 LLM API Key 以生成更完整的综述（仅保存在你的浏览器本地）",
      "ask.llm.placeholder": "可选：sk-… （DeepSeek / OpenAI 兼容）",

      "sources.title": "来源健康", "sources.sub": "各数据源的抓取状态、延迟与条数",
      "sources.status": "状态", "sources.count": "条数", "sources.latency": "延迟",
      "sources.ok": "正常", "sources.error": "异常", "sources.idle": "未运行",
      "sources.pipeline": "管线统计", "sources.dedup": "去重", "sources.newn": "新增文档",

      "about.title": "关于 GECKO", "about.sub": "AI Frontier Intelligence Platform",
      "about.what": "平台能力", "about.how": "数据管线", "about.principles": "设计原则",
      "about.disclaimer": "说明",

      "common.loading": "加载中…", "common.empty": "暂无数据", "common.updated": "更新于",
      "common.sources": "来源", "common.documents": "文档", "common.events": "事件",
      "common.importance": "重要性", "common.novelty": "新颖度", "common.confidence": "置信度",
      "common.trend": "趋势", "common.category": "分类", "common.all": "全部",
      "common.more": "更多", "common.view": "查看", "common.open": "打开原文", "common.timeline": "时间线",
      "common.search": "搜索", "common.search.ph": "搜索事件 / 文档 / 实体…",
      "common.search.hint": "Enter 打开首个结果 · Esc 关闭",
      "common.no_result": "没有匹配结果", "common.back": "返回",
      "common.detail": "详情", "common.related": "相关", "common.entities": "实体",
      "common.deeplink": "原文链接", "common.date": "日期", "common.tier": "来源层级",
      "common.share": "复制链接", "common.copied": "已复制链接",
      "common.demo": "演示数据", "common.fetch_error": "数据加载失败，请稍后重试",

      "footer.tagline": "AI Frontier Intelligence Platform",
      "footer.sources": "来源健康", "footer.about": "关于与数据说明",
      "search.placeholder": "搜索事件 / 文档 / 实体…", "search.hint": "Enter 打开首个结果 · Esc 关闭 · 支持中英日关键词与实体",
    },

    en: {
      "brand.sub": "AI Frontier Intelligence",
      "nav.home": "Home", "nav.feed": "Feed", "nav.trends": "Trends", "nav.research": "Research",
      "nav.models": "Models", "nav.projects": "Open Source", "nav.reports": "Reports", "nav.ask": "Ask AI",
      "nav.more": "More", "nav.organizations": "Organizations", "nav.benchmarks": "Benchmarks",
      "nav.deep": "Deep Research", "nav.sources": "Source Health", "nav.about": "About",

      "hero.eyebrow": "AI Frontier Intelligence",
      "hero.title": "Turn the AI firehose into trackable intelligence",
      "hero.lead": "Papers, model releases, open-source projects, official blogs and industry news — automatically deduplicated, clustered into events, linked into entities, and scored into daily reports with evidence chains.",
      "hero.docs": "Documents", "hero.events": "Events", "hero.sources": "Sources", "hero.today": "New today",
      "hero.updated": "Updated", "hero.llm_on": "AI enhancement on", "hero.llm_off": "Rule mode",

      "sec.headlines": "Today's Headlines", "sec.headlines.sub": "Ranked by importance · sources · diversity",
      "sec.trend_radar": "Trend Radar", "sec.trend_radar.sub": "Velocity · Novelty · Diversity · Authority",
      "sec.latest": "Latest Events", "sec.latest.sub": "Articles merged into events",
      "sec.by_cat": "Browse by Category", "sec.today_docs": "Today's Documents",

      "feed.title": "Feed", "feed.all": "All", "feed.day": "Date",
      "feed.sort": "Sort", "feed.sort.importance": "Importance", "feed.sort.time": "Time", "feed.sort.sources": "Sources",
      "feed.view.events": "Events", "feed.view.docs": "All documents", "feed.search.ph": "Filter this view…",
      "feed.empty": "No data for this day",

      "trends.title": "Trend Radar", "trends.sub": "Weighted by velocity, novelty, source diversity, authority, adoption and recency",
      "trends.window": "Window", "trends.topics": "Topics", "trends.entities": "Organizations & Models",
      "trends.weights": "Weights", "trends.w.velocity": "Velocity", "trends.w.novelty": "Novelty",
      "trends.w.diversity": "Source Diversity", "trends.w.authority": "Authority", "trends.w.adoption": "Adoption",
      "trends.w.recency": "Recency", "trends.metrics": "Metrics", "trends.docs_7d": "Docs / 7d",
      "trends.score": "Trend score",

      "research.title": "Research", "research.sub": "Latest papers from arXiv and beyond, ranked by importance",
      "models.title": "Models", "models.sub": "Trending Hugging Face models and release events",
      "projects.title": "Open Source", "projects.sub": "Active trending AI repositories on GitHub",
      "orgs.title": "Organizations", "orgs.sub": "Recent activity and links of labs and companies",
      "benchmarks.title": "Benchmarks", "benchmarks.sub": "Benchmark-related documents and events",
      "deep.title": "Deep Research", "deep.sub": "Cross-source retrieval · event timelines · evidence briefs",

      "reports.title": "AI Daily Reports", "reports.sub": "Automatically generated intelligence reports, kept forever",
      "report.headlines": "Headlines", "report.sections": "Sections", "report.models": "New Models",
      "report.papers": "New Papers", "report.projects": "Open Source", "report.datasets": "Datasets",
      "report.trends": "Trend Changes", "report.rising": "Rising", "report.cooling": "Cooling", "report.new": "New",
      "report.watchlist": "Watchlist", "report.claims": "Claims & Evidence", "report.stats": "Today",
      "report.verification": "Verification", "report.evidence": "Evidence", "report.back": "Back to reports",
      "report.no_report": "No report for this date",

      "ask.title": "Ask AI Frontier", "ask.sub": "Retrieval over the local knowledge base (events / documents / entities). Every answer carries citations",
      "ask.ph": "e.g. What changed in agent planning recently?", "ask.btn": "Ask",
      "ask.examples": "Examples", "ask.empty": "Ask a question — the event store and entity graph will be searched to build a cited answer",
      "ask.llm.note": "Optional: add an LLM API key for fuller synthesis (stored locally in your browser only)",
      "ask.llm.placeholder": "Optional: sk-… (DeepSeek / OpenAI compatible)",

      "sources.title": "Source Health", "sources.sub": "Fetch status, latency and item counts per source",
      "sources.status": "Status", "sources.count": "Items", "sources.latency": "Latency",
      "sources.ok": "OK", "sources.error": "Error", "sources.idle": "Idle",
      "sources.pipeline": "Pipeline", "sources.dedup": "Dedup", "sources.newn": "New documents",

      "about.title": "About GECKO", "about.sub": "AI Frontier Intelligence Platform",
      "about.what": "Capabilities", "about.how": "Pipeline", "about.principles": "Principles",
      "about.disclaimer": "Note",

      "common.loading": "Loading…", "common.empty": "No data", "common.updated": "Updated",
      "common.sources": "Sources", "common.documents": "Documents", "common.events": "Events",
      "common.importance": "Importance", "common.novelty": "Novelty", "common.confidence": "Confidence",
      "common.trend": "Trend", "common.category": "Category", "common.all": "All",
      "common.more": "More", "common.view": "View", "common.open": "Open source", "common.timeline": "Timeline",
      "common.search": "Search", "common.search.ph": "Search events / documents / entities…",
      "common.search.hint": "Enter opens first result · Esc closes",
      "common.no_result": "No matches", "common.back": "Back",
      "common.detail": "Details", "common.related": "Related", "common.entities": "Entities",
      "common.deeplink": "Source link", "common.date": "Date", "common.tier": "Tier",
      "common.share": "Copy link", "common.copied": "Link copied",
      "common.demo": "Demo data", "common.fetch_error": "Failed to load data, retry later",

      "footer.tagline": "AI Frontier Intelligence Platform",
      "footer.sources": "Source health", "footer.about": "About & data notes",
      "search.placeholder": "Search events / documents / entities…", "search.hint": "Enter opens first result · Esc closes · CJK + English supported",
    },

    ja: {
      "brand.sub": "AIフロンティア・インテリジェンス",
      "nav.home": "ホーム", "nav.feed": "フィード", "nav.trends": "トレンド", "nav.research": "論文",
      "nav.models": "モデル", "nav.projects": "OSS", "nav.reports": "レポート", "nav.ask": "Ask AI",
      "nav.more": "もっと", "nav.organizations": "組織", "nav.benchmarks": "ベンチマーク",
      "nav.deep": "深掘り調査", "nav.sources": "ソース健全性", "nav.about": "概要",

      "hero.eyebrow": "AI Frontier Intelligence",
      "hero.title": "膨大なAI情報を、追跡可能なインテリジェンスへ",
      "hero.lead": "論文・モデル発表・OSS・公式ブログ・業界ニュースを収集し、重複排除・イベントクラスタリング・エンティティ関連付け・トレンド計算を自動で行い、根拠付きの日次レポートを生成します。",
      "hero.docs": "ドキュメント", "hero.events": "イベント", "hero.sources": "ソース", "hero.today": "今日の新着",
      "hero.updated": "更新", "hero.llm_on": "AI拡張 有効", "hero.llm_off": "ルールモード",

      "sec.headlines": "今日のヘッドライン", "sec.headlines.sub": "重要度・ソース数・多様性で並び替え",
      "sec.trend_radar": "トレンドレーダー", "sec.trend_radar.sub": "Velocity · Novelty · Diversity · Authority",
      "sec.latest": "最新イベント", "sec.latest.sub": "記事はイベント単位で統合済み",
      "sec.by_cat": "カテゴリ", "sec.today_docs": "今日のドキュメント",

      "feed.title": "フィード", "feed.all": "すべて", "feed.day": "日付",
      "feed.sort": "並び順", "feed.sort.importance": "重要度", "feed.sort.time": "時刻", "feed.sort.sources": "ソース数",
      "feed.view.events": "イベント", "feed.view.docs": "全ドキュメント", "feed.search.ph": "このビューを絞り込む…",
      "feed.empty": "この日のデータはありません",

      "trends.title": "トレンドレーダー", "trends.sub": "速度・新規性・ソース多様性・権威性・採用度・鮮度の重み付きスコア",
      "trends.window": "期間", "trends.topics": "技術領域", "trends.entities": "組織とモデル",
      "trends.weights": "重み設定", "trends.w.velocity": "速度", "trends.w.novelty": "新規性",
      "trends.w.diversity": "多様性", "trends.w.authority": "権威性", "trends.w.adoption": "採用度",
      "trends.w.recency": "鮮度", "trends.metrics": "指標", "trends.docs_7d": "7日間",
      "trends.score": "スコア",

      "research.title": "研究論文", "research.sub": "arXiv などの最新論文（重要度順）",
      "models.title": "モデル", "models.sub": "Hugging Face トレンドモデルとリリースイベント",
      "projects.title": "オープンソース", "projects.sub": "GitHub で活発なAIリポジトリ",
      "orgs.title": "組織", "orgs.sub": "研究機関・企業の最近の動向",
      "benchmarks.title": "ベンチマーク", "benchmarks.sub": "ベンチマーク関連の情報",
      "deep.title": "深掘り調査", "deep.sub": "横断検索・イベント年表・根拠の編纂",

      "reports.title": "AI日報", "reports.sub": "毎日自動生成されるインテリジェンスレポート",
      "report.headlines": "ヘッドライン", "report.sections": "セクション", "report.models": "新モデル",
      "report.papers": "新論文", "report.projects": "OSS", "report.datasets": "データセット",
      "report.trends": "トレンド変化", "report.rising": "上昇", "report.cooling": "冷却", "report.new": "新規",
      "report.watchlist": "ウォッチリスト", "report.claims": "結論と根拠", "report.stats": "本日の統計",
      "report.verification": "検証", "report.evidence": "根拠", "report.back": "レポート一覧へ",
      "report.no_report": "この日のレポートはありません",

      "ask.title": "Ask AI Frontier", "ask.sub": "ローカル知識ベース（イベント/文書/エンティティ）を検索し、引用付きで回答します",
      "ask.ph": "例：最近のエージェント研究の進展は？", "ask.btn": "質問する",
      "ask.examples": "例", "ask.empty": "質問を入力してください。イベントとエンティティを検索して引用付きの回答を生成します",
      "ask.llm.note": "任意：LLM APIキーを設定すると要約が充実します（ブラウザ内のみ保存）",
      "ask.llm.placeholder": "任意：sk-…（DeepSeek / OpenAI 互換）",

      "sources.title": "ソース健全性", "sources.sub": "ソースごとの取得状況・遅延・件数",
      "sources.status": "状態", "sources.count": "件数", "sources.latency": "遅延",
      "sources.ok": "正常", "sources.error": "エラー", "sources.idle": "未実行",
      "sources.pipeline": "パイプライン", "sources.dedup": "重複排除", "sources.newn": "新規文書",

      "about.title": "GECKO について", "about.sub": "AI Frontier Intelligence Platform",
      "about.what": "機能", "about.how": "パイプライン", "about.principles": "設計原則",
      "about.disclaimer": "注記",

      "common.loading": "読み込み中…", "common.empty": "データなし", "common.updated": "更新",
      "common.sources": "ソース", "common.documents": "文書", "common.events": "イベント",
      "common.importance": "重要度", "common.novelty": "新規性", "common.confidence": "信頼度",
      "common.trend": "トレンド", "common.category": "カテゴリ", "common.all": "すべて",
      "common.more": "もっと", "common.view": "表示", "common.open": "原文を開く", "common.timeline": "タイムライン",
      "common.search": "検索", "common.search.ph": "イベント / 文書 / エンティティを検索…",
      "common.search.hint": "Enter で最初の結果 · Esc で閉じる",
      "common.no_result": "一致なし", "common.back": "戻る",
      "common.detail": "詳細", "common.related": "関連", "common.entities": "エンティティ",
      "common.deeplink": "原文リンク", "common.date": "日付", "common.tier": "ティア",
      "common.share": "リンクをコピー", "common.copied": "コピーしました",
      "common.demo": "デモデータ", "common.fetch_error": "データの読み込みに失敗しました",

      "footer.tagline": "AI Frontier Intelligence Platform",
      "footer.sources": "ソース健全性", "footer.about": "概要とデータについて",
      "search.placeholder": "イベント / 文書 / エンティティを検索…", "search.hint": "Enter で開く · Esc で閉じる",
    },
  };

  const LANGS = ["zh", "en", "ja"];

  const i18n = {
    lang: localStorage.getItem("gecko.lang") || "zh",
    dict: DICT,
    t(key, fallback) {
      const d = DICT[this.lang] || DICT.zh;
      return d[key] || DICT.zh[key] || fallback || key;
    },
    setLang(lang) {
      if (!LANGS.includes(lang)) return;
      this.lang = lang;
      localStorage.setItem("gecko.lang", lang);
      document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
      this.apply();
      document.dispatchEvent(new CustomEvent("gecko:lang", { detail: { lang } }));
    },
    apply(root) {
      (root || document).querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = this.t(key);
      });
      (root || document).querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-placeholder")));
      });
      (root || document).querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", this.t(el.getAttribute("data-i18n-title")));
      });
    },
    // 类别 / 趋势 label（后端返回 {zh,en,ja} 对象）
    label(obj) {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return obj[this.lang] || obj.zh || obj.en || "";
    },
  };

  window.GECKO.i18n = i18n;

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = i18n.lang === "zh" ? "zh-CN" : i18n.lang;
    i18n.apply();
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === i18n.lang);
    });
  });
})();
