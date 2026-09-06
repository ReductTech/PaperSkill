import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
} from './studio-kit';

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const EMPHASIS = '#d97706';
const AUXILIARY = '#7c3aed';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type EnsemblePolicy = 'control' | 'diversity' | 'quality';

interface Table7Row {
  label: string;
  shortLabel: string;
  color: string;
  modelColors: readonly [string, string, string];
  relationColor: string;
  relationLabel: string;
  policyCue: string;
  emphasizeQuality: boolean;
  score: number;
  scoreText: string;
  cost: number;
  costText: string;
  tokensText: string;
  p50Text: string;
  p95Text: string;
  coverage: string;
  feedback: string;
}

const POLICY_ORDER: readonly EnsemblePolicy[] = ['control', 'diversity', 'quality'];

// One source of truth for both the interactive view and the paper table below.
// Values reproduce Table 7 under its locked DRACO/DuckDuckGo/GLM 5.2 protocol.
const TABLE7: Record<EnsemblePolicy, Table7Row> = {
  control: {
    label: '控制组（Control）',
    shortLabel: 'Control',
    color: CURRENT,
    modelColors: [MUTED, MUTED, MUTED],
    relationColor: MUTED,
    relationLabel: '中性连接：未额外强调互补',
    policyCue: '对照运行点',
    emphasizeQuality: false,
    score: 59.18,
    scoreText: '59.18',
    cost: 0.3249,
    costText: '$0.3249',
    tokensText: '650.4K',
    p50Text: '881.7s',
    p95Text: '3122.6s',
    coverage: '100/100',
    feedback: 'Control 是同协议下的对照运行点；它不是“强者 top-k”的替代名称。',
  },
  diversity: {
    label: '多样性优先（Diversity-heavy）',
    shortLabel: 'Diversity-heavy',
    color: AUXILIARY,
    modelColors: [CURRENT, AUXILIARY, SUCCESS],
    relationColor: AUXILIARY,
    relationLabel: '异色连接：显式鼓励互补',
    policyCue: '互补性权重 α ↑',
    emphasizeQuality: false,
    score: 60.31,
    scoreText: '60.31',
    cost: 0.3172,
    costText: '$0.3172',
    tokensText: '586.6K',
    p50Text: '837.1s',
    p95Text: '2682.6s',
    coverage: '99/100',
    feedback: 'Diversity-heavy 更强调候选互补性；该表分数最高，但覆盖率是 99/100，不能隐藏分母差异。',
  },
  quality: {
    label: '质量优先（Quality-heavy）',
    shortLabel: 'Quality-heavy',
    color: EMPHASIS,
    modelColors: [CURRENT, AUXILIARY, SUCCESS],
    relationColor: MUTED,
    relationLabel: '金色外环：预测质量权重优先',
    policyCue: '预测质量 ↑ · 成本权重 λ ↓',
    emphasizeQuality: true,
    score: 59.93,
    scoreText: '59.93',
    cost: 0.2582,
    costText: '$0.2582',
    tokensText: '721.3K',
    p50Text: '1023.0s',
    p95Text: '2439.0s',
    coverage: '100/100',
    feedback: 'Quality-heavy 更强调预测质量并减轻成本权重；它本次恰好成本最低，但不能改称“成本优先”。',
  },
};

export const Ch5EnsembleSelector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const [policy, setPolicy] = useState<EnsemblePolicy>('control');
  const policyRef = useRef<EnsemblePolicy>('control');

  const choosePolicy = (next: EnsemblePolicy) => {
    policyRef.current = next;
    setPolicy(next);
    requestAnimationFrame(() => drawRef.current?.());
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
      // setupCanvas establishes the logical size; keep the CSS box responsive.
      canvas.style.width = 'min(100%, 560px)';
      canvas.style.height = 'auto';
    } catch {
      return;
    }

    const drawStar = (cx: number, cy: number, radius: number, color: string) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let index = 0; index < 10; index += 1) {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const r = index % 2 === 0 ? radius : radius * 0.42;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawModelChip = (x: number, y: number, color: string, qualityRing: boolean) => {
      const size = 30;
      if (qualityRing) {
        ctx.strokeStyle = EMPHASIS;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 4, y - 4, size + 8, size + 8);
      }
      ctx.fillStyle = `${color}24`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);
      ctx.lineWidth = 1.5;
      [7, 15, 23].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(x - 4, y + offset);
        ctx.lineTo(x, y + offset);
        ctx.moveTo(x + size, y + offset);
        ctx.lineTo(x + size + 4, y + offset);
        ctx.stroke();
      });
      if (qualityRing) drawStar(x + size / 2, y + size / 2, 7, EMPHASIS);
      else {
        ctx.fillStyle = color;
        ctx.fillRect(x + 9, y + 9, 12, 12);
      }
    };

    const render = () => {
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 8, 544, 244);

      ctx.fillStyle = '#f6f8fc';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.fillRect(16, 14, 528, 34);
      ctx.strokeRect(16, 14, 528, 34);

      ctx.fillStyle = CURRENT;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('DRACO · DuckDuckGo · GLM 5.2', 28, 36);
      ctx.textAlign = 'right';
      ctx.fillStyle = TABLE7[policyRef.current].color;
      ctx.fillText('三种策略 · 同屏比较', 532, 36);
      ctx.textAlign = 'left';

      const cardLabels: Record<EnsemblePolicy, string> = {
        control: '对照',
        diversity: '多样',
        quality: '质量',
      };

      POLICY_ORDER.forEach((cardPolicy, cardIndex) => {
        const row = TABLE7[cardPolicy];
        const x = 16 + cardIndex * 176;
        const y = 56;
        const width = 168;
        const height = 188;
        const active = policyRef.current === cardPolicy;

        ctx.fillStyle = active ? `${row.color}12` : 'rgba(255,255,255,.72)';
        ctx.strokeStyle = active ? row.color : BORDER;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = row.color;
        ctx.beginPath();
        ctx.arc(x + 148, y + 18, active ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = active ? row.color : CURRENT;
        ctx.font = '700 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cardLabels[cardPolicy], x + width / 2, y + 25);

        const chipY = y + 48;
        const chipXs = [x + 18, x + 69, x + 120];
        const aggregatorX = x + width / 2;
        const aggregatorY = y + 116;

        chipXs.forEach((chipX, modelIndex) => {
          const centerX = chipX + 15;
          const lineColor = cardPolicy === 'diversity'
            ? row.modelColors[modelIndex]
            : cardPolicy === 'quality'
              ? EMPHASIS
              : MUTED;
          ctx.save();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = cardPolicy === 'control' ? 2 : 3;
          ctx.setLineDash(cardPolicy === 'diversity' ? [5, 4] : []);
          ctx.beginPath();
          ctx.moveTo(centerX, chipY + 34);
          ctx.quadraticCurveTo(centerX, aggregatorY - 12, aggregatorX, aggregatorY - 5);
          ctx.stroke();
          ctx.restore();
        });

        chipXs.forEach((chipX, modelIndex) => {
          drawModelChip(chipX, chipY, row.modelColors[modelIndex], row.emphasizeQuality);
        });

        ctx.fillStyle = '#fff';
        ctx.strokeStyle = row.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(aggregatorX, aggregatorY - 20);
        ctx.lineTo(aggregatorX + 20, aggregatorY);
        ctx.lineTo(aggregatorX, aggregatorY + 20);
        ctx.lineTo(aggregatorX - 20, aggregatorY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = row.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aggregatorX - 8, aggregatorY - 6);
        ctx.lineTo(aggregatorX, aggregatorY + 6);
        ctx.lineTo(aggregatorX + 8, aggregatorY - 6);
        ctx.stroke();

        ctx.strokeStyle = row.color;
        ctx.fillStyle = row.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aggregatorX, aggregatorY + 21);
        ctx.lineTo(aggregatorX, y + 156);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(aggregatorX - 4, y + 151);
        ctx.lineTo(aggregatorX, y + 157);
        ctx.lineTo(aggregatorX + 4, y + 151);
        ctx.closePath();
        ctx.fill();

        ctx.font = '700 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(row.scoreText, aggregatorX, y + 180);
      });
      ctx.textAlign = 'left';

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    drawRef.current = render;
    render();
    const disconnect = observeCanvas(canvas, render, () => {});
    return () => {
      drawRef.current = null;
      disconnect();
    };
  }, []);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    if (y < 56 || y > 244) return;
    const cardIndex = Math.floor((x - 16) / 176);
    if (cardIndex < 0 || cardIndex >= POLICY_ORDER.length) return;
    const cardX = 16 + cardIndex * 176;
    if (x > cardX + 168) return;
    choosePolicy(POLICY_ORDER[cardIndex]);
  };

  const selected = TABLE7[policy];

  return (
    <div>
      <div className="chip-row" role="group" aria-label="Table 7 动态路由策略">
        {POLICY_ORDER.map((itemPolicy) => (
          <button
            key={itemPolicy}
            type="button"
            className={`chip ${policy === itemPolicy ? 'selected' : ''}`}
            aria-pressed={policy === itemPolicy}
            onClick={() => choosePolicy(itemPolicy)}
          >
            {TABLE7[itemPolicy].label}
          </button>
        ))}
      </div>

      <div className="hotspot-info">
        <b>固定实验协议：</b>DRACO、默认 DuckDuckGo，GLM 5.2 固定为聚合器；上方交互与下方表格共用同一组策略与数值。
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        onClick={onCanvasClick}
        style={{ cursor: 'pointer', width: 'min(100%, 560px)', height: 'auto' }}
        aria-label={`三种策略同屏比较。对照组使用中性模型芯片与汇流；多样性优先使用不同颜色的模型芯片与分支；质量优先为模型芯片增加金色质量光环。当前选中 ${selected.label}，分数 ${selected.scoreText}，成本 ${selected.costText}，覆盖率 ${selected.coverage}`}
      />

      <div className="metrics">
        <div className="metric"><div className="l">Table 7 分数</div><div className="v">{selected.scoreText}</div></div>
        <div className="metric"><div className="l">每个 judged task 成本</div><div className="v">{selected.costText}</div></div>
        <div className="metric"><div className="l">覆盖率</div><div className="v">{selected.coverage}</div></div>
      </div>
      <div className="feedback" aria-live="polite">{selected.feedback}</div>

      <h5 id={`${chapterId}-${moduleId}-table-title`} style={{ marginTop: 20 }}>
        论文 Table 7：与上方交互完全相同的三种策略
      </h5>
      <table className="paper" aria-labelledby={`${chapterId}-${moduleId}-table-title`}>
        <thead>
          <tr>
            <th scope="col">路由策略</th>
            <th scope="col">分数 ↑</th>
            <th scope="col">成本（美元）↓</th>
            <th scope="col">Token ↓</th>
            <th scope="col">p50 ↓</th>
            <th scope="col">p95 ↓</th>
            <th scope="col">覆盖率</th>
          </tr>
        </thead>
        <tbody>
          {POLICY_ORDER.map((itemPolicy) => {
            const row = TABLE7[itemPolicy];
            return (
              <tr key={itemPolicy} aria-current={policy === itemPolicy ? 'true' : undefined}>
                <th scope="row">{row.label}</th>
                <td>{row.scoreText}</td>
                <td>{row.costText}</td>
                <td>{row.tokensText}</td>
                <td>{row.p50Text}</td>
                <td>{row.p95Text}</td>
                <td>{row.coverage}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="feedback bad">
        协议锁定：成本、Token 与延迟按被裁判任务平均，覆盖率是“被裁判任务 / 尝试任务”。Diversity-heavy 的 60.31 是三组最高分，但覆盖 99/100；缺失的一项不能擅自补成失败、成功或零成本。
      </div>
      <div className="hotspot-info">
        <b>名称不等于结果排名：</b>Diversity-heavy 表示更强调互补性；Quality-heavy 表示更强调预测质量并减轻成本权重。Quality-heavy 在本表恰好成本最低，但它不是“成本优先”。
      </div>
      <div className="hotspot-info">
        <b>你的判断：</b>这三行只能在锁定协议内比较。若要解释为何某行更好，还需要逐任务候选、错误相关性与聚合成功率；论文没有在 Table 7 中报告这些分解量。
      </div>
      <div className="hotspot-info">
        <b>何时失效：</b>候选共享盲点、聚合器没有可信验证，或总调用与墙钟预算不足时，多模型会退化为更贵的重复生成。并行、提前停止与更严预算只是论文提出的缓解方向，并未由 Table 7 证明已解决延迟。
      </div>
    </div>
  );
};

export default Ch5EnsembleSelector;
