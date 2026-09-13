import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 3.1：左右两块 540×260 布带，共享一个「开始对齐」按钮与同一时间基准。
// 左栏只用刚性变换（残差停在非零），右栏多估一个尺度（残差归零）。

const PW = 540;
const PH = 260;
const DURATION = 2200;
const MAX_RESIDUAL = 0.35;
const STRETCH = 1.35;
const PITCH = 30;
const SHIFT = -34;
const CARD_X = 20;
const CARD_Y = 196;
const CARD_W = 240;
const CARD_H = 44;
const TRACK_X = 36;
const TRACK_Y = 214;
const TRACK_W = 208;
const TRACK_H = 12;

type Phase = 'idle' | 'running' | 'done';
type Kind = 'se3' | 'sim3';

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= PW; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, PH);
    ctx.stroke();
  }
  for (let y = 0; y <= PH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(PW, y + 0.5);
    ctx.stroke();
  }
}

function drawSetting(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(20, 100, 500, 80);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(20, 176, 500, 5);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(20.5, 100.5, 499, 79);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string }>,
  x: number,
  y: number
) {
  let cx = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '14px "Segoe UI", sans-serif';
  for (let i = 0; i < items.length; i += 1) {
    ctx.fillStyle = items[i].color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#68778f';
    ctx.fillText(items[i].label, cx + 15, y + 1);
    cx += 15 + items[i].label.length * 14 + 18;
  }
  ctx.textBaseline = 'alphabetic';
}

function drawPanel(ctx: CanvasRenderingContext2D, kind: Kind, t: number, doneSec: number) {
  const accent = kind === 'se3' ? '#c43f52' : '#228d5c';
  const scaleFactor = 1 + 0.35 * t;
  const stretch = kind === 'se3' ? STRETCH : STRETCH / scaleFactor;
  const shift = SHIFT * t;
  const residual = kind === 'se3' ? MAX_RESIDUAL : MAX_RESIDUAL * (1 - t);

  // 结束后：左栏花纹轻微颤动再稳定；右栏 stitch 组做一次弹性缩放脉冲
  let jx = 0;
  let pulse = 1;
  if (doneSec >= 0) {
    if (kind === 'se3') {
      jx = Math.sin(doneSec * 28) * Math.exp(-doneSec * 2.2) * 3;
    } else {
      const pu = clamp(doneSec / 0.55, 0, 1);
      const bump = pu < 0.5 ? easeSpring(pu * 2) : easeSpring((1 - pu) * 2);
      pulse = 1 + 0.07 * bump;
    }
  }

  clearScene(ctx);
  drawSetting(ctx);

  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 6; i += 1) {
    const x = 46 + i * PITCH;
    ctx.beginPath();
    ctx.moveTo(x, 112);
    ctx.lineTo(x, 168);
    ctx.stroke();
  }

  const grpCx = 290 + shift + (5 * PITCH * stretch) / 2;
  ctx.save();
  ctx.translate(grpCx, 140);
  ctx.scale(pulse, pulse);
  ctx.translate(-grpCx, -140);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  for (let i = 0; i <= 5; i += 1) {
    const x = 290 + i * PITCH * stretch + shift + jx;
    ctx.beginPath();
    ctx.moveTo(x, 112);
    ctx.lineTo(x, 168);
    ctx.stroke();
  }
  ctx.restore();

  drawText(ctx, kind === 'se3' ? '只用刚性' : '带上尺度', 24, 36, '#21324a', 16, 'left');

  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.strokeRect(CARD_X + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);

  ctx.fillStyle = '#d7deea';
  ctx.fillRect(TRACK_X, TRACK_Y, TRACK_W, TRACK_H);
  ctx.fillStyle = accent;
  ctx.fillRect(TRACK_X, TRACK_Y, TRACK_W * (residual / MAX_RESIDUAL), TRACK_H);

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(TRACK_X + 0.5, TRACK_Y - 8);
  ctx.lineTo(TRACK_X + 0.5, TRACK_Y + TRACK_H + 8);
  ctx.stroke();
  ctx.restore();

  if (kind === 'se3') {
    drawLegend(
      ctx,
      [
        { color: '#76906a', label: '固定花纹' },
        { color: '#c43f52', label: '刚性' },
        { color: '#228d5c', label: '带尺度' },
      ],
      286,
      226
    );
  }
}

export const Ch3Sim3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef({ t: 0, start: 0, doneAt: -1, phase: 'idle' as Phase });
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    let ctxL: CanvasRenderingContext2D;
    let ctxR: CanvasRenderingContext2D;
    try {
      ctxL = setupCanvas(left, PW, PH);
      ctxR = setupCanvas(right, PW, PH);
    } catch {
      return;
    }

    const tick = (now: number) => {
      const st = animRef.current;
      if (st.phase === 'running') {
        const u = clamp((now - st.start) / DURATION, 0, 1);
        st.t = easeInOutQuad(u);
        if (u >= 1) {
          st.phase = 'done';
          st.doneAt = now;
          setPhase('done');
        }
      }
      const doneSec = st.doneAt >= 0 ? (now - st.doneAt) / 1000 : -1;
      drawPanel(ctxL, 'se3', st.t, doneSec);
      drawPanel(ctxR, 'sim3', st.t, doneSec);
      if (!left.classList.contains('is-ready')) left.classList.add('is-ready');
      if (!right.classList.contains('is-ready')) right.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(left, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    if (animRef.current.phase === 'running') return;
    animRef.current.t = 0;
    animRef.current.start = performance.now();
    animRef.current.doneAt = -1;
    animRef.current.phase = 'running';
    setPhase('running');
  };

  const fb =
    phase === 'idle'
      ? { text: '按开始，观察两栏从同一初态出发的差别。', cls: '' }
      : { text: '两栏同一时间基准，唯一的差别是右边多估了一个尺度。', cls: '' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <canvas
            id={`cv-${chapterId}-${moduleId}-l`}
            ref={leftRef}
            width={PW}
            height={PH}
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        <div style={{ flex: '1 1 320px' }}>
          <canvas
            id={`cv-${chapterId}-${moduleId}-r`}
            ref={rightRef}
            width={PW}
            height={PH}
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      </div>
      <div className="chips">
        <button className="chip" onClick={onStart} disabled={phase === 'running'}>
          开始对齐
        </button>
      </div>
      {phase === 'done' ? (
        <>
          <div className="feedback bad">只用刚性变换，尺度错位留在原地。</div>
          <div className="feedback good">同时估计尺度后，花纹一次对齐，残差归零。</div>
        </>
      ) : (
        <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      )}
    </div>
  );
};

export default Ch3Sim3;
