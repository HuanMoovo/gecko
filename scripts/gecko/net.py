# -*- coding: utf-8 -*-
"""HTTP 工具 — 重试 / 超时 / 代理 / UA"""
from __future__ import annotations

import gzip
import io
import json
import os
import socket
import time
import urllib.error
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36 GECKO-Frontier/1.0")

DEFAULT_TIMEOUT = 25
_PROXY_CANDIDATES = [7897, 7892, 10809, 1080, 8889, 7890]   # 本机常见代理端口
_detected_proxy: str | None | bool = False                   # False = 尚未探测


def env_proxy() -> str | None:
    return (os.environ.get("GECKO_PROXY") or os.environ.get("HTTPS_PROXY")
            or os.environ.get("https_proxy") or None)


def detect_local_proxy() -> str | None:
    """探测本机常见代理端口（仅在直连失败后调用一次）"""
    global _detected_proxy
    if _detected_proxy is not False:
        return _detected_proxy  # type: ignore[return-value]
    for port in _PROXY_CANDIDATES:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            ok = s.connect_ex(("127.0.0.1", port)) == 0
            s.close()
            if ok:
                _detected_proxy = f"http://127.0.0.1:{port}"
                return _detected_proxy
        except OSError:
            continue
    _detected_proxy = None
    return None


def _opener(proxy: str | None = None):
    handler = urllib.request.ProxyHandler({"http": proxy, "https": proxy} if proxy else {})
    return urllib.request.build_opener(handler)


def _once(url: str, headers: dict, timeout: int, proxy: str | None) -> bytes:
    req = urllib.request.Request(url, headers=headers)
    with _opener(proxy).open(req, timeout=timeout) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
        return raw


def fetch_url(url: str, *, headers: dict | None = None, timeout: int = DEFAULT_TIMEOUT,
              retries: int = 2, backoff: float = 1.5) -> bytes:
    h = {"User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,ja;q=0.7",
         "Accept-Encoding": "gzip"}
    if headers:
        h.update(headers)

    proxy = env_proxy()
    tried_proxy_fallback = bool(proxy)
    last_err = None

    for attempt in range(retries + 1):
        try:
            return _once(url, h, timeout, proxy)
        except Exception as e:  # noqa: BLE001
            last_err = e
            if attempt == 0 and not tried_proxy_fallback:
                # 直连失败 → 探测本机代理后重试一次
                p = detect_local_proxy()
                if p:
                    tried_proxy_fallback = True
                    try:
                        return _once(url, h, timeout, p)
                    except Exception as e2:  # noqa: BLE001
                        last_err = e2
            if attempt < retries:
                time.sleep(backoff * (attempt + 1))
    raise RuntimeError(f"fetch failed: {url} :: {last_err}")


def fetch_json(url: str, **kw):
    return json.loads(fetch_url(url, **kw).decode("utf-8", "replace"))


def fetch_text(url: str, **kw) -> str:
    return fetch_url(url, **kw).decode("utf-8", "replace")
