import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawLegend, drawValueChip } from './potteryKit';
import type { WidgetProps } from './registry';

// Module 7.2 「七种窑炉配置台」 — switch among the 7 training platforms and
// see configuration/action dims, camera count, and the shared 18-dim zero-
// padded action space (paper Sec V-C).
const W = 1080;
const H = 280;

interface Platform {
  key: string;
  chip: string;
  name: string;
  configDim: number;
  actionDim: number;
  cameras: number;
  note: string;
  arms: number;
  mobile: boolean;
}

// dims are configuration/action dims from paper Sec V-C
const PLATFORMS: Platform[] = [
  { key: 'ur5e', chip: 'UR5e', name: 'UR5e 单臂', configDim: 7, actionDim: 7, cameras: 2, note: '腕部+肩上双相机', arms: 1, mobile: false },
  { key: 'bi-ur5e', chip: '双 UR5e', name: '双臂 UR5e', configDim: 14, actionDim: 14, cameras: 3, note: '三相机', arms: 2, mobile: false },
  { key: 'franka', chip: 'Franka', name: 'Franka', configDim: 8, actionDim: 8, cameras: 2, note: '双相机', arms: 1, mobile: false },
  { key: 'bi-trossen', chip: '双 Trossen', name: '双臂 Trossen', configDim: 14, actionDim: 14, cameras: 3, note: 'ALOHA 式双 6-DoF', arms: 2, mobile: false },
  { key: 'bi-arx', chip: '双 ARX', name: '双臂 ARX/AgileX', configDim: 14, actionDim: 14, cameras: 3, note: '双 6-DoF', arms: 2, mobile: false },
  { key: 'mob-trossen', chip: '移 Trossen', name: '移动 Trossen/ARX', configDim: 14, actionDim: 16, cameras: 3, note: '非全向底盘 +2 维', arms: 2, mobile: true },
  { key: 'mob-fibocom', chip: '移 Fibocom', name: '移动 Fibocom', configDim: 14, actionDim: 17, cameras: 3, note: '全向底盘 +3 维', arms: 2, mobile: true },
];

export const Ch7Kilns: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ idx: number }>({ idx: 0 });
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState({
    text: 'π0 在这七种窑炉上联合训练——点选看每种的结构与维度。',
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
    let raf = 0;

    const render = (ms: number) => {
      const p = PLATFORMS[stateRef.current.idx];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // ---- platform glyph (left 40%): arms + base + cameras ----
      const cx = 200;
      const cy = 190;
      ctx.save();
      // mobile base
      if (p.mobile) {
        ctx.fillStyle = C.ground;
        ctx.strokeStyle = C.deep;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 70, cy - 8, 140, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.deep;
        [-52, 52].forEach((dx) => {
          ctx.beginPath();
          ctx.arc(cx + dx, cy + 14, 7, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // arms
      const armXs = p.arms === 2 ? [cx - 40, cx + 40] : [cx];
      armXs.forEach((ax) => {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ax, cy - 10);
        ctx.lineTo(ax - 14, cy - 46);
        ctx.lineTo(ax + 4, cy - 78);
        ctx.stroke();
        // gripper
        ctx.lineWidth = 2.75;
        ctx.beginPath();
        ctx.moveTo(ax + 4, cy - 78);
        ctx.lineTo(ax - 2, cy - 90);
        ctx.moveTo(ax + 4, cy - 78);
        ctx.lineTo(ax + 10, cy - 90);
        ctx.stroke();
      });
      // cameras (icons above)
      const camXs =
        p.cameras === 3 ? [cx - 80, cx, cx + 80] : p.cameras === 2 ? [cx - 60, cx + 60] : [cx];
      camXs.forEach((kx) => {
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(kx - 11, 64, 22, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(kx, 71, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      });
      drawSceneLabel(ctx, p.name, cx, 236, { align: 'center' });
      drawSceneLabel(ctx, p.note, cx, 254, { color: C.muted, align: 'center' });
      ctx.restore();

      // ---- right 55%: dimension readouts ----
      drawSceneLabel(ctx, '动作维度（统一 18 维，零填充）', 470, 60, { color: C.text });
      for (let k = 0; k < 18; k++) {
        const sx = 470 + k * 30;
        const used = k < p.actionDim;
        ctx.fillStyle = used ? C.purple : '#e3e9f2';
        ctx.strokeStyle = used ? C.deep : C.border;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(sx, 74, 24, 22, 3);
        ctx.fill();
        ctx.stroke();
        if (!used) {
          ctx.fillStyle = C.muted;
          ctx.font = '10px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('0', sx + 12, 85);
        }
      }
      drawSceneLabel(ctx, `实际 ${p.actionDim} 维`, 470, 116, { color: C.purple });
      drawSceneLabel(ctx, `填充 ${18 - p.actionDim} 位 0`, 620, 116, { color: C.muted });

      drawSceneLabel(ctx, '配置（关节）维度', 470, 152, { color: C.text });
      for (let k = 0; k < 18; k++) {
        const sx = 470 + k * 30;
        const used = k < p.configDim;
        ctx.fillStyle = used ? C.blue : '#e3e9f2';
        ctx.strokeStyle = used ? C.deep : C.border;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(sx, 166, 24, 22, 3);
        ctx.fill();
        ctx.stroke();
      }
      drawSceneLabel(ctx, `${p.configDim} 维`, 470, 208, { color: C.blue });

      // camera count chip
      drawValueChip(ctx, 980, 152, `${p.cameras} 相机`, C.orange);

      drawLegend(
        ctx,
        [
          ['动作维', C.purple],
          ['配置维', C.blue],
          ['零填充', C.border],
        ],
        470,
        H - 16
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (i: number) => {
    stateRef.current.idx = i;
    setIdx(i);
    const p = PLATFORMS[i];
    const mobileNote = p.mobile ? `移动底盘加 ${p.actionDim - p.configDim} 个动作维` : '固定工位';
    setFeedback({
      text: `${p.name}：${p.configDim} 维关节配置、${p.actionDim} 维动作、${p.cameras} 个相机（${mobileNote}）——统一零填充到 18 维后同灶混训。`,
      cls: '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {PLATFORMS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className={`chip ${idx === i ? 'selected' : ''}`}
            onClick={() => pick(i)}
          >
            {p.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Kilns;
