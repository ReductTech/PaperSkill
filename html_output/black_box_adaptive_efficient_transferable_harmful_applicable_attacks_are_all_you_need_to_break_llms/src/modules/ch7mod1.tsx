import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Step = {
  title: string;
  sub: string;
  doWhat: string;
  why: string;
};

const STEPS: Step[] = [
  {
    title: '抽行为 b',
    sub: 'SAMPLE',
    doWhat: '从训练行为集 ℬ 抽一条短描述 b。攻击器直接以 b 为条件，不必手写越狱模板。',
    why: '算法 1：b ∼ ℬ。一次训练覆盖多种行为，成本可以摊销。',
  },
  {
    title: '生成提示 p',
    sub: 'A_θ',
    doWhat: '掩码扩散攻击器 A_θ(· | b) 双向填空，迭代去掩码，得到对抗提示 p。',
    why: 'A_θ 是 LLaDA-8B-Base 上的 LoRA。生成发生在攻击器内部，还没有问目标。',
  },
  {
    title: '目标作答 y',
    sub: 'M(p)',
    doWhat: '把 p 送进受害者 M。M 可以是对齐模型，也可以包上 Circuit Breaker、检测器等。只取解码输出 y。',
    why: '黑盒：梯度不穿过 M。柜门上「加警报器」也不改这条写法。',
  },
  {
    title: '评判打分 r',
    sub: 'h(b, y)',
    doWhat: '评判器给回答打有害分 r ∈ [0, 1]，把三元组 (b, p, r) 放进本周期集合 S。未满 N_cycle 就回到「抽行为」。',
    why: '算法 1 第 4–5 行：r ← h(b, M(p))，S ← S ∪ {(b, p, r)}。',
  },
  {
    title: '切成偏好对',
    sub: '𝒫',
    doWhat: 'S 攒满后，用分位数 q 切开：高分提示为更好的 p⁺，低分为更差的 p⁻，得到偏好集 𝒫。',
    why: '算法 1 第 11 行 QUANTILEPREFERENCESET。期望危害不能直接求导，所以改用成对比较。',
  },
  {
    title: 'DPO 更新 θ',
    sub: 'DPO-TRAIN',
    doWhat: '对每一对 (p⁺, p⁻) 做掩码、算 DPO 损失并更新 LoRA。每隔 Δ epoch 在评估采样上看平均分 μ；不再提升则早停，保存最好的 θ*。',
    why: '算法 2。走完这一块，把更强的 A_θ 带回第一步：c ← c+1，再抽行为。',
  },
];

const ARROW = '#d97706';
const LINE = '#d7deea';
const BLUE = '#27446e';
const INK = '#21324a';
const MUTED = '#68778f';

function Block({
  n,
  step,
  active,
  done,
  onClick,
}: {
  n: number;
  step: Step;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 92,
        padding: '10px 8px',
        borderRadius: 12,
        border: `2px solid ${active ? BLUE : done ? '#8fbf9a' : LINE}`,
        background: active ? '#eef3fa' : done ? '#f3f8f4' : '#fff',
        color: INK,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: active ? '0 0 0 3px rgba(39,68,110,0.12)' : 'none',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: active ? BLUE : MUTED, letterSpacing: 0.04 }}>
        {n}. {step.sub}
      </div>
      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800 }}>{step.title}</div>
    </button>
  );
}

function HArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: ARROW, fontWeight: 800, fontSize: 18 }}>
      →
    </div>
  );
}

function VArrow({ flip }: { flip?: boolean }) {
  return (
    <div style={{ textAlign: 'center', color: ARROW, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
      {flip ? '↑' : '↓'}
    </div>
  );
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(0);
  const [cycle, setCycle] = useState(1);
  const cur = STEPS[i];

  const next = () => {
    if (i < STEPS.length - 1) {
      setI(i + 1);
      return;
    }
    setCycle((c) => c + 1);
    setI(0);
  };

  const prev = () => {
    if (i > 0) {
      setI(i - 1);
      return;
    }
    if (cycle > 1) {
      setCycle(cycle - 1);
      setI(STEPS.length - 1);
    }
  };

  const cell = (idx: number) => (
    <Block
      n={idx + 1}
      step={STEPS[idx]}
      active={i === idx}
      done={i > idx}
      onClick={() => setI(idx)}
    />
  );

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.65 }}>
        按「下一步」绕圈走。前四块是 SAMPLE（样本不够会反复抽），然后切偏好、做 DPO；第 6 块走完会回到第 1 块，开始下一周期。
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 28px 1fr 28px 1fr',
          gridTemplateRows: 'auto 18px auto',
          gap: 6,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {cell(0)}
        <HArrow />
        {cell(1)}
        <HArrow />
        {cell(2)}

        <VArrow flip />
        <span />
        <span />
        <span />
        <VArrow />

        {cell(5)}
        <div style={{ textAlign: 'center', color: ARROW, fontWeight: 800, fontSize: 18 }}>←</div>
        {cell(4)}
        <div style={{ textAlign: 'center', color: ARROW, fontWeight: 800, fontSize: 18 }}>←</div>
        {cell(3)}
      </div>

      <div style={{ textAlign: 'center', margin: '4px 0 12px', color: ARROW, fontSize: 13, fontWeight: 700 }}>
        {i === STEPS.length - 1
          ? '下一步将回到「抽行为 b」，进入下一周期 ↺'
          : `当前第 ${cycle} 圈 · 第 ${i + 1} / 6 块`}
      </div>

      <div className={`opt-card ${i === STEPS.length - 1 ? 'good' : ''}`}>
        <div className="opt-kicker">
          第 {cycle} 圈 · {i + 1}. {cur.title}
        </div>
        <p style={{ margin: '8px 0 6px', fontSize: 15, fontWeight: 700, color: BLUE }}>{cur.doWhat}</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: MUTED }}>{cur.why}</p>
      </div>

      <div className="ctrl">
        <button type="button" onClick={prev} disabled={cycle === 1 && i === 0}>
          上一步
        </button>
        <span className="val">周期 {cycle}</span>
        <button type="button" onClick={next}>
          {i === STEPS.length - 1 ? '回到抽行为（下一圈）' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${i === STEPS.length - 1 ? 'good' : ''}`}>
        {i === 3
          ? '样本还没到 N_cycle 时，算法会从第 1 块再抽；演示里点下一步进入切偏好，表示本周期已经采满。'
          : i === STEPS.length - 1
            ? '内环早停后，更强的 A_θ 进入下一圈 SAMPLE。外环就是这样循环的。'
            : '点小块可跳转；用「下一步」按论文顺序走完一圈。'}
      </div>
    </div>
  );
};

export default Ch7Mod1;
