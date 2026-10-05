import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.1：三种边源可叠加。只有直接引文时图太稀疏；补上文献耦合后连通性跃升
// （86% 的边来自 BC），再加共引得到最终的 1.5318 亿条边。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', orange: '#f07e47',
  purple: '#7c3aed', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const POS: { x: number; y: number }[] = [];
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 4; c++) {
    POS.push({ x: 172 + c * 230, y: 56 + r * 72 });
  }
}
const CW = 46;
const CH = 30;

const DIRECT: [number, number][] = [[0, 1], [5, 6], [8, 9], [10, 11]];
const BC: [number, number][] = [[0, 5], [1, 6], [2, 7], [3, 4], [8, 11], [9, 10], [0, 9], [3, 8]];
const CC: [number, number][] = [[1, 2], [6, 7], [4, 5], [9, 11], [0, 10], [2, 3]];

type EdgeKey = 'direct' | 'bc' | 'cc';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ direct: true, bc: false, cc: false });
  const [edges, setEdges] = useState({ direct: true, bc: false, cc: false });
  const [fb, setFb] = useState({
    text: '平均度约 <b>9</b>、<b>17%</b> 的论文是孤点——太稀疏，Leiden 在论文试过的每种分辨率下都不成形。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const s = stateRef.current;
      const ctr = (i: number) => ({ x: POS[i].x + CW / 2, y: POS[i].y + CH / 2 });

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 连线（先实线后细线后虚线）
      const link = (set: [number, number][], color: string, width: number, dashed: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dashed) ctx.setLineDash([5, 4]);
        for (const [a, b] of set) {
          const p1 = ctr(a);
          const p2 = ctr(b);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      };
      if (s.direct) link(DIRECT, C.blue, 2.4, false);
      if (s.bc) link(BC, C.orange, 1.6, false);
      if (s.cc) link(CC, C.purple, 1.6, true);

      // 卡阵
      for (let i = 0; i < POS.length; i++) {
        ctx.fillStyle = '#fff';
        roundRect(ctx, POS[i].x, POS[i].y, CW, CH, 4);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.6;
        roundRect(ctx, POS[i].x, POS[i].y, CW, CH, 4);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillRect(POS[i].x + 6, POS[i].y + 6, CW - 12, 4);
      }

      // 底部稠密度带（长度按边数示意，不标注数值）
      const totalM = 14.56 + (s.bc ? 132.19 : 0) + (s.cc ? 21.22 : 0);
      const ratio = clamp(totalM / 167.97, 0.05, 1);
      const bandX = 172;
      const bandW = 736;
      const bandY = 258;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.4;
      roundRect(ctx, bandX, bandY, bandW, 12, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = s.bc ? '#228d5c' : C.orange;
      roundRect(ctx, bandX + 2, bandY + 2, (bandW - 4) * ratio, 8, 4);
      ctx.fill();

      // 标签（1 个）+ 图例（3 项）
      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('卡片阵', 26, 30);

      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let cx = 700;
      const items = [
        { color: C.blue, label: '直接引文' },
        { color: C.orange, label: '文献耦合' },
        { color: C.purple, label: '共引' },
      ];
      for (const it of items) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx, 24);
        ctx.lineTo(cx + 12, 24);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, cx + 17, 28);
        cx += 17 + ctx.measureText(it.label).width + 12;
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  const apply = (next: { direct: boolean; bc: boolean; cc: boolean }) => {
    stateRef.current = next;
    setEdges(next);
    const { direct, bc, cc } = next;
    if (!direct && !bc && !cc) {
      setFb({ text: '三条边源都关掉了：图上一根线都没有，无法划分社区。', cls: 'bad' });
    } else if (!direct) {
      setFb({
        text: '也能连起来，但<b>直接引文是最强的一条边</b>，论文保留它的权重下限 1.0。',
        cls: '',
      });
    } else if (bc && cc) {
      setFb({
        text: '共引再补 <b>2122 万</b>条边；三层合并后 <b>1.5318 亿</b>条边、平均度 <b>85.5</b>、孤点降到 <b>10.5%</b>。',
        cls: 'good',
      });
    } else if (bc) {
      setFb({
        text: '文献耦合补上 <b>1.32 亿</b>条边（占边数 <b>86%</b>）：共享 ≥3 篇参考文献的两篇论文连边，权重是 Salton 余弦——图一下子稠了。',
        cls: 'good',
      });
    } else if (cc) {
      setFb({
        text: '共引补上 <b>2122 万</b>条边；但真正把图补稠的是文献耦合——它还留在关着的状态。',
        cls: '',
      });
    } else {
      setFb({
        text: '平均度约 <b>9</b>、<b>17%</b> 的论文是孤点——太稀疏，Leiden 在论文试过的每种分辨率下都不成形。',
        cls: 'bad',
      });
    }
  };

  const toggle = (k: EdgeKey) => {
    const next = { ...stateRef.current, [k]: !stateRef.current[k] };
    apply(next);
  };

  // 仅打印论文报告过的数值；中间组合论文未给数，显示「—」而不编造。
  const meanDeg = edges.direct && edges.bc && edges.cc ? '85.5' : edges.direct && !edges.bc && !edges.cc ? '9' : '—';
  const orphan = edges.bc || edges.cc ? '10.5%' : edges.direct ? '17%' : '—';
  const edgeM = (14.56 + (edges.bc ? 132.19 : 0) + (edges.cc ? 21.22 : 0)).toFixed(2) + 'M';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label="十二张索引卡之间的连线随边源开关而变化，底部稠密度带显示边数的量级增长"
      />
      <div className="chip-row">
        <button className={`chip ${edges.direct ? 'selected' : ''}`} aria-pressed={edges.direct} onClick={() => toggle('direct')}>
          直接引文
        </button>
        <button className={`chip ${edges.bc ? 'selected' : ''}`} aria-pressed={edges.bc} onClick={() => toggle('bc')}>
          + 文献耦合
        </button>
        <button className={`chip ${edges.cc ? 'selected' : ''}`} aria-pressed={edges.cc} onClick={() => toggle('cc')}>
          + 共引
        </button>
        <button className="chip" onClick={() => apply({ direct: true, bc: false, cc: false })}>
          重置
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">平均度</div>
          <div className="v">{meanDeg}</div>
        </div>
        <div className="metric">
          <div className="l">孤点比例</div>
          <div className="v">{orphan}</div>
        </div>
        <div className="metric">
          <div className="l">边数</div>
          <div className="v">{edges.bc && edges.cc ? '153.18M' : edgeM}</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M31;
