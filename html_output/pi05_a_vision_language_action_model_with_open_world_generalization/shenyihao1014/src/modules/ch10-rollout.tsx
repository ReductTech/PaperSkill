import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10.2 「新家实录画廊」: paper Fig 7(a) rollout strip embedded with a moving
// highlight box. The strip has 3 rows (Home 1/2/3) with subtask text above
// each row's frames; the frame strip occupies x 12%–57% of the image. Below:
// three red limitation cards + one green prospect card (VI) + official link.
interface Step {
  row: 0 | 1 | 2;
  sub: number;
  frames: number;
  home: string;
  en: string;
  zh: string;
  act: string;
}

const STEPS: Step[] = [
  // Home 1: 5 frames (pull drawer → pick tong → put tong → push drawer, with a second drawer pull variant)
  { row: 0, sub: 0, frames: 5, home: 'Home 1 · 物品入抽屉', en: 'pull out the drawer', zh: '拉开抽屉', act: '机械臂抓住抽屉把手，把抽屉整体拉出' },
  { row: 0, sub: 1, frames: 5, home: 'Home 1 · 物品入抽屉', en: 'pull out the top right drawer', zh: '拉开右上抽屉', act: '换一个抽屉——上排右侧的也拉开' },
  { row: 0, sub: 2, frames: 5, home: 'Home 1 · 物品入抽屉', en: 'pick up tong', zh: '拿起夹子', act: '夹爪对准并夹起桌上的夹子（tong）' },
  { row: 0, sub: 3, frames: 5, home: 'Home 1 · 物品入抽屉', en: 'put tong into drawer', zh: '夹子放入抽屉', act: '把夹子移到抽屉上方，松爪放入' },
  { row: 0, sub: 4, frames: 5, home: 'Home 1 · 物品入抽屉', en: 'push the top drawer', zh: '推上抽屉', act: '把抽屉推回原位，任务收尾' },
  // Home 2: 5 frames (pick plate → put plate → pick cup? → put cup → pick spoon/bowl)
  { row: 1, sub: 0, frames: 5, home: 'Home 2 · 餐具入池', en: 'pick up plate', zh: '捡起盘子', act: '从台面夹起待洗的盘子' },
  { row: 1, sub: 1, frames: 5, home: 'Home 2 · 餐具入池', en: 'put plate in the sink', zh: '盘子放入水池', act: '持盘移向水池，松爪放入' },
  { row: 1, sub: 2, frames: 5, home: 'Home 2 · 餐具入池', en: 'put cup in the sink', zh: '杯子放入水池', act: '夹起杯子送进水池' },
  { row: 1, sub: 3, frames: 5, home: 'Home 2 · 餐具入池', en: 'pick up the spoon', zh: '捡起勺子', act: '回到台面，夹起勺子' },
  { row: 1, sub: 4, frames: 5, home: 'Home 2 · 餐具入池', en: 'pick up bowl', zh: '捡起碗', act: '夹起最后一个碗' },
  // Home 3: 5 frames (pick shirt ×2 → put clothes → put shirt → put clothes)
  { row: 2, sub: 0, frames: 5, home: 'Home 3 · 衣物入篮', en: 'pick up shirt', zh: '捡起衬衫', act: '从床边夹起散落的衣物' },
  { row: 2, sub: 1, frames: 5, home: 'Home 3 · 衣物入篮', en: 'pick up shirt', zh: '再捡一件衬衫', act: '又拿起一件衣物（同类动作重复出现）' },
  { row: 2, sub: 2, frames: 5, home: 'Home 3 · 衣物入篮', en: 'put clothes in the basket', zh: '衣物放入篮', act: '带衣物移向篮口，松爪放入' },
  { row: 2, sub: 3, frames: 5, home: 'Home 3 · 衣物入篮', en: 'put the shirt in the basket', zh: '衬衫放入篮', act: '把衬衫精确放入篮中' },
  { row: 2, sub: 4, frames: 5, home: 'Home 3 · 衣物入篮', en: 'put clothes in the basket', zh: '衣物放入篮', act: '最后一批衣物入篮，任务完成' },
];

const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e07';
const MUTED = '#68778f';

// Frame strip geometry (measured from the cropped rollout strip image,
// 1473×370): the photo frames start at x≈12% and extend to x≈57%; the three
// row bands (subtask text + frames) measured at y 2.7–22.7%, 34.9–54.1%,
// 65.9–85.9% of image height.
const FRAME_X0 = 12;
const FRAME_X1 = 57.4;
const ROWS: { top: number; h: number }[] = [
  { top: 2, h: 22 },
  { top: 34, h: 21 },
  { top: 65, h: 22 },
];

const LIMITS: { title: string; text: string }[] = [
  { title: '部分可观测', text: '臂挡住要擦的污渍——看不到的地方，就擦不干净。' },
  { title: '易分心', text: '高层被带偏：反复开关抽屉，同一动作来回做。' },
  { title: '难开的柜门', text: '物理挑战 + 陌生把手：没见过的门不好开。' },
];

export const Ch10Rollout: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const row = ROWS[s.row];
  const stripW = FRAME_X1 - FRAME_X0;
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${FRAME_X0 + (s.sub / s.frames) * stripW}%`,
    width: `${stripW / s.frames}%`,
    top: `${row.top}%`,
    height: `${row.h}%`,
    border: `3px solid ${ORANGE}`,
    borderRadius: 6,
    boxShadow: `0 0 0 3px ${ORANGE}40, inset 0 0 0 2px rgba(255,255,255,0.55)`,
    transition: 'left .45s ease, top .45s ease',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };
  const rowTintStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: '100%',
    top: `${row.top}%`,
    height: `${row.h}%`,
    background: 'rgba(34, 141, 92, 0.07)',
    transition: 'top .45s ease',
    pointerEvents: 'none',
  };

  return (
    <div id={`w-${chapterId}-${moduleId}`}>
      <div style={{ position: 'relative', border: '1px solid #d7deea', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <img
          src="./images/figure-7-strip.png"
          alt="论文图 7(a)：三所真实新家的多阶段任务 rollout 实录（高亮框随步移动）"
          loading="lazy"
          style={{ display: 'block', width: '100%', margin: 0, borderRadius: 0, border: 0 }}
        />
        <div style={rowTintStyle} />
        <div style={boxStyle} />
      </div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
        论文图 7(a) · 高亮框随步骤移动（各行为一个家的连续帧）· 量化图 (b) 见论文原文
      </div>

      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', margin: '10px 0 4px' }} aria-hidden="true">
        {STEPS.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === step ? 18 : 9,
              height: 9,
              borderRadius: 999,
              background: i === step ? BLUE : i < step ? GREEN : '#d7deea',
              transition: 'all .3s ease',
            }}
          />
        ))}
      </div>

      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步 · {s.home}
        </span>
        <button className="tiny" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={last}>
          下一步 ▶
        </button>
        <button className="tiny ghost" onClick={() => setStep(0)} disabled={step === 0}>
          复位
        </button>
      </div>

      <div
        style={{
          margin: '8px 0 4px',
          padding: '10px 14px',
          background: '#f5f8f0',
          borderLeft: `4px solid ${BLUE}`,
          borderRadius: '0 8px 8px 0',
          fontSize: 13,
          color: '#21324a',
        }}
        dangerouslySetInnerHTML={{ __html: `<b>${s.zh}</b>（模型高层输出：「${s.en}」）—— ${s.act}` }}
      />

      <div className="three-col-demo">
        {LIMITS.map((lim) => (
          <div key={lim.title} className="three-col-panel noisy">
            <div className="three-col-label" style={{ color: RED }}>
              {lim.title}
            </div>
            <div style={{ fontSize: 12, color: '#21324a', lineHeight: 1.5 }}>{lim.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch', marginTop: 10 }}>
        <div
          style={{
            flex: '1 1 200px',
            border: `2px solid ${GREEN}`,
            borderRadius: 8,
            padding: '10px 14px',
            background: '#f0f7f2',
          }}
        >
          <div style={{ color: GREEN, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>前景 · VI 语言示范</div>
          <div style={{ fontSize: 12, color: '#21324a', lineHeight: 1.5 }}>
            专家用口令「遥控」机器人干活——语言示范是新一代监督模态，为高层策略提供优质拆单标签。
          </div>
        </div>
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 8px',
          }}
        >
          <a href="https://pi.website/blog/pi05" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: BLUE }}>
            视频与更多：pi.website/blog/pi05 ↗
          </a>
        </div>
      </div>

      <div
        className="feedback"
        dangerouslySetInnerHTML={{
          __html: '三所新家的门都推开了——<b>下一扇，等更长的上下文与记忆</b>。',
        }}
      />
    </div>
  );
};

export default Ch10Rollout;
