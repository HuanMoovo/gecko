/* GECKO · 收藏页 + 阅读设置页 */
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};
  window.GECKO.views = window.GECKO.views || {};

  const T = (zh, en, ja) => (window.GECKO.i18n.lang === "en" ? en : window.GECKO.i18n.lang === "ja" ? ja : zh);

  function seg(name, options, cur) {
    return `<div class="seg" data-seg="${name}">${options.map((o) =>
      `<button class="tab${o.v === cur ? " active" : ""}" data-val="${o.v}">${o.label}</button>`).join("")}</div>`;
  }

  function download(text, filename) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------------- 收藏页 ---------------- */
  const favorites = {
    async render(el) {
      const { ui, api } = window.GECKO;
      el.innerHTML = `<div class="stack">${ui.skeletons(2)}</div>`;
      const P = window.GECKO.prefs;
      const ids = P.favs();
      const { events: allEvents } = await api.collect(21);
      const picked = ids.map((id) => allEvents.find((e) => e.event_id === id)).filter(Boolean);
      const missing = ids.length - picked.length;

      if (!ids.length) {
        el.innerHTML = `<section class="fade-in">
          ${ui.sectionHead(T("我的收藏", "Favorites", "お気に入り"), T("点击任意事件卡右上角的 ☆ 收藏", "Tap ☆ on any event card to save it", "イベントカード右上の ☆ で保存できます"))}
          <div class="empty">${T("还没有收藏。在信息流或首页的事件卡右上角点 ☆ 即可收藏。",
            "No favorites yet. Tap ☆ on an event card in the feed or home page.",
            "まだお気に入りがありません。フィードやホームのイベントカード右上の ☆ から追加できます。")}</div>
        </section>`;
        return;
      }

      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("我的收藏", "Favorites", "お気に入り"), `${picked.length}${missing ? ` · ${missing} ${T("项已过期", "expired", "件は期限切れ")}` : ""}`)}
        <div class="grid cols-2">${picked.map((ev) => ui.eventCard(ev, { fav: true })).join("") || ui.emptyState()}</div>
      </section>`;
    },
  };

  /* ---------------- 阅读设置页 ---------------- */
  const settings = {
    async render(el) {
      const { ui } = window.GECKO;
      const P = window.GECKO.prefs;
      const cur = P.all();
      const favCount = P.favs().length;

      el.innerHTML = `<section class="fade-in">
        ${ui.sectionHead(T("阅读设置", "Reading Settings", "表示設定"),
          T("仅保存在本机 · 可导出备份", "Stored on this device only · export anytime", "この端末のみ保存 · 書き出し可能"))}

        <div class="grid cols-2">
          <div class="glass card">
            <h3 class="set-h">${T("字号", "Text size", "文字サイズ")}</h3>
            ${seg("fontSize", [{ v: "s", label: T("小", "S", "小") }, { v: "m", label: T("中", "M", "中") }, { v: "l", label: T("大", "L", "大") }], cur.fontSize)}

            <h3 class="set-h">${T("字体", "Typeface", "書体")}</h3>
            ${seg("fontFamily", [
              { v: "sans", label: T("无衬线", "Sans", "ゴシック") },
              { v: "serif", label: T("衬线", "Serif", "明朝") },
              { v: "mono", label: T("等宽", "Mono", "等幅") },
            ], cur.fontFamily)}

            <h3 class="set-h">${T("显示密度", "Density", "密度")}</h3>
            ${seg("density", [
              { v: "comfortable", label: T("舒适", "Comfortable", "ゆったり") },
              { v: "compact", label: T("紧凑", "Compact", "コンパクト") },
            ], cur.density)}

            <div class="kv dim" style="margin-top:14px;display:block">
              ${T("预览：同一件事，官网发一篇、媒体转十篇，GECKO 只呈现一次。",
                "Preview: one event, however many outlets covered it — shown once.",
                "プレビュー：同じ出来事は、何社が報じても一度だけ表示されます。")}
            </div>
          </div>

          <div class="glass card">
            <h3 class="set-h">${T("数据备份", "Backup", "バックアップ")}</h3>
            <div class="kv" style="display:block;margin-bottom:12px">
              ${T(`收藏 ${favCount} 项·全部设置只存在这台设备。换设备可导出 JSON 再导入。`,
                `${favCount} favorites · everything lives on this device. Export JSON to move devices.`,
                `お気に入り ${favCount} 件 · 設定はこの端末のみ。JSON で移行できます。`)}
            </div>
            <div class="row" style="gap:8px;flex-wrap:wrap">
              <button class="btn" id="btnExport">${T("导出 JSON", "Export JSON", "JSON を書き出す")}</button>
              <button class="btn" id="btnImport">${T("导入 JSON", "Import JSON", "JSON を読み込む")}</button>
              <button class="btn" id="btnClearFav">${T("清空收藏", "Clear favorites", "お気に入りを消去")}</button>
              <button class="btn" id="btnReset">${T("恢复默认", "Reset settings", "初期化")}</button>
            </div>
            <input type="file" id="importFile" accept="application/json,.json" hidden>
            <div id="setMsg" class="kv hl" style="display:block;margin-top:12px"></div>

            <h3 class="set-h" style="margin-top:20px">${T("RSS 订阅", "RSS feeds", "RSS フィード")}</h3>
            <div class="kv" style="display:block;line-height:2">
              <a class="hl" href="data/feed.xml" target="_blank" rel="noopener">data/feed.xml</a> ·
              ${T("全部事件", "all events", "全イベント")}<br>
              <a class="hl" href="data/feed-top.xml" target="_blank" rel="noopener">data/feed-top.xml</a> ·
              ${T("精选：热度 + 多来源", "curated: heat + multi-source", "厳選：熱度＋複数ソース")}<br>
              <a class="hl" href="data/reports/index.json" target="_blank" rel="noopener">${T("报告索引 JSON", "report index", "レポート索引 JSON")}</a> · <a class="hl" href="#/reports" data-nav>${T("日报/周报/月报", "daily / weekly / monthly", "日報・週報・月報")}</a>
            </div>
          </div>
        </div>
      </section>`;

      // 分段控件
      el.querySelectorAll("[data-seg]").forEach((box) => {
        box.addEventListener("click", (e) => {
          const b = e.target.closest("[data-val]");
          if (!b) return;
          P.set(box.dataset.seg, b.dataset.val);
          settings.render(el);
        });
      });

      const msg = el.querySelector("#setMsg");
      const say = (txt) => { if (msg) msg.textContent = txt; };

      el.querySelector("#btnExport").addEventListener("click", () => {
        download(P.exportAll(), `gecko-backup-${new Date().toISOString().slice(0, 10)}.json`);
        say(T("已导出备份文件。", "Backup exported.", "バックアップを書き出しました。"));
      });

      const fileInput = el.querySelector("#importFile");
      el.querySelector("#btnImport").addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        try {
          const res = P.importAll(await f.text());
          say(T(`已导入：收藏 ${res.favorites.length} 项。`, `Imported: ${res.favorites.length} favorites.`, `${res.favorites.length} 件のお気に入りを読み込みました。`));
          settings.render(el);
        } catch (err) {
          say(T("导入失败：文件格式不正确。", "Import failed: invalid file.", "読み込みに失敗しました。"));
        }
      });

      el.querySelector("#btnClearFav").addEventListener("click", () => {
        P.clearFavs();
        say(T("收藏已清空。", "Favorites cleared.", "お気に入りを消去しました。"));
        settings.render(el);
      });

      el.querySelector("#btnReset").addEventListener("click", () => {
        P.reset();
        say(T("已恢复默认设置。", "Settings reset.", "初期化しました。"));
        settings.render(el);
      });
    },
  };

  window.GECKO.views.favorites = favorites;
  window.GECKO.views.settings = settings;
})();
