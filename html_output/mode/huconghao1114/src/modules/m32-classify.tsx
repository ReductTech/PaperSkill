import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, dial, slip, filmChip, label, arrowLine, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 3.2 Forgetting classifier. Four verified cases (Tables 1-2, Figure 2);
// the canvas mirrors the learner's labels with green/red card borders.
const W = 1080;
const H = 240;

const CASES = [
  { brief: '学完 ImageNet 后，GQA 从 37.93 跌到 33.20', answer: 'in', why: '被挤掉的和被训练的都是「答题」，同一输出模态。' },
  { brief: '学完 VQA 后，"A photo of a car" 画成了建筑', answer: 'inter', why: '被训练的是答题，被毁的是出图——跨模态。' },
  { brief: 'TextVQA 从 39.34 跌到 16.84', answer: 'in', why: '新旧理解任务互相挤占，同一输出模态。' },
  { brief: '文本对齐从 0.2592 掉到 0.2162（SeqLoRA）', answer: 'inter', why: '答题训练把「听提示」的生成能力带坏了——跨模态。' },
];

type Pick = ('in' | 'inter' | null);

function drawScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, i: number) {
  if (i % 2 === 0) {
    // two slips competing for the same dial (intra-modal)
    dial(ctx, x + w / 2, y + h / 2 + 6, 26, -0.6);
    slip(ctx, x + 18, y + 24, 52, 30, SC.blue);
    slip(ctx, x + w - 70, y + 24, 52, 30, SC.blue);
    arrowLine(ctx, x + 44, y + 54, x + w / 2 - 30, y + h / 2, SC.blue, 2);
    arrowLine(ctx, x + w - 44, y + 54, x + w / 2 + 30, y + h / 2, SC.blue, 2);
  } else {
    // a slip pressing on a film chip / print (inter-modal)
    slip(ctx, x + 22, y + 26, 56, 34, SC.blue);
    arrowLine(ctx, x + 78, y + 44, x + w - 74, y + 44, SC.blue, 2);
    filmChip(ctx, x + w - 66, y + 26, 40, mix(SC.green, SC.red, i === 1 ? 0.55 : 0.45));
  }
}

export const M32Classify: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState<Pick[]>([null, null, null, null]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    clearStudio(ctx, W, H, 0.96);
    const allRight = picked.every((p, i) => p === CASES[i].answer);
    CASES.forEach((c, i) => {
      const x = 40 + i * 258;
      const y = 24;
      const w = 226;
      const h = 176;
      const p = picked[i];
      const color = p === null ? SC.shade : p === c.answer ? SC.green : SC.red;
      ctx.fillStyle = SC.paper;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = p === null ? 1.5 : 2.5;
      ctx.strokeRect(x, y, w, h);
      drawScene(ctx, x + 8, y + 8, w - 16, 96, i);
      // case number badge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 20, y + 122, 11, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, String(i + 1), x + 20, y + 127, SC.paper, 12, 'center');
      label(ctx, p === null ? '待判断' : p === c.answer ? '判断正确' : '再想想', x + 40, y + 127, color, 12);
      if (allRight) label(ctx, '四案全中', W / 2, 226, SC.green, 14, 'center');
      else label(ctx, '模态内 / 模态间', W / 2, 226, SC.muted, 12, 'center');
    });
  }, [picked]);

  const pick = (i: number, v: 'in' | 'inter') => {
    setPicked((prev) => prev.map((p, j) => (j === i ? v : p)));
  };

  const allRight = picked.every((p, i) => p === CASES[i].answer);
  const wrongCount = picked.filter((p, i) => p !== null && p !== CASES[i].answer).length;

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 8 }}>
        {CASES.map((c, i) => (
          <div key={i} className="hotspot-info" style={{ padding: 10 }}>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              案例 {i + 1}：{c.brief}
            </div>
            <div className="chip-row" style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
              <button className={`chip ${picked[i] === 'in' ? 'selected' : ''}`} onClick={() => pick(i, 'in')}>
                模态内
              </button>
              <button className={`chip ${picked[i] === 'inter' ? 'selected' : ''}`} onClick={() => pick(i, 'inter')}>
                模态间
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={`feedback ${allRight ? 'good' : wrongCount > 0 ? 'bad' : ''}`}>
        {allRight
          ? '四案全中：判断标准只有一条——被毁的能力与被训练的能力是否同属一个输出模态。'
          : wrongCount > 0
          ? '有判断不对：再想想，被挤掉的和被训练的是不是同一种输出？'
          : '给每个案例贴标签：同一输出模态内的挤占是模态内，跨模态的伤害是模态间。'}
      </div>
    </div>
  );
};
export default M32Classify;
