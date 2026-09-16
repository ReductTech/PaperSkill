import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, label } from './sceneKit';
import { Formula } from '../components/Formula';
import type { WidgetProps } from './registry';

// §3 模块：论文 §3.2 跨事件巩固 —— 以论文的描述为准。
// 七个步骤、六个节点：缓冲排序【式3】 → 语义连接取种子 → 事件重建【式4】 → 跨事件结构【式5】
// → 综合【式6】 → 与原始条目互补的两层。

const W = 1080;
const H = 280;

const NODES = ['缓冲与排序', '语义连接', '事件重建', '跨事件结构', '综合', '互补两层'];
const BOX_W = 148;
const BOX_H = 78;
const BOX_Y = 104;
const BOX_X = (i: number): number => 51 + i * (BOX_W + 18);

interface StepDef {
  desc: string;
  feedback: string;
  cls: '' | 'good' | 'bad';
  node: number;
  tag: string;
}

const STEPS: StepDef[] = [
  {
    desc: '§3.1 解决的是「一个事件内部的事实与关系不能散开」，§3.2 解决的是「不同时间的事件之间要被显式连起来」。',
    feedback:
      '手段是周期性地把语义相关的事件综合成更高一层的抽象。这一层与原始条目互补，而不是替代：抽象层负责多轮推理，原始条目负责保真。',
    cls: '',
    node: 0,
    tag: '要解决的问题',
  },
  {
    desc: '先把「自上一次巩固以来尚未整合的条目」缓冲起来，并按时间排序。',
    feedback:
      '论文式(3)：C_buf = Sort_τ{ x ∈ M_buffer }。这一步得到的是时间有序的缓冲上下文——顺序本身就是信息，后面的综合要靠它还原事件推进。',
    cls: '',
    node: 0,
    tag: '式(3) 缓冲排序',
  },
  {
    desc: '语义事件连接：把缓冲区的条目文本拼接起来，编码成一个聚合查询向量。',
    feedback:
      '再用这个向量对历史条目按余弦相似度排序，取最相近的前 K 条作为种子 S_k。注意查询来自整段缓冲内容，而不是某一条发言。',
    cls: '',
    node: 1,
    tag: '语义连接',
  },
  {
    desc: '事件重建：对每个种子条目，取回所有与它共享同一时间戳的条目。',
    feedback:
      '论文式(4)：E_τ(x*) = { x′ ∈ M | τ(x′) = τ(x*) }。抽出来的条目原本是碎片，靠时间戳这一步才能还原成一个完整的事件上下文。',
    cls: 'good',
    node: 2,
    tag: '式(4) 事件重建',
  },
  {
    desc: '把重建出来的事件与缓冲里的事件合在一起，得到跨事件结构。',
    feedback:
      '论文式(5)：C_cross = C_buf ∪ ⋃_{x*∈S_k} E_τ(x*)。它是「基于语义相关性落地」的结构——既有当下这一段，也有与它语义相关的历史事件。',
    cls: '',
    node: 3,
    tag: '式(5) 跨事件结构',
  },
  {
    desc: '综合：把跨事件结构交给模型，显式地综合出跨事件的关系假设。',
    feedback:
      '论文式(6)：C_cons = L(P_cons ∥ C_cross)。论文特意把它和「传统摘要」划清界限——传统摘要是对顺序文本做有损压缩，而这里是在语义重建出来的事件簇上操作，形成互补的抽象层，同时保住原始情景记忆的保真度。',
    cls: 'good',
    node: 4,
    tag: '式(6) 综合',
  },
  {
    desc: '小结与原始条目分开放置，形成互补的两层。',
    feedback:
      '触发是周期性的：当累积的事件超过时间阈值时才做一次巩固，而不是每来一条发言就跑一次。这样既让跨时间的关系浮出来，又不必持续维护一张图。',
    cls: 'good',
    node: 5,
    tag: '互补的两层',
  },
];

const FORMULA_LEAD =
  '这一段的核心动作是式(6)：在语义重建出来的事件簇上做一次综合，产出与原始条目互补的高层抽象。';

const FORMULA_UNICODE = 'C_cons = L(P_cons ∥ C_cross)';

const FORMULA_SYMBOLS = [
  { sym: 'C_cons', desc: '<b>综合结果</b>：这一轮巩固写下的跨事件小结。' },
  { sym: 'L', desc: '执行综合的<b>语言模型</b>。' },
  { sym: 'P_cons', desc: '<b>综合提示词</b>：要求引用具体时间、突出因果，并限定篇幅。' },
  { sym: 'C_cross', desc: '<b>跨事件结构</b>：缓冲里的事件，加上按时间戳重建出来的历史事件。' },
  { sym: '∥', desc: '<b>拼接</b>：提示词与跨事件结构一起送进模型。' },
];

function nodeBox(ctx: CanvasRenderingContext2D, i: number, on: boolean, active: boolean): void {
  const x = BOX_X(i);
  fillRound(ctx, x, BOX_Y, BOX_W, BOX_H, 10, on ? COL.white : 'rgba(255,255,255,0.45)');
  ctx.strokeStyle = active ? COL.blue : COL.axis;
  ctx.lineWidth = active ? 3 : 1;
  roundRect(ctx, x, BOX_Y, BOX_W, BOX_H, 10);
  ctx.stroke();
}

export const C3CrossEvent: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      clearScene(ctx, W, H, true);

      for (let i = 0; i < NODES.length; i += 1) {
        const active = i === s.node;
        const done = i < s.node;
        nodeBox(ctx, i, done || active, active);
        label(ctx, String(i + 1), BOX_X(i) + 20, BOX_Y - 8, active ? COL.blue : COL.muted, 'left', 17);
        if (i < NODES.length - 1) {
          drawArrow(ctx, BOX_X(i) + BOX_W, BOX_Y + BOX_H / 2, BOX_X(i + 1) - 4, BOX_Y + BOX_H / 2, done ? COL.green : COL.axis, 7);
        }
      }

      // 各节点图示按当前进度累积显示，避免每一步都画满整条流水线
      const seen = (i: number): boolean => i <= s.node;

      // 节点 1：按时间排序的缓冲条目
      if (seen(0)) {
        for (let k = 0; k < 4; k += 1) {
          fillRound(ctx, BOX_X(0) + 16, BOX_Y + 12 + k * 14, 116, 9, 3, k < 3 ? COL.blue : COL.axis);
        }
        drawArrow(ctx, BOX_X(0) + 16, BOX_Y + 70, BOX_X(0) + 130, BOX_Y + 70, COL.orange, 6);
      }

      // 节点 2：一个聚合查询向量，检索出种子
      if (seen(1)) {
        drawArrow(ctx, BOX_X(1) + 74, BOX_Y + 40, BOX_X(1) + 74, BOX_Y + 18, COL.purple, 7);
        for (let k = 0; k < 9; k += 1) {
          ctx.beginPath();
          ctx.arc(BOX_X(1) + 34 + (k % 3) * 40, BOX_Y + 52 + Math.floor(k / 3) * 14, 5, 0, Math.PI * 2);
          ctx.fillStyle = COL.green;
          ctx.fill();
        }
      }

      // 节点 3：同刻条目聚拢成一个事件
      if (seen(2)) {
        for (let k = 0; k < 3; k += 1) {
          fillRound(ctx, BOX_X(2) + 16, BOX_Y + 16 + k * 15, 116, 10, 3, COL.blue);
        }
        ctx.strokeStyle = COL.green;
        ctx.lineWidth = 2;
        roundRect(ctx, BOX_X(2) + 11, BOX_Y + 11, 126, 52, 7);
        ctx.stroke();
      }

      // 节点 4：两块合在一起
      if (seen(3)) {
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = COL.blue;
          ctx.fillRect(BOX_X(3) + 16, BOX_Y + 14 + k * 11, 116 - k * 16, 5);
        }
        ctx.strokeStyle = COL.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(BOX_X(3) + 16, BOX_Y + 50);
        ctx.lineTo(BOX_X(3) + 132, BOX_Y + 50);
        ctx.stroke();
        for (let k = 0; k < 2; k += 1) {
          ctx.fillStyle = COL.purple;
          ctx.fillRect(BOX_X(3) + 16, BOX_Y + 54 + k * 11, 116 - k * 28, 5);
        }
      }

      // 节点 5：一段叙事
      if (seen(4)) {
        for (let k = 0; k < 5; k += 1) {
          ctx.fillStyle = COL.purple;
          ctx.fillRect(BOX_X(4) + 16, BOX_Y + 12 + k * 11, 116 - (k % 3) * 24, 4);
        }
      }

      // 节点 6：互补的两层（上=原始条目，下=小结）
      if (seen(5)) {
        fillRound(ctx, BOX_X(5) + 16, BOX_Y + 14, 116, 20, 5, COL.white);
        ctx.strokeStyle = COL.blue;
        ctx.lineWidth = 2;
        roundRect(ctx, BOX_X(5) + 16, BOX_Y + 14, 116, 20, 5);
        ctx.stroke();
        fillRound(ctx, BOX_X(5) + 16, BOX_Y + 42, 116, 20, 5, COL.white);
        ctx.strokeStyle = COL.green;
        roundRect(ctx, BOX_X(5) + 16, BOX_Y + 42, 116, 20, 5);
        ctx.stroke();
        drawArrow(ctx, BOX_X(5) + 74, BOX_Y + 36, BOX_X(5) + 74, BOX_Y + 40, COL.green, 5);
      }

      label(ctx, s.tag, 540, 58, COL.blue, 'center', 20);

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
      <div className="chip-row">
        {NODES.map((n, i) => (
          <span key={n} className={`chip${i === cur.node ? ' selected' : ''}`}>
            {n}
          </span>
        ))}
      </div>
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
    </div>
  );
};

export default C3CrossEvent;
