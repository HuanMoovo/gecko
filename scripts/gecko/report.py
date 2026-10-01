# -*- coding: utf-8 -*-
"""
日报生成系统（§17-19）— Daily Report 结构 + Claim/Evidence 事实链
确定性生成（模板 + 排序 + 聚合），LLM 为可选润色层。
"""
from __future__ import annotations

from . import config as C
from .core import now_utc, iso, hours_since
from . import llm as llm_mod

SECTION_ORDER = [
    ("foundation_models", {"zh": "模型与基础模型", "en": "Models & Foundation", "ja": "モデル"}),
    ("research", {"zh": "研究论文", "en": "Research", "ja": "研究"}),
    ("agents", {"zh": "智能体", "en": "Agents", "ja": "エージェント"}),
    ("generative", {"zh": "多模态与生成", "en": "Generative & Multimodal", "ja": "生成・マルチモーダル"}),
    ("robotics", {"zh": "机器人", "en": "Robotics", "ja": "ロボティクス"}),
    ("open_source", {"zh": "开源生态", "en": "Open Source", "ja": "オープンソース"}),
    ("infrastructure", {"zh": "基础设施", "en": "Infrastructure", "ja": "インフラ"}),
    ("safety", {"zh": "安全与治理", "en": "Safety & Policy", "ja": "安全性"}),
    ("science", {"zh": "AI for Science", "en": "AI for Science", "ja": "科学AI"}),
    ("industry", {"zh": "行业动态", "en": "Industry", "ja": "業界"}),
]


def _evidence_from_docs(docs: list[dict], limit: int = 6) -> list[dict]:
    ev = []
    seen = set()
    for d in sorted(docs, key=lambda x: (x.get("tier", 4), -x.get("importance_score", 0))):
        url = d.get("canonical_url") or d.get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        ev.append({"title": d["title"][:160], "url": d.get("url"), "source": d.get("source"),
                   "tier": d.get("tier", 4), "date": (d.get("published_at") or "")[:10]})
        if len(ev) >= limit:
            break
    return ev


def _doc_brief(d: dict) -> dict:
    return {
        "id": d["id"], "title": d["title"][:200], "url": d.get("url"),
        "source": d.get("source"), "tier": d.get("tier", 4),
        "summary": (d.get("ai_brief") or d.get("summary") or "")[:280],
        "published_at": d.get("published_at"),
        "category": d.get("category"),
        "entities": [e["name"] for e in (d.get("entities") or [])[:4]],
        "importance_score": d.get("importance_score", 0),
        "content_type": d.get("content_type"),
        "event_id": d.get("cluster_id"),
        "metadata": {k: v for k, v in (d.get("metadata") or {}).items()
                     if k in ("stars", "downloads", "likes", "points", "comments", "language",
                              "arxiv_id", "categories", "pipeline_tag", "region")},
    }


def build_report(date: str, days_window: list[dict], trends: dict, prev_trends: dict | None = None) -> dict:
    """
    用最近 24h 数据构建日报。
    days_window: 最近数天的分片（用于事件与文档）
    """
    docs_24h: list[dict] = []
    docs_all: list[dict] = []
    events: list[dict] = []
    for day in days_window:
        docs_all.extend(day.get("documents", []))
        events.extend(day.get("events", []))
    for d in docs_all:
        if hours_since(d.get("published_at") or d.get("discovered_at")) <= 24:
            docs_24h.append(d)
    if not docs_24h:  # 兜底：用最新一天的数据
        docs_24h = sorted(docs_all, key=lambda d: d.get("published_at") or "", reverse=True)[:200]

    day_ids = {d["id"] for d in docs_24h}
    events_24h = [e for e in events if (set(e.get("document_ids", [])) & day_ids)] or events

    # ---------- 01 今日头条 ----------
    top_events = sorted(events_24h, key=lambda e: (-e.get("importance_score", 0),
                                                   -e.get("source_count", 0),
                                                   -e.get("source_diversity", 0)))[:6]
    doc_by_id = {d["id"]: d for d in docs_all}
    headlines = []
    for e in top_events[:5]:
        ev_docs = [doc_by_id[i] for i in e.get("document_ids", []) if i in doc_by_id]
        headlines.append({
            "event_id": e["event_id"],
            "title": e["title"],
            "title_i18n": None,          # LLM 增强时填充 {zh,en,ja}
            "description_i18n": None,
            "event_type": e.get("event_type"),
            "category": e.get("category"),
            "description": (e.get("canonical_description") or "")[:300],
            "importance_score": e.get("importance_score"),
            "confidence_score": e.get("confidence_score"),
            "source_count": e.get("source_count"),
            "source_diversity": e.get("source_diversity"),
            "sources": e.get("sources", [])[:6],
            "trend_state": e.get("trend_state"),
            "entities": [x["name"] for x in (e.get("entities") or [])[:5]],
            "url": e.get("main_url"),
            "evidence": _evidence_from_docs(ev_docs) if ev_docs else [
                {"title": t.get("title"), "url": t.get("url"), "source": t.get("source")}
                for t in e.get("timeline", [])[:5]],
        })

    # ---------- 03 新模型 / 04 新论文 / 05 开源项目 ----------
    def pick(ct: str, n: int = 8) -> list[dict]:
        items = [d for d in docs_24h if d.get("content_type") == ct]
        items.sort(key=lambda d: -d.get("importance_score", 0))
        return [_doc_brief(d) for d in items[:n]]

    new_models = pick("model", 10)
    new_papers = pick("paper", 10)
    new_projects = pick("repository", 10)
    new_datasets = pick("dataset", 6)

    # ---------- 02 今日重点（分类分节）----------
    sections = []
    for cat, label in SECTION_ORDER:
        items = [d for d in docs_24h if cat in (d.get("categories") or [d.get("category")])]
        if not items:
            continue
        items.sort(key=lambda d: (-d.get("importance_score", 0), d.get("tier", 4)))
        sections.append({"key": cat, "label": label,
                         "count": len(items),
                         "items": [_doc_brief(d) for d in items[:6]]})

    # ---------- 06 趋势变化 ----------
    def trend_map(t: dict | None) -> dict:
        return {x["topic"]: x for x in (t or {}).get("topics", [])}

    t_now, t_prev = trend_map(trends), trend_map(prev_trends)
    rising, cooling, fresh = [], [], []
    for topic, item in t_now.items():
        prev = t_prev.get(topic)
        delta = item["score"] - (prev["score"] if prev else 0.0)
        row = {"topic": topic, "label": item["label"], "icon": item["icon"],
               "score": item["score"], "delta": round(delta, 4),
               "direction": item["direction"], "sparkline": item["sparkline"][-10:],
               "counts": item["metrics"]["counts"]}
        if not prev:
            fresh.append(row)
        elif delta > 0.02:
            rising.append(row)
        elif delta < -0.02:
            cooling.append(row)
    rising.sort(key=lambda r: -r["delta"])
    cooling.sort(key=lambda r: r["delta"])
    trend_changes = {"rising": rising[:6], "cooling": cooling[:6], "new": fresh[:4]}

    # ---------- Watchlist ----------
    watchlist = []
    for e in sorted(events_24h, key=lambda x: (-(x.get("source_count") or 0),
                                               -len(x.get("timeline") or [])))[:6]:
        if e.get("source_count", 0) >= 2:
            watchlist.append({"event_id": e["event_id"], "title": e["title"][:160],
                              "sources": e.get("sources", [])[:5], "trend_state": e.get("trend_state"),
                              "url": e.get("main_url"), "source_count": e.get("source_count")})

    # ---------- Claim → Evidence 事实链（§18）----------
    claims = []
    for e in top_events[:8]:
        ev = []
        for t in (e.get("timeline") or [])[:5]:
            if t.get("url"):
                ev.append({"title": (t.get("title") or "")[:140], "url": t["url"],
                           "source": t.get("source"), "tier": t.get("tier", 4)})
        if not ev:
            continue
        claims.append({
            "claim": e["title"][:200],
            "event_id": e["event_id"],
            "evidence": ev,
            "evidence_count": len(ev),
            "confidence": e.get("confidence_score", 0.5),
            "status": "corroborated" if len(ev) >= 3 else ("supported" if len(ev) == 2 else "single_source"),
            "verification": {
                "method": "cross-source" if len(ev) >= 2 else "single-source",
                "sources_agree": len({x.get("source") for x in ev if x.get("source")}) >= 2,
            },
        })

    # ---------- 统计 ----------
    sources_24h = {d.get("source") for d in docs_24h}
    stats = {
        "documents": len(docs_24h),
        "events": len(events_24h),
        "sources": len(sources_24h),
        "tier1_docs": len([d for d in docs_24h if d.get("tier") == 1]),
        "papers": len([d for d in docs_24h if d.get("content_type") == "paper"]),
        "models": len([d for d in docs_24h if d.get("content_type") == "model"]),
        "repos": len([d for d in docs_24h if d.get("content_type") == "repository"]),
        "claims": len(claims),
        "corroborated_claims": len([c for c in claims if c["status"] == "corroborated"]),
    }

    report = {
        "id": date,
        "type": "daily",
        "date": date,
        "title": {"zh": f"AI Frontier 日报 · {date}", "en": f"AI Frontier Daily · {date}",
                  "ja": f"AIフロンティア日報 · {date}"},
        "generated_at": iso(now_utc()),
        "intro": None,
        "intro_source": "rule",
        "headlines": headlines,
        "sections": sections,
        "new_models": new_models,
        "new_papers": new_papers,
        "new_projects": new_projects,
        "new_datasets": new_datasets,
        "trend_changes": trend_changes,
        "watchlist": watchlist,
        "claims": claims,
        "stats": stats,
        "verification": {
            "status": "auto",
            "checked_at": iso(now_utc()),
            "citation_coverage": round(len([h for h in headlines if h.get("evidence")]) / max(1, len(headlines)), 2),
            "note": {
                "zh": "关键结论已绑定来源；单来源结论标记为 single_source。",
                "en": "Key conclusions are bound to sources; single-source claims are marked.",
                "ja": "主要な結論は出典に紐付けられ、単一ソースの結論は明示されています。",
            },
        },
    }

    # 规则版导语（三语，LLM 不可用时的兜底）
    report["intro"] = {lang: _rule_intro(lang, stats, headlines, rising) for lang in ("zh", "en", "ja")}
    return report


def _rule_intro(lang: str, stats: dict, headlines: list[dict], rising: list[dict]) -> str:
    if not headlines:
        return ""
    names = [(r.get("label") or {}).get(lang) or (r.get("label") or {}).get("zh") or r.get("topic") for r in rising[:3]]
    focus = (headlines[0].get("title") or "")[:70]
    if lang == "en":
        return (f"{stats['documents']} items were collected in the past 24 hours, forming {stats['events']} events, "
                f"of which {stats['tier1_docs']} came from official and research sources. "
                f"Today's focus: {focus}. Rising areas: {', '.join(names) or '—'}.")
    if lang == "ja":
        return (f"過去24時間で {stats['documents']} 件を収集し、{stats['events']} 件のイベントに整理しました。"
                f"うち {stats['tier1_docs']} 件は公式・研究機関由来です。"
                f"本日の注目：{focus}。上昇中の領域：{'、'.join(names) or '—'}。")
    return (f"过去 24 小时共收录 {stats['documents']} 条信息，形成 {stats['events']} 个事件，"
            f"其中 {stats['tier1_docs']} 条来自官方与研究机构。"
            f"今日焦点：{focus}。上升方向：{'、'.join(names) or '—'}。")


def attach_llm(report: dict) -> None:
    """LLM 可选增强：三语导语 + 头条标题三语译文。"""
    llm_mod.enhance_report_multilingual(report)
