import React, { useRef, useState } from 'react';
import { Stage, colors, drawPhoto, drawBrush, drawFrame } from './SceneKit';
import type { WidgetProps } from './registry';

const wrap: React.CSSProperties = { minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '12px 0' };
function Root({ children }: { children: React.ReactNode }) {
  return <div style={wrap} onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>{children}</div>;
}
function Choices({ labels, selected, choose }: { labels: string[]; selected: number; choose: (value: number) => void }) {
  return <div style={row}>{labels.map((label, index) => <button type="button" className="chip" key={label} aria-pressed={selected === index} onClick={() => choose(index)}>{label}</button>)}</div>;
}
function Feedback({ children, bad = false }: { children: React.ReactNode; bad?: boolean }) {
  return <p className={`feedback ${bad ? 'bad' : 'good'}`} aria-live="polite">{bad ? '✕ ' : '✓ '}{children}</p>;
}
function path(ctx: CanvasRenderingContext2D, points: number[][], active = true) {
  ctx.strokeStyle = active ? colors.blue : colors.border; ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function block(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, selected: boolean, tone = colors.blue) {
  ctx.fillStyle = selected ? colors.light : colors.bg; ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = selected ? tone : colors.border; ctx.lineWidth = selected ? 4 : 2; ctx.strokeRect(x, y, width, height);
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 15) {
  ctx.fillStyle = colors.text; ctx.textAlign = 'center'; ctx.font = `600 ${size}px sans-serif`; ctx.fillText(text, x, y);
  ctx.textAlign = 'start';
}
const stages = ['低分辨率输入', '卷积与残差主干', '第一次亚像素上采样', '第二次亚像素上采样', '高分辨率输出'];
const shapes = ['24×24×3', '24×24×64', '48×48×64', '96×96×64', '96×96×3'];
export function Inference(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  return <Root><Stage height={250} label="一次前向计算的五个观察位置" draw={(ctx, width, height) => {
    drawFrame(ctx, width, height);
    path(ctx, [[60, 125], [665, 125]], false); path(ctx, [[60, 125], [80 + step * 135, 125]]);
    shapes.forEach((_, index) => { const size = [30, 42, 60, 82, 82][index]; block(ctx, 65 + index * 135 - size / 2, 125 - size / 2, size, size, index === step); });
    ['输入', '残差主干', '第一次 2×', '第二次 2×', '输出'].forEach((name, index) => { label(ctx, name, 65 + index * 135, 42); label(ctx, shapes[index], 65 + index * 135, 216, 13); });
  }}/><div style={row}><button disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button><button disabled={step === 4} onClick={() => setStep(step + 1)}>下一步</button><button onClick={() => setStep(0)}>重置</button></div>
  <p>观察点 {step + 1}/5：{stages[step]} · {shapes[step]}</p><p>完整路径：{shapes.join(' → ')}</p>
  <Feedback>步进仅查看一次前向计算内部。两次 2× 上采样组成 4×；推理仅运行固定 G，BN 不更新，不运行 D 或 VGG19。</Feedback><small>来源：论文第5页图4、第6页第3.2节。尺寸以教学输入 24×24 为例。</small></Root>;
}
export function Loss(_props: WidgetProps) {
  const [draft, setDraft] = useState('0.5'); const [probability, setProbability] = useState(0.5); const [clamped, setClamped] = useState(false);
  const adversarial = -Math.log(probability); const total = .02 + .001 * adversarial;
  function calculate() { const parsed = Number(draft); const safe = Math.min(.99, Math.max(.01, Number.isFinite(parsed) ? parsed : .5)); setClamped(safe !== parsed); setDraft(String(safe)); setProbability(safe); }
  return <Root><Stage height={250} label="教学照片与损失贡献，非模型输出" draw={(ctx, width, height) => {
    drawFrame(ctx, width, height); drawPhoto(ctx, 35, 35, 365, 180, .7); drawBrush(ctx, 210, 90, -.3);
    const available = 230; ctx.fillStyle = colors.blue; ctx.fillRect(445, 70, available * .02 / total, 28);
    ctx.fillStyle = colors.orange; ctx.fillRect(445, 130, available * (.001 * adversarial) / total, 28);
    label(ctx, '内容损失', 560, 60); label(ctx, '对抗损失 × 0.001', 560, 120);
    label(ctx, `总损失 ${total.toFixed(5)}`, 560, 205);
  }}/><div style={row}><label>判真概率 p <input aria-label="判真概率" type="number" min="0.01" max="0.99" step="0.01" value={draft} onChange={event => setDraft(event.target.value)} style={{ width: 100 }}/></label><button onClick={calculate}>计算</button><button onClick={() => { setDraft('0.5'); setProbability(.5); setClamped(false); }}>重置</button></div>
  <p>已计算 p={probability.toFixed(2)}；−ln(p)={adversarial.toFixed(6)}；总损失=0.02+0.001×{adversarial.toFixed(6)}={total.toFixed(6)}。</p>
  <p>蓝色上条为内容项，橙色下条为加权对抗项；条长显示当前总量中的比例。内容项 0.02 为教学假设，非论文训练日志。</p>
  <Feedback bad={clamped}>{clamped ? '输入已限制到 [0.01,0.99]。' : '计算采用自然对数。'}p=0 时 log(0) 无有限值，因此不可取。这里演示单样本；式（6）对样本求和而非取平均。权重意义依赖归一化。</Feedback><p>原文 LR 为 [0,1]，HR 为 [−1,1]；VGG 特征除以 12.75，平方项尺度约为 0.006。</p><small>来源：论文第5页式（3）、第6页式（6）与第3.2节。所有照片及计算均为教学示意，非模型输出。</small></Root>;
}
const generatorNames = ['输入卷积', '16个残差块', '长跳连', '两次上采样', '输出卷积'];
const generatorShape = ['24×24×3 → 24×24×64', '24×24×64 → 24×24×64', '24×24×64 + 24×24×64', '24×24×64 → 48×48×64 → 96×96×64', '96×96×64 → 96×96×3'];
const generatorNotes = ['9×9 卷积与 PReLU 提取初始特征。', '每块含两层 3×3、64通道卷积及 BN，第一层后 PReLU；局部跳连相加。', '主干卷积与 BN 后，与初始特征相加；两个张量必须同形。', '每次先以卷积准备通道，再以像素重排放大 2×，两次合成 4×。', '9×9 卷积输出三通道图像；可信纹理不保证真实。'];
export function Generator(_props: WidgetProps) {
  const [selected, setSelected] = useState(1);
  function selectCanvas(event: React.PointerEvent<HTMLCanvasElement>) { const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 720; const y = (event.clientY - rect.top) / rect.height * 300; if (y >= 100 && y <= 210) setSelected(Math.max(0, Math.min(4, Math.floor((x - 15) / 140)))); }
  return <Root><Stage height={300} label="生成器结构，可点选节点或使用下方按钮" onPointerDown={selectCanvas} draw={(ctx, width, height) => {
    drawFrame(ctx, width, height); path(ctx, [[55, 155], [665, 155]], false);
    path(ctx, [[85, 105], [85, 45], [365, 45], [365, 105]], selected === 2);
    path(ctx, [[225, 115], [225, 80], [290, 80], [290, 115]], selected === 1);
    path(ctx, [[30, 155], [55 + selected * 140, 155]]);
    generatorNames.forEach((_, index) => { block(ctx, 25 + index * 140, 115, 110, 80, index === selected); if (index === 1) { for (let stripe = 0; stripe < 4; stripe++) { ctx.fillStyle = colors.dark; ctx.fillRect(180 + stripe * 20, 130, 9, 50); } } if (index === 3) { block(ctx, 465, 135, 25, 25, false); block(ctx, 505, 125, 45, 45, selected === 3); } });
    generatorNames.forEach((name, index) => { label(ctx, name, 80 + index * 140, 220, 15); });
    label(ctx, '长跳连', 225, 35); label(ctx, '局部残差', 257, 70, 13);
    label(ctx, `当前：${generatorShape[selected]}`, 360, 264, 16);
  }}/><Choices labels={generatorNames} selected={selected} choose={setSelected}/><p>选中路径：输入 → {generatorNames.slice(0, selected + 1).join(' → ')}。</p><p>当前张量：{generatorShape[selected]}</p><Feedback>{generatorNotes[selected]} 残差主干保持空间尺寸，上采样在其后。</Feedback><small>来源：论文第4页第2.1节、第5页图4、第6页第3.2节。结构图为教学示意。</small></Root>;
}
const networkNames = ['生成器 G', '判别器 D', '固定 VGG19'];
const networkPaths = ['24×24×3 → 残差主干 → 两次2×上采样 → 96×96×3', '96×96×3 → 8层卷积（部分步幅降采样）→ 两层全连接 → sigmoid → 单个概率', '96×96×3 → 固定卷积与最大池化 → VGG54 内容特征'];
const networkNotes = ['G 在训练中更新，在推理中固定；输出三通道图像。', 'D 在训练中更新：8个卷积层通道64→512，LeakyReLU斜率0.2，两层全连接及sigmoid；不使用最大池化。', 'VGG19 固定参数，只提供内容损失；VGG54 为第五次最大池化前第四个卷积的 ReLU 后特征。'];
export function Networks(_props: WidgetProps) {
  const [selected, setSelected] = useState(1);
  return <Root><Stage height={270} label="三种网络职责与不同输出形状" onPointerDown={event => { const rect = event.currentTarget.getBoundingClientRect(); const y = (event.clientY - rect.top) / rect.height * 270; if (y > 20 && y < 250) setSelected(Math.min(2, Math.max(0, Math.floor((y - 20) / 80)))); }} draw={(ctx, width, height) => {
    drawFrame(ctx, width, height);
    networkNames.forEach((_, index) => { const y = 35 + index * 80; path(ctx, [[45, y + 18], [650, y + 18]], index === selected); const count = [5, 8, 6][index]; for (let layer = 0; layer < count; layer++) block(ctx, 65 + layer * 57, y - Math.min(layer, 4) * 2, 30, 30 + Math.min(layer, 4) * 4, index === selected); if (index === 1) { ctx.beginPath(); ctx.arc(635, y + 15, 14, 0, Math.PI * 2); ctx.stroke(); } else block(ctx, 605, y - 6, index === 0 ? 44 : 65, index === 0 ? 44 : 27, index === selected); });
    networkNames.forEach((name, index) => label(ctx, name, 180, 25 + index * 80, 15));
    ['生成图像', '真假概率', '内容特征'].forEach((name, index) => label(ctx, name, 620, 83 + index * 80, 13));
  }}/><Choices labels={networkNames} selected={selected} choose={setSelected}/><p>激活路径与形状：{networkPaths[selected]}</p><Feedback>{networkNotes[selected]} 类似 VGG 的 D 与固定 VGG19 是两个不同网络。推理仅保留 G。</Feedback><small>来源：论文第4页第2.1节、第5页图4、第6页第3.2节。卷积宽度仅作结构示意，不代表耗时。</small></Root>;
}
export function Training(_props: WidgetProps) {
  const [stage, setStage] = useState(0);
  const titles = ['MSE 预训练', 'GAN 对抗训练', '降低学习率'];
  const descriptions = [
    '先训练 SRResNet，以像素均方误差优化生成器。训练好的权重用于初始化下一阶段的生成器，论文这样做是为了避免不理想的局部最优。',
    '从预训练权重开始，生成器使用 VGG 内容损失与对抗损失；判别器学习区分真实图像和生成图像。G 和 D 交替更新。',
    '继续使用相同的感知与对抗训练，学习率从 10⁻⁴ 降为 10⁻⁵，继续交替更新 G 和 D；这不是另一个新模型。',
  ];
  return <Root><p>切换阶段，比较实际更新的网络、目标和训练参数。</p>
  <Choices labels={titles} selected={stage} choose={setStage}/>
  <div aria-live="polite" style={{ border: '1px solid #d7deea', background: '#f5f8f0', padding: 20, display: 'grid', gap: 14 }}>
    <strong style={{ fontSize: 20 }}>阶段 {stage + 1}：{titles[stage]}</strong>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {['生成器 G', '判别器 D', 'VGG19'].map((name, index) => {
        const status = index === 0 || (index === 1 && stage > 0) ? '更新参数' : index === 2 && stage > 0 ? '固定，用于计算内容损失' : '不参与此阶段';
        return <div key={name} style={{ flex: '1 1 160px', padding: 12, background: status === '更新参数' ? '#dcebdd' : '#fff', border: `2px solid ${status === '更新参数' ? '#228d5c' : '#d7deea'}` }}><strong>{name}</strong><div>{status}</div></div>;
      })}
    </div>
    <div><strong>优化目标：</strong>{stage === 0 ? '像素 MSE' : 'VGG54 内容损失 + 0.001 × 对抗损失'}</div>
    <div><strong>更新次数：</strong>{stage === 0 ? '10⁶' : '10⁵'} 次　<strong>学习率：</strong>{stage === 2 ? '10⁻⁵' : '10⁻⁴'}</div>
    <div><strong>阶段之间：</strong>{stage === 0 ? '生成器权重用于初始化 GAN 训练' : stage === 1 ? '继承预训练生成器，开始交替更新' : '沿用前一阶段权重，降低学习率继续训练'}</div>
  </div>
  <Feedback>{descriptions[stage]}</Feedback><p>Adam β₁=0.9；35万张 ImageNet 图像，HR 裁块 96×96，批量16；用双三次降采样构造4× LR，测试数据独立。</p>
  <p>预训练不能消除伪影。超过16块的更深 GAN 训练更困难；这里没有虚构的损失曲线。</p><small>来源：论文第6页第3.1–3.2节、第8页第4节。</small></Root>;
}
const records = {
  Set5: [[32.05, .9019, 3.37], [29.4, .8472, 3.58]],
  Set14: [[28.49, .8184, 2.98], [26.02, .7397, 3.72]],
  BSD100: [[27.58, .7620, 2.29], [25.16, .6688, 3.56]],
};
const datasets = ['Set5', 'Set14', 'BSD100'] as const;
const metricNames = ['PSNR（dB）', 'SSIM', 'MOS'];
export function Results(_props: WidgetProps) {
  const [dataset, setDataset] = useState(2); const [metric, setMetric] = useState(2); const [ablation, setAblation] = useState(false); const [run, setRun] = useState(0);
  const start = useRef<number | null>(null); const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const values = records[datasets[dataset]]; const scale = [40, 1, 5][metric];
  function restart() { start.current = null; setRun(previous => previous + 1); }
  return <Root><Choices labels={[...datasets]} selected={dataset} choose={value => { setDataset(value); start.current = null; }}/><Choices labels={metricNames} selected={metric} choose={value => { setMetric(value); start.current = null; }}/>
  <div style={row}><button onClick={restart}>播放同步比较</button><button aria-pressed={ablation} onClick={() => setAblation(!ablation)}>{ablation ? '返回最终模型比较' : '查看内容项消融'}</button></div>
  <Stage key={run} height={235} animate={run > 0 && !reduced} label="共享时间进度的两种方法指标条形图" draw={(ctx, width, height, timeMs) => {
    drawFrame(ctx, width, height); if (start.current === null) start.current = timeMs;
    const progress = reduced || run === 0 ? 1 : Math.max(0, Math.min(1, (timeMs - start.current) / 1200));
    path(ctx, [[90, 30], [90, 205], [660, 205]], false);
    values.forEach((record, index) => { ctx.fillStyle = index === 0 ? colors.blue : colors.green; ctx.fillRect(92, 55 + index * 85, record[metric] / scale * 540 * progress, 42); ctx.strokeStyle = colors.text; ctx.strokeRect(92, 55 + index * 85, record[metric] / scale * 540 * progress, 42); });
    values.forEach((record, index) => { label(ctx, index === 0 ? 'SRResNet' : 'SRGAN', 150, 49 + index * 85, 14); label(ctx, record[metric].toFixed(metric === 1 ? 4 : 2), 620, 83 + index * 85, 15); });
  }}/><p>上条蓝色：SRResNet；下条绿色：SRGAN（VGG54）。横轴从0开始，当前上限 {scale}；动画仅同步揭示既有数值，不是训练过程。减少动态效果时直接展示终态。</p>
  <table style={{ width: '100%', tableLayout: 'fixed' }}><caption>原文第8页表2 · {datasets[dataset]} · 4×</caption><thead><tr><th scope="col">方法</th>{metricNames.map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead><tbody>{values.map((record, index) => <tr key={index}><th scope="row">{index === 0 ? 'SRResNet' : 'SRGAN'}</th>{record.map((value, column) => <td key={column}>{value.toFixed(column === 1 ? 4 : 2)}</td>)}</tr>)}</tbody></table>
  <Feedback>{datasets[dataset]}：{metricNames[metric]} 从 {values[0][metric].toFixed(metric === 1 ? 4 : 2)} 变为 {values[1][metric].toFixed(metric === 1 ? 4 : 2)}。三项均越高越好；MOS 提升伴随像素指标下降，不表示所有标准都改善。</Feedback>
  {ablation && <><table style={{ width: '100%', tableLayout: 'fixed' }}><caption>原文第7页表1 · GAN 内容项消融 · MOS</caption><thead><tr><th>数据集</th><th>MSE</th><th>VGG22</th><th>VGG54</th></tr></thead><tbody><tr><th scope="row">Set5</th><td>3.77</td><td>3.78</td><td>3.58</td></tr><tr><th scope="row">Set14</th><td>3.43</td><td>3.57</td><td>3.72</td></tr></tbody></table><p>Set5 的 VGG22 MOS 最高，Set14 的 VGG54 最高；VGG54 并非所有数据集最优。表1 GAN-MSE 不能与表2 SRResNet 混为同一方法。</p></>}
  <p>评估协议：全部4×；PSNR/SSIM 在 Y 亮度通道计算，裁去4像素边界。MOS 为26位评分者的1–5分；BSD100 每种方法2600次评分。只在同数据集、同协议内比较；未提供虚构误差条。</p><p>纹理合理不保证真实；文字与结构化场景、伪影及训练困难仍是边界。医学和取证不能把生成细节当作事实。</p><small>来源：论文第6页第3.1、3.3节，第7页表1，第8页表2与第4节。</small></Root>;
}
