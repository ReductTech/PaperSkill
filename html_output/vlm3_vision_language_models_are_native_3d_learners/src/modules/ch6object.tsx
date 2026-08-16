import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, label, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

type Mode =
  | 'leftRight'
  | 'bigSmall'
  | 'behindFront'
  | 'distance'
  | 'width'
  | 'height';

type ModeDef = {
  kind: 'qual' | 'quant';
  name: string;
  question: string;
  answer: string;
  highlight: 'A' | 'B' | 'both';
  note: string;
};

const MODES: Record<Mode, ModeDef> = {
  leftRight: {
    kind: 'qual',
    name: 'Left/Right',
    question: 'Is A left or right of B?',
    answer: 'A is left of B',
    highlight: 'both',
    note: '定性：相对左右——只靠文本 bbox，无需物体名称或 mask 编码器。',
  },
  bigSmall: {
    kind: 'qual',
    name: 'Big/Small',
    question: 'Which is bigger, A or B?',
    answer: 'B is bigger than A',
    highlight: 'B',
    note: '定性：相对大小——同一套文本框接口。',
  },
  behindFront: {
    kind: 'qual',
    name: 'Behind/Front',
    question: 'Is A behind or in front of B?',
    answer: 'A is behind B',
    highlight: 'A',
    note: '定性：前后关系——SpatialRGPT-Bench 同类问题。',
  },
  distance: {
    kind: 'quant',
    name: 'Distance',
    question: 'Direct distance between A and B?',
    answer: 'distance ≈ 2.4 m',
    highlight: 'both',
    note: '定量：物体间距离（米）——输出仍是文本。',
  },
  width: {
    kind: 'quant',
    name: 'Width',
    question: 'What is the width of B?',
    answer: 'width ≈ 1.2 m',
    highlight: 'B',
    note: '定量：物体宽度——用 bbox 文本引用目标物体。',
  },
  height: {
    kind: 'quant',
    name: 'Height',
    question: 'What is the height of A?',
    answer: 'height ≈ 1.8 m',
    highlight: 'A',
    note: '定量：物体高度——定性/定量共用文本框格式。',
  },
};

const BOX_A = { x: 70, y: 70, w: 70, h: 90, label: 'A', bbox: '[620,780,980,1480]' };
const BOX_B = { x: 160, y: 55, w: 95, h: 110, label: 'B', bbox: '[1120,620,1680,1520]' };

/** 6.2：切换定性/定量设置，改变问答与高亮 */
export const Ch6Object: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('leftRight');
  const [mode, setMode] = useState<Mode>('leftRight');
  const [feedback, setFeedback] = useState({ text: MODES.leftRight.note, cls: 'good' });

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const m = modeRef.current;
      const def = MODES[m];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      drawWindow(ctx, 40, 28, 240, 155, C.blue);

      const drawBox = (b: typeof BOX_A, active: boolean) => {
        ctx.strokeStyle = active ? C.orange : C.muted;
        ctx.lineWidth = active ? 2.8 : 1.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = active ? C.orange : C.muted;
        ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(b.label, b.x + 6, b.y + 16);
      };

      const aOn = def.highlight === 'A' || def.highlight === 'both';
      const bOn = def.highlight === 'B' || def.highlight === 'both';
      drawBox(BOX_A, aOn);
      drawBox(BOX_B, bOn);

      // 类型角标
      ctx.fillStyle = def.kind === 'qual' ? C.orange : C.green;
      ctx.fillRect(40, 28, 64, 18);
      ctx.fillStyle = '#fff';
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(def.kind === 'qual' ? '定性' : '定量', 54, 41);

      // 右侧输出
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.fillRect(310, 28, 220, 155);
      ctx.strokeRect(310, 28, 220, 155);
      label(ctx, '文本 bbox 引用', 325, 52, C.blue, 13);
      label(ctx, 'A ' + BOX_A.bbox, 320, 78, C.text, 11);
      label(ctx, 'B ' + BOX_B.bbox, 320, 98, C.text, 11);
      label(ctx, 'Q: ' + def.question, 320, 128, C.muted, 11);
      label(ctx, 'A: ' + def.answer, 320, 154, def.kind === 'qual' ? C.orange : C.green, 13);

      drawCaption(
        ctx, W, H,
        (def.kind === 'qual' ? '定性 · ' : '定量 · ') + def.name + ' — 无需额外区域编码器',
        def.kind === 'qual' ? C.orange : C.green,
        12,
      );
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    setFeedback({ text: MODES[m].note, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>定性</span>
        {(['leftRight', 'bigSmall', 'behindFront'] as Mode[]).map((k) => (
          <button key={k} type="button" className={`chip ${mode === k ? 'on' : ''}`} onClick={() => pick(k)}>
            {MODES[k].name}
          </button>
        ))}
        <span style={{ color: 'var(--ink-2)', fontSize: 13, marginLeft: 8 }}>定量</span>
        {(['distance', 'width', 'height'] as Mode[]).map((k) => (
          <button key={k} type="button" className={`chip ${mode === k ? 'on' : ''}`} onClick={() => pick(k)}>
            {MODES[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ fontStyle: 'normal' }}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Object;
