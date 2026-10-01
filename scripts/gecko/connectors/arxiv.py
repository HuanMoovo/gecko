# -*- coding: utf-8 -*-
"""arXiv connector — Atom API"""
from __future__ import annotations

import xml.etree.ElementTree as ET

from .. import config as C
from ..core import make_document, detect_language
from ..net import fetch_url

NS = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}


def fetch(limit_per_cat: int | None = None) -> list[dict]:
    limit = limit_per_cat or C.ARXIV_MAX_PER_CAT
    docs: list[dict] = []
    seen = set()
    for cat in C.ARXIV_CATEGORIES:
        url = (
            "https://export.arxiv.org/api/query?"
            f"search_query=cat:{cat}&sortBy=submittedDate&sortOrder=descending&max_results={limit}"
        )
        try:
            xml = fetch_url(url, timeout=30).decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            print(f"  [arxiv] {cat} failed: {e}")
            continue
        try:
            root = ET.fromstring(xml)
        except ET.ParseError:
            continue
        for entry in root.findall("a:entry", NS):
            eid = (entry.findtext("a:id", "", NS) or "").strip()
            if not eid or eid in seen:
                continue
            seen.add(eid)
            title = " ".join((entry.findtext("a:title", "", NS) or "").split())
            summary = " ".join((entry.findtext("a:summary", "", NS) or "").split())
            published = entry.findtext("a:published", "", NS)
            authors = [a.findtext("a:name", "", NS) for a in entry.findall("a:author", NS)]
            primary = entry.find("arxiv:primary_category", NS)
            cats = [c.attrib.get("term", "") for c in entry.findall("a:category", NS)]
            abs_url = eid.replace("http://", "https://")
            pdf_url = ""
            for link in entry.findall("a:link", NS):
                if link.attrib.get("title") == "pdf":
                    pdf_url = link.attrib.get("href", "")
            docs.append(make_document(
                source="arxiv",
                source_id=eid.rsplit("/", 1)[-1],
                source_type="api",
                content_type="paper",
                title=title,
                url=abs_url,
                summary=summary,
                author=authors[:8],
                language=detect_language(title),
                published_at=published,
                metadata={
                    "categories": cats[:4],
                    "primary_category": primary.attrib.get("term") if primary is not None else None,
                    "pdf": pdf_url,
                    "arxiv_id": eid.rsplit("/", 1)[-1],
                },
            ))
    return docs
