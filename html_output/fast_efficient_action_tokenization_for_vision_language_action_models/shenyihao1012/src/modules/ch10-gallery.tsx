import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10.2 — π0-FAST laundry rollout walkthrough (paper Fig. 10). Ten numbered
// frames grouped into four phases (取衣 → 展平 → 折叠 → 叠放), each with its
// own explanation line; a phase timeline tracks position; three limitation
// notices + official link below. DOM-only (no canvas, no video).
interface Step {
  phase: number;
  caption: string;
  detail: string;
}

const PHASES = [
  { name: '取衣出篮', color: '#27446e' },
  { name: '展平', color: '#f07e07' },
  { name: '折叠', color: '#7c3aed' },
  { name: '叠放成堆', color: '#228d5c' },
];

const STEPS: Step[] = [
  { phase: 0, caption: '① 篮中取衣', detail: '衣服随机皱成一团躺在篮里——策略要从任意构型开始，没有固定初始姿态。' },
  { phase: 0, caption: '② 提出篮外', detail: '抓住衣物边缘提出篮子；抓哪里取决于当下的皱褶形状，每次都不同。' },
  { phase: 1, caption: '③ 放上桌面', detail: '把衣物放到桌面上，准备展平——位置由后续折叠动作的需要决定。' },
  { phase: 1, caption: '④ 动态展平', detail: '双臂快速甩动把皱褶摊开——这一步需要<b>动态、有速度感</b>的动作，最考验高频控制。' },
  { phase: 2, caption: '⑤ 第一折', detail: '对折衣物的一个边；布料形变中抓点会滑，需要边折边调整。' },
  { phase: 2, caption: '⑥ 第二折', detail: '继续折下一条边——前一步的形变会让这一步的构型每次都不一样。' },
  { phase: 2, caption: '⑦ 修正纠偏', detail: '发现折歪了，重新抓住调整——<b>从错误中恢复</b>是长程任务的必备能力。' },
  { phase: 3, caption: '⑧ 移向衣堆', detail: '把折好的衣物端到已有的叠放堆旁——堆的高度随进度增长，放置策略随之变化。' },
  { phase: 3, caption: '⑨ 对齐叠放', detail: '小心翼翼放在堆顶并对齐——放歪一件，后面全部歪。' },
  { phase: 3, caption: '⑩ 完成一件', detail: '一件衣物完整入堆。换下一件——<b>回到第①步</b>，整段流程循环到篮清空。' },
];

const NOTICES: { title: string; body: string }[] = [
  {
    title: '推理 750ms',
    body:
      'vs 扩散 π0 一块 ~100ms（4090）：30-60 个自回归 token vs 10 步扩散、2B 全骨干 vs 300M 专家；投机解码 / 量化 / 内核等 LLM 加速技巧留待未来。',
  },
  {
    title: '仅固定工位',
    body: '论文只测了固定工位的静态机械臂；移动平台 / 灵巧手 / 人形只做了离线压缩验证，尚无策略评测。',
  },
  {
    title: '快速是训练快速',
    body: 'FAST 省的是训练算力——推理反而更慢（750ms vs 100ms），两码事。',
  },
];

export const Ch10Gallery: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0); // 0-based index into STEPS
  const [touched, setTouched] = useState(false);

  const cur = STEPS[step];
  const phase = PHASES[cur.phase];

  const pick = (n: number) => {
    setStep(n);
    setTouched(true);
  };

  const next = () => pick(Math.min(STEPS.length - 1, step + 1));
  const prev = () => pick(Math.max(0, step - 1));
  const reset = () => pick(0);

  return (
    <div>
      {/* annotated rollout image with a moving highlight box over the current
          frame — figure 10 is a 5×2 grid of numbered frames (1-10) */}
      <div style={{ position: 'relative', margin: '6px 0 12px' }}>
        <img
          src="./images/figure-10.png"
          alt="π0-FAST 叠衣 rollout（论文图 10）"
          style={{ display: 'block', width: '100%', borderRadius: 8, border: '1px solid #d7deea' }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${(step % 5) * 20}%`,
            top: `${Math.floor(step / 5) * 50}%`,
            width: '20%',
            height: '50%',
            boxSizing: 'border-box',
            border: `3px solid ${phase.color}`,
            borderRadius: 6,
            boxShadow: `0 0 0 2px rgba(255,255,255,0.85)`,
            transition: 'left 0.3s ease, top 0.3s ease, border-color 0.3s ease',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              width: 24,
              height: 24,
              borderRadius: 12,
              background: phase.color,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {step + 1}
          </span>
        </div>
      </div>

      {/* phase timeline */}
      <div style={{ display: 'flex', gap: 6, margin: '6px 0 10px' }}>
        {PHASES.map((p, i) => (
          <div
            key={p.name}
            style={{
              flex: cur.phase >= i ? Math.max(1, PHASES.length - cur.phase) : 1,
              transition: 'flex 0.3s ease',
            }}
          >
            <div
              style={{
                height: 26,
                borderRadius: 6,
                background: cur.phase >= i ? p.color : '#e3e9f2',
                color: cur.phase >= i ? '#fff' : '#68778f',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: cur.phase === i ? 700 : 400,
                transition: 'background 0.25s ease',
              }}
            >
              {p.name}
            </div>
          </div>
        ))}
      </div>

      {/* step chips grouped by phase */}
      <div className="chip-row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <button
            key={i}
            className={`chip${i === step ? ' selected' : ''}`}
            onClick={() => pick(i)}
            aria-label={`rollout 第 ${i + 1} 步`}
            style={i === step ? { borderColor: PHASES[s.phase].color } : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, margin: '4px 0 10px' }} aria-hidden="true">
        {STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: i <= step ? PHASES[s.phase].color : '#e3e9f2',
              opacity: i === step ? 1 : i < step ? 0.75 : 1,
            }}
          />
        ))}
      </div>

      {/* step walkthrough card */}
      <div
        style={{
          border: `2px solid ${phase.color}`,
          borderRadius: 10,
          background: '#fff',
          padding: '14px 18px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span
            style={{
              background: phase.color,
              color: '#fff',
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {phase.name}
          </span>
          <b style={{ fontSize: 17, color: 'var(--ink-1, #21324a)' }}>{cur.caption}</b>
          <span style={{ marginLeft: 'auto', color: '#68778f', fontSize: 12 }}>
            图 10 标注点 {step + 1} / {STEPS.length}
          </span>
        </div>
        <p
          style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink-2)' }}
          dangerouslySetInnerHTML={{ __html: cur.detail }}
        />
      </div>

      {/* prev / next controls */}
      <div className="step-ctrl" style={{ marginBottom: 10 }}>
        <button className="tiny ghost" onClick={prev} disabled={step === 0}>
          ◀ 上一步
        </button>
        <button className="tiny" onClick={next} disabled={step === STEPS.length - 1}>
          下一步 ▶
        </button>
        <button className="tiny ghost" onClick={reset} disabled={step === 0}>
          复位
        </button>
      </div>

      <div className="three-col-demo">
        {NOTICES.map((n) => (
          <div className="three-col-panel noisy" key={n.title}>
            <div className="three-col-label" style={{ color: '#c43f52' }}>
              ⚠ {n.title}
            </div>
            <div
              style={{
                color: 'var(--ink-2)',
                fontSize: '12.5px',
                lineHeight: 1.65,
                textAlign: 'left',
              }}
            >
              {n.body}
            </div>
          </div>
        ))}
      </div>
      <div className="step-desc" style={{ padding: '4px 0' }}>
        视频与代码：
        <a href="https://pi.website/research/fast" target="_blank" rel="noopener noreferrer">
          pi.website/research/fast
        </a>
      </div>
      <div
        className={`feedback ${touched ? 'bad' : ''}`}
        dangerouslySetInnerHTML={{
          __html: touched
            ? '省的是训练算力，不是推理延迟——<b>读稿快，出稿还得等</b>。'
            : '按「下一步」走完这趟叠衣的十个标注点——每一帧都是策略在未见场景里的真实决策。',
        }}
      />
    </div>
  );
};

export default Ch10Gallery;
