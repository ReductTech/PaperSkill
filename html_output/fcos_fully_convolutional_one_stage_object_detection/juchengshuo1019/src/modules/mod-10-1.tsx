// mod-10-1 (P8): verified result race — FCOS vs RetinaNet on AP and BPR.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import { palette, clearScene } from './carpentry-kit';

const W = 1080, H = 280;
type Metric = 'AP' | 'BPR';
const DATA: Record<Metric, Array<{ label: string; value: number; color: string; note: string }>> = {
  AP: [
    { label: 'FCOS', value: 41.5, color: '#228d5c', note: 'ResNet-101-FPN（论文表 5）' },
    { label: 'RetinaNet', value: 39.1, color: '#c43f52', note: 'ResNet-101-FPN（论文表 5）' },
  ],
  BPR: [
    { label: 'FCOS', value: 98.4, color: '#228d5c', note: '带 FPN（论文表 1）' },
    { label: 'RetinaNet 最优', value: 99.23, color: '#c43f52', note: '全部低质量匹配（论文表 1）' },
    { label: 'RetinaNet 官方实现', value: 90.92, color: '#68778f', note: 'Detectron（论文表 1）' },
  ],
};
const MAXV: Record<Metric, number> = { AP: 45, BPR: 100 };

function drawRace(canvas: HTMLCanvasElement, metric: Metric, prog: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearScene(ctx, W, H);
  const rows = DATA[metric];
  const maxV = MAXV[metric];
  rows.forEach((r, i) => {
    const y = 50 + i * 64;
    ctx.fillStyle = palette.ink;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(r.label, 60, y + 20);
    const bx = 260, bw = 640;
    ctx.fillStyle = palette.techBorder;
    ctx.fillRect(bx, y, bw, 26);
    const w = (r.value / maxV) * bw * easeOutCubic(prog);
    ctx.fillStyle = r.color;
    ctx.fillRect(bx, y, w, 26);
    ctx.fillStyle = palette.ink;
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(r.value + '%', bx + w + 10, y + 20);
    ctx.fillStyle = palette.inkMuted;
    ctx.font = '12px sans-serif';
    ctx.fillText(r.note, 60, y + 44);
  });
  // verified table
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = palette.techBorder;
  ctx.lineWidth = 2;
  const ty = 50 + rows.length * 64 + 10;
  ctx.fillRect(60, ty, 960, 66);
  ctx.strokeRect(60, ty, 960, 66);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '12px sans-serif';
  ctx.fillText(
    metric === 'AP'
      ? '协议：COCO test-dev，单模型单尺度；同等 backbone 对比。最终版 FCOS（ResNeXt-64x4d-101）达 44.7% AP。指标越高越好。'
      : '协议：BPR=至少被一个训练样本覆盖的标注框占比；真实检测器召回远不到 90%，<1% 的差距不影响实战。越高越好。',
    80, ty + 28
  );
  ctx.fillText('数值全部来自论文表 1 / 表 3 / 表 5，按真实比例绘制。', 80, ty + 50);
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod101: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [metric, setMetric] = useState<Metric>('AP');
  const [state, setState] = useState<'idle' | 'racing' | 'done'>('idle');
  const anim = useRef({ start: 0, metric: 'AP' as Metric });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const a = anim.current;
      if (state === 'racing') {
        const prog = Math.min(1, (now - a.start) / 2000);
        drawRace(canvas, a.metric, prog);
        if (prog >= 1) setState('done');
      } else {
        drawRace(canvas, metric, state === 'done' ? 1 : 0);
      }
    };
    raf = requestAnimationFrame(loop);
    const disconnect = observeCanvas(canvas, () => { visible = true; }, () => { visible = false; });
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, [state, metric]);

  const begin = () => {
    anim.current = { start: performance.now(), metric };
    setState('racing');
  };
  const switchMetric = (m: Metric) => {
    setMetric(m);
    setState('idle');
  };

  const tone = state === 'done' ? (metric === 'AP' ? 'good' : 'mid') : 'mid';
  const text =
    state === 'done'
      ? metric === 'AP'
        ? '同 backbone：FCOS 41.5% vs RetinaNet 39.1%，赢 2.4%——赢在同等条件。'
        : 'FCOS 98.40% vs 锚框最优 99.23%：差不到 1%，而真实检测器的召回远不到 90%，不影响实战。'
      : state === 'racing'
        ? '检验中……'
        : '点开始检验，看真实论文数字赛跑。';

  return (
    <div>
      <canvas ref={ref} aria-label="检验赛" />
      <div className="controls" role="group" aria-label="检验指标">
        <button type="button" onClick={begin} disabled={state === 'racing'}>
          {state === 'done' ? '再比一次' : state === 'racing' ? '检验中…' : '开始检验'}
        </button>
        <button type="button" className={`chip${metric === 'AP' ? ' active' : ''}`} onClick={() => switchMetric('AP')}>
          AP
        </button>
        <button type="button" className={`chip${metric === 'BPR' ? ' active' : ''}`} onClick={() => switchMetric('BPR')}>
          BPR
        </button>
      </div>
      <div className={`feedback ${tone}`}>{text}</div>
    </div>
  );
};
