# -*- coding: utf-8 -*-
"""Hugging Face connector — 模型 / 数据集 趋势"""
from __future__ import annotations

from ..core import make_document
from ..net import fetch_json

BASE = "https://huggingface.co/api"


def _models(limit: int = 60) -> list[dict]:
    url = (f"{BASE}/models?sort=trendingScore&direction=-1&limit={limit}"
           "&full=false&config=false&cardData=false")
    try:
        data = fetch_json(url, timeout=30)
    except Exception as e:  # noqa: BLE001
        print(f"  [hf] models failed: {e}")
        return []
    docs = []
    for m in data if isinstance(data, list) else []:
        mid = m.get("modelId") or m.get("id") or ""
        if not mid:
            continue
        tags = m.get("tags") or []
        pipeline = m.get("pipeline_tag")
        downloads = m.get("downloads") or 0
        likes = m.get("likes") or 0
        docs.append(make_document(
            source="huggingface",
            source_id=mid,
            source_type="api",
            content_type="model",
            title=f"{mid}",
            url=f"https://huggingface.co/{mid}",
            summary=(f"Hugging Face 模型 · {pipeline or 'model'} · "
                     f"下载 {downloads:,} · 收藏 {likes:,}"),
            organization=[(m.get("author") or mid.split("/")[0])] if m.get("author") or "/" in mid else [],
            language="en",
            published_at=m.get("lastModified") or m.get("createdAt"),
            metadata={"pipeline_tag": pipeline, "downloads": downloads, "likes": likes,
                      "tags": tags[:8], "kind": "model"},
        ))
    return docs


def _datasets(limit: int = 25) -> list[dict]:
    url = (f"{BASE}/datasets?sort=trendingScore&direction=-1&limit={limit}"
           "&full=false&config=false&cardData=false")
    try:
        data = fetch_json(url, timeout=30)
    except Exception as e:  # noqa: BLE001
        print(f"  [hf] datasets failed: {e}")
        return []
    docs = []
    for d in data if isinstance(data, list) else []:
        did = d.get("id") or ""
        if not did:
            continue
        docs.append(make_document(
            source="huggingface",
            source_id="ds_" + did,
            source_type="api",
            content_type="dataset",
            title=f"[Dataset] {did}",
            url=f"https://huggingface.co/datasets/{did}",
            summary=f"Hugging Face 数据集 · 下载 {d.get('downloads', 0):,} · 收藏 {d.get('likes', 0):,}",
            language="en",
            published_at=d.get("lastModified") or d.get("createdAt"),
            metadata={"downloads": d.get("downloads", 0), "likes": d.get("likes", 0), "kind": "dataset"},
        ))
    return docs


def fetch() -> list[dict]:
    return _models() + _datasets()
