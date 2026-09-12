import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 结果竞赛：按一次按钮，四条赛道以同一基线与同一时间基准推进；
// 指标芯片切换归一化方向，图例随之翻转。
const W = 1080;
const H = 280;

type Metric = 'ate' | 'psnr' | 'fps';

interface Row {
  name: string;
  ate: number | null;
  psnr: number | null;
  fps: number | null;
  color: string;
}

const SERIES: Row[] = [
  { name: '本文方法', ate: 0.098, psnr: 30.721, fps: 7.067, color: '#228d5c' },
  { name: 'OTF-NVS', ate: 0.543, psnr: 24.374, fps: 6.439, color: '#f07e47' },
  { name: 'GigaSLAM', ate: 0.702, psnr: 24.072, fps: 1.073, color: '#76906a' },
  { name: 'S3PO-GS', ate: null, psnr: null, fps: 0.297, color: '#c43f52' },
];

const X0 = 180;
const X1 = 980;
const LANE_TOP = 48;
const LANE_GAP = 54;
const BAR_H = 22;

const rawOf = (r: Row, m: Metric): number | null => (m === 'ate' ? r.ate : m === 'psnr' ? r.psnr : r.fps);

const normOf = (v: number | null, m: Metric): number => {
  if (v === null) return 0;
  if (m === 'ate') return clamp(1 - v / 0.8, 0, 1);
  if (m === 'psnr') return clamp(v / 32, 0, 1);
  return clamp(v / 7.5, 0, 1);
};

const feedbackFor = (m: Metric, running: boolean, done: boolean) => {
  if (running) return { text: '四条赛道共用同一条基线与同一个时间基准。', cls: '' as const };
  if (!done) return { text: '按开始对比。所有数值来自论文同一套评测协议。', cls: '' as const };
  if (m === 'ate')
    return {
      text: 'ScanNetV2 上本方法 ATE 0.098 m，低于 GigaSLAM 的 0.702 m；ATE 越低越好。',
      cls: 'good' as const,
    };
  if (m === 'psnr')
    return {
      text: '同一场景 PSNR 30.721、SSIM 0.997、LPIPS 0.121，方向分别是越高越好、越高越好、越低越好。',
      cls: 'good' as const,
    };
  return {
    text: '本方法 7.067 FPS，高于 OTF-NVS 的 6.439；注意 FPS 与所选关键帧密度相关，不同数据集之间不宜直接横向比较。',
    cls: 'good' as const,
  };
};

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ running: false, prog: 0, start: 0, metric: 'ate' as Metric });
  const normRef = useRef<number[]>(SERIES.map(() => 0));
  const [metric, setMetric] = useState<Metric>('ate');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState(feedbackFor('ate', false, false));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const clearScene = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    };

    const drawTarget = () => {
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X1, 34);
      ctx.lineTo(X1, 242);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.moveTo(X1, 34);
      ctx.lineTo(X1 + 14, 40);
      ctx.lineTo(X1, 46);
      ctx.closePath();
      ctx.fill();
    };

    const drawLegend = (higherBetter: boolean) => {
      const y = 264;
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, y);
      ctx.lineTo(X0 + 26, y);
      ctx.stroke();
      const tip = higherBetter ? X0 + 26 : X0;
      const dir = higherBetter ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(tip, y);
      ctx.lineTo(tip - dir * 6, y - 4);
      ctx.lineTo(tip - dir * 6, y + 4);
      ctx.closePath();
      ctx.fillStyle = '#68778f';
      ctx.fill();
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(higherBetter ? '越高越好' : '越低越好', X0 + 36, y + 5);
    };

    const render = () => {
      const s = stateRef.current;
      const m = s.metric;
      const higherBetter = m !== 'ate';

      clearScene();
      drawTarget();

      ctx.font = '15px "Segoe UI", sans-serif';
      for (let i = 0; i < SERIES.length; i++) {
        const row = SERIES[i];
        const y = LANE_TOP + i * LANE_GAP;
        const v = rawOf(row, m);
        const tn = normOf(v, m);
        const nd = normRef.current;
        nd[i] += (tn - nd[i]) * 0.16;
        if (Math.abs(tn - nd[i]) < 0.002) nd[i] = tn;
        const w = nd[i] * s.prog * (X1 - X0);

        ctx.fillStyle = '#21324a';
        ctx.fillText(row.name, 24, y + 16);

        ctx.strokeStyle = '#68778f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(X0, y - 3);
        ctx.lineTo(X0, y + BAR_H + 3);
        ctx.stroke();

        ctx.fillStyle = row.color;
        if (w > 0.5) ctx.fillRect(X0, y, w, BAR_H);

        if (v === null) {
          ctx.fillStyle = '#c43f52';
          ctx.fillText('失败', X0 + 10, y + 16);
        } else {
          ctx.fillStyle = '#21324a';
          ctx.fillText((v * s.prog).toFixed(3), X0 + w + 10, y + 16);
        }
      }

      drawLegend(higherBetter);
    };

    const tick = (now: number) => {
      const s = stateRef.current;
      if (s.running) {
        const p = clamp((now - s.start) / 1600, 0, 1);
        s.prog = easeOutCubic(p);
        if (p >= 1) {
          s.running = false;
          s.prog = 1;
          setRunning(false);
          setDone(true);
          setFeedback(feedbackFor(s.metric, false, true));
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const onStart = () => {
    if (running) return;
    const s = stateRef.current;
    normRef.current = SERIES.map((r) => normOf(rawOf(r, s.metric), s.metric));
    s.running = true;
    s.prog = 0;
    s.start = performance.now();
    setRunning(true);
    setDone(false);
    setFeedback(feedbackFor(s.metric, true, false));
  };

  const onMetric = (m: Metric) => {
    stateRef.current.metric = m;
    setMetric(m);
    if (running) setFeedback(feedbackFor(m, true, false));
    else setFeedback(feedbackFor(m, false, done));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <button className="chip" disabled={running} onClick={onStart}>
          开始对比
        </button>
      </div>
      <div className="chips">
        <button className={metric === 'ate' ? 'chip is-active' : 'chip'} onClick={() => onMetric('ate')}>
          跟踪精度 ATE
        </button>
        <button className={metric === 'psnr' ? 'chip is-active' : 'chip'} onClick={() => onMetric('psnr')}>
          渲染质量 PSNR
        </button>
        <button className={metric === 'fps' ? 'chip is-active' : 'chip'} onClick={() => onMetric('fps')}>
          实时帧率 FPS
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#21324a', marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>
              ScanNetV2 scene0004
            </th>
            <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>ATE (m)</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>PSNR</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>SSIM</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>LPIPS</th>
            <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid #d7deea' }}>FPS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '4px 8px', color: '#228d5c' }}>本文方法</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.098</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>30.721</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.997</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.121</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>7.067</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px', color: '#f07e47' }}>OTF-NVS</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.543</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>24.374</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>6.439</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px', color: '#76906a' }}>GigaSLAM</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.702</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>24.072</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>1.073</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px', color: '#c43f52' }}>S3PO-GS</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>失败</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>失败</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>—</td>
            <td style={{ textAlign: 'right', padding: '4px 8px' }}>0.297</td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 12, color: '#68778f', marginTop: 6 }}>
        协议：ATE／PSNR／SSIM／LPIPS 取自 ScanNetV2 的 scene0004 单场景，每 10 帧取测试帧、输出上采样到原始分辨率；FPS 为 ScanNetV2 整个数据集的平均值。前提条件：本方法与 OTF-NVS 仅输入图像、自行预测相机内参，S3PO-GS 与 GigaSLAM 使用论文提供的真值内参。ATE 单位米、越低越好，PSNR／SSIM 越高越好，LPIPS 越低越好。
      </div>
    </div>
  );
};

export default Ch10Race;
