# 🦎 GECKO · AI Frontier Intelligence Platform

AI 前沿情报平台 — 聚合论文、模型发布、开源项目、官方博客与行业动态，自动完成**去重 → 事件聚类 → 实体关联 → 趋势计算 → 日报生成**，将海量信息转化为可追踪、可验证的技术情报。

**在线站点**：https://HuanMoovo.github.io/slime-ai/

---

## 核心能力

| 能力 | 说明 |
|---|---|
| 🧩 事件为中心 | 100 篇文章 → 归并为事件，用户看到事件卡片而不是重复新闻 |
| 🔎 三层去重 | URL/内容哈希精确去重 → 标题近重复 → 语义合并进同一事件 |
| 🏷 多标签分类 | 规则 + 词典四级分类（基础模型/智能体/生成式/机器人/基础设施/研究/开源/安全/科学/行业） |
| 🕸 知识图谱 | 组织 / 模型 / 概念 / Benchmark 实体与关系（develops、implements、evaluated_on …） |
| 📈 趋势引擎 | TrendScore = 30% 增速 + 20% 新颖度 + 20% 来源多样性 + 15% 权威度 + 10% 采用度 + 5% 新鲜度 |
| 📰 每日情报报告 | 头条 / 分节 / 新模型 / 新论文 / 开源项目 / 趋势变化 / Watchlist |
| ⛓ Claim → Evidence | 日报关键结论绑定来源证据，单来源结论明确标注 |
| 🤖 Ask AI / 深度研究 | 本地知识库检索问答（事件 + 文档 + 实体 + 时间线），答案带引用；可选接入 LLM 生成综述 |

## 架构

```
┌──────────────────────────  GitHub Actions（每 4 小时） ──────────────────────────┐
│  Python 管线 scripts/gecko/                                                     │
│                                                                                │
│  connectors ──► normalize ──► dedup ──► classify/entities ──► cluster ──► trend │
│  (adapter 插件)                 (三层)     (规则+词典)         (事件归并)   (加权)  │
│         │                                                                    │  │
│         └──► report agent（头条/分节/Claim-Evidence）──► publish ──► data/*.json │
└────────────────────────────────────────────────────────────────────────────────┘
                                      │
                          GitHub Pages 静态托管
                                      │
        SPA（纯 HTML/CSS/JS，无构建步骤）: Home / Feed / Trends / Research /
        Models / Projects / Organizations / Benchmarks / Reports / Ask AI / Deep Research
```

数据源（Source Adapter 插件式，新增来源只需加一个 connector）：
**arXiv** · **GitHub** · **Hugging Face** · **Hacker News** · **官方博客 RSS**（OpenAI / DeepMind / Meta / Microsoft / NVIDIA / Hugging Face / AWS / Mistral…）· **专业媒体**（TechCrunch / VentureBeat / The Verge / 机器之心 / 量子位 / 36氪）· **社区博客**（Simon Willison / Import AI / Latent Space / Reddit r/MachineLearning）

## 目录结构

```
.
├── index.html                 # SPA 外壳
├── css/style.css              # 设计系统（玻璃拟态 / 发光 / 暗亮主题）
├── js/
│   ├── app.js                 # 路由 / 主题 / 粒子 / 全局搜索
│   ├── api.js                 # 静态数据层
│   ├── components.js          # 卡片 / 徽章 / sparkline
│   ├── i18n.js                # 中 / 英 / 日
│   └── views-*.js             # 各页面视图
├── scripts/gecko/             # Python 数据管线
│   ├── config.py              # 数据源注册表 / 分类树 / 词典 / 趋势权重
│   ├── core.py                # Canonical Document / 分类 / 实体抽取
│   ├── pipeline.py            # 去重 / 聚类 / 趋势 / 知识图谱
│   ├── report.py              # 日报生成（Claim/Evidence）
│   ├── llm.py                 # 可选 LLM 增强层
│   ├── net.py                 # HTTP（重试 / 代理自动回退）
│   ├── store.py               # 数据存储（日期分片）
│   ├── run.py                 # 主入口
│   └── connectors/            # Source Adapter 插件
│       ├── arxiv.py  github.py  huggingface.py  hackernews.py  rss.py
├── data/                      # 管线输出（静态 JSON API）
│   ├── index.json             # 元数据 + 来源健康 + 管线统计
│   ├── days/YYYY-MM-DD.json   # 每日事件与文档分片
│   ├── trends.json            # 趋势雷达数据
│   ├── entities.json          # 知识图谱实体
│   └── reports/               # 每日情报报告（永久保存）
└── .github/workflows/gecko-pipeline.yml
```

## 本地运行

```bash
# 1) 抓取 + 生成数据（可选：走本机代理 / 配置 LLM 增强）
python scripts/gecko/run.py

# 2) 启动本地预览（SPA 需要 http 服务，直接双击 index.html 无法加载数据）
python -m http.server 8000
# → http://127.0.0.1:8000
```

## 可选：AI 增强（LLM）

不配置也能完整运行（规则模式）。配置后启用：文档要点摘要、日报导语润色。

```bash
export GECKO_LLM_API_KEY=sk-...                       # DeepSeek / OpenAI 兼容 Key
export GECKO_LLM_BASE_URL=https://api.deepseek.com/v1 # 可选
export GECKO_LLM_MODEL=deepseek-chat                  # 可选
```

GitHub 仓库中配置：`Settings → Secrets and variables → Actions → New repository secret`，名称分别为 `GECKO_LLM_API_KEY`（必需）/ `GECKO_LLM_BASE_URL` / `GECKO_LLM_MODEL`（可选）。

## 数据与版权

所有内容均链接至原文，本站仅聚合**标题、简短摘要与元数据**用于分析与检索，AI 生成内容会明确标注。原文版权归各自作者所有。
