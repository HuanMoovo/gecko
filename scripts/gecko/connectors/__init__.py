# -*- coding: utf-8 -*-
"""Connectors — Source Adapter 插件注册表 + 并发采集"""
from __future__ import annotations

import concurrent.futures as cf
import time

from . import arxiv, github, huggingface, hackernews, rss

ADAPTERS = {
    "arxiv": arxiv.fetch,
    "github": github.fetch,
    "huggingface": huggingface.fetch,
    "hackernews": hackernews.fetch,
    "rss_official": lambda: rss.fetch("rss_official"),
    "rss_media": lambda: rss.fetch("rss_media"),
    "rss_community": lambda: rss.fetch("rss_community"),
}


def run_all(enabled: dict[str, bool] | None = None) -> tuple[list[dict], dict]:
    """并发运行所有启用适配器。返回 (documents, health)"""
    enabled = enabled or {}
    jobs = {k: fn for k, fn in ADAPTERS.items() if enabled.get(k, True)}
    docs: list[dict] = []
    health: dict = {}
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(fn): key for key, fn in jobs.items()}
        for fut in cf.as_completed(futures, timeout=300):
            key = futures[fut]
            started = time.time()
            try:
                result = fut.result()
                health[key] = {"status": "ok", "count": len(result), "latency_ms": int((time.time() - t0) * 1000)}
                docs.extend(result)
            except Exception as e:  # noqa: BLE001
                health[key] = {"status": "error", "count": 0, "error": str(e)[:200],
                               "latency_ms": int((time.time() - started) * 1000)}
                print(f"  [connector] {key} ERROR: {e}")
    return docs, health
