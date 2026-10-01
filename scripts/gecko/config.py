# -*- coding: utf-8 -*-
"""
GECKO · AI Frontier Intelligence Platform — 核心配置
组织注册表 / 数据源注册 / 分类体系 / 实体词典 / 趋势权重
所有"会变的东西"集中在这里，代码不写死。
"""
from __future__ import annotations

# ============================================================
# 品牌
# ============================================================
BRAND = {
    "name": "GECKO",
    "full_name": "GECKO · AI Frontier Intelligence",
    "tagline": {"zh": "AI 前沿情报平台", "en": "AI Frontier Intelligence Platform", "ja": "AIフロンティア・インテリジェンス"},
    "site_url": "https://HuanMoovo.github.io/gecko",
    "repo": "HuanMoovo/gecko",
}

# 数据保留策略
RETENTION_DAYS = 400          # days/*.js 分片保留天数
MAX_DOCS_PER_DAY = 900        # 单日文档上限（超出丢弃最低分）

# ============================================================
# 组织注册表（来源权威度 Tier）
# Tier 1: 官方 / 研究实验室   2: 学术 / GitHub / Benchmark
# Tier 3: 专业媒体            4: 社区
# ============================================================
ORGANIZATIONS = {
    "openai":      {"name": "OpenAI",            "aliases": ["openai", "chatgpt", "gpt"], "region": "US", "tier": 1},
    "anthropic":   {"name": "Anthropic",         "aliases": ["anthropic", "claude"], "region": "US", "tier": 1},
    "google":      {"name": "Google",            "aliases": ["google", "deepmind", "gemini", "google brain"], "region": "US", "tier": 1},
    "meta":        {"name": "Meta",              "aliases": ["meta", "llama", "fair"], "region": "US", "tier": 1},
    "microsoft":   {"name": "Microsoft",         "aliases": ["microsoft", "msr", "phi"], "region": "US", "tier": 1},
    "nvidia":      {"name": "NVIDIA",            "aliases": ["nvidia", "cuda", "nemotron"], "region": "US", "tier": 1},
    "amazon":      {"name": "Amazon",            "aliases": ["amazon", "aws", "bedrock", "nova"], "region": "US", "tier": 1},
    "apple":       {"name": "Apple",             "aliases": ["apple"], "region": "US", "tier": 1},
    "mistral":     {"name": "Mistral AI",        "aliases": ["mistral"], "region": "EU", "tier": 1},
    "xai":         {"name": "xAI",               "aliases": ["xai", "grok", "x.ai"], "region": "US", "tier": 1},
    "deepseek":    {"name": "DeepSeek",          "aliases": ["deepseek"], "region": "CN", "tier": 1},
    "alibaba":     {"name": "Alibaba",           "aliases": ["alibaba", "qwen", "通义", "阿里"], "region": "CN", "tier": 1},
    "bytedance":   {"name": "ByteDance",         "aliases": ["bytedance", "doubao", "豆包", "字节"], "region": "CN", "tier": 1},
    "tencent":     {"name": "Tencent",           "aliases": ["tencent", "hunyuan", "腾讯", "混元"], "region": "CN", "tier": 1},
    "baidu":       {"name": "Baidu",             "aliases": ["baidu", "ernie", "文心", "百度"], "region": "CN", "tier": 1},
    "zhipu":       {"name": "Zhipu AI",          "aliases": ["zhipu", "glm", "智谱"], "region": "CN", "tier": 1},
    "moonshot":    {"name": "Moonshot AI",       "aliases": ["moonshot", "kimi", "月之暗面"], "region": "CN", "tier": 1},
    "minimax":     {"name": "MiniMax",           "aliases": ["minimax", "海螺"], "region": "CN", "tier": 1},
    "01ai":        {"name": "01.AI",             "aliases": ["01.ai", "yi-", "零一万物"], "region": "CN", "tier": 1},
    "baichuan":    {"name": "Baichuan",          "aliases": ["baichuan", "百川"], "region": "CN", "tier": 1},
    "stepfun":     {"name": "StepFun",           "aliases": ["stepfun", "阶跃星辰"], "region": "CN", "tier": 1},
    "sensetime":   {"name": "SenseTime",         "aliases": ["sensetime", "商汤"], "region": "CN", "tier": 1},
    "huggingface": {"name": "Hugging Face",      "aliases": ["huggingface", "hf.co"], "region": "US", "tier": 2},
    "stability":   {"name": "Stability AI",      "aliases": ["stability ai", "stable diffusion"], "region": "EU", "tier": 1},
    "runway":      {"name": "Runway",            "aliases": ["runway"], "region": "US", "tier": 2},
    "perplexity":  {"name": "Perplexity",        "aliases": ["perplexity"], "region": "US", "tier": 2},
    "cohere":      {"name": "Cohere",            "aliases": ["cohere"], "region": "CA", "tier": 2},
    "ai21":        {"name": "AI21 Labs",         "aliases": ["ai21"], "region": "IL", "tier": 2},
    "figure":      {"name": "Figure AI",         "aliases": ["figure ai", "figure robot"], "region": "US", "tier": 2},
    "tesla":       {"name": "Tesla",             "aliases": ["tesla", "optimus"], "region": "US", "tier": 2},
    "unitree":     {"name": "Unitree",           "aliases": ["unitree", "宇树"], "region": "CN", "tier": 2},
    "tsinghua":    {"name": "Tsinghua University", "aliases": ["tsinghua", "清华"], "region": "CN", "tier": 2},
    "peking":      {"name": "Peking University", "aliases": ["peking university", "北大"], "region": "CN", "tier": 2},
    "stanford":    {"name": "Stanford",          "aliases": ["stanford"], "region": "US", "tier": 2},
    "mit":         {"name": "MIT",               "aliases": ["mit csail", "massachusetts institute"], "region": "US", "tier": 2},
    "berkeley":    {"name": "UC Berkeley",       "aliases": ["berkeley", "bair"], "region": "US", "tier": 2},
}

# ============================================================
# 实体词典（模型 / 技术 / 概念）— 用于实体抽取与事件聚合
# ============================================================
ENTITY_LEXICON = {
    "model": ["gpt-5", "gpt-4", "gpt-4o", "o1", "o3", "o4", "claude", "claude 4", "gemini", "gemini 2",
              "llama", "llama 4", "qwen", "qwen3", "deepseek-v3", "deepseek-r1", "deepseek-v4", "r1",
              "mistral", "mixtral", "grok", "grok 3", "phi-4", "phi-5", "command r", "nova", "ernie",
              "glm-4", "glm-5", "kimi", "k1.5", "k2", "minimax", "abab", "hunyuan", "doubao", "yi-lightning",
              "stable diffusion", "sdxl", "flux", "sora", "veo", "runway gen", "pika", "kling", "hailuo",
              "whisper", "audio paLM", "musicgen", "udio", "suno", "qwen-vl", "llava", "gpt-4v", "pixtral",
              "molmo", "cosmos", "genie", "dreamer", "genesis", "groot", "rt-2", "pi0", "octo", "openvla",
              "sam", "sam 2", "dinov2", "clip", "siglip", "bge-m3", "e5", "jina", "nomic"],
    "concept": ["agent", "agentic", "multi-agent", "tool use", "function calling", "mcp", "model context protocol",
                "reasoning", "chain of thought", "cot", "test-time compute", "inference scaling", "rlhf", "rlaif",
                "dpo", "grpo", "ppo", "fine-tuning", "fine-tune", "lora", "qlora", "distillation", "quantization",
                "moe", "mixture of experts", "transformer", "diffusion", "flow matching", "autoregressive",
                "rag", "retrieval augmented", "context window", "long context", "prompt injection", "jailbreak",
                "alignment", "interpretability", "mechanistic", "evals", "benchmark", "hallucination",
                "world model", "vla", "vision language", "embodied", "humanoid", "teleoperation",
                "speculative decoding", "kv cache", "flash attention", "tensor parallel", "gpu", "tpu", "asic",
                "inference", "training", "pretraining", "posttraining", "scaling law", "synthetic data",
                "knowledge graph", "vector database", "embedding", "reranker", "hybrid search"],
    "benchmark": ["mmlu", "gpqa", "humaneval", "swe-bench", "aime", "math-500", "arc-agie", "livebench",
                  "chatbot arena", "lmsys", "mt-bench", "alpaca eval", "hellaswag", "truthfulqa", "mmmu",
                  "mathvista", "videomme", "osworld", "webarena", "gaia", "agentbench", "terminal-bench"],
    "product": ["chatgpt", "claude.ai", "gemini app", "copilot", "cursor", "windsurf", "devin", "replit agent",
                "github copilot", "perplexity", "midjourney", "notion ai", "canva", "figma ai", "lovable",
                "bolt", "v0", "sora", "veo", "firefly", "office copilot", "apple intelligence", "meta ai"],
}

# ============================================================
# 分类体系（多标签）—— 一级 / 二级
# ============================================================
CATEGORY_TREE = {
    "foundation_models": {
        "label": {"zh": "基础模型", "en": "Foundation Models", "ja": "基盤モデル"}, "icon": "🧠",
        "subs": {"llm": "LLM", "vision_language": "Vision-Language", "audio": "Audio", "multimodal": "Multimodal"},
    },
    "agents": {
        "label": {"zh": "智能体", "en": "Agents", "ja": "エージェント"}, "icon": "🧩",
        "subs": {"tool_use": "Tool Use", "planning": "Planning", "multi_agent": "Multi-Agent", "coding_agent": "Coding Agent"},
    },
    "generative": {
        "label": {"zh": "生成式 AI", "en": "Generative AI", "ja": "生成AI"}, "icon": "🎨",
        "subs": {"text": "Text", "image": "Image", "video": "Video", "audio": "Audio", "3d": "3D"},
    },
    "robotics": {
        "label": {"zh": "机器人", "en": "Robotics", "ja": "ロボティクス"}, "icon": "🦾",
        "subs": {"vla": "VLA", "humanoid": "Humanoid", "embodied": "Embodied AI"},
    },
    "infrastructure": {
        "label": {"zh": "AI 基础设施", "en": "AI Infrastructure", "ja": "AIインフラ"}, "icon": "⚙️",
        "subs": {"gpu": "GPU", "inference": "Inference", "training": "Training", "compiler": "Compiler"},
    },
    "research": {
        "label": {"zh": "研究论文", "en": "Research", "ja": "研究論文"}, "icon": "📄",
        "subs": {"paper": "Paper", "method": "Method", "dataset": "Dataset", "benchmark": "Benchmark"},
    },
    "open_source": {
        "label": {"zh": "开源项目", "en": "Open Source", "ja": "オープンソース"}, "icon": "🐙",
        "subs": {"repo": "Repository", "model_release": "Model Release", "framework": "Framework"},
    },
    "safety": {
        "label": {"zh": "AI 安全", "en": "AI Safety", "ja": "AIセーフティ"}, "icon": "🛡️",
        "subs": {"alignment": "Alignment", "security": "Security", "policy": "Policy", "ethics": "Ethics"},
    },
    "science": {
        "label": {"zh": "AI for Science", "en": "AI for Science", "ja": "科学AI"}, "icon": "🔬",
        "subs": {"bio": "Biology", "chemistry": "Chemistry", "physics": "Physics", "materials": "Materials"},
    },
    "industry": {
        "label": {"zh": "行业动态", "en": "Industry", "ja": "業界動向"}, "icon": "🌏",
        "subs": {"funding": "Funding", "business": "Business", "product": "Product", "regulation": "Regulation"},
    },
}

# 分类关键词（Rule 层）—— 中 / 英 / 日
CATEGORY_KEYWORDS = {
    "foundation_models": ["llm", "language model", "大模型", "大規模言語モデル", "gpt", "claude", "gemini", "llama",
                          "foundation model", "基盤モデル", "参数", "パラメータ", "context window", "上下文",
                          "multimodal", "多模态", "マルチモーダル", "vision-language", "视觉语言"],
    "agents": ["agent", "智能体", "エージェント", "agentic", "tool use", "工具调用", "ツール使用", "multi-agent",
               "多智能体", "マルチエージェント", "autonomous", "自主", "planning", "规划", "プランニング",
               "mcp", "model context protocol", "computer use", "workflow"],
    "generative": ["diffusion", "扩散", "拡散", "image generation", "图像生成", "画像生成", "video generation",
                   "视频生成", "動画生成", "text-to-image", "text-to-video", "text-to-speech", "语音合成",
                   "生成", "generative", "3d生成", "text-to-3d"],
    "robotics": ["robot", "机器人", "ロボット", "humanoid", "人形", "ヒューマノイド", "embodied", "具身",
                 "実世界", "manipulation", "vla", "locomotion", "无人机", "drone"],
    "infrastructure": ["gpu", "芯片", "チップ", "chip", "inference", "推理", "推論", "training", "训练", "学習",
                       "datacenter", "数据中心", "データセンター", "cuda", "tpu", "accelerator", "算力",
                       "quantization", "量化", "最適化", "optimization", "compiler", "cluster"],
    "research": ["paper", "论文", "論文", "arxiv", "preprint", "研究", "research", "benchmark", "基准",
                 "ベンチマーク", "dataset", "数据集", "データセット", "method", "方法", "ablation", "novel"],
    "open_source": ["open source", "开源", "オープンソース", "github", "release", "权重", "weights",
                    "hugging face", "apache", "mit license", "repo", "repository", "sdk", "framework"],
    "safety": ["safety", "安全", "セーフティ", "alignment", "对齐", "アラインメント", "jailbreak", "越狱",
               "prompt injection", "注入攻击", "hallucination", "幻觉", "ハルシネーション", "监管", "regulation",
               "ethics", "倫理", "privacy", "隐私", "red team", "风险", "risk"],
    "science": ["biology", "生物", "蛋白", "protein", "chemistry", "化学", "physics", "物理", "materials",
                "材料", "drug discovery", "药物", "創薬", "climate", "気候", "science", "科学"],
    "industry": ["funding", "融资", "資金調達", "investment", "投资", "acquisition", "收购", "買収", "ipo",
                 "revenue", "营收", "revenue", "partnership", "合作", "提携", "launch", "发布", "リリース",
                 "regulation", "法案", "lawsuit", "诉讼"],
}

# ============================================================
# 趋势引擎权重（可配置，不写死）
# ============================================================
TREND_WEIGHTS = {
    "velocity": 0.30,          # 增速
    "novelty": 0.20,           # 新颖度
    "source_diversity": 0.20,  # 来源多样性
    "authority": 0.15,         # 权威度
    "adoption": 0.10,          # 采用/扩散（GitHub stars / HF downloads 等）
    "recency": 0.05,           # 新鲜度
}

# 趋势观察窗口（小时）
TREND_WINDOWS = {"24h": 24, "72h": 72, "7d": 168, "30d": 720}

# ============================================================
# 数据源注册表（Source Adapter 插件系统）
# ============================================================
SOURCES = {
    "arxiv":        {"connector": "arxiv",        "type": "api",       "tier": 2, "enabled": True,
                     "label": {"zh": "arXiv 论文", "en": "arXiv", "ja": "arXiv"}},
    "github":       {"connector": "github",       "type": "api",       "tier": 2, "enabled": True,
                     "label": {"zh": "GitHub", "en": "GitHub", "ja": "GitHub"}},
    "huggingface":  {"connector": "huggingface",  "type": "api",       "tier": 2, "enabled": True,
                     "label": {"zh": "Hugging Face", "en": "Hugging Face", "ja": "Hugging Face"}},
    "hackernews":   {"connector": "hackernews",   "type": "api",       "tier": 4, "enabled": True,
                     "label": {"zh": "Hacker News", "en": "Hacker News", "ja": "Hacker News"}},
    "rss_official": {"connector": "rss",          "type": "rss",       "tier": 1, "enabled": True,
                     "label": {"zh": "官方博客", "en": "Official Blogs", "ja": "公式ブログ"}},
    "rss_media":    {"connector": "rss",          "type": "rss",       "tier": 3, "enabled": True,
                     "label": {"zh": "专业媒体", "en": "Media", "ja": "メディア"}},
    "rss_community": {"connector": "rss",         "type": "rss",       "tier": 4, "enabled": True,
                     "label": {"zh": "社区与博客", "en": "Community", "ja": "コミュニティ"}},
}

# RSS 订阅源（按 tier 分组）
RSS_FEEDS = {
    "rss_official": [
        {"id": "openai_blog",     "url": "https://openai.com/blog/rss.xml",                                         "org": "openai"},
        {"id": "deepmind_blog",   "url": "https://deepmind.google/blog/rss.xml",                                    "org": "google"},
        {"id": "google_ai_blog",  "url": "https://blog.google/technology/ai/rss/",                                  "org": "google"},
        {"id": "meta_ai",         "url": "https://ai.meta.com/blog/rss/",                                           "org": "meta"},
        {"id": "microsoft_research", "url": "https://www.microsoft.com/en-us/research/feed/",                       "org": "microsoft"},
        {"id": "nvidia_blog",     "url": "https://blogs.nvidia.com/feed/",                                          "org": "nvidia"},
        {"id": "hf_blog",         "url": "https://huggingface.co/blog/feed.xml",                                    "org": "huggingface"},
        {"id": "aws_ml",          "url": "https://aws.amazon.com/blogs/machine-learning/feed/",                     "org": "amazon"},
        {"id": "mistral_news",    "url": "https://mistral.ai/feed.xml",                                             "org": "mistral"},
        {"id": "stability_news",  "url": "https://stability.ai/news?format=rss",                                    "org": "stability"},
    ],
    "rss_media": [
        {"id": "techcrunch_ai",   "url": "https://techcrunch.com/category/artificial-intelligence/feed/",           "org": None},
        {"id": "venturebeat_ai",  "url": "https://venturebeat.com/category/ai/feed/",                               "org": None},
        {"id": "verge_ai",        "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",       "org": None},
        {"id": "arstechnica_ai",  "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",                "org": None},
        {"id": "mit_tr_ai",       "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed",     "org": None},
        {"id": "jiqizhixin",      "url": "https://www.jiqizhixin.com/rss",                                          "org": None},
        {"id": "qbitai",          "url": "https://www.qbitai.com/feed",                                             "org": None},
        {"id": "36kr",            "url": "https://36kr.com/feed",                                                   "org": None},
    ],
    "rss_community": [
        {"id": "simonwillison",   "url": "https://simonwillison.net/atom/everything/",                              "org": None},
        {"id": "import_ai",       "url": "https://importai.substack.com/feed",                                      "org": None},
        {"id": "latent_space",    "url": "https://www.latent.space/feed",                                           "org": None},
        {"id": "interconnects",   "url": "https://www.interconnects.ai/feed",                                       "org": None},
        {"id": "reddit_ml",       "url": "https://www.reddit.com/r/MachineLearning/.rss",                           "org": None},
        {"id": "hn_frontpage",    "url": "https://news.ycombinator.com/rss",                                        "org": None},
    ],
}

# arXiv 查询配置
ARXIV_CATEGORIES = ["cs.AI", "cs.CL", "cs.LG", "cs.CV", "cs.RO", "cs.NE"]
ARXIV_MAX_PER_CAT = 40

# GitHub 搜索配置（最近 3 天活跃的热门 AI 仓库）
# 注意：GitHub Search API 不支持布尔 OR，必须拆分为单主题查询
GITHUB_SEARCH_QUERIES = [
    "topic:llm stars:>1500 pushed:>{since}",
    "topic:large-language-models stars:>800 pushed:>{since}",
    "topic:ai-agent stars:>500 pushed:>{since}",
    "topic:agents stars:>400 pushed:>{since}",
    "topic:multimodal stars:>300 pushed:>{since}",
    "topic:vision-language stars:>300 pushed:>{since}",
    "topic:diffusion-models stars:>300 pushed:>{since}",
    "topic:text-to-video stars:>300 pushed:>{since}",
    "topic:robotics stars:>200 pushed:>{since}",
    "topic:embodied-ai stars:>200 pushed:>{since}",
    "topic:llm-inference stars:>200 pushed:>{since}",
    "topic:rag stars:>200 pushed:>{since}",
]

# ============================================================
# LLM 配置（可选增强：有 API key 时启用 AI 摘要 / 报告润色）
# ============================================================
LLM = {
    "enabled_env": "GECKO_LLM_API_KEY",     # 环境变量名（GitHub Secrets 注入）
    "base_url_env": "GECKO_LLM_BASE_URL",   # 可选：自定义 endpoint
    "model_env": "GECKO_LLM_MODEL",         # 可选：模型名
    "default_base_url": "https://api.deepseek.com/v1",
    "default_model": "deepseek-chat",
    "max_docs_per_run": 40,                  # 单次运行最多处理的 LLM 摘要条数（控成本）
    "max_report_tokens": 4000,
}
