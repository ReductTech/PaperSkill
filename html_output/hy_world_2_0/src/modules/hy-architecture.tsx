import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EvidenceMediaDrawer, PaperTable, SectionExtras } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type PriorId = 'pose' | 'intrinsics' | 'depth';
type OutputId = 'camera' | 'pointmap' | 'depth' | 'normal' | 'gaussian';
type StepId = 'idle' | 'rgb' | PriorId | 'shared' | 'heads' | `inspect-${OutputId}` | 'done';
type InspectionSample = { verdict: 'pass' | 'reject'; issue: string; detail: string; variant: number };
type OutputDef = {
  id: OutputId;
  label: string;
  role: string;
  check: string;
  color: string;
  samples: InspectionSample[];
};

const priors: Array<{ id: PriorId; label: string; short: string; effect: string }> = [
  { id: 'pose', label: '相机位姿', short: 'Pose', effect: '告诉模型每张照片从哪里拍，减少跨视图坐标歧义。' },
  { id: 'intrinsics', label: '相机内参', short: 'K', effect: '提供焦距与主点，约束像素射线如何进入三维空间。' },
  { id: 'depth', label: '深度先验', short: 'Depth', effect: '提供局部距离线索，帮助表面更快落到合理位置。' },
];

const outputs: OutputDef[] = [
  {
    id: 'camera', label: 'Camera', role: '恢复相机参数，把多视图放进共同坐标。', check: '检查跨视图回投影是否一致', color: '#7c3aed',
    samples: [
      { verdict: 'pass', issue: '回投影闭环', detail: '三组视锥在共同坐标中对齐。', variant: 0 },
      { verdict: 'pass', issue: '尺度稳定', detail: '相机基线与场景尺度保持一致。', variant: 1 },
      { verdict: 'reject', issue: '候选位姿漂移', detail: '第三视角的回投影框偏离主体。', variant: 2 },
      { verdict: 'reject', issue: '候选焦距错配', detail: '视锥开角异常，像素射线无法闭合。', variant: 3 },
    ],
  },
  {
    id: 'pointmap', label: 'Pointmap', role: '为每个像素预测对应的三维点。', check: '检查点是否脱离连续表面', color: '#228d5c',
    samples: [
      { verdict: 'pass', issue: '连续点面', detail: '墙面点云保持平整且边界收敛。', variant: 0 },
      { verdict: 'pass', issue: '薄结构保留', detail: '桌腿与门框仍连接到主体表面。', variant: 1 },
      { verdict: 'reject', issue: '候选含离群点', detail: '少量点脱离墙面形成飞点。', variant: 2 },
      { verdict: 'reject', issue: '候选薄片断裂', detail: '物体边缘出现不连续的点面裂口。', variant: 3 },
    ],
  },
  {
    id: 'depth', label: 'Depth', role: '输出相机坐标下的距离结构。', check: '检查无效深度与遮挡空洞', color: '#27446e',
    samples: [
      { verdict: 'pass', issue: '近远层级连续', detail: '前景、墙面和远端深度按层递进。', variant: 0 },
      { verdict: 'pass', issue: '遮挡边界清楚', detail: '门框边缘没有向背景泄漏。', variant: 1 },
      { verdict: 'reject', issue: '候选含深度空洞', detail: '遮挡区域出现未预测的黑洞。', variant: 2 },
      { verdict: 'reject', issue: '候选近远翻转', detail: '局部前景被错误放到背景之后。', variant: 3 },
    ],
  },
  {
    id: 'normal', label: 'Normal', role: '描述表面朝向，辅助几何与材质判断。', check: '检查相邻表面朝向是否突翻', color: '#5b7f68',
    samples: [
      { verdict: 'pass', issue: '朝向平滑', detail: '同一平面上的法线方向连续。', variant: 0 },
      { verdict: 'pass', issue: '棱角保持', detail: '墙角处保留明确的方向变化。', variant: 1 },
      { verdict: 'reject', issue: '候选局部翻转', detail: '一块表面法线突然朝向相反。', variant: 2 },
      { verdict: 'reject', issue: '候选法线噪声', detail: '平整墙面出现无规律方向抖动。', variant: 3 },
    ],
  },
  {
    id: 'gaussian', label: '3DGS', role: '第二阶段把共享几何变成可渲染高斯属性。', check: '检查渲染中漂浮与重复高斯', color: '#d97706',
    samples: [
      { verdict: 'pass', issue: '渲染结构稳定', detail: '高斯贴合房间表面，没有明显漂浮物。', variant: 0 },
      { verdict: 'pass', issue: '轮廓与纹理收敛', detail: '门框边缘和墙面纹理可稳定重投影。', variant: 1 },
      { verdict: 'reject', issue: '候选含漂浮高斯', detail: '天空或空白区域出现游离高斯。', variant: 2 },
      { verdict: 'reject', issue: '候选含重复高斯', detail: '同一轮廓被重复覆盖并产生重影。', variant: 3 },
    ],
  },
];

const stepCopy: Record<string, string> = {
  rgb: '先把三张 RGB 观察编码为必需 token。',
  pose: 'Pose token 接入：为每张图补充拍摄位置与朝向。',
  intrinsics: 'K token 接入：补充焦距、主点与像素射线约束。',
  depth: 'Depth token 接入：补充局部距离先验。',
  shared: '全部可用 token 进入同一个 Global-local Transformer，共享跨视图空间理解。',
  heads: '共享特征同时分流到五个专用输出头；它们不是五次独立重建。',
  done: '五类产物验收完成。点击任一输出，可复查它的职责与常见坏候选。',
};

function chooseSample(output: OutputDef, verdict?: InspectionSample['verdict']) {
  const pool = verdict ? output.samples.filter((sample) => sample.verdict === verdict) : output.samples;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createInspectionResults() {
  const celebrate = Math.random() < 0.2;
  const results = Object.fromEntries(outputs.map((output) => [output.id, chooseSample(output, celebrate ? 'pass' : undefined)])) as Record<OutputId, InspectionSample>;
  if (!celebrate && outputs.every((output) => results[output.id].verdict === 'pass')) {
    const fallback = outputs[Math.floor(Math.random() * outputs.length)];
    results[fallback.id] = chooseSample(fallback, 'reject');
  }
  return results;
}

const OutputPreviewCanvas: React.FC<{ output: OutputDef; sample: InspectionSample; active: boolean; revealed: boolean }> = ({ output, sample, active, revealed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 180;
    const height = 82;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#eef3f7';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#d5e4cf';
    ctx.fillRect(0, 51, width, 31);
    ctx.strokeStyle = '#8996a8';
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 6.5, width - 13, height - 13);

    if (!revealed) {
      ctx.strokeStyle = '#9aa8b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(38, 22, 104, 34);
      ctx.setLineDash([]);
      ctx.fillStyle = '#68778f';
      ctx.font = '700 11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待输出头生成候选', 90, 43);
      ctx.textAlign = 'left';
      return;
    }

    const verdictColor = sample.verdict === 'pass' ? '#228d5c' : '#c2414b';

    if (output.id === 'camera') {
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      [[32, 60], [89, 62], [146, 60]].forEach(([x, y], index) => {
        const shift = sample.verdict === 'reject' && index === 2 ? sample.variant === 3 ? 14 : 8 : 0;
        ctx.beginPath();
        ctx.moveTo(x + shift, y);
        ctx.lineTo(x - 12 + shift, 27);
        ctx.lineTo(x + 12 + shift, 27);
        ctx.closePath();
        ctx.strokeStyle = shift ? verdictColor : '#27446e';
        ctx.stroke();
      });
      ctx.strokeStyle = verdictColor;
      ctx.strokeRect(sample.verdict === 'reject' ? 112 : 74, 24, sample.variant === 3 ? 42 : 32, 27);
    } else if (output.id === 'pointmap') {
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 11; col += 1) {
          const broken = sample.verdict === 'reject' && sample.variant === 3 && col > 6 && row > 2;
          if (broken) continue;
          ctx.fillStyle = '#228d5c';
          ctx.beginPath();
          ctx.arc(28 + col * 11, 18 + row * 8, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (sample.verdict === 'reject') {
        ctx.fillStyle = verdictColor;
        [[151, 18], [160, 32], [145, 66], [20, 11]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
      }
    } else if (output.id === 'depth') {
      const bands = ['#dceaf6', '#9ebed4', '#6589a5', '#365d7d'];
      bands.forEach((color, index) => {
        ctx.fillStyle = color;
        const target = sample.verdict === 'reject' && sample.variant === 3 ? (3 - index) : index;
        ctx.fillRect(18 + target * 36, 15, 30, 52);
      });
      if (sample.verdict === 'reject' && sample.variant === 2) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(87, 30, 20, 18);
      }
    } else if (output.id === 'normal') {
      const origins = [[38, 55], [74, 55], [110, 55], [146, 55]];
      origins.forEach(([x, y], index) => {
        ctx.fillStyle = index % 2 ? '#bad7c7' : '#d6e8dc';
        ctx.fillRect(x - 15, y - 29, 30, 32);
        const flipped = sample.verdict === 'reject' && (sample.variant === 3 ? index > 1 : index === 2);
        ctx.strokeStyle = flipped ? verdictColor : '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + (flipped ? -8 : 8), y - (flipped ? -1 : 27));
        ctx.stroke();
      });
    } else {
      for (let index = 0; index < 30; index += 1) {
        const x = 28 + (index * 37) % 122;
        const y = 25 + (index * 19) % 40;
        ctx.fillStyle = index % 3 === 0 ? '#d97706' : index % 3 === 1 ? '#7d9a76' : '#8aa6bd';
        ctx.globalAlpha = .65;
        ctx.beginPath();
        ctx.ellipse(x, y, 4.5, 2.8, index * .2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (sample.verdict === 'reject') {
        ctx.fillStyle = verdictColor;
        const floaters = sample.variant === 3 ? [[42, 15], [65, 18], [91, 13], [118, 18], [142, 11]] : [[38, 14], [102, 12], [150, 20]];
        floaters.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
      }
    }

    ctx.globalAlpha = active ? 1 : .45;
    ctx.fillStyle = verdictColor;
    ctx.fillRect(7, 70, width - 14, 5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = verdictColor;
    ctx.fillRect(126, 8, 45, 17);
    ctx.fillStyle = '#fff';
    ctx.font = '800 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sample.verdict === 'pass' ? '✓ 通过' : '× 错误', 148.5, 20);
    ctx.textAlign = 'left';
  }, [active, output, revealed, sample]);

  return <canvas ref={canvasRef} className="reconstruction-output-canvas is-ready" aria-hidden="true" />;
};

export const HyArchitecture: React.FC<WidgetProps> = () => {
  const [activePriors, setActivePriors] = useState<PriorId[]>([]);
  const [runSteps, setRunSteps] = useState<StepId[]>(['idle']);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(false);
  const [focusOutput, setFocusOutput] = useState<OutputId>('camera');
  const [inspectionResults, setInspectionResults] = useState<Record<OutputId, InspectionSample>>(() => createInspectionResults());
  const fireworksRef = useRef<HTMLCanvasElement>(null);
  const stage = runSteps[cursor] ?? 'idle';
  const stageIndex = (id: StepId) => runSteps.indexOf(id);
  const reached = (id: StepId) => stageIndex(id) >= 0 && cursor >= stageIndex(id);
  const activeInspection = stage.startsWith('inspect-') ? stage.slice(8) : '';
  const checkedOutputs = useMemo(
    () => outputs.filter((output) => reached(`inspect-${output.id}`)).map((output) => output.id),
    [cursor, runSteps],
  );

  useEffect(() => {
    if (!running) return;
    if (cursor >= runSteps.length - 1) { setRunning(false); return; }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), stage.startsWith('inspect-') ? 720 : 560);
    return () => window.clearTimeout(timer);
  }, [cursor, runSteps, running, stage]);

  useEffect(() => {
    if (activeInspection) setFocusOutput(activeInspection as OutputId);
  }, [activeInspection]);

  const toggle = (id: PriorId) => {
    if (running) return;
    setActivePriors((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setRunSteps(['idle']);
    setCursor(0);
    setFocusOutput('camera');
  };

  const run = (forceAllPass = false) => {
    const selected = priors.filter((prior) => activePriors.includes(prior.id)).map((prior) => prior.id);
    setInspectionResults(forceAllPass
      ? Object.fromEntries(outputs.map((output) => [output.id, chooseSample(output, 'pass')])) as Record<OutputId, InspectionSample>
      : createInspectionResults());
    setRunSteps(['rgb', ...selected, 'shared', 'heads', ...outputs.map((output) => `inspect-${output.id}` as StepId), 'done']);
    setCursor(0);
    setFocusOutput('camera');
    setRunning(true);
  };

  const selectedPriorDetails = priors.filter((prior) => activePriors.includes(prior.id));
  const hasRun = stage !== 'idle';
  const resultBoundary = activePriors.length === 0
    ? '仅 RGB 也是合法输入：模型必须自己估计相机与几何。'
    : activePriors.length === 3
      ? '全部先验已接入，对应 Table 11 可核对的另一端点。'
      : '部分先验会约束歧义，但论文没有在 Table 11 为这个组合报告可插值数值。';
  const currentOutput = outputs.find((output) => output.id === focusOutput) ?? outputs[0];
  const currentSample = inspectionResults[currentOutput.id];
  const allPassed = stage === 'done' && outputs.every((output) => inspectionResults[output.id].verdict === 'pass');
  const stageMessage = activeInspection
    ? currentSample.verdict === 'reject'
      ? `正在验收 ${currentOutput.label}：${currentOutput.check}；发现“${currentSample.issue}”，退回这个教学坏候选。`
      : `正在验收 ${currentOutput.label}：${currentOutput.check}；当前教学候选通过，不执行丢弃。`
    : stepCopy[stage] ?? '先选择手头已有的先验，再播放一次完整重建。';

  useEffect(() => {
    if (!allPassed) return;
    const canvas = fireworksRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = ['#228d5c', '#d97706', '#7c3aed', '#2c73b8', '#e25555'];
    const bursts = [
      { x: rect.width * .22, y: rect.height * .35 },
      { x: rect.width * .5, y: rect.height * .2 },
      { x: rect.width * .78, y: rect.height * .38 },
      { x: rect.width * .5, y: rect.height * .56 },
    ];
    const particles = bursts.flatMap((burst, burstIndex) => Array.from({ length: 42 }, (_, index) => {
      const angle = index / 42 * Math.PI * 2;
      const speed = 52 + (index % 8) * 8;
      return { x: burst.x, y: burst.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: colors[(index + burstIndex) % colors.length] };
    }));
    const started = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = (now - started) / 1000;
      const fade = Math.max(0, 1 - elapsed / 3.4);
      ctx.clearRect(0, 0, rect.width, rect.height);
      particles.forEach((particle) => {
        const x = particle.x + particle.vx * elapsed;
        const y = particle.y + particle.vy * elapsed + 48 * elapsed * elapsed;
        ctx.globalAlpha = fade;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x, y, 3.1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (elapsed < 3.4) frame = window.requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, rect.width, rect.height);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [allPassed]);

  return <div className="architecture-rebuild">
    <div className="learning-contract">
      <div><span>为什么学</span><p>五类输出共享同一份跨视图空间理解。</p></div>
      <div><span>本次操作</span><p>选择先验，运行并检查五个输出头。</p></div>
      <div><span>应得判断</span><p>先验可缺省；共享骨干只前向一次。</p></div>
    </div>

    <section className="reconstruction-brief">
      <header><span>固定委托</span><strong>把三张室内照片交付为可进入 WorldLens 的几何资产</strong></header>
      <div className="reconstruction-brief-views"><i>V1</i><i>V2</i><i>V3</i><b>多视图 RGB 永远必需</b></div>
      <div className="reconstruction-prior-console">
        <span>把手头已有的证据接入输入</span>
        {priors.map((prior) => <button key={prior.id} type="button" disabled={running} className={activePriors.includes(prior.id) ? 'selected' : ''} aria-pressed={activePriors.includes(prior.id)} onClick={() => toggle(prior.id)}><b>{prior.short}</b><small>{prior.label}</small></button>)}
        <button type="button" className="reconstruction-run" disabled={running} onClick={() => run(false)}><span aria-hidden="true">{running ? '●' : '▶'}</span>{running ? '流程播放中' : hasRun ? '重新播放' : '执行重建'}</button>
        <button type="button" className="reconstruction-celebrate" disabled={running} onClick={() => run(true)} title="让五个教学候选全部通过，并预览烟花"><span aria-hidden="true">✦</span>全绿预览</button>
      </div>
      <p>{selectedPriorDetails.length === 0 ? '当前不提供额外先验。训练时每种先验以 0.5 概率独立丢弃，因此这不是非法输入。' : selectedPriorDetails.map((prior) => prior.effect).join(' ')}</p>
    </section>

    <section className={`reconstruction-flowboard reconstruction-vertical ${reached('heads') ? 'heads-ready' : ''} ${allPassed ? 'all-pass' : ''}`} aria-live="polite">
      <canvas ref={fireworksRef} className="reconstruction-fireworks is-ready" aria-hidden="true" />
      <header><div><span>竖排输入 → 共享空间理解 → 竖排五步检验</span><strong>Any-Modal 共享重建与随机候选巡检</strong></div><p>{stageMessage}</p></header>
      <div className="reconstruction-vertical-system">
        <section className="reconstruction-input-column">
          <header><span>输入证据</span><strong>按可用性逐项接入</strong><small>RGB 必需，Pose / K / Depth 可缺省</small></header>
          <div className="reconstruction-input-stack">
            <article className={reached('rgb') ? 'accepted active' : ''}><span>01</span><b>RGB</b><small>三张必需观察</small><i>{reached('rgb') ? '已编码' : '等待接入'}</i></article>
            {priors.map((prior, index) => {
              const selected = activePriors.includes(prior.id);
              return <article key={prior.id} className={`${selected ? 'selected' : 'skipped'} ${reached(prior.id) ? 'accepted active' : ''}`}><span>0{index + 2}</span><b>{prior.short}</b><small>{selected ? prior.label : `${prior.label}缺省`}</small><i>{selected && reached(prior.id) ? '已接入' : selected ? '等待' : '跳过'}</i></article>;
            })}
          </div>
        </section>

        <span className={reached('shared') ? 'reconstruction-pipeline-arrow active' : 'reconstruction-pipeline-arrow'} aria-hidden="true">→</span>

        <div className={`reconstruction-shared-core reconstruction-center-core ${reached('shared') ? 'accepted' : ''}`}>
          <span>05 · Shared Transformer</span>
          <strong>Global-local 跨视图理解</strong>
          <i />
          <small>{reached('shared') ? '共享对应关系与几何上下文已建立' : '等待左侧 token'}</small>
          <b>一次共享前向</b>
        </div>

        <span className={reached('heads') ? 'reconstruction-pipeline-arrow active' : 'reconstruction-pipeline-arrow'} aria-hidden="true">→</span>

        <section className="reconstruction-inspection-column">
          <header><span>五步检验</span><strong>每次执行随机抽取候选</strong><small>每个输出都有多种正确与错误画布</small></header>
          <div className="reconstruction-inspection-list">
            {outputs.map((output, index) => {
              const sample = inspectionResults[output.id];
              const checking = activeInspection === output.id;
              const checked = checkedOutputs.includes(output.id) && !checking;
              return <button
                key={output.id}
                type="button"
                disabled={!reached('heads')}
                className={`${focusOutput === output.id && reached('heads') ? 'selected' : ''} ${sample.verdict} ${checking ? 'checking' : ''} ${checked ? 'checked' : ''}`}
                onClick={() => setFocusOutput(output.id)}
                style={{ '--output-color': output.color } as React.CSSProperties}
              >
                <span className="inspection-order">0{index + 1}</span>
                <OutputPreviewCanvas output={output} sample={sample} active={checking || checked} revealed={reached('heads')} />
                <span className="output-card-copy">
                  <span className="output-card-title"><strong>{output.label}</strong><b>{checking ? sample.verdict === 'reject' ? '发现错误' : '扫描通过' : checked ? sample.verdict === 'reject' ? '已退回' : '可交付' : '待检'}</b></span>
                  <small>{output.check}</small>
                  <em>{sample.issue}</em>
                </span>
              </button>;
            })}
          </div>
        </section>
      </div>
      {allPassed ? <div className="reconstruction-easter-egg"><strong>隐藏彩蛋：五项全绿，镜界烟花已释放</strong><span>随机候选本轮全部通过；再次执行会重新抽取。</span></div> : null}
    </section>

    <div className="reconstruction-inspection-note">
      <span>教学验收示意</span>
      <strong>{currentOutput.label}：{currentOutput.role}</strong>
      <p>{currentSample.verdict === 'reject' ? `本轮“${currentSample.issue}”会被标记并退回：${currentSample.detail}` : `本轮“${currentSample.issue}”通过检查并保留：${currentSample.detail}`} 这只是解释每类产物应检查什么，不是声称论文新增了统一自动验收网络。</p>
    </div>

    <div className={`feedback ${allPassed || stage === 'done' && activePriors.length === 3 ? 'good' : ''}`}>{!hasRun ? '先配置现有证据并执行重建。每次运行都会为五个输出重新抽取候选。' : allPassed ? `${resultBoundary} 本轮五项候选全部通过，已触发隐藏烟花；这不代表真实系统必然一次全对。` : `${resultBoundary} 有问题的候选会退回，正常候选直接保留，再进入后续深度对齐与 3DGS 资产优化。`}</div>
    <SectionExtras>
      <section className="architecture-evidence-strip"><header><span>Table 11 · 7-Scenes 高分辨率端点</span><strong>Acc. / Comp. 越低越好</strong></header><div className="architecture-evidence-pair"><div className={hasRun && activePriors.length === 0 ? 'active' : ''}><span>仅图像</span><strong>Acc. 0.037 · Comp. 0.040</strong><small>WorldMirror 2.0，756×1036</small></div><i>→</i><div className={hasRun && activePriors.length === 3 ? 'active' : ''}><span>图像 + 全部先验</span><strong>Acc. 0.012 · Comp. 0.016</strong><small>Pose + K + Depth</small></div></div><p>论文没有在 Table 11 报告所有部分先验组合，不能对中间状态插值出数字。</p></section>
      <div className="architecture-glossary-grid"><details><summary>为什么共享骨干？</summary><p>相机、深度与点图都依赖同一跨视图对应关系，共享特征可避免每个任务重复学习空间匹配。</p></details><details><summary>为什么还要多个头？</summary><p>相机是全局参数，点图、深度、法线是像素级几何，3DGS 是可渲染属性，它们需要不同解码形式和监督。</p></details><details><summary>3DGS 为何第二阶段训练？</summary><p>论文先联合训练几何头，再冻结几何参数单独训练 3DGS 头，以解耦几何学习与外观建模。</p></details></div>
      <div className="evidence-media-stack"><EvidenceMediaDrawer mediaType="论文原图" src="./images/figure-12-worldmirror.png" title="论文 Figure 12：WorldMirror 2.0 架构" caption="用于核对 Any-Modal 输入、共享骨干和多输出头的真实连接。" alt="WorldMirror 2.0 架构原图"/><EvidenceMediaDrawer mediaType="官方 GIF" src="./images/official-reconstruction.gif" title="多图与视频重建演示" caption="官方演示帮助理解最终任务流程，不替代论文指标。" alt="官方多视图重建演示" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗"/></div>
      <PaperTable tableId="table-11"/>
    </SectionExtras>
  </div>;
};

export default HyArchitecture;
