import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

const stages = [
  { short: '① 密度', symbol: 'ρᵢ', latex: '\\rho_i = \\sum_j m_j W(\\mathbf{p}_i^\\ast - \\mathbf{p}_j^\\ast, h)', color: WATER.mid, feedback: '在预测位置 p* 的支持半径 h 内，把邻居的核贡献累加成局部密度。' },
  { short: '② 约束', symbol: 'Cᵢ', latex: 'C_i(\\mathbf{p}^\\ast) = \\frac{\\rho_i}{\\rho_0} - 1', color: WATER.bad, feedback: '与静止密度比较：Cᵢ > 0 表示过密，Cᵢ = 0 是目标。' },
  {
    short: '③ 乘子',
    symbol: 'λᵢ',
    latex: '\\displaystyle C_i(\\mathbf{p}^\\ast + \\Delta\\mathbf{p}) = 0 \\quad\\Longrightarrow\\quad \\Delta\\mathbf{p} \\approx \\nabla C_i(\\mathbf{p}^\\ast)\\lambda_i \\quad\\Longrightarrow\\quad \\lambda_i = -\\frac{C_i(\\mathbf{p}^\\ast)}{\\sum_k \\lVert \\nabla_{\\mathbf{p}_k} C_i \\rVert^2 + \\varepsilon}',
    color: WATER.aux,
    feedback: '设定投影目标 → 确定梯度修正方向 → 一阶线性化得到 λ。',
  },
  { short: '④ 位移', symbol: 'Δpᵢ', latex: '\\Delta \\mathbf{p}_i = \\frac{1}{\\rho_0} \\sum_j (\\lambda_i + \\lambda_j + s_{\\mathrm{corr}})\\nabla W_{ij}', color: WATER.good, feedback: '汇总自身与邻居的约束贡献，得到本轮位置修正。' },
];

const lambdaFormulas = [
  'C_i(\\mathbf{p}^\\ast + \\Delta\\mathbf{p}) = 0',
  '\\Delta\\mathbf{p} \\approx \\nabla C_i(\\mathbf{p}^\\ast)\\lambda_i',
  '\\lambda_i = -\\frac{C_i(\\mathbf{p}^\\ast)}{\\sum_k \\lVert \\nabla_{\\mathbf{p}_k} C_i \\rVert^2 + \\varepsilon}',
];

const neighbors = [[118, 88], [178, 80], [235, 100], [105, 144], [168, 144], [229, 156], [125, 202], [188, 204], [253, 192]];

export const ConstraintStory: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 700, 285);
    canvas.style.width = '100%';
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, 700, 285);
    ctx.fillStyle = WATER.page;
    ctx.fillRect(0, 0, 700, 285);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = WATER.line;
    ctx.fillRect(24, 32, 330, 224);
    ctx.strokeRect(24, 32, 330, 224);
    const center = { x: 168, y: 144 };
    ctx.strokeStyle = stages[stage].color;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    neighbors.forEach(([x, y], index) => {
      if (stage === 0) {
        ctx.strokeStyle = 'rgba(18,150,212,.35)';
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      drawWaterParticle(ctx, x, y, index === 4 ? 12 : 9, index === 4 ? stages[stage].color : WATER.mid);
      if (stage === 3 && index !== 4) drawArrow(ctx, { x, y }, { x: x + (x < center.x ? -12 : 12), y: y + (y < center.y ? -9 : 9) }, WATER.good, 2);
    });
    ctx.fillStyle = WATER.ink;
    ctx.font = '700 15px Segoe UI';
    ctx.fillText('支持域 h', 54, 54);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = stages[stage].color;
    ctx.lineWidth = 3;
    ctx.fillRect(386, 54, 280, 128);
    ctx.strokeRect(386, 54, 280, 128);
    ctx.fillStyle = stages[stage].color;
    ctx.font = '800 44px Segoe UI';
    ctx.fillText(stages[stage].symbol, 408, 112);
    ctx.fillStyle = WATER.ink;
    ctx.font = '700 18px Segoe UI';
    ctx.fillText(['邻居贡献求和', '得到密度误差', '决定修正尺度', '生成位置移动'][stage], 408, 154);
    ctx.fillStyle = '#eef5fc';
    ctx.fillRect(386, 202, 280, 42);
    ctx.fillStyle = WATER.muted;
    ctx.font = '14px Segoe UI';
    ctx.fillText(['ρᵢ / ρ₀ = 1.18', 'Cᵢ = +0.18', 'λᵢ = 归一化强度', '下一轮重新计算'][stage], 408, 228);
    canvas.classList.add('is-ready');
  }, [stage]);

  return (
    <div>
      <div className="talk-equation" style={{ borderColor: WATER.aux }}>
        <strong>先认识符号：</strong> p* 预测位置　→　ρᵢ 局部密度　→　Cᵢ 密度误差　→　λᵢ 修正强度　→　Δpᵢ 位置修正
      </div>
      <div className="talk-formula-steps constraint-formula-steps" role="group" aria-label="密度约束公式链">
        {stages.map((item, index) => (
          <button key={item.short} type="button" className={stage === index ? 'active' : ''} onClick={() => setStage(index)}>
            <span>{item.short}</span>
            <strong style={{ color: item.color }}>{item.symbol}</strong>
          </button>
        ))}
      </div>
      <div className={`talk-equation constraint-equation${stage === 2 ? ' lambda-equation-row' : ''}`} style={{ borderColor: stages[stage].color }}>
        {stage === 2 ? lambdaFormulas.map((formula, index) => (
          <React.Fragment key={formula}>
            <span
              className="lambda-equation-item"
              dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: true, throwOnError: false, strict: 'ignore' }) }}
            />
            {index < lambdaFormulas.length - 1 ? <span className="lambda-equation-arrow">⟹</span> : null}
          </React.Fragment>
        )) : (
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString(stages[stage].latex, { displayMode: true, throwOnError: false, strict: 'ignore' }) }} />
        )}
      </div>
      <div className="constraint-story-canvas">
        <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}，当前公式阶段 ${stages[stage].short}`} />
      </div>
      <p className="feedback good" aria-live="polite">{stages[stage].feedback}</p>
    </div>
  );
};
