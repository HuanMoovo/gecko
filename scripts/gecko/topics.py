# -*- coding: utf-8 -*-
"""主题聚合：方向 / 组织 / 形态

产出 data/topics.json，供 #/topics 与 #/topic/<id> 使用。
每个主题都带：近 7/30 天规模、平均热度、趋势条、代表事件、关联实体。
"""
from __future__ import annotations

from . import config as C
from .core import hours_since, iso, now_utc

FORMAT_META = {
    "paper":      ({"zh": "论文", "en": "Papers", "ja": "論文"}, "📄"),
    "model":      ({"zh": "模型发布", "en": "Model releases", "ja": "モデル公開"}, "🧠"),
    "repository": ({"zh": "开源仓库", "en": "Repositories", "ja": "リポジトリ"}, "🐙"),
    "news":       ({"zh": "行业新闻", "en": "Industry news", "ja": "業界ニュース"}, "📰"),
    "blog":       ({"zh": "官方博客", "en": "Official blogs", "ja": "公式ブログ"}, "✍️"),
    "dataset":    ({"zh": "数据集", "en": "Datasets", "ja": "データセット"}, "🗂"),
}


def _cats(d: dict) -> list[str]:
    c = d.get("categories")
    if c:
        return list(c)
    one = d.get("category")
    return [one] if one else []


def _brief_event(e: dict) -> dict:
    return {
        "event_id": e.get("event_id"),
        "title": e.get("title"),
        "title_i18n": e.get("title_i18n"),
        "event_type": e.get("event_type"),
        "category": e.get("category"),
        "heat": e.get("heat"),
        "heat_state": e.get("heat_state"),
        "source_count": e.get("source_count"),
        "last_seen_at": e.get("last_seen_at"),
        "url": e.get("main_url"),
    }


def _top_events(events: list[dict], limit: int) -> list[dict]:
    ranked = sorted(events, key=lambda e: ((e.get("heat") or 0), (e.get("importance_score") or 0)), reverse=True)
    return [_brief_event(e) for e in ranked[:limit]]


def _scale(docs: list[dict]) -> dict:
    d7 = 0
    d30 = 0
    for d in docs:
        h = hours_since(d.get("published_at") or d.get("discovered_at"))
        if h <= 168:
            d7 += 1
        if h <= 720:
            d30 += 1
    return {"docs_7d": d7, "docs_30d": d30}


def build_topics(days: list[dict], trends: dict | None = None, entities: dict | None = None) -> dict:
    docs: list[dict] = []
    events: list[dict] = []
    for day in days:
        docs.extend(day.get("documents", []))
        events.extend(day.get("events", []))

    ent_list = (entities or {}).get("entities", []) or []
    ent_type = {e["id"]: e.get("type") for e in ent_list}
    trend_map = {t["topic"]: t for t in (trends or {}).get("topics", [])} if trends else {}

    # ---------------- 方向 ----------------
    directions = []
    for cat, meta in C.CATEGORY_TREE.items():
        cat_docs = [d for d in docs if cat in _cats(d)]
        cat_events = [e for e in events if e.get("category") == cat
                      or cat in (e.get("categories") or [])]
        if not cat_docs and not cat_events:
            continue
        scale = _scale(cat_docs)
        heats = [e.get("heat") or 0 for e in cat_events]
        tr = trend_map.get(cat) or {}
        ent_count: dict[str, int] = {}
        for d in cat_docs:
            for eid in (d.get("entity_ids") or []):
                ent_count[eid] = ent_count.get(eid, 0) + 1
        top_ents = sorted(ent_count.items(), key=lambda kv: -kv[1])[:8]
        directions.append({
            "id": cat,
            "kind": "direction",
            "label": meta["label"],
            "icon": meta["icon"],
            "subs": list((meta.get("subs") or {}).keys()),
            **_scale(cat_docs),
            "events_7d": len([e for e in cat_events
                              if hours_since(e.get("last_seen_at") or e.get("first_seen_at")) <= 168]),
            "events_total": len(cat_events),
            "heat_avg": round(sum(heats) / len(heats), 2) if heats else 0,
            "heat_max": round(max(heats), 2) if heats else 0,
            "trend": {"score": tr.get("score"), "direction": tr.get("direction"),
                      "sparkline": tr.get("sparkline", [])[-14:]} if tr else None,
            "top_events": _top_events(cat_events, C.TOPIC_EVENTS_PER_TOPIC),
            "top_entities": [{"id": i, "name": next((e["name"] for e in ent_list if e["id"] == i), i)}
                             for i, _ in top_ents],
        })
    directions.sort(key=lambda x: (-x["docs_7d"], -x["docs_30d"]))

    # ---------------- 组织 ----------------
    org_map: dict[str, list[dict]] = {}
    for ev in events:
        for ent in (ev.get("entities") or []):
            eid = ent.get("id")
            if ent_type.get(eid) == "organization":
                org_map.setdefault(eid, []).append(ev)

    organizations = []
    for eid, evs in org_map.items():
        name = next((e["name"] for e in ent_list if e["id"] == eid), eid)
        # 该组织在事件里出现的文档量
        doc_ids = {i for ev in evs for i in (ev.get("document_ids") or [])}
        org_docs = [d for d in docs if d["id"] in doc_ids]
        heats = [e.get("heat") or 0 for e in evs]
        cats: dict[str, int] = {}
        for d in org_docs:
            for c in _cats(d):
                cats[c] = cats.get(c, 0) + 1
        organizations.append({
            "id": eid,
            "kind": "organization",
            "name": name,
            "label": {"zh": name, "en": name, "ja": name},
            "icon": "🏢",
            **_scale(org_docs),
            "events_total": len(evs),
            "events_7d": len([e for e in evs
                              if hours_since(e.get("last_seen_at") or e.get("first_seen_at")) <= 168]),
            "heat_avg": round(sum(heats) / len(heats), 2) if heats else 0,
            "heat_max": round(max(heats), 2) if heats else 0,
            "categories": dict(sorted(cats.items(), key=lambda kv: -kv[1])[:5]),
            "top_events": _top_events(evs, C.TOPIC_EVENTS_PER_TOPIC),
        })
    organizations.sort(key=lambda x: (-x["docs_30d"], -x["events_total"]))
    organizations = organizations[: C.TOPIC_QUOTAS["organizations"]]

    # ---------------- 形态 ----------------
    formats = []
    for ctype, (label, icon) in FORMAT_META.items():
        ct_docs = [d for d in docs if d.get("content_type") == ctype]
        if not ct_docs:
            continue
        ct_events = [e for e in events if e.get("content_type") == ctype]
        heats = [e.get("heat") or 0 for e in ct_events]
        formats.append({
            "id": ctype,
            "kind": "format",
            "label": label,
            "icon": icon,
            **_scale(ct_docs),
            "events_total": len(ct_events),
            "events_7d": len([e for e in ct_events
                              if hours_since(e.get("last_seen_at") or e.get("first_seen_at")) <= 168]),
            "heat_avg": round(sum(heats) / len(heats), 2) if heats else 0,
            "heat_max": round(max(heats), 2) if heats else 0,
            "top_events": _top_events(ct_events, C.TOPIC_EVENTS_PER_TOPIC),
        })
    formats.sort(key=lambda x: -x["docs_7d"])

    return {
        "updated_at": iso(now_utc()),
        "directions": directions[: C.TOPIC_QUOTAS["directions"]],
        "organizations": organizations,
        "formats": formats[: C.TOPIC_QUOTAS["formats"]],
        "stats": {
            "directions": len(directions),
            "organizations": len(organizations),
            "formats": len(formats),
            "docs": len(docs),
            "events": len(events),
        },
    }
