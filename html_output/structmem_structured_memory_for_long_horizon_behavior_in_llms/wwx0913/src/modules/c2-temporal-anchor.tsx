import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, label } from './sceneKit';
import { Formula } from '../components/Formula';
import type { WidgetProps } from './registry';

// §2 模块 2.2：时间锚定的流程（论文 §3.1 后半 = 式(2)）。
// 七个步骤、四栏：批次内的消息 → 时间基准与步进 → 抽取只给来源编号 → 回查并落库。
// 只讲流程与机制，不引用任何代码。

const W = 1080;
const H = 280;

const A = { x: 30, y: 76, w: 250, h: 152 };
const B = { x: 310, y: 76, w: 250, h: 152 };
const C = { x: 590, y: 76, w: 210, h: 152 };
const D = { x: 830, y: 76, w: 220, h: 152 };

const STEPS = [
  {
    desc: '一个批次进来：里面的消息按顺序排好，每条都带着内容与说话人。',
    feedback: '此时还没有任何「条目」——有的只是一批排好序的原始消息。',
    cls: '' as const,
    hot: ['a'],
    tag: '一批消息',
  },
  {
    desc: '先把时间算好：以这一场会话的起点为基准，按消息在批内的序号逐条递进。',
    feedback: '注意顺序——时间是在调用模型之前就算好的，不是等条目回来再补。每条消息各有自己的时间戳与星期。（论文式(2) 只要求条目锚定到「其来源时刻」；这里按 500 毫秒步进是参考实现 LightMem 的做法。）',
    cls: '' as const,
    hot: ['b'],
    tag: '先算时间',
  },
  {
    desc: '时间绑定不是独立环节：它是「冲出批次的那一次调用」的收尾动作。',
    feedback: '这一轮没冲出批次就直接结束；而且只有抽取真的执行了，后面才会有条目可绑。所以它只发生在第二层缓冲区满，触发双视角抽取的轮次。',
    cls: '' as const,
    hot: ['c', 'd'],
    tag: '调用的收尾',
  },
  {
    desc: '抽取：模型不回答时间，只回答「这条来自第几句」。',
    feedback: '输出格式里来源编号只能是一个整数——模型没有办法表达「这条来自第 5 轮到第 9 轮」。',
    cls: '' as const,
    hot: ['c'],
    tag: '只给来源编号',
  },
  {
    desc: '回查：按来源编号取出那句消息的时间戳、星期与说话人。',
    feedback: '这一步本身不做任何推理，只是一次查表——时间戳早在第二步就算好了。',
    cls: 'good' as const,
    hot: ['a', 'c'],
    tag: '回查来源',
  },
  {
    desc: '一条条目只落在一个时间点上。',
    feedback: '横跨多轮才总结出来的一条，也只能挂在模型选定的那一句上。',
    cls: 'bad' as const,
    hot: ['c'],
    tag: '只绑一个点',
  },
  {
    desc: '于是「同一时间戳」上的条目，就是同一条话语产出的全部条目：事实的加关系的。',
    feedback: '作为§3.2 同时刻重建的依据：它取的是一句话的两个视角，而不是相邻的几轮对话。',
    cls: 'good' as const,
    hot: ['d'],
    tag: '同刻即同一句',
  },
];

const FORMULA_LEAD =
  '条目不是「加上」时间戳，而是回查它的来源消息取回来的——这是事件级绑定的下半段。';

const FORMULA_UNICODE = 'M ← ⋃ { ⟨x, e_x, τi⟩ | x ∈ Φi ∪ Ψi }';

const FORMULA_SYMBOLS = [
  { sym: 'M', desc: '<b>记忆集合</b>：写入向量库的全部条目。' },
  { sym: '⋃', desc: '把所有输入产出的条目<b>并起来</b>。' },
  { sym: '⟨x, e_x, τi⟩', desc: '一条记忆记录的<b>最小三元组</b>：条目文本 + 条目向量 + 来源时间。' },
  { sym: 'x', desc: '一条<b>条目</b>（事实或关系，以自然语言书写）。' },
  { sym: 'e_x', desc: '条目的<b>向量表示</b>，供之后按相似度检索。' },
  { sym: 'τi', desc: '该条目的<b>来源时间戳</b>——由来源编号回查到的那条消息的时间。' },
  { sym: 'Φi ∪ Ψi', desc: '第 i 条输入产出的事实条目与关系条目。' },
];

const FORMULA_NOTE =
  '论文把 τi 写成条目自带的第三元；实现里它是「查表得到」的：模型只给来源编号，代码据此取回那条消息的时间戳、星期与说话人，而时间戳本身以「会话起点 + 批内序号 × 500 毫秒」提前算好。此外，来源编号越界会被挪到本批最后一句，换算不出位置的条目会被记录后跳过。';

function colBox(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  on: boolean,
  title: string
): void {
  fillRound(ctx, b.x, b.y, b.w, b.h, 10, on ? COL.white : 'rgba(255,255,255,0.5)');
  ctx.strokeStyle = on ? COL.blue : COL.axis;
  ctx.lineWidth = on ? 3 : 1;
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.stroke();
  label(ctx, title, b.x + 12, b.y - 8, on ? COL.ink : COL.muted, 'left', 15);
}

export const C2TemporalAnchor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<number>(0);
  const [step, setStep] = useState(0);

  const cur = STEPS[Math.min(step, STEPS.length - 1)];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = STEPS[Math.min(stateRef.current, STEPS.length - 1)];
      const isOn = (k: string) => s.hot.indexOf(k) >= 0;
      clearScene(ctx, W, H, true);

      colBox(ctx, A, isOn('a'), '批次内的消息');
      colBox(ctx, B, isOn('b'), '时间基准与步进');
      colBox(ctx, C, isOn('c'), '抽取只给来源编号');
      colBox(ctx, D, isOn('d'), '回查并落库');

      drawArrow(ctx, A.x + A.w, 152, B.x - 4, 152, isOn('b') ? COL.blue : COL.axis, 7);
      drawArrow(ctx, B.x + B.w, 152, C.x - 4, 152, isOn('c') ? COL.blue : COL.axis, 7);
      drawArrow(ctx, C.x + C.w, 152, D.x - 4, 152, isOn('d') ? COL.blue : COL.axis, 7);

      // A：四条消息，各带一个序号刻度
      for (let i = 0; i < 4; i += 1) {
        const y = A.y + 20 + i * 32;
        ctx.fillStyle = isOn('a') ? COL.orange : COL.axis;
        ctx.fillRect(A.x + 12, y + 6, 7, 14);
        ctx.fillStyle = isOn('a') ? COL.blue : COL.axis;
        ctx.fillRect(A.x + 26, y + 8, 150 - i * 16, 5);
        ctx.fillStyle = COL.axis;
        ctx.fillRect(A.x + 26, y + 18, 110, 5);
      }

      // B：时间轴 + 500ms 刻度
      ctx.strokeStyle = isOn('b') ? COL.blue : COL.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(B.x + 22, B.y + 52);
      ctx.lineTo(B.x + B.w - 22, B.y + 52);
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const x = B.x + 32 + i * 60;
        ctx.beginPath();
        ctx.moveTo(x, B.y + 46);
        ctx.lineTo(x, B.y + 58);
        ctx.strokeStyle = i === 0 ? COL.orange : isOn('b') ? COL.blue : COL.axis;
        ctx.lineWidth = i === 0 ? 3 : 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, B.y + 88, 6, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? COL.orange : isOn('b') ? COL.blue : COL.axis;
        ctx.fill();
      }
      drawArrow(ctx, B.x + 32, B.y + 116, B.x + 194, B.y + 116, isOn('b') ? COL.orange : COL.axis, 7);

      // C：三张条目卡，各带一个来源编号小方块
      for (let i = 0; i < 3; i += 1) {
        const y = C.y + 18 + i * 42;
        fillRound(ctx, C.x + 12, y, 186, 32, 6, COL.white);
        ctx.strokeStyle = isOn('c') ? (i === 2 ? COL.purple : COL.blue) : COL.axis;
        ctx.lineWidth = isOn('c') ? 2 : 1;
        roundRect(ctx, C.x + 12, y, 186, 32, 6);
        ctx.stroke();
        ctx.fillStyle = isOn('c') ? (i === 2 ? COL.purple : COL.blue) : COL.axis;
        ctx.fillRect(C.x + 22, y + 8, 96, 5);
        ctx.fillStyle = COL.axis;
        ctx.fillRect(C.x + 22, y + 19, 66, 5);
        ctx.fillStyle = isOn('c') ? COL.orange : COL.axis;
        ctx.fillRect(C.x + 160, y + 8, 26, 14);
      }

      // D：一条记忆记录（四个字段行）
      fillRound(ctx, D.x + 14, D.y + 26, 192, 96, 8, COL.white);
      ctx.strokeStyle = isOn('d') ? COL.green : COL.axis;
      ctx.lineWidth = isOn('d') ? 3 : 1;
      roundRect(ctx, D.x + 14, D.y + 26, 192, 96, 8);
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = isOn('d') ? (i === 0 ? COL.blue : i === 1 ? COL.purple : i === 2 ? COL.orange : COL.dark) : COL.axis;
        ctx.fillRect(D.x + 28, D.y + 42 + i * 20, 160 - i * 14, 6);
      }

      // 回查虚线
      if (isOn('a') && isOn('c')) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(C.x + 12, C.y + 34);
        ctx.lineTo(A.x + A.w + 8, A.y + 36);
        ctx.stroke();
        ctx.restore();
      }

      label(ctx, s.tag, 540, 46, COL.blue, 'center', 20);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (n: number): void => {
    const c = Math.max(0, Math.min(STEPS.length - 1, n));
    stateRef.current = c;
    setStep(c);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="step-label">
          第 {step + 1} 步 / 共 {STEPS.length} 步
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === STEPS.length - 1}
          onClick={() => go(step + 1)}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="step-desc" aria-live="polite">
        {cur.desc}
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.feedback}</div>
      <Formula formula={{ lead: FORMULA_LEAD, unicode: FORMULA_UNICODE, symbols: FORMULA_SYMBOLS }} />
      <div className="feedback" style={{ borderLeftColor: '#d97706' }}>
        <b>与论文写法的差别：</b>
        {FORMULA_NOTE}
      </div>
    </div>
  );
};

export default C2TemporalAnchor;
