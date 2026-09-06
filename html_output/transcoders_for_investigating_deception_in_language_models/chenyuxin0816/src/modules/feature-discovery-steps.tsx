import { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { isPresentationMode } from '../lib/presentation';
import { COLORS, drawArrow, drawFile, drawNode, drawSeal, drawText, roundedRect } from './case-file-analogy';

const STEP_LABELS = ['构建归因图', '选择种子词', '沿边记录候选', 'Steering 验证'];

function drawSteps(canvas: HTMLCanvasElement, step: number) {
  const ctx = setupCanvas(canvas, 560, 240);
  canvas.style.width = '100%';
  canvas.style.maxWidth = '560px';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = '7 / 3';
  ctx.clearRect(0, 0, 560, 240);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 560, 240);

  roundedRect(ctx, 16, 12, 528, 38, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();
  const short = ['建图', '种子', '追踪', '验证'];
  for (let index = 0; index < 4; index += 1) {
    const x = 75 + index * 137;
    if (index < 3) drawArrow(ctx, x + 14, 31, x + 123, 31, index + 1 < step ? COLORS.blue : COLORS.border, 2);
    ctx.beginPath();
    ctx.arc(x, 31, 11, 0, Math.PI * 2);
    ctx.fillStyle = index + 1 <= step ? (step === 4 ? COLORS.green : COLORS.blue) : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = index + 1 <= step ? (step === 4 ? COLORS.green : COLORS.blue) : COLORS.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, String(index + 1), x, 31, { size: 10, align: 'center', color: index + 1 <= step ? '#fff' : COLORS.muted, weight: 700 });
    drawText(ctx, short[index], x, 47, { size: 9, align: 'center', color: index + 1 === step ? COLORS.blue : COLORS.muted });
  }

  roundedRect(ctx, 16, 62, 204, 160, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();
  drawFile(ctx, 32, 78, 172, 126, '当前提示');
  roundedRect(ctx, 56, 128, 108, 38, 6);
  ctx.fillStyle = step >= 3 ? '#fff5e8' : '#f5f7fb';
  ctx.fill();
  ctx.strokeStyle = step >= 3 ? COLORS.orange : COLORS.border;
  ctx.lineWidth = step >= 3 ? 2 : 1.5;
  ctx.stroke();
  drawText(ctx, step >= 3 ? '待验证候选' : step === 2 ? '已选种子词' : '尚未提出', 110, 147, {
    size: 12,
    align: 'center',
    color: step >= 3 ? COLORS.orange : COLORS.muted,
    weight: 700,
  });
  if (step === 4) {
    roundedRect(ctx, 119, 90, 54, 27, 5);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
    drawText(ctx, '保留', 146, 104, { size: 11, align: 'center', color: '#fff', weight: 800 });
  }
  drawSeal(ctx, 190, 92, step === 4, '规则');

  roundedRect(ctx, 238, 62, 306, 160, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = step === 4 ? COLORS.green : COLORS.border;
  ctx.lineWidth = step === 4 ? 2.5 : 1.5;
  ctx.stroke();
  drawText(ctx, `${step} / 4 · ${STEP_LABELS[step - 1]}`, 254, 80, {
    size: 12,
    color: step === 4 ? COLORS.green : COLORS.blue,
    weight: 800,
  });

  if (step <= 3) {
    const graphNodes = [
      { x: 280, y: 137, label: step >= 2 ? 'hidden' : 'token' },
      { x: 358, y: 109, label: step >= 3 ? '隐匿' : '前层特征' },
      { x: 437, y: 158, label: step >= 3 ? '保密' : '后层特征' },
      { x: 508, y: 121, label: '输出' },
    ];
    drawArrow(ctx, 292, 132, 346, 113, step >= 3 ? COLORS.blue : COLORS.border, step >= 3 ? 3 : 1.5);
    drawArrow(ctx, 370, 115, 425, 151, step >= 3 ? COLORS.blue : COLORS.border, step >= 3 ? 3 : 1.5);
    drawArrow(ctx, 449, 151, 496, 126, step >= 3 ? COLORS.blue : COLORS.border, step >= 3 ? 3 : 1.5);
    graphNodes.forEach((node, index) => drawNode(ctx, node.x, node.y, node.label, index === 0 ? step >= 2 : step >= 3, false, 10));
    if (step === 2) {
      drawText(ctx, 'private / hidden / confidential', 391, 196, { size: 10, align: 'center', color: COLORS.blue });
    } else if (step === 3) {
      drawText(ctx, '与否定、隐匿、保密相关，但仍待干预', 391, 196, { size: 10, align: 'center', color: COLORS.orange });
    } else {
      drawText(ctx, 'token、特征与输出构成有向图骨架', 391, 196, { size: 10, align: 'center', color: COLORS.muted });
    }
  } else {
    roundedRect(ctx, 258, 99, 118, 54, 6);
    ctx.fillStyle = '#e8f6ee';
    ctx.fill();
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, '标签按预期翻转', 317, 118, { size: 11, align: 'center', color: COLORS.green, weight: 700 });
    drawText(ctx, '→ 保留', 317, 139, { size: 12, align: 'center', color: COLORS.green, weight: 800 });

    roundedRect(ctx, 396, 99, 126, 54, 6);
    ctx.fillStyle = '#fff2f3';
    ctx.fill();
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, '标签没有翻转', 459, 118, { size: 11, align: 'center', color: COLORS.red, weight: 700 });
    drawText(ctx, '→ 不保留', 459, 139, { size: 12, align: 'center', color: COLORS.red, weight: 800 });
    drawText(ctx, '重复流程后：112 个候选特征', 390, 185, { size: 12, align: 'center', color: COLORS.green, weight: 800 });
    drawText(ctx, '候选规模，不是准确率', 390, 205, { size: 10, align: 'center', color: COLORS.orange });
  }
  canvas.classList.add('is-ready');
}

export function FeatureDiscoverySteps() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(() => (isPresentationMode() ? 4 : 1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawSteps(canvas, step);
    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [step]);

  const feedback = [
    { color: COLORS.blue, text: '第 1 步：用预训练逐层转码器为当前提示构建归因图。' },
    { color: COLORS.blue, text: '第 2 步：人工选择 private、hidden、confidential 等种子词作为追踪入口。' },
    { color: COLORS.orange, text: '第 3 步：沿边记录与否定、隐匿或保密相关的特征；它们此时仍是待验证候选。' },
    { color: COLORS.green, text: '第 4 步：只有特征干预让 D/ND 标签按预期翻转，候选才被保留；重复后论文得到 112 个候选特征。' },
  ][step - 1];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
          上一步
        </button>
        <button type="button" onClick={() => setStep((value) => Math.min(4, value + 1))} disabled={step === 4}>
          {step === 3 ? '查看保留规则' : step === 4 ? '流程完成' : '下一步'}
        </button>
        <button type="button" onClick={() => setStep(1)} disabled={step === 1}>
          重新开始
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={`欺骗相关候选特征发现流程，第 ${step} 步：${STEP_LABELS[step - 1]}`}
        style={{ display: 'block', width: '100%', maxWidth: 560, height: 'auto', margin: '0 auto' }}
      />
      <div
        className="feedback"
        aria-live="polite"
        style={{ borderLeft: `4px solid ${feedback.color}`, background: `${feedback.color}12`, padding: '10px 12px' }}
      >
        {feedback.text}
      </div>
      <div style={{ color: COLORS.orange, fontSize: 13 }}>
        种子选择和语义判断由人工完成，不能描述为自动、无偏或独立验证。
      </div>
    </div>
  );
}
