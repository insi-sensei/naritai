// なりたい自分へ — 生徒の画面。計算は logic.js、共通の部品は ui.js。

const STATE_KEY = "naritai.state";
const INBOX_KEY = "naritai.inbox";
const PROFILE_KEY = "naritai.profile";
const KEY_KEY = "naritai.key";
const app = document.getElementById("app");

let state = Logic.cleanState(readJSON(STATE_KEY, null));
let inbox = Logic.cleanInbox(readJSON(INBOX_KEY, null));
let profile = { name: "", coach: "にいに", theme: "lavender", seenAt: 0, carryDismissed: "", ...readJSON(PROFILE_KEY, {}) };
const key = takeKeyFromUrl(KEY_KEY);
let tab = "home";
let day = Logic.today();
let calMonth = Logic.monthKey(day);
let calSelected = day;
let pointsView = "ledger";
let chartUnit = "week";
let synced = false; // サーバーから一度読むまでは送らない（空のデータで上書きしないため）
let lastSync = 0;
let syncError = "";

const coach = () => profile.coach || "にいに";
const saveProfile = () => writeJSON(PROFILE_KEY, profile);

// ---- 保存と同期 ----
let pushTimer;
function save() {
  state.updatedAt = Date.now();
  if (!writeJSON(STATE_KEY, state)) toast("スマホに保存できませんでした");
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 1500);
}

async function push() {
  if (!key || !synced) return;
  try {
    await api("PUT", "/api/student", key, state);
    lastSync = Date.now();
    syncError = "";
  } catch (e) {
    if (e.status === 409) await pull(true);
    else syncError = "電波がないか、サーバーにつながりません。あとで自動で送ります";
  }
}

// サーバーから、にいにの分（inbox）を読む。スマホのデータが空なら、サーバーの控えから戻す。
async function pull(preferServer = false) {
  if (!key) return;
  try {
    const data = await api("GET", "/api/student", key);
    const server = Logic.cleanState(data.state);
    const localEmpty = state.tasks.length === 0 && state.logins.length <= 1 && state.goals.length === 0;
    const serverHas = server.tasks.length > 0 || server.logins.length > 0;
    if (serverHas && (localEmpty || (preferServer && server.updatedAt > state.updatedAt))) {
      state = server;
      writeJSON(STATE_KEY, state);
      if (localEmpty && !preferServer) toast("前のデータを戻しました");
    }
    const before = JSON.stringify(inbox);
    inbox = Logic.cleanInbox(data.inbox);
    writeJSON(INBOX_KEY, inbox);
    const wasSynced = synced;
    synced = true;
    lastSync = Date.now();
    syncError = "";
    begin();
    if (!wasSynced || before !== JSON.stringify(inbox)) render();
    if (!wasSynced || state.updatedAt > server.updatedAt) push();
  } catch (e) {
    syncError = e.status === 401 ? "鍵が違います。にいにから届いたリンクを開き直してください" : "電波がないか、サーバーにつながりません";
  }
}

// ---- 毎日のはじめ ----
function begin() {
  day = Logic.today();
  const r = Logic.startDay(state, day);
  if (JSON.stringify(r.state) !== JSON.stringify(state)) {
    state = r.state;
    save();
  }
  if (r.bonus) {
    // 名前を入れる前なら、案内が終わってから出す。
    if (profile.name) loginBonus(r.bonus); else pendingBonus = r.bonus;
  }
}
let pendingBonus = null;

function loginBonus(bonus) {
  const n = R().LOGIN_BONUS.length;
  openModal((close) => [
    h("div", { class: "mascot-mini" }, mascot(currentStage().index, Logic.coins(sum().balance), 120)),
    h("h2", {}, "おかえり〜！"),
    h("p", {}, `ログインボーナス ${bonus.day}日目`),
    h("div", { class: "login-days" }, R().LOGIN_BONUS.map((pt, i) => h("div", {
      class: `lday${i < bonus.day - 1 ? " got" : ""}${i === bonus.day - 1 ? " today" : ""}${i === n - 1 ? " big" : ""}`,
    }, h("small", {}, `${i + 1}`), h("b", {}, i === n - 1 ? `🪙${pt}` : String(pt))))),
    h("div", { class: "big-num" }, `+${fmt(bonus.pt)} pt`),
    h("button", { class: "btn primary", id: "login-ok", onclick: (e) => { coinFly(e.currentTarget, `+${bonus.pt}pt`); close(); render(); } }, "受け取る"),
  ]);
}

const R = () => Logic.RULES;
const sum = () => Logic.summary(state, inbox, day);
const currentStage = () => Logic.stage(sum().earned);
const todayTasks = () => Logic.tasksOn(state, inbox, day);

// ---- タスクの操作 ----
function toggleTask(t, rowEl) {
  const wasComplete = Logic.isComplete(Logic.stats(todayTasks()));
  const before = Logic.stats(todayTasks());
  const ptBefore = Logic.taskPt(before);
  if (t.from === "owner") {
    const ownerDone = { ...state.ownerDone };
    if (ownerDone[t.id]) delete ownerDone[t.id]; else ownerDone[t.id] = Date.now();
    state = { ...state, ownerDone };
  } else {
    state = { ...state, tasks: state.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done, doneAt: x.done ? 0 : Date.now() } : x)) };
  }
  save();
  const after = Logic.stats(todayTasks());
  const gained = Logic.taskPt(after) - ptBefore;
  render();
  const mascotEl = document.querySelector(".mascot svg");
  if (gained > 0) {
    animate(mascotEl, "hop");
    coinFly(rowEl, `+${gained}pt`);
  }
  if (!wasComplete && Logic.isComplete(after)) {
    setTimeout(() => complete(), 350);
  }
}

function complete() {
  confetti();
  animate(document.querySelector(".mascot svg"), "banzai");
  const canScratch = Logic.canScratch(state, inbox, day);
  let amount = 0;
  if (canScratch) {
    // 先に結果を決めて保存する（開き直しても引き直せないように）。
    amount = Logic.drawScratch();
    state = { ...state, scratches: { ...state.scratches, [day]: amount } };
    save();
  }
  const t = Logic.totals(state, inbox, day);
  const stamps = t.stamps === 0 && t.completeDays > 0 ? R().STAMP_FULL : t.stamps;
  openModal((close) => [
    h("h2", {}, "🎉 今日コンプリート！"),
    canScratch ? scratchCard(amount) : h("p", {}, "今日のスクラッチはもう削ったよ"),
    h("div", { class: "stamps", "aria-label": `スタンプ ${stamps}/${R().STAMP_FULL}` },
      Array.from({ length: R().STAMP_FULL }, (_, i) => h("span", { class: i < stamps ? "on" : "" }, i < stamps ? "●" : "○")),
      h("small", {}, stamps >= R().STAMP_FULL ? ` 満タン！ +${fmt(R().STAMP_BONUS)}pt` : ` あと${R().STAMP_FULL - stamps}個`)),
    h("button", { class: "btn primary", id: "complete-ok", onclick: () => { close(); render(); } }, "やったね！"),
  ]);
}

// 指で削るスクラッチ。結果はすでに保存してあるので、削らずに閉じても損はしない。
function scratchCard(amount) {
  const canvas = h("canvas", { class: "scratch-canvas", width: 280, height: 140, "aria-label": "指で削る" });
  const prize = h("div", { class: "scratch-prize" }, h("span", {}, "🪙"), h("b", {}, `+${fmt(amount)}pt`));
  const box = h("div", { class: "scratch", id: "scratch" }, prize, canvas);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 280, 140);
    g.addColorStop(0, "#d9d4e6"); g.addColorStop(0.5, "#f3f0f8"); g.addColorStop(1, "#cfc8e0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 280, 140);
    ctx.fillStyle = "#7d7398";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ここを指でけずってね", 140, 78);
  }
  let scratching = false;
  let moves = 0;
  const reveal = () => { canvas.remove(); animate(prize, "pop"); };
  const scratch = (e) => {
    if (!scratching || !ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc((e.clientX - r.left) * (280 / r.width), (e.clientY - r.top) * (140 / r.height), 22, 0, Math.PI * 2);
    ctx.fill();
    moves += 1;
    if (moves > 45) reveal();
  };
  canvas.addEventListener("pointerdown", (e) => { scratching = true; canvas.setPointerCapture(e.pointerId); scratch(e); });
  canvas.addEventListener("pointermove", scratch);
  canvas.addEventListener("pointerup", () => { scratching = false; });
  return h("div", {}, box, h("button", { class: "btn small ghost", id: "scratch-all", onclick: reveal }, "いっきに全部けずる"));
}

function addTask(title, target, routine, area = "") {
  const tagArea = area && state.areas.some((a) => a.id === area) ? { area } : {};
  title = title.trim().slice(0, R().MAX_TITLE);
  if (!title) return false;
  if (target === "today") {
    if (todayTasks().length >= R().MAX_TASKS_PER_DAY) { toast("今日はもういっぱい！"); return false; }
    const tasks = [...state.tasks];
    let routines = state.routines;
    let routineId;
    if (routine) {
      if (routines.length >= R().MAX_ROUTINES) { toast("いつものはこれ以上ふやせません"); return false; }
      routineId = Logic.newId();
      routines = [...routines, { id: routineId, title, ...tagArea }];
    }
    tasks.push({ id: Logic.newId(), date: day, title, done: false, doneAt: 0, ...(routineId ? { routine: routineId } : {}), ...tagArea });
    state = { ...state, tasks, routines };
  } else {
    const kind = target;
    state = { ...state, goals: [...state.goals, { id: Logic.newId(), kind, period: Logic.periodOf(kind, day), title, done: false, doneAt: 0, ...tagArea }] };
  }
  save();
  return true;
}

function removeItem(kind, id) {
  const before = state;
  if (kind === "task") state = { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
  else state = { ...state, goals: state.goals.filter((g) => g.id !== id) };
  save();
  render();
  toast("けしました", { label: "元に戻す", run: () => { state = before; save(); render(); } });
}

function toggleGoal(g) {
  if (g.from === "owner") {
    const ownerDone = { ...state.ownerDone };
    if (ownerDone[g.id]) delete ownerDone[g.id]; else ownerDone[g.id] = Date.now();
    state = { ...state, ownerDone };
  } else {
    state = { ...state, goals: state.goals.map((x) => (x.id === g.id ? { ...x, done: !x.done, doneAt: x.done ? 0 : Date.now() } : x)) };
  }
  save();
  render();
  if (!g.done) { confetti(); toast("目標たっせい！"); }
}

// ---- ＋ボタン ----
function openAdd(defaultTarget = "today") {
  let target = defaultTarget;
  openSheet((close) => {
    const input = h("input", { class: "text", id: "add-input", type: "text", maxlength: R().MAX_TITLE, placeholder: "例：英単語20個", enterkeyhint: "done", "aria-label": "やること" });
    const routine = h("input", { type: "checkbox", id: "add-routine" });
    const routineRow = h("label", { class: "toggle-row" }, h("span", {}, "毎日の「いつもの」にする"), routine);
    const seg = h("div", { class: "seg", role: "tablist" });
    const drawSeg = () => {
      seg.replaceChildren(...[["today", "今日"], ["week", "今週の目標"], ["month", "今月の目標"]].map(([v, label]) => h("button", {
        class: `seg-btn${target === v ? " active" : ""}`, "data-target": v, onclick: () => { target = v; drawSeg(); routineRow.hidden = target !== "today"; },
      }, label)));
    };
    drawSeg();
    let area = "";
    const picker = areaPicker(state, area, (v) => { area = v; });
    const done = (title, chipArea) => {
      if (addTask(title, target, target === "today" && routine.checked, chipArea === undefined ? area : chipArea)) {
        close();
        render();
        toast(target === "today" ? "追加したよ" : "目標を追加したよ");
      }
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) done(input.value); });
    const favs = Logic.favorites(state, day);
    return [
      h("h2", {}, "なにをやる？"),
      input,
      favs.length ? h("div", {}, h("p", { class: "sub" }, "よく使う（タップで追加）"), h("div", { class: "chips" }, favs.map((f) => h("button", { class: "chip", onclick: () => done(f, area || Logic.lastArea(state, f)) }, f)))) : null,
      h("p", { class: "sub" }, "入れる先"),
      seg,
      state.areas.length ? h("div", {}, h("p", { class: "sub" }, "なりたい自分の分野（えらばなくてもOK）"), picker.el) : null,
      routineRow,
      h("button", { class: "btn primary", id: "add-submit", onclick: () => done(input.value) }, "追加する"),
    ];
  });
}

// ---- スワイプで削除 ----
function swipeRow(row, onDelete) {
  const wrap = h("div", { class: "task-wrap" }, h("button", { class: "task-del", onclick: onDelete, tabindex: "-1" }, "けす"), row);
  let x0 = null;
  let dx = 0;
  let moved = false;
  row.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; moved = false; });
  row.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    dx = Math.min(0, e.clientX - x0) + (wrap.classList.contains("open") ? -80 : 0);
    if (Math.abs(e.clientX - x0) > 8) { moved = true; row.style.transform = `translateX(${Math.max(-100, dx)}px)`; }
  });
  const end = () => {
    if (x0 === null) return;
    x0 = null;
    row.style.transform = "";
    if (moved) wrap.classList.toggle("open", dx < -50);
  };
  row.addEventListener("pointerup", end);
  row.addEventListener("pointercancel", end);
  row.addEventListener("click", (e) => {
    if (moved) { e.stopImmediatePropagation(); e.preventDefault(); }
    else if (wrap.classList.contains("open")) { wrap.classList.remove("open"); e.stopImmediatePropagation(); }
  }, true);
  return wrap;
}

function taskRow(t, perPt) {
  const row = h("button", { class: `task${t.done ? " done" : ""}`, "data-id": t.id, "aria-pressed": t.done ? "true" : "false" },
    h("span", { class: "check", "aria-hidden": "true" }),
    h("span", { class: "title" }, t.title),
    t.from === "routine" ? h("span", { class: "tag" }, "いつもの") : null,
    t.from === "owner" ? h("span", { class: "tag" }, `${coach()}から`) : null,
    t.area ? areaTag(state, t.area) : null,
    h("span", { class: "pt" }, t.done ? "" : `+${perPt}pt`));
  row.addEventListener("click", () => toggleTask(t, row));
  // にいにからのタスクは消せない（にいにの画面で消す）。
  return t.from === "owner" ? h("div", { class: "task-wrap" }, row) : swipeRow(row, () => removeItem("task", t.id));
}

// ---- 画面 ----
function speech(s, complete, left) {
  if (s.total === 0) return "今日やること、なにから入れる？";
  if (complete) return "今日コンプリート！えらすぎる〜！";
  if (s.done === 0) return "今日もいっしょにがんばろ！";
  if (left === 1) return "あと1個で今日コンプリート！";
  return `あと${left}個！いい感じ〜`;
}

function topbar() {
  const st = Logic.streak(state, inbox, day);
  return h("header", { class: "topbar" },
    h("div", { class: "title" }, `${profile.name ? `${profile.name}の` : ""}なりたい自分へ`),
    h("div", { class: "streak", "aria-label": `${st.days}日連続` }, `🔥${st.days}日`),
    h("button", { class: "icon-btn", id: "open-settings", "aria-label": "設定", onclick: openSettings }, icon("gear")));
}

function renderHome() {
  const s = Logic.stats(todayTasks());
  const allDone = Logic.isComplete(s);
  const sm = sum();
  const stg = Logic.stage(sm.earned);
  const tasks = todayTasks();
  const per = Logic.perTaskPt(s);
  const latest = [...inbox.comments].sort((a, b) => b.at - a.at)[0];
  const left = Logic.leftovers(state, day);
  const els = [
    topbar(),
    h("section", { class: "mascot-card card" },
      h("div", { class: "mascot" }, mascot(stg.index, Logic.coins(sm.balance))),
      h("div", { class: "speech" }, speech(s, allDone, s.total - s.done)),
      h("div", { class: "stage-name" }, `${STAGE_NAMES[stg.index]}（${stg.index + 1}/5段階）`),
      stg.last ? h("div", { class: "stage-next" }, "いちばん上まで育ったよ！") : h("div", {},
        h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${Math.round(stg.progress * 100)}%` } })),
        h("div", { class: "stage-next" }, `次まであと ${fmt(stg.toNext)}pt`))),
    h("section", { class: "money card" },
      h("div", {}, h("span", { class: "pt", id: "balance" }, `💰 ${fmt(sm.balance)}pt`)),
      h("div", { class: "delta" }, `今週 +${fmt(sm.thisWeek)}pt`)),
    h("section", { class: "card" },
      h("div", { class: "today-head" }, h("span", { class: "date" }, `今日 ${Logic.dateLabel(day)}`), h("span", { class: "count", id: "count" }, `${s.done}/${s.total}`)),
      h("div", { class: "progress", role: "progressbar", "aria-valuenow": Math.round(s.rate * 100), "aria-valuemin": 0, "aria-valuemax": 100 },
        h("div", { class: "progress-fill", style: { width: `${Math.round(s.rate * 100)}%` } })),
      h("div", { class: "rate", id: "rate" }, `${Math.round(s.rate * 100)}%`)),
  ];
  if (latest) {
    const isNew = latest.at > profile.seenAt;
    els.push(commentCard(latest, coach(), isNew, () => { profile.seenAt = Math.max(profile.seenAt, ...inbox.comments.map((c) => c.at)); saveProfile(); render(); }));
  }
  if (left.length && profile.carryDismissed !== day) {
    els.push(h("button", { class: "banner", id: "carry", onclick: () => { state = Logic.carryOver(state, day); save(); render(); toast("今日にうつしたよ"); } },
      h("span", {}, "📦"), h("span", {}, `昨日の残り${left.length}個を今日にうつす`),
      h("span", { class: "x", role: "button", "aria-label": "閉じる", onclick: (e) => { e.stopPropagation(); profile.carryDismissed = day; saveProfile(); render(); } }, "×")));
  }
  // 土日は、今週の振り返りをすすめる（シートと同じ点数づけ）。
  const wd = Logic.weekday(day);
  if (Logic.canReflect(state, day) && (wd === 6 || wd === 0)) {
    els.push(h("button", { class: "banner", id: "reflect-banner", onclick: openReflect }, h("span", {}, "🪞"), h("span", {}, `今週の振り返り +${fmt(R().REFLECT_PT)}pt`)));
  }
  if (allDone && !state.scratches[day]) {
    els.push(h("button", { class: "banner", id: "scratch-banner", onclick: () => complete() }, h("span", {}, "🎫"), h("span", {}, "ボーナススクラッチが削れるよ！")));
  }
  els.push(tasks.length
    ? h("div", { class: "task-list", id: "tasks" }, tasks.map((t) => taskRow(t, per)))
    : h("p", { class: "empty" }, "右下の ＋ から、今日やることを入れよう"));
  if (tasks.length && s.total < R().MIN_TASKS) els.push(h("p", { class: "empty" }, `${R().MIN_TASKS}個以上入れて全部終えると、ボーナススクラッチ！`));
  els.push(fab("today"));
  return els;
}

function fab(target) {
  return h("button", { class: "fab", id: "fab", "aria-label": "追加する", onclick: () => openAdd(target) }, icon("plus", 28));
}

function goalCard(g, kind) {
  const card = h("button", { class: `goal card${g.done ? " done" : ""}`, "data-id": g.id },
    h("span", { class: "check", "aria-hidden": "true" }),
    h("span", { class: "goal-title" }, g.title),
    g.from === "owner" ? h("span", { class: "tag" }, `${coach()}から`) : null,
    g.area ? areaTag(state, g.area) : null);
  card.addEventListener("click", () => toggleGoal(g));
  return g.from === "owner" ? h("div", { class: "task-wrap" }, card) : swipeRow(card, () => removeItem("goal", g.id));
}

function renderGoals() {
  const sections = [["month", "🌙 今月の目標"], ["week", "⭐ 今週の目標"]].map(([kind, label]) => {
    const period = Logic.periodOf(kind, day);
    const goals = Logic.goalsFor(state, inbox, kind, period);
    const s = Logic.stats(goals);
    const full = kind === "week" ? R().WEEK_GOAL_PT : R().MONTH_GOAL_PT;
    return h("section", { class: "goal-section" },
      h("h3", {}, label, h("small", {}, ` ${Logic.periodLabel(kind, period)}  あと${Logic.daysLeft(kind, period, day)}日`)),
      h("p", { class: "goal-meta" }, goals.length ? `ぜんぶ達成で +${fmt(full)}pt（いま +${fmt(Logic.goalPt(kind, s))}pt）` : `目標を入れて達成すると +${fmt(full)}pt`),
      goals.length ? goals.map((g) => goalCard(g, kind)) : h("p", { class: "empty" }, "まだありません"));
  });
  const past = [...state.goals].filter((g) => g.done && g.period !== Logic.periodOf(g.kind, day)).sort((a, b) => b.doneAt - a.doneAt).slice(0, 30);
  return [
    topbar(),
    ...sections,
    past.length ? h("details", { class: "card" }, h("summary", {}, `🔖 達成した目標（${past.length}）`),
      past.map((g) => h("div", { class: "ledger-row" }, h("span", {}, g.kind === "week" ? "週" : "月"), h("span", {}, g.title), h("span", {}, Logic.periodLabel(g.kind, g.period))))) : null,
    fab("week"),
  ];
}

function renderCalendar() {
  const stg = currentStage();
  const cal = calendar({
    state, inbox, month: calMonth, selected: calSelected, today: day, stageIndex: stg.index,
    onMonth: (m) => { calMonth = m; render(); },
    onSelect: (d) => { calSelected = d; render(); },
  });
  const t = Logic.totals(state, inbox, day);
  return [
    topbar(),
    cal.el,
    h("div", { class: "card cal-legend" },
      h("div", {}, `🌸 全部できた　${R().PARTIAL_STICKER} 少しできた`),
      h("div", { class: "sub" }, `今月のシール ${cal.stickers}枚 ／ がんばった日 累計 ${t.activeDays}日 ✨`)),
    dayDetail(state, inbox, calSelected, coach()),
  ];
}

// ---- なりたい自分（振り返りシート）----
function renderSelf() {
  if (state.areas.length < R().MIN_AREAS) return [topbar(), areasSetup()];
  const r = Logic.radar(state, day);
  const done = Logic.reflectionOf(state, Logic.weekKey(day));
  return [
    topbar(),
    h("section", { class: "card self-radar" },
      h("div", { class: "row-between" }, h("strong", {}, "なりたい自分"), h("button", { class: "btn small ghost", id: "edit-areas", onclick: openAreas }, "分野を変える")),
      radarChart(r),
      h("div", { class: "radar-legend" },
        h("span", { class: "lg target" }, "なりたい点数"),
        r.prev ? h("span", { class: "lg prev" }, `前回 ${Logic.short(r.prevWeek)}週`) : null,
        r.now ? h("span", { class: "lg now" }, `今回 ${Logic.short(r.nowWeek)}週`) : null),
      h("button", { class: `btn ${done ? "ghost" : "primary"}`, id: "open-reflect", onclick: openReflect },
        done ? "今週の点数を付け直す" : `今週の振り返りをする +${fmt(R().REFLECT_PT)}pt`)),
    h("section", { class: "card" },
      h("strong", {}, "今週がんばった数（分野ごと）"),
      h("p", { class: "sub" }, "＋でタスクや目標を入れるときに分野をえらぶと、ここに入るよ"),
      areaBars(state, Logic.areaActivity(state, inbox, day))),
    roadmapCard(),
  ];
}

function areasSetup() {
  const examples = ["勉強", "健康", "友だち", "お金", "趣味", "自分みがき", "英語", "家族"];
  const inputs = examples.map((ex, i) => h("input", { class: "text", id: `area-${i}`, maxlength: R().MAX_AREA_NAME, placeholder: `例：${ex}`, value: state.areas[i] ? state.areas[i].name : "", "aria-label": `分野${i + 1}` }));
  return h("section", { class: "card" },
    h("h2", {}, "なりたい自分の分野を決めよう"),
    h("p", { class: "sub" }, `振り返りシートと同じ分野を${R().MIN_AREAS}〜${R().MAX_AREAS}個入れてね。毎週ここで点数をつけると、レーダーチャートになるよ`),
    h("div", { class: "area-inputs" }, inputs),
    h("button", {
      class: "btn primary", id: "save-areas",
      onclick: () => {
        const next = Logic.setAreas(state, inputs.map((x) => x.value));
        if (!next) { toast(`分野を${R().MIN_AREAS}個以上入れてね`); return; }
        state = next; save(); render(); toast("分野を決めたよ");
      },
    }, "決める"));
}

function openAreas() {
  openSheet((close) => {
    const inputs = Array.from({ length: R().MAX_AREAS }, (_, i) => h("input", { class: "text", maxlength: R().MAX_AREA_NAME, value: state.areas[i] ? state.areas[i].name : "", placeholder: "（空ならなし）", "aria-label": `分野${i + 1}` }));
    return [
      h("h2", {}, "分野を変える"),
      h("p", { class: "sub" }, "名前を変えても、前の点数は残るよ。空にした分野はなくなる"),
      h("div", { class: "area-inputs" }, inputs),
      h("button", { class: "btn primary", onclick: () => {
        const next = Logic.setAreas(state, inputs.map((x) => x.value));
        if (!next) { toast(`分野を${R().MIN_AREAS}個以上入れてね`); return; }
        state = next; save(); close(); render(); toast("分野を変えたよ");
      } }, "保存"),
    ];
  });
}

// 週の振り返り。分野ごとに、今の自分を0〜10点で。なりたい点数も変えられる。
function openReflect() {
  const week = Logic.weekKey(day);
  const old = Logic.reflectionOf(state, week);
  const prev = Logic.radar(state, Logic.addDays(week, -1)).now;
  openSheet((close) => {
    const scores = {};
    const targets = {};
    const rows = state.areas.map((a, i) => {
      scores[a.id] = old && a.id in old.scores ? old.scores[a.id] : (prev ? prev[i] : 5);
      targets[a.id] = a.target;
      const val = h("b", { class: "score-val" }, String(scores[a.id]));
      const range = h("input", { type: "range", min: 0, max: R().MAX_SCORE, step: 1, value: String(scores[a.id]), "aria-label": `${a.name}の今の点数`, "data-area": a.id });
      range.addEventListener("input", () => { scores[a.id] = Number(range.value); val.textContent = range.value; });
      const tval = h("small", { class: "target-val" }, `なりたい ${a.target}`);
      const minus = h("button", { class: "step-btn small", "aria-label": `${a.name}のなりたい点数をへらす`, onclick: () => { targets[a.id] = Math.max(0, targets[a.id] - 1); tval.textContent = `なりたい ${targets[a.id]}`; } }, "−");
      const plus = h("button", { class: "step-btn small", "aria-label": `${a.name}のなりたい点数をふやす`, onclick: () => { targets[a.id] = Math.min(R().MAX_SCORE, targets[a.id] + 1); tval.textContent = `なりたい ${targets[a.id]}`; } }, "＋");
      return h("div", { class: "score-row" },
        h("div", { class: "row-between" }, h("span", {}, h("span", { class: "area-dot", style: { background: Logic.areaColor(state, a.id) } }), a.name), val),
        range,
        h("div", { class: "target-row" }, minus, tval, plus));
    });
    return [
      h("h2", {}, "今週の振り返り"),
      h("p", { class: "sub" }, `いまの自分は何点？（0〜${R().MAX_SCORE}）`),
      rows,
      h("button", { class: "btn primary", id: "reflect-save", onclick: () => {
        const first = !old;
        state = Logic.reflect(state, day, scores, targets);
        save(); close(); render();
        if (first) { confetti(); toast(`振り返りできたね！ +${fmt(R().REFLECT_PT)}pt`); } else toast("付け直したよ");
      } }, old ? "付け直す" : `保存して +${fmt(R().REFLECT_PT)}pt`),
    ];
  });
}

// 道のり（1週間後〜半年後）。
function roadmapCard() {
  const steps = Logic.roadmapSteps(state, day);
  if (!steps.length) {
    return h("section", { class: "card" }, h("strong", {}, "🗺️ 道のり"),
      h("p", { class: "sub" }, "1週間後・2週間後・1か月後・2か月後・3か月後・半年後に、どうなっていたい？"),
      h("button", { class: "btn primary", id: "open-roadmap", onclick: () => openRoadmap(false) }, "道のりを作る"));
  }
  const over = Logic.roadmapOver(state, day);
  return h("section", { class: "card roadmap" },
    h("div", { class: "row-between" }, h("strong", {}, "🗺️ 道のり"), h("button", { class: "btn small ghost", id: "edit-roadmap", onclick: () => openRoadmap(!over) }, over ? "新しく作る" : "書き直す")),
    h("p", { class: "sub" }, `${Logic.dateLabel(state.roadmap.start)} から`),
    h("ol", { class: "road" }, steps.map((st) => h("li", { class: `road-step${st.done ? " done" : ""}${st.passed && !st.done ? " passed" : ""}`, "data-key": st.key },
      h("button", {
        class: "check", "aria-label": st.done ? "達成を取り消す" : "達成した", disabled: !st.title,
        onclick: () => { state = Logic.toggleStep(state, st.key); save(); render(); if (!st.done) { confetti(); toast("節目クリア！"); } },
      }),
      h("div", { class: "road-body" },
        h("div", { class: "road-when" }, `${st.label}  ${Logic.short(st.date)}`, !st.passed && !st.done ? h("small", {}, ` あと${st.left}日`) : null),
        h("div", { class: "road-title" }, st.title || "（まだ書いていない）"))))));
}

function openRoadmap(keepStart) {
  const steps = keepStart ? Logic.roadmapSteps(state, day) : [];
  openSheet((close) => {
    const inputs = R().ROADMAP_STEPS.map((st) => {
      const cur = steps.find((x) => x.key === st.key);
      return h("input", { class: "text", maxlength: R().MAX_TITLE, "data-key": st.key, value: cur ? cur.title : "", placeholder: "どうなっていたい？", "aria-label": st.label });
    });
    return [
      h("h2", {}, keepStart ? "道のりを書き直す" : "道のりを作る"),
      h("p", { class: "sub" }, keepStart ? "出発の日はそのまま。同じ文の達成は残るよ" : "今日が出発の日になるよ"),
      R().ROADMAP_STEPS.map((st, i) => h("div", { class: "field" }, h("label", {}, st.label), inputs[i])),
      h("button", { class: "btn primary", id: "roadmap-save", onclick: () => {
        const titles = {};
        for (const el of inputs) titles[el.dataset.key] = el.value;
        if (!Object.values(titles).some((t) => t.trim())) { toast("1つは書いてね"); return; }
        state = Logic.setRoadmap(state, day, titles, keepStart);
        save(); close(); render(); toast("道のりを保存したよ");
      } }, "保存"),
    ];
  });
}

function renderPoints() {
  const sm = sum();
  const t = Logic.totals(state, inbox, day);
  const stg = Logic.stage(sm.earned);
  const tabs = h("div", { class: "tabs-inline" },
    h("button", { class: `tab-inline${pointsView === "ledger" ? " active" : ""}`, onclick: () => { pointsView = "ledger"; render(); } }, "通帳"),
    h("button", { class: `tab-inline${pointsView === "exchange" ? " active" : ""}`, id: "tab-exchange", onclick: () => { pointsView = "exchange"; render(); } }, "交換する"));
  const series = Logic.series(sm.rows, chartUnit, day, chartUnit === "week" ? 8 : 6);
  return [
    topbar(),
    h("section", { class: "points-hero card" },
      h("div", { class: "mascot" }, mascot(stg.index, Logic.coins(sm.balance), 120)),
      h("div", {}, h("div", { class: "sub" }, "🐰 貯金うさぎ（いま持っている）"), h("div", { class: "big-pt" }, `${fmt(sm.balance)}pt`))),
    h("section", { class: "stats" },
      h("div", { class: "stat card" }, h("div", { class: "stat-num" }, `${fmt(sm.earned)}pt`), h("div", { class: "stat-label" }, "貯めた合計")),
      h("div", { class: "stat card" }, h("div", { class: "stat-num" }, `${fmt(sm.exchanged)}pt`), h("div", { class: "stat-label" }, "交換した")),
      h("div", { class: "stat card" }, h("div", { class: "stat-num" }, `${t.activeDays}日`), h("div", { class: "stat-label" }, `がんばった日`), h("div", { class: "stat-label" }, `コンプリート${t.completeDays}回`))),
    h("section", { class: "card" },
      h("div", { class: "row-between" }, h("strong", {}, chartUnit === "week" ? "週ごとに貯めたpt" : "月ごとに貯めたpt"),
        h("div", { class: "seg" }, [["week", "週"], ["month", "月"]].map(([u, l]) => h("button", { class: `seg-btn${chartUnit === u ? " active" : ""}`, onclick: () => { chartUnit = u; render(); } }, l)))),
      chart(series)),
    tabs,
    pointsView === "ledger" ? ledgerView(sm) : exchangeView(sm),
  ];
}

function ledgerView(sm) {
  const rows = sm.rows.slice(0, 80);
  return h("section", { class: "ledger card" }, rows.length ? rows.map((r) => h("div", { class: "ledger-row" },
    h("span", {}, Logic.short(r.date)), h("span", {}, r.reason), h("span", { class: r.amount > 0 ? "plus" : "minus" }, `${r.amount > 0 ? "+" : ""}${fmt(r.amount)}`))) : h("p", { class: "empty" }, "まだありません"));
}

let exchangeAmount = 0;
function exchangeView(sm) {
  const step = R().EXCHANGE_STEP;
  const max = Math.floor(sm.available / step) * step;
  if (exchangeAmount > max) exchangeAmount = max;
  if (exchangeAmount === 0 && max > 0) exchangeAmount = Math.min(max, step * 5);
  const reqs = [...state.requests].sort((a, b) => b.at - a.at);
  return h("section", { class: "card exchange" },
    h("p", {}, `交換できるのは ${fmt(sm.available)}pt（${yenText(sm.available)}）まで`),
    h("div", { class: "stepper" },
      h("button", { class: "step-btn", "aria-label": "へらす", disabled: exchangeAmount <= step, onclick: () => { exchangeAmount -= step; render(); } }, "−"),
      h("div", { class: "step-val", id: "ex-amount" }, `${fmt(exchangeAmount)}pt`, h("small", {}, ` = ${yenText(exchangeAmount)}`)),
      h("button", { class: "step-btn", "aria-label": "ふやす", disabled: exchangeAmount + step > max, onclick: () => { exchangeAmount += step; render(); } }, "＋")),
    h("button", {
      class: "btn primary", id: "ex-submit", disabled: !Logic.canExchange(state, inbox, day, exchangeAmount),
      onclick: () => {
        if (!Logic.canExchange(state, inbox, day, exchangeAmount)) return;
        state = { ...state, requests: [...state.requests, { id: Logic.newId(), date: day, amount: exchangeAmount, at: Date.now() }] };
        save();
        toast(`${coach()}に届いたよ`);
        exchangeAmount = 0;
        render();
      },
    }, `${coach()}と交換する`),
    max === 0 ? h("p", { class: "empty" }, `${fmt(step)}pt（${yenText(step)}）たまると交換できるよ`) : null,
    reqs.length ? h("div", {}, reqs.map((q) => {
      const done = inbox.decisions[q.id];
      return h("div", { class: `req ${done ? "done" : "pending"}` },
        h("span", {}, Logic.short(q.date)), h("span", {}, `${fmt(q.amount)}pt（${yenText(q.amount)}）`), h("span", {}, done ? "交換ずみ" : "申し込み中"));
    })) : null);
}

function tabsBar() {
  const items = [["home", "home", "ホーム"], ["goals", "goal", "目標"], ["self", "heart", "なりたい"], ["calendar", "cal", "シール帳"], ["points", "coin", "ポイント"]];
  return h("nav", { class: "tabs" }, items.map(([id, ic, label]) => h("button", {
    class: `tab${tab === id ? " active" : ""}`, id: `tab-${id}`, "aria-current": tab === id ? "page" : undefined,
    onclick: () => { tab = id; if (id === "calendar") { calMonth = Logic.monthKey(day); calSelected = day; } render(); window.scrollTo(0, 0); },
  }, icon(ic), h("span", {}, label))));
}

function render() {
  const stg = currentStage();
  setTheme(stg.index, profile.theme);
  if (!profile.name) {
    app.replaceChildren(onboarding());
    return;
  }
  const screens = { home: renderHome, goals: renderGoals, self: renderSelf, calendar: renderCalendar, points: renderPoints };
  app.replaceChildren(h("div", { class: "screen" }, screens[tab]()), tabsBar());
}

// ---- 最初の案内 ----
function onboarding() {
  const name = h("input", { class: "text", id: "ob-name", maxlength: 12, "aria-label": "あなたの名前" });
  const coachInput = h("input", { class: "text", id: "ob-coach", maxlength: 12, value: profile.coach || "にいに", "aria-label": "先生の呼び名" });
  return h("div", { class: "screen onboarding" },
    h("div", { class: "mascot-card card" }, h("div", { class: "mascot" }, mascot(0, 0)),
      h("div", { class: "speech" }, "はじめまして！貯金うさぎだよ。いっしょに、なりたい自分になろ〜")),
    h("div", { class: "card" },
      h("div", { class: "field" }, h("label", { for: "ob-name" }, "あなたの名前"), name),
      h("div", { class: "field" }, h("label", { for: "ob-coach" }, "コメントをくれる人の呼び名"), coachInput),
      h("p", { class: "sub" }, "名前はこのスマホの中だけに保存します。"),
      key ? null : h("p", { class: "sub" }, "※ にいにとつながる鍵がありません。にいにから届いたリンクから開いてね。"),
      h("button", {
        class: "btn primary", id: "ob-start",
        onclick: () => {
          const n = name.value.trim().slice(0, 12);
          if (!n) { toast("名前を入れてね"); name.focus(); return; }
          profile.name = n;
          profile.coach = coachInput.value.trim().slice(0, 12) || "にいに";
          saveProfile();
          render();
          if (pendingBonus) { loginBonus(pendingBonus); pendingBonus = null; }
        },
      }, "はじめる")));
}

// ---- 設定 ----
function openSettings() {
  openSheet((close) => {
    const stg = currentStage();
    const name = h("input", { class: "text", id: "set-name", maxlength: 12, value: profile.name });
    const coachInput = h("input", { class: "text", id: "set-coach", maxlength: 12, value: coach() });
    const themes = R().THEMES.map((t, i) => h("button", {
      class: `chip${(profile.theme || "lavender") === t ? " active" : ""}`, disabled: i > stg.index,
      onclick: () => { profile.theme = t; saveProfile(); close(); render(); },
    }, i > stg.index ? `🔒 ${THEME_NAMES[t]}` : THEME_NAMES[t]));
    const status = !key ? "にいにとつながっていません（届いたリンクから開いてね）"
      : syncError || (lastSync ? `つながっています（${new Date(lastSync).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}）` : "つないでいます…");
    return [
      h("h2", {}, "設定"),
      h("div", { class: "field" }, h("label", { for: "set-name" }, "名前"), name),
      h("div", { class: "field" }, h("label", { for: "set-coach" }, "コメントをくれる人の呼び名"), coachInput),
      h("button", { class: "btn", onclick: () => {
        profile.name = name.value.trim().slice(0, 12) || profile.name;
        profile.coach = coachInput.value.trim().slice(0, 12) || "にいに";
        saveProfile(); close(); render(); toast("保存したよ");
      } }, "名前を保存"),
      h("p", { class: "sub" }, "テーマの色（うさぎが育つと増えるよ）"),
      h("div", { class: "chips" }, themes),
      h("p", { class: "sub" }, "いつものタスク（毎日自動で入る）"),
      state.routines.length ? state.routines.map((r) => h("div", { class: "row-between" }, h("span", {}, r.title),
        h("button", { class: "btn small ghost", onclick: () => {
          state = { ...state, routines: state.routines.filter((x) => x.id !== r.id) };
          save(); close(); render(); toast("いつものから外したよ");
        } }, "外す"))) : h("p", { class: "empty" }, "なし（＋で追加するとき「いつもの」にできるよ）"),
      h("p", { class: "sub" }, `サーバー：${status}`),
    ];
  });
}


// ---- 起動 ----
// 日付が変わったとき・画面に戻ったときに、データとにいにの分を読み直す。
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") { push(); return; }
  if (Logic.today() !== day) { begin(); render(); }
  pull();
});
setInterval(() => { if (document.visibilityState === "visible") pull(); }, 60000);
window.addEventListener("online", () => pull());

if (!key) begin();
render();
pull().then(() => { if (!synced && key && !state.logins.includes(day)) { begin(); render(); } });
