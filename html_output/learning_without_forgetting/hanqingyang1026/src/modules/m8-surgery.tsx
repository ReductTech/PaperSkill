import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8.1 —— 点一块，看它在 LwF 里干什么。
// 网络行可点击（conv1–conv5 / fc6 / fc7 / fc8 / 新头），详情在下方固定高度的 DOM 区。
// 阶段 chip「热身 / 联合」整体切换冻结遮罩。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  ink: '#21324a',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#f07e47',
  purple: '#7c3aed',
  line: '#b9c6d8',
  porcelain: '#ece6d9',
  edge: '#7a4a22',
  soft: '#d7deea',
};

type Stage = 'warmup' | 'joint';
type Owner = 'θ_s' | 'θ_o' | 'θ_n';

interface BlockDef {
  id: string;
  name: string;
  shape: string;
  params: number;
  owner: Owner;
  w: number;
  group: 'shared' | 'old' | 'new';
}

const BLOCKS: BlockDef[] = [
  { id: 'conv1', name: 'conv1', shape: '96×11×11×3', params: 34848, owner: 'θ_s', w: 54, group: 'shared' },
  { id: 'conv2', name: 'conv2', shape: '256×5×5×48', params: 307200, owner: 'θ_s', w: 58, group: 'shared' },
  { id: 'conv3', name: 'conv3', shape: '384×3×3×256', params: 884736, owner: 'θ_s', w: 62, group: 'shared' },
  { id: 'conv4', name: 'conv4', shape: '384×3×3×192', params: 663552, owner: 'θ_s', w: 66, group: 'shared' },
  { id: 'conv5', name: 'conv5', shape: '256×3×3×192', params: 442368, owner: 'θ_s', w: 70, group: 'shared' },
  { id: 'fc6', name: 'fc6', shape: '4096×9216', params: 37748736, owner: 'θ_s', w: 84, group: 'shared' },
  { id: 'fc7', name: 'fc7', shape: '4096×4096', params: 16777216, owner: 'θ_s', w: 88, group: 'shared' },
  { id: 'fc8', name: 'fc8', shape: '1000×4096', params: 4096000, owner: 'θ_o', w: 92, group: 'old' },
  { id: 'head', name: '新头', shape: '200×4096', params: 819200, owner: 'θ_n', w: 96, group: 'new' },
];

const LAYOUT: Array<BlockDef & { left: number }> = (() => {
  let x = 46;
  return BLOCKS.map((b) => {
    const left = x;
    x += b.w + 26;
    return { ...b, left };
  });
})();

const TOP = 100;
const BOX_H = 68;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

function feedbackFor(id: string, stage: Stage): { text: string; cls: string } {
  const base = id.indexOf('conv') === 0
    ? '卷积层：共享参数 θ_s 的主体，LwF 里照常更新。'
    : id === 'fc6' || id === 'fc7'
    ? '全连接层：也在 θ_s 里；AlexNet 的大部分参数集中在 fc6 和 fc7。'
    : id === 'fc8'
    ? 'fc8：旧类输出层，属 θ_o；它决定旧任务怎么答。'
    : '新头：θ_n，随机初始化，只有 新类数 × 4096 个参数。';
  const tail =
    stage === 'warmup'
      ? id === 'head'
        ? '热身阶段只有它在训练。'
        : '热身阶段它被冻住，一个梯度都不走。'
      : '联合阶段全部参数一起训，靠蒸馏项把旧类输出按住。';
  return { text: base + tail, cls: '' };
}

export const M8Surgery: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const cfg = useRef<{ block: string; stage: Stage; t0: number }>({
    block: 'fc8',
    stage: 'warmup',
    t0: 0,
  });
  const [block, setBlock] = useState('fc8');
  const [stage, setStage] = useState<Stage>('warmup');
  const [feedback, setFeedback] = useState(feedbackFor('fc8', 'warmup'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const draw = (now: number) => {
      const c = cfg.current;
      const lift = 3 * easeOutCubic(clamp((now - c.t0) / 220, 0, 1));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 块之间的箭头
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      for (let i = 1; i < LAYOUT.length; i += 1) {
        const prev = LAYOUT[i - 1];
        const cur = LAYOUT[i];
        const y = TOP + BOX_H / 2;
        const x1 = prev.left + prev.w + 4;
        const x2 = cur.left - 6;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.fillStyle = C.line;
        ctx.beginPath();
        ctx.moveTo(x2 + 7, y);
        ctx.lineTo(x2 + 1, y - 4.5);
        ctx.lineTo(x2 + 1, y + 4.5);
        ctx.closePath();
        ctx.fill();
      }

      LAYOUT.forEach((b) => {
        const selected = b.id === c.block;
        const frozen = c.stage === 'warmup' && b.id !== 'head';
        const y = TOP - (selected ? lift : 0);

        if (b.group === 'shared') ctx.fillStyle = C.porcelain;
        else if (b.group === 'old') ctx.fillStyle = 'rgba(34,141,92,0.16)';
        else ctx.fillStyle = 'rgba(124,58,237,0.14)';
        roundRect(ctx, b.left, y, b.w, BOX_H, 8);
        ctx.fill();

        if (frozen) {
          ctx.fillStyle = 'rgba(112,124,142,0.45)';
          roundRect(ctx, b.left, y, b.w, BOX_H, 8);
          ctx.fill();
        }

        if (selected) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2.5;
        } else if (!frozen) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle =
            b.group === 'old' ? C.green : b.group === 'new' ? C.purple : C.edge;
          ctx.lineWidth = 1.5;
        }
        roundRect(ctx, b.left, y, b.w, BOX_H, 8);
        ctx.stroke();
      });

      // 每块下面的参数量条（只画高度，不写数字）：fc6 / fc7 明显最高
      const baseY = 250;
      ctx.strokeStyle = C.soft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, baseY);
      ctx.lineTo(936, baseY);
      ctx.stroke();
      LAYOUT.forEach((b) => {
        const hgt = Math.max(6, (Math.log10(b.params) - 4) * 15);
        const cx = b.left + b.w / 2;
        ctx.fillStyle =
          b.group === 'old'
            ? 'rgba(34,141,92,0.5)'
            : b.group === 'new'
            ? 'rgba(124,58,237,0.5)'
            : b.id === c.block
            ? 'rgba(240,126,71,0.62)'
            : 'rgba(39,68,110,0.32)';
        ctx.fillRect(cx - 9, baseY - hgt, 18, hgt);
      });

      // 两个画布标签
      const sharedX = (LAYOUT[0].left + LAYOUT[4].left + LAYOUT[4].w) / 2;
      const ownX = (LAYOUT[7].left + LAYOUT[8].left + LAYOUT[8].w) / 2;
      ctx.fillStyle = C.ink;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('共享', sharedX, TOP - 16);
      ctx.fillText('专属', ownX, TOP - 16);
    };

    const tick = () => {
      draw(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (id: string) => {
    const c = cfg.current;
    if (c.block !== id) {
      c.block = id;
      c.t0 = performance.now();
    }
    setBlock(id);
    setFeedback(feedbackFor(id, c.stage));
  };

  const switchStage = (s: Stage) => {
    const c = cfg.current;
    c.stage = s;
    setStage(s);
    setFeedback(feedbackFor(c.block, s));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    if (y < TOP - 6 || y > TOP + BOX_H + 6) return;
    const hit = LAYOUT.find((b) => x >= b.left && x <= b.left + b.w);
    if (hit) select(hit.id);
  };

  const sel = LAYOUT.find((b) => b.id === block) || LAYOUT[7];
  const ownerText =
    sel.owner === 'θ_s' ? 'θ_s 共享' : sel.owner === 'θ_o' ? 'θ_o 旧任务' : 'θ_n 新任务';
  const stageText =
    stage === 'warmup' ? (sel.id === 'head' ? '热身 · 训练' : '热身 · 冻结') : '联合 · 训练';

  return (
    <div>
      <div className="chip-row">
        {LAYOUT.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`chip${b.id === block ? ' selected' : ''}`}
            aria-pressed={b.id === block}
            onClick={() => select(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        <button
          type="button"
          className={`chip${stage === 'warmup' ? ' selected' : ''}`}
          aria-pressed={stage === 'warmup'}
          onClick={() => switchStage('warmup')}
        >
          热身
        </button>
        <button
          type="button"
          className={`chip${stage === 'joint' ? ' selected' : ''}`}
          aria-pressed={stage === 'joint'}
          onClick={() => switchStage('joint')}
        >
          联合
        </button>
      </div>
      <div className="metrics" style={{ minHeight: 128 }}>
        <div className="metric">
          <div className="l">名称</div>
          <div className="v">{sel.name}</div>
        </div>
        <div className="metric">
          <div className="l">形状</div>
          <div className="v">{sel.shape}</div>
        </div>
        <div className="metric">
          <div className="l">参数量</div>
          <div className="v">{sel.params.toLocaleString('en-US')}</div>
        </div>
        <div className="metric">
          <div className="l">θ 归属</div>
          <div className="v">{ownerText}</div>
        </div>
        <div className="metric">
          <div className="l">当前阶段</div>
          <div className="v">{stageText}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M8Surgery;
