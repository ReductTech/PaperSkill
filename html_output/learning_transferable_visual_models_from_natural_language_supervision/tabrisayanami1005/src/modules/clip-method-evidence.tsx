import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Canvas, C, card, photo, arrow, label, Chips, Feedback } from './clip-scenes';

const tasks = [
  {
    name: '逐词生成描述',
    question: '给定图片以及已经写出的前文，下一个词是什么？',
    target: '学习生成完整描述，需要逐步预测文字序列。',
    detail: '描述生成把照片变成一句话，例如“一只猫坐在草地上”。训练时为下一个词提供正确目标，词序是任务的一部分；这是论文用于比较的预训练目标，不是原始 CLIP 推理时具备的功能。',
  },
  {
    name: '词袋预测',
    question: '这张图片对应的描述里包含哪些词？',
    target: '预测描述中出现的词，不要求恢复词序。',
    detail: '词袋是“把一句话当成若干词的集合”的表示方式。它保留哪些词出现，却忽略先后顺序，因此这里显示猫、坐、草地的词卡，没有把词卡连成句子；这也是一个比较任务，不是 CLIP 的最终方法。',
  },
  {
    name: '对比式匹配',
    question: '同一批次的候选描述中，哪条与这张图片原本配对？',
    target: '把原配对图文拉近，相对于其他候选提高它的得分。',
    detail: 'CLIP 不必先重建描述里每一个词，而是把整条文字编码成一个向量，再与图片向量比较。训练中的正确答案来自数据里原有的图文配对，模型通过对比学习这种对应关系；下一章的相似度与损失解释怎样完成比较。',
  },
];

export const ClipMethodChoice: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0);
  const task = tasks[mode];
  return <>
    <Canvas ariaLabel={`同一张猫照片，当前训练任务：${task.name}。图形为教学示意。`} draw={ctx => {
      label(ctx, '同一张照片', 56, 31);
      label(ctx, '训练目标', 550, 31);
      photo(ctx, 56, 79, 190, '猫');
      arrow(ctx, 266, 150, 337, 150, C.blue);
      if (mode === 0) {
        const words = ['一只', '猫', '坐在', '草地上'];
        words.forEach((word, i) => {
          const x = 358 + i * 165;
          if (i < 3) arrow(ctx, x + 134, 136, x + 158, 136, C.blue);
          card(ctx, x, 107, 126, 58, word, i === 3 ? C.orange : C.blue);
        });
        ctx.strokeStyle = C.orange;
        ctx.setLineDash([7, 5]);
        ctx.strokeRect(846, 91, 149, 89);
        ctx.setLineDash([]);
      } else if (mode === 1) {
        card(ctx, 375, 72, 510, 160, '', C.dark);
        [['猫', 421, 103], ['草地', 651, 145], ['坐', 535, 159]].forEach(([word, x, y]) => {
          card(ctx, Number(x), Number(y), 105, 48, String(word), C.green);
        });
      } else {
        ['一只猫坐在草地上', '一辆车停在路边', '一只鸟飞过山谷'].forEach((text, i) => {
          const y = 61 + i * 66;
          card(ctx, 408, y, 580, 48, text, i === 0 ? C.green : C.passive);
        });
        arrow(ctx, 338, 150, 390, 85, C.green);
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.strokeRect(400, 54, 596, 62);
      }
    }}/>
    <Chips options={tasks.map(x => x.name)} value={mode} onChange={setMode} label="比较预训练目标"/>
    <Feedback>任务示意。当前问题：{task.question} {task.target}</Feedback>
    <p>{task.detail}</p>
    <table className="paper" style={{whiteSpace:'normal'}}>
      <thead><tr><th>训练目标</th><th>要学会什么</th><th>本图中的区别</th></tr></thead>
      <tbody>
        <tr><td>描述生成</td><td>根据图片和前文预测后续词</td><td>词卡按顺序排列，最后一个词是当前预测目标</td></tr>
        <tr><td>词袋预测</td><td>预测描述中哪些词出现</td><td>词卡散放，取消词序连线</td></tr>
        <tr><td>对比学习</td><td>在候选中选回原来的完整图文配对</td><td>对比三条完整描述，强调原配对的一条</td></tr>
      </tbody>
    </table>
    <p><strong>论文为何选择对比学习？</strong>第 3 页图 2 在所研究的设置下，用处理过的图片数衡量样本效率，并用零样本 ImageNet 准确率衡量学习结果。作者报告：词袋预测相对描述生成提高约 3 倍样本效率，对比学习相对词袋预测再提高约 4 倍。</p>
    <p>“样本效率更高”是达到可比表现时需要处理的训练样本更少，不等于每张图片计算得更快。不能把 3 × 4 直接写成“任何任务训练速度提高 12 倍”，更不能从这张图推出某台显卡上的耗时。</p>
    <p><strong>数据从哪里来？</strong>论文第 2 页第 2.1 节构建了约 4 亿互联网图文配对的 WIT 数据集，使用约 50 万个检索词，并对每个检索词设定最多 2 万对的收集上限。文字描述为视觉学习提供自然语言监督：监督是告诉模型该向什么目标学习的信息，不一定是人工整理的固定类别编号。</p>
    <p>互联网文字可能有歧义、缺漏或只描述画面的一部分，因此这种监督可以有噪声。训练不依赖逐张整理成固定类别标签，不表示完全没有人的语言信息，也不表示每一条图文配对都正确。</p>
    <p><small>来源：CLIP 第 2 页第 2.1 节、第 3 页图 2。上方照片、词卡和配对选择为机制示意；3 倍、4 倍是论文报告的有条件实验结论。</small></p>
  </>;
};

const transfers = [
  { name: 'ImageNet', task: '一般物体分类', desc: '判断图片属于哪个物体类别，候选是类别名称。', delta: 1.9, meaning: '这个数据集上，零样本 CLIP 略高于使用 ResNet-50 特征的监督式线性分类器。' },
  { name: 'StanfordCars', task: '细粒度车型分类', desc: '区分车辆的具体类别，比笼统判断“这是一辆车”更细。', delta: 28.9, meaning: '这个车型分类数据集上，零样本 CLIP 的比较优势较大；不能据此声称它在所有细粒度类别上都领先。' },
  { name: 'EuroSAT', task: '卫星影像分类', desc: '根据卫星影像区分土地覆被等类别，图像分布与常见互联网照片不同。', delta: -37.1, meaning: '这个卫星影像数据集上，零样本 CLIP 明显落后于该线性分类基线，说明迁移能力有任务与分布条件。' },
  { name: 'CLEVRCounts', task: '合成场景物体计数', desc: '根据场景中的物体数量分类，需要处理“有几个”而不只是“是什么”。', delta: -18.2, meaning: '这个计数数据集上，零样本 CLIP 落后于该线性分类基线；图文匹配不能自动保证精确数量推理。' },
];

export const ClipTransfer: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0);
  const item = transfers[mode];
  const sign = item.delta > 0 ? '+' : '−';
  const display = `${sign}${Math.abs(item.delta).toFixed(1)}`;
  const color = item.delta > 0 ? C.green : C.red;
  return <>
    <Canvas ariaLabel={`论文图4：${item.name}准确率差值${display}个百分点，零样本CLIP减去ResNet50特征的监督式线性分类器。`} draw={ctx => {
      label(ctx, '论文差值', 52, 33);
      label(ctx, '零线为持平', 550, 33);
      card(ctx, 38, 105, 182, 70, item.name, C.blue);
      const origin = 630, scale = 9, y = 145;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();ctx.moveTo(origin - 360, y);ctx.lineTo(origin + 360, y);ctx.stroke();
      [-40, -20, 0, 20, 40].forEach(tick => {
        const x = origin + tick * scale;
        ctx.beginPath();ctx.moveTo(x, y - 5);ctx.lineTo(x, y + 9);ctx.stroke();
        label(ctx, `${tick > 0 ? '+' : ''}${tick}`, x - 17, 242, C.muted);
      });
      ctx.strokeStyle = C.dark;
      ctx.beginPath();ctx.moveTo(origin, 76);ctx.lineTo(origin, 204);ctx.stroke();
      const endpoint = origin + item.delta * scale;
      ctx.fillStyle = color;
      ctx.fillRect(Math.min(origin, endpoint), y - 27, Math.abs(item.delta) * scale, 54);
      arrow(ctx, origin, 88, endpoint, 88, color);
      const textX = item.delta > 0 ? Math.min(endpoint + 12, 857) : Math.max(endpoint - 112, 265);
      label(ctx, `${display} pp`, textX, 69, color);
    }}/>
    <Chips options={transfers.map(x => x.name)} value={mode} onChange={setMode} label="论文图4的数据集"/>
    <div className="metrics">
      <div className="metric"><div className="l">选中任务</div><div className="v">{item.task}</div></div>
      <div className="metric"><div className="l">准确率差值</div><div className="v">{display} 个百分点</div></div>
      <div className="metric"><div className="l">比较方向</div><div className="v">{item.delta > 0 ? 'CLIP 更高' : '基线更高'}</div></div>
    </div>
    <Feedback>{item.name}：{item.desc} {item.meaning} 图示重画的是论文结果，没有重新运行评测。</Feedback>
    <p><strong>先读懂比较对象：</strong>图 4 的一方是零样本 CLIP，另一方是使用经典 ResNet-50 图像特征、在下游任务标签上训练的线性分类器。线性分类器是对固定图片特征加权并选择类别的简单分类头；这里不是把 CLIP 与所有端到端训练的最强系统统一比较。</p>
    <p><strong>差值怎样读？</strong>Δ = CLIP 得分 − 基线得分。对这里四个采用准确率指标的数据集，差值单位是百分点（pp）：正值表示 CLIP 更高，负值表示基线更高；零线只表示两者得分持平，不表示双方准确率都是零。</p>
    <p>例如 {item.name} 的 {display} pp 表示两者准确率相差 {Math.abs(item.delta).toFixed(1)} 个百分点；图中没有提供这两方各自的绝对准确率。不要把它写成“CLIP 准确率为 {Math.abs(item.delta).toFixed(1)}%”，也不要把百分点差直接当作相对提升百分比。</p>
    <table className="paper" style={{whiteSpace:'normal'}}>
      <thead><tr><th>图 4 中选取的数据集</th><th>任务</th><th>零样本 CLIP − 监督线性基线</th></tr></thead>
      <tbody>{transfers.map(x => <tr key={x.name}><td>{x.name}</td><td>{x.task}</td><td>{x.delta > 0 ? '+' : '−'}{Math.abs(x.delta).toFixed(1)} pp</td></tr>)}</tbody>
    </table>
    <p><strong>整体结论与边界：</strong>论文在图 4 的 27 个数据集上比较，零样本 CLIP 在其中 16 个上超过该基线，所以它表现出有价值的迁移能力，同时并非处处领先。完整 27 项任务使用的指标并不全相同；这里选择四个可用准确率百分点解释的结果，不能把整张图都当成同一种绝对准确率。</p>
    <p><small>来源：CLIP 第 5 页图 4。这个 ResNet-50 特征线性分类基线，与后续图 7 的 ImageNet ResNet-101 分类模型不是同一个比较对象。</small></p>
  </>;
};
