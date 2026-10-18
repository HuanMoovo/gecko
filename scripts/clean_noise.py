# -*- coding: utf-8 -*-
"""清理历史数据中的非 AI 社区噪音（一次性维护脚本）

对 data/days/*.json 中来自 RELEVANCE_FILTER_SOURCES 且不通过相关性判定的文档：
1. 从 documents 移除
2. 从 events.document_ids 中摘除；若事件因此没有文档则删除该事件
3. 同步修正 source_count / sources / timeline
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.gecko import config as C  # noqa: E402
from scripts.gecko.core import is_ai_relevant  # noqa: E402

DAYS = os.path.join("data", "days")


def main() -> None:
    total_docs = total_events = 0
    for fn in sorted(os.listdir(DAYS)):
        if not fn.endswith(".json"):
            continue
        path = os.path.join(DAYS, fn)
        with open(path, encoding="utf-8") as f:
            day = json.load(f)

        docs = day.get("documents", [])
        bad = set()
        for d in docs:
            if d.get("source") not in C.RELEVANCE_FILTER_SOURCES:
                continue
            text = (d.get("title") or "") + " " + (d.get("summary") or "")
            if not is_ai_relevant(text):
                bad.add(d["id"])
        if not bad:
            continue

        bad_urls = {d.get("url") for d in docs if d["id"] in bad and d.get("url")}
        kept_docs = [d for d in docs if d["id"] not in bad]
        doc_by_id = {d["id"]: d for d in kept_docs}

        kept_events = []
        dropped_events = 0
        for e in day.get("events", []):
            ids = e.get("document_ids") or []
            if ids:
                remain = [i for i in ids if i not in bad]
                if not remain:
                    dropped_events += 1
                    continue
                e["document_ids"] = remain
                e["source_count"] = len(remain)
                e["sources"] = sorted({doc_by_id[i].get("source") for i in remain if i in doc_by_id})
                e["source_diversity"] = len(e["sources"])
                e["timeline"] = [t for t in (e.get("timeline") or []) if t.get("url") not in bad_urls]
            kept_events.append(e)

        day["documents"] = kept_docs
        day["events"] = kept_events
        with open(path, "w", encoding="utf-8") as f:
            json.dump(day, f, ensure_ascii=False, separators=(",", ":"))

        total_docs += len(bad)
        total_events += dropped_events
        print(f"{fn}: -{len(bad)} docs, -{dropped_events} events "
              f"(remaining {len(kept_docs)} docs / {len(kept_events)} events)")

    print(f"\nTOTAL: removed {total_docs} off-topic docs, {total_events} orphan events")


if __name__ == "__main__":
    main()
