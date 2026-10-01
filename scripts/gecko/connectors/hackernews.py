# -*- coding: utf-8 -*-
"""Hacker News connector — Firebase API + AI 相关性过滤"""
from __future__ import annotations

import os
import concurrent.futures as cf

from ..core import make_document
from ..net import fetch_json

HN = "https://hacker-news.firebaseio.com/v0"

AI_TERMS = ("ai", "llm", "gpt", "claude", "gemini", "llama", "model", "agent", "neural", "machine learning",
            "deep learning", "transformer", "diffusion", "chatgpt", "openai", "anthropic", "deepseek",
            "hugging face", "inference", "training", "gpu", "nvidia", "cuda", "robot", "multimodal",
            "vision language", "embedding", "rag", "fine-tun", "open source model", "quantiz")


def _relevant(title: str) -> bool:
    t = (title or "").lower()
    return any(term in t for term in AI_TERMS)


def _item(iid: int) -> dict | None:
    try:
        it = fetch_json(f"{HN}/item/{iid}.json", timeout=15, retries=1)
    except Exception:
        return None
    if not it or it.get("type") != "story" or it.get("dead") or it.get("deleted"):
        return None
    return it


def fetch(max_items: int = 120) -> list[dict]:
    try:
        ids = fetch_json(f"{HN}/topstories.json", timeout=20)
    except Exception as e:  # noqa: BLE001
        print(f"  [hn] topstories failed: {e}")
        return []
    docs = []
    with cf.ThreadPoolExecutor(max_workers=12) as ex:
        for it in ex.map(_item, ids[:max_items]):
            if not it:
                continue
            title = it.get("title", "")
            if not _relevant(title):
                continue
            url = it.get("url") or f"https://news.ycombinator.com/item?id={it['id']}"
            docs.append(make_document(
                source="hackernews",
                source_id=str(it["id"]),
                source_type="api",
                content_type="news",
                title=title,
                url=url,
                summary=(it.get("text") or "")[:600],
                language="en",
                published_at=it.get("time"),
                metadata={"points": it.get("score", 0), "comments": it.get("descendants", 0),
                          "hn_url": f"https://news.ycombinator.com/item?id={it['id']}"},
            ))
    docs.sort(key=lambda d: -(d["metadata"].get("points") or 0))
    return docs
