# -*- coding: utf-8 -*-
"""GitHub connector — 热门 AI 仓库（搜索 API）"""
from __future__ import annotations

import os
from datetime import timedelta
from urllib.parse import quote

from .. import config as C
from ..core import make_document, now_utc
from ..net import fetch_json


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    token = os.environ.get("GECKO_GITHUB_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def fetch() -> list[dict]:
    since = (now_utc() - timedelta(days=3)).strftime("%Y-%m-%d")
    docs: dict[str, dict] = {}
    for q in C.GITHUB_SEARCH_QUERIES:
        query = q.replace("{since}", since)
        url = ("https://api.github.com/search/repositories?"
               f"q={quote(query, safe='')}&sort=stars&order=desc&per_page=25")
        try:
            data = fetch_json(url, headers=_headers(), timeout=30)
        except Exception as e:  # noqa: BLE001
            print(f"  [github] search failed: {e}")
            continue
        for r in (data.get("items") or []):
            full = r.get("full_name")
            if not full or full in docs:
                continue
            desc = r.get("description") or ""
            topics = r.get("topics") or []
            stars = r.get("stargazers_count", 0)
            docs[full] = make_document(
                source="github",
                source_id=full,
                source_type="api",
                content_type="repository",
                title=f"{full} — {desc[:120]}" if desc else full,
                url=r.get("html_url"),
                summary=(desc + (f" · topics: {', '.join(topics[:6])}" if topics else "")
                         + f" · ⭐ {stars:,} · {r.get('language') or 'n/a'}"),
                organization=[(r.get("owner") or {}).get("login")] if r.get("owner") else [],
                language="en",
                published_at=r.get("pushed_at") or r.get("created_at"),
                metadata={
                    "stars": stars, "forks": r.get("forks_count", 0),
                    "language": r.get("language"), "topics": topics[:8],
                    "license": ((r.get("license") or {}) or {}).get("spdx_id"),
                    "pushed_at": r.get("pushed_at"),
                },
            )
    out = list(docs.values())
    out.sort(key=lambda d: -(d["metadata"].get("stars") or 0))
    return out[:120]
