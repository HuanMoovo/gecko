# -*- coding: utf-8 -*-
"""
GECKO Pipeline — 去重 / 分类 / 实体 / 事件聚类 / 趋势引擎
对应方案文档 §8 数据处理 Pipeline 与 §11-20
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from . import config as C
from .core import (jaccard, title_similarity, classify, extract_entities, score_document,
                   parse_time, hours_since, sha1, now_utc, iso)

# ============================================================
# 三层去重（§11）
# ============================================================
def dedup(new_docs: list[dict], known_docs: list[dict]) -> tuple[list[dict], dict]:
    """
    Level 1: canonical_url / content_hash / title_hash 精确
    Level 2: 标题近重复（相似度阈值）
    Level 3: 语义近似（实体+标题联合判定）
    """
    stats = {"exact": 0, "near": 0, "semantic": 0, "kept": 0}
    seen_urls = {d.get("canonical_url") for d in known_docs if d.get("canonical_url")}
    seen_hashes = {d.get("content_hash") for d in known_docs if d.get("content_hash")}
    seen_titles = {d.get("title_hash") for d in known_docs if d.get("title_hash")}

    kept: list[dict] = []
    # 候选中转（近重复检测只跟最近的比对，控制复杂度）
    recent_titles: list[tuple[str, str]] = [(d.get("title", ""), d.get("id", "")) for d in known_docs[:400]]

    for doc in new_docs:
        cu, ch, th = doc.get("canonical_url"), doc.get("content_hash"), doc.get("title_hash")
        if (cu and cu in seen_urls) or (ch and ch in seen_hashes) or (th and th in seen_titles):
            stats["exact"] += 1
            continue
        # Level 2: 近重复（仅丢弃近乎同名/同内容的转载；0.62-0.86 的交由事件聚类合并）
        dup = False
        for t, _tid in recent_titles[:200]:
            sim = title_similarity(doc["title"], t)
            if sim >= 0.86:
                dup = True
                stats["near"] += 1
                break
        if dup:
            continue
        kept.append(doc)
        seen_urls.add(cu)
        seen_hashes.add(ch)
        seen_titles.add(th)
        recent_titles.insert(0, (doc["title"], doc["id"]))
    stats["kept"] = len(kept)
    return kept, stats


# ============================================================
# Enrich：分类 / 实体 / 评分（§14）
# ============================================================
def enrich(docs: list[dict], source_tiers: dict[str, int]) -> None:
    for doc in docs:
        doc["tier"] = source_tiers.get(doc.get("source", ""), 4)
        cls = classify(doc["title"], doc.get("summary", ""), {"content_type": doc.get("content_type")})
        doc["classification"] = cls
        doc["category"] = cls["category"]
        doc["categories"] = cls["categories"]
        doc["subcategories"] = cls["subcategories"]
        doc["topics"] = cls["categories"]
        ents = extract_entities(doc["title"], doc.get("summary", ""))
        # 并入来源组织
        for org in doc.get("organization") or []:
            oid = None
            for k, v in C.ORGANIZATIONS.items():
                if org and (org.lower() == k or org.lower() in [a for a in v["aliases"]]):
                    oid = k
                    break
            if oid and f"org:{oid}" not in {e["id"] for e in ents}:
                org_cfg = C.ORGANIZATIONS[oid]
                ents.insert(0, {"id": f"org:{oid}", "type": "organization", "name": org_cfg["name"],
                                "region": org_cfg.get("region"), "tier": org_cfg.get("tier", 3)})
        doc["entities"] = ents
        score_document(doc, text=doc.get("summary", ""))


# ============================================================
# 事件聚类（§12）— 文章 → 事件
# ============================================================
def _event_type(doc: dict) -> str:
    t = (doc.get("title") or "").lower()
    ct = doc.get("content_type")
    if ct == "paper":
        return "paper"
    if ct == "model":
        return "model_release"
    if ct == "repository":
        return "project"
    if any(k in t for k in ("funding", "raises", "融资", "投資", "valuation", "million", "billion")):
        return "funding"
    if any(k in t for k in ("regulation", "policy", "law", "法案", "监管", "act", "ban")):
        return "policy"
    if any(k in t for k in ("release", "launch", "announc", "introduc", "unveil", "发布", "开源", "发表")):
        return "release"
    if ct == "product":
        return "product"
    return "news"


def _event_match_score(doc: dict, event: dict) -> float:
    # 时间窗：事件最后活跃时间与文档时间差
    last = parse_time(event.get("last_seen_at"))
    dt = parse_time(doc.get("published_at")) or now_utc()
    if last and abs((dt - last).total_seconds()) > 96 * 3600:
        return 0.0
    sim = title_similarity(doc["title"], event.get("title", ""))
    if sim >= 0.66:
        return sim
    de = {e["id"] for e in doc.get("entities", [])}
    ee = set(event.get("entity_ids", []))
    if de and ee:
        j = jaccard(de, ee)
        strong = len({i for i in (de & ee) if i.startswith(("model:", "org:"))})
        if j >= 0.45 and sim >= 0.22:
            return 0.6 + 0.3 * j
        if strong >= 2 and sim >= 0.18:
            return 0.55
        if j >= 0.6:
            return 0.5
    return 0.0


def cluster(docs: list[dict], existing_events: list[dict], max_gap_hours: int = 96) -> tuple[list[dict], dict]:
    """
    把文档归入事件：匹配已有事件 → 追加；否则新建事件。
    返回 (updated_events, doc→event 映射)
    """
    events = {e["event_id"]: e for e in existing_events}
    doc_map: dict[str, str] = {}
    created = 0
    matched = 0

    docs_sorted = sorted(docs, key=lambda d: -(d.get("importance_score") or 0))
    for doc in docs_sorted:
        best_id, best_score = None, 0.0
        for eid, ev in events.items():
            s = _event_match_score(doc, ev)
            if s > best_score:
                best_id, best_score = eid, s
        if best_id and best_score >= 0.5:
            ev = events[best_id]
            matched += 1
        else:
            best_id = "evt_" + sha1((doc.get("canonical_url") or doc["id"]), 12)
            if best_id in events:
                matched += 1
            else:
                events[best_id] = _new_event(doc)
                created += 1
            ev = events[best_id]

        # 更新事件
        doc["cluster_id"] = best_id
        doc_map[doc["id"]] = best_id
        if doc["id"] not in ev["document_ids"]:
            ev["document_ids"].append(doc["id"])
        src = doc.get("source")
        if src and src not in ev["sources"]:
            ev["sources"].append(src)
        for e in doc.get("entities", []):
            if e["id"] not in ev["entity_ids"]:
                ev["entity_ids"].append(e["id"])
                ev.setdefault("entities", []).append(e)
        pub = doc.get("published_at") or iso(now_utc())
        if not ev.get("first_seen_at") or pub < ev["first_seen_at"]:
            ev["first_seen_at"] = pub
        if not ev.get("last_seen_at") or pub > ev["last_seen_at"]:
            ev["last_seen_at"] = pub
        ev["timeline"].append({
            "title": doc["title"][:180], "url": doc.get("url"), "source": src,
            "date": (doc.get("published_at") or iso(now_utc()))[:10],
            "tier": doc.get("tier", 4),
        })
        # 事件分数刷新：importance 取最大 + 来源加成
        ev["importance_score"] = max(ev.get("importance_score", 0), doc.get("importance_score", 0))
        ev["source_count"] = len(ev["document_ids"])
        ev["source_diversity"] = round(min(1.0, len(set(ev["sources"])) / 5.0), 3)
        ev["confidence_score"] = round(min(0.99, 0.45 + 0.08 * len(ev["document_ids"]) + 0.15 * (1 if ev["tier"] <= 2 else 0)), 2)
        ev["entity_ids"] = ev["entity_ids"][:16]
        ev.setdefault("entities", [])
        ev["entities"] = ev["entities"][:12]
        if len(ev["timeline"]) > 20:
            ev["timeline"] = ev["timeline"][-20:]
        # 时间线排序
        ev["timeline"].sort(key=lambda x: x.get("date") or "")

    # 事件类型 / 分类 / 趋势状态
    docs_by_id = {d["id"]: d for d in docs}
    for ev in events.values():
        # 事件标题用最高分文档
        rep = None
        for did in ev["document_ids"][:12]:
            d = docs_by_id.get(did)
            if d and (rep is None or (d.get("importance_score", 0) > rep.get("importance_score", 0))):
                rep = d
        if rep:
            if not ev.get("title") or rep.get("importance_score", 0) >= ev.get("_rep_score", 0):
                ev["title"] = rep["title"][:220]
                ev["canonical_description"] = (rep.get("summary") or "")[:600]
                ev["main_url"] = rep.get("url")
                ev["language"] = rep.get("language", "en")
                ev["category"] = rep.get("category") or ev.get("category")
                ev["content_type"] = rep.get("content_type")
                ev["_rep_score"] = rep.get("importance_score", 0)
        ev["event_type"] = ev.get("event_type") or _event_type(rep or {"title": ev.get("title", "")})
        ev["trend_state"] = _trend_state(ev)

    for ev in events.values():
        ev.pop("_rep_score", None)
    return list(events.values()), {"created": created, "matched": matched, "total": len(events)}


def _new_event(doc: dict) -> dict:
    return {
        "event_id": "evt_" + sha1((doc.get("canonical_url") or doc["id"]), 12),
        "title": doc["title"][:220],
        "event_type": _event_type(doc),
        "category": doc.get("category"),
        "canonical_description": (doc.get("summary") or "")[:600],
        "first_seen_at": doc.get("published_at") or iso(now_utc()),
        "last_seen_at": doc.get("published_at") or iso(now_utc()),
        "importance_score": doc.get("importance_score", 0),
        "novelty_score": doc.get("novelty_score", 0.5),
        "trend_score": 0.0,
        "confidence_score": 0.5,
        "source_count": 0,
        "source_diversity": 0.0,
        "sources": [],
        "document_ids": [],
        "entity_ids": [],
        "entities": [],
        "timeline": [],
        "tier": doc.get("tier", 4),
        "main_url": doc.get("url"),
        "language": doc.get("language", "en"),
        "content_type": doc.get("content_type"),
    }


def _trend_state(ev: dict) -> str:
    n = len(ev.get("document_ids", []))
    hrs = hours_since(ev.get("last_seen_at"))
    if hrs <= 24 and n >= 4:
        return "surging"
    if hrs <= 48 and n >= 2:
        return "rising"
    if hrs > 24 * 5:
        return "cooling"
    return "active"


# ============================================================
# 趋势引擎（§20）— TrendScore 加权公式
# ============================================================
def _collect_docs(days: list[dict]) -> list[dict]:
    docs = []
    for d in days:
        docs.extend(d.get("documents", []))
    return docs


def _sparkline(docs: list[dict], days_n: int = 14) -> list[int]:
    today = now_utc().date()
    buckets = [0] * days_n
    for d in docs:
        dt = parse_time(d.get("published_at")) or parse_time(d.get("discovered_at"))
        if not dt:
            continue
        delta = (today - dt.date()).days
        if 0 <= delta < days_n:
            buckets[days_n - 1 - delta] += 1
    return buckets


def _score(metric: dict) -> float:
    w = C.TREND_WEIGHTS
    return round(
        w["velocity"] * metric["velocity"]
        + w["novelty"] * metric["novelty"]
        + w["source_diversity"] * metric["source_diversity"]
        + w["authority"] * metric["authority"]
        + w["adoption"] * metric["adoption"]
        + w["recency"] * metric["recency"], 4)


def _metric_block(docs: list[dict]) -> dict:
    now = now_utc()
    d24 = [d for d in docs if hours_since(d.get("published_at") or d.get("discovered_at")) <= 24]
    d7 = [d for d in docs if hours_since(d.get("published_at") or d.get("discovered_at")) <= 168]
    d30 = [d for d in docs if hours_since(d.get("published_at") or d.get("discovered_at")) <= 720]
    avg_daily_30 = len(d30) / 30.0
    velocity = min(1.0, (len(d24) / (avg_daily_30 + 0.6)) / 6.0)
    sources = {d.get("source") for d in d7} if d7 else set()
    diversity = min(1.0, len(sources) / 8.0)
    tiers = [d.get("tier", 4) for d in (d7 or docs)]
    authority = min(1.0, (sum({1: 1.0, 2: 0.8, 3: 0.55, 4: 0.3}.get(t, 0.3) for t in tiers) / max(1, len(tiers))))
    # adoption：GitHub stars / HF downloads
    adopt_vals = []
    for d in d7[:60]:
        m = d.get("metadata") or {}
        v = m.get("stars") or m.get("downloads") or m.get("likes")
        if v:
            adopt_vals.append(min(1.0, math.log10(1 + v) / 6.0))
    adoption = sum(adopt_vals) / len(adopt_vals) if adopt_vals else 0.35
    # recency：指数衰减加权
    rec = 0.0
    if docs:
        for d in docs[:200]:
            h = hours_since(d.get("published_at") or d.get("discovered_at"))
            rec += math.exp(-h / 72.0)
        rec = min(1.0, rec / max(1, len(docs[:200])) * 1.4)
    # novelty：实体的新鲜度
    ent_now = {e["id"] for d in d24 for e in d.get("entities", [])}
    ent_before = {e["id"] for d in d30 if hours_since(d.get("published_at") or d.get("discovered_at")) > 168
                  for e in d.get("entities", [])}
    novelty = min(1.0, len(ent_now - ent_before) / max(1, len(ent_now)) * 1.5) if ent_now else 0.4
    return {"velocity": round(velocity, 3), "novelty": round(novelty, 3),
            "source_diversity": round(diversity, 3), "authority": round(authority, 3),
            "adoption": round(adoption, 3), "recency": round(rec, 3),
            "counts": {"24h": len(d24), "7d": len(d7), "30d": len(d30)}}


def _direction(spark: list[int]) -> str:
    if len(spark) < 7:
        return "flat"
    recent = sum(spark[-3:]) / 3.0
    prev = sum(spark[-7:-3]) / 4.0
    if prev == 0 and recent == 0:
        return "flat"
    if recent > prev * 1.35:
        return "up"
    if recent < prev * 0.65:
        return "down"
    return "flat"


def compute_trends(days: list[dict], top_n: int = 18) -> dict:
    docs = _collect_docs(days)
    topics = []
    for cat, cfg in C.CATEGORY_TREE.items():
        cat_docs = [d for d in docs if cat in (d.get("categories") or [d.get("category")])]
        if not cat_docs:
            continue
        m = _metric_block(cat_docs)
        score = _score(m)
        topics.append({
            "topic": cat,
            "label": cfg["label"],
            "icon": cfg["icon"],
            "score": score,
            "direction": _direction(_sparkline(cat_docs)),
            "metrics": m,
            "sparkline": _sparkline(cat_docs),
            "document_count": len(cat_docs),
            "top_titles": [d["title"][:120] for d in sorted(cat_docs, key=lambda x: -x.get("importance_score", 0))[:3]],
        })
    topics.sort(key=lambda t: -t["score"])

    # 实体趋势（组织 / 模型）
    ent_stats: dict[str, dict] = {}
    for d in docs:
        for e in d.get("entities", []):
            if e["type"] not in ("organization", "model", "concept", "benchmark"):
                continue
            st = ent_stats.setdefault(e["id"], {"id": e["id"], "type": e["type"], "name": e["name"],
                                                "docs": [], "meta": e})
            st["docs"].append(d)
    entities = []
    for eid, st in ent_stats.items():
        if len(st["docs"]) < 2:
            continue
        m = _metric_block(st["docs"])
        entities.append({"id": eid, "type": st["type"], "name": st["name"], "score": _score(m),
                         "direction": _direction(_sparkline(st["docs"])), "metrics": m,
                         "sparkline": _sparkline(st["docs"]), "document_count": len(st["docs"]),
                         "region": (st.get("meta") or {}).get("region")})
    entities.sort(key=lambda e: -e["score"])

    return {
        "updated_at": iso(now_utc()),
        "windows": list(C.TREND_WINDOWS.keys()),
        "weights": C.TREND_WEIGHTS,
        "topics": topics[:top_n],
        "entities": entities[:40],
        "document_count": len(docs),
    }


# ============================================================
# 知识图谱 — 实体索引（§13 轻量版）
# ============================================================
def build_entity_index(days: list[dict]) -> dict:
    docs = _collect_docs(days)
    ent_map: dict[str, dict] = {}
    for d in docs:
        for e in d.get("entities", []):
            st = ent_map.setdefault(e["id"], {
                "id": e["id"], "type": e["type"], "name": e["name"],
                "region": e.get("region"), "tier": e.get("tier"),
                "doc_count": 0, "recent_titles": [], "sources": [],
                "relations": {},
            })
            st["doc_count"] += 1
            if len(st["recent_titles"]) < 5:
                st["recent_titles"].append({"title": d["title"][:120], "url": d.get("url"),
                                            "date": (d.get("published_at") or "")[:10]})
            if d.get("source") and d["source"] not in st["sources"]:
                st["sources"].append(d["source"])
            # 关系：同文档出现的组织→模型/概念
            for other in d.get("entities", []):
                if other["id"] == e["id"]:
                    continue
                rel = _rel_label(e["type"], other["type"])
                if rel:
                    key = f"{rel}:{other['id']}"
                    r = st["relations"].setdefault(key, {"rel": rel, "target": other["id"],
                                                         "target_name": other["name"],
                                                         "target_type": other["type"], "weight": 0})
                    r["weight"] += 1
    # 裁剪关系 top5
    for st in ent_map.values():
        rels = sorted(st["relations"].values(), key=lambda r: -r["weight"])[:5]
        st["relations"] = rels
    # 只保留 >= 2 篇文档的实体
    return {"updated_at": iso(now_utc()),
            "entities": sorted([e for e in ent_map.values() if e["doc_count"] >= 2],
                               key=lambda x: -x["doc_count"])[:400]}


def _rel_label(t1: str, t2: str) -> str | None:
    if t1 == "organization" and t2 in ("model", "product"):
        return "develops"
    if t1 == "organization" and t2 == "concept":
        return "works_on"
    if t1 == "organization" and t2 == "benchmark":
        return "evaluated_on"
    if t1 == "model" and t2 == "organization":
        return "released_by"
    if t1 == "model" and t2 == "benchmark":
        return "evaluated_on"
    if t1 == "model" and t2 == "concept":
        return "implements"
    if t1 == "concept" and t2 == "organization":
        return "led_by"
    if t1 == "paper" and t2 == "concept":
        return "introduces"
    return None
