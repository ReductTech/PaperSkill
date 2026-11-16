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
    <Stage height={300} label="线条平均与期望像素误差的示意" draw={(ctx, width, height) => {
      drawFrame(ctx, width, height); drawPhoto(ctx, 24, 28, 426, 244, 0);
      values.forEach((value, index) => { ctx.save(); ctx.globalAlpha = value; line(ctx, [[175 + index * 60, 70], [175 + index * 60, 238]], colors.blue, 15); ctx.restore(); });
      drawBrush(ctx, 194 + (mode === 1 ? 60 : 0), 74, -.3);
      [ .5, .5, .25 ].forEach((value, index) => { ctx.fillStyle = mode === index ? colors.blue : colors.light; ctx.fillRect(500, 60 + index * 65, value * 320, 28); if (mode === index) { ctx.strokeStyle = colors.text; ctx.lineWidth = 3; ctx.strokeRect(496, 56 + index * 65, value * 320 + 8, 36); } });
    }} />
    <div style={row}>{names.map((name, index) => <button className="chip" aria-pressed={mode === index} key={name} onClick={() => setMode(index)}>{name}</button>)}</div>
    <p>输出 [{values.join(', ')}]；期望 MSE = {mse.toFixed(2)}。右侧自上而下为候选 A、候选 B、平均答案的误差条。</p>
    <Feedback>{mode === 2 ? '✓ 平均答案期望 MSE 更低，但两条线都变淡了。' : '○ 选择一个候选保留清晰线条，却可能选错位置。'} 这些数值是教学样本计算，不是论文测量；低像素误差与清晰纹理不是同一个目标。</Feedback>
  </div>;
}

export function Features(_props: WidgetProps) {
  const [selected, setSelected] = useState(2); const names = ['像素', 'VGG22', 'VGG54'];
  const details = ['直接比较颜色通道向量，位置偏移也会产生像素误差。', '第二次最大池化前第二个卷积经 ReLU 后的特征。', '第五次最大池化前第四个卷积经 ReLU 后的特征；这是论文最终 SRGAN 的内容项。'];
  return <div style={box} onKeyDown={stopArrows}><p>{note} 轮廓示意用于理解比较层次，不是真实 VGG 激活图。</p>
    <Stage height={320} label="照片、所选特征轮廓与比较路径" onPointerDown={event => {
      event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 720; const y = (event.clientY - rect.top) / rect.height * 320;
      if (y >= 265 && y <= 310) { const hit = [0, 1, 2].find(index => x >= 80 + index * 210 && x <= 220 + index * 210); if (hit !== undefined) setSelected(hit); }
    }} draw={(ctx, width, height) => {
      drawFrame(ctx, width, height); drawPhoto(ctx, 24, 22, 420, 216, 1);
      line(ctx, [[444, 130], [480, 130], [480, 250], [150 + selected * 210, 250], [150 + selected * 210, 265]], colors.purple, 3);
      ctx.save(); ctx.beginPath(); ctx.rect(494, 28, 200, 204); ctx.clip();
      if (selected === 0) {
        for (let rowIndex = 0; rowIndex < 8; rowIndex++) for (let column = 0; column < 8; column++) { ctx.fillStyle = (rowIndex + column) % 3 === 0 ? colors.dark : colors.light; ctx.fillRect(500 + column * 23, 38 + rowIndex * 23, 20, 20); }
      } else {
        line(ctx, [[500, 170], [550, 80], [600, 150], [640, 95], [686, 170]], colors.purple, selected === 2 ? 6 : 3);
        line(ctx, [[570, 206], [570, 156], [600, 135], [631, 156], [631, 206]], colors.blue, 4);
        if (selected === 1) for (let stripe = 0; stripe < 5; stripe++) line(ctx, [[500, 190 + stripe * 7], [680, 190 + stripe * 7]], colors.dark, 1);
      } ctx.restore();
      names.forEach((_name, index) => { ctx.fillStyle = selected === index ? colors.light : colors.bg; ctx.fillRect(80 + index * 210, 265, 140, 45); ctx.strokeStyle = selected === index ? colors.purple : colors.border; ctx.lineWidth = selected === index ? 4 : 1; ctx.strokeRect(80 + index * 210, 265, 140, 45); ctx.beginPath(); ctx.arc(150 + index * 210, 287, 5 + index * 4, 0, Math.PI * 2); ctx.fillStyle = colors.blue; ctx.fill(); });
    }} />
    <div style={row}>{names.map((name, index) => <button className="chip" key={name} aria-pressed={selected === index} onClick={() => setSelected(index)}>{name}</button>)}<button onClick={() => setSelected(2)}>恢复 VGG54</button></div>
    <p>热点从左到右对应像素、VGG22、VGG54；当前路径：参考图与生成图 → {names[selected]} → 平方差。</p>
    <Feedback>○ {details[selected]} 特征相似不等于逐像素一致，也不能证明纹理真实。VGG19 参数固定，与训练中的判别器 D 职责不同；更深特征不保证所有数据集评分更高。</Feedback>
  </div>;
}

export function Game(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  const titles = ['计算真假判断', '更新判别器 D', '固定 D 的参数', '通过 D 更新 G'];
  const descriptions = ['真实高分辨率图与 G 生成图都交给 D，尚未执行本轮参数更新。', '固定 G 的参数，D 最大化 log D(真实图) + log(1 − D(生成图))。', '切换到 G 的更新阶段：D 的参数固定，但计算图仍可传递输入梯度。', 'G 最小化样本求和 −log D(G(低分辨率图))；梯度通过固定的 D 传回 G。'];
  return <div style={box} onKeyDown={stopArrows}><p>{note} 步进展示一次交替更新的角色，非训练曲线。</p>
    <Stage height={300} label="生成器与判别器参数状态、梯度路径示意" draw={(ctx, width, height) => {
      drawFrame(ctx, width, height); drawPhoto(ctx, 24, 32, 398, 232, .7); drawBrush(ctx, 280, 95, -.4);
      const gx = 488, dx = 606;
      line(ctx, [[gx + 44, 90], [dx, 90]], colors.border, 4);
      [gx, dx].forEach((x, index) => { const changing = index === 0 ? step === 3 : step === 1; ctx.fillStyle = changing ? colors.light : colors.bg; ctx.fillRect(x - 12, 56, 84, 68); ctx.strokeStyle = changing ? colors.green : colors.blue; ctx.lineWidth = changing ? 5 : 2; ctx.setLineDash(!changing && step > 0 ? [5, 4] : []); ctx.strokeRect(x - 12, 56, 84, 68); ctx.setLineDash([]); ctx.fillStyle = colors.text; ctx.font = '20px sans-serif'; ctx.fillText(index === 0 ? 'G' : 'D', x + 20, 98); });
      if (step === 3) { line(ctx, [[666, 155], [666, 196], [516, 196], [516, 132]], colors.green, 4); line(ctx, [[507, 145], [516, 132], [525, 145]], colors.green, 3); }
      else if (step === 1) { line(ctx, [[430, 145], [636, 145], [636, 128]], colors.orange, 4); }
      else line(ctx, [[430, 154], [636, 154]], colors.blue, 3);
      for (let index = 0; index < 4; index++) { ctx.fillStyle = step === index ? colors.green : colors.border; ctx.beginPath(); ctx.arc(490 + index * 60, 250, step === index ? 10 : 6, 0, Math.PI * 2); ctx.fill(); }
    }} />
    <div style={row}><button disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>上一步</button><button disabled={step === 3} onClick={() => setStep(value => Math.min(3, value + 1))}>下一步</button><button onClick={() => setStep(0)}>重置</button><output>第 {step + 1} / 4 步：{titles[step]}</output></div>
    <p>{step === 0 ? '已在首步，不能后退。' : step === 3 ? '已到末步，不能继续；重置可重新查看。' : '实线粗框表示正在更新，虚线框表示参数固定。'} D 参数：{step === 1 ? '更新' : '固定'}；G 参数：{step === 3 ? '更新' : '固定'}。</p>
    <Feedback>{step === 3 ? '✓ ' : '○ '}{descriptions[step]} 固定参数不等于截断梯度。真实性判断鼓励照片质感，不能认证细节曾经存在。</Feedback>
  </div>;
}
