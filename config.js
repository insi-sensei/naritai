// アプリの決まりごと（数字）をここに集める。多い・少ないと感じたら、ここだけを変える。
// 10pt = 1円。全部やった週で約1,700円、ふつうの週で約1,000円になるように決めた（判断で決めた仮の値）。

// サーバーの場所。公開するときに tools/publish-pages.mjs が書き換える。空なら、同じ場所の /api を使う。
const API_BASE = "https://naritai.insi-sensei.workers.dev";

const RULES = {
  PT_PER_YEN: 10,
  // 深夜4時までは前日扱い（夜ふかしで1日がずれないように）。
  DAY_START_HOUR: 4,
  // ログインボーナス。開いた日の合計で数え、7日でひと回り。休んでも1日目には戻らない。
  LOGIN_BONUS: [50, 50, 100, 100, 150, 150, 400],
  // 1日のタスクの分。終えた割合で配る（1個いくら、にはしない）。
  DAY_TASK_PT: 1500,
  // タスクがこれより少ない日は、この数で割る（1個だけ入れて終えれば満額、を防ぐ）。
  // 全部終えたときのボーナススクラッチも、この数以上の日だけ。
  MIN_TASKS: 3,
  // 全部終えた日のボーナススクラッチ。pt と出やすさ（w）。平均は約500pt。
  SCRATCH: [
    { pt: 200, w: 10 }, { pt: 300, w: 15 }, { pt: 400, w: 15 }, { pt: 500, w: 20 },
    { pt: 600, w: 15 }, { pt: 700, w: 12 }, { pt: 800, w: 13 },
  ],
  // 全部終えた日がこの数だけたまると、スタンプカード満タン。
  STAMP_FULL: 7,
  STAMP_BONUS: 1000,
  // 今週・今月の目標。終えた割合で配る。
  WEEK_GOAL_PT: 1000,
  MONTH_GOAL_PT: 3000,
  // にいにと交換する単位（1,000pt = 100円）。
  EXCHANGE_STEP: 1000,
  // 貯金うさぎが育つ境目（これまでに貯めた合計）。
  STAGES: [0, 20000, 60000, 150000, 300000],
  // お腹のコイン1枚あたりのポイント（いま持っている分）。最大10枚。
  COIN_PT: 2000,
  MAX_COINS: 10,
  // 段階ごとに使えるようになる色。
  THEMES: ["lavender", "sakura", "mint", "peach", "yuyake"],
  // シール帳のシール（段階が上がると増える）。
  STICKERS: ["🌸", "🍓", "🌷", "🎀", "👑"],
  PARTIAL_STICKER: "🫧",
  // 保存の上限（スマホの容量を食いすぎないように）。
  MAX_TITLE: 60,
  MAX_COMMENT: 300,
  MAX_TASKS: 8000,
  MAX_TASKS_PER_DAY: 40,
  MAX_GOALS: 600,
  MAX_ROUTINES: 30,
  MAX_REQUESTS: 1000,
  MAX_COMMENTS: 3000,
  MAX_OWNER_TASKS: 3000,
};

if (typeof module !== "undefined") module.exports = { RULES, API_BASE };
