import { useEffect, useState } from "react";
import Math from "../components/Math";
import { usePrefersReducedMotion } from "../lib/hooks";

type Paradigm = "direct" | "vlm" | "wm";

const PARADIGMS: Record<Paradigm, {
  label: string;
  color: string;
  aux: string;
  zero?: boolean;
  title: string;
  desc: string;
  example: string;
}> = {
  direct: {
    label: "直接策略",
    color: "var(--ink-faint)",
    aux: "L_aux = 0（没有辅助任务）",
    zero: true,
    title: "直接策略：只管动作",
    desc: "什么都不加，只优化动作损失。最朴素，也丢掉了让模型「想得更多」的机会。",
    example: "代表：早期行为克隆式 VLA",
  },
  vlm: {
    label: "VLM 系",
    color: "var(--blue)",
    aux: "L_aux = 语言对齐推理（子任务规划 / 空间定位）",
    title: "VLM 系：用语言当脚手架",
    desc: "辅助输出是语言 token —— 先让模型「说出」子目标或物体位置，再出动作。语言推理成了动作的归纳偏置。",
    example: "代表：FAST、OFT 等 VLM 原生解码",
  },
  wm: {
    label: "世界模型系",
    color: "var(--purple)",
    aux: "L_aux = 预测未来观测（下一帧画面）",
    title: "世界模型系：先想象未来，再行动",
    desc: "辅助输出是未来的视觉观测 —— 模型必须「脑补」动作之后世界会变成什么样，物理动态由此进入表示。",
    example: "代表：π、GR00T 的流匹配/视频预测路线",
  },
};

const SYMBOLS = [
  { tex: "x_t", mean: "多模态观测历史：多视角 RGB、深度、触觉、本体状态…… 机器人此刻「看到和感到」的一切" },
  { tex: "\\ell", mean: "语言指令，比如「把红色方块捡起来」" },
  { tex: "a_{t:t+k}", mean: "未来 k 步动作块 —— 一次预测一小段，而不是一步一步抖" },
  { tex: "y_{aux}", mean: "可选的辅助输出：未来画面预测、子目标语言描述等 —— 各范式的区别就藏在这里" },
];

export default function FormulaSwitch() {
  const [p, setP] = useState<Paradigm>("vlm");
  const [sym, setSym] = useState(3);
  const [touched, setTouched] = useState(false);
  const reduced = usePrefersReducedMotion();
  const cur = PARADIGMS[p];

  /* 三种范式自动轮播，用户点过后停 */
  useEffect(() => {
    if (touched || reduced) return;
    const keys = Object.keys(PARADIGMS) as Paradigm[];
    const t = setInterval(() => {
      setP((cur) => keys[(keys.indexOf(cur) + 1) % keys.length]);
    }, 4200);
    return () => clearInterval(t);
  }, [touched, reduced]);

  return (
    <div className="formula-stage">
      <div className="formula-big">
        <div className="formula-line">
          <Math display tex="\pi\big(\, a_{t:t+k},\; y_{aux} \;\big|\; x_t,\; \ell \,\big)" />
        </div>
        <div className="formula-line" style={{ fontSize: "clamp(15px, 2vw, 21px)" }}>
          <Math display tex="L = L_{action} + \htmlClass{hot}{L_{aux}}" />
        </div>
        <div className="aux-swap">
          <div key={p} className={`aux-pill ${cur.zero ? "zero" : ""}`} style={{ ["--ac" as string]: cur.color }}>
            {cur.aux}
          </div>
        </div>
        <div className="formula-sub">
          <Math tex={SYMBOLS[sym].tex} /> —— {SYMBOLS[sym].mean}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
        <div className="sym-chips">
          {SYMBOLS.map((s, i) => (
            <button
              key={s.tex}
              className={`sym-chip ${sym === i ? "on" : ""}`}
              onMouseEnter={() => setSym(i)}
              onClick={() => setSym(i)}
            >
              <Math tex={s.tex} />
            </button>
          ))}
        </div>
        <div className="chip-row">
          {(Object.keys(PARADIGMS) as Paradigm[]).map((k) => (
            <button
              key={k}
              className={`chip ${p === k ? "on" : ""}`}
              style={{ ["--chipc" as string]: PARADIGMS[k].color }}
              onClick={() => { setP(k); setTouched(true); }}
            >
              {PARADIGMS[k].label}
            </button>
          ))}
        </div>
        <div className="panel paradigm-card" style={{ ["--kcolor" as string]: cur.color }}>
          <h4><span className="sw" style={{ background: cur.color }} />{cur.title}</h4>
          <p>{cur.desc}</p>
          <div className="example">{cur.example}</div>
        </div>
      </div>
    </div>
  );
}
