<div align="center">

<img src="images/gecko-logo.svg" width="130" alt="GECKO" />

# GECKO · AI Frontier Intelligence Platform

**把海量 AI 信息，压缩成可追踪、可验证的技术情报**

论文 · 模型发布 · 开源项目 · 官方博客 · 行业动态 —— 自动去重、事件聚类、实体关联、趋势计算，
每日生成带证据链的中英日三语情报报告。

[![Live Site](https://img.shields.io/badge/live-HuanMoovo.github.io%2Fgecko-34d399?style=flat-square)](https://HuanMoovo.github.io/gecko/)
[![Pipeline](https://img.shields.io/badge/pipeline-每%204%20小时自动更新-22d3ee?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/HuanMoovo/gecko/actions)
[![Python](https://img.shields.io/badge/python-3.12+-fbbf24?style=flat-square&logo=python&logoColor=white)](scripts/gecko)
[![No Build](https://img.shields.io/badge/frontend-vanilla%20JS%20·%20no%20build-9aa8bd?style=flat-square)](js)

🌐 **在线站点**：<https://HuanMoovo.github.io/gecko/> · 中文 / English / 日本語

</div>

---

## 📸 界面预览

| 首页 · Dashboard | 趋势雷达 · Trend Radar |
|---|---|
| ![首页](images/screenshots/home.png) | ![趋势](images/screenshots/trends.png) |

| 每日情报报告（中英日三语） | Ask AI Frontier |
|---|---|
| ![日报](images/screenshots/report.png) | ![Ask AI](images/screenshots/ask.png) |

| 开源项目中心 |
|---|
| ![开源](images/screenshots/projects.png) |

---

## ✨ 核心能力

### 1. 事件为中心，而不是"文章流"

传统聚合站是"100 篇文章 = 100 条新闻"。GECKO 做的是：

```text
100 篇文章 ──► 去重 ──► 事件聚类 ──► 1 个技术事件卡片
                                      ├─ 官方博客
                                      ├─ 论文 / arXiv
                                      ├─ GitHub 仓库
                                      ├─ 媒体 1
                                      └─ 社区讨论
```

用户看到的是**事件**及其完整证据时间线，而不是重复新闻。

### 2. 三层去重

| 层 | 方法 | 拦截对象 |
|---|---|---|
| L1 精确 | canonical URL / 内容哈希 / 标题哈希 | 同一 URL、UTM 参数变化、完全转载 |
| L2 近似 | 标题相似度（分词 Jaccard + 字符 n-gram） | 近乎同名的转载 |
| L3 语义 | 实体重叠 + 标题联合判定 → 合并进同一事件 | "A 发布 X" 与 "X 由 A 发布" |

### 3. 多标签自动分类

规则 + 词典四级分类（Title → Metadata → Keyword → 可选 LLM），覆盖 10 大方向、40+ 子类：

`基础模型` `智能体` `生成式 AI` `机器人` `AI 基础设施` `研究论文` `开源生态` `AI 安全` `AI for Science` `行业动态`

### 4. 知识图谱

自动抽取 **组织 / 模型 / 概念 / 基准 / 产品** 实体，并建立关系：

```text
OpenAI ──develops──► GPT-5.5 ──implements──► chain-of-thought
       ──works_on──► reasoning    ──evaluated_on──► GPQA
```

### 5. 趋势引擎（TrendScore）

不是简单数新闻条数，而是六维加权：

```text
TrendScore = 30% 增速(Velocity)      + 20% 新颖度(Novelty)
           + 20% 来源多样性(Diversity) + 15% 权威度(Authority)
           + 10% 采用度(Adoption)      +  5% 新鲜度(Recency)
```

权重在 [`scripts/gecko/config.py`](scripts/gecko/config.py) 中可配置，观察窗口 24h / 7d / 30d。

### 6. Claim → Evidence 事实链

日报中的关键结论绑定来源证据，并标注可信状态：

```text
Claim:        OpenAI 发布 GPT-5.5，推理能力提升 3 倍
Evidence:     [官方博客] [TechCrunch] [Hacker News]
Confidence:   0.94     Status: corroborated（多来源佐证）
```

单来源结论会明确标记为 `single_source`，不掩饰证据强度。

### 7. 中英日三语日报

每日自动生成：

- **三语导语**（zh / en / ja；配置 LLM 后由 AI 撰写，否则模板生成）
- 今日头条（3–6 条，带证据链）
- 分节：研究 / 模型 / 智能体 / 多模态 / 机器人 / 开源 / 基础设施 / 安全 / 行业
- 新模型 / 新论文 / 开源项目 / 数据集
- 趋势变化（上升 ▲ / 降温 ▼ / 新出现 ✦）
- Watchlist（多来源持续追踪的事件）
- Claim / Evidence 汇总与验证状态

### 8. Ask AI Frontier & 深度研究

基于本地知识库（事件 + 文档 + 实体 + 时间线）的检索问答，答案**必带引用**；
配置 LLM API Key 后可生成完整综述。深度研究模式输出跨来源证据简报。

---

## 🏗 架构

```text
┌───────────────────── GitHub Actions（每 4 小时） ─────────────────────┐
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Python 数据管线  scripts/gecko/                              │   │
│  │                                                              │   │
│  │  connectors ─► normalize ─► dedup ─► classify ─► cluster     │   │
│  │  (插件化采集)   (规范化)    (三层)    (多标签)    (事件聚类)     │   │
│  │       │                                          │           │   │
│  │       │                                          ▼           │   │
│  │       │                                    trend engine      │   │
│  │       │                                    (六维加权)         │   │
│  │       ▼                                          │           │   │
│  │   [可选 LLM 增强层] ◄─────────────────────► report agent     │   │
│  │   (摘要 / 三语导语 / 标题译文)              (Claim/Evidence)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│              data/*.json（静态 JSON API 数据层）                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                     GitHub Pages（免费托管 · 全球 CDN）
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│  前端 SPA（纯 HTML / CSS / Vanilla JS，无构建步骤）                     │
│  Home · Feed · Trends · Research · Models · Projects · Organizations  │
│  Benchmarks · Reports · Ask AI · Deep Research · Sources · About      │
└──────────────────────────────────────────────────────────────────────┘
```

**设计取向**：确定性管线优先，LLM 作为可选增强层；零服务器、零运维、零成本运行。

---

## 📡 数据源体系

连接器插件化（[`scripts/gecko/connectors/`](scripts/gecko/connectors)），新增来源只需添加一个 adapter：

| 类别 | 来源 | Tier |
|---|---|---|
| 📄 学术 | **arXiv**（cs.AI / cs.CL / cs.LG / cs.CV / cs.RO / cs.NE） | 2 |
| 🐙 开源 | **GitHub**（12 个主题搜索：llm / agent / multimodal / robotics / rag …） | 2 |
| 🤗 模型 | **Hugging Face**（趋势模型 + 数据集） | 2 |
| 📰 官方博客 | OpenAI · Google DeepMind · Meta AI · Microsoft Research · NVIDIA · Hugging Face · AWS · Mistral · Stability（RSS） | 1 |
| 📱 专业媒体 | TechCrunch · VentureBeat · The Verge · Ars Technica · MIT Tech Review · 机器之心 · 量子位 · 36氪 | 3 |
| 💬 社区 | Hacker News · Simon Willison · Import AI · Latent Space · Interconnects · r/MachineLearning | 4 |

**来源层级（Tier）** 直接进入重要性评分：Tier 1 = 官方/研究机构，逐级递减。

---

## 🚀 快速开始

### 本地运行

```bash
git clone https://github.com/HuanMoovo/gecko.git
cd gecko

# 1) 运行数据管线（抓取 → 处理 → 生成日报）
python scripts/gecko/run.py

# 2) 启动本地预览（SPA 需要 http 服务，直接打开 index.html 无法加载数据）
python -m http.server 8000
# → http://127.0.0.1:8000
```

### 常用命令

```bash
python scripts/gecko/run.py                # 常规增量运行（抓取 + 更新）
python scripts/gecko/run.py --report-only  # 仅重建趋势与日报（不抓取）
python scripts/gecko/run.py --days 90      # 指定趋势窗口为 90 天
python scripts/test_pipeline.py            # 离线冒烟测试（模拟数据，不联网）
python scripts/make_logo.py                # 重新生成品牌资产（SVG）
```

### 依赖

**零第三方依赖** —— 管线仅使用 Python 3.11+ 标准库（`urllib` / `json` / `xml`），
前端零构建步骤，`git clone` 即可运行。

---

## ⚙️ 配置

### 可选：AI 增强（LLM）

不配置也能完整运行（规则模式）。配置后启用：

- 文档要点摘要（`ai_brief`）
- 日报三语导语（AI 撰写）
- 头条标题中英日三语译文

```bash
export GECKO_LLM_API_KEY=sk-...                        # DeepSeek / OpenAI 兼容
export GECKO_LLM_BASE_URL=https://api.deepseek.com/v1  # 可选
export GECKO_LLM_MODEL=deepseek-chat                   # 可选
```

GitHub 仓库中配置：`Settings → Secrets and variables → Actions → New repository secret`
（名称：`GECKO_LLM_API_KEY` 必需，`GECKO_LLM_BASE_URL` / `GECKO_LLM_MODEL` 可选）

### 其他环境变量

| 变量 | 说明 |
|---|---|
| `GECKO_GITHUB_TOKEN` | 提高 GitHub Search API 限额（Actions 中自动注入内置 token） |
| `GECKO_PROXY` | HTTP 代理（本机开发时使用；管线也会自动探测常见本地代理端口） |

### 自定义

| 想改什么 | 改哪里 |
|---|---|
| 数据源 / RSS 订阅列表 | `scripts/gecko/config.py` → `RSS_FEEDS` |
| 分类树与关键词 | `scripts/gecko/config.py` → `CATEGORY_TREE` / `CATEGORY_KEYWORDS` |
| 机构注册表（含权威度 Tier） | `scripts/gecko/config.py` → `ORGANIZATIONS` |
| 实体词典（模型 / 概念 / 基准） | `scripts/gecko/config.py` → `ENTITY_LEXICON` |
| 趋势权重 | `scripts/gecko/config.py` → `TREND_WEIGHTS` |
| 更新频率 | `.github/workflows/gecko-pipeline.yml` → `cron` |

---

## 📂 项目结构

```text
gecko/
├── index.html                      # SPA 外壳
├── css/style.css                   # 设计系统（玻璃拟态 · 发光 · 暗亮主题）
├── js/
│   ├── app.js                      # 路由 / 主题 / 粒子背景 / 全局搜索
│   ├── api.js                      # 静态数据层（fetch + 缓存）
│   ├── components.js               # 卡片 / 徽章 / sparkline 组件
│   ├── i18n.js                     # 中 / 英 / 日 词典
│   └── views-*.js                  # 各页面视图（home / feed / trends / lib / report / ask）
│
├── scripts/
│   ├── gecko/                      # ── Python 数据管线 ──
│   │   ├── config.py               #   数据源注册表 / 分类树 / 词典 / 权重
│   │   ├── core.py                 #   Canonical Document · 分类 · 实体抽取 · 评分
│   │   ├── pipeline.py             #   三层去重 · 事件聚类 · 趋势引擎 · 知识图谱
│   │   ├── report.py               #   日报生成（三语导语 · Claim/Evidence）
│   │   ├── llm.py                  #   可选 LLM 增强层
│   │   ├── net.py                  #   HTTP（重试 / 代理自动回退）
│   │   ├── store.py                #   数据存储（日期分片 / 索引）
│   │   ├── run.py                  #   主入口
│   │   └── connectors/             #   Source Adapter 插件
│   │       └── arxiv.py · github.py · huggingface.py · hackernews.py · rss.py
│   ├── make_logo.py                # 品牌资产生成（程序化 SVG）
│   └── test_pipeline.py            # 离线冒烟测试
│
├── data/                           # 管线输出（静态 JSON API）
│   ├── index.json                  #   元数据 · 来源健康 · 管线统计
│   ├── days/YYYY-MM-DD.json        #   每日事件与文档分片
│   ├── trends.json                 #   趋势雷达（话题 + 实体）
│   ├── entities.json               #   知识图谱实体索引
│   └── reports/                    #   每日报告（永久保存）
│
├── images/                         # 品牌资产 + 截图
└── .github/workflows/
    └── gecko-pipeline.yml          # 每 4 小时自动运行
```

---

## 🗂 数据格式（静态 JSON API）

管线输出的 `data/` 目录本身就是可直接消费的 API：

| 端点 | 内容 |
|---|---|
| `data/index.json` | 全局元数据、日期列表、来源健康、管线统计 |
| `data/days/{date}.json` | 某日的文档 + 事件（含时间线、实体、评分） |
| `data/trends.json` | 话题与实体的趋势分、六维指标、14 天 sparkline |
| `data/entities.json` | 知识图谱实体（类型、文档数、关系） |
| `data/reports/index.json` | 日报列表 |
| `data/reports/{date}.json` | 单日报告全文（头条 / 分节 / Claims / 三语导语） |

事件对象示例：

```json
{
  "event_id": "evt_9a589f3bdb96",
  "title": "Introducing Claude Sonnet 5.5 on AWS",
  "event_type": "model_release",
  "category": "foundation_models",
  "first_seen_at": "2026-10-01T11:20:00Z",
  "last_seen_at": "2026-10-01T13:05:00Z",
  "importance_score": 0.86,
  "confidence_score": 0.99,
  "source_count": 6,
  "source_diversity": 0.8,
  "sources": ["aws_ml", "simonwillison", "qbitai"],
  "entity_ids": ["org:anthropic", "org:amazon", "model:claude"],
  "timeline": [{ "date": "2026-10-01", "title": "…", "url": "…", "source": "aws_ml" }]
}
```

---

## 🧭 路线图

- [x] **P0** 数据管线：采集 → 去重 → 分类 → 实体 → 事件聚类 → 趋势 → 日报
- [x] **P1** 情报平台前端：Dashboard / Feed / Trends / Research / Models / Reports / Ask AI
- [x] **P2** 中英日三语（界面 + 日报）、知识图谱、Claim/Evidence
- [ ] **P3** 周报 / 月报（Daily → Weekly → Monthly 知识积累体系）
- [ ] **P4** Watchlist 订阅与提醒（Email / Webhook / Telegram）
- [ ] **P5** 公开 API / MCP Server（把数据能力开放出去）
- [ ] **P6** 事件生命周期追踪（研究 → 模型 → 开源 → 采用 的完整演化）

---

## 📄 数据与版权

- 所有条目均**链接至原文**，本站仅聚合标题、简短摘要与元数据用于分析与检索
- AI 生成的摘要与导语会明确标注（`intro_source: llm`）
- 原文版权归各自作者与机构所有
- 数据每 4 小时自动更新，历史报告永久保存

---

<div align="center">

**GECKO** · AI Frontier Intelligence Platform

*发现 → 理解 → 归并 → 关联 → 验证 → 报告*

</div>
