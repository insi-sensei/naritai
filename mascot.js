// mascot.js
const MASCOT = {
  viewBox: "0 0 200 200",

  // お腹の丸い窓の中にコインを積み上げる位置(下から順)
  coinSlots: [
    { cx: 100, cy: 148 },
    { cx: 100, cy: 134 },
    { cx: 100, cy: 120 },
    { cx: 100, cy: 106 },
    { cx: 100, cy: 92 },
    { cx: 86,  cy: 148 },
    { cx: 114, cy: 148 },
    { cx: 86,  cy: 134 },
    { cx: 114, cy: 134 },
    { cx: 86,  cy: 120 },
  ],
  coinR: 7,

  stages: [
    // ── ① 貯金箱のたまご ──────────────────────────────────────────
    {
      name: "貯金箱のたまご",
      shapes: [
        // --- 卵の下半分(割れた殻、ギザギザ) ---
        {
          tag: "path",
          part: "body",
          attrs: {
            d: "M 60 130 L 68 118 L 76 130 L 84 115 L 92 130 L 100 112 L 108 130 L 116 115 L 124 130 L 132 118 L 140 130 C 140 165 60 165 60 130 Z",
            fill: "#f5ede0",
            stroke: "#b89070",
            "stroke-width": "2.5",
            "stroke-linejoin": "round"
          }
        },
        // --- 卵の上半分(本体) ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "108",
            rx: "40",
            ry: "46",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左(短め) ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "78",
            cy: "72",
            rx: "9",
            ry: "16",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 右(短め) ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "122",
            cy: "72",
            rx: "9",
            ry: "16",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左 内側 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "78",
            cy: "72",
            rx: "5",
            ry: "10",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 耳 右 内側 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "122",
            cy: "72",
            rx: "5",
            ry: "10",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- コイン投入口(頭の上) ---
        {
          tag: "rect",
          part: "acc",
          attrs: {
            x: "91",
            y: "60",
            width: "18",
            height: "5",
            rx: "2.5",
            fill: "#b89070",
            stroke: "#8c6a4a",
            "stroke-width": "1.5"
          }
        },
        // --- お腹の丸窓 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "120",
            rx: "24",
            ry: "20",
            fill: "#c8eaf8",
            "fill-opacity": "0.55",
            stroke: "#7cb8d8",
            "stroke-width": "2"
          }
        },
        // --- 目 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "91",
            cy: "100",
            r: "3.5",
            fill: "#5a3a2a"
          }
        },
        // --- 目 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "109",
            cy: "100",
            r: "3.5",
            fill: "#5a3a2a"
          }
        },
        // --- 口 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 96 108 Q 100 112 104 108",
            stroke: "#a06060",
            "stroke-width": "2",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- ほっぺ 左 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "86",
            cy: "107",
            rx: "6",
            ry: "4",
            fill: "#f8a0b8",
            "fill-opacity": "0.55"
          }
        },
        // --- ほっぺ 右 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "114",
            cy: "107",
            rx: "6",
            ry: "4",
            fill: "#f8a0b8",
            "fill-opacity": "0.55"
          }
        }
      ]
    },

    // ── ② ちびうさ ───────────────────────────────────────────────
    {
      name: "ちびうさ",
      shapes: [
        // --- 耳 左(少し長め) ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "76",
            cy: "62",
            rx: "10",
            ry: "24",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 右(少し長め) ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "124",
            cy: "62",
            rx: "10",
            ry: "24",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左 内側 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "76",
            cy: "62",
            rx: "5.5",
            ry: "16",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 耳 右 内側 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "124",
            cy: "62",
            rx: "5.5",
            ry: "16",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 胴体(少し小さめ) ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "128",
            rx: "40",
            ry: "44",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 頭 ---
        {
          tag: "circle",
          part: "body",
          attrs: {
            cx: "100",
            cy: "96",
            r: "30",
            fill: "#fde8f0",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- コイン投入口 ---
        {
          tag: "rect",
          part: "acc",
          attrs: {
            x: "91",
            y: "64",
            width: "18",
            height: "5",
            rx: "2.5",
            fill: "#b89070",
            stroke: "#8c6a4a",
            "stroke-width": "1.5"
          }
        },
        // --- お腹の丸窓 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "132",
            rx: "24",
            ry: "20",
            fill: "#c8eaf8",
            "fill-opacity": "0.55",
            stroke: "#7cb8d8",
            "stroke-width": "2"
          }
        },
        // --- 腕 左 ---
        {
          tag: "ellipse",
          part: "arm-l",
          attrs: {
            cx: "66",
            cy: "120",
            rx: "9",
            ry: "13",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 腕 右 ---
        {
          tag: "ellipse",
          part: "arm-r",
          attrs: {
            cx: "134",
            cy: "120",
            rx: "9",
            ry: "13",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 目 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "92",
            cy: "95",
            r: "3.5",
            fill: "#4a2a1a"
          }
        },
        // --- 目 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "108",
            cy: "95",
            r: "3.5",
            fill: "#4a2a1a"
          }
        },
        // --- 目のハイライト 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "93.5",
            cy: "93.5",
            r: "1.2",
            fill: "#ffffff"
          }
        },
        // --- 目のハイライト 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "109.5",
            cy: "93.5",
            r: "1.2",
            fill: "#ffffff"
          }
        },
        // --- 口 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 95 103 Q 100 108 105 103",
            stroke: "#a06060",
            "stroke-width": "2",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- ほっぺ 左 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "84",
            cy: "101",
            rx: "7",
            ry: "5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        },
        // --- ほっぺ 右 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "116",
            cy: "101",
            rx: "7",
            ry: "5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        }
      ]
    },

    // ── ③ うさぎ(標準) ──────────────────────────────────────────
    {
      name: "うさぎ",
      shapes: [
        // --- 耳 左(長い) ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "75",
            cy: "52",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 右(長い) ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "125",
            cy: "52",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左 内側 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "75",
            cy: "52",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 耳 右 内側 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "125",
            cy: "52",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 胴体 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "132",
            rx: "44",
            ry: "48",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 頭 ---
        {
          tag: "circle",
          part: "body",
          attrs: {
            cx: "100",
            cy: "90",
            r: "32",
            fill: "#fde8f0",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- コイン投入口 ---
        {
          tag: "rect",
          part: "acc",
          attrs: {
            x: "91",
            y: "56",
            width: "18",
            height: "5",
            rx: "2.5",
            fill: "#b89070",
            stroke: "#8c6a4a",
            "stroke-width": "1.5"
          }
        },
        // --- お腹の丸窓 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "136",
            rx: "26",
            ry: "22",
            fill: "#c8eaf8",
            "fill-opacity": "0.55",
            stroke: "#7cb8d8",
            "stroke-width": "2"
          }
        },
        // --- 腕 左 ---
        {
          tag: "ellipse",
          part: "arm-l",
          attrs: {
            cx: "63",
            cy: "120",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 腕 右 ---
        {
          tag: "ellipse",
          part: "arm-r",
          attrs: {
            cx: "137",
            cy: "120",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 目 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "91",
            cy: "88",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "109",
            cy: "88",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目のハイライト 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "92.5",
            cy: "86.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- 目のハイライト 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "110.5",
            cy: "86.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- 鼻 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "100",
            cy: "97",
            rx: "3",
            ry: "2",
            fill: "#e88080"
          }
        },
        // --- 口 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 97 99 Q 100 104 103 99",
            stroke: "#c06060",
            "stroke-width": "2",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- ほっぺ 左 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "83",
            cy: "96",
            rx: "8",
            ry: "5.5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        },
        // --- ほっぺ 右 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "117",
            cy: "96",
            rx: "8",
            ry: "5.5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        }
      ]
    },

    // ── ④ おしゃれうさ(リボン＋スカーフ) ─────────────────────────
    {
      name: "おしゃれうさ",
      shapes: [
        // --- 耳 左 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "75",
            cy: "50",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 右 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "125",
            cy: "50",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左 内側 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "75",
            cy: "50",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 耳 右 内側 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "125",
            cy: "50",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- リボン(耳の付け根に) ---
        {
          tag: "g",
          part: "acc",
          children: [
            // 左のひらひら
            {
              tag: "path",
              part: "acc",
              attrs: {
                d: "M 108 42 C 112 36 122 36 118 44 Z",
                fill: "#e8a0c0",
                stroke: "#c06880",
                "stroke-width": "1.5",
                "stroke-linejoin": "round"
              }
            },
            // 右のひらひら
            {
              tag: "path",
              part: "acc",
              attrs: {
                d: "M 132 42 C 128 36 118 36 122 44 Z",
                fill: "#e8a0c0",
                stroke: "#c06880",
                "stroke-width": "1.5",
                "stroke-linejoin": "round"
              }
            },
            // 中心の丸
            {
              tag: "circle",
              part: "acc",
              attrs: {
                cx: "120",
                cy: "43",
                r: "5",
                fill: "#f0c0d4",
                stroke: "#c06880",
                "stroke-width": "1.5"
              }
            }
          ]
        },
        // --- 胴体 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "132",
            rx: "44",
            ry: "48",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 頭 ---
        {
          tag: "circle",
          part: "body",
          attrs: {
            cx: "100",
            cy: "90",
            r: "32",
            fill: "#fde8f0",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- スカーフ ---
        {
          tag: "path",
          part: "acc",
          attrs: {
            d: "M 68 110 Q 100 118 132 110 Q 130 122 100 124 Q 70 122 68 110 Z",
            fill: "#b8d8f0",
            stroke: "#7098c8",
            "stroke-width": "1.5",
            "stroke-linejoin": "round"
          }
        },
        // --- スカーフの結び目 ---
        {
          tag: "ellipse",
          part: "acc",
          attrs: {
            cx: "100",
            cy: "114",
            rx: "7",
            ry: "5",
            fill: "#90c0e8",
            stroke: "#6090c0",
            "stroke-width": "1.5"
          }
        },
        // --- コイン投入口 ---
        {
          tag: "rect",
          part: "acc",
          attrs: {
            x: "91",
            y: "56",
            width: "18",
            height: "5",
            rx: "2.5",
            fill: "#b89070",
            stroke: "#8c6a4a",
            "stroke-width": "1.5"
          }
        },
        // --- お腹の丸窓 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "142",
            rx: "26",
            ry: "22",
            fill: "#c8eaf8",
            "fill-opacity": "0.55",
            stroke: "#7cb8d8",
            "stroke-width": "2"
          }
        },
        // --- 腕 左 ---
        {
          tag: "ellipse",
          part: "arm-l",
          attrs: {
            cx: "63",
            cy: "126",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 腕 右 ---
        {
          tag: "ellipse",
          part: "arm-r",
          attrs: {
            cx: "137",
            cy: "126",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2"
          }
        },
        // --- 目 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "91",
            cy: "88",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "109",
            cy: "88",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目のハイライト 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "92.5",
            cy: "86.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- 目のハイライト 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "110.5",
            cy: "86.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- まつ毛(ちょっとおしゃれ) ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 87 84 Q 89 81 91 83",
            stroke: "#4a2a1a",
            "stroke-width": "1.5",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 105 84 Q 107 81 109 83",
            stroke: "#4a2a1a",
            "stroke-width": "1.5",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- 鼻 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "100",
            cy: "97",
            rx: "3",
            ry: "2",
            fill: "#e88080"
          }
        },
        // --- 口 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 97 99 Q 100 104 103 99",
            stroke: "#c06060",
            "stroke-width": "2",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- ほっぺ 左 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "83",
            cy: "96",
            rx: "8",
            ry: "5.5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        },
        // --- ほっぺ 右 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "117",
            cy: "96",
            rx: "8",
            ry: "5.5",
            fill: "#f8a0b8",
            "fill-opacity": "0.5"
          }
        }
      ]
    },

    // ── ⑤ 貯金うさぎの女王(王冠＋きらきら) ─────────────────────
    {
      name: "貯金うさぎの女王",
      shapes: [
        // --- 耳 左 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "72",
            cy: "52",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 右 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "128",
            cy: "52",
            rx: "11",
            ry: "30",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 耳 左 内側 ---
        {
          tag: "ellipse",
          part: "ear-l",
          attrs: {
            cx: "72",
            cy: "52",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 耳 右 内側 ---
        {
          tag: "ellipse",
          part: "ear-r",
          attrs: {
            cx: "128",
            cy: "52",
            rx: "6",
            ry: "22",
            fill: "#f8bbcf",
            stroke: "none"
          }
        },
        // --- 胴体 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "134",
            rx: "44",
            ry: "48",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 頭 ---
        {
          tag: "circle",
          part: "body",
          attrs: {
            cx: "100",
            cy: "90",
            r: "32",
            fill: "#fde8f0",
            stroke: "#c48080",
            "stroke-width": "2.5"
          }
        },
        // --- 王冠 ---
        {
          tag: "g",
          part: "acc",
          children: [
            // 王冠の台
            {
              tag: "path",
              part: "acc",
              attrs: {
                d: "M 76 68 L 78 54 L 88 64 L 100 50 L 112 64 L 122 54 L 124 68 Z",
                fill: "#f0d060",
                stroke: "#c0a020",
                "stroke-width": "2",
                "stroke-linejoin": "round",
                "stroke-linecap": "round"
              }
            },
            // 王冠のベルト部分
            {
              tag: "rect",
              part: "acc",
              attrs: {
                x: "76",
                y: "66",
                width: "48",
                height: "7",
                rx: "3.5",
                fill: "#e8c840",
                stroke: "#c0a020",
                "stroke-width": "1.5"
              }
            },
            // 宝石 中央
            {
              tag: "circle",
              part: "acc",
              attrs: {
                cx: "100",
                cy: "60",
                r: "4.5",
                fill: "#e070c0",
                stroke: "#b04090",
                "stroke-width": "1"
              }
            },
            // 宝石 左
            {
              tag: "circle",
              part: "acc",
              attrs: {
                cx: "84",
                cy: "65",
                r: "3",
                fill: "#70d0f0",
                stroke: "#3090c0",
                "stroke-width": "1"
              }
            },
            // 宝石 右
            {
              tag: "circle",
              part: "acc",
              attrs: {
                cx: "116",
                cy: "65",
                r: "3",
                fill: "#70d0f0",
                stroke: "#3090c0",
                "stroke-width": "1"
              }
            }
          ]
        },
        // --- コイン投入口 ---
        {
          tag: "rect",
          part: "acc",
          attrs: {
            x: "91",
            y: "58",
            width: "18",
            height: "5",
            rx: "2.5",
            fill: "#b89070",
            stroke: "#8c6a4a",
            "stroke-width": "1.5"
          }
        },
        // --- お腹の丸窓 ---
        {
          tag: "ellipse",
          part: "body",
          attrs: {
            cx: "100",
            cy: "140",
            rx: "26",
            ry: "22",
            fill: "#c8eaf8",
            "fill-opacity": "0.55",
            stroke: "#7cb8d8",
            "stroke-width": "2"
          }
        },
        // --- 腕 左(万歳気味) ---
        {
          tag: "ellipse",
          part: "arm-l",
          attrs: {
            cx: "60",
            cy: "118",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2",
            transform: "rotate(-20 60 118)"
          }
        },
        // --- 腕 右(万歳気味) ---
        {
          tag: "ellipse",
          part: "arm-r",
          attrs: {
            cx: "140",
            cy: "118",
            rx: "10",
            ry: "14",
            fill: "#fce4ec",
            stroke: "#c48080",
            "stroke-width": "2",
            transform: "rotate(20 140 118)"
          }
        },
        // --- 目 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "91",
            cy: "90",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "109",
            cy: "90",
            r: "4",
            fill: "#4a2a1a"
          }
        },
        // --- 目のハイライト 左 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "92.5",
            cy: "88.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- 目のハイライト 右 ---
        {
          tag: "circle",
          part: "face",
          attrs: {
            cx: "110.5",
            cy: "88.5",
            r: "1.5",
            fill: "#ffffff"
          }
        },
        // --- まつ毛 左 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 87 86 Q 89 83 91 85",
            stroke: "#4a2a1a",
            "stroke-width": "1.5",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- まつ毛 右 ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 105 86 Q 107 83 109 85",
            stroke: "#4a2a1a",
            "stroke-width": "1.5",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- 鼻 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "100",
            cy: "99",
            rx: "3",
            ry: "2",
            fill: "#e88080"
          }
        },
        // --- 口(笑顔) ---
        {
          tag: "path",
          part: "face",
          attrs: {
            d: "M 95 101 Q 100 108 105 101",
            stroke: "#c06060",
            "stroke-width": "2",
            fill: "none",
            "stroke-linecap": "round"
          }
        },
        // --- ほっぺ 左 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "82",
            cy: "98",
            rx: "9",
            ry: "6",
            fill: "#f8a0b8",
            "fill-opacity": "0.55"
          }
        },
        // --- ほっぺ 右 ---
        {
          tag: "ellipse",
          part: "face",
          attrs: {
            cx: "118",
            cy: "98",
            rx: "9",
            ry: "6",
            fill: "#f8a0b8",
            "fill-opacity": "0.55"
          }
        },
        // --- きらきら 左上 ---
        {
          tag: "path",
          part: "acc",
          attrs: {
            d: "M 34 48 L 36 44 L 38 48 L 42 50 L 38 52 L 36 56 L 34 52 L 30 50 Z",
            fill: "#f8e040",
            stroke: "#d0a010",
            "stroke-width": "1",
            "stroke-linejoin": "round"
          }
        },
        // --- きらきら 右上 ---
        {
          tag: "path",
          part: "acc",
          attrs: {
            d: "M 158 44 L 160 40 L 162 44 L 166 46 L 162 48 L 160 52 L 158 48 L 154 46 Z",
            fill: "#f8e040",
            stroke: "#d0a010",
            "stroke-width": "1",
            "stroke-linejoin": "round"
          }
        },
        // --- きらきら 右小 ---
        {
          tag: "path",
          part: "acc",
          attrs: {
            d: "M 168 70 L 169.5 67 L 171 70 L 174 71.5 L 171 73 L 169.5 76 L 168 73 L 165 71.5 Z",
            fill: "#f8e040",
            stroke: "#d0a010",
            "stroke-width": "0.8",
            "stroke-linejoin": "round"
          }
        },
        // --- きらきら 左小 ---
        {
          tag: "path",
          part: "acc",
          attrs: {
            d: "M 28 72 L 29.5 69 L 31 72 L 34 73.5 L 31 75 L 29.5 78 L 28 75 L 25 73.5 Z",
            fill: "#f8e040",
            stroke: "#d0a010",
            "stroke-width": "0.8",
            "stroke-linejoin": "round"
          }
        }
      ]
    }
  ]
};
