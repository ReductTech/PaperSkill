import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpFont,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawSort,
  drawTag,
  drawLink,
  drawLabel,
  drawSpiceBottle,
  drawPlate,
} from './letterpressKit';

const WD = 1080;
const HD = 420;
const WA = 560;
const HA = 140;

const N = 2;

const LX = 40;
const LW = 520;
const RX = 600;
const RW = 440;
const CW = (LW - 28 - 20) / 3;
const CH = (176 - 10) / 2;
const SH = 44;
const TH = 20;
const LC = '#efece2';
const STRIP_Y = 320;

interface Cell {
  idx: number;
  dist: number;
  face: string;
  color: string;
}

const CELLS: Cell[] = [
  { idx: 1, dist: 0.62, face: '花椒', color: '#c97b3a' },
  { idx: 2, dist: 0.45, face: '八角', color: '#8b5a2b' },
  { idx: 3, dist: 0.12, face: '桂皮', color: '#4a8c5c' },
  { idx: 4, dist: 0.71, face: '丁香', color: '#7c6a9e' },
  { idx: 5, dist: 0.31, face: '草果', color: '#d97706' },
  { idx: 6, dist: 0.94, face: '香叶', color: '#b8453c' },
];

const M = CELLS.length;
const BEST = CELLS[2];
const SECOND = CELLS[4];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  cellIdx: number;
}

interface St {
  picked: number[];
  probe: boolean;
  shaking: number | null;
  shakeX: number;
  shakeVel: number;
}

function barTone(d: number): string {
  const t = clamp(d, 0, 1);
  const r = Math.round(250 + (91 - 250) * t);
  const g = Math.round(249 + (127 - 249) * t);
  const b = Math.round(245 + (166 - 245) * t);
  return `rgb(${r},${g},${b})`;
}

function headText(picked: number[]): string {
  if (picked.length === 0) return '调料还没选';
  return picked.map((i) => `#${i}`).join(' + ');
}

export const CheckTags: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? WA : WD;
  const H = isAna ? HA : HD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<St>({ picked: [], probe: false, shaking: null, shakeX: 0, shakeVel: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [probe, setProbe] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '按住调料瓶左右摇晃，把调料撒到菜里。距离越近的调料越容易被菜吸收。',
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

    const anim = { lift: 0, probe: 0, t: 0 };

    const getBottlePos = (idx: number) => {
      const i = idx - 1;
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        x: LX + 14 + col * (CW + 10) + CW / 2,
        y: 76 + row * (CH + 10) + SH / 2 + 5,
      };
    };

    const spawnParticles = (cellIdx: number, count: number) => {
      const cell = CELLS.find((c) => c.idx === cellIdx);
      if (!cell) return;
      const pos = getBottlePos(cellIdx);
      const plateX = RX + RW / 2;
      const plateY = 180;
      for (let i = 0; i < count; i++) {
        const angle = Math.atan2(plateY - pos.y, plateX - pos.x) + (Math.random() - 0.5) * 0.6;
        const speed = 3 + Math.random() * 4;
        particlesRef.current.push({
          x: pos.x + (Math.random() - 0.5) * 20,
          y: pos.y + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 0,
          maxLife: 60 + Math.random() * 30,
          color: cell.color,
          size: 2 + Math.random() * 3,
          cellIdx,
        });
      }
    };

    const updateParticles = () => {
      const plateX = RX + RW / 2;
      const plateY = 180;
      const plateR = 50;
      const toRemove: number[] = [];
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life++;
        const dx = p.x - plateX;
        const dy = p.y - plateY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < plateR && p.life > 10) {
          const cell = CELLS.find((c) => c.idx === p.cellIdx);
          if (cell && !stateRef.current.picked.includes(p.cellIdx)) {
            const absorbChance = 1 - cell.dist;
            if (Math.random() < absorbChance * 0.3) {
              const s = stateRef.current;
              if (s.picked.length < N) {
                const nextPicked = [...s.picked, p.cellIdx];
                stateRef.current = { ...s, picked: nextPicked };
                setPicked(nextPicked);
                if (nextPicked.length === N) {
                  const sorted = [...nextPicked].sort((a, b) => a - b);
                  if (sorted.includes(BEST.idx) && sorted.includes(SECOND.idx)) {
                    setFeedback({
                      text: `选对了！桂皮（距离 ${BEST.dist.toFixed(2)}）和草果（距离 ${SECOND.dist.toFixed(2)}）是最近的两种。`,
                      cls: 'good',
                    });
                  } else {
                    setFeedback({
                      text: `已选 ${nextPicked.length} 种。最近的是桂皮（${BEST.dist.toFixed(2)}）和草果（${SECOND.dist.toFixed(2)}）。`,
                      cls: '',
                    });
                  }
                } else {
                  setFeedback({ text: `撒入了 ${cell.face}，继续摇晃选下一种。`, cls: '' });
                }
              }
            }
          }
          toRemove.push(i);
        }
        if (p.life > p.maxLife || p.y > H) {
          toRemove.push(i);
        }
      });
      particlesRef.current = particlesRef.current.filter((_, i) => !toRemove.includes(i));
    };

    const renderAna = (s: St, t: number) => {
      const dist = 0.12 + Math.abs(Math.sin(t * 0.8)) * 0.55;
      const near = dist < 0.3;
      const activeIdx = near ? 1 : Math.floor(t * 0.5) % 4;
      drawField(ctx, 0, 0, W, H);
      const spiceColors = [LP.accent, LP.success, LP.aux, LP.failure];
      for (let i = 0; i < 4; i++) {
        drawSpiceBottle(ctx, 50 + i * 80, 20, 30, 45, {
          color: spiceColors[i],
          highlighted: i === activeIdx,
        });
      }
      drawPlate(ctx, 280, 95, 35, { withFood: true, foodColor: LP.accent });
      ctx.save();
      ctx.strokeStyle = near ? LP.success : LP.muted;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 3; i++) {
        const r = 15 + i * 8 + Math.sin(t * 3 + i) * 3;
        ctx.beginPath();
        ctx.arc(280, 80, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      if (near) {
        ctx.save();
        ctx.strokeStyle = LP.success;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(130, 65);
        ctx.lineTo(280, 80);
        ctx.stroke();
        ctx.restore();
      }
      drawLabel(ctx, near ? '对味了' : '闻香选料', near ? 420 : 440, 88, {
        size: 13,
        color: near ? LP.success : LP.muted,
      });
    };

    const renderNormal = (s: St) => {
      drawField(ctx, 0, 0, W, H);

      lpRoundRect(ctx, LX, 62, LW, 204, 8, false, true);
      ctx.strokeStyle = LP.dark;
      drawLabel(ctx, '调料架（按住摇晃）', LX + 2, 54, { size: 13, color: LP.muted });
      drawTypeCase(ctx, LX + 14, 76, LW - 28, 176, {
        cols: 3,
        rows: 2,
        gap: 10,
        fill: LP.bg,
      });

      const order = [...CELLS].sort((a, b) => a.dist - b.dist);
      const pickedSet = new Set(s.picked);

      CELLS.forEach((cell, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = LX + 14 + col * (CW + 10) + 7;
        const cy = 76 + row * (CH + 10) + 5;
        const on = pickedSet.has(cell.idx);
        const isShaking = s.shaking === cell.idx;
        const shakeOffset = isShaking ? Math.sin(anim.t * 0.5) * s.shakeX * 3 : 0;
        const lift = on ? anim.lift * 9 : 0;
        drawSort(ctx, cx + shakeOffset, cy - lift, CW - 14, SH, {
          face: cell.face,
          lift,
          fill: on ? LP.support : LP.dark,
        });
        drawTag(ctx, cx + 6 + shakeOffset, cy + SH + 4 - lift, CW - 26, TH, {
          text: `k${cell.idx}`,
          hit: on,
          emphasis: on,
          lift,
          alpha: 1,
        });
        if (on) {
          ctx.save();
          ctx.strokeStyle = LP.accent;
          ctx.lineWidth = LP_LW_EMPH;
          lpRoundRect(ctx, cx - 4 + shakeOffset, cy - 6 - lift, CW - 8, SH + TH + 16, 6, false, true);
          ctx.restore();
        }
        drawLabel(ctx, cell.dist.toFixed(2), cx + (CW - 16) / 2 + shakeOffset, cy + SH + TH + 18 - lift, {
          align: 'center',
          size: 11,
          color: on ? LP.accent : LP.muted,
        });
      });

      lpRoundRect(ctx, RX, 62, RW, 240, 8, false, true);
      drawLabel(ctx, '菜（摇晃调料瓶撒入）', RX + 2, 54, { size: 13, color: LP.muted });
      const plateX = RX + RW / 2;
      const plateY = 180;
      drawPlate(ctx, plateX - 40, plateY - 20, 40, { withFood: true, foodColor: picked.length > 0 ? LP.accent : LP.light });

      if (pickedSet.size > 0) {
        ctx.save();
        ctx.font = lpFont(12, 500);
        ctx.fillStyle = LP.ink;
        ctx.textAlign = 'center';
        ctx.fillText(headText(s.picked), plateX, plateY + 45);
        ctx.restore();
      }

      const b0 = 250;
      const barMax = 172;
      order.forEach((cell, rank) => {
        const y = b0 + rank * 22;
        const bw = Math.max(4, barMax * clamp(cell.dist, 0, 1));
        const on = pickedSet.has(cell.idx);
        ctx.save();
        ctx.fillStyle = barTone(cell.dist);
        lpRoundRect(ctx, RX + 30, y, bw, 12, 3, true, false);
        ctx.strokeStyle = on ? LP.accent : LP.dark;
        ctx.lineWidth = on ? LP_LW_EMPH : LP_LW;
        lpRoundRect(ctx, RX + 30, y, barMax, 12, 3, false, true);
        ctx.font = lpFont(11, on ? 700 : 500);
        ctx.fillStyle = on ? LP.accent : LP.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${cell.idx}`, RX + 4, y + 7);
        ctx.textAlign = 'right';
        ctx.fillText(cell.dist.toFixed(2), RX + RW - 2, y + 7);
        ctx.restore();
      });

      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const stripY = STRIP_Y;
      ctx.save();
      ctx.fillStyle = LC;
      ctx.strokeStyle = s.probe ? LP.failure : LP.dark;
      ctx.lineWidth = s.probe ? LP_LW_EMPH : LP_LW;
      lpRoundRect(ctx, LX, stripY, 1000, 74, 6, true, true);
      ctx.font = lpFont(15, 600);
      ctx.fillStyle = s.probe ? LP.failure : LP.ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      if (s.probe) {
        ctx.fillText('再往前调一点点，出锅味道一动不动。', LX + 14, stripY + 12);
        ctx.font = lpFont(13, 400);
        ctx.fillStyle = LP.ink;
        ctx.fillText('挑哪几个是一步跳过去的——给的是名次，不是坡度。', LX + 14, stripY + 38);
      } else {
        ctx.font = lpFont(14, 500);
        ctx.fillText('按住调料瓶左右摇晃，距离越近的调料越容易被菜吸收。', LX + 14, stripY + 14);
        ctx.font = lpFont(13, 400);
        ctx.fillStyle = LP.muted;
        ctx.fillText(
          s.picked.length > 0
            ? `已选 ${s.picked.length} / ${N}：${headText(s.picked)}`
            : `共 ${M} 种调料，选最近的 ${N} 种`,
          LX + 14,
          stripY + 44
        );
      }
      ctx.restore();

      if (s.probe) {
        const bestPos = getBottlePos(BEST.idx);
        drawLink(ctx, bestPos.x, stripY - 6, bestPos.x, stripY - 46, {
          color: LP.failure,
          dashed: true,
          width: LP_LW_EMPH,
          arrow: true,
        });
      }
    };

    const tick = (t: number) => {
      anim.t = t;
      const s = stateRef.current;
      anim.lift = easeOutCubic(clamp(s.picked.length / N, 0, 1));
      if (s.shaking !== null && Math.abs(s.shakeVel) > 0.5) {
        const intensity = Math.min(Math.abs(s.shakeVel) * 0.5, 3);
        spawnParticles(s.shaking, Math.ceil(intensity));
        s.shakeVel *= 0.92;
      }
      updateParticles();
      if (isAna) renderAna(s, t / 1000);
      else renderNormal(s);
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
    };
  }, [W, H, isAna]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = WD / rect.width;
    const scaleY = HD / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    for (const cell of CELLS) {
      const i = cell.idx - 1;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = LX + 14 + col * (CW + 10) + CW / 2;
      const cy = 76 + row * (CH + 10) + SH / 2 + 5;
      if (Math.abs(x - cx) < CW / 2 && Math.abs(y - cy) < CH / 2) {
        stateRef.current = { ...stateRef.current, shaking: cell.idx, shakeX: 0, shakeVel: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
        setFeedback({ text: `正在摇晃 ${cell.face}，左右拖动撒料！`, cls: '' });
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna || stateRef.current.shaking === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = WD / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const lastX = (stateRef.current as any).lastX || x;
    const vel = x - lastX;
    (stateRef.current as any).lastX = x;
    stateRef.current.shakeX = x;
    stateRef.current.shakeVel = vel;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    if (stateRef.current.shaking !== null) {
      const cell = CELLS.find((c) => c.idx === stateRef.current.shaking);
      stateRef.current = { ...stateRef.current, shaking: null, shakeX: 0, shakeVel: 0 };
      (stateRef.current as any).lastX = undefined;
      if (cell && stateRef.current.picked.length < N) {
        setFeedback({ text: `放下了 ${cell.face}。继续摇晃其他调料瓶，或选够 ${N} 种。`, cls: '' });
      }
    }
  };

  const doProbe = () => {
    const s = stateRef.current;
    stateRef.current = { ...s, probe: true };
    setProbe(true);
    setFeedback({
      text:
        '挑哪几个是一步跳过去的，距离函数给的是名次、不是坡度，梯度传不回被挑中的那瓶调料。' +
        '式 5 第二项是替代损失：把被选中的 key 拉近对应 query，解耦了 query 机制与 prompt 的学习。',
      cls: 'bad',
    });
  };

  const reset = () => {
    stateRef.current = { picked: [], probe: false, shaking: null, shakeX: 0, shakeVel: 0 };
    particlesRef.current = [];
    setPicked([]);
    setProbe(false);
    setFeedback({ text: '按住调料瓶左右摇晃，把调料撒到菜里。距离越近的调料越容易被菜吸收。', cls: '' });
  };

  if (isAna) {
    return (
      <div>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
    );
  }

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="ctrl">
        <label>
          已选 <span className="val">{picked.length}</span> / {N} 种调料
        </label>
        <button className="tiny ghost" onClick={doProbe}>
          如果再往前调一点点呢
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="l">最近的距离</span>
          <span className="v">{BEST.dist.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="l">最远的距离</span>
          <span className="v">{CELLS[5].dist.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="l">每次取 N（示意）</span>
          <span className="v">{N}</span>
        </div>
      </div>
      <div className="step-desc">
        本页是示意：只有 {M} 种调料、每次取 {N} 种。CIFAR-100 系列是池子 M=10、N=5，5-datasets 是池子 M=20、N=4。
        距离用余弦，未比较过其他度量。
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default CheckTags;
