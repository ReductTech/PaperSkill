import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import {
  CanvasStage, ChipRow, StepControls, COLORS, W, H,
  studioBase, label, drawCamera, drawFilter, drawFrame, drawArrow, drawBar, drawLayers, drawAnalogy, roundedRect,
} from './c1-camera-kit';

const Analogy = ({ chapter }: { chapter: number }) => (
  <CanvasStage labelText={`第 ${chapter} 章相机滤镜类比动画`} animate draw={(ctx, _w, _h, phase) => drawAnalogy(ctx, chapter, phase)} />
);

export const C5Analogy: React.FC<WidgetProps> = () => <Analogy chapter={5} />;
export const C6Analogy: React.FC<WidgetProps> = () => <Analogy chapter={6} />;
export const C7Analogy: React.FC<WidgetProps> = () => <Analogy chapter={7} />;

export const C5IdentityInit: React.FC<WidgetProps> = () => {
  const [logSigma, setLogSigma] = useState(-5);
  const sigma = Math.pow(10, logSigma);
  const status = logSigma < -2.15 ? 'stable' : logSigma <= -1.85 ? 'edge' : 'risk';
  const feedback = status === 'stable'
    ? '论文在 MNLI 与 CoLA 上观察到该范围内较稳健。'
    : status === 'edge'
      ? '接近论文报告的稳定边界，仍需按任务验证。'
      : '初始化过大偏离近恒等状态，CoLA 的退化更明显。';
  return (
    <div>
      <CanvasStage labelText="初始化尺度对近恒等状态的影响" draw={(ctx) => {
        studioBase(ctx, W, H);
        drawCamera(ctx, 85, 94, 0.9);
        drawFilter(ctx, 300, 92, 54, status === 'risk' ? COLORS.red : COLORS.green, 0.2 + ((logSigma + 7) / 7) * 0.78);
        drawFrame(ctx, 440, 88, COLORS.purple, status === 'stable' ? 0.95 : status === 'edge' ? 0.75 : 0.35);
        drawArrow(ctx, 220, 135, 285, 135, COLORS.line);
        drawArrow(ctx, 365, 135, 425, 135, COLORS.line);
        label(ctx, '论文趋势示意', 820, 42, COLORS.muted, 14, 'center');
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(650, 196); ctx.lineTo(1000, 196); ctx.lineTo(1000, 70); ctx.stroke();
        ctx.strokeStyle = COLORS.green; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(660, 92); ctx.lineTo(895, 95); ctx.stroke();
        ctx.strokeStyle = COLORS.red; ctx.beginPath(); ctx.moveTo(895, 95); ctx.quadraticCurveTo(950, 118, 995, 182); ctx.stroke();
        const knobX = 660 + ((logSigma + 7) / 7) * 335;
        ctx.fillStyle = COLORS.orange; ctx.beginPath(); ctx.arc(knobX, status === 'risk' ? 142 : 94, 10, 0, Math.PI * 2); ctx.fill();
        label(ctx, '10⁻⁷', 660, 218, COLORS.muted, 13, 'center');
        label(ctx, '10⁻²', 895, 218, COLORS.muted, 13, 'center');
        label(ctx, '10⁰', 995, 218, COLORS.muted, 13, 'center');
      }} />
      <div className="ctrl">
        <label>log₁₀ σ <span className="val">{logSigma.toFixed(2)}</span></label>
        <input aria-label="初始化尺度对数" type="range" min={-7} max={0} step={0.25} value={logSigma} onChange={(e) => setLogSigma(Number(e.target.value))} />
        <span className="val">σ={sigma.toExponential(1)}</span>
      </div>
      <div className={`feedback ${status === 'risk' ? 'bad' : status === 'stable' ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

type Task = 'sentiment' | 'pair' | 'qa';
export const C6TaskSwitch: React.FC<WidgetProps> = () => {
  const [task, setTask] = useState<Task>('sentiment');
  const taskInfo: Record<Task, { name: string; color: string }> = {
    sentiment: { name: '情感', color: COLORS.green },
    pair: { name: '句对', color: COLORS.orange },
    qa: { name: '问答', color: COLORS.purple },
  };
  const current = taskInfo[task];
  return (
    <div>
      <CanvasStage labelText="在任务适配器套件间切换" draw={(ctx) => {
        studioBase(ctx, W, H);
        drawCamera(ctx, 90, 90, 1);
        const cards: Array<[Task, number]> = [['sentiment', 350], ['pair', 440], ['qa', 530]];
        cards.forEach(([id, x]) => drawFilter(ctx, x, id === task ? 78 : 112, 44, taskInfo[id].color, id === task ? 1 : 0.42));
        drawArrow(ctx, 600, 130, 690, 130, current.color);
        drawFrame(ctx, 720, 84, current.color, 0.92);
        label(ctx, `${current.name}任务套件`, 783, 205, current.color, 16, 'center');
        const rows = ['w：共享冻结', 'adapter vₜ：已加载', 'LayerNormₜ：已加载', 'headₜ：已加载'];
        rows.forEach((row, i) => {
          roundedRect(ctx, 875, 55 + i * 45, 170, 34, 7, i === 0 ? COLORS.paleBlue : COLORS.paleGreen, i === 0 ? COLORS.blue : COLORS.green);
          label(ctx, row, 960, 72 + i * 45, i === 0 ? COLORS.blue : COLORS.green, 13, 'center');
        });
      }} />
      <ChipRow options={[{ value: 'sentiment', label: '情感' }, { value: 'pair', label: '句对' }, { value: 'qa', label: '问答' }]} value={task} onChange={setTask} />
      <div className="feedback good">已切换到{current.name}任务套件；共享 w 未变化，当前只加载该任务的 v、归一化参数和任务头。</div>
    </div>
  );
};

export const C7UpdateMask: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const names = ['读取批次', '前向传播', '计算损失', '反向传播', '掩码更新'];
  const messages = [
    '读取当前任务批次。',
    '表示经过冻结主干与任务适配器。',
    '任务头产生当前损失。',
    '梯度可经过网络，但更新权限由参数掩码决定。',
    '只写入 Adapter、任务层归一化和任务头。',
  ];
  return (
    <div>
      <CanvasStage labelText="一次适配器训练更新的五个阶段" draw={(ctx) => {
        studioBase(ctx, W, H);
        const nodes = [
          { x: 45, name: '批次', color: COLORS.blue },
          { x: 245, name: '主干 w 🔒', color: COLORS.blue },
          { x: 445, name: 'Adapter v', color: COLORS.green },
          { x: 645, name: '任务头', color: COLORS.purple },
          { x: 845, name: '损失', color: COLORS.orange },
        ];
        nodes.forEach((node, i) => {
          roundedRect(ctx, node.x, 92, 145, 64, 10, i <= stage || stage >= 3 ? `${node.color}22` : COLORS.paper, node.color);
          label(ctx, node.name, node.x + 72, 124, node.color, 15, 'center');
          if (i < nodes.length - 1) drawArrow(ctx, node.x + 150, 124, nodes[i + 1].x - 8, 124, i < stage ? COLORS.green : COLORS.line);
        });
        if (stage >= 3) drawArrow(ctx, 920, 190, 330, 190, COLORS.orange);
        drawBar(ctx, 245, 225, 545, stage === 4 ? 0.62 : 0.08, stage === 4 ? COLORS.green : COLORS.line, stage === 4 ? '更新掩码：只开放任务参数' : '参数尚未写入');
      }} />
      <StepControls value={stage} max={4} onChange={setStage} labels={names} />
      <div className={`feedback ${stage === 4 ? 'good' : ''}`}>{messages[stage]}</div>
    </div>
  );
};

type LrBand = 'low' | 'mid' | 'high';
export const C7LearningRate: React.FC<WidgetProps> = () => {
  const [band, setBand] = useState<LrBand>('mid');
  const value = band === 'low' ? 2e-5 : band === 'mid' ? 2e-4 : 1e-3;
  const message = band === 'high'
    ? '顶层微调在高学习率端明显下降；这不等于所有任务都应选同一学习率。'
    : '论文附录中 Adapter 在该搜索范围内较稳定，但最优值仍需验证集选择。';
  return (
    <div>
      <CanvasStage labelText="适配器与顶层微调的学习率定性趋势" draw={(ctx) => {
        studioBase(ctx, W, H);
        ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(120, 210); ctx.lineTo(980, 210); ctx.lineTo(980, 50); ctx.stroke();
        label(ctx, '低', 180, 232, COLORS.muted, 13, 'center'); label(ctx, '中', 540, 232, COLORS.muted, 13, 'center'); label(ctx, '高', 900, 232, COLORS.muted, 13, 'center');
        ctx.strokeStyle = COLORS.green; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(180, 104); ctx.quadraticCurveTo(540, 80, 900, 108); ctx.stroke();
        ctx.strokeStyle = COLORS.orange; ctx.beginPath(); ctx.moveTo(180, 120); ctx.quadraticCurveTo(540, 90, 900, 184); ctx.stroke();
        const t = band === 'low' ? 0 : band === 'mid' ? 0.5 : 1;
        const x = 180 + 720 * t;
        const y = (1 - t) ** 2 * 104 + 2 * (1 - t) * t * 80 + t ** 2 * 108;
        ctx.fillStyle = COLORS.blue; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
        label(ctx, 'Adapter：较稳定', 330, 58, COLORS.green, 15, 'center');
        label(ctx, '顶层微调：高端下降', 765, 178, COLORS.orange, 15, 'center');
      }} />
      <ChipRow options={[{ value: 'low', label: '低 · 2×10⁻⁵' }, { value: 'mid', label: '中 · 2×10⁻⁴' }, { value: 'high', label: '高 · 10⁻³' }]} value={band} onChange={setBand} />
      <div className="feedback">当前示例学习率：{value.toExponential(0)}。{message} 画面为论文附录趋势示意。</div>
    </div>
  );
};
