import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.1：扰动一下，输出漂多远（滑块 0–0.1，两条输出对比）。
// 同一扰动强度下：
//   稳定输出：几乎不变（至多 1 个字符漂移）；
//   边界脆弱输出：迅速变乱（大量字符被乱符替换）。
// 下方两条 NED 条并排对比（NED 曲线为示意）。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

const OUTPUT_TEXT = '纸张 ×3 ¥128 · 合计 ¥384 · 备注：加急';
const ALT_CHARS = ['?', '§', '*', '#'];

function feedbackFor(p: number): { text: string; cls: 'good' | 'bad' | '' } {
  if (p < 0.02) {
    return { text: '扰动还很轻：两个输出都基本不变。', cls: '' };
  }
  if (p < 0.06) {
    return { text: '扰动加大：稳定输出仍保持不变，边界脆弱输出已经开始变乱。', cls: '' };
  }
  return { text: '同样的扰动：稳定输出几乎纹丝不动，边界脆弱输出已面目全非——这就是「边界脆弱」。', cls: 'good' };
}

// 输出行：尾部 k 个字符被乱符替换并标红
function drawOutputRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  labelColor: string,
  text: string,
  k: number
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y - 17, w, 26);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y - 17.5, w - 1, 25);
  ctx.fillStyle = labelColor;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 8, y);
  ctx.font = '12px monospace';
  let dx = x + 8 + ctx.measureText(label).width + 14;
  for (let i = 0; i < text.length; i++) {
    const wrong = i >= text.length - k;
    const ch = wrong ? ALT_CHARS[(i * 3) % ALT_CHARS.length] : text[i];
    ctx.fillStyle = wrong ? RED : INK;
    ctx.fillText(ch, dx, y);
    dx += ctx.measureText(ch).width + 1;
    if (dx > x + w - 10) break;
  }
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(0.02);
  const [feedback, setFeedback] = useState(feedbackFor(0.02));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const p = value;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b8c9a7';
    ctx.fillRect(10, 10, W - 20, H - 20);

    // 顶部说明
    ctx.fillStyle = MUTED;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('同样的扰动下，两条输出的变化对比：', 30, 40);

    // 稳定输出：0.06 之前保持不变，之后也只有微小漂移
    const kStable = p < 0.06 ? 0 : Math.min(2, Math.round(((p - 0.06) / 0.04) * 2));
    drawOutputRow(ctx, 30, 88, 500, '稳定输出', BLUE, OUTPUT_TEXT, kStable);

    // 边界脆弱输出：0.02 起开始变乱，之后非线性加速
    const kFragile = p < 0.02
      ? 0
      : Math.min(OUTPUT_TEXT.length, Math.ceil(Math.pow((p - 0.02) / 0.08, 0.7) * OUTPUT_TEXT.length));
    drawOutputRow(ctx, 30, 146, 500, '边界脆弱输出', RED, OUTPUT_TEXT, kFragile);

    // NED 条（两条竖排：稳定在上，脆弱在下）
    const nedStable = p < 0.06 ? 0.02 : 0.02 + 0.4 * (p - 0.06);
    const nedFragile = p < 0.02 ? 0.03 : 0.03 + 8.5 * (p - 0.02);
    ctx.fillStyle = AXIS;
    ctx.fillRect(30, 184, 500, 8);
    ctx.fillStyle = nedStable < 0.1 ? GREEN : nedStable <= 0.3 ? BLUE : RED;
    ctx.fillRect(30, 184, clamp(nedStable, 0, 1) * 500, 8);
    ctx.fillStyle = INK;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('稳定 NED ' + nedStable.toFixed(2), 30, 206);

    ctx.fillStyle = AXIS;
    ctx.fillRect(30, 214, 500, 8);
    const fc = nedFragile < 0.1 ? GREEN : nedFragile <= 0.3 ? BLUE : RED;
    ctx.fillStyle = fc;
    ctx.fillRect(30, 214, clamp(nedFragile, 0, 1) * 500, 8);
    ctx.fillStyle = ORANGE;
    for (const th of [0.1, 0.3]) {
      const tx = 30 + th * 500;
      ctx.fillRect(tx - 0.75, 210, 1.5, 16);
    }
    ctx.fillStyle = INK;
    ctx.font = '12px sans-serif';
    ctx.fillText('脆弱 NED ' + nedFragile.toFixed(2), 30, 238);
    ctx.fillStyle = MUTED;
    ctx.font = '11px sans-serif';
    ctx.fillText('绿=稳定 蓝=漂移 红=脆弱', 200, 238);

    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [value]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Number(e.target.value);
    setValue(p);
    setFeedback(feedbackFor(p));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>扰动强度</label>
        <input
          type="range"
          min={0}
          max={0.1}
          step={0.01}
          value={value}
          onChange={onChange}
          aria-label="扰动强度"
        />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch2Mod1;
