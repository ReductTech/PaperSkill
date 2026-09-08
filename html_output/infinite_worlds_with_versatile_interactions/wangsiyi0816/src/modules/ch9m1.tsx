import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearPanel,
  drawBasket,
  drawInset,
  drawLegend,
  drawPatternCard,
  drawSceneLabel,
  wrapText,
  setupCrispCanvas,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 320;

type Tex = 'cable' | 'plain' | 'lace';

/** Fixed history: textures interleave, so the kept set is never just the newest rows. */
const HISTORY: Tex[] = [
  'cable',
  'cable',
  'plain',
  'lace',
  'plain',
  'plain',
  'cable',
  'plain',
  'lace',
  'plain',
  'plain',
  'plain',
];

const LABEL: Record<Tex, string> = { cable: '扭花', plain: '平纹', lace: '镂空' };

function texMark(
  ctx: CanvasRenderingContext2D,
  tex: Tex,
  x: number,
  y: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  if (tex === 'plain') {
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  } else if (tex === 'cable') {
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 4);
    ctx.quadraticCurveTo(x + 4, y, x - 3, y + 4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export const Ch9M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ signal: Tex }>({ signal: 'cable' });
  const rafRef = useRef<number | null>(null);
  const [signal, setSignal] = useState<Tex>('cable');
  const [feedback, setFeedback] = useState({ text: '', cls: '' });

  const speak = (sig: Tex) => {
    const kept = HISTORY.filter((h) => h === sig).length;
    return {
      text: `当前要织${LABEL[sig]}：保留了 ${kept} 行，其中包含较旧的行，而刚织完的几行反而被丢弃——取舍依据是与当前控制信号的相关性，不是新旧。这样既减小有效上下文（更快），也抑制陈旧或无关内容的干扰（更稳）。`,
      cls: '',
    };
  };

  useEffect(() => {
    setFeedback(speak('cable'));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: { signal: Tex }) => {
      clearPanel(ctx, W, H);
      drawBasket(ctx, 30, 300, 3);

      let kept = 0;
      for (let i = 0; i < HISTORY.length; i++) {
        const y = 74 + i * 18;
        const keep = HISTORY[i] === s.signal;
        if (keep) kept++;
        ctx.save();
        if (keep) {
          ctx.fillStyle = 'rgba(39,68,110,0.16)';
          ctx.strokeStyle = PAL.blue;
          ctx.lineWidth = 1.5;
        } else {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = PAL.envLight;
          ctx.strokeStyle = 'transparent';
          ctx.lineWidth = 0;
        }
        ctx.beginPath();
        ctx.rect(76, y, 300, 14);
        ctx.fill();
        if (keep) ctx.stroke();
        ctx.restore();

        texMark(ctx, HISTORY[i], 62, y + 7, keep ? PAL.blue : PAL.envDark);

        ctx.fillStyle = keep ? PAL.blue : PAL.muted;
        ctx.font = keep ? '600 12px "Segoe UI", sans-serif' : '12px "Segoe UI", sans-serif';
        ctx.fillText(keep ? '保留' : '丢弃', 386, y + 11);
      }

      // age axis: oldest at top, newest at bottom
      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('旧', 40, 86);
      ctx.fillText('新', 40, 284);

      drawPatternCard(ctx, 76, 22, LABEL[s.signal], true);

      drawInset(ctx, 442, 74, 254, 210, '保留判据（示意）');
      let ty = 112;
      ctx.fillStyle = PAL.ink;
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText(`保留 ${kept} 行 / 丢弃 ${HISTORY.length - kept} 行`, 458, ty);
      ty += 28;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = PAL.ink;
      ty = wrapText(ctx, '① 有效上下文更小 → 推理更快', 458, ty, 226, 19);
      ty += 8;
      ty = wrapText(ctx, '② 聚焦最相关历史 → 抑制陈旧无关内容的干扰，画质与连贯性更好', 458, ty, 226, 19);
      ty += 10;
      ctx.fillStyle = PAL.orange;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('按相关性取舍，不按新旧', 458, ty);

      drawSceneLabel(ctx, 142, 50, '当前控制信号');
      drawLegend(ctx, 442, 302, [
        { color: PAL.blue, label: '保留' },
        { color: PAL.envLight, label: '丢弃' },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      detachCrisp();
    };
  }, []);

  const select = (sig: Tex) => {
    stateRef.current.signal = sig;
    setSignal(sig);
    setFeedback(speak(sig));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(['cable', 'plain', 'lace'] as Tex[]).map((s) => (
          <button
            key={s}
            className={`chip${signal === s ? ' selected' : ''}`}
            onClick={() => select(s)}
          >
            当前要织：{LABEL[s]}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9M1;
