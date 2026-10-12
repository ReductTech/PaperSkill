import { useRef, useState } from 'react';
import results from '../../experiments/results.json';
import { clearScene, drawPaper, roundRect, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

const experiment = results.experiment;
const trialAt = (seed: number, position: boolean) => experiment.trials.find((trial) => trial.seed === seed && trial.position === position)!;
const percent = (value: number) => (value * 100).toFixed(4);

function pairedPicture(ctx: CanvasRenderingContext2D, x: number, reversed: boolean) {
  drawPaper(ctx, x - 8, 55, 162, 162);
  const colors = reversed ? [palette.blue, palette.red, palette.light, palette.dark] : [palette.red, palette.blue, palette.light, palette.dark];
  colors.forEach((color, index) => {
    const left = x + index % 2 * 74;
    const top = 63 + Math.floor(index / 2) * 74;
    roundRect(ctx, left, top, 70, 70, 3, color, '#fff');
    if (index < 2) {
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (color === palette.red) { ctx.moveTo(left + 20, top + 47); ctx.lineTo(left + 35, top + 20); ctx.lineTo(left + 50, top + 47); ctx.closePath(); }
      else ctx.arc(left + 35, top + 35, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
}

export function Widget9b() {
  const [seed, setSeed] = useState(0);
  const [position, setPosition] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selected = trialAt(seed, position);
  const noPosition = trialAt(seed, false);
  const withPosition = trialAt(seed, true);
  const noSummary = experiment.summary.find((summary) => !summary.position)!;
  const withSummary = experiment.summary.find((summary) => summary.position)!;
  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    pairedPicture(ctx, 52, false);
    pairedPicture(ctx, 270, true);
    ctx.save();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(535, 217); ctx.lineTo(1015, 217);
    ctx.moveTo(535, 210); ctx.lineTo(535, 224);
    ctx.moveTo(1015, 210); ctx.lineTo(1015, 224);
    ctx.stroke();
    ctx.font = '18px sans-serif';
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'left';
    ctx.fillText('0%', 535, 249);
    ctx.textAlign = 'right';
    ctx.fillText('100%', 1015, 249);
    ctx.restore();
    [noPosition, withPosition].forEach((trial, index) => {
      const y = 80 + index * 70;
      const active = trial.position === position;
      roundRect(ctx, 535, y, 480, 34, 7, '#e7ebe8');
      roundRect(ctx, 535, y, 480 * trial.test_accuracy, 34, 7, index === 0 ? palette.blue : palette.green);
      if (active) {
        ctx.save();
        ctx.strokeStyle = palette.orange;
        ctx.lineWidth = 3;
        ctx.strokeRect(528, y - 6, 494, 46);
        ctx.restore();
      }
    });
    drawLabel(ctx, '成对输入', 52, 30, palette.blue);
    drawLabel(ctx, '测试准确率', 535, 30, palette.blue);
  });
  return (
    <div>
      <div className="ctrl" aria-label="选择编码器初始化种子">
        {experiment.seeds.map((value) => <button type="button" key={value} className={'chip' + (seed === value ? ' selected' : '')} aria-pressed={seed === value} onClick={() => setSeed(value)}>种子{value}</button>)}
      </div>
      <div className="ctrl" aria-label="选择固定位置设置">
        <button type="button" className={'chip' + (!position ? ' selected' : '')} aria-pressed={!position} onClick={() => setPosition(false)}>无位置</button>
        <button type="button" className={'chip' + (position ? ' selected' : '')} aria-pressed={position} onClick={() => setPosition(true)}>固定随机位置</button>
      </div>
      <canvas ref={canvasRef} aria-label={'成对输入生成规则示意；上条无位置测试准确率' + percent(noPosition.test_accuracy) + '%，下条固定随机位置' + percent(withPosition.test_accuracy) + '%。'} />
      <Feedback>
        种子{seed}，{position ? '固定随机位置' : '无位置'}：训练准确率{percent(selected.train_accuracy)}%，测试准确率{percent(selected.test_accuracy)}%。
        固定编码器，没有端到端学习。五个初始化共享同一数据划分；无位置的测试均值{percent(noSummary.mean_test_accuracy)}%，样本标准差{(noSummary.sample_std_test_accuracy * 100).toFixed(6)}个百分点；
        有位置的测试均值{percent(withSummary.mean_test_accuracy)}%，样本标准差{(withSummary.sample_std_test_accuracy * 100).toFixed(6)}个百分点。标准差来自初始化变化，不是置信区间。
        这是自造空间关系任务的线性读出结果，不是论文原表，也不能外推真实图片识别增益。
      </Feedback>
      <p className="step-desc">画面仅示意数据生成规则，图上形状用于辅助辨认，不代表实际输入另加了形状通道。上条为无位置，下条为固定随机位置；橙框是所选设置。切换只查看已执行记录，不在网页训练。</p>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="全部五种初始化的测试集准确率">
          <thead><tr><th scope="col">初始化种子</th><th scope="col">无位置：测试准确率</th><th scope="col">固定随机位置：测试准确率</th></tr></thead>
          <tbody>{experiment.seeds.map((value) => <tr key={value} style={value === seed ? { fontWeight: 700, backgroundColor: '#eef2f8' } : undefined}><th scope="row">{value}{value === seed ? '（当前）' : ''}</th><td>{percent(trialAt(value, false).test_accuracy)}%</td><td>{percent(trialAt(value, true).test_accuracy)}%</td></tr>)}</tbody>
        </table>
      </div>
      <details>
        <summary>查看本条记录的训练损失与实现边界</summary>
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="paper" aria-label="所选实验线性头训练损失">
            <thead><tr><th scope="col">更新步数</th><th scope="col">含L2项训练损失</th></tr></thead>
            <tbody>{selected.loss_history.map((row) => <tr key={row.step}><th scope="row">{row.step}</th><td>{row.loss.toFixed(8)}</td></tr>)}</tbody>
          </table>
        </div>
        <p>此处展示真实记录，不将低训练损失自动当作泛化证据。分类阈值先将logit四舍五入到12位，避免把浮点对称误差误作可区分表征。位置表也未训练，与原论文的可学习位置表不同。脚本、环境、数据哈希与完整限制均在项目experiments目录。</p>
      </details>
    </div>
  );
}
