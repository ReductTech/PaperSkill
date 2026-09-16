import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, label } from './sceneKit';
import { Formula } from '../components/Formula';
import type { WidgetProps } from './registry';

// §2 模块：写笔记（论文 §3.1 事件级绑定）的完整流程演示。
// 十个步骤、五个阶段，只讲流程与机制，不引用任何代码。
//   阶段 A 会话与轮次 → B 逐条预压缩 → C 第一层缓冲与分段 → D 第二层缓冲与批次 → E 拼提示与双视角抽取

const W = 1080;
const H = 280;

const STAGES = ['会话与轮次', '逐条预压缩', '缓冲与分段', '批次与编号', '提示与抽取'];

const BOX_W = 190;
const BOX_H = 112;
const BOX_Y = 92;
const GAP = 24;
const BOX_X = (i: number): number => 17 + i * (BOX_W + GAP);

interface StepDef {
  desc: string;
  feedback: string;
  cls: '' | 'good' | 'bad';
  stage: number; // 0-based
  tag: string;
}

const STEPS: StepDef[] = [
  {
    desc: '一个测试单元是一段长对话：里面有好几场会话，每场会话带自己的时间戳，场内是两个说话人轮流发言。',
    feedback: '时间戳是「会话级」的——整场对话共用一个基准时间，而不是每句话各带一个。',
    cls: '',
    stage: 0,
    tag: '测试单元',
  },
  {
    desc: '对话按「轮」喂进去：一轮 = 用户一句 + 助手一句。',
    feedback: '逐轮喂入的好处是缓冲能及时攒、及时切；最后不足一格的那一轮会被强制刷出，不会丢。',
    cls: '',
    stage: 0,
    tag: '逐轮喂入',
  },
  {
    desc: '每一句先被逐条压缩一遍，把冗长的口语压短。',
    feedback: '压缩比例是固定的；如果压完还太长，会反复再压直到够短——这一步不调用大模型，用的是本地压缩模型。',
    cls: '',
    stage: 1,
    tag: '逐条压缩',
  },
  {
    desc: '压缩后的句子进入第一层缓冲。',
    feedback: '这一层只统计「用户发言」的长度——助手的话会一起留着，但不参与计数。这是第一道闸门。',
    cls: '',
    stage: 2,
    tag: '第一层缓冲',
  },
  {
    desc: '缓冲将满时开始找「哪里该切一刀」。第一步找粗边界。',
    feedback: '粗边界看的是注意力：把缓冲里的用户发言拼起来过一遍，看「这一句对上一句的注意力」在哪里出现局部峰值——峰值处就是话题转折点。',
    cls: '',
    stage: 2,
    tag: '粗边界',
  },
  {
    desc: '第二步找细边界：把相邻两轮分别编码，算它们的相似度。',
    feedback: '相似度低于阈值的位置再切一刀。阈值不是固定的：先试一个较低的值，如果一处都找不到就逐步抬高，直到至少切开一处。',
    cls: 'good',
    stage: 2,
    tag: '细边界',
  },
  {
    desc: '切出来的「段」进入第二层缓冲；这一层满了，就把已攒下的段整体吐出来，形成一个批次。',
    feedback: '批次才是双视角抽取的操作单元——不是一句、也不是一段，而是攒够的一批段。两条缓冲串联，绝大多数轮次到不了模型。',
    cls: '',
    stage: 3,
    tag: '形成批次',
  },
  {
    desc: '批次内给每条消息编上序号，每个段编上话题号；同时重算时间戳。',
    feedback:
      '序号每次触发都从头数；时间戳则以「会话时间」为基准，按该会话内已处理到的位置依次递进，因此同一会话里越靠后的批次时间戳越大。',
    cls: '',
    stage: 3,
    tag: '编号与时间',
  },
  {
    desc: '把这一批整理成一段可读的文本：每行是「时间、星期、轮次号、说话人、内容」，多个段之间用话题标记分隔。',
    feedback: '这段文本是纯手工拼出来的，不经过模型。它唯一的目的是让后面的抽取看清「谁在什么时候说了什么」。',
    cls: '',
    stage: 4,
    tag: '拼成提示',
  },
  {
    desc: '同一批文本，配两次提示：一次只问「发生了什么」，一次只问「谁和谁有关」。',
    feedback: '两次调用各产出一种条目，合起来才是一条完整的事件。多个批次可以并行，所以「批」既是抽取单元、也是并行单元。',
    cls: 'good',
    stage: 4,
    tag: '两次抽取',
  },
];

function stageBox(
  ctx: CanvasRenderingContext2D,
  i: number,
  on: boolean,
  active: boolean
): void {
  const x = BOX_X(i);
  fillRound(ctx, x, BOX_Y, BOX_W, BOX_H, 10, on ? COL.white : 'rgba(255,255,255,0.45)');
  ctx.strokeStyle = active ? COL.blue : COL.axis;
  ctx.lineWidth = active ? 3 : 1;
  roundRect(ctx, x, BOX_Y, BOX_W, BOX_H, 10);
  ctx.stroke();
}

/** 阶段 A：一场会话里的三轮发言 */
function glyphSession(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  for (let i = 0; i < 3; i += 1) {
    const ly = y + i * 20;
    ctx.fillStyle = on ? COL.orange : COL.axis;
    ctx.fillRect(x, ly, 8, 4);
    ctx.fillStyle = on ? COL.blue : COL.axis;
    ctx.fillRect(x + 16, ly, 84, 8);
    ctx.fillStyle = on ? COL.purple : COL.axis;
    ctx.fillRect(x + 16, ly + 10, 62, 6);
  }
}

/** 阶段 B：长卡片被压短 */
function glyphCompress(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  for (let i = 0; i < 3; i += 1) {
    const ly = y + i * 20;
    ctx.fillStyle = COL.axis;
    ctx.fillRect(x, ly, 100, 8);
    drawArrow(ctx, x + 106, ly + 4, x + 122, ly + 4, on ? COL.orange : COL.axis, 5);
    ctx.fillStyle = on ? COL.orange : COL.axis;
    ctx.fillRect(x + 128, ly, 54, 8);
  }
}

/** 阶段 C：缓冲条 + 注意力峰值 + 切线 */
function glyphSegment(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  // 注意力峰值示意
  for (let i = 0; i < 9; i += 1) {
    const h = i === 4 ? 22 : 6 + (i % 3) * 3;
    ctx.fillStyle = i === 4 ? COL.orange : on ? COL.blue : COL.axis;
    ctx.fillRect(x + i * 18, y + 26 - h, 10, h);
  }
  // 缓冲条
  ctx.fillStyle = on ? COL.blue : COL.axis;
  ctx.fillRect(x, y + 32, 160, 10);
  // 切线
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = COL.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 86, y + 26);
  ctx.lineTo(x + 86, y + 48);
  ctx.stroke();
  ctx.restore();
}

/** 阶段 D：两层缓冲 -> 批次 */
function glyphBatch(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  ctx.fillStyle = on ? COL.blue : COL.axis;
  ctx.fillRect(x, y, 140, 10);
  ctx.fillStyle = on ? COL.purple : COL.axis;
  ctx.fillRect(x, y + 18, 140, 10);
  ctx.strokeStyle = on ? COL.green : COL.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 40);
  ctx.lineTo(x, y + 46);
  ctx.lineTo(x + 140, y + 46);
  ctx.lineTo(x + 140, y + 40);
  ctx.stroke();
  ctx.fillStyle = on ? COL.green : COL.axis;
  ctx.fillRect(x + 20, y + 52, 100, 10);
}

/** 阶段 E：一段提示 -> 两个出口 */
function glyphExtract(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = COL.axis;
    ctx.fillRect(x, y + i * 12, 120 - i * 12, 6);
  }
  drawArrow(ctx, x + 128, y + 18, x + 146, y + 6, on ? COL.blue : COL.axis, 6);
  drawArrow(ctx, x + 128, y + 22, x + 146, y + 40, on ? COL.purple : COL.axis, 6);
  ctx.fillStyle = on ? COL.blue : COL.axis;
  ctx.fillRect(x + 152, y, 30, 14);
  ctx.fillStyle = on ? COL.purple : COL.axis;
  ctx.fillRect(x + 152, y + 34, 30, 14);
}

const FORMULA_LEAD =
  '同一段输入、同一个模型，只换提示，就得到两类互补的条目——这是事件级绑定的上半段。';

const FORMULA_UNICODE = 'Φi ∪ Ψi = L(P_fact ∥ mi) ∪ L(P_rel ∥ mi)';

const FORMULA_SYMBOLS = [
  { sym: 'Φi', desc: '第 i 条输入抽出的<b>事实条目</b>集合：谁做了什么、什么时候、在哪里。' },
  { sym: 'Ψi', desc: '同一条输入抽出的<b>关系条目</b>集合：人际互动、因果影响、时间依赖。' },
  { sym: 'L', desc: '执行抽取的<b>语言模型</b>。这里被调用两次，但两次用的不是同一套提示。' },
  { sym: 'P_fact', desc: '<b>事实视角</b>提示：抽取事件内容本身。' },
  { sym: 'P_rel', desc: '<b>关系视角</b>提示：抽取人际互动、因果影响与时间依赖。' },
  { sym: 'mi', desc: '第 i 条<b>输入</b>。论文按「单条发言」书写；实现里送进去的是一整个批次。' },
  { sym: '∥', desc: '<b>拼接</b>：提示在前、输入在后，一起送进模型。' },
  { sym: '∪', desc: '两类条目<b>合并</b>。实现上是两份抽取结果直接拼接。' },
];

const FORMULA_NOTE =
  '论文的 mi 是「单条发言」，实现里送进模型的是一个「批次」（攒够的一批段）；同一批文本配两套提示各调一次，两次结果再合并。';

export const C2EventBinding: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      for (let i = 0; i < STAGES.length; i += 1) {
        const on = i <= s.stage;
        const active = i === s.stage;
        stageBox(ctx, i, on, active);
        label(ctx, String(i + 1), BOX_X(i) + 22, BOX_Y - 8, active ? COL.blue : COL.muted, 'left', 17);
        const gx = BOX_X(i) + 25;
        const gy = BOX_Y + 22;
        if (i === 0) glyphSession(ctx, gx, gy, on);
        else if (i === 1) glyphCompress(ctx, gx, gy, on);
        else if (i === 2) glyphSegment(ctx, gx, gy, on);
        else if (i === 3) glyphBatch(ctx, gx, gy, on);
        else glyphExtract(ctx, gx, gy, on);
        if (i < STAGES.length - 1) {
          drawArrow(ctx, BOX_X(i) + BOX_W, BOX_Y + BOX_H / 2, BOX_X(i + 1) - 4, BOX_Y + BOX_H / 2, i < s.stage ? COL.green : COL.axis, 7);
        }
      }

      // 当前步骤的一句话（画布上唯一的短标签）
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

  const jumpStage = (i: number): void => {
    const idx = STEPS.findIndex((s) => s.stage === i);
    if (idx >= 0) go(idx);
  };

  return (
    <div>
      <div className="chip-row">
        {STAGES.map((name, i) => (
          <span
            key={name}
            className={`chip${i === cur.stage ? ' selected' : ''}`}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => jumpStage(i)}
          >
            {i + 1} {name}
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
      <div className="feedback" style={{ borderLeftColor: '#d97706' }}>
        <b>与论文写法的差别：</b>
        {FORMULA_NOTE}
      </div>
    </div>
  );
};

export default C2EventBinding;
