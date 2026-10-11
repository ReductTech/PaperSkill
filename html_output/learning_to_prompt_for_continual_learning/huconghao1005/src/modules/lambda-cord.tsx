import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  lpFont,
  drawField,
  drawTypeCase,
  drawSort,
  drawSheet,
  drawTag,
  drawInk,
  drawLink,
  drawLabel,
  drawLegend,
  drawMeter,
  drawSpiceBottle,
  drawPlate,
} from './letterpressKit';

const W_FULL = 1080;
const H_FULL = 460;
const W_ANA = 560;
const H_ANA = 140;
const MAX_EPOCH = 3;

const TAG_FACES = ['P0', 'P1', 'P2', 'P3', 'P4'];

interface Scene {
  pull: number;
  phase: number;
  epoch: number;
  stirring: boolean;
  stirAngle: number;
  stirSpeed: number;
  circleProgress: number;
  lastAngle: number;
}

interface StirParticle {
  angle: number;
  radius: number;
  speed: number;
  color: string;
  size: number;
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, squeeze: number, phase: number) {
  const bob = Math.sin(phase * 1.5) * 1.6;
  const sy = y + bob;
  ctx.save();
  ctx.strokeStyle = 'rgba(38,36,31,0.45)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 58, sy + 12);
  ctx.lineTo(x - 16, sy + 4);
  ctx.stroke();
  ctx.fillStyle = LP.light;
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.ellipse(x, sy, 15, 11, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = LP.support;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.moveTo(x + 8, sy - 5 - squeeze * 2);
  ctx.quadraticCurveTo(x + 19, sy - 6 - squeeze * 4, x + 20, sy + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 6, sy - 8);
  ctx.quadraticCurveTo(x + 16, sy - 13 - squeeze * 2, x + 22, sy - 4);
  ctx.stroke();
  ctx.restore();
}

function drawLossBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lambda: number,
  pull: number,
  epoch: number
) {
  const clsLoss = Math.max(0.09, 0.68 - 0.15 * epoch + 1.05 * Math.pow(Math.max(0, lambda - 0.45), 2) * 3.6);
  const pullLoss = lambda * Math.max(0.05, 1 - 0.22 * epoch);

  const total = 1.0;
  const bw = Math.min(104, (w - 70) / 2);
  const baseY = y + h;

  const bar = (bx: number, value: number, color: string) => {
    const bh = clamp(value / total, 0, 1) * h;
    ctx.save();
    ctx.fillStyle = LP.light;
    ctx.strokeStyle = LP.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, baseY - h, bw, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.rect(bx, baseY - bh, bw, Math.max(0, bh));
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = LP_LW;
    ctx.strokeRect(bx, baseY - bh, bw, Math.max(0, bh));
    ctx.fillStyle = LP.ink;
    ctx.font = lpFont(12, 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(value.toFixed(2), bx + bw / 2, baseY - bh - 3);
    ctx.restore();
  };

  bar(x + 8, clsLoss, LP.success);
  bar(x + 18 + bw, pullLoss, LP.aux);

  ctx.save();
  ctx.strokeStyle = LP.support;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.moveTo(x + 2, baseY + 1);
  ctx.lineTo(x + w - 2, baseY + 1);
  ctx.stroke();
  ctx.restore();

  drawLegend(
    ctx,
    [
      { label: '分类损失', color: LP.success },
      { label: '拉动项', color: LP.aux },
      { label: '搅拌力度', color: LP.support },
    ],
    x + 6,
    y - 6,
    { size: 12 }
  );

  drawLabel(ctx, '示意数值', x + w - 56, y - 6, { size: 12, color: LP.muted });
  drawMeter(ctx, x + 4, y + h + 14, w - 20, 9, clamp(pull, 0, 1), LP.support);
}

function LambdaCordInner({ chapterId, moduleId }: WidgetProps) {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_FULL;
  const H = isAna ? H_ANA : H_FULL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene>({
    pull: 0.5,
    phase: 0,
    epoch: 0,
    stirring: false,
    stirAngle: 0,
    stirSpeed: 0,
    circleProgress: 0,
    lastAngle: 0,
  });
  const particlesRef = useRef<StirParticle[]>([]);
  const animRef = useRef({ lambda: 0.5, epoch: 0, ana: isAna, raf: null as number | null });

  const [lambda, setLambda] = useState(0.5);
  const [epoch, setEpoch] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '在锅里按住鼠标画圈搅拌：画得越快 λ 越大，每画完一圈训练一轮。λ 不敏感，在很大范围内都工作良好。',
    cls: '',
  });

  useEffect(() => {
    const colors = [LP.accent, LP.success, LP.aux, LP.failure, LP.guide];
    particlesRef.current = Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 25 + Math.random() * 35,
      speed: 0.02 + Math.random() * 0.03,
      color: colors[i % colors.length],
      size: 3 + Math.random() * 3,
    }));
  }, []);

  useEffect(() => {
    animRef.current.lambda = lambda;
    animRef.current.epoch = epoch;
    animRef.current.ana = isAna;
  }, [lambda, epoch, isAna]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const POT_X = isAna ? 280 : 320;
    const POT_Y = isAna ? 80 : 200;
    const POT_R = isAna ? 45 : 70;

    const render = () => {
      const s = sceneRef.current;
      const a = animRef.current;
      const ana = a.ana;
      const target = ana
        ? 0.12 + 0.8 * (0.5 + 0.5 * Math.sin(s.phase * 1.6))
        : clamp(a.lambda + 0.09 * a.epoch, 0, 1);
      s.pull = lerp(s.pull, target, 0.07);
      s.phase += 0.02;

      if (s.stirring && s.stirSpeed > 0.1) {
        s.stirAngle += s.stirSpeed * 0.05;
        particlesRef.current.forEach((p) => {
          p.angle += p.speed * (1 + s.stirSpeed * 2);
        });
      } else {
        particlesRef.current.forEach((p) => {
          p.angle += p.speed * 0.3;
        });
      }
      s.stirSpeed *= 0.95;

      const lam = ana ? s.pull : clamp(a.lambda, 0, 1);
      const ep = ana ? 0 : a.epoch;
      const pull = clamp(s.pull, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawField(ctx, 0, 0, W, H);

      ctx.save();
      ctx.strokeStyle = LP.light;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(20, H * 0.78);
      ctx.lineTo(W - 20, H * 0.78);
      ctx.stroke();
      ctx.restore();

      const sx = ana ? 22 : 40;
      const sw = ana ? 258 : 480;
      const deskY = H * 0.78;

      const sheetW = ana ? 108 : 120;
      const sheetH = ana ? 78 : 96;
      const sheetX = sx + sw - sheetW;
      const sheetY = deskY - sheetH - 6;

      const n = ana ? 3 : 5;
      const tagW = ana ? 44 : 48;
      const tagH = ana ? 30 : 36;
      const step = (sw - sheetW - 34 - tagW) / Math.max(1, n - 1);
      const tagY = deskY - tagH - 12;

      const tieX0 = sx - 12;
      const tieY0 = tagY - (ana ? 6 : 10);
      for (let i = 0; i < n; i++) {
        const tx = sx + 18 + i * step + tagW / 2;
        const px = lerp(tx, sheetX + sheetW * 0.28, pull * 0.9);
        const sag = (1 - pull) * (ana ? 22 : 30);
        ctx.save();
        ctx.strokeStyle = LP.support;
        ctx.lineWidth = LP_LW;
        ctx.beginPath();
        ctx.moveTo(tieX0, tieY0);
        ctx.bezierCurveTo(
          lerp(tieX0, px, 0.35),
          tieY0 + sag,
          lerp(tieX0, px, 0.72),
          tieY0 + sag * 0.5,
          px,
          tagY + tagH * 0.4
        );
        ctx.stroke();
        ctx.restore();
      }

      if (ana) {
        drawPlate(ctx, sheetX + sheetW / 2, sheetY + sheetH * 0.6, sheetW * 0.4, { withFood: true, foodColor: LP.accent });
      } else {
        drawSheet(ctx, sheetX, sheetY, sheetW, sheetH, {
          lines: 4,
          result: 'P0 0.41',
          tone: 'good',
          blank: false,
        });
      }

      const spiceColors = [LP.accent, LP.success, LP.aux, LP.failure, LP.guide];
      for (let i = 0; i < n; i++) {
        const home = sx + 18 + i * step;
        const drift = pull * (ana ? 46 : 72) * (0.65 + 0.2 * i / Math.max(1, n - 1));
        const wob = Math.sin(s.phase * 1.8 + i) * (1.4 + 2.6 * pull);
        const x = home + drift;
        const y = tagY + wob;
        if (ana) {
          drawSpiceBottle(ctx, x, y, tagW, tagH, {
            color: spiceColors[i % spiceColors.length],
            highlighted: pull > 0.12,
          });
        } else {
          drawTag(ctx, x, y, tagW, tagH, {
            text: TAG_FACES[i],
            fill: LP.bg,
            hit: pull > 0.6,
            emphasis: pull > 0.12 && pull <= 0.6,
            lift: pull * 3,
          });
        }
        ctx.save();
        ctx.fillStyle = pull > 0.6 ? LP.success : LP.support;
        ctx.beginPath();
        ctx.arc(x + tagW / 2, y + tagH * 0.4, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = LP.support;
      ctx.lineWidth = LP_LW + (pull > 0.85 ? 1 : 0);
      ctx.globalAlpha = 0.5 + 0.5 * pull;
      ctx.beginPath();
      ctx.moveTo(tieX0, tieY0);
      ctx.lineTo(sx + 18 + step * (n - 1) + tagW / 2 + pull * (ana ? 46 : 72), tagY - 6 - pull * 8);
      ctx.stroke();
      ctx.restore();

      drawHand(ctx, tieX0 - 6, tieY0 + 4, pull, s.phase);

      if (!ana) {
        ctx.save();
        ctx.fillStyle = '#3d2817';
        ctx.beginPath();
        ctx.ellipse(POT_X, POT_Y + POT_R * 0.3, POT_R * 1.1, POT_R * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a3a20';
        ctx.beginPath();
        ctx.ellipse(POT_X, POT_Y, POT_R, POT_R * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = LP.dark;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.ellipse(POT_X, POT_Y - POT_R * 0.1, POT_R * 0.85, POT_R * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        particlesRef.current.forEach((p) => {
          const px = POT_X + Math.cos(p.angle) * p.radius;
          const py = POT_Y - POT_R * 0.1 + Math.sin(p.angle) * p.radius * 0.7;
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        if (s.stirring) {
          const spoonX = POT_X + Math.cos(s.stirAngle) * POT_R * 0.6;
          const spoonY = POT_Y - POT_R * 0.1 + Math.sin(s.stirAngle) * POT_R * 0.4;
          ctx.save();
          ctx.strokeStyle = LP.support;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(spoonX - 30, spoonY - 20);
          ctx.lineTo(spoonX, spoonY);
          ctx.stroke();
          ctx.fillStyle = LP.dark;
          ctx.beginPath();
          ctx.ellipse(spoonX, spoonY, 8, 5, s.stirAngle, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        drawLabel(ctx, '在锅里画圈搅拌', POT_X - 50, POT_Y + POT_R + 20, { size: 12, color: LP.muted });
        drawLabel(ctx, `λ = ${lam.toFixed(2)}`, POT_X - 25, POT_Y - POT_R - 15, { size: 14, color: LP.accent, weight: 700 });
      }

      const brkX = sx + (ana ? 118 : 200);
      const brkY = ana ? H * 0.30 : H * 0.36;
      drawLink(ctx, tieX0 - 10, tieY0 + 16, brkX, brkY, {
        color: LP.aux,
        dashed: true,
        width: LP_LW,
      });
      ctx.save();
      ctx.strokeStyle = LP.aux;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(brkX, brkY);
      ctx.lineTo(brkX + 22, brkY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(brkX + 36, brkY);
      ctx.lineTo(brkX + 58, brkY);
      ctx.stroke();
      ctx.fillStyle = LP.aux;
      ctx.beginPath();
      ctx.moveTo(brkX - 8, brkY);
      ctx.lineTo(brkX + 4, brkY - 6);
      ctx.lineTo(brkX + 4, brkY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(s.phase * 1.2));
      ctx.strokeStyle = LP.failure;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(brkX + 26, brkY - 7);
      ctx.lineTo(brkX + 32, brkY + 7);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      drawLabel(ctx, '梯度断', brkX + 4, brkY - 12, { size: 12, color: LP.aux, weight: 600 });
      drawLabel(ctx, '示意读法', brkX + 4, brkY + 18, { size: 11, color: LP.muted });

      if (!ana) {
        const bx = 680;
        const by = 84;
        drawLossBars(ctx, bx, by, 360, 160, lam, pull, ep);

        ctx.save();
        ctx.fillStyle = 'rgba(232,228,216,0.42)';
        ctx.beginPath();
        ctx.rect(40, 370, 1000, 76);
        ctx.fill();
        ctx.strokeStyle = LP.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 370);
        ctx.lineTo(1040, 370);
        ctx.moveTo(40, 446);
        ctx.lineTo(1040, 446);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = LP.ink;
        ctx.font = lpFont(13, 600);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('梯度在这里断掉：搅拌是绕过去的——argmin 是离散选择，没有坡度。', 54, 382);
        ctx.font = lpFont(12, 400);
        ctx.fillStyle = LP.muted;
        ctx.fillText('式 5 第二项是替代损失：把被选中的 key 拉近对应 query。', 54, 401);
        ctx.fillText('这个设计解耦了 query 机制与 prompt 的学习。', 54, 419);
        ctx.fillText('「argmin 挡住梯度」由后续工作 CODA-Prompt 明确。', 54, 437);
        ctx.restore();
      } else {
        drawLabel(ctx, '味道牵引调料', tieX0 - 30, 26, { size: 12, color: LP.muted, weight: 600 });
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let live = false;
    const tick = () => {
      if (!live) return;
      render();
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (live) return;
      live = true;
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      live = false;
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);

  const POT_X = 320;
  const POT_Y = 200;
  const POT_R = 70;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = W_FULL / rect.width;
    const scaleY = H_FULL / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const dx = x - POT_X;
    const dy = y - (POT_Y - POT_R * 0.1);
    if (Math.sqrt(dx * dx + dy * dy) < POT_R * 1.2) {
      sceneRef.current.stirring = true;
      sceneRef.current.lastAngle = Math.atan2(dy, dx);
      sceneRef.current.circleProgress = 0;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna || !sceneRef.current.stirring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = W_FULL / rect.width;
    const scaleY = H_FULL / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const dx = x - POT_X;
    const dy = y - (POT_Y - POT_R * 0.1);
    const angle = Math.atan2(dy, dx);
    let delta = angle - sceneRef.current.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    sceneRef.current.lastAngle = angle;
    sceneRef.current.stirAngle = angle;
    sceneRef.current.stirSpeed = Math.abs(delta) * 10;
    sceneRef.current.circleProgress += Math.abs(delta);

    const speed = clamp(Math.abs(delta) * 15, 0, 1);
    const newLambda = clamp(0.2 + speed * 0.8, 0, 1);
    setLambda(newLambda);

    if (sceneRef.current.circleProgress >= Math.PI * 2) {
      sceneRef.current.circleProgress -= Math.PI * 2;
      const e = Math.min(MAX_EPOCH, epoch + 1);
      setEpoch(e);
      if (e >= MAX_EPOCH) {
        setFeedback({
          text: `已搅拌 ${MAX_EPOCH} 圈：调料被充分混合，损失下降。λ = ${newLambda.toFixed(2)}，λ 不敏感是已验证的结论。`,
          cls: 'good',
        });
      } else {
        setFeedback({
          text: `第 ${e} 圈：调料又被搅匀了一些，损失继续下降。继续画圈！`,
          cls: 'good',
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    sceneRef.current.stirring = false;
    if (epoch < MAX_EPOCH) {
      setFeedback({
        text: `停下了。已搅拌 ${epoch} 圈，λ = ${lambda.toFixed(2)}。继续在锅里画圈搅拌来训练。`,
        cls: '',
      });
    }
  };

  const reset = () => {
    setLambda(0.5);
    setEpoch(0);
    sceneRef.current.stirring = false;
    sceneRef.current.circleProgress = 0;
    setFeedback({
      text: '在锅里按住鼠标画圈搅拌：画得越快 λ 越大，每画完一圈训练一轮。λ 不敏感，在很大范围内都工作良好。',
      cls: '',
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: isAna ? 'default' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {!isAna && (
        <>
          <div className="ctrl">
            <label>
              λ（搅拌力度） <span className="val">{lambda.toFixed(2)}</span>
            </label>
            <label>
              已搅拌 <span className="val">{epoch}</span> / {MAX_EPOCH} 圈
            </label>
            <button type="button" className="tiny ghost" onClick={reset}>
              重置
            </button>
          </div>
          <div className="metrics">
            <div className="metric">
              <div className="l">λ</div>
              <div className="v">{lambda.toFixed(2)}</div>
            </div>
            <div className="metric">
              <div className="l">已训练轮数</div>
              <div className="v">{epoch}</div>
            </div>
            <div className="metric">
              <div className="l">调料被拉动的幅度（示意）</div>
              <div className="v">{(clamp(lambda + 0.09 * epoch, 0, 1) * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        </>
      )}
    </div>
  );
}

export const LambdaCord: React.FC<WidgetProps> = (props) => <LambdaCordInner {...props} />;

export default LambdaCord;
