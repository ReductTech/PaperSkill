import { useRef, useState } from 'react';
import { clearScene, drawPaper, drawGuide, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

export function calculateHistory() {
  const rows: { step: number; weight: number; probability: number; loss: number }[] = [];
  let weight = 0;
  for (let step = 0; step <= 5; step += 1) {
    const probability = 1 / (1 + Math.exp(-weight));
    rows.push({ step, weight, probability, loss: -Math.log(probability) });
    weight += 1 - probability;
  }
  return rows;
}

export function Widget7() {
  const [step, setStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rows = calculateHistory();
  const current = rows[step];
  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    drawPaper(ctx, 35, 35, 360, 200);
    drawGuide(ctx, 85, 75, 260, 95, palette.border);
    ctx.save();
    ctx.strokeStyle = palette.dark;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(85, 115);
    ctx.lineTo(345, 115);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(490, 35);
    ctx.lineTo(490, 235);
    ctx.lineTo(1030, 235);
    ctx.stroke();
    for (let i = 0; i <= 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(490 + i * 108, 235);
      ctx.lineTo(490 + i * 108, 241);
      ctx.stroke();
    }
    const point = (r: (typeof rows)[number]) => [490 + r.step * 108, 235 - r.loss / 0.75 * 195];
    ctx.beginPath();
    rows.slice(0, step + 1).forEach((row, index) => {
      const [x, y] = point(row);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = palette.green;
    ctx.lineWidth = 4;
    ctx.stroke();
    rows.slice(0, step + 1).forEach((row) => {
      const [x, y] = point(row);
      ctx.beginPath();
      ctx.arc(x, y, row.step === step ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = row.step === step ? palette.blue : palette.green;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    const offset = 60 * current.loss / rows[0].loss;
    ctx.beginPath();
    ctx.moveTo(85, 115 + offset);
    ctx.lineTo(345, 115 + offset);
    ctx.strokeStyle = palette.blue;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, '修正', 50, 26, palette.blue);
    drawLabel(ctx, '损失', 490, 26, palette.blue);
  });
  return (
    <div>
      <canvas ref={canvasRef} aria-label={'第' + step + '次更新，单样本损失' + current.loss.toFixed(4) + '；损失坐标轴从0到0.75，更新次数从0到5。'} />
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={() => setStep((value) => Math.min(value + 1, 5))} disabled={step === 5}>更新一次</button>
        <span className="step-label">已更新 <b>{step}</b> / 5 次</span>
        <button type="button" className="chip" onClick={() => setStep(0)}>重置</button>
      </div>
      <Feedback>
        第 {step} 次更新后：w={current.weight.toFixed(4)}，p={current.probability.toFixed(4)}，ℓ={current.loss.toFixed(4)}。
        当前梯度 p−1={(current.probability - 1).toFixed(4)}，
        {step < 5 ? '所以下次将把 w 增加 ' + (1 - current.probability).toFixed(4) + '。' : '已完成5次演示；重置可核对同一过程。'}
        损失只衡量这个固定样本，不能据此推断测试集表现。
      </Feedback>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="已完成的单样本SGD更新数值">
          <thead><tr><th scope="col">次数</th><th scope="col">权重 w</th><th scope="col">正类概率 p</th><th scope="col">损失 ℓ</th></tr></thead>
          <tbody>{rows.slice(0, step + 1).map((row) => (
            <tr key={row.step} style={row.step === step ? { fontWeight: 700, backgroundColor: '#eef2f8' } : undefined}>
              <th scope="row">{row.step}{row.step === step ? '（当前）' : ''}</th><td>{row.weight.toFixed(4)}</td><td>{row.probability.toFixed(4)}</td><td>{row.loss.toFixed(4)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="三种训练方式的参数更新范围">
          <thead><tr><th scope="col">方式</th><th scope="col">编码器</th><th scope="col">分类头</th></tr></thead>
          <tbody>
            <tr><th scope="row">监督预训练</th><td>学习投影、位置表、注意力与MLP等参数</td><td>学习预训练类别头</td></tr>
            <tr><th scope="row">论文迁移微调</th><td>继续更新</td><td>换成新任务线性头并学习</td></tr>
            <tr><th scope="row">线性探针</th><td>冻结不更新</td><td>仅学习线性读出</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
