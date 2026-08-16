import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const ANALOGY_W = 244;
const ANALOGY_H = 130;

type LeaderboardRow = {
  rank: number;
  model: string;
  tied?: boolean;
};

const LEADERBOARD: readonly LeaderboardRow[] = [
  { rank: 1, model: 'LCO-Embedding-Omni-7B' },
  { rank: 2, model: 'e5-omni-7B' },
  { rank: 3, model: 'ebind-full', tied: true },
  { rank: 3, model: 'ebind-audio-vision', tied: true },
  { rank: 5, model: 'LCO-Embedding-Omni-3B' },
  { rank: 6, model: 'OmniEmbed-v0.1', tied: true },
  { rank: 6, model: 'pe-av-large', tied: true },
  { rank: 8, model: 'pe-av-base' },
  { rank: 9, model: 'BidirLM-Omni-2.5B-Embedding' },
  { rank: 10, model: 'pe-av-small' },
] as const;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: string,
  stroke: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawAnalogy(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ANALOGY_W, ANALOGY_H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, ANALOGY_W, ANALOGY_H);

  const votes = [
    { label: '任务 A', rank: '#1', y: 25 },
    { label: '任务 B', rank: '#2', y: 54 },
    { label: '任务 C', rank: '#1', y: 83 },
  ];

  votes.forEach(({ label, rank, y }) => {
    roundedRect(ctx, 14, y, 74, 22, 6, '#ffffff', '#d7deea');
    ctx.fillStyle = '#68778f';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 22, y + 11);
    ctx.fillStyle = '#27446e';
    ctx.textAlign = 'right';
    ctx.fillText(rank, 80, y + 11);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#b8c9a7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(91, y + 11);
    ctx.lineTo(144, 65);
    ctx.stroke();
  });

  roundedRect(ctx, 145, 40, 84, 50, 10, '#228d5c', '#228d5c');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '800 10px system-ui, sans-serif';
  ctx.fillText('跨任务汇总', 187, 58);
  ctx.font = '850 18px system-ui, sans-serif';
  ctx.fillText('第 1', 187, 77);
  ctx.textAlign = 'left';
}

const BordaAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, ANALOGY_W, ANALOGY_H);
    } catch {
      return;
    }

    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${ANALOGY_W}px`;

    const draw = () => {
      drawAnalogy(ctx);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={ANALOGY_W}
      height={ANALOGY_H}
      role="img"
      aria-label="三个任务分别给出模型名次，再把这些相对名次汇总成总榜。"
    />
  );
};

const BordaRanking: React.FC = () => (
  <div className="borda-summary">
    <section className="borda-intro" aria-label="Borda 的计算方法与意义">
      <div className="borda-method-grid">
        <div className="borda-method-card">
          <span>计算方法</span>
          <code>Bᵢ = Σₜ (N − rᵢ,ₜ)</code>
          <p>每项任务各排一次名。第 r 名得到 N−r 分，再把 23 项任务的得分相加。总分越高，Borda 名次越靠前。</p>
        </div>
        <div className="borda-method-card borda-meaning-card">
          <span>它的意义</span>
          <p>Accuracy、V-measure、max-AP 与 nDCG@10 的量尺不同，不能直接求平均。Borda 只比较每项任务里的相对名次，因此经常排在前面的模型会进入总榜前列。</p>
        </div>
      </div>

      <p className="borda-note">
        N 表示参与该任务排名的模型数，rᵢ,ₜ 表示模型 i 在任务 t 的名次。Borda 保留名次顺序，但看不出领先多少，所以论文同时报告 Mean。
      </p>
    </section>

    <figure className="borda-chart" aria-labelledby="borda-chart-title">
      <figcaption>
        <span>
          <strong id="borda-chart-title">MVEB Borda 排名 · Top 10</strong>
          <small>23 tasks · Table 3 · 从 16 个完整参评模型中截取</small>
        </span>
        <span className="borda-direction">名次 ↓</span>
      </figcaption>

      <ol className="borda-ranking">
        {LEADERBOARD.map((entry) => (
          <li key={entry.model} className={entry.rank <= 3 ? `is-top is-top-${entry.rank}` : undefined}>
            <span className="borda-rank" aria-label={`第 ${entry.rank} 名${entry.tied ? '，并列' : ''}`}>
              {entry.rank}
            </span>
            <span className="borda-model">{entry.model}</span>
            <span className="borda-rank-label">{entry.tied ? `并列第 ${entry.rank}` : `第 ${entry.rank}`}</span>
          </li>
        ))}
      </ol>
    </figure>
  </div>
);

export const MetricBordaLab: React.FC<WidgetProps> = (props) => {
  if (props.moduleId === 'ana') return <BordaAnalogy {...props} />;
  return <BordaRanking />;
};

export default MetricBordaLab;
