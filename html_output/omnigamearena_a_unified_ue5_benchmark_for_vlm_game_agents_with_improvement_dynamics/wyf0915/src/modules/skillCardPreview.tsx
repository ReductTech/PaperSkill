import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 260;

const SKILLS: Record<string, { label: string; char: number; cap: number; bullets: string[] }> = {
  none: {
    label: 'm_0 (空技能, cold-start)',
    char: 0,
    cap: 1200,
    bullets: ['本轮不提供任何提示', '等价于 §5.2 的 cold-start baseline', 'R0 = S_0 直接来自该列'],
  },
  explore: {
    label: 'm_1: 探索式 (Exploration-style)',
    char: 540,
    cap: 1200,
    bullets: [
      '"先看清可点击区域，再决定下一步"',
      '强调环境先验而非动作脚本',
      '在 Single-tile drops 变体上：稳定增益 +0.279',
    ],
  },
  park: {
    label: 'm_2: 原地不动 (Park-style)',
    char: 320,
    cap: 1200,
    bullets: [
      '"若当前格子未塌，就保持不动"',
      '对 single-tile drops 几近最优',
      '在 cluster drops 变体上：-0.72~-0.76（因为"安全岛"消失）',
    ],
  },
  rhythm: {
    label: 'm_3: 短促移动再评估 (Rhythm-style)',
    char: 700,
    cap: 1200,
    bullets: [
      '"短促移动 1~2 步 → 重新评估 → 再移动"',
      'GPT-5.5 的策略，所有变体都非负',
      'origin +0.540，但更鲁棒',
    ],
  },
};

export const SkillCardPreview: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState('explore');
  const skill = SKILLS[key];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: typeof skill) => {
      ctx.clearRect(0, 0, W, H);
      // card
      const cardX = 40;
      const cardY = 30;
      const cardW = W - 80;
      const cardH = H - 60;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cardY, cardW, cardH);
      // header
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(s.label, cardX + 16, cardY + 30);
      // capacity bar
      const barX = cardX + 16;
      const barY = cardY + 44;
      const barW = cardW - 32;
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(barX, barY, barW, 8);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(barX, barY, barW * (s.char / s.cap), 8);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`${s.char} / ${s.cap} tokens`, barX, barY + 24);
      // bullets
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      s.bullets.forEach((b, i) => {
        ctx.fillText('• ' + b, barX, barY + 50 + i * 26);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render(skill);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [skill]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {Object.keys(SKILLS).map((k) => (
          <button key={k} className={key === k ? 'on' : ''} onClick={() => setKey(k)}>
            {SKILLS[k].label.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="feedback">技能提示 m_r 上限 1200 token，经验笔记上限 2000 token；超过会被裁剪。</div>
    </div>
  );
};

export default SkillCardPreview;
