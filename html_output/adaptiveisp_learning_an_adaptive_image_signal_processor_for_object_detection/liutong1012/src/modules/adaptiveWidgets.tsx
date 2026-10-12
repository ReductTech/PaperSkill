import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', paper: '#ffffff', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#f07e47', purple: '#7c3aed', line: '#d7deea', soft: '#b8c9a7',
};
const W = 1080;
const H = 280;
const font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
const strong = 'bold 20px "Segoe UI", "Microsoft YaHei", sans-serif';

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = C.ink, bold = false) {
  ctx.font = bold ? strong : font; ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function stage(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  rounded(ctx, 20, 18, W - 40, H - 36, 18, C.paper, C.line);
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.line, width = 3) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, max: number, color: string, name: string) {
  label(ctx, name, x, y - 12, C.muted);
  rounded(ctx, x, y, 330, 24, 12, '#eaf0ef');
  rounded(ctx, x, y, Math.max(4, 330 * value / max), 24, 12, color);
  label(ctx, value.toFixed(1), x + 345, y + 18, C.ink, true);
}

// 原创二次元风格相机观察员“小澄”：只由 Canvas 图元绘制，不依赖外部 IP 或素材。
function cheng(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, happy = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#394c69';
  ctx.beginPath(); ctx.ellipse(0, -24, 59, 70, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5cbb5';
  ctx.beginPath(); ctx.ellipse(0, -15, 46, 53, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#394c69';
  ctx.beginPath(); ctx.moveTo(-55, -44); ctx.quadraticCurveTo(-32, -102, 23, -77); ctx.quadraticCurveTo(61, -69, 53, -30);
  ctx.quadraticCurveTo(12, -48, -7, -70); ctx.quadraticCurveTo(-23, -37, -55, -44); ctx.fill();
  ctx.fillStyle = '#263a62';
  ctx.beginPath(); ctx.ellipse(-17, -15, 5, 9, 0, 0, Math.PI * 2); ctx.ellipse(18, -15, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ae6465'; ctx.lineWidth = 2; ctx.beginPath();
  if (happy) ctx.arc(0, 3, 9, .1, Math.PI - .1);
  else { ctx.moveTo(-8, 8); ctx.lineTo(8, 8); }
  ctx.stroke();
  ctx.fillStyle = '#ef999e'; ctx.globalAlpha = .42;
  ctx.beginPath(); ctx.ellipse(-31, 0, 10, 5, 0, 0, 7); ctx.ellipse(31, 0, 10, 5, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  rounded(ctx, -35, 38, 70, 59, 24, '#6a86ad');
  rounded(ctx, -23, 48, 48, 31, 7, C.ink);
  ctx.beginPath(); ctx.arc(0, 64, 13, 0, 7); ctx.fillStyle = '#9fb9c6'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 64, 8, 0, 7); ctx.fillStyle = C.blue; ctx.fill();
  ctx.restore();
}
function cameraView(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mode: string, focus = true) {
  rounded(ctx, x, y, w, h, 14, mode === 'dark' ? '#243854' : mode === 'glare' ? '#eee6cb' : '#b9d3d2');
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.clip();
  const horizon = y + h * .64;
  ctx.fillStyle = mode === 'dark' ? '#172944' : '#88ab97'; ctx.fillRect(x, horizon, w, h * .36);
  ctx.fillStyle = mode === 'glare' ? '#fff6b4' : mode === 'dark' ? '#a3b6d5' : '#fff8dd';
  ctx.beginPath(); ctx.arc(x + w * .79, y + h * .25, mode === 'glare' ? 36 : 18, 0, 7); ctx.fill();
  const bx = x + w * .47, by = horizon - 12;
  ctx.strokeStyle = mode === 'dark' ? '#d3e1e9' : '#27446e'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(bx - 29, by + 22, 21, 0, 7); ctx.arc(bx + 30, by + 22, 21, 0, 7);
  ctx.moveTo(bx - 29, by + 22); ctx.lineTo(bx - 4, by - 17); ctx.lineTo(bx + 30, by + 22);
  ctx.lineTo(bx - 29, by + 22); ctx.moveTo(bx - 4, by - 17); ctx.lineTo(bx + 34, by - 17); ctx.stroke();
  if (mode === 'dark') {
    ctx.fillStyle = '#dbe7ec'; ctx.globalAlpha = .15;
    for (let i = 0; i < 55; i++) ctx.fillRect(x + (i * 47) % w, y + (i * 71) % h, 3, 3);
    ctx.globalAlpha = 1;
  }
  if (focus) { ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(bx - 61, by - 41, 122, 95); }
  ctx.restore();
}
function useDraw(draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[], width = W, height = H) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = setupCanvas(ref.current, width, height);
    draw(ctx);
    ref.current.classList.add('is-ready');
    // draw is purposefully rebuilt with the current UI state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
const canvasCss: React.CSSProperties = { width: '100%', height: 'auto', display: 'block', borderRadius: 12 };
const controlsCss: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '14px 0' };
const btnCss: React.CSSProperties = { border: '1px solid #cbd5df', borderRadius: 9, padding: '9px 13px', background: '#fff', color: C.ink, cursor: 'pointer', font: 'inherit' };
function Pick({ values, chosen, onPick }: { values: string[]; chosen: number; onPick: (n: number) => void }) {
  return <div style={controlsCss}>{values.map((v, i) => <button key={v} type="button" onClick={() => onPick(i)}
    aria-pressed={chosen === i} style={{ ...btnCss, background: chosen === i ? C.blue : '#fff', color: chosen === i ? '#fff' : C.ink }}>{v}</button>)}</div>;
}
function Feedback({ text, good }: { text: string; good?: boolean }) {
  return <div className={`feedback ${good === true ? 'good' : good === false ? 'bad' : ''}`} aria-live="polite">{text}</div>;
}
export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useDraw(ctx => { stage(ctx); cheng(ctx, 130, 133, .67, false); cameraView(ctx, 250, 55, 700, 160, 'dark', false);
    label(ctx, '固定设置', 275, 242, C.red, true); }, []);
  return <canvas ref={ref} width={W} height={H} style={canvasCss} aria-label="固定 ISP 在暗光下难以凸显自行车轮廓" />;
};
export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useDraw(ctx => { stage(ctx); cheng(ctx, 130, 133, .67); cameraView(ctx, 250, 55, 700, 160, 'dark', true);
    label(ctx, '随场景选择', 275, 242, C.green, true); }, []);
  return <canvas ref={ref} width={W} height={H} style={canvasCss} aria-label="自适应 ISP 根据当前场景调整处理方式" />;
};
export const Analogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const n = Number(chapterId.replace('chap-', '')) || 1;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ctx = setupCanvas(el, 560, 140);
    let raf = 0, visible = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (t: number) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 560, 140);
      ctx.fillStyle = '#e2e9db'; ctx.fillRect(0, 105, 560, 35);
      cameraView(ctx, 222, 12, 290, 91, n % 3 === 0 ? 'dark' : n % 4 === 0 ? 'glare' : 'normal', n > 1);
      const sway = reduce ? 0 : Math.sin(t / 510 + n) * 2;
      cheng(ctx, 96, 70 + sway, .53, n !== 1);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(520, 18, 6, 0, 7); ctx.fill();
      el.classList.add('is-ready');
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible && !reduce) raf = requestAnimationFrame(draw); else cancelAnimationFrame(raf); });
    io.observe(el); draw(0);
    return () => { visible = false; cancelAnimationFrame(raf); io.disconnect(); };
  }, [n]);
  return <canvas ref={ref} width={560} height={140} style={canvasCss} aria-label={`原创相机观察员在摄影练习中演示第${n}章概念`} />;
};

const pool = ['曝光', 'Gamma', 'CCM', '锐化/模糊', '去噪', '色调映射', '对比度', '饱和度', '去饱和', '白平衡'];
const poolNotes = [
  '改变整体亮度；在暗光中可能帮助显露目标。',
  '改变亮度的非线性映射。',
  '色彩校正矩阵；可处理色偏并调整颜色。',
  '突出或柔化边缘，影响检测器看到的细节。',
  '减少噪声，但会引入计算开销。',
  '压缩高动态范围，让亮暗部分都保有线索。',
  '拉开或收拢明暗差异。',
  '调整颜色浓淡。',
  '减轻高 ISO 图像的彩色噪声。',
  '校正颜色通道之间的相对增益。',
];
const scenes = ['高 ISO 暗光', '低 ISO 正常光', '强反差'];
const routes = [['去饱和', '曝光', '锐化/模糊', '对比度'], ['CCM', '锐化/模糊', '白平衡', '对比度'], ['CCM', '锐化/模糊', '色调映射', '对比度']];
const costs = [
  { name: 'λc = 0', acc: 71.4, ms: 14.73 },
  { name: 'λc = 0.005', acc: 71.1, ms: 14.30 },
  { name: 'λc = 0.01', acc: 71.0, ms: 11.54 },
  { name: 'λc = 0.05', acc: 70.0, ms: 9.26 },
  { name: 'λc = 0.1', acc: 69.9, ms: 9.20 },
];
const resultSets = [
  { title: 'LOD · YOLOv3 · mAP@0.5', rows: [['固定 ISP + 参数优化', 70.1], ['Attention-aware', 70.9], ['ReconfigISP', 69.4], ['AdaptiveISP', 71.4]] as [string, number][] },
  { title: 'LOD · YOLOv3 · mAP@0.5 · 阶段数', rows: [['1 阶段', 69.6], ['2 阶段', 70.9], ['3 阶段', 71.3], ['5 阶段', 71.4]] as [string, number][] },
  { title: 'LOD · 不同检测器 · mAP@0.5', rows: [['YOLOX 原 RGB', 57.0], ['YOLOX + 本法', 69.7], ['DDQ 原 RGB', 50.3], ['DDQ + 本法', 74.0]] as [string, number][] },
];
const architecture = [
  ['图像状态', '当前图像及模块使用记录、阶段信息共同构成决策输入。'],
  ['策略网络', 'Actor 输出模块的概率分布，并预测所选模块的连续参数。'],
  ['ISP 模块', '按当前动作变换图像，产生供下一阶段使用的图像。'],
  ['检测器', '预训练 YOLOv3 提供检测误差以计算训练奖励；实验中保持固定。'],
  ['价值网络', 'Critic 对当前状态的预期回报作估计，帮助训练 Actor。'],
];

export const AdaptiveLab: React.FC<WidgetProps> = ({ moduleId }) => {
  const [choice, setChoice] = useState(0);
  const [step, setStep] = useState(0);
  const [after, setAfter] = useState(42);
  const [penalty, setPenalty] = useState(8);
  const [played, setPlayed] = useState(false);
  const is = (id: string) => moduleId === id;
  const sceneMode = choice === 0 ? 'dark' : choice === 2 ? 'glare' : 'normal';
  const reward = (55 - after - penalty) / 10;
  const ref = useDraw(ctx => {
    stage(ctx);
    if (is('8.1')) {
      architecture.forEach((it, i) => {
        const x = 45 + i * 207;
        rounded(ctx, x, 94, 177, 76, 12, i === choice ? '#e5f3ec' : '#f1f5f6', i === choice ? C.green : C.line);
        label(ctx, it[0], x + 22, 140, i === choice ? C.green : C.ink, i === choice);
        if (i < 4) line(ctx, x + 180, 132, x + 201, 132, i <= choice ? C.green : C.line);
      });
      label(ctx, '点击下方节点，查看训练中的作用路径', 54, 55, C.muted);
    } else if (is('10.1')) {
      const set = resultSets[choice];
      label(ctx, set.title, 55, 58, C.ink, true);
      set.rows.forEach(([name, value], i) => {
        label(ctx, name, 55, 92 + i * 43);
        rounded(ctx, 320, 74 + i * 43, 560, 21, 9, '#eaf0ef');
        rounded(ctx, 320, 74 + i * 43, played ? value / 80 * 560 : 0, 21, 9, name.includes('Adaptive') || name.includes('本法') ? C.green : C.blue);
        label(ctx, value.toFixed(1), 910, 91 + i * 43, C.ink, true);
      });
    } else if (is('9.1')) {
      label(ctx, 'LOD · 论文表 4 · mAP@0.5 与单样本平均时间', 55, 58, C.ink, true);
      bar(ctx, 65, 102, costs[choice].acc, 80, C.green, '检测精度 ↑');
      bar(ctx, 65, 187, costs[choice].ms, 20, C.orange, '总时间 ms ↓');
      cheng(ctx, 790, 140, .8);
    } else if (is('5.1')) {
      label(ctx, '教学算例：处理前误差固定为 5.5', 58, 58, C.ink, true);
      bar(ctx, 65, 100, 5.5, 6, C.blue, '处理前误差');
      bar(ctx, 65, 180, after / 10, 6, C.orange, '处理后误差');
      rounded(ctx, 765, 88, 240, 120, 14, reward > 0 ? '#e5f3ec' : '#fae7e8');
      label(ctx, `奖励 ${reward.toFixed(1)}`, 790, 155, reward > 0 ? C.green : C.red, true);
    } else if (is('4.1') || is('6.1') || is('7.1')) {
      const names = is('4.1') ? ['当前图像', '选模块', '定参数', '得到新图'] : is('7.1') ? ['Actor 出动作', '检测器评价', 'Critic 估值', '策略更新'] : routes[choice];
      label(ctx, is('7.1') ? '训练反馈链' : is('4.1') ? '马尔可夫决策轨迹' : `${scenes[choice]} · 教学路线`, 55, 58, C.ink, true);
      names.forEach((name, i) => {
        const x = 57 + i * 253;
        rounded(ctx, x, 100, 213, 82, 12, i === step ? '#e5f3ec' : '#f0f3f2', i === step ? C.green : C.line);
        label(ctx, name, x + 22, 148, i === step ? C.green : C.muted, i === step);
        if (i < 3) line(ctx, x + 216, 142, x + 247, 142, i < step ? C.green : C.line);
      });
      label(ctx, `第 ${step + 1} / 4 步`, 57, 231, C.muted);
    } else if (is('2.1')) {
      cameraView(ctx, 440, 42, 560, 195, choice === 8 ? 'dark' : choice === 5 ? 'glare' : 'normal', true);
      cheng(ctx, 154, 146, .9);
      label(ctx, pool[choice], 286, 124, C.blue, true);
      label(ctx, '模块类型 M', 286, 160, C.muted);
    } else if (is('3.1') || is('6.1') || is('1.2')) {
      cameraView(ctx, 365, 39, 650, 201, sceneMode, !is('1.2'));
      cheng(ctx, 154, 144, .9, !is('1.2'));
      label(ctx, scenes[choice], 280, 214, C.blue, true);
    } else {
      cameraView(ctx, 365, 39, 650, 201, is('1.1') && choice === 0 ? 'glare' : 'normal', true);
      cheng(ctx, 154, 144, .9);
      label(ctx, choice === 0 ? '观感' : '检测', 283, 213, choice === 0 ? C.orange : C.green, true);
    }
  }, [moduleId, choice, step, after, penalty, played]);

  let feedback = '';
  let good: boolean | undefined;
  if (is('1.1')) { feedback = choice ? '检测优先：保留轮廓和目标线索。示意画面不代表真实 mAP。' : '观感优先：画面显得明亮，但高光可能吞没目标边界。'; good = !!choice; }
  else if (is('1.2')) { feedback = `固定设置遇到${scenes[choice]}时无法按图像需求改变模块序列。`; good = false; }
  else if (is('2.1')) feedback = `${pool[choice]}：${poolNotes[choice]}`;
  else if (is('3.1')) feedback = [ '论文图 5：高 ISO、高噪声样本较偏好去饱和。', '论文图 5：低 ISO、较少噪声样本较偏好 CCM。', '论文图 5：高动态范围样本较偏好色调映射。' ][choice];
  else if (is('4.1')) feedback = ['状态 sᵢ 是当前图像。', '离散动作 aᴹ 选择模块类型。', '连续动作 aΘ 确定模块参数。', '模块作用后得到 sᵢ₊₁，再进行下一次选择。'][step];
  else if (is('5.1')) { feedback = `奖励 = 5.5 − ${(after / 10).toFixed(1)} − ${(penalty / 10).toFixed(1)} = ${reward.toFixed(1)}。教学算例，正值代表这一步收益大于惩罚。`; good = reward > 0; }
  else if (is('6.1')) feedback = `教学示意第 ${step + 1} 步：${routes[choice][step]}。论文模型会根据当前图像预测，不使用此处写死的路线。`;
  else if (is('7.1')) feedback = ['Actor 选择模块与连续参数。', '固定的预训练检测器计算误差变化。', 'Critic 估计当前状态价值。', 'Actor–Critic 用回报信号更新策略与价值网络。'][step];
  else if (is('8.1')) feedback = architecture[choice][1];
  else if (is('9.1')) feedback = `论文表 4：${costs[choice].name} 时，LOD mAP@0.5 为 ${costs[choice].acc.toFixed(1)}，平均总时间 ${costs[choice].ms.toFixed(2)} ms。权重更大通常更省时，也可能损失精度。`;
  else if (is('10.1')) feedback = played ? `已显示${resultSets[choice].title}的论文数字；只比较同一组内的数值。` : '选择同一评测协议，点击“播放比较”显示论文原始结果。';

  return <div>
    <canvas ref={ref} width={W} height={H} style={canvasCss} aria-label={feedback} />
    {(is('1.1') || is('1.2') || is('2.1') || is('3.1') || is('8.1') || is('9.1') || is('10.1')) &&
      <Pick values={is('1.1') ? ['观感优先', '检测优先'] : is('1.2') || is('3.1') ? scenes :
        is('2.1') ? pool : is('8.1') ? architecture.map(a => a[0]) :
        is('9.1') ? costs.map(x => x.name) : resultSets.map(x => x.title)}
        chosen={choice} onPick={n => { setChoice(n); setPlayed(false); }} />}
    {(is('4.1') || is('6.1') || is('7.1')) && <div style={controlsCss}>
      {is('6.1') && <Pick values={scenes} chosen={choice} onPick={n => { setChoice(n); setStep(0); }} />}
      <button type="button" style={btnCss} disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>上一步</button>
      <button type="button" style={btnCss} disabled={step === 3} onClick={() => setStep(s => Math.min(3, s + 1))}>下一步</button>
      <span aria-live="polite">第 {step + 1} / 4 步</span>
    </div>}
    {is('5.1') && <div style={{ ...controlsCss, flexDirection: 'column', alignItems: 'stretch' }}>
      <label>处理后误差 {(after / 10).toFixed(1)} <input aria-label="处理后误差" type="range" min="5" max="60" value={after} onChange={e => setAfter(Number(e.target.value))} style={{ width: '100%' }} /></label>
      <label>代价惩罚 {(penalty / 10).toFixed(1)} <input aria-label="代价惩罚" type="range" min="0" max="25" value={penalty} onChange={e => setPenalty(Number(e.target.value))} style={{ width: '100%' }} /></label>
    </div>}
    {is('10.1') && <button type="button" style={btnCss} onClick={() => setPlayed(v => !v)}>{played ? '重置比较' : '播放比较'}</button>}
    <Feedback text={feedback} good={good} />
    {(is('9.1') || is('10.1')) && <p style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>数据来源：Wang 等，NeurIPS 2024，{is('9.1') ? '表 4' : choice === 0 ? '表 1' : choice === 1 ? '表 5' : '表 3'}。数值越高代表 mAP 越好，时间越低代表处理越快。</p>}
  </div>;
};
