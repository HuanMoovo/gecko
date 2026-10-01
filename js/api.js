/* ============================================================
   GECKO API — 静态数据层（fetch + 内存缓存 + 并发去重）
   数据由 GitHub Actions 中的 Python 管线生成
   ============================================================ */
window.GECKO = window.GECKO || {};

(function () {
  const BASE = "data/";
  const cache = new Map();       // path -> promise
  const memory = new Map();      // path -> data

  async function get(path) {
    if (memory.has(path)) return memory.get(path);
    if (cache.has(path)) return cache.get(path);
    const p = fetch(BASE + path, { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        memory.set(path, data);
        return data;
      })
      .catch((err) => {
        console.warn("[gecko:api]", err.message);
        return null;
      })
      .finally(() => cache.delete(path));
    cache.set(path, p);
    return p;
  }

  const api = {
    base: BASE,
    index: () => get("index.json"),
    day: (date) => get(`days/${date}.json`),
    trends: () => get("trends.json"),
    entities: () => get("entities.json"),
    reports: () => get("reports/index.json"),
    report: (date) => get(`reports/${date}.json`),

    async latestDay() {
      const idx = await this.index();
      const date = (idx && idx.latest_date) || todayStr();
      let day = await this.day(date);
      if (!day && idx && idx.dates && idx.dates.length) day = await this.day(idx.dates[0]);
      return day;
    },

    /** 最近 N 天分片（并发加载） */
    async recentDays(n = 7) {
      const idx = await this.index();
      const dates = ((idx && idx.dates) || []).slice(0, n);
      if (!dates.length) {
        const d = await this.latestDay();
        return d ? [d] : [];
      }
      const days = await Promise.all(dates.map((d) => this.day(d)));
      return days.filter(Boolean);
    },

    /** 跨天收集文档 / 事件 */
    async collect(days = 7) {
      const shards = await this.recentDays(days);
      const docs = [];
      const events = [];
      shards.forEach((s) => {
        (s.documents || []).forEach((d) => docs.push(d));
        (s.events || []).forEach((e) => events.push(e));
      });
      return { docs, events, shards };
    },

    /** 聚合搜索索引（懒构建，缓存） */
    async searchIndex(days = 14) {
      if (memory.has("__search")) return memory.get("__search");
      const { docs, events } = await this.collect(days);
      const idx = { docs, events };
      memory.set("__search", idx);
      return idx;
    },
  };

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  window.GECKO.api = api;
  window.GECKO.todayStr = todayStr;
})();
