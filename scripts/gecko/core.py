# -*- coding: utf-8 -*-
"""
GECKO Core — 数据模型与基础能力
Canonical Document / 文本相似度 / 分类 / 实体抽取 / 哈希 / 时间解析
"""
from __future__ import annotations

import hashlib
import re
import json
import math
import unicodedata
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

from . import config as C

# ============================================================
# 时间工具
# ============================================================
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_time(value) -> datetime | None:
    """解析多种时间格式：ISO / RFC822 / 时间戳"""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc)
        except (ValueError, OSError, OverflowError):
            return None
    s = str(value).strip()
    if not s:
        return None
    # RFC822 (RSS)
    if "," in s or s[:3].isalpha():
        try:
            dt = parsedate_to_datetime(s)
            if dt and dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            pass
    # ISO 变体
    s2 = s.replace("Z", "+00:00")
    for fmt in (None, "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            dt = datetime.fromisoformat(s2) if fmt is None else datetime.strptime(s2[:19], fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            continue
    # 纯数字字符串（unix ts）
    if re.fullmatch(r"\d{10,13}", s):
        try:
            v = int(s) / (1000 if len(s) == 13 else 1)
            return datetime.fromtimestamp(v, tz=timezone.utc)
        except Exception:
            return None
    return None


def hours_since(iso_str: str) -> float:
    dt = parse_time(iso_str)
    if not dt:
        return 9999.0
    return max(0.0, (now_utc() - dt).total_seconds() / 3600.0)


# ============================================================
# URL / 哈希
# ============================================================
_TRACKING_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "ref_src",
                    "fbclid", "gclid", "mc_cid", "mc_eid", "spm", "from", "share_token", "source"}


def canonical_url(url: str) -> str:
    """URL 规范化：去 tracking 参数、统一 scheme/host、去尾斜杠"""
    if not url:
        return ""
    try:
        p = urlparse(url.strip())
    except Exception:
        return url.strip()
    scheme = "https" if p.scheme in ("http", "https") else p.scheme
    host = (p.netloc or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if host == "arxiv.org" and p.path.startswith("/abs/"):
        pass  # 保留
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=False) if k.lower() not in _TRACKING_PARAMS]
    path = p.path.rstrip("/") or "/"
    return urlunparse((scheme, host, path, "", urlencode(query), ""))


def sha1(text: str, n: int = 16) -> str:
    return hashlib.sha1((text or "").encode("utf-8", "ignore")).hexdigest()[:n]


def content_hash(title: str, content: str = "") -> str:
    return sha1(f"{(title or '').strip().lower()}||{(content or '')[:2000].strip().lower()}", 24)


def title_hash(title: str) -> str:
    return sha1(normalize_text(title or ""), 20)


# ============================================================
# 文本处理
# ============================================================
_PUNCT_RE = re.compile(r"[^\w\s\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+", re.UNICODE)
_WS_RE = re.compile(r"\s+")
_CJK_RE = re.compile(r"[\u4e00-\u9fff]")


def normalize_text(text: str) -> str:
    if not text:
        return ""
    t = unicodedata.normalize("NFKC", text).lower()
    t = _PUNCT_RE.sub(" ", t)
    return _WS_RE.sub(" ", t).strip()


_STOP = set("""the a an and or of to in for on with is are was were be been being at by from as it its this that
these those we you they he she i will would can could should may might must not no nor so if then than too very
about into over after before between out up down new using use used based via more most other such also first
have has had do does did but what which who when where why how all any both each few many some own same""".split())
_STOP.update("で と を に は が の も から まで より へ や など する した して ある いる この その ため 的 了 和 与 在 是 为 对 从 到".split())


def tokenize(text: str) -> list[str]:
    """中英日混合分词：英文按词，CJK 按 2-gram"""
    t = normalize_text(text)
    tokens = []
    for w in t.split():
        if _CJK_RE.search(w):
            # CJK：2-gram
            if len(w) == 1:
                tokens.append(w)
            else:
                tokens.extend(w[i:i + 2] for i in range(len(w) - 1))
        elif len(w) > 1 and w not in _STOP:
            tokens.append(w)
    return tokens


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    if inter == 0:
        return 0.0
    return inter / len(a | b)


def title_similarity(t1: str, t2: str) -> float:
    """标题相似度：token Jaccard 混合字符 3-gram 包含度"""
    n1, n2 = normalize_text(t1), normalize_text(t2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    shorter, longer = (n1, n2) if len(n1) <= len(n2) else (n2, n1)
    if len(shorter) >= 12 and shorter in longer:
        return 0.92
    j = jaccard(set(tokenize(t1)), set(tokenize(t2)))
    # 字符 3-gram 覆盖度
    def grams(s):
        s = s.replace(" ", "")
        return {s[i:i + 3] for i in range(max(0, len(s) - 2))} or {s}
    g1, g2 = grams(n1), grams(n2)
    cover = len(g1 & g2) / max(1, min(len(g1), len(g2)))
    return round(0.55 * j + 0.45 * cover, 4)


# ============================================================
# Canonical Document
# ============================================================
def make_document(
    *,
    source: str,
    source_id: str,
    source_type: str,
    content_type: str,
    title: str,
    url: str,
    summary: str = "",
    author: list | None = None,
    organization: list | None = None,
    language: str = "en",
    published_at=None,
    metadata: dict | None = None,
) -> dict:
    """构造标准化 Canonical Document（方案文档 §10）"""
    cu = canonical_url(url)
    pub = parse_time(published_at)
    doc_id = "doc_" + sha1(f"{source}|{source_id}|{cu}", 14)
    return {
        "id": doc_id,
        "source": source,
        "source_id": str(source_id),
        "source_type": source_type,
        "content_type": content_type,               # paper/model/repository/news/blog/video/product
        "title": (title or "").strip()[:300],
        "url": url,
        "canonical_url": cu,
        "summary": (summary or "").strip()[:1500],
        "author": author or [],
        "organization": organization or [],
        "language": language,
        "published_at": iso(pub) if pub else None,
        "discovered_at": iso(now_utc()),
        "content_hash": content_hash(title, summary),
        "title_hash": title_hash(title),
        "tier": 4,
        "topics": [],
        "category": None,
        "subcategories": [],
        "entities": [],
        "importance_score": 0.0,
        "novelty_score": 0.0,
        "trend_score": 0.0,
        "confidence_score": 0.5,
        "cluster_id": None,
        "metadata": metadata or {},
    }


# ============================================================
# 分类器（四级：Rule → Metadata → 关键词向量 → 可选 LLM）
# ============================================================
def detect_language(text: str) -> str:
    if not text:
        return "en"
    cjk = len(re.findall(r"[\u4e00-\u9fff]", text))
    kana = len(re.findall(r"[\u3040-\u30ff]", text))
    if kana > 20:
        return "ja"
    if cjk > 20:
        return "zh"
    return "en"


def classify(title: str, summary: str, source_hint: dict | None = None) -> dict:
    """多标签分类。返回 {category, subcategories, topics, scores}"""
    text = f"{title} {summary}".lower()
    scores = {}
    for cat, kws in C.CATEGORY_KEYWORDS.items():
        s = 0.0
        for kw in kws:
            if kw in text:
                # 标题命中权重更高
                s += 2.0 if kw in title.lower() else 1.0
        scores[cat] = s

    # Metadata 层：来源/内容类型强提示
    meta_hint = (source_hint or {}).get("content_type")
    if meta_hint == "paper":
        scores["research"] = scores.get("research", 0) + 3.0
    elif meta_hint == "model":
        scores["open_source"] = scores.get("open_source", 0) + 2.0
        scores["foundation_models"] = scores.get("foundation_models", 0) + 1.5
    elif meta_hint == "repository":
        scores["open_source"] = scores.get("open_source", 0) + 3.0

    ranked = sorted(scores.items(), key=lambda kv: -kv[1])
    top_cat, top_score = ranked[0] if ranked else ("industry", 0.0)
    if top_score <= 0:
        top_cat = "industry"

    # 主板（分数 > 0 的前 3）
    total = sum(v for _, v in ranked) or 1.0
    subcats = []
    for cat, s in ranked[:3]:
        if s <= 0:
            continue
        for sub, label in C.CATEGORY_TREE.get(cat, {}).get("subs", {}).items():
            for kw in C.CATEGORY_KEYWORDS.get(cat, [])[:8]:
                if kw in text and (sub.replace("_", " ") in text or kw == sub):
                    subcats.append(cat + "." + sub)
                    break
    topics = [cat for cat, s in ranked if s > 0][:4]
    if not topics:
        topics = ["industry"]

    confidence = min(0.95, 0.4 + 0.1 * min(5, top_score)) if top_score > 0 else 0.35
    return {
        "category": top_cat,
        "categories": topics,
        "subcategories": subcats[:4],
        "topic_scores": {k: round(v, 2) for k, v in ranked if v > 0},
        "confidence": round(confidence, 2),
        "label": C.CATEGORY_TREE.get(top_cat, {}).get("label", {}).get("zh", top_cat),
        "icon": C.CATEGORY_TREE.get(top_cat, {}).get("icon", "📌"),
    }


# ============================================================
# 实体抽取（词典 + 组织注册表）
# ============================================================
def extract_entities(title: str, summary: str) -> list[dict]:
    """返回 [{id, type, name}]，id 稳定可链接"""
    text = f"{title} {summary}".lower()
    found: dict[str, dict] = {}

    # 组织
    for oid, org in C.ORGANIZATIONS.items():
        for alias in org["aliases"]:
            if alias in text:
                found["org:" + oid] = {"id": "org:" + oid, "type": "organization",
                                       "name": org["name"], "region": org.get("region"),
                                       "tier": org.get("tier", 3)}
                break
    # 模型 / 概念 / Benchmark / 产品
    for etype, words in C.ENTITY_LEXICON.items():
        for w in words:
            if w in text:
                eid = f"{etype}:{sha1(w, 10)}"
                found[eid] = {"id": eid, "type": etype, "name": w}
    # 大写型号（如 GPT-5.5 / Llama-4 / DeepSeek-V4）
    for m in re.findall(r"\b([A-Z][A-Za-z]*(?:[-.]\d+(?:\.\d+)?)+)\b", title):
        if len(m) >= 4:
            eid = "model:" + sha1(m.lower(), 10)
            found[eid] = {"id": eid, "type": "model", "name": m}
    out = list(found.values())
    out.sort(key=lambda e: 0 if e["type"] == "organization" else 1)
    return out[:12]


# ============================================================
# 重要性 / 新颖度 评分
# ============================================================
_CONTENT_TYPE_WEIGHT = C.CONTENT_TYPE_WEIGHT

# 标题信号词（→ 新闻性）。避免把仓库 README 常见词算作信号
_SIGNAL_WORDS = ("release", "released", "launch", "launched", "announc", "unveil", "introduc",
                 "发布", "开源", "发表", "上线", "推出", "首个", "first", "record", "突破", "breakthrough")


def score_document(doc: dict, org_count: int = 0, text: str = "") -> None:
    """就地计算 importance / novelty / confidence"""
    tier_score = {1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4}.get(doc.get("tier", 4), 0.4)
    ct = _CONTENT_TYPE_WEIGHT.get(doc.get("content_type", "news"), 0.55)
    ent_boost = min(0.25, 0.05 * len(doc.get("entities", [])))
    cls_conf = doc.get("classification", {}).get("confidence", 0.5)

    # 标题信号
    t = (doc.get("title") or "").lower()
    signal = 0.0
    for kw in _SIGNAL_WORDS:
        if kw in t:
            signal += 0.05
    signal = min(0.28, signal)

    importance = 0.30 * tier_score + 0.25 * ct + ent_boost + signal + 0.15 * cls_conf

    # 仓库新鲜度：新项目加权 / 常青仓库降权（避免 transformers 之类天天霸榜）
    if doc.get("content_type") == "repository":
        created = parse_time((doc.get("metadata") or {}).get("created_at"))
        if created:
            age_days = (now_utc() - created).days
            if age_days <= C.REPO_FRESH_DAYS:
                importance *= 1.18
            elif age_days >= C.REPO_STALE_DAYS:
                importance *= 0.70
    # 论文：同批次数量大，轻微降权
    elif doc.get("content_type") == "paper":
        importance *= 0.94

    doc["importance_score"] = round(min(1.0, importance), 3)
    doc["confidence_score"] = round(min(0.98, 0.5 + 0.4 * tier_score + 0.1 * cls_conf), 2)
    doc["novelty_score"] = round(min(1.0, 0.5 + signal + 0.2 * ct), 3)
