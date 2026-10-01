# -*- coding: utf-8 -*-
"""RSS / Atom connector — 通用订阅源解析（官方博客 / 媒体 / 社区）"""
from __future__ import annotations

import concurrent.futures as cf
import re
import xml.etree.ElementTree as ET
from html import unescape

from .. import config as C
from ..core import make_document, detect_language, parse_time, canonical_url
from ..net import fetch_url

NS = {"atom": "http://www.w3.org/2005/Atom", "content": "http://purl.org/rss/1.0/modules/content/",
      "dc": "http://purl.org/dc/elements/1.1/", "media": "http://search.yahoo.com/mrss/"}
_TAG_RE = re.compile(r"<[^>]+>")


def _clean(html: str) -> str:
    if not html:
        return ""
    txt = _TAG_RE.sub(" ", html)
    txt = unescape(txt)
    return " ".join(txt.split())[:1200]


def _parse_feed(xml_text: str) -> list[dict]:
    """返回 [{title, summary, url, published, author}]"""
    items = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return items

    # RSS 2.0
    for item in root.iter("item"):
        title = item.findtext("title", "") or ""
        link = item.findtext("link", "") or ""
        if not link:
            guid = item.findtext("guid", "") or ""
            if guid.startswith("http"):
                link = guid
        desc = item.findtext("description", "") or item.findtext("content:encoded", "", NS) or ""
        pub = item.findtext("pubDate", "") or item.findtext("dc:date", "", NS) or ""
        author = item.findtext("dc:creator", "", NS) or item.findtext("author", "") or ""
        cats = [c.text for c in item.findall("category") if c.text]
        items.append({"title": _clean(title), "url": link.strip(), "summary": _clean(desc),
                      "published": pub.strip(), "author": _clean(author), "cats": cats[:5]})
    if items:
        return items

    # Atom
    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
        title = entry.findtext("atom:title", "", NS) or ""
        link = ""
        for l in entry.findall("atom:link", NS):
            if l.attrib.get("rel") in ("alternate", None) and l.attrib.get("href"):
                link = l.attrib["href"]
                break
        summ = entry.findtext("atom:summary", "", NS) or entry.findtext("atom:content", "", NS) or ""
        pub = entry.findtext("atom:published", "", NS) or entry.findtext("atom:updated", "", NS) or ""
        author = ""
        a = entry.find("atom:author/atom:name", NS)
        if a is not None and a.text:
            author = a.text
        items.append({"title": _clean(title), "url": link.strip(), "summary": _clean(summ),
                      "published": pub.strip(), "author": _clean(author), "cats": []})
    return items


def _fetch_one(feed: dict, source_key: str) -> list[dict]:
    fid = feed["id"]
    try:
        xml = fetch_url(feed["url"], timeout=25, retries=1).decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        print(f"  [rss] {fid} failed: {e}")
        return []
    docs = []
    for it in _parse_feed(xml)[:40]:
        if not it["title"] or not it["url"]:
            continue
        org = [feed["org"]] if feed.get("org") else []
        docs.append(make_document(
            source=fid,
            source_id=canonical_url(it["url"]),
            source_type="rss",
            content_type="blog",
            title=it["title"],
            url=it["url"],
            summary=it["summary"],
            author=[it["author"]] if it["author"] else [],
            organization=org,
            language=detect_language(it["title"] + " " + it["summary"]),
            published_at=it["published"],
            metadata={"feed": fid, "feed_group": source_key, "cats": it.get("cats", [])},
        ))
    return docs


def fetch(source_key: str) -> list[dict]:
    feeds = C.RSS_FEEDS.get(source_key, [])
    docs: list[dict] = []
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(_fetch_one, f, source_key) for f in feeds]
        for fut in cf.as_completed(futures):
            try:
                docs.extend(fut.result())
            except Exception as e:  # noqa: BLE001
                print(f"  [rss] worker error: {e}")
    return docs
