import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCar, drawFlag, sceneLabel } from './scene-kit';

const W = 560;
const H = 300;

type Metric = 'fid' | 'fvd' | 'rot' | 'trans';

// Verified values from paper Table 2 (RE10K-Long, 100 sequences >150 frames,
// 14B version; all four metrics lower-is-better).
const DATA: Record<Metric, { label: string; values: number[] }> = {
  fid: { label: 'FID', values: [42.68, 64.84, 89.44, 129.46] },
  fvd: { label: 'FVD', values: [100.55, 173.02, 215.96, 387.5] },
  rot: { label: 'Rot 旋转误差', values: [2.8762, 11.981, 16.518, 25.05] },
  trans: { label: 'Trans 平移误差', values: [0.1398, 0.2064, 0.4715, 0.6725] },
};

const METHODS = ['InSpatio-World', 'LingBot-World', 'Infinite-World', 'HY-WorldPlay'];
const LANE_COLORS = [C.blue, '#8b97a8', '#a2adbd', '#b9c2cf'];

// §10 M10.1 — P8 verified result race + metric chips. Progress ∝ best/value so
// the lowest error travels farthest; the table keeps raw values.
export const M10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'fid' as Metric, phase: 0, racing: false, done: false });
  const rafRef = useRef<number | null>(null);
  const startTs = useRef(0);
  const [metric, setMetric] = useState<Metric>('fid');
  const [racing, setRacing] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '先选指标，再开始。注意：这四项都是越低越好。',
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

    const render = (s: { metric: Metric; phase: number; done: boolean }) => {
      clearScene(ctx, W, H);
      const d = DATA[s.metric];
      const best = Math.min(...d.values);
      sceneLabel(ctx, `${d.label} · 误差越低 → 跑得越远`, 330, 26, false, 12);
      sceneLabel(ctx, 'RE10K-Long · 14B 版本', 20, 26, true, 11);
      for (let i = 0; i < 4; i++) {
        const laneY = 62 + i * 56;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(120, laneY + 12);
        ctx.lineTo(520, laneY + 12);
        ctx.stroke();
        drawFlag(ctx, 522, laneY + 12, 0.8);
        sceneLabel(ctx, METHODS[i], 16, laneY + 6, i !== 0, 11);
        const target = best / d.values[i];
        const stagger = 1 - i * 0.06;
        const prog = clamp(s.phase * stagger, 0, 1) * target;
        const x = 130 + prog * 380;
        drawCar(ctx, x, laneY + 10, 0.7, i === 0 ? C.blue : LANE_COLORS[i], 0);
        if (s.phase > 0.05) {
          ctx.fillStyle = i === 0 ? C.text : C.muted;
          ctx.font = '11px "Segoe UI", sans-serif';
          ctx.fillText(String(d.values[i]), x + 24, laneY + 4);
        }
        if (s.done && i === 0) {
          ctx.font = '16px serif';
          ctx.fillText('🏆', 528, laneY - 2);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.strokeRect(126, laneY - 12, 404, 40);
        }
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (s.racing) {
        const el = (t - startTs.current) / 1600;
        s.phase = easeInOutQuad(clamp(el, 0, 1));
        if (el >= 1) {
          s.racing = false;
          s.done = true;
          setRacing(false);
          setDone(true);
          const d = DATA[s.metric];
          const sorted = [...d.values].sort((a, b) => a - b);
          setFeedback({
            text: `${d.label}：InSpatio-World 以 ${sorted[0]} 对第二名 ${sorted[1]} 领先（越低越好）。四项全胜——注意这是 RE10K-Long、14B 版本的协议内比较。`,
            cls: 'good',
          });
        }
      }
      render(s);
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

  const pickMetric = (m: Metric) => {
    const s = stateRef.current;
    s.metric = m;
    s.phase = 0;
    s.done = false;
    s.racing = false;
    setMetric(m);
    setDone(false);
    setRacing(false);
    setFeedback({ text: `已选 ${DATA[m].label}（越低越好）。点「开始对比」。`, cls: '' });
  };

  const go = () => {
    const s = stateRef.current;
    s.phase = 0;
    s.done = false;
    s.racing = true;
    startTs.current = performance.now();
    setRacing(true);
    setDone(false);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(DATA) as Metric[]).map((m) => (
          <button
            key={m}
            className={`chip ${metric === m ? 'selected' : ''}`}
            onClick={() => pickMetric(m)}
          >
            {DATA[m].label}
          </button>
        ))}
        <button className="chip" onClick={go} disabled={racing}>
          {done ? '重新对比' : '开始对比'}
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: 14 }}>
          <thead>
            <tr>
              <th>方法（RE10K-Long，越低越好）</th>
              <th>FID ↓</th>
              <th>FVD ↓</th>
              <th>Rot ↓</th>
              <th>Trans ↓</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HY-WorldPlay</td>
              <td>129.46</td>
              <td>387.50</td>
              <td>25.050</td>
              <td>0.6725</td>
            </tr>
            <tr>
              <td>Infinite-World</td>
              <td>89.44</td>
              <td>215.96</td>
              <td>16.518</td>
              <td>0.4715</td>
            </tr>
            <tr>
              <td>LingBot-World</td>
              <td>64.84</td>
              <td>173.02</td>
              <td>11.981</td>
              <td>0.2064</td>
            </tr>
            <tr>
              <td>
                <b>InSpatio-World（本文，14B）</b>
              </td>
              <td>
                <b>42.68</b>
              </td>
              <td>
                <b>100.55</b>
              </td>
              <td>
                <b>2.8762</b>
              </td>
              <td>
                <b>0.1398</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div style={{ fontSize: 13.5, color: 'var(--muted, #68778f)', lineHeight: 1.8, marginTop: 8 }}>
        其他协议内战绩：WorldScore 基准中，实时/可交互方法里动态总分第一（68.72），相机控制全表最高（81.51）；非实时的
        FantasyWorld-1.0 动态总分 71.39 仍更高。重渲染任务画质与分布指标最佳（OpenVid VBench 0.8507、Blender FID
        44.46/FVD 110.11），但旋转精度 NeoVerse 略优。论文自述局限：自生成区域的细粒度纹理记不牢；动态元素的 360°
        全向漫游仍是开放挑战。
      </div>
    </div>
  );
};

export default M10Race;
