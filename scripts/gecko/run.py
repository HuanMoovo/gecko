# -*- coding: utf-8 -*-
"""
GECKO 主入口 — 编排完整流水线
    fetch → normalize → dedup → enrich → cluster → trends → report → publish
用法:
    python -m scripts.gecko.run                # 常规增量运行
    python -m scripts.gecko.run --report-only  # 仅重建日报与趋势
    python -m scripts.gecko.run --days 30      # 指定趋势窗口天数
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta

if __package__ in (None, ""):  # 支持直接执行
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from scripts.gecko import config as C, store, pipeline, report as report_mod, llm as llm_mod
    from scripts.gecko import connectors
    from scripts.gecko.core import parse_time as _pt
else:
    from . import config as C, store, pipeline, report as report_mod, llm as llm_mod
    from . import connectors
    from .core import parse_time as _pt

MAX_DOC_AGE_DAYS = 3          # 只接收最近 3 天发布的文档
TREND_WINDOW_DAYS = 30        # 趋势计算窗口
CLUSTER_WINDOW_DAYS = 7       # 事件匹配窗口


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}", flush=True)


def load_all_days(n: int) -> list[dict]:
    return store.load_recent_days(n)


def run(report_only: bool = False, trend_days: int = TREND_WINDOW_DAYS, fetch_days: int = 14) -> dict:
    t0 = time.time()
    store.ensure_dirs()
    today = store.utc_today()

    log("GECKO pipeline starting…")
    recent_days = load_all_days(fetch_days)
    today_payload = None
    for d in recent_days:
        if d.get("date") == today:
            today_payload = d
            break
    if today_payload is None:
        today_payload = {"date": today, "documents": [], "events": [], "stats": {}}
        recent_days = [today_payload] + recent_days

    known_docs: list[dict] = []
    for d in recent_days:
        known_docs.extend(d.get("documents", []))
    log(f"known documents (last {fetch_days}d): {len(known_docs)}")

    dedup_stats = {"exact": 0, "near": 0, "semantic": 0, "kept": 0}
    health: dict = {}
    new_docs: list[dict] = []

    if not report_only:
        # ---------- 1. 采集 ----------
        log("collecting from sources…")
        enabled = {k: v.get("enabled", True) for k, v in C.SOURCES.items()}
        raw_docs, health = connectors.run_all(enabled)
        log(f"fetched {len(raw_docs)} raw documents from {len(health)} adapters: "
            + ", ".join(f"{k}={v['count']}" for k, v in health.items()))

        # ---------- 2. 时间过滤 ----------
        cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_DOC_AGE_DAYS)
        fresh = []
        for d in raw_docs:
            dt = _pt(d.get("published_at"))
            if dt is None or dt >= cutoff:
                fresh.append(d)
        log(f"after age filter: {len(fresh)} (dropped {len(raw_docs) - len(fresh)})")

        # ---------- 3. 分类 / 实体 / 评分（先 enrich 再 dedup，实体用于语义去重） ----------
        source_tiers = {k: v.get("tier", 4) for k, v in C.SOURCES.items()}
        # RSS 各 feed 的 tier 继承组
        for group, feeds in C.RSS_FEEDS.items():
            for f in feeds:
                source_tiers[f["id"]] = C.SOURCES.get(group, {}).get("tier", 3)
        pipeline.enrich(fresh, source_tiers)

        # ---------- 4. 三层去重 ----------
        kept, dedup_stats = pipeline.dedup(fresh, known_docs)
        log(f"dedup: {dedup_stats}")
        new_docs = kept

        # ---------- 5. 事件聚类（与最近事件匹配） ----------
        existing_events: list[dict] = []
        for d in recent_days[:CLUSTER_WINDOW_DAYS]:
            existing_events.extend(d.get("events", []))
        all_events, cluster_stats = pipeline.cluster(new_docs, existing_events)
        log(f"cluster: {cluster_stats}")

        # ---------- 6. LLM 摘要（可选） ----------
        if llm_mod.available():
            n = llm_mod.summarize_docs([d for d in new_docs if d.get("tier", 4) <= 2])
            log(f"llm summaries: {n}")
        else:
            log("llm: disabled (no API key) — rule mode")

        # ---------- 7. 写回分片 ----------
        day_map = {d.get("date"): d for d in recent_days}
        for d in day_map.values():
            d["_new_docs"] = []
        for doc in new_docs:
            dt = doc.get("published_at") or doc.get("discovered_at")
            day_key = (dt or today)[:10]
            target = day_map.get(day_key)
            if target is None:
                target = today_payload
                day_key = today
            target.setdefault("documents", []).append(doc)
            target["_new_docs"].append(doc["id"])
            # 事件归属：与文档同一分片（若事件不属于这片，则跟随文档首次出现）
        for ev in all_events:
            # 找到事件原所在分片
            home = None
            for d in day_map.values():
                if any(e["event_id"] == ev["event_id"] for e in d.get("events", [])):
                    home = d
                    break
            if home is None:
                # 新事件：归入 last_seen 那天（通常是今天）
                key = (ev.get("last_seen_at") or today)[:10]
                home = day_map.get(key) or today_payload
                home.setdefault("events", []).append(ev)
            else:
                for i, e in enumerate(home["events"]):
                    if e["event_id"] == ev["event_id"]:
                        home["events"][i] = ev
                        break

        for d in day_map.values():
            docs = d.get("documents", [])
            if len(docs) > C.MAX_DOCS_PER_DAY:
                docs.sort(key=lambda x: -x.get("importance_score", 0))
                d["documents"] = docs[:C.MAX_DOCS_PER_DAY]
            d["stats"] = {
                "documents": len(d.get("documents", [])),
                "events": len(d.get("events", [])),
                "sources": len({x.get("source") for x in d.get("documents", [])}),
            }
            d.pop("_new_docs", None)
            store.save_day(d["date"], d)
        log(f"saved {len(day_map)} day shards")

    # ---------- 8. 趋势引擎 ----------
    window_days = load_all_days(trend_days)
    trends = pipeline.compute_trends(window_days)
    store.save_trends(trends)
    log(f"trends: {len(trends['topics'])} topics, {len(trends['entities'])} entities")

    # 趋势历史（用于日报对比）
    hist_path = os.path.join(store.DATA, "trends_history.json")
    hist = store._read_json(hist_path, {}) or {}
    snap = {t["topic"]: t["score"] for t in trends["topics"]}
    hist[today] = snap
    # 保留 60 天
    for k in sorted(hist.keys())[:-60]:
        hist.pop(k, None)
    store.write_json(hist_path, hist)

    # ---------- 9. 实体索引 ----------
    entities = pipeline.build_entity_index(window_days)
    store.save_entities(entities)
    log(f"entities: {len(entities['entities'])}")

    # ---------- 10. 日报 ----------
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    prev_snap = hist.get(yesterday)
    prev_trends = {"topics": [{"topic": k, "score": v} for k, v in (prev_snap or {}).items()]} if prev_snap else None
    rep_days = load_all_days(2)
    rep = report_mod.build_report(today, rep_days, trends, prev_trends)
    if llm_mod.available():
        report_mod.attach_llm(rep)
    store.save_report(today, rep)
    rindex = store.reports_index()
    entries = [r for r in rindex.get("reports", []) if r.get("date") != today]
    entries.insert(0, {"date": today, "type": "daily", "stats": rep["stats"],
                       "intro": (rep.get("intro") or "")[:160],
                       "headline": (rep["headlines"][0]["title"] if rep["headlines"] else "")})
    store.save_reports_index({"reports": entries[:400], "updated_at": rep["generated_at"]})
    log(f"report: {today} ({len(rep['headlines'])} headlines, {len(rep['claims'])} claims)")

    # ---------- 11. 索引 ----------
    dates = store.available_dates()
    all_docs_n, all_events_n = 0, 0
    for d in load_all_days(60):
        all_docs_n += len(d.get("documents", []))
        all_events_n += len(d.get("events", []))
    cat_counts: dict[str, int] = {}
    for d in load_all_days(7):
        for doc in d.get("documents", []):
            cat = doc.get("category") or "industry"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
    source_health = []
    for key, cfg in C.SOURCES.items():
        h = health.get(key, {})
        status = "ok" if h and h.get("status") == "ok" else ("error" if h else "idle")
        source_health.append({
            "id": key, "label": cfg["label"], "type": cfg["type"], "tier": cfg["tier"],
            "status": status, "count": h.get("count", 0), "error": h.get("error"),
            "latency_ms": h.get("latency_ms"),
        })
    index = {
        "updated_at": report_mod.iso(report_mod.now_utc()),
        "brand": C.BRAND,
        "latest_date": dates[0] if dates else today,
        "dates": dates[:120],
        "stats": {
            "documents_total": all_docs_n,
            "events_total": all_events_n,
            "documents_today": len(today_payload.get("documents", [])) if not report_only else
                               len((store.load_day(today) or {}).get("documents", [])),
            "sources": len([s for s in source_health if s["status"] == "ok"]),
            "category_distribution": cat_counts,
            "trend_topics": [{"topic": t["topic"], "label": t["label"], "icon": t["icon"],
                              "score": t["score"], "direction": t["direction"]}
                             for t in trends["topics"][:10]],
        },
        "sources": source_health,
        "llm_enabled": llm_mod.available(),
        "pipeline": {
            "dedup": dedup_stats,
            "new_documents": len(new_docs),
            "runtime_ms": int((time.time() - t0) * 1000),
        },
    }
    store.save_index(index)
    removed = store.prune_old()
    if removed:
        log(f"pruned {removed} old day shards")
    log(f"done in {time.time() - t0:.1f}s → {C.BRAND['site_url']}")
    return index


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="GECKO AI Frontier pipeline")
    ap.add_argument("--report-only", action="store_true", help="仅重建趋势与日报")
    ap.add_argument("--days", type=int, default=TREND_WINDOW_DAYS, help="趋势窗口天数")
    args = ap.parse_args(argv)
    try:
        run(report_only=args.report_only, trend_days=args.days)
        return 0
    except Exception as e:  # noqa: BLE001
        import traceback
        traceback.print_exc()
        print(f"PIPELINE FAILED: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
