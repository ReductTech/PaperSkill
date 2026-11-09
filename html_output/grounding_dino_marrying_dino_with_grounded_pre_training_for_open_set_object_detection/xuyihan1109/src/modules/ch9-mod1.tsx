import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawCard,
  drawFrame,
  drawLink,
  drawLabel,
  drawLegend,
  useCanvas,
  clamp,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;
const X0 = 96;
const X1 = 1000;
const SPAN = X1 - X0;
const RACE_MS = 2000;

type Scene = 'odinw' | 'rec' | 'edit';

interface SceneInfo {
  chip: string;
  name: string;
  value: string;
  fb: string;
  cls: string;
}

const SCENE_INFO: Record<Scene, SceneInfo> = {
  odinw: {
    chip: 'ODinW 零样本',
    name: 'ODinW',
    value: '26.1',
    fb: 'ODinW 零样本平均 26.1 AP，当时的新高。',
    cls: 'good',
  },
  rec: {
    chip: 'REC',
    name: 'REC',
    value: '89～93',
    fb: '加了 RefC 数据：89～93 的准确率；但零样本 REC 只有 ~50。',
    cls: 'good',
  },
  edit: {
    chip: '图像编辑',
    name: '图像编辑',
    value: '定性',
    fb: '配合扩散模型做图像编辑：先框出物体，再按词改。',
    cls: '',
  },
};

const ORDER: Scene[] = ['odinw', 'rec', 'edit'];

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  if (w <= 0) return;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = color;
  ctx.fill();
}

function baseline(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(X0 - 10, y);
  ctx.lineTo(X1, y);
  ctx.stroke();
  for (let i = 0; i <= 8; i += 1) {
    const tx = X0 + (SPAN * i) / 8;
    ctx.beginPath();
    ctx.moveTo(tx, y - 4);
    ctx.lineTo(tx, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ scene: 'odinw' as Scene, raceStart: 0 });
  const [scene, setScene] = useState<Scene>('odinw');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: 'ODinW：35 个以上数据集，不训目标集也能测。',
    cls: '',
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      const info = SCENE_INFO[stateRef.current.scene];
      setRunning(false);
      setFeedback({ text: info.fb, cls: info.cls });
    }, RACE_MS);
    return () => window.clearTimeout(id);
  }, [running]);

  const choose = (s: Scene) => {
    stateRef.current.scene = s;
    stateRef.current.raceStart = 0;
    setScene(s);
    setRunning(false);
    setFeedback({ text: SCENE_INFO[s].fb, cls: SCENE_INFO[s].cls });
  };

  const startRace = () => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stateRef.current.raceStart = reduce ? now - RACE_MS : now;
    if (reduce) {
      const info = SCENE_INFO[stateRef.current.scene];
      setRunning(false);
      setFeedback({ text: info.fb, cls: info.cls });
      return;
    }
    setRunning(true);
  };

  const { ref } = useCanvas(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const cur = s.scene;
      const info = SCENE_INFO[cur];
      const p = s.raceStart > 0 ? clamp((time - s.raceStart) / RACE_MS, 0, 1) : 0;

      drawLabel(ctx, info.name, 44, 40, { size: 17, bold: true });

      if (cur === 'odinw') {
        baseline(ctx, 114);
        const w = SPAN * (26.1 / 100) * p;
        bar(ctx, X0, 86, w, 28, COLORS.good);
        if (p > 0) {
          drawLabel(ctx, '26.1', X0 + w + 12, 106, { size: 16, bold: true, color: COLORS.good });
        }
        drawLegend(ctx, 96, 246, [{ color: COLORS.good, text: '本方法' }]);
      } else if (cur === 'rec') {
        baseline(ctx, 114);
        baseline(ctx, 174);
        // zero-shot REC is still around 50
        const wc = SPAN * (50 / 100) * p;
        bar(ctx, X0, 146, wc, 28, COLORS.muted);
        // with RefC data the accuracy sits in the 89–93 band
        const wa = SPAN * (89 / 100) * p;
        const wb = SPAN * (93 / 100) * p;
        bar(ctx, X0, 86, wb, 28, tint(COLORS.good, 0.35));
        bar(ctx, X0, 86, wa, 28, COLORS.good);
        if (p > 0) {
          ctx.save();
          ctx.strokeStyle = COLORS.good;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(X0 + wb, 80);
          ctx.lineTo(X0 + wb, 120);
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, '89～93', X0 + wb + 12, 106, { size: 16, bold: true, color: COLORS.good });
        }
        drawLegend(ctx, 96, 246, [
          { color: COLORS.good, text: '本方法' },
          { color: COLORS.muted, text: '零样本' },
        ]);
      } else {
        // qualitative only: frame the object, then let the word change it.
        const step = p <= 0 ? 0 : Math.min(2, Math.floor(p * 3));
        const boxes: Array<[number, number, number, number]> = [
          [96, 64, 110, 110],
          [272, 64, 190, 110],
          [592, 64, 190, 110],
        ];
        drawCard(ctx, 116, 76, 64, 44, { lines: 3 });
        drawPitch(ctx, 300, 78, 150, 84, { rows: 2, cols: 3, spots: [{ r: 0, c: 1 }] });
        drawFrame(ctx, 375, 99, 34, 40, { color: COLORS.confirm, weight: 3 });
        drawPitch(ctx, 620, 78, 150, 84, { rows: 2, cols: 3, spots: [{ r: 0, c: 1 }] });
        if (step >= 1) {
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = COLORS.fuse;
          ctx.fillRect(677, 79, 36, 40);
          ctx.restore();
        }
        drawLink(ctx, [182, 98], [300, 98], { active: true, twoWay: false });
        drawLink(ctx, [452, 98], [620, 98], { active: true, twoWay: false });
        if (p > 0) {
          const b = boxes[step];
          ctx.save();
          ctx.strokeStyle = COLORS.ring;
          ctx.lineWidth = 3;
          ctx.setLineDash([7, 6]);
          roundRect(ctx, b[0], b[1], b[2], b[3], 10);
          ctx.stroke();
          ctx.restore();
        }
        drawLabel(ctx, '按词改', 592, 200, { size: 15, bold: true });
        drawLegend(ctx, 96, 246, [
          { color: COLORS.fuse, text: '卡片' },
          { color: COLORS.confirm, text: '框选' },
        ]);
      }
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>场景</label>
        {ORDER.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${scene === s ? 'selected' : ''}`}
            aria-pressed={scene === s}
            onClick={() => choose(s)}
          >
            {SCENE_INFO[s].chip}
          </button>
        ))}
        <button type="button" className="tiny" onClick={startRace} disabled={running}>
          开始
        </button>
        <span className="val">{SCENE_INFO[scene].value}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div className="hotspot-info">
        这里的「零样本」指没有使用测试数据集的训练划分，并不等于没看过任何图像；零样本 REC
        只有 ~50，作者自己把它列为短板；ODinW 是 35 个以上数据集的平均，单数据集数字不能直接和平均比；图像编辑只有定性例子，没有统一指标。
      </div>
    </div>
  );
};

export default Ch9Mod1;
