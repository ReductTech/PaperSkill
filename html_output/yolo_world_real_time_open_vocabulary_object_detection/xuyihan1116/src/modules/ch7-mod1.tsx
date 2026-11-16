import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawLabel,
  drawLegend,
  drawMeter,
  drawName,
  drawRoster,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// 整机图：文本编码器 → YOLO 主干 → RepVL-PAN → 两个头。
// 点四个部件看它在做什么；切「训练 / 部署」，看文本编码器那一段怎么变：
// 训练时是在线回路，部署时被折进权重（虚线 + 琥珀锁）。

const W = 1080;
const H = 280;

type Part = 'text' | 'backbone' | 'pan' | 'head';
type Mode = 'train' | 'deploy';
type S = { sel: Part; mode: Mode };

const PARTS: Array<{ key: Part; name: string; short: string; x: number; y: number; w: number; h: number }> = [
  { key: 'text', name: '文本编码器', short: '文本编码', x: 48, y: 96, w: 136, h: 68 },
  { key: 'backbone', name: 'YOLO 主干', short: 'YOLO主干', x: 204, y: 96, w: 136, h: 68 },
  { key: 'pan', name: 'RepVL-PAN', short: '融合PAN', x: 360, y: 96, w: 136, h: 68 },
  { key: 'head', name: '两个头', short: '两个头', x: 516, y: 96, w: 136, h: 68 },
];

const FB: Record<Part, { text: string; cls: string }> = {
  text: { text: '文本编码器：把名字变成词向量。', cls: '' },
  backbone: { text: 'YOLO 主干：出一组多尺度图像特征。', cls: '' },
  pan: { text: 'RepVL-PAN：文本按通道调制图像，图像再回头修正文本。', cls: '' },
  head: { text: '两个头：框回归头出框，文本对比头算目标与每个词的相似度。', cls: 'good' },
};

const INFO: Record<Part, { input: string; output: string; note: string }> = {
  text: {
    input: '一组名词提示（训练时来自当前 mosaic，部署时来自用户输入）',
    output: 'C×D 的词嵌入矩阵 W',
    note: '部署时这一段只离线跑一次，随后被折进层权重。',
  },
  backbone: {
    input: '一张输入图像',
    output: 'P3/P4/P5 三组多尺度图像特征 X_l（H×W×D）',
    note: '训练和部署走同一条主干，这一段没有区别。',
  },
  pan: {
    input: '图像特征 X_l 与词嵌入 W',
    output: '文本调制后的图像特征，以及被图像反过来修正的 W′',
    note: '文本引导的 CSPLayer 与 Image-Pooling Attention 都在这里。',
  },
  head: {
    input: 'RepVL-PAN 的输出',
    output: '框回归结果，以及目标与每个词的相似度 s_{k,j}',
    note: '训练时接对比损失和回归损失，部署时直接出分数。',
  },
};

const ACTIVE_LINKS: Record<Part, string[]> = {
  text: ['roster_text', 'text_pan'],
  backbone: ['desks_backbone', 'backbone_pan'],
  pan: ['text_pan', 'backbone_pan', 'pan_head'],
  head: ['pan_head', 'head_out'],
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
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

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
  ctx.stroke();
  ctx.restore();
}

function lock(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.book;
  ctx.fillStyle = COLORS.book;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 5, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(cx - 7, cy - 1, 14, 10);
  ctx.restore();
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState<Part>('pan');
  const [mode, setMode] = useState<Mode>('deploy');
  const [fb, setFb] = useState(FB.pan);
  const stateRef = useRef<S>({ sel: 'pan', mode: 'deploy' });

  const { ref } = useCanvas<S>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const deploy = s.mode === 'deploy';
      const on = (id: string): boolean => ACTIVE_LINKS[s.sel].indexOf(id) >= 0;
      const colorOf = (id: string): string => (on(id) ? COLORS.name : COLORS.chalkDim);
      const widthOf = (id: string): number => (on(id) ? 3 : 2);

      // 右侧固定详情与左侧流程图之间的分隔
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(680, 40);
      ctx.lineTo(680, 244);
      ctx.stroke();
      ctx.restore();

      // 两路输入：册子（文字）与教室（图像）
      drawRoster(ctx, 84, 34, 64, 46, { lines: 2, locked: deploy });
      drawDesks(ctx, 212, 34, 120, 46, { rows: 1, cols: 3 });
      drawKid(ctx, 242, 52, 0.8);
      drawKid(ctx, 302, 52, 0.8);

      // 输入 → 部件
      if (deploy) {
        arrow(ctx, 116, 80, 116, 92, COLORS.book, 2, true);
      } else {
        arrow(ctx, 116, 80, 116, 92, colorOf('roster_text'), widthOf('roster_text'), false);
      }
      arrow(ctx, 272, 80, 272, 92, colorOf('desks_backbone'), widthOf('desks_backbone'), false);

      // 训练：每张图都要过一遍编码器（在线回路）；部署：这条回路被切断
      ctx.save();
      ctx.strokeStyle = COLORS.book;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      if (deploy) {
        ctx.moveTo(212, 58);
        ctx.lineTo(202, 78);
      } else {
        ctx.moveTo(212, 58);
        ctx.quadraticCurveTo(196, 86, 188, 112);
      }
      ctx.stroke();
      ctx.restore();
      if (!deploy) {
        ctx.save();
        ctx.strokeStyle = COLORS.book;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(188, 112);
        ctx.lineTo(196, 102);
        ctx.moveTo(188, 112);
        ctx.lineTo(181, 100);
        ctx.stroke();
        ctx.restore();
      }
      if (deploy) {
        ctx.save();
        ctx.strokeStyle = COLORS.fast;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(195, 76);
        ctx.lineTo(207, 88);
        ctx.stroke();
        ctx.restore();
      }

      // 三个段间箭头（部署时 文本 → PAN 这一段就是「折进权重」的那条虚线）
      arrow(
        ctx,
        184,
        130,
        204,
        130,
        deploy ? COLORS.book : colorOf('text_pan'),
        deploy ? 2 : widthOf('text_pan'),
        deploy
      );
      arrow(ctx, 340, 130, 360, 130, colorOf('backbone_pan'), widthOf('backbone_pan'), false);
      arrow(ctx, 496, 130, 516, 130, colorOf('pan_head'), widthOf('pan_head'), false);

      // 四个部件
      for (const b of PARTS) {
        const selected = s.sel === b.key;
        const folded = b.key === 'text' && deploy;

        ctx.save();
        roundRect(ctx, b.x, b.y, b.w, b.h, 12);
        ctx.fillStyle = COLORS.board2;
        ctx.fill();
        if (folded) ctx.setLineDash([7, 5]);
        ctx.strokeStyle = selected ? COLORS.book : COLORS.axis;
        ctx.lineWidth = selected ? 3 : 2;
        ctx.stroke();
        ctx.restore();

        if (selected) {
          ctx.save();
          roundRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 16);
          ctx.strokeStyle = COLORS.book;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }
        if (folded) lock(ctx, b.x + b.w - 20, b.y + 20);

        drawLabel(ctx, b.short, b.x + b.w / 2, b.y + b.h / 2 + 5, {
          size: 15,
          color: COLORS.chalk,
          align: 'center',
        });
      }

      // 头 → 输出
      arrow(ctx, 584, 164, 584, 190, colorOf('head_out'), widthOf('head_out'), false);
      drawDesks(ctx, 508, 196, 152, 48, { rows: 1, cols: 2 });
      drawKid(ctx, 546, 218, 0.85);
      drawKid(ctx, 598, 218, 0.85);
      ctx.save();
      ctx.strokeStyle = COLORS.fast;
      ctx.lineWidth = 2;
      ctx.strokeRect(532, 202, 32, 32);
      ctx.restore();
      drawTick(ctx, 576, 210, { ok: true });

      // 右侧固定详情：两个头各自的产出
      const rows: Array<{ name: string; score: number }> = [
        { name: '小明', score: 0.82 },
        { name: '小红', score: 0.41 },
        { name: '小刚', score: 0.12 },
      ];
      rows.forEach((row, i) => {
        const y = 56 + i * 40;
        drawName(ctx, 700, y, { text: row.name, width: 78, active: i === 0 });
        drawMeter(ctx, 792, y + 3, 190, 16, row.score);
        drawLabel(ctx, row.score.toFixed(2), 990, y + 16, {
          size: 12,
          color: COLORS.chalkDim,
        });
      });

      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(700, 170);
      ctx.lineTo(1030, 170);
      ctx.stroke();
      ctx.restore();

      drawDesks(ctx, 700, 180, 130, 52, { rows: 1, cols: 2 });
      drawKid(ctx, 738, 202, 0.85);
      drawKid(ctx, 798, 202, 0.85);
      ctx.save();
      ctx.strokeStyle = COLORS.fast;
      ctx.lineWidth = 2;
      ctx.strokeRect(724, 186, 32, 32);
      ctx.restore();
      drawTick(ctx, 772, 192, { ok: true });

      drawLegend(ctx, 40, 268, [
        { color: COLORS.name, text: '激活路径' },
        { color: COLORS.book, text: deploy ? '已折进权重' : '在线回路' },
        { color: COLORS.fast, text: '相似度' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const selectPart = (next: Part) => {
    stateRef.current.sel = next;
    setSel(next);
    setFb(FB[next]);
  };

  const selectMode = (next: Mode) => {
    stateRef.current.mode = next;
    setMode(next);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const hit = PARTS.find(
      (b) => x >= b.x - 8 && x <= b.x + b.w + 8 && y >= b.y - 8 && y <= b.y + b.h + 8
    );
    if (hit) selectPart(hit.key);
  };

  const part = PARTS.find((b) => b.key === sel) || PARTS[2];
  const info = INFO[sel];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="ctrl" role="group" aria-label="选择跑法">
        <label>跑法</label>
        {(['train', 'deploy'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${mode === m ? 'selected' : ''}`}
            aria-pressed={mode === m}
            onClick={() => selectMode(m)}
          >
            {m === 'train' ? '训练' : '部署'}
          </button>
        ))}
      </div>
      <div className="ctrl" role="group" aria-label="选择部件">
        <label>部件</label>
        {PARTS.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`chip ${sel === b.key ? 'selected' : ''}`}
            aria-pressed={sel === b.key}
            onClick={() => selectPart(b.key)}
          >
            {b.name}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        <b>{part.name}</b>。输入：{info.input}；输出：{info.output}。
        <br />
        {info.note}
        <br />
        当前跑法：{mode === 'train' ? '训练（在线词表）' : '部署（离线词表）'}。
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7Mod1;
