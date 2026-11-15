// なりたい自分へ — アプリの「頭脳」。画面にもサーバーにも触らず、データの計算だけをする。
// 生徒の画面（app.js）・にいにの画面（owner.js）・サーバー（server/index.js）が、同じこのファイルを使う。
//
// データは2つに分かれている。
//   state … 生徒のスマホが書くもの（タスク・目標・ログイン・スクラッチ・交換の申し込み）
//   inbox … にいにが書くもの（コメント・にいにからのタスクと目標・交換を渡した記録）
// 2人が同じデータを書き換えないので、食い違いが起きない。
// ポイントは保存せず、毎回この2つから計算する（数え間違い・二重取りが起きない）。

const Logic = (() => {
  const R = typeof RULES !== "undefined" ? RULES : require("./config.js").RULES;

  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const MONTH = /^\d{4}-\d{2}$/;
  const ID = /^[a-z0-9]{6,32}$/;
  const pad = (n) => String(n).padStart(2, "0");

  // ---- 日付 ----
  // offsetMinutes は世界標準時との差。端末では端末の時差、サーバーでは日本の +540 を使う。
  function today(now = new Date(), offsetMinutes = -now.getTimezoneOffset()) {
    const d = new Date(now.getTime() + (offsetMinutes - R.DAY_START_HOUR * 60) * 60000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  function addDays(date, days) {
    const [y, m, d] = date.split("-").map(Number);
    const r = new Date(Date.UTC(y, m - 1, d + days));
    return `${r.getUTCFullYear()}-${pad(r.getUTCMonth() + 1)}-${pad(r.getUTCDate())}`;
  }

  const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
  const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=日
  // 週は月曜はじまり。週の名前は、その週の月曜の日付。
  const weekKey = (date) => addDays(date, -((weekday(date) + 6) % 7));
  const monthKey = (date) => date.slice(0, 7);
  const periodOf = (kind, date) => (kind === "week" ? weekKey(date) : monthKey(date));

  function monthDays(month) {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }

  function addMonths(month, n) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  }

  function periodLabel(kind, period) {
    if (kind === "month") return `${Number(period.slice(5, 7))}月`;
    const end = addDays(period, 6);
    return `${short(period)}〜${short(end)}`;
  }

  const short = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const WEEK_JA = ["日", "月", "火", "水", "木", "金", "土"];
  const dateLabel = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日(${WEEK_JA[weekday(date)]})`;

  function daysLeft(kind, period, todayStr) {
    const end = kind === "week" ? addDays(period, 6) : `${period}-${pad(monthDays(period))}`;
    return Math.max(0, daysBetween(todayStr, end));
  }

  // ---- 空のデータ ----
  const emptyState = () => ({
    v: 1, tasks: [], ownerDone: {}, goals: [], routines: [], logins: [], scratches: {}, requests: [], updatedAt: 0,
  });
  const emptyInbox = () => ({ v: 1, comments: [], tasks: [], decisions: {}, updatedAt: 0 });

  function newId(now = Date.now()) {
    return `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
  }

  // ---- 外から来たデータを確かめる ----
  // サーバー・ファイル・スマホの保存から読んだものは、形を確かめ、おかしなものは捨てる。
  // 新しいオブジェクトに必要な所だけ写すので、__proto__ などの仕込みも入らない。
  const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  const str = (x, max) => (typeof x === "string" ? x.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
  const num = (x) => (Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  const list = (x, max) => (Array.isArray(x) ? x.slice(-max) : []);

  function cleanMap(x, ok, value) {
    const out = {};
    if (!isObj(x)) return out;
    for (const key of Object.keys(x)) {
      if (ok(key)) {
        const v = value(x[key]);
        if (v !== null) out[key] = v;
      }
    }
    return out;
  }

  function cleanState(x) {
    const s = emptyState();
    if (!isObj(x)) return s;
    const seen = new Set();
    s.tasks = list(x.tasks, R.MAX_TASKS).filter((t) => isObj(t) && ID.test(t.id) && DATE.test(t.date) && str(t.title, R.MAX_TITLE))
      .filter((t) => !seen.has(t.id) && seen.add(t.id))
      .map((t) => ({
        id: t.id, date: t.date, title: str(t.title, R.MAX_TITLE), done: t.done === true, doneAt: num(t.doneAt),
        ...(typeof t.routine === "string" && ID.test(t.routine) ? { routine: t.routine } : {}),
      }));
    s.ownerDone = cleanMap(x.ownerDone, (k) => ID.test(k), (v) => (num(v) > 0 ? num(v) : null));
    s.goals = list(x.goals, R.MAX_GOALS).filter((g) => isObj(g) && ID.test(g.id) && (g.kind === "week" || g.kind === "month")
      && (g.kind === "week" ? DATE.test(g.period) : MONTH.test(g.period)) && str(g.title, R.MAX_TITLE))
      .map((g) => ({ id: g.id, kind: g.kind, period: g.period, title: str(g.title, R.MAX_TITLE), done: g.done === true, doneAt: num(g.doneAt) }));
    s.routines = list(x.routines, R.MAX_ROUTINES).filter((r) => isObj(r) && ID.test(r.id) && str(r.title, R.MAX_TITLE))
      .map((r) => ({ id: r.id, title: str(r.title, R.MAX_TITLE) }));
    s.logins = [...new Set(list(x.logins, 5000).filter((d) => typeof d === "string" && DATE.test(d)))].sort();
    const amounts = new Set(R.SCRATCH.map((p) => p.pt));
    s.scratches = cleanMap(x.scratches, (k) => DATE.test(k), (v) => (amounts.has(v) ? v : null));
    s.requests = list(x.requests, R.MAX_REQUESTS).filter((q) => isObj(q) && ID.test(q.id) && DATE.test(q.date)
      && Number.isInteger(q.amount) && q.amount > 0 && q.amount % R.EXCHANGE_STEP === 0 && q.amount <= 10000000)
      .map((q) => ({ id: q.id, date: q.date, amount: q.amount, at: num(q.at) }));
    s.updatedAt = num(x.updatedAt);
    return s;
  }

  const STAMPS = ["💯", "👏", "⭐", "🔥", "🌸", "🎉", "🫶", ""];

  function cleanInbox(x) {
    const b = emptyInbox();
    if (!isObj(x)) return b;
    b.comments = list(x.comments, R.MAX_COMMENTS).filter((c) => isObj(c) && ID.test(c.id) && DATE.test(c.date) && (str(c.text, R.MAX_COMMENT) || STAMPS.includes(c.stamp) && c.stamp))
      .map((c) => ({ id: c.id, date: c.date, text: str(c.text, R.MAX_COMMENT), stamp: STAMPS.includes(c.stamp) ? c.stamp : "", at: num(c.at) }));
    b.tasks = list(x.tasks, R.MAX_OWNER_TASKS).filter((t) => isObj(t) && ID.test(t.id) && str(t.title, R.MAX_TITLE) && (
      (t.kind === "task" && DATE.test(t.date)) || (t.kind === "week" && DATE.test(t.period)) || (t.kind === "month" && MONTH.test(t.period))))
      .map((t) => ({ id: t.id, kind: t.kind, title: str(t.title, R.MAX_TITLE), at: num(t.at), ...(t.kind === "task" ? { date: t.date } : { period: t.period }) }));
    b.decisions = cleanMap(x.decisions, (k) => ID.test(k), (v) => (isObj(v) && DATE.test(v.date) ? { date: v.date, at: num(v.at) } : null));
    b.updatedAt = num(x.updatedAt);
    return b;
  }

  // ---- その日のタスク ----
  // 生徒が入れたタスクと、にいにから届いたタスクを合わせた一覧。
  function tasksOn(state, inbox, date) {
    const own = state.tasks.filter((t) => t.date === date).map((t) => ({ ...t, from: t.routine ? "routine" : "self" }));
    const fromOwner = inbox.tasks.filter((t) => t.kind === "task" && t.date === date).map((t) => ({
      id: t.id, date, title: t.title, from: "owner", done: Boolean(state.ownerDone[t.id]), doneAt: state.ownerDone[t.id] || 0,
    }));
    return [...fromOwner, ...own];
  }

  function stats(tasks) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    return { total, done, rate: total ? done / total : 0 };
  }

  const round10 = (x) => Math.round(x / 10) * 10;
  const taskPt = (s) => round10(R.DAY_TASK_PT * s.done / Math.max(s.total, R.MIN_TASKS));
  const isComplete = (s) => s.total >= R.MIN_TASKS && s.done === s.total;
  // その日のタスクを1個終えると増えるポイント（画面の「+〇pt」の表示用）。
  const perTaskPt = (s) => round10(R.DAY_TASK_PT / Math.max(s.total, R.MIN_TASKS));

  function goalsFor(state, inbox, kind, period) {
    const own = state.goals.filter((g) => g.kind === kind && g.period === period).map((g) => ({ ...g, from: "self" }));
    const fromOwner = inbox.tasks.filter((t) => t.kind === kind && t.period === period).map((t) => ({
      id: t.id, kind, period, title: t.title, from: "owner", done: Boolean(state.ownerDone[t.id]), doneAt: state.ownerDone[t.id] || 0,
    }));
    return [...fromOwner, ...own];
  }

  const goalPt = (kind, s) => (s.total ? round10((kind === "week" ? R.WEEK_GOAL_PT : R.MONTH_GOAL_PT) * s.done / s.total) : 0);

  // タスクのある日すべて（今日まで）。
  function taskDates(state, inbox, todayStr) {
    const dates = new Set(state.tasks.map((t) => t.date));
    for (const t of inbox.tasks) if (t.kind === "task") dates.add(t.date);
    return [...dates].filter((d) => d <= todayStr).sort();
  }

  const activeOn = (state, inbox, date) => tasksOn(state, inbox, date).some((t) => t.done);

  // ---- 通帳（ポイントの出入り）----
  // 新しい順。1日のタスクの分は、その日の終えた割合で計算する（今日の分は終えるたびに増える）。
  function ledger(state, inbox, todayStr) {
    const rows = [];
    state.logins.filter((d) => d <= todayStr).forEach((date, i) => {
      rows.push({ date, amount: R.LOGIN_BONUS[i % R.LOGIN_BONUS.length], reason: `ログインボーナス ${(i % R.LOGIN_BONUS.length) + 1}日目`, kind: "login", order: 1 });
    });
    let completeCount = 0;
    for (const date of taskDates(state, inbox, todayStr)) {
      const s = stats(tasksOn(state, inbox, date));
      const pt = taskPt(s);
      if (pt > 0) rows.push({ date, amount: pt, reason: `今日のタスク ${Math.round(s.rate * 100)}%`, kind: "task", order: 2 });
      if (isComplete(s)) {
        completeCount += 1;
        if (completeCount % R.STAMP_FULL === 0) rows.push({ date, amount: R.STAMP_BONUS, reason: "スタンプカード満タン", kind: "stamp", order: 4 });
      }
    }
    for (const date of Object.keys(state.scratches)) {
      if (date <= todayStr) rows.push({ date, amount: state.scratches[date], reason: "ボーナススクラッチ", kind: "scratch", order: 3 });
    }
    for (const kind of ["week", "month"]) {
      const periods = new Set(state.goals.filter((g) => g.kind === kind).map((g) => g.period));
      for (const t of inbox.tasks) if (t.kind === kind) periods.add(t.period);
      for (const period of periods) {
        const goals = goalsFor(state, inbox, kind, period);
        const pt = goalPt(kind, stats(goals));
        if (pt <= 0) continue;
        const last = Math.max(...goals.filter((g) => g.done).map((g) => g.doneAt));
        const date = last > 0 ? today(new Date(last)) : (kind === "week" ? period : `${period}-01`);
        rows.push({ date: date > todayStr ? todayStr : date, amount: pt, reason: kind === "week" ? `今週の目標 ${periodLabel(kind, period)}` : `今月の目標 ${periodLabel(kind, period)}`, kind: "goal", order: 5 });
      }
    }
    for (const q of state.requests) {
      const d = inbox.decisions[q.id];
      if (d) rows.push({ date: d.date, amount: -q.amount, reason: "にいにと交換", kind: "exchange", order: 6 });
    }
    return rows.sort((a, b) => (a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1));
  }

  function summary(state, inbox, todayStr) {
    const rows = ledger(state, inbox, todayStr);
    const earned = rows.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
    const exchanged = rows.filter((r) => r.amount < 0).reduce((a, r) => a - r.amount, 0);
    const balance = earned - exchanged;
    const pending = state.requests.filter((q) => !inbox.decisions[q.id]).reduce((a, q) => a + q.amount, 0);
    const week = weekKey(todayStr);
    const thisWeek = rows.filter((r) => r.amount > 0 && weekKey(r.date) === week).reduce((a, r) => a + r.amount, 0);
    const todayPt = rows.filter((r) => r.amount > 0 && r.date === todayStr).reduce((a, r) => a + r.amount, 0);
    return { rows, earned, exchanged, balance, pending, available: Math.max(0, balance - pending), thisWeek, todayPt };
  }

  const yen = (pt) => Math.floor(pt / R.PT_PER_YEN);

  // 週ごと・月ごとに貯めたポイント（古い順、count 個）。
  function series(rows, unit, todayStr, count) {
    const keys = [];
    if (unit === "week") {
      for (let i = count - 1; i >= 0; i -= 1) keys.push(addDays(weekKey(todayStr), -7 * i));
    } else {
      for (let i = count - 1; i >= 0; i -= 1) keys.push(addMonths(monthKey(todayStr), -i));
    }
    const sum = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const r of rows) {
      if (r.amount <= 0) continue;
      const k = unit === "week" ? weekKey(r.date) : monthKey(r.date);
      if (k in sum) sum[k] += r.amount;
    }
    return keys.map((k) => ({ key: k, pt: sum[k], label: unit === "week" ? short(k) : `${Number(k.slice(5))}月` }));
  }

  // ---- 貯金うさぎ ----
  function stage(earned) {
    let index = 0;
    R.STAGES.forEach((min, i) => { if (earned >= min) index = i; });
    const next = R.STAGES[index + 1];
    const from = R.STAGES[index];
    return {
      index, // 0〜4
      last: next === undefined,
      toNext: next === undefined ? 0 : next - earned,
      progress: next === undefined ? 1 : (earned - from) / (next - from),
    };
  }

  const coins = (balance) => Math.max(0, Math.min(R.MAX_COINS, Math.floor(balance / R.COIN_PT)));

  // ---- 連続日数 ----
  // 1個でも終えた日を「がんばった日」とする。1週間（月〜日）に1日だけ、休んでもお守りで続く。
  // 今日まだ何もしていなくても、今日の時点では切らない。
  function streak(state, inbox, todayStr) {
    const dates = taskDates(state, inbox, todayStr).filter((d) => activeOn(state, inbox, d));
    if (!dates.length) return { days: 0, omamoriLeft: 1 };
    const active = new Set(dates);
    const end = active.has(todayStr) ? todayStr : addDays(todayStr, -1);
    const used = new Set();
    let days = 0;
    // 古い日から順にたどる（昨日見た数字が、今日いきなり変わらないように）。
    for (let d = dates[0]; d <= end; d = addDays(d, 1)) {
      if (active.has(d)) {
        days += 1;
      } else if (!used.has(weekKey(d))) {
        used.add(weekKey(d)); // お守りを使う
      } else {
        days = 0; // 同じ週に2日目の休み
      }
    }
    return { days, omamoriLeft: used.has(weekKey(todayStr)) ? 0 : 1 };
  }

  function totals(state, inbox, todayStr) {
    let activeDays = 0;
    let completeDays = 0;
    for (const date of taskDates(state, inbox, todayStr)) {
      const s = stats(tasksOn(state, inbox, date));
      if (s.done > 0) activeDays += 1;
      if (isComplete(s)) completeDays += 1;
    }
    return { activeDays, completeDays, stamps: completeDays % R.STAMP_FULL };
  }

  // シール帳の1日分。全部終えた日・少しできた日だけシールを貼る（できなかった日は何も貼らない）。
  function sticker(state, inbox, date, stageIndex) {
    const s = stats(tasksOn(state, inbox, date));
    // 使えるシール（段階の数まで）の中から、日付で順番に選ぶ。
    if (isComplete(s)) return R.STICKERS[Math.abs(daysBetween("2026-01-01", date)) % (stageIndex + 1)];
    if (s.done > 0) return R.PARTIAL_STICKER;
    return "";
  }

  // ---- 毎日はじめに開いたとき ----
  // ログインを記録し、「いつもの」を今日のタスクに入れる。何回呼んでも同じ結果になる。
  function startDay(state, todayStr, now = Date.now()) {
    const s = { ...state, tasks: [...state.tasks], logins: [...state.logins] };
    let bonus = null;
    if (!s.logins.includes(todayStr)) {
      s.logins.push(todayStr);
      s.logins.sort();
      const i = s.logins.indexOf(todayStr);
      bonus = { day: (i % R.LOGIN_BONUS.length) + 1, pt: R.LOGIN_BONUS[i % R.LOGIN_BONUS.length] };
    }
    for (const r of s.routines) {
      if (!s.tasks.some((t) => t.date === todayStr && t.routine === r.id)) {
        s.tasks.push({ id: newId(now), date: todayStr, title: r.title, done: false, doneAt: 0, routine: r.id });
      }
    }
    return { state: s, bonus };
  }

  // 昨日までにやり残した、生徒が入れたタスク（いつもの・にいにからの分は除く）。
  function leftovers(state, todayStr) {
    const y = addDays(todayStr, -1);
    return state.tasks.filter((t) => t.date === y && !t.done && !t.routine);
  }

  // 前日のやり残しを今日へ移す。昨日の分からは消える。
  function carryOver(state, todayStr) {
    const ids = new Set(leftovers(state, todayStr).map((t) => t.id));
    return { ...state, tasks: state.tasks.map((t) => (ids.has(t.id) ? { ...t, date: todayStr } : t)) };
  }

  // よく使うタスク（＋ボタンの候補）。いつものを先に、そのあと最近よく入れた順。
  function favorites(state, todayStr, limit = 8) {
    const since = addDays(todayStr, -60);
    const count = new Map();
    for (const t of state.tasks) if (t.date >= since && !t.routine) count.set(t.title, (count.get(t.title) || 0) + 1);
    const todays = new Set(state.tasks.filter((t) => t.date === todayStr).map((t) => t.title));
    return [...count].sort((a, b) => b[1] - a[1]).map(([title]) => title).filter((t) => !todays.has(t)).slice(0, limit);
  }

  // スクラッチを引く。rand は 0以上1未満（テストのために外から渡せる）。
  function drawScratch(rand = Math.random()) {
    const total = R.SCRATCH.reduce((a, p) => a + p.w, 0);
    let x = rand * total;
    for (const p of R.SCRATCH) {
      if (x < p.w) return p.pt;
      x -= p.w;
    }
    return R.SCRATCH[R.SCRATCH.length - 1].pt;
  }

  const canScratch = (state, inbox, todayStr) => !state.scratches[todayStr] && isComplete(stats(tasksOn(state, inbox, todayStr)));

  // 交換の申し込みができるか。持っている分から、申し込み中の分を引いた範囲だけ。
  function canExchange(state, inbox, todayStr, amount) {
    if (!Number.isInteger(amount) || amount <= 0 || amount % R.EXCHANGE_STEP !== 0) return false;
    return amount <= summary(state, inbox, todayStr).available;
  }

  // 新しいコメント（生徒がまだ見ていないもの）。
  const unseenComments = (inbox, seenAt) => inbox.comments.filter((c) => c.at > seenAt);

  return {
    RULES: R, today, addDays, daysBetween, weekKey, monthKey, periodOf, periodLabel, monthDays, addMonths, dateLabel, short, daysLeft, weekday,
    emptyState, emptyInbox, newId, cleanState, cleanInbox, STAMPS,
    tasksOn, stats, taskPt, perTaskPt, isComplete, goalsFor, goalPt, ledger, summary, yen, series,
    stage, coins, streak, totals, sticker, startDay, leftovers, carryOver, favorites, drawScratch, canScratch, canExchange, unseenComments,
  };
})();

if (typeof module !== "undefined") module.exports = Logic;
