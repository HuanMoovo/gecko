/* ============================================================
   Views: Detail — 事件详情页 (#/event/<id>) / 实体页 (#/entity/<id>)
   ============================================================ */
(function () {
  const { i18n, ui, api } = window.GECKO;
  window.GECKO.views = window.GECKO.views || {};

  /* ---------------- 事件详情 ---------------- */
  async function renderEvent(el, params) {
    el.innerHTML = ui.loadingState();
    const id = params.id;
    const { events, docs } = await api.collect(14);
    const ev = (events || []).find((e) => e.event_id === id);
    if (!ev) {
      el.innerHTML = ui.emptyState(i18n.lang === "en" ? "Event not found (it may have expired)" :
        i18n.lang === "ja" ? "イベントが見つかりません（期限切れの可能性）" : "未找到该事件（可能已超出保留期）");
      return;
    }
    const evDocs = (docs || []).filter((d) => (ev.document_ids || []).includes(d.id));
    const entSet = new Set(ev.entity_ids || []);
    const related = (events || [])
      .filter((e) => e.event_id !== id && (e.entity_ids || []).some((x) => entSet.has(x)))
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 6);
    const timeline = (ev.timeline || []).slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

    el.innerHTML = `<section class="fade-in">
      <div class="kv" style="margin-bottom:12px">
        <a href="#/feed" data-nav>← ${ui.esc(i18n.t("nav.feed"))}</a>
      </div>

      <article class="glass card" style="padding:22px 24px">
        <div class="event-top" style="margin-bottom:10px">
          ${ui.badge(ui.eventTypeLabel(ev.event_type), ui.eventTypeCls(ev.event_type))}
          ${ev.category ? `<a class="badge ${ui.catCls(ev.category)}" href="#/feed?cat=${encodeURIComponent(ev.category)}" data-nav>${ui.catIcon(ev.category)} ${ui.esc(ui.catLabel(ev.category))}</a>` : ""}
          ${ev.trend_state ? ui.badge(ui.stateLabel(ev.trend_state), ui.stateCls(ev.trend_state)) : ""}
          ${ev.tier && ev.tier <= 2 ? ui.badge("Tier " + ev.tier, "tier1") : ""}
        </div>
        <h1 style="font-size:clamp(19px,2.6vw,26px);margin:0 0 10px;line-height:1.35">${ui.esc(ev.title)}</h1>
        ${ev.canonical_description ? `<p class="event-desc" style="-webkit-line-clamp:unset;display:block">${ui.esc(ev.canonical_description)}</p>` : ""}

        <div class="row" style="gap:18px;margin:14px 0">
          <span class="kv">🕒 ${ui.esc((ev.first_seen_at || "").slice(0, 10))} → ${ui.esc((ev.last_seen_at || "").slice(0, 10))}</span>
          <span class="kv">📄 ${ev.source_count || 0} ${i18n.t("common.documents")}</span>
          <span class="kv">📡 ${(ev.sources || []).length} ${i18n.t("common.sources")}</span>
          ${typeof ev.importance_score === "number" ? `<span class="kv">${i18n.t("common.importance")} ${ui.scoreBar(ev.importance_score)}</span>` : ""}
          ${typeof ev.confidence_score === "number" ? `<span class="kv">${i18n.t("common.confidence")} ${ev.confidence_score.toFixed(2)}</span>` : ""}
          ${ev.source_diversity ? `<span class="kv">${i18n.lang === "en" ? "Diversity" : i18n.lang === "ja" ? "多様性" : "来源多样性"} ${(ev.source_diversity || 0).toFixed(2)}</span>` : ""}
        </div>

        <div class="row" style="gap:10px">
          ${ev.main_url ? `<a class="btn primary" href="${ui.esc(ev.main_url)}" target="_blank" rel="noopener">${ui.esc(i18n.t("common.open"))} ↗</a>` : ""}
          <button class="btn" id="copyEvLink">🔗 ${ui.esc(i18n.t("common.share"))}</button>
        </div>
      </article>

      <div class="grid dashboard" style="margin-top:18px">
        <div class="stack" style="gap:18px">
          ${evDocs.length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">📄 ${i18n.t("common.documents")} <span class="mono dim">${evDocs.length}</span></h3>
            <div class="stack" style="gap:0">${evDocs.map((d) => ui.docRow(d)).join("")}</div>
          </section>` : ""}

          ${timeline.length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🧭 ${ui.esc(i18n.t("common.timeline"))} <span class="mono dim">${timeline.length}</span></h3>
            <ul class="timeline-list" style="border-left-color:var(--border-strong)">
              ${timeline.map((t) => `<li style="margin:8px 0">
                <span class="t-date">${ui.esc(t.date || "")}</span>
                ${t.url ? `<a href="${ui.esc(t.url)}" target="_blank" rel="noopener">${ui.esc(t.title || "")}</a>` : ui.esc(t.title || "")}
                <span class="dim">· ${ui.esc(t.source || "")}${t.tier ? " · T" + t.tier : ""}</span>
              </li>`).join("")}
            </ul>
          </section>` : ""}
        </div>

        <div class="stack" style="gap:18px">
          <section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">📡 ${i18n.t("common.sources")}</h3>
            <div class="event-sources">${(ev.sources || []).map(ui.sourceChip).join("") || "—"}</div>
          </section>
          ${(ev.entities || []).length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🔗 ${i18n.t("common.entities")}</h3>
            <div class="chip-row">${ev.entities.map((x) =>
              `<a class="badge" href="#/entity/${encodeURIComponent(x.id)}" data-nav>${ui.esc(x.name)}</a>`).join("")}</div>
          </section>` : ""}
          ${related.length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🪢 ${i18n.t("common.related")}</h3>
            <div class="stack" style="gap:8px">
              ${related.map((e) => `<div>
                <a href="#/event/${e.event_id}" data-nav style="font-size:13.5px">${ui.esc(e.title.slice(0, 110))}</a>
                <div class="kv"><span class="mono">${e.source_count} src</span><span>${ui.esc(ui.relTime(e.last_seen_at))}</span></div>
              </div>`).join("")}
            </div>
          </section>` : ""}
        </div>
      </div>
    </section>`;

    const cp = el.querySelector("#copyEvLink");
    cp && cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        window.GECKO.app.toast(i18n.t("common.copied"));
      } catch (e) { /* ignore */ }
    });
  }

  /* ---------------- 实体详情 ---------------- */
  async function renderEntity(el, params) {
    el.innerHTML = ui.loadingState();
    const id = decodeURIComponent(params.id || "");
    const ents = await api.entities();
    const ent = ((ents && ents.entities) || []).find((e) => e.id === id);
    const { events, docs } = await api.collect(14);
    const entDocs = (docs || []).filter((d) => (d.entities || []).some((x) => x.id === id))
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 40);
    const entEvents = (events || []).filter((e) => (e.entity_ids || []).includes(id))
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 8);

    if (!ent && !entDocs.length && !entEvents.length) {
      el.innerHTML = ui.emptyState(i18n.lang === "en" ? "Entity not found" :
        i18n.lang === "ja" ? "エンティティが見つかりません" : "未找到该实体");
      return;
    }
    const name = (ent && ent.name) || (entDocs[0] && (entDocs[0].entities || []).find((x) => x.id === id) || {}).name || id;
    const typeLabel = { organization: "🏢 Organization", model: "🧠 Model", concept: "💡 Concept",
      benchmark: "📊 Benchmark", product: "📦 Product", person: "👤 Person" }[ent && ent.type] || (ent && ent.type) || "";
    const docCount = (ent && ent.doc_count) || entDocs.length;

    el.innerHTML = `<section class="fade-in">
      <div class="kv" style="margin-bottom:12px"><a href="#/feed" data-nav>← ${ui.esc(i18n.t("nav.feed"))}</a></div>

      <article class="glass card" style="padding:22px 24px">
        <div class="event-top" style="margin-bottom:10px">
          ${ui.badge(typeLabel, ent && ent.type === "organization" ? "acc" : "violet")}
          ${ent && ent.region ? ui.badge(ent.region, "") : ""}
          ${ent && ent.tier && ent.tier <= 2 ? ui.badge("Tier " + ent.tier, "tier1") : ""}
        </div>
        <h1 style="font-size:clamp(20px,2.6vw,27px);margin:0 0 10px">${ui.esc(name)}</h1>
        <div class="row" style="gap:18px;margin:10px 0">
          <span class="kv">📄 ${docCount} ${i18n.t("common.documents")}</span>
          <span class="kv">📡 ${((ent && ent.sources) || []).length} ${i18n.t("common.sources")}</span>
          <span class="kv">🧩 ${entEvents.length} ${i18n.t("common.events")}</span>
        </div>
        <div class="event-sources" style="margin-top:8px">${((ent && ent.sources) || []).map(ui.sourceChip).join("")}</div>
      </article>

      <div class="grid dashboard" style="margin-top:18px">
        <div class="stack" style="gap:18px">
          ${entEvents.length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🧩 ${i18n.t("common.events")}</h3>
            <div class="grid cols-2">${entEvents.slice(0, 4).map((e) => ui.eventCard(e, { timeline: false })).join("")}</div>
          </section>` : ""}
          ${entDocs.length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">📄 ${i18n.t("common.documents")} <span class="mono dim">${entDocs.length}</span></h3>
            <div class="stack" style="gap:0">${entDocs.slice(0, 25).map((d) => ui.docRow(d, { score: false })).join("")}</div>
          </section>` : ""}
        </div>
        <div class="stack" style="gap:18px">
          ${(ent && ent.relations || []).length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🪢 ${i18n.lang === "en" ? "Relations" : i18n.lang === "ja" ? "関係" : "关系"}</h3>
            <div class="stack" style="gap:8px">
              ${ent.relations.map((r) => `<div class="row" style="gap:8px">
                <span class="badge">${ui.esc(r.rel)}</span>
                <a href="#/entity/${encodeURIComponent(r.target)}" data-nav class="kv">${ui.esc(r.target_name)}</a>
                <span class="mono kv dim">×${r.weight}</span>
              </div>`).join("")}
            </div>
          </section>` : ""}
          ${(ent && ent.recent_titles || []).length ? `<section class="glass card">
            <h3 style="font-size:15px;margin:0 0 10px">🕒 ${i18n.t("sec.latest")}</h3>
            <div class="stack" style="gap:7px">
              ${ent.recent_titles.map((t) => `<div>
                <a href="${ui.esc(t.url || "#")}" target="_blank" rel="noopener" class="kv" style="display:block">${ui.esc(t.title)}</a>
                <span class="mono kv dim">${ui.esc(t.date || "")}</span></div>`).join("")}
            </div>
          </section>` : ""}
        </div>
      </div>
    </section>`;
  }

  window.GECKO.views.detail = {
    render(el, params, route, alive) {
      return (route && route.name === "entity") ? renderEntity(el, params) : renderEvent(el, params);
    },
  };
})();
