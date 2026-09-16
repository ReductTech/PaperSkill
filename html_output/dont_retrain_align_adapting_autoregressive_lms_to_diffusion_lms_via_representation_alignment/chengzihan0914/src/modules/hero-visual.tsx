import { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clamp, mixColor, useCanvas } from './visual-core';

const palette = [C.blue, C.green, C.orange, C.purple, '#4f79a8'];
const noisy = [C.red, C.orange, '#8a6f4d', C.purple, '#b77a8a'];

function HeroPanel({ mode }: { mode: 'ar' | 'dlm' }) {
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const pausedRef = useRef(false);
  const canvasTimeRef = useRef(0);
  const pauseStartedAtRef = useRef(0);
  const pausedDurationRef = useRef(0);
  const ref = useCanvas((ctx, time) => {
    canvasTimeRef.current = time;
    const effectiveTime = pausedRef.current
      ? pauseStartedAtRef.current - pausedDurationRef.current
      : time - pausedDurationRef.current;
    const p = (effectiveTime % 8) / 8;
    ctx.clearRect(0, 0, 520, 176);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 520, 176);
    const tokens = ['语', '言', '表', '示', '图'];
    const order = mode === 'ar' ? [0, 1, 2, 3, 4] : [2, 0, 4, 1, 3];
    tokens.forEach((token, i) => {
      const rank = order.indexOf(i);
      const reveal = mode === 'ar' ? p * 7 > rank : p > 0.18 && p * 6 > rank;
      const x = 24 + i * 96;
      ctx.fillStyle = reveal ? (mode === 'ar' ? C.blue : C.green) : '#e6ebef';
      ctx.fillRect(x, 14, 67, 32);
      ctx.fillStyle = reveal ? '#fff' : C.muted;
      ctx.font = 'bold 16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(reveal ? token : mode === 'dlm' ? '<M>' : '?', x + 33, 36);
    });

    const matrixX = 25;
    const matrixY = 63;
    const cell = 12;
    const unlock = mode === 'dlm' ? clamp((p - 0.22) / 0.25, 0, 1) : 0;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const causal = col <= row;
        ctx.fillStyle = causal
          ? C.blue
          : mode === 'dlm'
            ? `rgba(34,141,92,${0.12 + unlock * 0.88})`
            : '#e5e9ef';
        ctx.fillRect(matrixX + col * cell, matrixY + row * cell, cell - 2, cell - 2);
      }
    }
    ctx.fillStyle = C.muted;
    ctx.font = '13px Segoe UI';
    ctx.textAlign = 'left';
    ctx.fillText(mode === 'ar' ? '因果下三角' : '双向全联通', 99, 81);
    ctx.fillText(mode === 'ar' ? '固定生成次序' : '任意顺序消雾', 99, 104);

    const converge = mode === 'ar' ? 1 : clamp((p - 0.52) / 0.35, 0, 1);
    ctx.fillStyle = C.muted;
    ctx.fillText('hidden state', 25, 148);
    palette.forEach((target, i) => {
      ctx.fillStyle = mode === 'ar' ? target : mixColor(noisy[i], target, converge);
      ctx.fillRect(132 + i * 68, 132, 52, 22);
    });
    ctx.fillStyle = mode === 'dlm' && converge > 0.88 ? C.green : C.text;
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText(mode === 'ar' ? '参考坐标系' : converge > 0.88 ? '已回到同一色谱' : '正在对齐…', 132, 172);
  }, [mode], 520, 176);

  const toggle = () => {
    const next = !pausedRef.current;
    if (next) {
      pauseStartedAtRef.current = canvasTimeRef.current;
    } else {
      pausedDurationRef.current += canvasTimeRef.current - pauseStartedAtRef.current;
    }
    pausedRef.current = next;
    setPaused(next);
  };
  return (
    <div
      className="ra-hero"
      role="button"
      tabIndex={0}
      aria-label={`${mode === 'ar' ? '自回归' : '扩散'}动画，点击暂停或继续`}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <canvas ref={ref} width={520} height={176} role="img" aria-label="token、注意力掩码和隐藏状态色谱动画" />
      {(focused || paused) && (
        <div className="ra-formula-pop">L = L<sub>mdm</sub> + L<sub>path</sub> + λ<sub>repr</sub>L<sub>align</sub> · {paused ? '已暂停' : '点击暂停'}</div>
      )}
    </div>
  );
}

export const HeroAR: React.FC<WidgetProps> = () => <HeroPanel mode="ar" />;
export const HeroDLM: React.FC<WidgetProps> = () => <HeroPanel mode="dlm" />;
