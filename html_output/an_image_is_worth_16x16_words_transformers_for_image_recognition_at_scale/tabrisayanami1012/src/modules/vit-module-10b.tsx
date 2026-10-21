import { useRef, useState } from 'react';
import { clearScene, drawPaper, drawGuide, roundRect, arrow, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

const questions = {
  position: {
    label: '位置何时重要？',
    hypothesis: '空间关系任务比单纯内容识别更依赖位置信息。',
    control: '同数据划分、编码器种子和读出训练，比较有无位置，并加入与顺序无关的对照任务。',
    measure: '多数据划分与多初始化的测试准确率均值、标准差。',
    falsify: '需要分清顺序的任务并没有受更大影响，或发现别的输入偷偷透露了位置。已有成对色块实验符合预期，真实房屋等自然图像还没检验。',
  },
  smallObject: {
    label: '小目标与图块',
    hypothesis: '如果屋顶等目标在图上很小，切成更小的图块可能更容易保留细节，但要做更多次图块配对。',
    control: '固定图片、分辨率和训练预算，分别训练不同图块大小的模型并合理调参；不能把原来16×16的投影表直接拿去处理32×32图块。',
    measure: '把图片按目标大小分组，分别统计准确率；同一硬件上测预测耗时和显存（显卡存储空间）占用。',
    falsify: '小目标桶没有稳定增益，或代价超过预设预算。待检验。',
  },
  fairness: {
    label: '比较是否公平？',
    hypothesis: 'ViT与CNN的差距可能还受训练办法和尝试参数的次数影响，不能只归因于网络结构。',
    control: '相同数据子集与训练预算，为CNN和ViT分别提供等额且合理的调参机会，多初始化重复。',
    measure: '匹配预算的准确率均值、标准差与实际训练用时。',
    falsify: '在上述控制下差距始终稳定、调参并未改变结果。待检验；这也不排除未控制因素。',
  },
};
type Question = keyof typeof questions;

function tinyTarget(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = palette.orange;
  ctx.strokeStyle = palette.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 10, y + 9);
  ctx.lineTo(x - 10, y + 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function Widget10b() {
  const [question, setQuestion] = useState<Question>('position');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = questions[question];
  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    drawPaper(ctx, 40, 40, 410, 190);
    drawPaper(ctx, 605, 40, 430, 190);
    if (question === 'position') {
      for (const side of [0, 1]) {
        const base = side === 0 ? 98 : 672;
        [0, 1].forEach((i) => {
          const x = base + i * 130;
          drawGuide(ctx, x - 5, 83, 110, 105, i ? palette.purple : palette.orange);
          roundRect(ctx, x + 5, 92, 90, 85, 5, side === i ? palette.red : palette.blue, '#fff');
        });
      }
      arrow(ctx, 475, 135, 576, 135, palette.orange);
    } else if (question === 'smallObject') {
      for (const side of [0, 1]) {
        const base = side ? 711 : 146;
        const count = side ? 6 : 3;
        const size = 144 / count;
        tinyTarget(ctx, base + 80, 143);
        ctx.save();
        ctx.strokeStyle = side ? palette.blue : palette.dark;
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= count; i += 1) {
          ctx.beginPath();
          ctx.moveTo(base + i * size, 66); ctx.lineTo(base + i * size, 210);
          ctx.moveTo(base, 66 + i * size); ctx.lineTo(base + 144, 66 + i * size);
          ctx.stroke();
        }
        ctx.restore();
      }
      arrow(ctx, 475, 135, 576, 135, palette.blue);
    } else {
      for (const base of [82, 657]) {
        for (let i = 0; i < 6; i += 1) {
          roundRect(ctx, base + i * 49, 86, 37, 37, 5, palette.light, palette.dark);
          roundRect(ctx, base + i * 49, 158, 37, 21, 4, palette.blue);
        }
        drawGuide(ctx, base - 8, 77, 311, 112, palette.orange);
      }
      ctx.save();
      ctx.strokeStyle = palette.green;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(485, 126); ctx.lineTo(563, 126); ctx.moveTo(485, 146); ctx.lineTo(563, 146); ctx.stroke();
      ctx.restore();
    }
    drawLabel(ctx, '问题场景', 55, 27, palette.blue);
    drawLabel(ctx, '受控对照', 620, 27, palette.blue);
  });
  return (
    <div>
      <div className="ctrl" aria-label="选择下一步待检验问题">
        {(Object.keys(questions) as Question[]).map((key) => <button type="button" key={key} className={'chip' + (question === key ? ' selected' : '')} aria-pressed={question === key} onClick={() => setQuestion(key)}>{questions[key].label}</button>)}
      </div>
      <canvas ref={canvasRef} aria-label={current.label + '的概念场景与对照设计；没有展示未做实验的虚构测量。'} />
      <Feedback>
        <p><strong>假设：</strong>{current.hypothesis}</p>
        <p><strong>控制：</strong>{current.control}</p>
        <p><strong>指标：</strong>{current.measure}</p>
        <p><strong>推翻条件：</strong>{current.falsify}</p>
      </Feedback>
      <p className="step-desc">以上是待验证的问题，不是原论文已经证明的结论。除上一章已完成的成对色块实验外，真实图片、不同图块大小和全网络一起训练的对照都还没做。</p>
      <p>JFT级别实验不是普通笔记本即可复现的规模；分类结果不自动证明检测、分割或通用鲁棒性，注意力可视化也不是因果解释。回到上周CLIP：ViT帮助理解其一种视觉骨干如何产生图像表示；图文对齐和零样本分类仍来自CLIP另加的训练目标与文本分支，不是本论文自动具备的能力。</p>
    </div>
  );
}
