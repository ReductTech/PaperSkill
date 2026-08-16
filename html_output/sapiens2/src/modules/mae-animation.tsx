import React from 'react';
import { useTimeline } from '../lib/useTimeline';
import type { WidgetProps } from './registry';

const stageLabels = ['图像切块', '随机遮挡 75%', '编码可见 patch', '插入 mask token', 'decoder 重建', '只计算 masked loss'];

export const MaeAnimation: React.FC<WidgetProps> = () => {
  const { progress, playing, toggle, seek } = useTimeline(14000);
  const stage = Math.min(stageLabels.length - 1, Math.floor(progress * stageLabels.length));

  const selectStage = (index: number) => {
    const stageStart = index / stageLabels.length;
    if (!playing && stage === index) {
      seek(stageStart, true);
      return;
    }
    seek(stageStart, false);
  };

  const onStageKeyDown = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectStage(index);
    }
  };

  return (
    <div className="timeline-widget">
      <svg className="mae-svg" viewBox="0 0 920 450" role="img" aria-label="使用 Sapiens 论文原图演示 MAE 遮挡编码与重建">
        <defs>
          <marker id="mae-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#2177b3" /></marker>
          <filter id="mae-card-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#13494b" floodOpacity="0.12" /></filter>
        </defs>
        <rect width="920" height="450" rx="16" fill="#fff" />
        <text x="30" y="34" className="svg-title">{stage + 1}. {stageLabels[stage]}</text>
        <g className="stat-box">
          <rect x="718" y="12" width="172" height="58" rx="9" fill="#c7dcea" stroke="#c7dcea" />
          <text x="731" y="34">4096 patches · 1024 visible</text><text x="731" y="55">Mask Ratio 75%</text>
        </g>

        <g filter="url(#mae-card-shadow)">
          <rect x="28" y="80" width="188" height="210" rx="11" fill="#fff" stroke={stage === 0 ? '#2177b3' : '#c7dcea'} strokeWidth={stage === 0 ? 3 : 1.5} />
          <image href="./paper/mae-ground-truth.png" x="36" y="88" width="172" height="174" preserveAspectRatio="xMidYMid slice" />
          <rect x="36" y="88" width="172" height="174" fill="none" stroke="#fff" opacity="0.65" />
          {stage === 0 ? <g opacity="0.82">{Array.from({ length: 7 }, (_, index) => <React.Fragment key={index}><line x1={36 + (index + 1) * 21.5} y1="88" x2={36 + (index + 1) * 21.5} y2="262" stroke="#c7dcea" strokeWidth="0.8" /><line x1="36" y1={88 + (index + 1) * 21.75} x2="208" y2={88 + (index + 1) * 21.75} stroke="#c7dcea" strokeWidth="0.8" /></React.Fragment>)}</g> : null}
          <text x="122" y="278" textAnchor="middle" className="svg-label">Ground Truth</text>
          <text x="122" y="306" textAnchor="middle" className="svg-tiny">原始图像 · 划分 16×16 patch</text>
        </g>

        <path d="M218 184 H252" stroke={stage >= 1 ? '#2177b3' : '#c7dcea'} strokeWidth="3" markerEnd="url(#mae-arrow)" />
        <g opacity={stage >= 1 ? 1 : 0.24} filter="url(#mae-card-shadow)">
          <rect x="260" y="80" width="188" height="210" rx="11" fill="#fff" stroke={stage === 1 || stage === 2 ? (stage === 2 ? '#13494b' : '#ec265a') : '#c7dcea'} strokeWidth={stage === 1 || stage === 2 ? 3 : 1.5} />
          <image href="./paper/mae-masked-75.png" x="268" y="88" width="172" height="174" preserveAspectRatio="xMidYMid slice" />
          <text x="354" y="278" textAnchor="middle" className="svg-label">Mask Ratio 75%</text>
          <text x="354" y="306" textAnchor="middle" className={stage === 2 ? 'svg-tiny green' : 'svg-tiny'}>{stage === 2 ? '彩色区域 = 可见 patch（25%）' : '灰色区域 = 被遮挡 patch（75%）'}</text>
        </g>

        <path d="M450 166 H486" stroke={stage >= 2 ? '#2177b3' : '#c7dcea'} strokeWidth="3" markerEnd="url(#mae-arrow)" />
        <g opacity={stage >= 2 ? 1 : 0.28}>
          <rect x="496" y="112" width="144" height="76" rx="11" fill="#c7dcea" stroke={stage === 2 ? '#2177b3' : '#c7dcea'} strokeWidth={stage === 2 ? 3 : 1.5} />
          <text x="568" y="141" textAnchor="middle" className="svg-label">Transformer encoder</text>
          <text x="568" y="164" textAnchor="middle" className="svg-small">仅编码可见区域 25%</text>
          <path d="M568 191 V214" stroke={stage >= 3 ? '#ec265a' : '#c7dcea'} strokeWidth="3" markerEnd="url(#mae-arrow)" />
          <rect x="496" y="222" width="144" height="58" rx="10" fill="#f9c8d3" stroke={stage === 3 ? '#ec265a' : '#e6acae'} strokeWidth={stage === 3 ? 3 : 1.5} />
          <text x="568" y="247" textAnchor="middle" className="svg-label">插回 mask token</text>
          <text x="568" y="267" textAnchor="middle" className="svg-tiny">恢复完整 patch 位置序列</text>
          <path d="M568 284 V304" stroke={stage >= 4 ? '#13494b' : '#c7dcea'} strokeWidth="3" markerEnd="url(#mae-arrow)" />
          <rect x="496" y="312" width="144" height="54" rx="10" fill="#aebcbc" stroke={stage >= 4 ? '#13494b' : '#aebcbc'} strokeWidth={stage === 4 ? 3 : 1.5} />
          <text x="568" y="335" textAnchor="middle" className="svg-label">Lightweight decoder</text>
          <text x="568" y="354" textAnchor="middle" className="svg-tiny">预测被遮挡像素</text>
        </g>

        <path d="M646 184 H684" stroke={stage >= 4 ? '#13494b' : '#c7dcea'} strokeWidth="3" markerEnd="url(#mae-arrow)" />
        <g opacity={stage >= 4 ? 1 : 0.24} filter="url(#mae-card-shadow)">
          <rect x="692" y="80" width="198" height="210" rx="11" fill="#fff" stroke={stage === 5 ? '#ec265a' : stage === 4 ? '#13494b' : '#c7dcea'} strokeWidth={stage >= 4 ? 3 : 1.5} strokeDasharray={stage === 5 ? '7 5' : undefined} />
          <image href="./paper/mae-reconstruction.png" x="705" y="88" width="172" height="174" preserveAspectRatio="xMidYMid slice" />
          <text x="791" y="278" textAnchor="middle" className="svg-label">MAE Reconstruction</text>
          <text x="791" y="306" textAnchor="middle" className={stage === 5 ? 'svg-tiny red' : 'svg-tiny'}>{stage === 5 ? 'Masked loss：只比较被遮挡位置' : '依据可见上下文重建完整人体'}</text>
        </g>

        {stage === 1 ? <g><path d="M354 76 V92" stroke="#ec265a" strokeWidth="2" markerEnd="url(#mae-arrow)" /><text x="354" y="66" textAnchor="middle" className="svg-small red">原文灰色遮挡提示 + 中文标注</text></g> : null}
        {stage === 2 ? <g><path d="M442 102 C470 82 486 102 505 116" fill="none" stroke="#13494b" strokeWidth="2" markerEnd="url(#mae-arrow)" /><text x="469" y="80" textAnchor="middle" className="svg-small green">仅可见 patch 流向编码器</text></g> : null}
        {stage === 5 ? <g><path d="M440 320 C520 392 705 392 735 314" fill="none" stroke="#ec265a" strokeWidth="2.5" strokeDasharray="6 5" /><text x="592" y="388" textAnchor="middle" className="svg-small red">损失不约束原本可见的 patch</text></g> : null}

        <g className="stage-track">{stageLabels.map((label, index) => <g className={`timeline-node ${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`} role="button" tabIndex={0} aria-label={`${label}：${!playing && index === stage ? '再次点击从此处继续播放' : '点击跳转并停留'}`} onClick={() => selectStage(index)} onKeyDown={(event) => onStageKeyDown(event, index)} key={label}><circle cx={76 + index * 154} cy="410" r={index === stage ? 11 : 8} fill={index <= stage ? '#2177b3' : '#c7dcea'} /><text x={76 + index * 154} y="438" textAnchor="middle" className="svg-tiny">{label}</text></g>)}</g>
      </svg>
      <p className="timeline-node-hint">{playing ? `正在播放：${stageLabels[stage]}。点击任意节点可跳转并停留。` : `已停留：${stageLabels[stage]}。再次点击当前节点可从这里继续播放。`}</p>
      <div className="timeline-control"><button onClick={toggle}>{progress >= 1 ? '重新播放' : playing ? '暂停' : '继续播放'}</button><span><i style={{ width: `${progress * 100}%` }} /></span></div>
    </div>
  );
};
