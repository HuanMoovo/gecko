/* GECKO · 单条资料页（对标 AIHOT /items/:id）
   #/item/<id> —— 单篇内容的完整信息：导读、正文、元数据、所属事件、同源近期
*/
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};
  window.GECKO.views = window.GECKO.views || {};

  const T = (zh, en, ja) => (window.GECKO.i18n.lang === "en" ? en : window.GECKO.i18n.lang === "ja" ? ja : zh);

  const item = {
    async render(el, params) {
      const { ui, api, i18n } = window.GECKO;
      const id = decodeURIComponent((params && params.id) || "");
      el.innerHTML = ui.loadingState();

      const doc = await api.docById(id);
      if (!doc) {
        el.innerHTML = `<section class="fade-in">
          ${ui.sectionHead(T("内容不存在", "Item not found", "コンテンツが見つかりません"), "")}
          <div class="empty">
            ${T("链接可能有误,或者这篇内容已超出保留期。", "The link may be wrong, or this item is past its retention window.", "リンクが誤っているか、保存期間を過ぎています。")}
            <div style="margin-top:12px"><a class="btn" href="#/feed" data-nav>${T("回到信息流", "Back to feed", "フィードへ")}</a></div>
          </div>
        </section>`;
        return;
      }

      // 所属事件（同一来源 + 标题相似度不做重算，直接找包含该文档的事件）
      let hostEvent = null;
      try {
        const { events } = await api.collect(14);
        hostEvent = (events || []).find((e) => (e.document_ids || []).includes(doc.id)) || null;
      } catch (e) { /* ignore */ }

      // 同来源近期内容
      let siblings = [];
      try {
        const idx = await api.searchIndex(14);
        siblings = (idx.docs || [])
          .filter((d) => d.source === doc.source && d.id !== doc.id)
          .sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")))
          .slice(0, 6);
      } catch (e) { /* ignore */ }

      const meta = doc.metadata || {};
      const chips = [];
      if (meta.stars) chips.push(`⭐ ${Number(meta.stars).toLocaleString()}`);
      if (meta.downloads) chips.push(`⬇ ${Number(meta.downloads).toLocaleString()}`);
      if (meta.likes) chips.push(`❤ ${Number(meta.likes).toLocaleString()}`);
      if (meta.points) chips.push(`▲ ${meta.points}`);
      if (meta.comments) chips.push(`💬 ${meta.comments}`);
      if (meta.pipeline_tag) chips.push(`🏷 ${meta.pipeline_tag}`);
      if (meta.language) chips.push(`🌐 ${meta.language}`);
      if (meta.license) chips.push(`⚖ ${meta.license}`);
      (doc.topics || []).slice(0, 6).forEach((t) => chips.push(`# ${t}`));

      const summary = doc.summary || "";
      const authors = (doc.author || []).join(", ");

      el.innerHTML = `<section class="fade-in">
        <div class="kv" style="margin-bottom:12px">
          <a href="#/feed" data-nav>← ${ui.esc(i18n.t("nav.feed"))}</a>
          <span class="dim"> / ${ui.esc(doc.source || "")}</span>
        </div>

        <article class="glass card item-card">
          <div class="event-badges" style="margin-bottom:10px">
            ${doc.source ? ui.badge(doc.source, "") : ""}
            ${doc.tier ? ui.badge("T" + doc.tier, doc.tier <= 2 ? "tier1" : "") : ""}
            ${doc.content_type ? ui.badge(doc.content_type, "") : ""}
            ${doc.category ? ui.badge(`${ui.catIcon(doc.category)} ${ui.catLabel(doc.category)}`, "") : ""}
            ${typeof doc.importance_score === "number" ? ui.badge(`${i18n.t("common.importance")} ${doc.importance_score.toFixed(2)}`, "acc") : ""}
          </div>

          <h1 class="item-title">${ui.esc(doc.title || "")}</h1>

          <div class="item-meta">
            ${doc.published_at ? `<span class="kv">🕒 ${T("发布", "published", "公開")} ${ui.esc(ui.fmtDateTime(doc.published_at))}</span>` : ""}
            ${doc.discovered_at ? `<span class="kv">📥 ${T("收录", "collected", "収集")} ${ui.esc(ui.fmtDateTime(doc.discovered_at))}</span>` : ""}
            ${authors ? `<span class="kv">✍ ${ui.esc(authors.slice(0, 60))}</span>` : ""}
            ${doc.language ? `<span class="kv">🌐 ${ui.esc(doc.language)}</span>` : ""}
          </div>

          ${summary ? `<div class="item-digest">
            <span class="synth-tag">${T("导读", "Digest", "ダイジェスト")}</span>
            <p>${ui.esc(summary)}</p>
          </div>` : ""}

          ${chips.length ? `<div class="chip-row" style="margin:14px 0">${chips.map((c) => `<span class="badge">${ui.esc(c)}</span>`).join("")}</div>` : ""}

          <div class="row" style="gap:10px;margin-top:16px">
            ${doc.url ? `<a class="btn primary" href="${ui.esc(doc.url)}" target="_blank" rel="noopener">${ui.esc(i18n.t("common.open"))} ↗</a>` : ""}
            <button class="btn" id="copyItemLink">🔗 ${ui.esc(i18n.t("common.share"))}</button>
            ${hostEvent ? `<a class="btn" href="#/event/${hostEvent.event_id}" data-nav>🧩 ${T("所属事件", "In event", "所属イベント")}</a>` : ""}
          </div>
        </article>

        <div class="grid dashboard" style="margin-top:18px">
          <div class="stack" style="gap:18px">
            ${hostEvent ? `<section class="glass card">
              <h3 style="font-size:15px;margin:0 0 10px">🧩 ${T("所属事件", "Event", "イベント")}</h3>
              <a href="#/event/${hostEvent.event_id}" data-nav class="item-ev">
                <div style="font-weight:600;line-height:1.45">${ui.esc((hostEvent.title || "").slice(0, 110))}</div>
                <div class="kv" style="margin-top:6px">
                  📡 ${hostEvent.source_count || 0} · 🔥 ${(hostEvent.heat || 0).toFixed(1)} · ${ui.esc(ui.relTime(hostEvent.last_seen_at))}
                </div>
              </a>
            </section>` : ""}

            ${siblings.length ? `<section class="glass card">
              <h3 style="font-size:15px;margin:0 0 10px">📚 ${T("同来源近期", "More from this source", "同じソースの最近の記事")}</h3>
              <div class="stack" style="gap:8px">
                ${siblings.map((d) => `<a href="#/item/${d.id}" data-nav class="item-sib">
                  <span class="kv mono">${ui.esc((d.published_at || "").slice(5, 10))}</span>
                  <span>${ui.esc((d.title || "").slice(0, 80))}</span>
                </a>`).join("")}
              </div>
            </section>` : ""}
          </div>

          <div class="stack" style="gap:18px">
            <section class="glass card">
              <h3 style="font-size:15px;margin:0 0 10px">🔎 ${T("来源信息", "Source facts", "ソース情報")}</h3>
              <div class="stack" style="gap:7px">
                <div class="row" style="justify-content:space-between"><span class="kv">${T("来源", "Source", "ソース")}</span><b>${ui.esc(doc.source || "—")}</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">${T("层级", "Tier", "階層")}</span><b>${doc.tier ? "T" + doc.tier : "—"}</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">${T("类型", "Type", "種類")}</span><b>${ui.esc(doc.content_type || "—")}</b></div>
                <div class="row" style="justify-content:space-between"><span class="kv">${T("文档 ID", "Doc ID", "文書ID")}</span><b class="mono" style="font-size:11px">${ui.esc(doc.id)}</b></div>
              </div>
            </section>
            ${doc.entities && doc.entities.length ? `<section class="glass card">
              <h3 style="font-size:15px;margin:0 0 10px">🔗 ${i18n.t("common.entities")}</h3>
              <div class="chip-row">${doc.entities.slice(0, 10).map((x) =>
                `<a class="badge" href="#/entity/${encodeURIComponent(x.id)}" data-nav>${ui.esc(x.name)}</a>`).join("")}</div>
            </section>` : ""}
          </div>
        </div>
      </section>`;

      const cp = el.querySelector("#copyItemLink");
      cp && cp.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          window.GECKO.app.toast(i18n.t("common.copied"));
        } catch (e) { /* ignore */ }
      });
      if (window.GECKO.motion) window.GECKO.motion.refresh(el);
    },
  };

  window.GECKO.views.item = item;
})();
