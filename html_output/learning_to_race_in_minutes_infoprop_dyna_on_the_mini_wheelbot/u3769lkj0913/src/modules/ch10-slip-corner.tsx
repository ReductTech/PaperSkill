import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 10.3: controlled slipping. AMPC reorients itself with gyroscopic effects and
// corners conservatively; the racing agent enters fast and uses a controlled slide to
// corner faster. Then: why Infoprop Dyna enabled this (trusted long-horizon imagination
// + truncation), and the paper's explicit limitations.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'To achieve this speed-up, the racing agent exploits a controlled slipping behavior to handle fast corners. This is unlike the AMPC, which uses gyroscopic effects to reorient itself. This behavior is non trivial to capture using purely physics-based simulation.',
    zh: '竞速智能体利用<b>受控打滑</b>处理高速弯，不同于用陀螺效应的 AMPC；该行为<b>难以用纯物理仿真捕获</b>（作者观点）。',
    locator: '§IV · p.2',
    highlights: ['controlled slipping', 'non trivial to capture', 'physics-based simulation'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  rr(ctx, -11, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillRect(-8, -9, 5, 3);
  ctx.fillRect(3, -9, 5, 3);
  ctx.fillRect(-8, 6, 5, 3);
  ctx.fillRect(3, 6, 5, 3);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(2, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const CX = 330;
const CY = 252;
const R = 172;
const A0 = Math.PI * (183 / 180);
const A1 = Math.PI * (272 / 180);

const point = (a: number, r: number) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
const tangent = (a: number) => Math.atan2(Math.cos(a), -Math.sin(a));

type Mode = 'ampc' | 'racing' | 'both';

const MODE_TEXT: Record<Mode, string> = {
  ampc: 'AMPC 通过陀螺效应重新定向自身：稳定但保守——平均速度只有 0.15 m/s。',
  racing: '竞速智能体高速入弯，利用可控打滑更快出弯：平均 0.5 m/s——这是 RL 自己学会的非平凡策略。',
  both: '同一个弯道：受控打滑让出弯速度更高——论文作者指出，这种行为难以用纯物理仿真捕获。',
};

export const Ch10SlipCorner: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'both' });
  const [mode, setMode] = useState<Mode>('both');
  const [feedback, setFeedback] = useState({
    text: '切换三种视图，对比两种过弯方式；右侧解释为什么 Infoprop Dyna 能做到。',
    cls: '',
  });

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

    const render = (time: number) => {
      const m = stateRef.current.mode;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // corner band
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 84;
      ctx.beginPath();
      ctx.arc(CX, CY, R, A0, A1);
      ctx.stroke();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CX, CY, R + 42, A0, A1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, R - 42, A0, A1);
      ctx.stroke();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(CX, CY, R, A0, A1);
      ctx.stroke();
      ctx.setLineDash([]);

      // AMPC trajectory (inner line, slow) + kart
      if (m === 'ampc' || m === 'both') {
        ctx.strokeStyle = C.orange;
        ctx.globalAlpha = m === 'both' ? 0.75 : 1;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CX, CY, R - 40, A0 + 0.02, A1 - 0.02);
        ctx.stroke();
        const uA = (time * 0.28) % 1;
        const aA = A0 + 0.02 + uA * (A1 - A0 - 0.04);
        const pA = point(aA, R - 40);
        kart(ctx, pA.x, pA.y, tangent(aA), C.orange);
        ctx.globalAlpha = 1;
      }

      // racing trajectory (outer entry, slip at apex, faster) + kart with slip angle
      if (m === 'racing' || m === 'both') {
        ctx.strokeStyle = C.green;
        ctx.globalAlpha = m === 'both' ? 0.9 : 1;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const u = i / 60;
          const a = A0 + 0.02 + u * (A1 - A0 - 0.04);
          const rr2 = R + 26 + 26 * Math.sin(Math.PI * u);
          const pp = point(a, rr2);
          if (i === 0) ctx.moveTo(pp.x, pp.y);
          else ctx.lineTo(pp.x, pp.y);
        }
        ctx.stroke();
        const uR = (time * 0.5) % 1;
        const aR = A0 + 0.02 + uR * (A1 - A0 - 0.04);
        const slip = 0.5 * Math.sin(Math.PI * uR);
        const rR = R + 26 + 26 * Math.sin(Math.PI * uR);
        const pR = point(aR, rR);
        // slip marks at the apex
        if (uR > 0.3 && uR < 0.7) {
          ctx.strokeStyle = 'rgba(34,141,92,0.55)';
          ctx.lineWidth = 3;
          for (let s = 0; s < 3; s++) {
            const aS = aR - 0.05 - s * 0.045;
            const pS = point(aS, rR + 6 + s * 2);
            const dir = tangent(aS);
            ctx.beginPath();
            ctx.moveTo(pS.x - 7 * Math.cos(dir), pS.y - 7 * Math.sin(dir));
            ctx.lineTo(pS.x + 7 * Math.cos(dir), pS.y + 7 * Math.sin(dir));
            ctx.stroke();
          }
        }
        kart(ctx, pR.x, pR.y, tangent(aR) + slip, C.green);
        ctx.globalAlpha = 1;
      }

      // labels
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = C.orange;
      ctx.fillText('AMPC：陀螺效应（慢）', 30, 236);
      ctx.fillStyle = C.green;
      ctx.fillText('竞速：受控打滑（快）', 30, 258);

      // right inset: controlled slipping + why Infoprop + limitations
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 660, 16, 396, 248, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('受控打滑过弯', 682, 46);
      ctx.fillStyle = C.green;
      ctx.font = '13px "Segoe UI", sans-serif';
      const modeLine = MODE_TEXT[m];
      let line = '';
      let ly = 74;
      for (const ch of modeLine) {
        line += ch;
        if (line.length >= 24) {
          ctx.fillText(line, 682, ly);
          line = '';
          ly += 20;
        }
      }
      if (line) ctx.fillText(line, 682, ly);
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 13.5px "Segoe UI", sans-serif';
      ctx.fillText('为什么 Infoprop Dyna 能做到？', 682, ly + 44);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      const reasons = [
        '· 可信的长时域想象 → 策略敢探索激进动作',
        '· 信息损失超限即截断 → 坏数据不进训练',
        '· 既敢探索，又不会被错误预测带偏',
      ];
      reasons.forEach((r, i) => {
        ctx.fillText(r, 682, ly + 72 + i * 22);
      });
      ctx.fillStyle = C.purple;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('（机制连接第 5–8 章：想象会走偏 → 何时可信 → 闭环）', 682, ly + 152);
    };

    const tick = (now: number) => {
      render(now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback({
      text: MODE_TEXT[m],
      cls: m === 'racing' ? 'good' : '',
    });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="chip-row">
          <button className={`chip ${mode === 'ampc' ? 'selected' : ''}`} onClick={() => choose('ampc')}>
            AMPC：陀螺效应
          </button>
          <button className={`chip ${mode === 'racing' ? 'selected' : ''}`} onClick={() => choose('racing')}>
            竞速智能体：受控打滑
          </button>
          <button className={`chip ${mode === 'both' ? 'selected' : ''}`} onClick={() => choose('both')}>
            同时对比
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        <div className="limits-panel">
          <div className="limits-title">局限与展望（论文 §V）</div>
          <ul className="limits-list">
            <li>仅在单一固定赛道上验证；更大场地与任意赛道布局需要更强的泛化能力。</li>
            <li>仅在 Mini Wheelbot 单一平台上验证；未与其他学习方法做系统性横向对比。</li>
            <li>更高速度、更大场地与更通用的 JAX 分布式 Infoprop Dyna 接口是未来工作。</li>
          </ul>
        </div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch10SlipCorner;
