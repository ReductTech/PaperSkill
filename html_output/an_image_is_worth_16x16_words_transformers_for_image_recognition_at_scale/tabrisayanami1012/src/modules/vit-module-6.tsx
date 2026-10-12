import React, { useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, Feedback, palette, roundRect, useDrawing } from './vit-kit';

type PoolMode = 'cls' | 'mean';
const STAGES = ['输入汇总位置', '得到整图表示', '线性类别分数', '指数归一化概率'];
export const CLASSES = ['房屋', '树木', '船只'];
export const REPRESENTATION = [1, -1];
export const CLASS_WEIGHTS = [[1, 0, -1], [0, 1, 0]];
export const BIAS = [0, 0, 0];

export function classSoftmax(logits: number[]) {
  const exponents = logits.map((value) => Math.exp(value - Math.max(...logits)));
  const denominator = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / denominator);
}

export function computeClassifierExample() {
  const logits = CLASSES.map((_, j) => REPRESENTATION.reduce((sum, value, i) => sum + value * CLASS_WEIGHTS[i][j], BIAS[j]));
  return { representation: REPRESENTATION, weights: CLASS_WEIGHTS, bias: BIAS, logits, probabilities: classSoftmax(logits) };
}

export function Widget6() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [poolMode, setPoolMode] = useState<PoolMode>('cls');
  const { logits, probabilities } = computeClassifierExample();
  const setMode = (mode: PoolMode) => { setPoolMode(mode); setStage(0); };
  const stageFeedback = [
    poolMode === 'cls'
      ? 'CLS 是一个可学习的初始向量，不是“房屋”这类正确标签，也不是把所有图块文字拼成一句话。它和图块标记一起进入编码器。'
      : '平均池化这条路径不使用CLS；编码器只处理图块标记，再沿标记维汇总。它不是把原始像素先平均，也不是给注意力头取平均。',
    poolMode === 'cls'
      ? '经过多层交流，取最终LN之后的CLS作为整图表示。现在给定教学向量 y=[1, −1]，只是为了手算后面的分类头，不是实际图像推理结果。'
      : '这条路径将编码器输出的图块表示沿标记维平均，形成整图表示。为只比较读出步骤，本页仍给定 y=[1, −1]；这不表示真实CLS与平均池化会产生同一向量。',
    '线性头计算 a=yW+b=[1, −1, −1]。三个数按顺序对应房屋、树木、船只；它们是未归一化分数，可以是负数，也不是相加为1的概率。',
    `对三个类别分数做指数归一化，得到房屋${(probabilities[0] * 100).toFixed(2)}%、树木${(probabilities[1] * 100).toFixed(2)}%、船只${(probabilities[2] * 100).toFixed(2)}%。数值和为100%，但这是教学向量的算术结果，不是经校准的真实可靠性；向前计算不会更新参数。`,
  ];

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    const active = (index: number) => stage === index ? palette.orange : stage > index ? palette.green : palette.border;
    roundRect(ctx, 25, 65, 250, 155, 10, '#ffffff', active(0));
    roundRect(ctx, 310, 80, 190, 130, 10, '#ffffff', active(1));
    roundRect(ctx, 540, 92, 150, 104, 10, '#ffffff', active(2));
    [0, 1, 2].forEach((i) => roundRect(ctx, 765, 74 + i * 56, 240, 29, 8, '#e6ede0', palette.border));
    const ys = poolMode === 'cls' ? [90, 125, 160, 195] : [102, 143, 184];
    ys.forEach((y, i) => {
      const clsToken = poolMode === 'cls' && i === 0;
      roundRect(ctx, 65, y - 10, 62, 20, clsToken ? 10 : 3, clsToken ? palette.purple : palette.green);
      const linkColor = stage >= 1 ? palette.blue : palette.border;
      arrow(ctx, 141, y, 370, 144, linkColor);
    });
    arrow(ctx, 500, 144, 540, 144, stage >= 2 ? palette.blue : palette.border);
    [0, 1, 2].forEach((i) => arrow(ctx, 690, 144, 751, 88 + i * 56, stage >= 3 ? palette.blue : palette.border));
    if (poolMode === 'cls') {
      roundRect(ctx, 374, 116, 62, 56, 15, palette.purple, active(1));
    } else {
      ctx.strokeStyle = active(1); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(405, 144, 30, 0, Math.PI * 2); ctx.stroke();
      [0, 1, 2].forEach((i) => roundRect(ctx, 386, 126 + i * 15, 38, 8, 2, palette.green));
    }
    // A small matrix stands for the fixed classifier; it is not an extra encoder layer.
    [0, 1].forEach((row) => [0, 1, 2].forEach((col) => roundRect(ctx, 566 + col * 32, 117 + row * 28, 24, 20, 3, stage >= 2 ? palette.blue : palette.border)));
    if (stage === 3) probabilities.forEach((value, i) => roundRect(ctx, 765, 74 + i * 56, 240 * value, 29, 8, palette.green));
    drawLabel(ctx, '汇总', 379, 52, palette.blue);
    drawLabel(ctx, '分类', 589, 52, palette.blue);
  });

  return (
    <div onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <div className="chip-row" role="group" aria-label="选择图像表示的汇总路径">
        <button type="button" className={`chip${poolMode === 'cls' ? ' selected' : ''}`} aria-pressed={poolMode === 'cls'} onClick={() => setMode('cls')}>分类标记</button>
        <button type="button" className={`chip${poolMode === 'mean' ? ' selected' : ''}`} aria-pressed={poolMode === 'mean'} onClick={() => setMode('mean')}>平均池化</button>
      </div>
      <canvas ref={canvasRef} width={1080} height={280} role="img" style={{ width: '100%', height: 'auto' }} aria-label={`${poolMode === 'cls' ? '专用CLS与图块交流后形成图像表示' : '不含CLS，将编码器图块输出平均得到图像表示'}，当前${STAGES[stage]}；三条统一0至1比例轨道对应房屋、树木、船只`} />
      <div className="step-ctrl">
        <button type="button" className="chip" disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <span className="step-label">第 <b>{stage + 1}</b>/4 步：{STAGES[stage]}</span>
        <button type="button" className="chip" disabled={stage === 3} onClick={() => setStage((value) => Math.min(3, value + 1))}>下一步</button>
        <button type="button" className="chip" onClick={() => { setPoolMode('cls'); setStage(0); }}>重置读出</button>
      </div>
      <div className="step-desc">
        {stage >= 1 ? '给定教学表示 y=[1, −1]；D=2，类别数 K_cls=3。' : '先选择汇总路径，再逐步揭示计算；箭头概括多层交流后的读出，不是说CLS一开始就知道整图内容。'}
        {stage >= 2 && <div>W=[[1, 0, −1], [0, 1, 0]]，b=[0, 0, 0]；W每一列对应一个类别。</div>}
      </div>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }} role="region" aria-label="教学分类头结果，随步骤揭示" tabIndex={0}>
        <table className="paper" style={{ minWidth: 340 }}>
          <thead><tr><th scope="col">类别</th><th scope="col">未归一化分数 a</th><th scope="col">概率 p</th></tr></thead>
          <tbody>{CLASSES.map((name, i) => <tr key={name}><th scope="row">{name}</th><td>{stage >= 2 ? logits[i].toFixed(1) : '尚未计算'}</td><td>{stage === 3 ? `${(probabilities[i] * 100).toFixed(2)}%` : '尚未归一化'}</td></tr>)}</tbody>
          {stage === 3 && <tfoot><tr><th scope="row">概率和</th><td>按类别维归一</td><td>{probabilities.reduce((sum, value) => sum + value, 0).toFixed(4)}</td></tr></tfoot>}
        </table>
      </div>
      <Feedback>
        <div>{stageFeedback[stage]}</div>
        {poolMode === 'mean' && <div>论文附录D.3显示，合适地调整学习率后，平均池化也能有相近表现；不能只凭一次不匹配的超参数实验说CLS必然更好。Figure9的协议是ImageNet每类5样本线性评估，不代表所有任务都等效。</div>}
      </Feedback>
      <div className="step-desc">这里演示迁移时的线性分类头。原论文预训练头为含tanh的两层MLP；迁移训练开始时替换成零初始化的线性头，再继续学习。本页W只是给定的手算数值，不把两种阶段画成同一训练配置。两种汇总路径共用给定y仅为解释分类计算，不用于比较性能。</div>
    </div>
  );
}
