/* ============================================================
   View: Feed — 信息流（日期 / 分类 / 排序 / 事件·文档切换 / 分页）
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  const PAGE = 36;
  const state = { date: null, cat: "all", sort: "importance", view: "events", q: "", page: 1 };

  function syncParams(params) {
    if (params.date !== undefined) state.date = params.date || null;
    if (params.cat) state.cat = params.cat;
    if (params.view) state.view = params.view;
    if (params.q !== undefined) state.q = params.q || "";
    if (params.sort) state.sort = params.sort;
    state.page = 1;
  }

  function dateStrip(idx) {
    const dates = (idx && idx.dates) || [];
    if (!dates.length) return "";
    const cur = state.date || (idx.latest_date || dates[0]);
    return `<div class="date-strip">${dates.slice(0, 30).map((d) =>
      `<button class="date-chip ${d === cur ? "active" : ""}" data-date="${d}">${d}</button>`).join("")}</div>`;
  }

  function catTabs(idx) {
    const dist = (idx && idx.stats && idx.stats.category_distribution) || {};
    const cats = Object.keys(ui.CATS).filter((c) => dist[c]);
    const tabs = [`<button class="tab ${state.cat === "all" ? "active" : ""}" data-cat="all">${i18n.t("feed.all")}</button>`]
      .concat(cats.map((c) => `<button class="tab ${state.cat === c ? "active" : ""}" data-cat="${c}">
        ${ui.catIcon(c)} ${ui.catLabel(c)} <span class="mono dim">${dist[c]}</span></button>`));
    return tabs.join("");
  }

  function filterEvents(events) {
    let out = events.slice();
    if (state.cat !== "all") out = out.filter((e) => e.category === state.cat ||
      (e.entity_ids || []).some((id) => id.includes(state.cat)));
    if (state.q) {
      const q = state.q.toLowerCase();
      out = out.filter((e) => (e.title || "").toLowerCase().includes(q) ||
        (e.canonical_description || "").toLowerCase().includes(q));
    }
    if (state.sort === "time") out.sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)));
    else if (state.sort === "sources") out.sort((a, b) => (b.source_count || 0) - (a.source_count || 0));
    else out.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
    return out;
  }

  function filterDocs(docs) {
    let out = docs.slice();
    if (state.cat !== "all") out = out.filter((d) => d.category === state.cat || (d.categories || []).includes(state.cat));
    if (state.q) {
      const q = state.q.toLowerCase();
      out = out.filter((d) => (d.title || "").toLowerCase().includes(q) ||
        (d.summary || "").toLowerCase().includes(q));
    }
    if (state.sort === "time") out.sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
    else out.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
    return out;
  }

  async function render(el, params, route, alive) {
    syncParams(params || {});
    el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
    const idx = await api.index();
    if (alive && !alive()) return;
    const date = state.date || (idx && idx.latest_date) || window.GECKO.todayStr();
    const day = await api.day(date);
    if (alive && !alive()) return;

    const events = filterEvents((day && day.events) || []);
    const docs = filterDocs((day && day.documents) || []);
    const total = state.view === "docs" ? docs.length : events.length;
    const pages = Math.max(1, Math.ceil(total / PAGE));
    if (state.page > pages) state.page = pages;
    const sliceEvents = events.slice((state.page - 1) * PAGE, state.page * PAGE);
    const sliceDocs = docs.slice((state.page - 1) * PAGE, state.page * PAGE);

    el.innerHTML = `
      <section class="fade-in">
        ${ui.sectionHead(i18n.t("feed.title"), `${total} ${state.view === "docs" ? i18n.t("common.documents") : i18n.t("common.events")} · ${date}`)}
        ${dateStrip(idx)}
        <div class="filter-bar">
          <div class="filter-tabs">
            ${catTabs(idx)}
          </div>
          <div class="row" style="gap:8px">
            <select class="input" id="feedView">
              <option value="events" ${state.view === "events" ? "selected" : ""}>${i18n.t("feed.view.events")}</option>
              <option value="docs" ${state.view === "docs" ? "selected" : ""}>${i18n.t("feed.view.docs")}</option>
            </select>
            <select class="input" id="feedSort">
              <option value="importance" ${state.sort === "importance" ? "selected" : ""}>${i18n.t("feed.sort.importance")}</option>
              <option value="time" ${state.sort === "time" ? "selected" : ""}>${i18n.t("feed.sort.time")}</option>
              <option value="sources" ${state.sort === "sources" ? "selected" : ""}>${i18n.t("feed.sort.sources")}</option>
            </select>
            <input class="input" id="feedQ" type="search" value="${ui.esc(state.q)}"
                   placeholder="${ui.esc(i18n.t("feed.search.ph"))}" style="min-width:180px">
          </div>
        </div>
        <div id="feedList">
          ${state.view === "docs"
            ? (sliceDocs.map((d) => ui.docRow(d)).join("") || ui.emptyState(i18n.t("feed.empty")))
            : `<div class="grid cols-2">${sliceEvents.map((e) => ui.eventCard(e)).join("") || ui.emptyState(i18n.t("feed.empty"))}</div>`}
        </div>
        ${pages > 1 ? `<div class="pager">
          <button class="btn" data-page="prev" ${state.page <= 1 ? "disabled" : ""}>‹</button>
          <span class="kv mono">${state.page} / ${pages}</span>
          <button class="btn" data-page="next" ${state.page >= pages ? "disabled" : ""}>›</button>
        </div>` : ""}
      </section>`;

    // 事件绑定
    el.querySelectorAll(".date-chip").forEach((b) => b.addEventListener("click", () => {
      state.date = b.dataset.date; state.page = 1; rerender(el, idx);
    }));
    el.querySelectorAll(".filter-tabs .tab").forEach((b) => b.addEventListener("click", () => {
      state.cat = b.dataset.cat; state.page = 1; rerender(el, idx);
    }));
    const v = el.querySelector("#feedView"); v && v.addEventListener("change", () => { state.view = v.value; state.page = 1; rerender(el, idx); });
    const s = el.querySelector("#feedSort"); s && s.addEventListener("change", () => { state.sort = s.value; state.page = 1; rerender(el, idx); });
    const q = el.querySelector("#feedQ");
    if (q) {
      let t = null;
      q.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => { state.q = q.value.trim(); state.page = 1; rerender(el, idx, q.value); }, 220);
      });
    }
    el.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () => {
      state.page += b.dataset.page === "next" ? 1 : -1;
      rerender(el, idx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  async function rerender(el, idx, keepFocus) {
    const fakeParams = {}; // 保留当前 state，仅重绘
    await render(el, fakeParams, null, () => true);
    if (keepFocus) {
      const q = el.querySelector("#feedQ");
      if (q) { q.value = state.q; q.focus(); }
    }
  }

  window.GECKO.views.feed = { render };
})();
