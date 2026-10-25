import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  BAD,
  AUX,
  INK,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 第 8 章 模块 8.1 —— 主干切换：CNN 还是 Transformer
// 左：四节点结构图（可点击）+ 短刨/长刨小景；右：固定高度的详情区（切换节点不跳布局）。
// 主干 chips 与 4 个节点按钮正交组合，8 种组合全部有效。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Backbone = 'cnn' | 'transformer';
type NodeId = 'encoder' | 'cond' | 'trunk' | 'out';

const ORDER: NodeId[] = ['encoder', 'cond', 'trunk', 'out'];

interface NodeRect {
  id: NodeId;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODE_W = 200;
const NODE_H = 40;
const NODE_X = 34;
const NODE_CX = NODE_X + NODE_W / 2;
const NODE_RECTS: NodeRect[] = [
  { id: 'encoder', name: '观测编码器', x: NODE_X, y: 22, w: NODE_W, h: NODE_H },
  { id: 'cond', name: '条件注入', x: NODE_X, y: 76, w: NODE_W, h: NODE_H },
  { id: 'trunk', name: '主干', x: NODE_X, y: 130, w: NODE_W, h: NODE_H },
  { id: 'out', name: '动作输出', x: NODE_X, y: 184, w: NODE_W, h: NODE_H },
];

const SEL_FILL = '#e9eefa';

// 生活小景：一块起伏板，板上的刨子长度随主干变化（CNN = 长刨，Transformer = 短刨）
const MB_X = 300;
const MB_Y = 208;
const MB_W = 272;
const MB_H = 27;
const MB_N = 25;
const MPROF: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < MB_N; i += 1) {
    out.push(3 + 2.4 * Math.sin(i * 0.7) + 1.4 * Math.sin(i * 1.6));
  }
  for (let i = 0; i < MB_N; i += 1) {
    const d = Math.abs(i - 17);
    if (d <= 1) out[i] += (2 - d) * 5;
  }
  return out;
})();
const MSMOOTH: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < MB_N; i += 1) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(MB_N - 1, i + 4); j += 1) {
      s += MPROF[j];
      c += 1;
    }
    out.push(s / c);
  }
  return out;
})();

// 技术小景：动作信号与主干给出的两条路径——CNN 是低通，Transformer 跟随
const SG_N = 44;
const SIG: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < SG_N; i += 1) {
    out.push(19 * (0.62 * Math.sin(i * 0.52) + 0.38 * Math.sin(i * 1.31)));
  }
  out[30] += 17;
  out[31] += 9;
  return out;
})();
const SIG_SMOOTH: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < SG_N; i += 1) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - 5); j <= Math.min(SG_N - 1, i + 5); j += 1) {
      s += SIG[j];
      c += 1;
    }
    out.push(s / c);
  }
  return out;
})();

const SG_X0 = 276;
const SG_X1 = 594;
const SG_MID = 108;

const sampleAt = (arr: number[], x: number, x0: number, x1: number): number => {
  const fi = clamp(((x - x0) / (x1 - x0)) * (arr.length - 1), 0, arr.length - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(arr.length - 1, i0 + 1);
  return lerp(arr[i0], arr[i1], fi - i0);
};

const nameOf = (id: NodeId): string => {
  const found = NODE_RECTS.find((r) => r.id === id);
  return found ? found.name : '';
};

const shapeOf = (id: NodeId, back: Backbone): string => {
  if (id === 'encoder') return 'To 帧 → Ot';
  if (id === 'cond') return back === 'cnn' ? 'Ot → FiLM' : 'Ot → 交叉注意力';
  return 'Tp × D';
};

const tagOf = (id: NodeId, back: Backbone): string => {
  if (id === 'encoder') return '每帧编码后拼接';
  if (id === 'cond') return back === 'cnn' ? '逐通道调制' : '被动 token';
  if (id === 'trunk') return back === 'cnn' ? '时序卷积' : '因果注意力';
  return '预测噪声';
};

const backboneText = (back: Backbone): string =>
  back === 'cnn'
    ? '观测经 FiLM 逐通道调制每一层卷积。开箱即用，但时序卷积天然偏好低频，动作变化剧烈时会过度平滑。'
    : '观测作为被动 token 进入交叉注意力，动作 token 用因果注意力只看自己和更早的动作。能跟上剧烈变化，但对 dropout 和权重衰减更敏感。';

const nodeText = (id: NodeId, back: Backbone): string => {
  if (id === 'encoder') return '观测编码器把最近 To 帧各编码一次，再拼成条件 Ot；编码器是未预训练的 ResNet-18。';
  if (id === 'cond') return '两种主干注入的是同一个 Ot，区别只在注入方式。';
  if (id === 'trunk')
    return back === 'cnn'
      ? '主干是一串时序卷积方块。BlockPush 对时序结构极敏感：CNN 版只有 0.36/0.11，Transformer 版达 0.99/0.94。'
      : '主干是带因果注意力的方块堆。BlockPush 对时序结构极敏感：CNN 版只有 0.36/0.11，Transformer 版达 0.99/0.94。';
  return '输出与带噪动作序列同形，训练时对噪声做 MSE 回归。';
};

const detailOf = (id: NodeId, back: Backbone): { shape: string; note: string } => ({
  shape: shapeOf(id, back),
  note: nodeText(id, back),
});

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const stateRef = useRef<{ backbone: Backbone; nodeId: NodeId }>({
    backbone: 'cnn',
    nodeId: 'encoder',
  });
  const [backbone, setBackbone] = useState<Backbone>('cnn');
  const [nodeId, setNodeId] = useState<NodeId>('encoder');
  const [feedback, setFeedback] = useState(
    backboneText('cnn') + detailOf('encoder', 'cnn').note
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawTrunkGlyph = (
      r: NodeRect,
      back: Backbone,
      ox: CanvasRenderingContext2D
    ) => {
      if (back === 'cnn') {
        ox.strokeStyle = GUIDE;
        ox.lineWidth = 1.5;
        ox.beginPath();
        ox.moveTo(r.x + 100, r.y + 20);
        ox.lineTo(r.x + 186, r.y + 20);
        ox.stroke();
        ox.fillStyle = GUIDE;
        for (let i = 0; i < 5; i += 1) {
          ox.fillRect(r.x + 100 + i * 18, r.y + 13, 13, 13);
        }
      } else {
        ox.fillStyle = GUIDE;
        ox.fillRect(r.x + 104, r.y + 20, 14, 14);
        ox.fillRect(r.x + 130, r.y + 20, 14, 14);
        ox.fillRect(r.x + 156, r.y + 20, 14, 14);
        ox.strokeStyle = AUX;
        ox.lineWidth = 1.5;
        ox.beginPath();
        ox.moveTo(r.x + 111, r.y + 19);
        ox.quadraticCurveTo(r.x + 124, r.y + 3, r.x + 137, r.y + 19);
        ox.stroke();
        ox.beginPath();
        ox.moveTo(r.x + 137, r.y + 19);
        ox.quadraticCurveTo(r.x + 150, r.y + 3, r.x + 163, r.y + 19);
        ox.stroke();
      }
    };

    const render = (s: { backbone: Backbone; nodeId: NodeId }, tl: number) => {
      clearScene(ctx, W, H);
      const cnn = s.backbone === 'cnn';
      const activePath = ORDER.slice(0, ORDER.indexOf(s.nodeId) + 1);
      const detail = detailOf(s.nodeId, s.backbone);

      // 节点之间的连线：数据流到当前节点为止都是活跃路径
      for (let i = 0; i < ORDER.length - 1; i += 1) {
        const active = activePath.indexOf(ORDER[i + 1]) >= 0;
        ctx.strokeStyle = active ? GUIDE : LINE;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(NODE_CX, NODE_RECTS[i].y + NODE_H);
        ctx.lineTo(NODE_CX, NODE_RECTS[i + 1].y);
        ctx.stroke();
      }

      NODE_RECTS.forEach((r) => {
        const sel = r.id === s.nodeId;
        roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fillStyle = sel ? SEL_FILL : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = sel ? GUIDE : LINE;
        ctx.lineWidth = sel ? 3 : 1.5;
        ctx.stroke();

        ctx.font = '16px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillStyle = INK;
        ctx.fillText(r.name, r.x + 14, r.y + 26);

        ctx.textAlign = 'right';
        if (r.id === 'cond') {
          ctx.font = '15px ' + FONT;
          ctx.fillStyle = GUIDE;
          ctx.fillText(cnn ? 'FiLM' : '交叉注意力', r.x + 186, r.y + 26);
        } else if (r.id === 'encoder') {
          ctx.font = '13px ' + FONT;
          ctx.fillStyle = MUTED;
          ctx.fillText('ResNet-18', r.x + 186, r.y + 26);
        } else if (r.id === 'out') {
          ctx.font = '13px ' + FONT;
          ctx.fillStyle = MUTED;
          ctx.fillText('Tp × D', r.x + 186, r.y + 26);
        } else {
          drawTrunkGlyph(r, s.backbone, ctx);
        }
        ctx.textAlign = 'left';
      });

      // 技术小景：同一个动作信号，两种主干给出两条不同的路径
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < SG_N; i += 1) {
        const sx = SG_X0 + ((SG_X1 - SG_X0) * i) / (SG_N - 1);
        const sy = SG_MID - SIG[i];
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.strokeStyle = cnn ? BAD : OK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < SG_N; i += 1) {
        const sx = SG_X0 + ((SG_X1 - SG_X0) * i) / (SG_N - 1);
        const sy = cnn ? SG_MID - SIG_SMOOTH[i] : SG_MID - SIG[i] - 1;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // 生活小景：板上的刨子长度就是主干的结构长度
      drawBoard(ctx, MB_X, MB_Y, MB_W, MB_H, MPROF);
      const cycle = (tl / 3.2) % 1;
      const px = lerp(322, 550, easeInOutQuad(cycle));
      const py = MB_Y - sampleAt(cnn ? MSMOOTH : MPROF, px, MB_X, MB_X + MB_W) - 1;
      drawPlane(ctx, px, py, { length: cnn ? 108 : 54 });
      drawShavings(ctx, px - (cnn ? 42 : 22), py - 2, tl * 3, 2);
      drawSceneLabel(ctx, cnn ? '长刨' : '短刨', clamp(px - 88, 276, 500), py - 22, AUX);

      // 图例
      drawLegend(
        ctx,
        cnn
          ? [
              { color: GUIDE, text: '活跃路径' },
              { color: BAD, text: '低通' },
            ]
          : [
              { color: GUIDE, text: '活跃路径' },
              { color: OK, text: '跟随' },
            ],
        280,
        46
      );

      // 固定高度的详情区：切换节点或主干都不改变布局
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(620, 22, 444, 190);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(620.75, 22.75, 442.5, 188.5);

      ctx.textAlign = 'left';
      ctx.font = '15px ' + FONT;
      ctx.fillStyle = MUTED;
      ctx.fillText('节点详情', 636, 54);

      ctx.font = '21px ' + FONT;
      ctx.fillStyle = INK;
      ctx.fillText(nameOf(s.nodeId), 636, 94);

      ctx.font = '17px ' + FONT;
      ctx.fillStyle = GUIDE;
      ctx.fillText(detail.shape, 636, 126);

      ctx.font = '15px ' + FONT;
      ctx.fillStyle = MUTED;
      ctx.fillText(tagOf(s.nodeId, s.backbone), 636, 152);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(636, 170);
      ctx.lineTo(1048, 170);
      ctx.stroke();

      ctx.font = '16px ' + FONT;
      ctx.fillStyle = INK;
      ctx.fillText(cnn ? 'CNN 主干 · FiLM 注入' : 'Transformer 主干 · 交叉注意力注入', 636, 196);
    };

    const tick = (ts: number) => {
      const last = lastRef.current;
      lastRef.current = ts;
      if (last !== 0) elapsedRef.current += Math.min(64, ts - last) / 1000;
      render(stateRef.current, elapsedRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
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

  const commit = (back: Backbone, id: NodeId) => {
    stateRef.current.backbone = back;
    stateRef.current.nodeId = id;
    setBackbone(back);
    setNodeId(id);
    setFeedback(backboneText(back) + detailOf(id, back).note);
  };

  const onNodeClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    const hit = NODE_RECTS.find(
      (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
    );
    if (hit) commit(stateRef.current.backbone, hit.id);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onNodeClick}
        style={{ cursor: 'pointer' }}
        aria-label="可点击的主干结构图：观测编码器、条件注入、主干、动作输出"
      />
      <div className="chip-row">
        <button
          className={'chip' + (backbone === 'cnn' ? ' selected' : '')}
          onClick={() => commit('cnn', nodeId)}
        >
          CNN
        </button>
        <button
          className={'chip' + (backbone === 'transformer' ? ' selected' : '')}
          onClick={() => commit('transformer', nodeId)}
        >
          Transformer
        </button>
      </div>
      <div className="chip-row">
        {NODE_RECTS.map((r) => (
          <button
            key={r.id}
            className={'chip' + (nodeId === r.id ? ' selected' : '')}
            onClick={() => commit(backbone, r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          主干 <span className="val">{backbone === 'cnn' ? 'CNN' : 'Transformer'}</span>
        </label>
        <label>
          选中节点 <span className="val">{nameOf(nodeId)}</span>
        </label>
        <label>
          条件注入 <span className="val">{backbone === 'cnn' ? 'FiLM' : '交叉注意力'}</span>
        </label>
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default M71;
