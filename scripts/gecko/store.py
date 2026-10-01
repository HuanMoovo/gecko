# -*- coding: utf-8 -*-
"""数据存储层 — 日期分片 / 事件索引 / 静态 JSON API"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta, timezone

from . import config as C

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data")
DAYS = os.path.join(DATA, "days")
REPORTS = os.path.join(DATA, "reports")


def ensure_dirs() -> None:
    for d in (DATA, DAYS, REPORTS):
        os.makedirs(d, exist_ok=True)


def _read_json(path: str, default=None):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def write_json(path: str, obj) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)


def write_json_pretty(path: str, obj) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


# ---------- 日期分片 ----------
def day_path(date: str) -> str:
    return os.path.join(DAYS, f"{date}.json")


def load_day(date: str) -> dict | None:
    return _read_json(day_path(date))


def save_day(date: str, payload: dict) -> None:
    write_json(day_path(date), payload)


def available_dates() -> list[str]:
    if not os.path.isdir(DAYS):
        return []
    out = []
    for fn in os.listdir(DAYS):
        m = re.fullmatch(r"(\d{4}-\d{2}-\d{2})\.json", fn)
        if m:
            out.append(m.group(1))
    return sorted(out, reverse=True)


def load_recent_days(n: int = 14) -> list[dict]:
    dates = available_dates()[:n]
    return [d for d in (load_day(x) for x in dates) if d]


# ---------- 趋势 / 实体 / 报告 ----------
def save_trends(obj: dict) -> None:
    write_json(os.path.join(DATA, "trends.json"), obj)


def save_entities(obj: dict) -> None:
    write_json(os.path.join(DATA, "entities.json"), obj)


def load_entities() -> dict:
    return _read_json(os.path.join(DATA, "entities.json"), {}) or {}


def reports_index() -> dict:
    return _read_json(os.path.join(REPORTS, "index.json"), {"reports": []}) or {"reports": []}


def save_reports_index(obj: dict) -> None:
    write_json(os.path.join(REPORTS, "index.json"), obj)


def save_report(date: str, obj: dict) -> None:
    write_json(os.path.join(REPORTS, f"{date}.json"), obj)


def load_report(date: str) -> dict | None:
    return _read_json(os.path.join(REPORTS, f"{date}.json"))


def save_index(obj: dict) -> None:
    write_json(os.path.join(DATA, "index.json"), obj)


def prune_old(days_keep: int = C.RETENTION_DAYS) -> int:
    """清理超期日期分片，返回删除数量"""
    dates = available_dates()
    removed = 0
    for d in dates[days_keep:]:
        try:
            os.remove(day_path(d))
            removed += 1
        except OSError:
            pass
    return removed


def utc_today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def date_days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%d")
