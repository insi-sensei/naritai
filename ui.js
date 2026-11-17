// 生徒の画面とにいにの画面で共通の部品。計算は logic.js に任せ、ここは見た目だけ。

// ---- 部品 ----
// 入力された文字は必ず textContent で入れる（HTMLとして解釈させない）。innerHTML は使わない。
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "class") el.className = value;
    else if (key === "value") el.value = value;
    else if (key === "checked") el.checked = Boolean(value);
    // style は CSSOM で入れる（style属性はCSPで止まるため）。
    else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child !== null && child !== undefined && child !== false) el.append(child);
  }
  return el;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["ellipse", "circle", "path", "rect", "g", "line", "polygon", "polyline"]); // うさぎの絵で使ってよい形
// 絵の属性として許すもの（script や href などは入れない）。
const SVG_ATTR = /^(cx|cy|r|rx|ry|x|y|width|height|d|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|opacity|fill-opacity|stroke-opacity|transform|points|x1|y1|x2|y2|class)$/;

function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  for (const child of children.flat()) if (child) el.append(child);
  return el;
}

const ICONS = {
  home: "M3.5 10.5L12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z",
  goal: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
  cal: "M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M8.5 3v4M15.5 3v4",
  coin: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5v9M9.5 9.5c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.4-2.5 1.7-2.5.8-2.5 1.8 1 1.7 2.5 1.7 2.5-.7 2.5-1.7",
  gear: "M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8",
  plus: "M12 5v14M5 12h14",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
};

function icon(name, size = 24) {
  return svg("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" },
    svg("path", { d: ICONS[name] }));
}

let toastTimer;
function toast(message, action) {
  const el = document.getElementById("toast");
  el.replaceChildren(h("span", {}, message));
  if (action) el.append(h("button", { class: "btn small ghost", onclick: () => { action.run(); el.classList.remove("show"); } }, action.label));
  el.classList.toggle("action", Boolean(action));
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), action ? 5000 : 2600);
}

const fmt = (n) => n.toLocaleString("ja-JP");
// 円は「交換する」の所だけで使う。ほかの画面はポイントだけで見せる。
const yenText = (pt) => `${fmt(Logic.yen(pt))}円`;
const shortPt = (pt) => (pt >= 10000 ? `${Math.round(pt / 1000) / 10}万` : fmt(pt));
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- 貯金うさぎ ----
const STAGE_NAMES = ["貯金箱のたまご", "ちびうさ", "うさぎ", "おしゃれうさ", "貯金うさぎの女王"];

function shapeEl(shape) {
  if (!shape || !SVG_TAGS.has(shape.tag)) return null;
  const attrs = {};
  for (const [k, v] of Object.entries(shape.attrs || {})) {
    if (SVG_ATTR.test(k) && (typeof v === "string" || typeof v === "number") && !/url\(|javascript:/i.test(String(v))) attrs[k] = v;
  }
  if (shape.part) attrs.class = `m-${shape.part}`;
  const el = svg(shape.tag, attrs);
  if (shape.tag === "g" && Array.isArray(shape.children)) for (const c of shape.children) { const ce = shapeEl(c); if (ce) el.append(ce); }
  return el;
}

function mascot(stageIndex, coinCount, size = 200) {
  const data = typeof MASCOT !== "undefined" ? MASCOT : null;
  const box = svg("svg", { viewBox: data ? data.viewBox : "0 0 200 200", width: size, height: size, role: "img", "aria-label": `${STAGE_NAMES[stageIndex]}（コイン${coinCount}枚）` });
  if (!data) return box;
  const stage = data.stages[Math.min(stageIndex, data.stages.length - 1)];
  for (const s of stage.shapes) { const el = shapeEl(s); if (el) box.append(el); }
  const coins = svg("g", { class: "m-coins" });
  (data.coinSlots || []).slice(0, coinCount).forEach((p) => {
    coins.append(svg("circle", { cx: p.cx, cy: p.cy, r: data.coinR || 7, fill: "#f6c945", stroke: "#c9962a", "stroke-width": 1.5 }),
      svg("circle", { cx: p.cx, cy: p.cy, r: (data.coinR || 7) * 0.5, fill: "none", stroke: "#fff3c4", "stroke-width": 1 }));
  });
  // コインはお腹の窓の上に描く（窓より後、顔より前）。
  const face = box.querySelector(".m-face");
  if (face) box.insertBefore(coins, face); else box.append(coins);
  return box;
}

function animate(el, name) {
  if (!el || reduceMotion()) return;
  el.classList.remove(name);
  void el.getBoundingClientRect(); // 同じ動きをもう一度出すため
  el.classList.add(name);
  el.addEventListener("animationend", () => el.classList.remove(name), { once: true });
}

// 「+10pt」が飛んでいく。
function coinFly(fromEl, text) {
  if (reduceMotion() || !fromEl) return;
  const r = fromEl.getBoundingClientRect();
  const el = h("div", { class: "coin-fly" }, text);
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 900);
}

function confetti() {
  if (reduceMotion()) return;
  const colors = ["#f7a8c4", "#b9a3e3", "#a8dcc8", "#ffd29d", "#9fc9f2"];
  const box = h("div", { class: "confetti", "aria-hidden": "true" });
  for (let i = 0; i < 60; i += 1) {
    const p = h("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    box.append(p);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 3800);
}

// ---- 下から出る画面・まん中の画面 ----
// 開くときに .open をつけると、ふわっと出てくる（style.css）。閉じるときは消えてから外す。
function show(back, ...els) {
  document.body.append(back);
  void back.getBoundingClientRect();
  for (const el of [back, ...els]) el.classList.add("open");
}

function hide(back, ...els) {
  for (const el of [back, ...els]) el.classList.remove("open");
  back.style.pointerEvents = "none";
  setTimeout(() => back.remove(), reduceMotion() ? 0 : 320);
}

function openSheet(build) {
  const close = () => { hide(back, sheet); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true" });
  const back = h("div", { class: "sheet-backdrop", onclick: (e) => { if (e.target === back) close(); } }, sheet);
  sheet.append(...[build(close)].flat(Infinity).filter(Boolean)); // 入れ子の一覧も広げる
  show(back, sheet);
  document.addEventListener("keydown", onKey);
  const first = sheet.querySelector("input, textarea");
  if (first) setTimeout(() => first.focus(), 50);
  return close;
}

function openModal(build) {
  const close = () => hide(back);
  const modal = h("div", { class: "modal", role: "dialog", "aria-modal": "true" });
  const back = h("div", { class: "modal-backdrop" }, modal);
  modal.append(...[build(close)].flat(Infinity).filter(Boolean));
  show(back);
  return close;
}

// ---- シール帳（カレンダー）----
function calendar({ state, inbox, month, selected, today, stageIndex, onMonth, onSelect }) {
  const first = `${month}-01`;
  const lead = Logic.weekday(first);
  const days = Logic.monthDays(month);
  const commentDays = new Set(inbox.comments.map((c) => c.date));
  const grid = h("div", { class: "cal-grid" }, ["日", "月", "火", "水", "木", "金", "土"].map((d) => h("div", { class: "cal-dow" }, d)));
  for (let i = 0; i < lead; i += 1) grid.append(h("div", { class: "cal-day empty" }));
  let stickers = 0;
  for (let d = 1; d <= days; d += 1) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    const future = date > today;
    const st = future ? "" : Logic.sticker(state, inbox, date, stageIndex);
    if (st && st !== Logic.RULES.PARTIAL_STICKER) stickers += 1;
    grid.append(h("button", {
      class: `cal-day${date === today ? " today" : ""}${date === selected ? " selected" : ""}`,
      "aria-label": `${Logic.dateLabel(date)}${st ? " シールあり" : ""}`,
      "data-date": date,
      disabled: future,
      onclick: () => onSelect(date),
    }, h("span", { class: "cal-num" }, String(d)), h("span", { class: "sticker" }, st), commentDays.has(date) ? h("span", { class: "dot" }) : null));
  }
  const head = h("div", { class: "cal-head" },
    h("button", { class: "icon-btn", "aria-label": "前の月", onclick: () => onMonth(Logic.addMonths(month, -1)) }, icon("left")),
    h("strong", {}, `${month.slice(0, 4)}年 ${Number(month.slice(5))}月`),
    h("button", { class: "icon-btn", "aria-label": "次の月", disabled: month >= Logic.monthKey(today), onclick: () => onMonth(Logic.addMonths(month, 1)) }, icon("right")));
  return { el: h("div", { class: "calendar card" }, head, grid), stickers };
}

// 1日の記録（シール帳で日付を押したとき）。
function dayDetail(state, inbox, date, coachName) {
  const tasks = Logic.tasksOn(state, inbox, date);
  const s = Logic.stats(tasks);
  const comments = inbox.comments.filter((c) => c.date === date);
  return h("div", { class: "day-detail card" },
    h("div", { class: "row-between" }, h("strong", {}, Logic.dateLabel(date)), h("span", {}, s.total ? `${s.done}/${s.total}  ${Math.round(s.rate * 100)}%  +${fmt(Logic.taskPt(s))}pt` : "")),
    tasks.length ? h("div", { class: "task-list" }, tasks.map((t) => h("div", { class: `task${t.done ? " done" : ""}` },
      h("span", { class: "check", "aria-hidden": "true" }), h("span", { class: "title" }, t.title),
      t.from === "owner" ? h("span", { class: "tag" }, `${coachName}から`) : null))) : h("p", { class: "empty" }, "この日のタスクはありません"),
    comments.map((c) => commentCard(c, coachName, false)));
}

function commentCard(c, coachName, isNew, onclick) {
  return h("div", { class: "coach-card card", onclick },
    h("div", { class: "coach-avatar", "aria-hidden": "true" }, c.stamp || "🐰"),
    h("div", {},
      h("div", { class: "coach-name" }, `${coachName}から`, isNew ? h("span", { class: "new-badge" }, "NEW") : null),
      c.text ? h("div", { class: "coach-text" }, c.text) : null));
}

// ---- なりたい自分 ----
// 分野のラベル（色の点と名前）。
function areaTag(state, areaId) {
  const name = Logic.areaName(state, areaId);
  if (!name) return null;
  const color = Logic.areaColor(state, areaId);
  const tag = h("span", { class: "tag area-tag" }, h("span", { class: "area-dot", style: { background: color } }), name);
  tag.style.borderColor = color;
  return tag;
}

// レーダーチャート。なりたい点数（点線）・先週（うすい）・今週（こい）を重ねる。
function radarChart(r, size = 300) {
  const n = r.areas.length;
  const c = size / 2;
  const R0 = size / 2 - 52; // 名前を書く分の余白
  const max = Logic.RULES.MAX_SCORE;
  const pt = (i, v) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [c + Math.cos(ang) * R0 * (v / max), c + Math.sin(ang) * R0 * (v / max)];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(",")).join(" ");
  const box = svg("svg", { viewBox: `0 0 ${size} ${size}`, class: "radar", role: "img", "aria-label": "なりたい自分のレーダーチャート" });
  for (const lv of [2, 4, 6, 8, 10]) box.append(svg("polygon", { points: poly(Array(n).fill(lv)), class: "radar-grid" }));
  r.areas.forEach((a, i) => {
    const [x, y] = pt(i, max);
    box.append(svg("line", { x1: c, y1: c, x2: x, y2: y, class: "radar-axis" }));
  });
  box.append(svg("polygon", { points: poly(r.target), class: "radar-target" }));
  if (r.prev) box.append(svg("polygon", { points: poly(r.prev), class: "radar-prev" }));
  if (r.now) {
    box.append(svg("polygon", { points: poly(r.now), class: "radar-now" }));
    r.now.forEach((v, i) => { const [x, y] = pt(i, v); box.append(svg("circle", { cx: x, cy: y, r: 4, fill: r.areas[i].color })); });
  }
  r.areas.forEach((a, i) => {
    const [x, y] = pt(i, max + 2.2);
    const label = svg("text", { x: x.toFixed(1), y: (y + 4).toFixed(1), "text-anchor": Math.abs(x - c) < 8 ? "middle" : x < c ? "end" : "start", class: "radar-label", fill: a.color });
    label.textContent = r.now ? `${a.name} ${r.now[i]}` : a.name; // 文字は textContent で入れる
    box.append(label);
  });
  return box;
}

// 分野ごとの、今週終えた数。
function areaBars(state, counts) {
  const max = Math.max(1, ...Object.values(counts));
  return h("div", { class: "area-bars" }, state.areas.map((a) => {
    const bar = h("div", { class: "area-bar-fill" });
    bar.style.width = `${(counts[a.id] / max) * 100}%`;
    bar.style.background = Logic.areaColor(state, a.id);
    return h("div", { class: "area-bar" }, h("span", { class: "area-bar-name" }, a.name), h("div", { class: "area-bar-track" }, bar), h("span", { class: "area-bar-num" }, `${counts[a.id]}`));
  }));
}

// 分野を選ぶチップ（もう一度押すと外れる）。
function areaPicker(state, selected, onChange) {
  const box = h("div", { class: "chips area-chips" });
  const draw = () => box.replaceChildren(...state.areas.map((a) => {
    const chip = h("button", { class: `chip${selected === a.id ? " active" : ""}`, "data-area": a.id, onclick: () => { selected = selected === a.id ? "" : a.id; draw(); onChange(selected); } },
      h("span", { class: "area-dot", style: { background: Logic.areaColor(state, a.id) } }), a.name);
    return chip;
  }));
  draw();
  return { el: box, set: (v) => { selected = v; draw(); } };
}

// ---- 棒グラフ ----
function chart(points) {
  const max = Math.max(1, ...points.map((p) => p.pt));
  return h("div", { class: "chart" }, h("div", { class: "bars" }, points.map((p, i) => {
    const bar = h("div", { class: `bar-v${i === points.length - 1 ? " now" : ""}` });
    bar.style.height = `${Math.max(2, (p.pt / max) * 100)}%`;
    return h("div", { class: "bar-col" }, h("span", { class: "bar-num" }, p.pt ? shortPt(p.pt) : ""), bar, h("span", { class: "bar-label" }, p.label));
  })));
}

// ---- サーバー ----
const API = (typeof API_BASE === "string" && API_BASE) ? API_BASE : "";

async function api(method, path, key, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${key}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// リンクの「#k=鍵」から鍵を取り出して保存し、アドレス欄からは消す。#より後ろはサーバーに送られない。
function takeKeyFromUrl(storageKey) {
  const m = location.hash.match(/k=([0-9a-f]{64})/);
  if (m) {
    try { localStorage.setItem(storageKey, m[1]); } catch (e) { /* 保存できない環境 */ }
    history.replaceState(null, "", location.pathname + location.search);
    return m[1];
  }
  try { return localStorage.getItem(storageKey) || ""; } catch (e) { return ""; }
}

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function setTheme(stageIndex, chosen) {
  const themes = Logic.RULES.THEMES;
  const ok = themes.indexOf(chosen) >= 0 && themes.indexOf(chosen) <= stageIndex;
  document.documentElement.dataset.theme = ok ? chosen : themes[0];
}

const THEME_NAMES = { lavender: "ラベンダー", sakura: "さくら", mint: "ミント", peach: "ピーチ", yuyake: "ゆうやけ" };

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => { /* オフライン対応なしで続ける */ });
}
