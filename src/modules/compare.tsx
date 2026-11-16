import React, { useRef, useState } from 'react';
import { Stage, colors, drawPhoto, drawBrush, drawFrame } from './SceneKit';
import type { WidgetProps } from './registry';

const box: React.CSSProperties = { minWidth: 0, maxWidth: '100%' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBlock: 12 };
const stopArrows = (event: React.KeyboardEvent) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); };
const bounded = (value: number) => Math.max(0, Math.min(1, value));
const note = '教学示意，非模型输出；图中纹理、特征与计算均为人工构造。';
function Feedback({ children }: { children: React.ReactNode }) { return <p className="feedback" aria-live="polite" style={{ overflowWrap: 'anywhere' }}>{children}</p>; }
function line(ctx: CanvasRenderingContext2D, points: number[][], color: string, width = 3) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = colors.text; ctx.font = '600 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.textAlign = 'start';
}

export function Compare(_props: WidgetProps) {
  const [split, setSplit] = useState(.5);
  const active = useRef<number | null>(null);
  const update = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width > 0) setSplit(bounded(((event.clientX - rect.left) / rect.width * 720 - 30) / 660));
  };
  const release = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    if (active.current !== event.pointerId) return;
    active.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div style={box} onKeyDown={stopArrows}>
    <p>{note} 左侧平滑，右侧添加合理但未经证实的纹理。</p>
    <Stage height={310} label="同一照片的两种目标示意，可拖拽分割线；下方滑块支持键盘" style={{ touchAction: 'none', cursor: 'ew-resize' }}
      onPointerDown={event => { event.stopPropagation(); if (active.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return; active.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
      onPointerMove={event => { event.stopPropagation(); if (active.current === event.pointerId) update(event); }}
      onPointerUp={event => { if (active.current === event.pointerId) update(event); release(event); }} onPointerCancel={release}
      draw={(ctx, width, height) => {
        drawFrame(ctx, width, height); drawPhoto(ctx, 30, 26, 660, 250, 0);
        const cut = 30 + split * 660;
        ctx.save(); ctx.beginPath(); ctx.rect(cut, 26, 690 - cut, 250); ctx.clip(); drawPhoto(ctx, 30, 26, 660, 250, 1); ctx.restore();
        line(ctx, [[cut, 26], [cut, 276]], colors.blue, 4);
        ctx.fillStyle = colors.bg; ctx.beginPath(); ctx.arc(cut, 150, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = colors.blue; ctx.stroke();
        line(ctx, [[cut - 7, 150], [cut + 7, 150]], colors.blue, 2);
      }} />
    <div style={row}><label style={{ flex: '1 1 180px' }}>分割位置 {Math.round(split * 100)}%<input style={{ width: '100%' }} type="range" min="0" max="100" step="1" value={Math.round(split * 100)} onChange={event => setSplit(Number(event.target.value) / 100)} /></label><button onClick={() => setSplit(.5)}>复位</button></div>
    <Feedback>当前平滑区占 {Math.round(split * 100)}%，纹理区占 {100 - Math.round(split * 100)}%。分割位置只改变展示范围，不是质量评分。合理细节不保证真实。</Feedback>
  </div>;
}

export function Scale(_props: WidgetProps) {
  const factors = [1, 2, 4, 8]; const [index, setIndex] = useState(2); const factor = factors[index];
  return <div style={box} onKeyDown={stopArrows}><p>{note}</p>
    <Stage height={300} label="采样照片与放大范围的示意" draw={(ctx, width, height) => {
      drawFrame(ctx, width, height);
      const sample = document.createElement('canvas'); sample.width = 192 / factor; sample.height = 128 / factor;
      const small = sample.getContext('2d');
      if (small) { drawPhoto(small, 0, 0, sample.width, sample.height, 1); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(sample, 30, 32, 420, 250); ctx.restore(); }
      ctx.strokeStyle = colors.blue; ctx.lineWidth = 3; ctx.strokeRect(30, 32, 420, 250);
      const side = 24 * factor; ctx.fillStyle = colors.light; ctx.fillRect(492, 62, side, side); ctx.strokeStyle = colors.green; ctx.strokeRect(492, 62, side, side);
      line(ctx, [[492, 270], [684, 270]], colors.border); line(ctx, [[492, 270], [492 + side, 270]], colors.green, 6);
      label(ctx, `放大 ${factor}×`, 588, 38); label(ctx, `像素数 ${factor * factor}×`, 588, 295);
    }} />
    <div style={row}><label style={{ flex: '1 1 180px' }}>放大倍数：{factor}×<input style={{ width: '100%' }} type="range" min="0" max="3" step="1" value={index} aria-valuetext={`${factor}倍，${factor === 4 ? '论文设定' : '教学探索'}`} onChange={event => setIndex(Number(event.target.value))} /></label><button onClick={() => setIndex(2)}>恢复四倍</button></div>
    <p>尺寸举例：24 × 24 × 3 → {24 * factor} × {24 * factor} × 3；像素数比为 {factor * factor}。图中右侧方形边长随倍数变化。</p>
    <Feedback>{factor === 4 ? '✓ 论文实验固定四倍：宽高各四倍，像素数十六倍。' : '○ 当前为教学探索，不能当作论文的实验设定。'} 更多输出像素不意味着丢失细节能被唯一恢复；显示的块状采样仅辅助理解，论文实际用双三次降采样。</Feedback>
  </div>;
}

export function Average(_props: WidgetProps) {
  const [mode, setMode] = useState(2);
  const names = ['候选 A', '候选 B', '平均答案']; const values = mode === 0 ? [1, 0] : mode === 1 ? [0, 1] : [.5, .5];
  const mse = mode === 2 ? .25 : .5;
  return <div style={box} onKeyDown={stopArrows}><p>{note} 两个等概率真值为 [1, 0] 与 [0, 1]；MSE 对两个位置取均值，再对真值求期望。</p>
    <Stage height={300} label="两个可能的真实像素与当前预测及误差" draw={(ctx, width, height) => {
      drawFrame(ctx, width, height);
      const paintPixels = (x: number, y: number, pixels: number[], title: string) => {
        label(ctx, title, x + 68, y - 12);
        pixels.forEach((value, pixel) => {
          const shade = Math.round(245 - value * 180);
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          ctx.fillRect(x + pixel * 70, y, 64, 64);
          ctx.strokeStyle = colors.blue; ctx.lineWidth = 2; ctx.strokeRect(x + pixel * 70, y, 64, 64);
          label(ctx, value.toFixed(1), x + 32 + pixel * 70, y + 88);
        });
      };
      paintPixels(38, 66, [1, 0], '可能的真值 A');
      paintPixels(215, 66, [0, 1], '可能的真值 B');
      paintPixels(392, 66, values, `当前预测：${names[mode]}`);
      line(ctx, [[181, 99], [206, 99]], colors.dark, 3);
      line(ctx, [[358, 99], [383, 99]], colors.blue, 3);
      label(ctx, '两种真值等概率；深色表示像素值更高', 282, 210);
      label(ctx, `当前期望 MSE = ${mse.toFixed(2)}`, 566, 214);
      ctx.fillStyle = colors.border; ctx.fillRect(480, 232, 190, 18);
      ctx.fillStyle = colors.blue; ctx.fillRect(480, 232, 190 * mse / .5, 18);
      label(ctx, '0', 480, 274); label(ctx, '0.50', 670, 274);
    }} />
    <div style={row}>{names.map((name, index) => <button className="chip" aria-pressed={mode === index} key={name} onClick={() => setMode(index)}>{name}</button>)}</div>
    <p>当前预测 [{values.join(', ')}]；分别与两个真值计算 MSE，再取平均，得到 {mse.toFixed(2)}。灰色方块直接表示像素值，并非真实模型结果。</p>
    <Feedback>{mode === 2 ? '✓ 平均答案期望 MSE 更低，但两条线都变淡了。' : '○ 选择一个候选保留清晰线条，却可能选错位置。'} 这些数值是教学样本计算，不是论文测量；低像素误差与清晰纹理不是同一个目标。</Feedback>
  </div>;
}

export function Features(_props: WidgetProps) {
  const [dataset, setDataset] = useState(0); const [selected, setSelected] = useState(2);
  const names = ['MSE', 'VGG22', 'VGG54'];
  const data = [
    [[30.64, .8701, 3.77], [29.84, .8468, 3.78], [29.40, .8472, 3.58]],
    [[26.92, .7611, 3.43], [26.44, .7518, 3.57], [26.02, .7397, 3.72]],
  ];
  const descriptions = ['MSE 直接比较像素值；此处仍包含对抗损失。', 'VGG22 使用第二次最大池化前第二个卷积的 ReLU 特征。', 'VGG54 使用第五次最大池化前第四个卷积的 ReLU 特征，论文最终模型采用此内容项。'];
  const crop = (column: number) => <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '155 / 157', width: '100%', background: '#eef1ed' }}><img src="/images/paper-page-8.png" alt="" style={{ position: 'absolute', width: `${980 / 155 * 100}%`, maxWidth: 'none', height: 'auto', left: `${-(80 + column * 155) / 155 * 100}%`, top: `${-135 / 157 * 100}%` }} /></div>;
  const [psnr, ssim, mos] = data[dataset][selected];
  return <div style={box} onKeyDown={stopArrows}><p>切换内容损失，观察论文图 6 中同一张图的真实重建结果，并与原始图像对照。三种方法都使用对抗损失。</p>
    <div style={row}>{names.map((name, index) => <button className="chip" key={name} aria-pressed={selected === index} onClick={() => setSelected(index)}>SRGAN-{name}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 680 }}>
      <figure style={{ margin: 0 }}><strong>SRGAN-{names[selected]} 重建</strong>{crop(selected + 1)}</figure>
      <figure style={{ margin: 0 }}><strong>原始高分辨率图像</strong>{crop(4)}</figure>
    </div>
    <p>图像来自论文图 6，彩色方框是论文作者标注的局部位置。不同损失可能重建出不同纹理；视觉上合理不代表与原始细节一致。</p>
    <div style={row}>{['Set5', 'Set14'].map((name, index) => <button className="chip" key={name} aria-pressed={dataset === index} onClick={() => setDataset(index)}>{name}</button>)}</div>
    <p>表 1 · {dataset === 0 ? 'Set5' : 'Set14'} · SRGAN-{names[selected]}：PSNR {psnr.toFixed(2)} dB，SSIM {ssim.toFixed(4)}，MOS {mos.toFixed(2)}。这些是数据集汇总结果，不能视作上图这张图的单图评分。</p>
    <Feedback>{descriptions[selected]} {dataset === 0 ? 'Set5 上 VGG22 的 MOS 为 3.78，高于 VGG54 的 3.58。' : 'Set14 上 VGG54 的 MOS 为 3.72，高于 VGG22 的 3.57。'} 因此不能说 VGG54 在每个数据集上都取得最高 MOS。</Feedback>
    <p>来源：论文第 7 页表 1，4× 放大。PSNR/SSIM 在 Y 通道、裁去四周 4 像素后计算；MOS 为主观评分。该实验比较训练后的模型，不是在线运行 VGG。</p>
  </div>;
}

export function Game(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  const titles = ['计算真假判断', '更新判别器 D', '固定 D 的参数', '通过 D 更新 G'];
  const descriptions = ['真实高分辨率图与 G 生成图都交给 D，尚未执行本轮参数更新。', '固定 G 的参数，D 最大化 log D(真实图) + log(1 − D(生成图))。', '切换到 G 的更新阶段：D 的参数固定，但计算图仍可传递输入梯度。', 'G 最小化样本求和 −log D(G(低分辨率图))；梯度通过固定的 D 传回 G。'];
  return <div style={box} onKeyDown={stopArrows}><p>{note} 步进展示一次交替更新的角色，非训练曲线。</p>
    <Stage height={300} animate label="生成器、判别器与训练梯度路径" draw={(ctx, width, height, time) => {
      drawFrame(ctx, width, height);
      const node = (x: number, y: number, title: string, subtitle: string, updating: boolean) => {
        ctx.fillStyle = updating ? colors.light : '#ffffff'; ctx.fillRect(x, y, 145, 78);
        ctx.strokeStyle = updating ? colors.green : colors.blue; ctx.lineWidth = updating ? 4 : 2; ctx.strokeRect(x, y, 145, 78);
        label(ctx, title, x + 72, y + 30); label(ctx, subtitle, x + 72, y + 57);
      };
      node(30, 100, '低分辨率输入', '训练图像', false);
      node(222, 100, '生成器 G', step === 3 ? '参数更新中' : '参数固定', step === 3);
      node(440, 100, '判别器 D', step === 1 ? '参数更新中' : '参数固定', step === 1);
      label(ctx, '生成图像', 402, 82); label(ctx, '真假概率', 650, 145);
      line(ctx, [[175, 139], [222, 139]], colors.blue, 3);
      line(ctx, [[367, 139], [440, 139]], colors.blue, 3);
      line(ctx, [[585, 139], [620, 139]], colors.blue, 3);
      label(ctx, '真实高分辨率图像', 510, 32);
      line(ctx, [[510, 42], [510, 100]], colors.dark, 3);
      if (step === 1) { line(ctx, [[510, 180], [510, 225], [580, 225]], colors.orange, 4); label(ctx, '根据真假误差更新 D', 520, 252); }
      if (step === 2 || step === 3) { line(ctx, [[510, 180], [510, 225], [295, 225], [295, 180]], colors.green, 4); label(ctx, '梯度经过 D 传回 G', 400, 252); }
      const position = (time % 1600) / 1600;
      ctx.fillStyle = step === 3 ? colors.green : colors.orange;
      ctx.beginPath(); ctx.arc(step === 3 ? 510 - 215 * position : 367 + 73 * position, step === 3 ? 225 : 139, 6, 0, Math.PI * 2); ctx.fill();
    }} />
    <div style={row}><button disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>上一步</button><button disabled={step === 3} onClick={() => setStep(value => Math.min(3, value + 1))}>下一步</button><button onClick={() => setStep(0)}>重置</button><output>第 {step + 1} / 4 步：{titles[step]}</output></div>
    <p>{step === 0 ? '已在首步，不能后退。' : step === 3 ? '已到末步，不能继续；重置可重新查看。' : '实线粗框表示正在更新，虚线框表示参数固定。'} D 参数：{step === 1 ? '更新' : '固定'}；G 参数：{step === 3 ? '更新' : '固定'}。</p>
    <Feedback>{step === 3 ? '✓ ' : '○ '}{descriptions[step]} 固定参数不等于截断梯度。真实性判断鼓励照片质感，不能认证细节曾经存在。</Feedback>
  </div>;
}
