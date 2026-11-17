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
  const pend = Logic.pendingAwards(state, inbox, day);
  return h("section", { class: "card owner-summary" },
    h("div", { class: "row-between" }, h("strong", {}, `${who()}のようす`), h("small", { class: "sub" }, state.updatedAt ? `最終更新 ${Logic.short(Logic.today(new Date(state.updatedAt)))} ${time(state.updatedAt)}` : "まだデータがありません")),
    h("div", { class: "owner-head" },
      h("div", { class: "mascot" }, mascot(stg.index, Logic.coins(sm.balance), 96)),
      h("div", {},
        h("div", { id: "o-today" }, `今日 ${s.done}/${s.total}  ${Math.round(s.rate * 100)}%`),
        h("div", { class: "progress" }, h("div", { class: "progress-fill", style: { width: `${Math.round(s.rate * 100)}%` } })),
        h("div", {}, `🔥${st.days}日連続  ${STAGE_NAMES[stg.index]}`),
        h("div", { id: "o-balance" }, `💰 ${fmt(sm.balance)}pt`),
        h("div", { class: "delta" }, `今週 +${fmt(sm.thisWeek)}pt`))),
    pend.length ? h("div", { class: "pending-box", id: "o-pending" }, h("span", {}, "🔔 査定まち"), pend.map((p) => h("button", {
      class: "chip", onclick: () => { selected = p.date; calMonth = Logic.monthKey(p.date); render(); },
    }, `${Logic.short(p.date)} ${p.count}件`))) : null,
    h("a", { class: "btn small ghost preview-link", id: "o-preview", href: "index.html?preview=1" }, "生徒の画面を見る（さわっても保存されません）"));
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

// その日に配れるpt。ふだん2,000pt、＋−でその日だけ変えられる。
function budgetRow(tasks, date) {
  const R = Logic.RULES;
  const budget = Logic.budgetOf(inbox, date);
  const given = Logic.awardedOf(tasks);
  const set = (pt) => send("/api/owner/budget", { date, pt }, `この日に配れる分を ${fmt(pt)}pt にしました`);
  return h("div", { class: "budget-row", id: "o-budget" },
    h("div", {}, h("b", {}, `配れる ${fmt(budget)}pt`), h("span", { class: "sub" }, ` のうち ${fmt(given)}pt 配った（のこり ${fmt(budget - given)}pt）`)),
    h("div", { class: "stepper" },
      h("button", { class: "step-btn small", "aria-label": "配れる分をへらす", disabled: budget - R.BUDGET_STEP < Math.max(R.BUDGET_STEP, given), onclick: () => set(budget - R.BUDGET_STEP) }, "−"),
      h("button", { class: "step-btn small", "aria-label": "配れる分をふやす", disabled: budget + R.BUDGET_STEP > R.MAX_DAY_BUDGET, onclick: () => set(budget + R.BUDGET_STEP) }, "＋")));
}

// 終えたタスクに、にいにがptを入れる欄。
const editingAward = new Set();
function awardRow(t, st, date) {
  if (!Logic.awardMode(date) || !t.done) return null;
  if (t.award !== undefined && !editingAward.has(t.id)) {
    return h("div", { class: "owner-award" }, h("span", { class: "sub" }, `にいにが決めた：+${fmt(t.award)}pt`),
      h("button", { class: "btn small ghost", onclick: () => { editingAward.add(t.id); render(); } }, "直す"));
  }
  const budget = Logic.budgetOf(inbox, date);
  const input = h("input", { class: "text award-input", type: "number", inputmode: "numeric", min: 0, max: budget, step: 10,
    value: String(t.award !== undefined ? t.award : Logic.suggestPt(st, t.w, budget)), "aria-label": `「${t.title}」のpt` });
  return h("div", { class: "owner-award" }, input, h("span", {}, "pt"),
    h("button", { class: "btn small award-ok", onclick: async () => {
      const pt = Math.round(Number(input.value) / 10) * 10;
      if (!Logic.validAward(pt)) { toast(`0〜${fmt(budget)}pt で入れてください`); return; }
      editingAward.delete(t.id);
      await send("/api/owner/award", { id: t.id, pt }, `「${t.title}」を +${fmt(pt)}pt にしました`);
    } }, "決定"));
}

// その日の日記（生徒が書いたもの）。
function diaryCard(date) {
  const e = state.diary[date];
  return h("section", { class: "card", id: "o-diary" }, h("strong", {}, `📔 ${Logic.dateLabel(date)} の日記`),
    e ? Logic.RULES.DIARY_ITEMS.map((it) => (e[it.key] ? h("div", { class: "diary-item" }, h("span", { class: "diary-label" }, it.label), h("p", { class: "diary-body" }, e[it.key])) : null))
      : h("p", { class: "empty" }, "まだ書いていません"));
}

function tasksCard(date) {
  const tasks = Logic.tasksOn(state, inbox, date);
  const st = Logic.stats(tasks);
  return h("section", { class: "card" },
    h("div", { class: "row-between" }, h("strong", {}, `${Logic.dateLabel(date)} のタスク`), st.total ? h("span", { class: "sub" }, `${st.done}/${st.total}  +${fmt(Logic.dayPt(tasks, date, inbox))}pt`) : null),
    Logic.awardMode(date) ? budgetRow(tasks, date) : null,
    tasks.length ? h("p", { class: "sub" }, Logic.awardMode(date) ? "終えたタスクに、1個ずつptを入れてください（はじめは★から出したおすすめの数）" : "pt は1個ずつの分（自動の計算の日）。★を押すと、むずかしさを直せます") : null,
    tasks.length ? h("div", { class: "task-list" }, tasks.map((t) => h("div", { class: `task owner-task${t.done ? " done" : ""}`, "data-id": t.id },
      h("div", { class: "owner-task-top" },
        h("span", { class: "check", "aria-hidden": "true" }),
        h("span", { class: "title" }, t.title),
        h("span", { class: "owner-pt" }, h("b", { class: "o-task-pt" }, !Logic.awardMode(date) ? `+${fmt(Logic.perTaskPt(st, t.w))}pt` : !t.done ? "" : t.award !== undefined ? `+${fmt(t.award)}pt` : "査定まち"), h("small", { class: "sub" }, t.done ? `✓ ${time(t.doneAt)}` : "まだ"))),
      awardRow(t, st, date),
      h("div", { class: "owner-task-tags" },
        h("div", { class: "level-pick", role: "group", "aria-label": "むずかしさ" }, Logic.RULES.LEVELS.map((l) => h("button", {
          class: `level-btn${t.level === l.key ? " active" : ""}`, "data-level": l.key, title: l.label,
          onclick: () => { if (t.level !== l.key) send("/api/owner/level", { id: t.id, level: l.key }, `「${t.title}」を${l.label}にしました`); },
        }, l.stars))),
        h("span", { class: "o-level-name" }, Logic.levelInfo(t.level).label),
        t.fixedBy ? h("span", { class: "tag" }, "にいにが直した") : null,
        Logic.isLate(t) ? h("span", { class: "tag late-tag" }, `あとから（${Logic.short(t.added)}に追加）`) : null,
        t.from === "owner" ? h("span", { class: "tag" }, "にいにから") : t.from === "routine" ? h("span", { class: "tag" }, "いつもの") : null,
        t.area ? areaTag(state, t.area) : null,
        t.from === "owner" && !t.done ? h("button", { class: "btn small ghost", onclick: () => send("/api/owner/delete", { type: "task", id: t.id }, "取り消しました") }, "取消") : null)))) : h("p", { class: "empty" }, "タスクはありません"));
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
  let level = "normal";
  const levelSeg = h("div", { class: "seg level-seg" });
  const drawLevel = () => levelSeg.replaceChildren(...Logic.RULES.LEVELS.map((l) => h("button", {
    class: `seg-btn${level === l.key ? " active" : ""}`, "data-level": l.key, onclick: () => { level = l.key; drawLevel(); },
  }, `${l.stars} ${l.label}`)));
  drawLevel();
  const picker = areaPicker(state, area, (v) => { area = v; });
  const goals = ["week", "month"].flatMap((k) => inbox.tasks.filter((t) => t.kind === k && t.period === Logic.periodOf(k, day)));
  return h("section", { class: "card" },
    h("strong", {}, `＋ ${who()}にタスク・目標を送る`),
    input, seg,
    h("p", { class: "sub" }, "むずかしさ（この日のタスクのとき）"), levelSeg,
    state.areas.length ? h("div", {}, h("p", { class: "sub" }, "分野（えらばなくてもOK）"), picker.el) : null,
    h("button", {
      class: "btn", id: "o-send-task",
      onclick: () => {
        const title = input.value.trim();
        if (!title) { toast("タスクを入れてください"); return; }
        const body = { ...(target === "task" ? { kind: "task", date, title } : { kind: target, period: Logic.periodOf(target, day), title }), ...(area ? { area } : {}), ...(target === "task" && level !== "normal" ? { level } : {}) };
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

// 難易度の重み。1日の上限1,500ptを、重みの割合で配る。
function weightsCard() {
  const w = { ...inbox.weights };
  const L = Logic.RULES.LEVELS;
  const example = h("p", { class: "sub", id: "o-weight-example" });
  const drawExample = () => {
    // 例：かんたん・ふつう・むずかしいを1個ずつ入れた日
    const tasks = L.map((l) => ({ done: true, w: w[l.key], wn: w.normal }));
    const st = Logic.stats(tasks);
    const b = Logic.RULES.AWARD_DAY_PT;
    example.textContent = `おすすめの例：1個ずつの日 → ${L.map((l) => `${l.label} ${fmt(Logic.suggestPt(st, w[l.key], b))}pt`).join(" / ")}`;
  };
  const rows = L.map((l) => {
    const val = h("b", { class: "step-val small-val", id: `o-w-${l.key}` }, String(w[l.key]));
    const change = (d) => { w[l.key] = Math.min(Logic.RULES.MAX_WEIGHT, Math.max(1, w[l.key] + d)); val.textContent = String(w[l.key]); drawExample(); };
    return h("div", { class: "row-between weight-row" }, h("span", {}, `${l.stars} ${l.label}`),
      h("div", { class: "stepper" }, h("button", { class: "step-btn small", "aria-label": `${l.label}をへらす`, onclick: () => change(-1) }, "−"), val,
        h("button", { class: "step-btn small", "aria-label": `${l.label}をふやす`, onclick: () => change(1) }, "＋")));
  });
  drawExample();
  return h("section", { class: "card" },
    h("strong", {}, "むずかしさとポイント"),
    h("p", { class: "sub" }, `ptを入れるときの「おすすめ」の割合です。その日に配れる分（ふだん ${fmt(Logic.RULES.AWARD_DAY_PT)}pt）を、重みの割合で分けます（1〜${Logic.RULES.MAX_WEIGHT}）`),
    rows, example,
    h("button", { class: "btn", id: "o-save-weights", onclick: () => send("/api/owner/weights", w, "重みを保存しました") }, "保存"));
}

// 罰：うそなどが分かったとき、理由つきでポイントを引く。間違えたら取り消せる。
function penaltyCard() {
  const R = Logic.RULES;
  let amount = 300;
  const val = h("b", { class: "step-val small-val", id: "o-pen-amount" }, `${fmt(amount)}pt`);
  const change = (d) => { amount = Math.min(R.MAX_PENALTY, Math.max(R.PENALTY_STEP, amount + d)); val.textContent = `${fmt(amount)}pt`; };
  const reason = h("input", { class: "text", id: "o-pen-reason", type: "text", maxlength: R.MAX_REASON, placeholder: "理由（例：やってないのに完了にした）", "aria-label": "理由" });
  const list = [...inbox.penalties].reverse().slice(0, 10);
  return h("section", { class: "card" },
    h("strong", {}, "ポイントを引く"),
    h("p", { class: "sub" }, "約束をやぶったときに。理由は生徒の通帳に出ます"),
    h("div", { class: "row-between" }, h("span", {}, "引く数"),
      h("div", { class: "stepper" }, h("button", { class: "step-btn small", "aria-label": "へらす", onclick: () => change(-R.PENALTY_STEP) }, "−"), val,
        h("button", { class: "step-btn small", "aria-label": "ふやす", onclick: () => change(R.PENALTY_STEP) }, "＋"))),
    reason,
    h("button", { class: "btn", id: "o-pen-send", onclick: () => {
      if (!reason.value.trim()) { toast("理由を入れてください"); return; }
      if (!confirm(`${fmt(amount)}pt を引きます。よいですか？`)) return;
      send("/api/owner/penalty", { amount, reason: reason.value }, `${fmt(amount)}pt 引きました`);
    } }, "引く"),
    list.length ? h("div", { class: "pen-list" }, list.map((p) => h("div", { class: "row-between ledger-row" },
      h("span", {}, `${Logic.short(p.date)} −${fmt(p.amount)}pt ${p.reason}`),
      h("button", { class: "btn small ghost", onclick: () => send("/api/owner/delete", { type: "penalty", id: p.id }, "取り消しました") }, "取消")))) : null);
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
    diaryCard(selected),
    commentForm(selected),
    taskForm(selected),
    cal.el,
    selfCard(),
    weightsCard(),
    penaltyCard(),
    goalsCard(),
    chartCard(),
    settingsCard()));
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(); });
setInterval(() => { if (document.visibilityState === "visible" && !document.activeElement.matches("input, textarea")) load(); }, 30000);
render();
load();
