import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawInkPath,
  drawGhostPath,
  drawBrush,
  drawCopybook,
  drawTarget,
  drawSceneLabel,
} from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 10.2 六大开放挑战（P4 chips）：每个挑战一个书法桌上的签名小景，
// 毛笔是恒定主角，道具随挑战切换；逐条保留论文的限定语与缓解方向。

const W = 720;
const H = 300;

const CH = [
  { id: 0, label: '因果鸿沟', title: '因果鸿沟' },
  { id: 1, label: '效率瓶颈', title: '效率瓶颈' },
  { id: 2, label: '多模态感知', title: '多模态' },
  { id: 3, label: '经典控制', title: '经典控制' },
  { id: 4, label: '符号结构', title: '符号结构' },
  { id: 5, label: '评估缺失', title: '评估缺失' },
];

const FB = [
  { text: '长得像 ≠ 有因果：视频级相似不保证动作真起作用——缓解方向：因果条件与干预式评估。', cls: 'bad' },
  { text: '视频世界模型太贵：训练与推理都吃算力——方向：潜空间与高效骨干。', cls: 'bad' },
  { text: '只靠视觉不够：触觉与本体感仍缺位——方向：多模态统一表征。', cls: 'bad' },
  { text: '与控制论结合（如稳定性分析）是前沿方向而非成熟方案。', cls: '' },
  { text: '把语言与逻辑结构融进想象，仍是开放问题。', cls: 'bad' },
  { text: '还缺公认的评估指标——三把尺子之外，仍需新尺。', cls: 'bad' },
];

const BRUSH = { x: 236, y: 168 };

export const M102Challenges: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [ch, setCh] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const c = chRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });

      // 序号徽标 1–6（当前橙）
      for (let i = 0; i < 6; i++) {
        const bx = 232 + i * 52;
        const cur = i === c;
        ctx.save();
        ctx.fillStyle = cur ? PALETTE.orange : PALETTE.paper;
        ctx.strokeStyle = cur ? PALETTE.orange : PALETTE.grid;
        ctx.lineWidth = cur ? 2 : 1.4;
        ctx.beginPath();
        ctx.arc(bx, 44, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? '#fff' : PALETTE.muted;
        ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), bx, 45);
        ctx.restore();
      }

      // 当前挑战短标题
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CH[c].title, W / 2, 76);
      ctx.restore();

      // 主角毛笔
      drawBrush(ctx, BRUSH.x, BRUSH.y, 0.2, 32);

      // 道具场景
      if (c === 0) {
        // 因果：两段一模一样的笔迹，下一段分岔
        drawInkPath(ctx, [{ x: 380, y: 118 }, { x: 490, y: 118 }], { color: PALETTE.blue, width: 3.5 });
        drawInkPath(ctx, [{ x: 380, y: 170 }, { x: 490, y: 170 }], { color: PALETTE.blue, width: 3.5 });
        drawGhostPath(ctx, [{ x: 490, y: 170 }, { x: 560, y: 170 }], { color: PALETTE.muted, alpha: 0.6 });
        drawGhostPath(ctx, [{ x: 490, y: 170 }, { x: 560, y: 138 }], { color: PALETTE.orange, alpha: 0.9 });
        ctx.save();
        ctx.fillStyle = PALETTE.orange;
        ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('?', 576, 134);
        ctx.restore();
        drawSceneLabel(ctx, 435, 96, '同因', { size: 11, align: 'center' });
        drawSceneLabel(ctx, 435, 200, '同因，果却分岔', { size: 11, align: 'center' });
      } else if (c === 1) {
        // 效率：滴漏
        const cx = 470;
        const pile = 10 + 5 * Math.sin(ms / 500);
        ctx.save();
        ctx.strokeStyle = PALETTE.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 26, 110);
        ctx.lineTo(cx + 26, 110);
        ctx.lineTo(cx + 4, 152);
        ctx.lineTo(cx + 26, 194);
        ctx.lineTo(cx - 26, 194);
        ctx.lineTo(cx - 4, 152);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        // 上腔余沙
        ctx.save();
        ctx.fillStyle = PALETTE.orange;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(cx - 20, 114);
        ctx.lineTo(cx + 20, 114);
        ctx.lineTo(cx + 3, 148);
        ctx.lineTo(cx - 3, 148);
        ctx.closePath();
        ctx.fill();
        // 流沙
        ctx.fillRect(cx - 1, 150, 2, 40 - pile * 0.6);
        // 下腔沙堆
        ctx.beginPath();
        ctx.moveTo(cx - 4 - pile, 192);
        ctx.lineTo(cx + 4 + pile, 192);
        ctx.lineTo(cx + 1, 192 - pile);
        ctx.lineTo(cx - 1, 192 - pile);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        drawSceneLabel(ctx, 470, 216, '算力如沙漏', { size: 11, align: 'center' });
      } else if (c === 2) {
        // 多模态：只看字帖，看不见纸纹
        drawCopybook(ctx, 408, 100, 66, 92);
        drawGhostPath(ctx, [{ x: BRUSH.x + 14, y: BRUSH.y - 26 }, { x: 430, y: 130 }], {
          color: PALETTE.blue,
          alpha: 0.5,
          dash: [3, 4],
        });
        // 纸纹（看不见）：红叉划掉的纹理
        ctx.save();
        ctx.strokeStyle = PALETTE.muted;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(330, 200 + i * 9);
          ctx.bezierCurveTo(350, 197 + i * 9, 370, 203 + i * 9, 390, 200 + i * 9);
          ctx.stroke();
        }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(324, 194, 72, 38);
        ctx.beginPath();
        ctx.moveTo(330, 198);
        ctx.lineTo(390, 228);
        ctx.stroke();
        ctx.restore();
        drawSceneLabel(ctx, 360, 248, '触觉/纸纹：看不见', { size: 11, align: 'center', color: PALETTE.red });
      } else if (c === 3) {
        // 经典控制：界尺
        ctx.save();
        ctx.translate(470, 150);
        ctx.rotate(-0.12);
        ctx.fillStyle = PALETTE.paper;
        ctx.strokeStyle = PALETTE.guide;
        ctx.lineWidth = 1.8;
        ctx.fillRect(-80, -8, 160, 16);
        ctx.strokeRect(-80, -8, 160, 16);
        ctx.strokeStyle = PALETTE.guide;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
          const tx = -80 + i * 20;
          ctx.beginPath();
          ctx.moveTo(tx, -8);
          ctx.lineTo(tx, i % 2 === 0 ? 2 : -2);
          ctx.stroke();
        }
        ctx.restore();
        drawSceneLabel(ctx, 470, 176, '界尺（控制论）', { size: 11, align: 'center' });
      } else if (c === 4) {
        // 符号结构：印章上一枚篆字
        drawTarget(ctx, 470, 148, { r: 20, seal: true });
        ctx.save();
        ctx.strokeStyle = PALETTE.paper;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(462, 160);
        ctx.lineTo(462, 150);
        ctx.lineTo(478, 150);
        ctx.moveTo(470, 150);
        ctx.lineTo(470, 142);
        ctx.stroke();
        ctx.restore();
        drawSceneLabel(ctx, 470, 186, '篆字入印', { size: 11, align: 'center' });
      } else {
        // 评估缺失：空白印位
        ctx.save();
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(448, 126, 44, 44);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = PALETTE.grid;
        ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 470, 148);
        ctx.restore();
        drawSceneLabel(ctx, 470, 186, '印位虚位以待', { size: 11, align: 'center' });
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      render(ms);
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
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="六大开放挑战">
        {CH.map((c) => (
          <button
            key={c.id}
            className={`chip ${ch === c.id ? 'selected' : ''}`}
            aria-pressed={ch === c.id}
            onClick={() => {
              chRef.current = c.id;
              setCh(c.id);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${FB[ch].cls}`}>{FB[ch].text}</div>
    </div>
  );
};

export default M102Challenges;
