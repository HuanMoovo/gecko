# -*- coding: utf-8 -*-
"""离线冒烟测试 — 用模拟数据跑通 pipeline（不联网）"""
import os
import sys
import shutil
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.pop("GECKO_LLM_API_KEY", None)

from scripts.gecko import store  # noqa: E402

TMP = tempfile.mkdtemp(prefix="gecko_test_")
store.DATA = os.path.join(TMP, "data")
store.DAYS = os.path.join(store.DATA, "days")
store.REPORTS = os.path.join(store.DATA, "reports")
store.ensure_dirs()

from scripts.gecko import pipeline, report as report_mod, config as C  # noqa: E402
from scripts.gecko.core import make_document, now_utc, iso  # noqa: E402

now = iso(now_utc())

MOCK = [
    # 同一事件的 3 篇报道（应聚为 1 事件）
    dict(source="openai_blog", source_id="a1", source_type="rss", content_type="news",
         title="OpenAI releases GPT-5.5 with 3x better reasoning",
         url="https://openai.com/blog/gpt-5-5", summary="OpenAI announced GPT-5.5 today. The model improves math and code reasoning significantly.",
         organization=["openai"], language="en", published_at=now),
    dict(source="techcrunch_ai", source_id="a2", source_type="rss", content_type="news",
         title="GPT-5.5 launch: OpenAI says reasoning improved 3x — GPT-5.5 released",
         url="https://techcrunch.com/gpt55", summary="OpenAI released GPT-5.5. Reasoning benchmarks improved.", language="en", published_at=now),
    dict(source="hackernews", source_id="a3", source_type="api", content_type="news",
         title="GPT-5.5 released by OpenAI (openai.com)",
         url="https://news.ycombinator.com/item?id=1", summary="", language="en", published_at=now),
    # 论文
    dict(source="arxiv", source_id="2401.00001", source_type="api", content_type="paper",
         title="Agentic Planning with Multi-Agent Tool Use",
         url="https://arxiv.org/abs/2401.00001",
         summary="We present a multi-agent framework for planning with tool use. Benchmarks on GAIA show improvements.",
         author=["A. Author"], language="en", published_at=now),
    # 模型
    dict(source="huggingface", source_id="deepseek-ai/DeepSeek-V4", source_type="api", content_type="model",
         title="deepseek-ai/DeepSeek-V4", url="https://huggingface.co/deepseek-ai/DeepSeek-V4",
         summary="Hugging Face 模型 · text-generation · 下载 120,000 · 收藏 3,400", language="en",
         published_at=now, metadata={"downloads": 120000, "likes": 3400, "pipeline_tag": "text-generation"}),
    # 开源仓库
    dict(source="github", source_id="gecko/agent-runtime", source_type="api", content_type="repository",
         title="gecko/agent-runtime — minimal agent runtime with MCP support",
         url="https://github.com/gecko/agent-runtime",
         summary="minimal agent runtime with MCP support · topics: agent, llm · ⭐ 12,345 · Python",
         language="en", published_at=now, metadata={"stars": 12345, "forks": 800, "language": "Python"}),
    # 中文新闻
    dict(source="qbitai", source_id="q1", source_type="rss", content_type="news",
         title="机器人具身智能新突破：人形机器人实现自主导航",
         url="https://www.qbitai.com/2026/10/robotics.html",
         summary="人形机器人在真实环境中完成自主导航与操作任务，VLA 模型成为关键。",
         language="zh", published_at=now),
    # 重复项（同 URL 不同参数，应被去重）
    dict(source="techcrunch_ai", source_id="a2dup", source_type="rss", content_type="news",
         title="GPT-5.5 launch: OpenAI says reasoning improved 3x — GPT-5.5 released",
         url="https://techcrunch.com/gpt55?utm_source=rss&utm_medium=feed",
         summary="dup", language="en", published_at=now),
]

print("=" * 60)
print("1) enrich")
tiers = {"openai_blog": 1, "techcrunch_ai": 3, "hackernews": 4, "arxiv": 2, "huggingface": 2,
         "github": 2, "qbitai": 3, "rss_official": 1, "rss_media": 3}
docs = [make_document(**{k: v for k, v in m.items() if k != "metadata"} | {"metadata": m.get("metadata", {})}) for m in MOCK]
pipeline.enrich(docs, tiers)
for d in docs:
    print(f"  {d['source']:14s} | {d['category']:18s} | ents={[e['name'] for e in d['entities']][:3]} | imp={d['importance_score']}")

print("=" * 60)
print("2) dedup")
kept, stats = pipeline.dedup(docs, [])
print(f"  stats={stats}  kept={len(kept)}/8")
assert len(kept) == 7, "should dedup the utm variant"

print("=" * 60)
print("3) cluster")
events, cstats = pipeline.cluster(kept, [])
print(f"  {cstats}")
for e in events:
    print(f"  [{e['event_type']}] {e['title'][:60]} | docs={e['source_count']} sources={e['sources']} state={e['trend_state']}")
gpt_events = [e for e in events if "gpt-5.5" in e["title"].lower() or "GPT-5.5" in e["title"]]
assert len(gpt_events) == 1, f"GPT-5.5 reports should merge into one event, got {len(gpt_events)}"
assert gpt_events[0]["source_count"] >= 2, "merged event should have multiple docs"

print("=" * 60)
print("4) save day + trends + report")
day = {"date": now[:10], "documents": kept, "events": events,
       "stats": {"documents": len(kept), "events": len(events)}}
store.save_day(day["date"], day)
trends = pipeline.compute_trends([day])
print(f"  topics: {[(t['topic'], t['score'], t['direction']) for t in trends['topics'][:5]]}")
print(f"  entities: {[(e['name'], e['score']) for e in trends['entities'][:5]]}")
store.save_trends(trends)

rep = report_mod.build_report(now[:10], [day], trends)
print(f"  headlines: {len(rep['headlines'])}, claims: {len(rep['claims'])}, sections: {len(rep['sections'])}")
print(f"  intro: {rep['intro'][:100]}")
if rep["headlines"]:
    h = rep["headlines"][0]
    print(f"  top headline: {h['title'][:70]} | evidence={len(h['evidence'])}")
ents = pipeline.build_entity_index([day])
print(f"  entity index: {len(ents['entities'])}")
rel = [e for e in ents["entities"] if e["relations"]][:2]
for e in rel:
    print(f"  {e['name']} → {[(r['rel'], r['target_name']) for r in e['relations'][:3]]}")

print("=" * 60)
print("ALL PIPELINE TESTS PASSED ✅")
shutil.rmtree(TMP, ignore_errors=True)
