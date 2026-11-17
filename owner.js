// なりたい自分へ — にいにの画面。生徒のデータを読み、コメント・タスク・交換を渡した記録を送る。

const OWNER_KEY_KEY = "naritai.owner.key";
const OWNER_PROFILE_KEY = "naritai.owner.profile";
const OWNER_CACHE_KEY = "naritai.owner.cache";
const app = document.getElementById("app");
const key = takeKeyFromUrl(OWNER_KEY_KEY);
let profile = { student: "", ...readJSON(OWNER_PROFILE_KEY, {}) };
const cache = readJSON(OWNER_CACHE_KEY, {});
let state = Logic.cleanState(cache.state);
let inbox = Logic.cleanInbox(cache.inbox);
let day = Logic.today();
let calMonth = Logic.monthKey(day);
let selected = day;
let stamp = "";
let target = "task";
let lastLoad = 0;
let error = "";
let sending = false;

const who = () => profile.student || "生徒";

async function load() {
  if (!key) { error = "鍵がありません。セットアップで作った「にいに用のリンク」から開いてください"; render(); return; }
  try {
    const data = await api("GET", "/api/owner", key);
    state = Logic.cleanState(data.state);
    inbox = Logic.cleanInbox(data.inbox);
    writeJSON(OWNER_CACHE_KEY, { state, inbox });
    lastLoad = Date.now();
    error = "";
  } catch (e) {
    error = e.status === 401 ? "鍵が違います。にいに用のリンクを開き直してください" : "サーバーにつながりません（前に読んだ分を表示しています）";
  }
  day = Logic.today();
  render();
}

async function send(path, body, okMessage) {
  if (sending) return false;
  sending = true;
  try {
    await api("POST", path, key, body);
    toast(okMessage);
    await load();
    return true;
  } catch (e) {
    toast(e.message || "送れませんでした");
    return false;
  } finally {
    sending = false;
  }
}

const time = (ms) => (ms ? new Date(ms).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "");

function summaryCard() {
  const sm = Logic.summary(state, inbox, day);
  const s = Logic.stats(Logic.tasksOn(state, inbox, day));
  const st = Logic.streak(state, inbox, day);
  const stg = Logic.stage(sm.earned);
  return h("section", { class: "card owner-summary" },
    h("div", { class: "row-between" }, h("strong", {}, `${who()}のようす`), h("small", { class: "sub" }, state.updatedAt ? `最終更新 ${Logic.short(Logic.today(new Date(state.updatedAt)))} ${time(state.updatedAt)}` : "まだデータがありません")),
    h("div", { class: "owner-head" },
      h("div", { class: "mascot" }, mascot(stg.index, Logic.coins(sm.balance), 96)),
      h("div", {},
        h("div", { id: "o-today" }, `今日 ${s.done}/${s.total}  ${Math.round(s.rate * 100)}%`),
        h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${Math.round(s.rate * 100)}%` } })),
        h("div", {}, `🔥${st.days}日連続  ${STAGE_NAMES[stg.index]}`),
        h("div", { id: "o-balance" }, `💰 ${fmt(sm.balance)}pt`),
        h("div", { class: "delta" }, `今週 +${fmt(sm.thisWeek)}pt`))));
}

function requestsCard() {
  const pending = state.requests.filter((q) => !inbox.decisions[q.id]).sort((a, b) => a.at - b.at);
  if (!pending.length) return null;
  return h("section", { class: "card" },
    h("strong", {}, `🔔 交換の申し込み ${pending.length}件`),
    pending.map((q) => h("div", { class: "req pending" },
      h("span", {}, Logic.short(q.date)),
      h("span", {}, `${fmt(q.amount)}pt（${yenText(q.amount)}）`),
      h("div", { class: "req-actions" }, h("button", {
        class: "btn small primary", "data-req": q.id,
        onclick: () => { if (confirm(`${yenText(q.amount)}を渡しましたか？`)) send("/api/owner/decide", { id: q.id }, "渡した記録をつけました"); },
      }, "渡した")))));
}

function tasksCard(date) {
  const tasks = Logic.tasksOn(state, inbox, date);
  return h("section", { class: "card" },
    h("strong", {}, `${Logic.dateLabel(date)} のタスク`),
    tasks.length ? h("div", { class: "task-list" }, tasks.map((t) => h("div", { class: `task${t.done ? " done" : ""}` },
      h("span", { class: "check", "aria-hidden": "true" }),
      h("span", { class: "title" }, t.title),
      t.from === "owner" ? h("span", { class: "tag" }, "にいにから") : t.from === "routine" ? h("span", { class: "tag" }, "いつもの") : null,
      t.area ? areaTag(state, t.area) : null,
      h("span", { class: "pt" }, t.done ? time(t.doneAt) : ""),
      t.from === "owner" && !t.done ? h("button", { class: "btn small ghost", onclick: () => send("/api/owner/delete", { type: "task", id: t.id }, "取り消しました") }, "取消") : null))) : h("p", { class: "empty" }, "タスクはありません"));
}

function commentForm(date) {
  const text = h("textarea", { class: "text", id: "o-comment", maxlength: Logic.RULES.MAX_COMMENT, rows: 2, placeholder: "例：今日もえらい！", "aria-label": "コメント" });
  const stamps = h("div", { class: "stamp-row" });
  const drawStamps = () => stamps.replaceChildren(...Logic.STAMPS.filter(Boolean).map((s) => h("button", {
    class: `stamp${stamp === s ? " active" : ""}`, "aria-label": `スタンプ ${s}`, onclick: () => { stamp = stamp === s ? "" : s; drawStamps(); },
  }, s)));
  drawStamps();
  const comments = inbox.comments.filter((c) => c.date === date).sort((a, b) => a.at - b.at);
  return h("section", { class: "card" },
    h("strong", {}, `${Logic.dateLabel(date)} へのコメント`),
    comments.map((c) => h("div", { class: "row-between comment-sent" }, h("span", {}, `${c.stamp} ${c.text}`),
      h("button", { class: "btn small ghost", onclick: () => { if (confirm("このコメントを消しますか？")) send("/api/owner/delete", { type: "comment", id: c.id }, "消しました"); } }, "消す"))),
    text, stamps,
    h("button", {
      class: "btn primary", id: "o-send-comment",
      onclick: async () => {
        if (!text.value.trim() && !stamp) { toast("コメントかスタンプを入れてください"); return; }
        if (await send("/api/owner/comment", { date, text: text.value, stamp }, "送りました")) stamp = "";
      },
    }, "送る"));
}

function taskForm(date) {
  const input = h("input", { class: "text", id: "o-task", maxlength: Logic.RULES.MAX_TITLE, placeholder: "例：理科のまとめ", "aria-label": "送るタスク" });
  const seg = h("div", { class: "seg" });
  const drawSeg = () => seg.replaceChildren(...[["task", "この日のタスク"], ["week", "今週の目標"], ["month", "今月の目標"]].map(([v, l]) => h("button", {
    class: `seg-btn${target === v ? " active" : ""}`, onclick: () => { target = v; drawSeg(); },
  }, l)));
  drawSeg();
  let area = "";
  const picker = areaPicker(state, area, (v) => { area = v; });
  const goals = ["week", "month"].flatMap((k) => inbox.tasks.filter((t) => t.kind === k && t.period === Logic.periodOf(k, day)));
  return h("section", { class: "card" },
    h("strong", {}, `＋ ${who()}にタスク・目標を送る`),
    input, seg,
    state.areas.length ? h("div", {}, h("p", { class: "sub" }, "分野（えらばなくてもOK）"), picker.el) : null,
    h("button", {
      class: "btn", id: "o-send-task",
      onclick: () => {
        const title = input.value.trim();
        if (!title) { toast("タスクを入れてください"); return; }
        const body = { ...(target === "task" ? { kind: "task", date, title } : { kind: target, period: Logic.periodOf(target, day), title }), ...(area ? { area } : {}) };
        send("/api/owner/task", body, "送りました");
      },
    }, "送る"),
    goals.length ? h("div", {}, h("p", { class: "sub" }, "送った目標（今週・今月）"), goals.map((g) => {
      const done = Boolean(state.ownerDone[g.id]);
      return h("div", { class: "row-between" }, h("span", {}, `${done ? "✅" : "⬜"} ${g.kind === "week" ? "週" : "月"}：${g.title}`),
        done ? null : h("button", { class: "btn small ghost", onclick: () => send("/api/owner/delete", { type: "task", id: g.id }, "取り消しました") }, "取消"));
    })) : null);
}

// 生徒の「なりたい自分」（振り返りシート）。見るだけ。
function selfCard() {
  if (state.areas.length < Logic.RULES.MIN_AREAS) {
    return h("section", { class: "card" }, h("strong", {}, "なりたい自分"), h("p", { class: "empty" }, `${who()}はまだ分野を決めていません`));
  }
  const r = Logic.radar(state, day);
  const done = Logic.reflectionOf(state, Logic.weekKey(day));
  const steps = Logic.roadmapSteps(state, day);
  return h("section", { class: "card self-radar" },
    h("div", { class: "row-between" }, h("strong", {}, "なりたい自分"), h("small", { class: "sub" }, done ? `今週の振り返り済み（${Logic.short(done.date)}）` : "今週の振り返りはまだ")),
    radarChart(r),
    h("div", { class: "radar-legend" },
      h("span", { class: "lg target" }, "なりたい点数"),
      r.prev ? h("span", { class: "lg prev" }, `前回 ${Logic.short(r.prevWeek)}週`) : null,
      r.now ? h("span", { class: "lg now" }, `今回 ${Logic.short(r.nowWeek)}週`) : null),
    h("p", { class: "sub" }, "今週がんばった数（分野ごと）"),
    areaBars(state, Logic.areaActivity(state, inbox, day)),
    steps.length ? h("div", {}, h("p", { class: "sub" }, `道のり（${Logic.short(state.roadmap.start)} から）`),
      steps.map((st) => h("div", { class: "row-between" }, h("span", {}, `${st.done ? "✅" : "⬜"} ${st.label} ${Logic.short(st.date)}`), h("span", {}, st.title || "—")))) : h("p", { class: "sub" }, "道のりはまだ作っていません"));
}

function goalsCard() {
  const rows = ["week", "month"].map((k) => {
    const p = Logic.periodOf(k, day);
    const goals = Logic.goalsFor(state, inbox, k, p);
    const s = Logic.stats(goals);
    return h("div", {}, h("p", { class: "sub" }, `${k === "week" ? "今週" : "今月"}の目標 ${Logic.periodLabel(k, p)}  ${s.done}/${s.total}`),
      goals.map((g) => h("div", {}, `${g.done ? "✅" : "⬜"} ${g.title}${g.from === "owner" ? "（にいにから）" : ""}`)));
  });
  return h("section", { class: "card" }, h("strong", {}, "目標の進み具合"), rows);
}

function chartCard() {
  const sm = Logic.summary(state, inbox, day);
  const weeks = Logic.series(sm.rows, "week", day, 8);
  const rate = (wk) => {
    let total = 0; let done = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = Logic.addDays(wk, i);
      if (d > day) break;
      const s = Logic.stats(Logic.tasksOn(state, inbox, d));
      total += s.total; done += s.done;
    }
    return total ? Math.round((done / total) * 100) : 0;
  };
  const wk = Logic.weekKey(day);
  return h("section", { class: "card" },
    h("div", { class: "row-between" }, h("strong", {}, "週ごとに貯めたpt"), h("span", {}, `今週の達成率 ${rate(wk)}%（先週 ${rate(Logic.addDays(wk, -7))}%）`)),
    chart(weeks),
    h("p", { class: "sub" }, `これまでに貯めた ${fmt(sm.earned)}pt / 交換した ${fmt(sm.exchanged)}pt / 申し込み中 ${fmt(sm.pending)}pt`));
}

function settingsCard() {
  const input = h("input", { class: "text", id: "o-student", maxlength: 12, value: profile.student, "aria-label": "生徒の名前" });
  return h("details", { class: "card" }, h("summary", {}, "設定"),
    h("div", { class: "field" }, h("label", { for: "o-student" }, "生徒の名前（このスマホの中だけに保存）"), input),
    h("button", { class: "btn small", onclick: () => { profile.student = input.value.trim().slice(0, 12); writeJSON(OWNER_PROFILE_KEY, profile); render(); } }, "保存"),
    h("p", { class: "sub" }, lastLoad ? `最後に読んだ時刻 ${time(lastLoad)}` : ""));
}

function render() {
  setTheme(0, "lavender");
  const stg = Logic.stage(Logic.summary(state, inbox, day).earned);
  const cal = calendar({
    state, inbox, month: calMonth, selected, today: day, stageIndex: stg.index,
    onMonth: (m) => { calMonth = m; render(); },
    onSelect: (d) => { selected = d; render(); },
  });
  app.replaceChildren(h("div", { class: "screen owner" },
    h("header", { class: "topbar" }, h("div", { class: "title" }, `にいにの画面`), h("button", { class: "icon-btn", "aria-label": "読み直す", onclick: load }, "↻")),
    error ? h("p", { class: "banner", id: "o-error" }, error) : null,
    summaryCard(),
    requestsCard(),
    tasksCard(selected),
    commentForm(selected),
    taskForm(selected),
    cal.el,
    selfCard(),
    goalsCard(),
    chartCard(),
    settingsCard()));
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(); });
setInterval(() => { if (document.visibilityState === "visible" && !document.activeElement.matches("input, textarea")) load(); }, 30000);
render();
load();
