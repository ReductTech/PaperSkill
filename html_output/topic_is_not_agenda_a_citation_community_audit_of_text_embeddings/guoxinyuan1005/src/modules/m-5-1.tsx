import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1：控制变量的四个格子。
// 「候选池」（BM25 词法 / LLM 扩展 Boolean）与「引文重排」（关 / 开）是两个
// 互相独立的开关；切换任意一个都不会带动另一个。论文报告了其中三格：
// BM25 39.3%、BM25+cite 59.6%、Graph（Boolean+cite）57.7%；「Boolean 不重排」
// 没有报告（Graph 的定义本身就含重排），格子里如实标成「未报告」。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', red: '#c43f52',
  green: '#228d5c', orange: '#f07e47', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

// 十张候选卡的内部引用数（仅示意相对高低，不标注数值）
const COUNT = [5, 9, 3, 12, 6, 8, 4, 10, 7, 2];
const ORDER = COUNT.map((_, i) => i).sort((a, b) => COUNT[b] - COUNT[a]);
const rank = (i: number) => ORDER.indexOf(i);

type Pool = 'bm25' | 'bool';

function scoreOf(pool: Pool, rerank: boolean): number | null {
  if (pool === 'bm25') return rerank ? 59.6 : 39.3;
  return rerank ? 57.7 : null;
}

function fbOf(pool: Pool, rerank: boolean): { text: string; cls: string } {
  if (pool === 'bm25' && !rerank) {
    return {
      text: '只按词法排序：top-1 议程命中 <b>39.3%</b>——和两个较弱的稠密模型（39.6%、39.7%）几乎一样，稀疏检索并没有更好。',
      cls: 'bad',
    };
  }
  if (pool === 'bm25' && rerank) {
    return {
      text: '同一批 BM25 候选，只按结果集<b>内部引用数</b>重排：<b>59.6%</b>，比 BM25 单独高约 <b>20</b> 个百分点。',
      cls: 'good',
    };
  }
  if (pool === 'bool' && rerank) {
    return {
      text: '换成 LLM 扩展 Boolean 候选 + 同一步重排：<b>57.7%</b>，与 BM25+cite 只差 2 个百分点——<b>候选池换了，增益没动</b>，说明它来自重排那一步。',
      cls: 'good',
    };
  }
  return {
    text: '这一格论文没有报告：Graph 的定义本身就是「Boolean 候选 + 内部引用数重排」，没有不重排的版本。<b>两个开关独立切换</b>才能看清增益归谁——换池子几乎不动，开重排才抬升。',
    cls: '',
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ pool: Pool; rerank: boolean }>({ pool: 'bm25', rerank: false });
  const [pool, setPool] = useState<Pool>('bm25');
  const [rerank, setRerank] = useState(false);
  const [fb, setFb] = useState(fbOf('bm25', false));

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
    const t0 = performance.now();

    const render = (now: number) => {
      const s = stateRef.current;
      const score = scoreOf(s.pool, s.rerank);
      const empty = score === null;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      const pulse = 0.5 + 0.5 * Math.sin((now - t0) / 420);

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('候选池（10 篇）', 64, 30);

      // 候选卡片：打开重排后按内部引用数归位；该组合未报告时整体淡化
      if (empty) ctx.globalAlpha = 0.45;
      for (let i = 0; i < 10; i++) {
        const slot = s.rerank ? rank(i) : i;
        const col = Math.floor(slot / 5);
        const row = slot % 5;
        const x = 64 + col * 180;
        const y = 52 + row * 40;
        const top = s.rerank && slot === 0;
        ctx.fillStyle = '#fff';
        roundRect(ctx, x, y, 150, 30, 4);
        ctx.fill();
        ctx.strokeStyle = top ? C.green : C.border;
        ctx.lineWidth = top ? 2.4 + pulse * 0.6 : 1.5;
        roundRect(ctx, x, y, 150, 30, 4);
        ctx.stroke();
        ctx.fillStyle = top ? C.green : C.orange;
        ctx.fillRect(x + 10, y + 13, (COUNT[i] / 12) * 106, 5);
        if (top) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(x + 130, y + 19);
          ctx.lineTo(x + 135, y + 24);
          ctx.lineTo(x + 143, y + 12);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 四个格子：两行（候选池）× 两列（重排）
      const tx = 600;
      const ty = 44;
      const headH = 32;
      const rowH = 66;
      const labW = 120;
      const colW = 170;

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('top-1 议程命中率 (%)', tx, 30);

      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      ctx.fillText('重排关', tx + labW + colW / 2, ty + 21);
      ctx.fillText('重排开', tx + labW + colW * 1.5, ty + 21);

      const rows: { label: string; pool: Pool }[] = [
        { label: 'BM25 词法', pool: 'bm25' },
        { label: 'LLM Boolean', pool: 'bool' },
      ];
      rows.forEach((row, ri) => {
        const ry = ty + headH + ri * rowH;
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, tx, ry + rowH / 2 + 4);
        [false, true].forEach((rr, ci) => {
          const cxx = tx + labW + ci * colW;
          const val = scoreOf(row.pool, rr);
          const active = row.pool === s.pool && rr === s.rerank;
          ctx.fillStyle = active ? 'rgba(39,68,110,0.07)' : '#fff';
          roundRect(ctx, cxx + 4, ry + 4, colW - 8, rowH - 8, 6);
          ctx.fill();
          ctx.strokeStyle = active ? C.blue : C.border;
          ctx.lineWidth = active ? 2.4 : 1.2;
          if (val === null) ctx.setLineDash([5, 4]);
          roundRect(ctx, cxx + 4, ry + 4, colW - 8, rowH - 8, 6);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.textAlign = 'center';
          if (val === null) {
            ctx.fillStyle = C.muted;
            ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText('未报告', cxx + colW / 2, ry + rowH / 2 + 4);
          } else {
            ctx.fillStyle = rr ? C.green : C.red;
            ctx.font = '700 26px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillText(val.toFixed(1), cxx + colW / 2, ry + rowH / 2 + 1);
            ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = C.muted;
            ctx.fillText('%', cxx + colW / 2, ry + rowH / 2 + 19);
          }
          ctx.textAlign = 'left';
        });
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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

  const update = (nextPool: Pool, nextRerank: boolean) => {
    stateRef.current = { pool: nextPool, rerank: nextRerank };
    setPool(nextPool);
    setRerank(nextRerank);
    setFb(fbOf(nextPool, nextRerank));
  };

  const cur = scoreOf(pool, rerank);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`候选池 ${pool === 'bm25' ? 'BM25 词法' : 'LLM 扩展 Boolean'} × 引文重排${rerank ? '开' : '关'}：top-1 议程命中 ${cur === null ? '论文未报告此组合' : cur.toFixed(1) + '%'}`}
      />
      <div className="chip-row">
        <button className={`chip ${pool === 'bm25' ? 'selected' : ''}`} aria-pressed={pool === 'bm25'} onClick={() => update('bm25', rerank)}>
          BM25 词法
        </button>
        <button className={`chip ${pool === 'bool' ? 'selected' : ''}`} aria-pressed={pool === 'bool'} onClick={() => update('bool', rerank)}>
          LLM 扩展 Boolean
        </button>
      </div>
      <div className="chip-row">
        <button className={`chip ${!rerank ? 'selected' : ''}`} aria-pressed={!rerank} onClick={() => update(pool, false)}>
          引文重排：关
        </button>
        <button className={`chip ${rerank ? 'selected' : ''}`} aria-pressed={rerank} onClick={() => update(pool, true)}>
          引文重排：开
        </button>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M51;
