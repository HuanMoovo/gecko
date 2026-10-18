/* GECKO · 热点榜（对标 AIHOT /hot）
   过去 48 小时讨论最多的事件：热度、24 小时走势、参与者构成
*/
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};
  window.GECKO.views = window.GECKO.views || {};

  const T = (zh, en, ja) => (window.GECKO.i18n.lang === "en" ? en : window.GECKO.i18n.lang === "ja" ? ja : zh);

  function hoursAgo(iso) {
    const t = new Date(iso || 0).getTime();
    return isNaN(t) || !t ? 999 : (Date.now() - t) / 3600000;
  }

  /** 24 小时热度走势（8 格 × 3h），标出峰值位置 */
  function trendChart(spark, peakHoursAgo) {
    const arr = (spark || []).filter((x) => typeof x === "number");
    if (arr.length < 2) return "";
    const w = 190, h = 44, pad = 3;
    const max = Math.max(...arr, 0.001);
    const step = (w - pad * 2) / (arr.length - 1);
    const pts = arr.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - (v / max) * (h - pad * 2)).toFixed(1)}`);
    const peakIdx = arr.indexOf(Math.max(...arr));
    const px = pad + peakIdx * step;
    const py = h - pad - (arr[peakIdx] / max) * (h - pad * 2);
    const label = peakHoursAgo != null && peakHoursAgo > 0
      ? T(`${peakHoursAgo} 小时前达峰`, `peaked ${peakHoursAgo}h ago`, `${peakHoursAgo}時間前にピーク`)
      : T("刚刚达峰", "peak now", "ピーク中");
    return `<div class="hot-chart">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        <polyline fill="none" stroke="var(--acc-2)" stroke-width="1.8" stroke-linecap="round"
          stroke-linejoin="round" points="${pts.join(" ")}"/>
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="var(--acc-2)"/>
        <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--border)" stroke-width="1"/>
      </svg>
      <div class="hot-chart-legend">
        <span class="kv">24h ${T("走势", "trend", "推移")}</span>
        <span class="kv dim">${label}</span>
      </div>
    </div>`;
  }

  function stateLabel(s) {
    const map = {
      surging: T("讨论快速增加", "accelerating fast", "急上昇"),
      rising: T("讨论仍在增加", "still rising", "上昇中"),
      active: T("发酵中", "developing", "進行中"),
      cooling: T("降温", "cooling", "冷却"),
    };
    return map[s] || T("发酵中", "developing", "進行中");
  }

  function row(e, idx) {
    const peers = e.heat_peers || e.heat_sources || 0;
    const fresh = e.heat_new_6h || 0;
    const newest = (e.timeline || []).slice(-1)[0];
    return `<article class="hot-row glass card hoverable">
      <div class="hot-rank mono">${String(idx + 1).padStart(2, "0")}</div>
      <div class="hot-main">
        <div class="hot-badges">
          ${window.GECKO.ui.badge(stateLabel(e.heat_state), e.heat_state === "surging" ? "rose" : e.heat_state === "rising" ? "acc" : "")}
          ${e.event_type ? window.GECKO.ui.badge(window.GECKO.ui.eventTypeLabel(e.event_type), window.GECKO.ui.eventTypeCls(e.event_type)) : ""}
          ${e.category ? window.GECKO.ui.badge(`${window.GECKO.ui.catIcon(e.category)} ${window.GECKO.ui.catLabel(e.category)}`, "") : ""}
        </div>
        <h3 class="hot-title"><a href="#/event/${e.event_id}" data-nav>${window.GECKO.ui.esc(e.title || "")}</a></h3>
        <div class="hot-meta">
          <span class="kv">📡 ${e.source_count || peers} ${T("个来源", "sources", "ソース")}</span>
          <span class="kv">${T("参与者", "participants", "参加者")} ${peers}</span>
          ${fresh ? `<span class="kv hl">+${fresh} ${T("最近 6 小时", "in last 6h", "直近6時間")}</span>` : ""}
          <span class="kv">🕒 ${window.GECKO.ui.relTime(e.last_seen_at)}</span>
        </div>
        ${newest ? `<div class="hot-latest">
          <span class="kv dim">${T("最新进展", "latest", "最新")}</span>
          ${newest.url ? `<a href="${window.GECKO.ui.esc(newest.url)}" target="_blank" rel="noopener">${window.GECKO.ui.esc((newest.title || "").slice(0, 88))}</a>`
            : window.GECKO.ui.esc((newest.title || "").slice(0, 88))}
        </div>` : ""}
      </div>
      <div class="hot-side">
        <div class="hot-score">
          <b class="mono">${(e.heat || 0).toFixed(1)}</b>
          <span class="kv">${T("热度指数", "heat", "熱度")}</span>
        </div>
        ${trendChart(e.heat_spark, e.heat_peak_hours_ago)}
      </div>
    </article>`;
  }

  const hot = {
    async render(el) {
      const { ui, api, i18n } = window.GECKO;
      el.innerHTML = `<div class="stack">${ui.skeletons(3)}</div>`;
      const { events } = await api.collect(4);
      const seen = new Set();
      const pool = (events || [])
        .filter((e) => (seen.has(e.event_id) ? false : (seen.add(e.event_id), true)))
        .filter((e) => hoursAgo(e.last_seen_at || e.first_seen_at) <= 48);

      const ranked = pool
        .sort((a, b) => (b.heat || 0) - (a.heat || 0))
        .slice(0, 10);

      if (!ranked.length) {
        el.innerHTML = `<section class="fade-in">
          ${ui.sectionHead(T("热点榜", "Hot board", "ホットボード"), T("过去 48 小时,大家在讨论什么", "What people discussed in the last 48 hours", "過去48時間、何が議論されたか"))}
          <div class="empty">${T("暂时没有热点 —— 还没有足够多来源共同讨论的事件。", "No hot topics yet — not enough sources discussing the same thing.", "まだホットな話題はありません。複数ソースが同じ話題を扱うと表示されます。")}</div>
        </section>`;
        return;
      }

      const fresh6h = ranked.filter((e) => hoursAgo(e.first_seen_at || e.last_seen_at) <= 6);
      const rising = ranked.filter((e) => !fresh6h.includes(e) && ["surging", "rising"].includes(e.heat_state));
      const steady = ranked.filter((e) => !fresh6h.includes(e) && !rising.includes(e));

      const block = (title, sub, list) => (!list.length ? "" : `<section class="section">
        ${ui.sectionHead(title, sub)}
        <div class="stack" style="gap:10px">${list.map((e, i) => row(e, ranked.indexOf(e))).join("")}</div>
      </section>`);

      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("热点榜", "Hot board", "ホットボード"),
          T("过去 48 小时 · 讨论最多的 10 个事件:热度、走势,以及都有谁在报道",
            "Last 48 hours · the 10 most-discussed events: heat, trend, and who covered them",
            "過去48時間・最も議論された10件：熱度・推移・報じた媒体"))}

        ${block(T("首报 6 小时内", "First reported within 6h", "初報6時間以内"), String(fresh6h.length), fresh6h)}
        ${block(T("讨论快速增加", "Accelerating", "急上昇"), String(rising.length), rising)}
        ${block(T("发酵中", "Developing", "進行中"), String(steady.length), steady)}

        <section class="glass card hot-explain">
          <h3 style="font-size:15px;margin:0 0 10px">🧮 ${T("热度是怎么算的", "How heat works", "熱度の算出方法")}</h3>
          <p>${T(
            "热度看的是有多少账号和机构在讨论同一件事:同一家重复发只算一次,越近的讨论分量越重,每过 18 小时减半。它反映讨论有多热闹,不代表报道质量。",
            "Heat measures how many distinct outlets and accounts discuss the same event: repeats from one source count once, fresher coverage weighs more, halving every 18 hours. It reflects buzz, not quality.",
            "熱度は同じ出来事を何社・何アカウントが論じたかを測ります。同一ソースの重複は1回、新しい報道ほど重く、18時間で半減します。話題性の指標であり、報道の質ではありません。")}</p>
          <p class="kv" style="display:block;margin-top:8px">${T(
            "榜单只看过去 48 小时;一手来源(T1)权重最高,媒体与个人次之。",
            "Only the last 48 hours are ranked; first-party sources (T1) weigh most, media and individuals less.",
            "対象は過去48時間のみ。一次ソース（T1）が最も重く、メディア・個人はその次です。")}</p>
        </section>
      </section>`;
      if (window.GECKO.motion) window.GECKO.motion.refresh(el);
    },
  };

  window.GECKO.views.hot = hot;
})();
