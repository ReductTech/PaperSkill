import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useAutoSequence } from '../lib/useAutoSequence';
import { MVL, clearPitchScene, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

type Phase = 'visual' | 'multimodal';

const STEPS = [
  {
    phase: 'visual' as Phase,
    title: '可变分辨率图像',
    train: ['Mage-ViT'],
    why: '先让视觉编码器建立稳定的空间表示，并适应 224–448 的可变分辨率。',
    frozen: [],
    data: '可变分辨率图像',
  },
  {
    phase: 'visual' as Phase,
    title: '联合图像与视频',
    train: ['Mage-ViT'],
    why: '在空间表示之上加入时间变化，并激活 codec 驱动的时间稀疏化。',
    frozen: [],
    data: '图像 + 视频；视频设置为 64 帧 / 4096 token',
  },
  {
    phase: 'multimodal' as Phase,
    title: '图文描述对齐',
    train: ['Mage-ViT', 'MLP', 'Qwen'],
    why: '视觉编码器已经能看，接下来先把视觉表示对齐到语言空间。',
    frozen: [],
    data: '约 3.5 亿图像 caption + 420 万短视频 caption',
  },
  {
    phase: 'multimodal' as Phase,
    title: '指令与短时定位',
    train: ['Mage-ViT', 'MLP', 'Qwen'],
    why: '在描述能力之上加入指令跟随，并学习 30–180 秒视频中的局部时间定位。',
    frozen: [],
    data: '约 5400 万图像指令 + 340 万视频 caption',
  },
  {
    phase: 'multimodal' as Phase,
    title: '扩展时间视野',
    train: ['Mage-ViT', 'MLP', 'Qwen'],
    why: '短视频能力稳定后，再学习中长视频中的事件顺序、状态变化与跨段依赖。',
    frozen: [],
    data: '混合保留图像、空间、GUI、短视频与中长视频数据',
  },
  {
    phase: 'multimodal' as Phase,
    title: 'Codec 长上下文',
    train: ['Mage-ViT', 'MLP', 'Qwen'],
    why: '把长视频转换为 codec-native rolling token windows，适应不规则的稀疏视觉序列。',
    frozen: [],
    data: '35 万长视频 caption + 保留图像指令数据',
  },
  {
    phase: 'multimodal' as Phase,
    title: '主动流式门控',
    train: ['Gate'],
    why: '主干已经会看、会理解、会生成，最后只学习什么时候应该触发回答。',
    frozen: ['Mage-ViT', 'EPFE', 'MLP', 'Qwen'],
    data: '约 335 万 streaming samples',
  },
];

const COMPONENTS = ['Mage-ViT', 'EPFE', 'MLP', 'Qwen', 'Gate'];

function phaseName(phase: Phase) {
  return phase === 'visual' ? 'Mage-ViT 视觉预训练' : 'Mage-VL 多模态课程';
}

export const TrainingCurriculumStepper: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const auto = useAutoSequence(STEPS.length, step, setStep, 1500);
  const current = STEPS[step];
  const phaseColor = current.phase === 'visual' ? MVL.blue : MVL.green;
  const frozenText = current.frozen.length > 0 ? current.frozen.join('、') : '本阶段未单列冻结组件';

  const ref = useCanvasSurface(760, 250, (ctx) => {
    clearPitchScene(ctx, 760, 250);
    drawSceneLabel(ctx, `第 ${step + 1} 步 · ${current.title}`, 28, 27, phaseColor);

    ctx.strokeStyle = MVL.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(58, 72);
    ctx.lineTo(702, 72);
    ctx.stroke();
    STEPS.forEach((item, index) => {
      const x = 58 + index * (644 / 6);
      const color = item.phase === 'visual' ? MVL.blue : MVL.green;
      ctx.fillStyle = index <= step ? color : MVL.white;
      ctx.strokeStyle = index <= step ? color : MVL.line;
      ctx.lineWidth = index === step ? 4 : 2;
      ctx.beginPath();
      ctx.arc(x, 72, index === step ? 12 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = index <= step ? MVL.white : MVL.muted;
      ctx.font = '800 10px "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, x, 76);
    });

    COMPONENTS.forEach((component, index) => {
      const x = 28 + index * 144;
      const y = 126;
      const isTraining = current.train.includes(component);
      const isFrozen = current.frozen.includes(component);
      ctx.fillStyle = isTraining ? 'rgba(34,141,92,.13)' : isFrozen ? 'rgba(92,102,122,.08)' : MVL.white;
      roundRect(ctx, x, y, 124, 76, 8);
      ctx.fill();
      ctx.strokeStyle = isTraining ? MVL.green : isFrozen ? MVL.muted : MVL.line;
      ctx.lineWidth = isTraining ? 2.5 : 1.5;
      ctx.setLineDash(isFrozen ? [5, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MVL.ink;
      ctx.font = '800 13px "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText(component, x + 62, y + 30);
      ctx.fillStyle = isTraining ? MVL.green : isFrozen ? MVL.muted : '#9aa5b7';
      ctx.font = '700 11px "Segoe UI"';
      ctx.fillText(isTraining ? '本步训练' : isFrozen ? '保持冻结' : '未参与本步更新', x + 62, y + 53);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11px "Segoe UI"';
    ctx.fillText(phaseName(current.phase), 28, 229);
  }, [step], false);

  return (
    <div className="mvl-widget">
      <div className="mvl-curriculum-overview" role="group" aria-label="选择训练课程">
        <button className={current.phase === 'visual' ? 'active visual' : 'visual'} onClick={() => auto.select(0)}>
          <span>课程一</span><strong>2 个 Mage-ViT 阶段</strong><small>先学会稳定地看</small>
        </button>
        <button className={current.phase === 'multimodal' ? 'active multimodal' : 'multimodal'} onClick={() => auto.select(2)}>
          <span>课程二</span><strong>5 个 Mage-VL 阶段</strong><small>再学会对齐、理解与主动开口</small>
        </button>
      </div>
      <div className="mvl-training-rail" role="tablist" aria-label="七个训练阶段">
        {STEPS.map((item, index) => (
          <button
            role="tab"
            aria-selected={index === step}
            key={item.title}
            className={`${index === step ? 'active ' : ''}${item.phase}`}
            onClick={() => auto.select(index)}
          >
            <span>{index + 1}</span>{item.title}
          </button>
        ))}
      </div>
      <canvas ref={ref} width={760} height={250} role="img" aria-label={`第 ${step + 1} 步 ${current.title}：训练 ${current.train.join('、')}；冻结 ${frozenText}`}>两阶段视觉预训练与五阶段多模态训练课程。</canvas>
      <div className="mvl-training-answers">
        <div><span>现在训练谁</span><strong>{current.train.join('、')}</strong></div>
        <div><span>为什么现在训练</span><p>{current.why}</p></div>
        <div><span>哪些组件冻结</span><strong>{frozenText}</strong></div>
      </div>
      <p className="mvl-training-data">数据与设置：{current.data}</p>
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 0} onClick={() => auto.select(step - 1)}>上一步</button>
        <span className="step-label">第 <b>{step + 1}</b>/7 步 · {phaseName(current.phase)}</span>
        <button className="tiny" disabled={step === 6} onClick={() => auto.select(step + 1)}>下一步</button>
        <button className="tiny ghost mvl-play-control" onClick={auto.toggle} aria-pressed={auto.playing}>{auto.playing ? '暂停课程' : '自动走完七步'}</button>
        <button className="tiny ghost" onClick={() => auto.select(0)}>重新开始</button>
      </div>
    </div>
  );
};
