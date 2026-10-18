/* GECKO · 阅读偏好与收藏（仅保存在本机，可导出/导入备份） */
(function () {
  "use strict";
  window.GECKO = window.GECKO || {};

  var PKEY = "gecko.prefs";
  var FKEY = "gecko.favorites";
  var DEFAULTS = { fontSize: "m", fontFamily: "sans", density: "comfortable" };

  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key) || "null"); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 隐私模式忽略 */ }
  }

  var prefs = Object.assign({}, DEFAULTS, read(PKEY, {}));

  function apply() {
    var r = document.documentElement;
    r.dataset.fontSize = prefs.fontSize;
    r.dataset.fontFamily = prefs.fontFamily;
    r.dataset.density = prefs.density;
  }

  function set(k, v) { prefs[k] = v; write(PKEY, prefs); apply(); }
  function all() { return Object.assign({}, prefs); }
  function reset() { prefs = Object.assign({}, DEFAULTS); write(PKEY, prefs); apply(); }

  /* ---------- 收藏（事件 / 文档 id） ---------- */
  function favs() { var v = read(FKEY, []); return Array.isArray(v) ? v : []; }
  function isFav(id) { return favs().indexOf(id) >= 0; }
  function toggleFav(id) {
    if (!id) return false;
    var list = favs();
    var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.unshift(id);
    write(FKEY, list.slice(0, 800));
    return i < 0;
  }
  function removeFav(id) { write(FKEY, favs().filter(function (x) { return x !== id; })); }
  function clearFavs() { write(FKEY, []); }

  /* ---------- 导出 / 导入 ---------- */
  function exportAll() {
    return JSON.stringify({
      app: "GECKO",
      version: 1,
      exported_at: new Date().toISOString(),
      prefs: all(),
      favorites: favs(),
    }, null, 2);
  }
  function importAll(text) {
    var d = JSON.parse(text);
    if (!d || typeof d !== "object") throw new Error("invalid json");
    if (d.prefs && typeof d.prefs === "object") {
      prefs = Object.assign({}, DEFAULTS, d.prefs);
      write(PKEY, prefs);
    }
    if (Array.isArray(d.favorites)) {
      write(FKEY, d.favorites.filter(function (x) { return typeof x === "string"; }).slice(0, 800));
    }
    apply();
    return { prefs: all(), favorites: favs() };
  }

  apply();

  window.GECKO.prefs = {
    all: all, set: set, reset: reset, apply: apply,
    favs: favs, isFav: isFav, toggleFav: toggleFav, removeFav: removeFav, clearFavs: clearFavs,
    exportAll: exportAll, importAll: importAll,
  };
})();
