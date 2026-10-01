<div align="center">

[中文](README.md) · [English](README.en.md) · **日本語**

<img src="images/gecko-logo.svg" width="130" alt="GECKO" />

# AIフロンティア情報収集

**GECKO · AI Frontier Intelligence Platform** — 膨大なAI情報を、追跡可能で検証できる技術インテリジェンスへ

論文・モデル発表・オープンソースプロジェクト・公式ブログ・業界ニュースを自動で
重複排除・イベントクラスタリング・エンティティ関連付け・トレンド計算し、
根拠チェーン付きの日次インテリジェンスレポート（中・英・日）を生成します。

[![Live Site](https://img.shields.io/badge/live-HuanMoovo.github.io%2Fgecko-34d399?style=flat-square)](https://HuanMoovo.github.io/gecko/)
[![Pipeline](https://img.shields.io/badge/pipeline-4%E6%99%82%E9%96%93%E3%81%94%E3%81%A8%E8%87%AA%E5%8B%95%E6%9B%B4%E6%96%B0-22d3ee?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/HuanMoovo/gecko/actions)
[![Python](https://img.shields.io/badge/python-3.12+-fbbf24?style=flat-square&logo=python&logoColor=white)](scripts/gecko)
[![No Build](https://img.shields.io/badge/frontend-vanilla%20JS%20·%20no%20build-9aa8bd?style=flat-square)](js)

🌐 **公開サイト**: <https://HuanMoovo.github.io/gecko/> · 中文 / English / 日本語

</div>

---

## 📸 スクリーンショット

| ホーム · ダッシュボード | トレンドレーダー |
|---|---|
| ![ホーム](images/screenshots/home.png) | ![トレンド](images/screenshots/trends.png) |

| 日次レポート（中・英・日の3言語） | Ask AI Frontier |
|---|---|
| ![日報](images/screenshots/report.png) | ![Ask AI](images/screenshots/ask.png) |

| オープンソースセンター |
|---|
| ![OSS](images/screenshots/projects.png) |

---

## ✨ 主な機能

### 1. 「記事の山」ではなく「イベント」を中心に

従来のアグリゲーターは「100記事 = 100ニュース」です。GECKO は違います：

```text
100 記事 ──► 重複排除 ──► イベントクラスタリング ──► 1 つの技術イベントカード
                                                    ├─ 公式ブログ
                                                    ├─ 論文 / arXiv
                                                    ├─ GitHub リポジトリ
                                                    ├─ メディア 1
                                                    └─ コミュニティ
```

ユーザーが見るのは**イベント**とその完全な根拠タイムラインであり、重複ニュースではありません。

### 2. 三段階の重複排除

| 段階 | 手法 | 対象 |
|---|---|---|
| L1 完全一致 | canonical URL / コンテンツハッシュ / タイトルハッシュ | 同一URL、UTMパラメータ違い、完全転載 |
| L2 近似 | タイトル類似度（トークン Jaccard + 文字 n-gram） | ほぼ同名の転載 |
| L3 意味 | エンティティ重複 + タイトル複合判定 → 同一イベントへ統合 | 「A が X を発表」と「X を A が発表」 |

### 3. マルチラベル自動分類

ルール + 辞書による4段階分類（Title → Metadata → Keyword → 任意のLLM）。10の大分類・40以上のサブカテゴリをカバー：

`基盤モデル` `エージェント` `生成AI` `ロボティクス` `AIインフラ` `研究論文` `オープンソース` `AIセーフティ` `科学AI` `業界動向`

### 4. ナレッジグラフ

**組織 / モデル / 概念 / ベンチマーク / 製品** を自動抽出し、関係を構築：

```text
OpenAI ──develops──► GPT-5.5 ──implements──► chain-of-thought
       ──works_on──► reasoning    ──evaluated_on──► GPQA
```

### 5. トレンドエンジン（TrendScore）

記事数を数えるだけではなく、6次元の重み付きスコア：

```text
TrendScore = 30% 速度(Velocity)      + 20% 新規性(Novelty)
           + 20% ソース多様性(Diversity) + 15% 権威性(Authority)
           + 10% 採用度(Adoption)        +  5% 鮮度(Recency)
```

重みは [`scripts/gecko/config.py`](scripts/gecko/config.py) で設定可能。観測ウィンドウは 24時間 / 7日 / 30日。

### 6. Claim → Evidence の根拠チェーン

日報の主要な結論は出典証拠に紐付けられ、検証状態が明示されます：

```text
Claim:        OpenAI が GPT-5.5 を発表、推論能力が3倍
Evidence:     [公式ブログ] [TechCrunch] [Hacker News]
Confidence:   0.94     Status: corroborated（複数ソース）
```

単一ソースの結論は `single_source` と明示されます。根拠の強さを偽りません。

### 7. 3言語の日次レポート

毎日自動生成される内容：

- **3言語の導入文**（zh / en / ja。LLMキー設定時はAIが執筆、未設定時はテンプレート）
- ヘッドライン（3〜6件、根拠チェーン付き）
- セクション：研究 / モデル / エージェント / マルチモーダル / ロボティクス / OSS / インフラ / 安全性 / 業界
- 新モデル / 新論文 / OSSプロジェクト / データセット
- トレンド変化（上昇 ▲ / 冷却 ▼ / 新規 ✦）
- ウォッチリスト（複数ソースで追跡中のイベント）
- Claim / Evidence の総括と検証状態

### 8. Ask AI Frontier と深掘り調査

ローカル知識ベース（イベント + 文書 + エンティティ + タイムライン）に対する検索Q&A。
回答には**必ず引用**が付きます。LLM APIキーを設定すると完全な要約を生成。
深掘り調査モードはクロスソースの根拠ブリーフを出力します。

---

## 🏗 アーキテクチャ

```text
┌───────────────────── GitHub Actions（4時間ごと） ─────────────────────┐
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Python パイプライン  scripts/gecko/                          │   │
│  │                                                               │   │
│  │  connectors ─► normalize ─► dedup ─► classify ─► cluster      │   │
│  │  (プラグイン)   (正規化)    (三段階)  (マルチラベル) (イベント)   │   │
│  │       │                                          │            │   │
│  │       │                                          ▼            │   │
│  │       │                                    trend engine       │   │
│  │       │                                    (6次元スコア)      │   │
│  │       ▼                                          │            │   │
│  │   [任意のLLM層] ◄──────────────────────────► report agent     │   │
│  │   (要約 / 3言語導入文 / タイトル翻訳)        (Claim/Evidence)  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│              data/*.json（静的 JSON API レイヤー）                     │
└───────────────────────────────────────────────────────────────────────┘
                               │
                     GitHub Pages（無料ホスティング · グローバルCDN）
                               │
┌──────────────────────────────▼────────────────────────────────────────┐
│  フロントエンド SPA（純粋な HTML / CSS / Vanilla JS、ビルド不要）        │
│  Home · Feed · Trends · Research · Models · Projects · Organizations  │
│  Benchmarks · Reports · Ask AI · Deep Research · Sources · About      │
└───────────────────────────────────────────────────────────────────────┘
```

**設計方針**：決定論的パイプラインを優先し、LLM は任意の強化層。サーバー不要・運用不要・コストゼロ。

---

## 📡 データソース

コネクタはプラグイン式（[`scripts/gecko/connectors/`](scripts/gecko/connectors)）。新しいソースはアダプタを1つ追加するだけです：

| カテゴリ | ソース | Tier |
|---|---|---|
| 📄 学術 | **arXiv**（cs.AI / cs.CL / cs.LG / cs.CV / cs.RO / cs.NE） | 2 |
| 🐙 OSS | **GitHub**（12のトピック検索：llm / agent / multimodal / robotics / rag …） | 2 |
| 🤗 モデル | **Hugging Face**（トレンドモデル + データセット） | 2 |
| 📰 公式ブログ | OpenAI · Google DeepMind · Meta AI · Microsoft Research · NVIDIA · Hugging Face · AWS · Mistral · Stability（RSS） | 1 |
| 📱 メディア | TechCrunch · VentureBeat · The Verge · Ars Technica · MIT Tech Review · 机器之心 · 量子位 · 36Kr | 3 |
| 💬 コミュニティ | Hacker News · Simon Willison · Import AI · Latent Space · Interconnects · r/MachineLearning | 4 |

**ソース階層（Tier）** は重要度スコアに直接反映されます：Tier 1 = 公式・研究機関、以下順に逓減。

---

## 🚀 クイックスタート

### ローカル実行

```bash
git clone https://github.com/HuanMoovo/gecko.git
cd gecko

# 1) データパイプラインを実行（収集 → 処理 → レポート生成）
python scripts/gecko/run.py

# 2) ローカルプレビュー（SPA は HTTP サーバーが必要。index.html を直接開いてもデータは読み込まれません）
python -m http.server 8000
# → http://127.0.0.1:8000
```

### よく使うコマンド

```bash
python scripts/gecko/run.py                # 通常の増分実行（収集 + 更新）
python scripts/gecko/run.py --report-only  # トレンドと日報のみ再構築（収集なし）
python scripts/gecko/run.py --days 90      # トレンドの観測ウィンドウを90日に
python scripts/test_pipeline.py            # オフラインスモークテスト（モックデータ・ネット不要）
python scripts/make_logo.py                # ブランドアセット再生成（SVG）
```

### 依存関係

**サードパーティ依存ゼロ** —— パイプラインは Python 3.11+ の標準ライブラリのみ使用
（`urllib` / `json` / `xml`）。フロントエンドはビルド不要で、`git clone` するだけで動きます。

---

## ⚙️ 設定

### 任意：AI 強化（LLM）

未設定でも完全に動作します（ルールモード）。設定すると以下が有効になります：

- 文書ブリーフ（`ai_brief`）
- 日報の3言語導入文（AIが執筆）
- ヘッドラインタイトルの3言語翻訳（zh / en / ja）

```bash
export GECKO_LLM_API_KEY=sk-...                        # DeepSeek / OpenAI 互換
export GECKO_LLM_BASE_URL=https://api.deepseek.com/v1  # 任意
export GECKO_LLM_MODEL=deepseek-chat                   # 任意
```

GitHub での設定：`Settings → Secrets and variables → Actions → New repository secret`
（`GECKO_LLM_API_KEY` 必須、`GECKO_LLM_BASE_URL` / `GECKO_LLM_MODEL` は任意）

### その他の環境変数

| 変数 | 用途 |
|---|---|
| `GECKO_GITHUB_TOKEN` | GitHub Search API のレート制限を緩和（Actions では自動注入） |
| `GECKO_PROXY` | ローカル開発用の HTTP プロキシ（一般的なローカルプロキシポートも自動検出） |

### カスタマイズ

| 変更したいもの | 変更箇所 |
|---|---|
| ソース / RSS フィード | `scripts/gecko/config.py` → `RSS_FEEDS` |
| カテゴリツリーとキーワード | `scripts/gecko/config.py` → `CATEGORY_TREE` / `CATEGORY_KEYWORDS` |
| 組織レジストリ（権威度 Tier 付き） | `scripts/gecko/config.py` → `ORGANIZATIONS` |
| エンティティ辞書（モデル / 概念 / ベンチマーク） | `scripts/gecko/config.py` → `ENTITY_LEXICON` |
| トレンドの重み | `scripts/gecko/config.py` → `TREND_WEIGHTS` |
| 更新頻度 | `.github/workflows/gecko-pipeline.yml` → `cron` |

---

## 📂 プロジェクト構成

```text
gecko/
├── index.html                      # SPA シェル
├── css/style.css                   # デザインシステム（グラスモーフィズム · グロー · ダーク/ライト）
├── js/
│   ├── app.js                      # ルーティング / テーマ / パーティクル / 全体検索
│   ├── api.js                      # 静的データレイヤー（fetch + キャッシュ）
│   ├── components.js               # カード / バッジ / スパークライン
│   ├── i18n.js                     # zh / en / ja 辞書
│   └── views-*.js                  # 各ページビュー（home / feed / trends / lib / report / ask）
│
├── scripts/
│   ├── gecko/                      # ── Python データパイプライン ──
│   │   ├── config.py               #   ソース登録 / カテゴリツリー / 辞書 / 重み
│   │   ├── core.py                 #   Canonical Document · 分類 · エンティティ抽出 · スコア
│   │   ├── pipeline.py             #   重複排除 · イベントクラスタリング · トレンド · ナレッジグラフ
│   │   ├── report.py               #   日報生成（3言語導入文 · Claim/Evidence）
│   │   ├── llm.py                  #   任意の LLM 強化層
│   │   ├── net.py                  #   HTTP（リトライ / プロキシ自動フォールバック）
│   │   ├── store.py                #   ストレージ（日付シャード / インデックス）
│   │   ├── run.py                  #   エントリポイント
│   │   └── connectors/             #   Source Adapter プラグイン
│   │       └── arxiv.py · github.py · huggingface.py · hackernews.py · rss.py
│   ├── make_logo.py                # ブランドアセット生成（プログラム的 SVG）
│   └── test_pipeline.py            # オフラインスモークテスト
│
├── data/                           # パイプライン出力（静的 JSON API）
│   ├── index.json                  #   メタデータ · ソース健全性 · 統計
│   ├── days/YYYY-MM-DD.json        #   日次のイベント・文書シャード
│   ├── trends.json                 #   トレンドレーダー（トピック + エンティティ）
│   ├── entities.json               #   ナレッジグラフのエンティティ索引
│   └── reports/                    #   日次レポート（永久保存）
│
├── images/                         # ブランドアセット + スクリーンショット
└── .github/workflows/
    └── gecko-pipeline.yml          # 4時間ごとに実行
```

---

## 🗂 データ形式（静的 JSON API）

パイプラインが出力する `data/` ディレクトリは、そのまま利用可能な API です：

| エンドポイント | 内容 |
|---|---|
| `data/index.json` | グローバルメタデータ、日付一覧、ソース健全性、統計 |
| `data/days/{date}.json` | ある日の文書 + イベント（タイムライン・エンティティ・スコア） |
| `data/trends.json` | トピック/エンティティのトレンドスコア、6指標、14日のスパークライン |
| `data/entities.json` | ナレッジグラフのエンティティ（種類・文書数・関係） |
| `data/reports/index.json` | レポート一覧 |
| `data/reports/{date}.json` | 日報全文（ヘッドライン / セクション / Claims / 3言語導入文） |

イベントオブジェクトの例：

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

## 🧭 ロードマップ

- [x] **P0** データパイプライン：収集 → 重複排除 → 分類 → エンティティ → イベントクラスタリング → トレンド → 日報
- [x] **P1** インテリジェンスフロントエンド：Dashboard / Feed / Trends / Research / Models / Reports / Ask AI
- [x] **P2** 3言語UI・日報、ナレッジグラフ、Claim/Evidence
- [ ] **P3** 週報 / 月報（Daily → Weekly → Monthly の知識蓄積体系）
- [ ] **P4** ウォッチリスト購読と通知（Email / Webhook / Telegram）
- [ ] **P5** 公開 API / MCP Server
- [ ] **P6** イベントライフサイクル追跡（研究 → モデル → OSS → 採用）

---

## 📄 データと著作権

- すべての項目は**原文へリンク**しています。本サイトは分析・検索のためにタイトル・短い抜粋・メタデータのみを集約します
- AI が生成した要約・導入文は明示されます（`intro_source: llm`）
- 原文の著作権は各著者・機関に帰属します
- データは4時間ごとに自動更新され、過去のレポートは永久保存されます

---

<div align="center">

**GECKO** · AI Frontier Intelligence Platform

*発見 → 理解 → 統合 → 関連付け → 検証 → レポート*

</div>
