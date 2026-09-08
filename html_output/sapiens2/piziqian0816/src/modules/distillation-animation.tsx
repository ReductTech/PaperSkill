import React from 'react';
import { useTimeline } from '../lib/useTimeline';
import type { WidgetProps } from './registry';

const stages = ['生成 2+4 个视图', '所有视图进入 Student', 'global 进入 EMA Teacher', 'global↔global 监督', 'global→local 监督', 'EMA 更新与 stop-gradient'];

type PaperCropProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  badge: string;
  src: string;
  kind: 'global' | 'local';
};

function PaperCrop({ x, y, width, height, label, badge, src, kind }: PaperCropProps) {
  const clipId = `distill-${badge.toLowerCase()}`;
  const accent = kind === 'global' ? '#2177b3' : '#13494b';
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height} rx="7" /></clipPath></defs>
      <rect x={x - 2} y={y - 2} width={width + 4} height={height + 4} rx="9" fill="#fff" stroke={accent} strokeWidth="2.5" />
      <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
      <rect x={x + 5} y={y + 5} width={kind === 'global' ? 28 : 25} height="17" rx="5" fill={accent} opacity="0.94" />
      <text x={x + (kind === 'global' ? 19 : 17.5)} y={y + 17} textAnchor="middle" fill="#fff" className="svg-crop-badge">{badge}</text>
      <text x={x + width / 2} y={y + height + 14} textAnchor="middle" className="svg-tiny">{label}</text>
    </g>
  );
}

export const DistillationAnimation: React.FC<WidgetProps> = () => {
  const { progress, playing, toggle } = useTimeline(17000);
  const stage = Math.min(stages.length - 1, Math.floor(progress * stages.length));
  return (
    <div className="timeline-widget">
      <svg className="distill-svg" viewBox="0 0 880 470" role="img" aria-label="Sapiens2 Student Teacher 跨视图自蒸馏动画">
        <defs>
          <marker id="blue-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#2177b3" /></marker>
          <marker id="orange-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#c19150" /></marker>
          <marker id="gray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#aebcbc" /></marker>
        </defs>
        <rect width="880" height="470" rx="16" fill="#fff" />
        <text x="28" y="32" className="svg-title">{stage + 1}. {stages[stage]}</text>
        <text x="90" y="58" textAnchor="middle" className="svg-kicker">Figure 4 同图裁剪</text>
        <PaperCrop x={28} y={76} width={122} height={82} label="global view 1" badge="G1" src="./paper/distill-global-1.png" kind="global" />
        <PaperCrop x={28} y={184} width={122} height={82} label="global view 2" badge="G2" src="./paper/distill-global-2.png" kind="global" />
        <PaperCrop x={26} y={304} width={58} height={43} label="local 1 · 人脸" badge="L1" src="./paper/distill-local-1-face.png" kind="local" />
        <PaperCrop x={96} y={304} width={58} height={43} label="local 2 · 花束" badge="L2" src="./paper/distill-local-2-flowers.png" kind="local" />
        <PaperCrop x={26} y={370} width={58} height={43} label="local 3 · 躯干" badge="L3" src="./paper/distill-local-3-torso.png" kind="local" />
        <PaperCrop x={96} y={370} width={58} height={43} label="local 4 · 围裙" badge="L4" src="./paper/distill-local-4-apron.png" kind="local" />

        <g className={stage >= 1 ? 'active-block' : ''}>
          <rect x="300" y="92" width="184" height="108" rx="14" fill="#c7dcea" stroke="#2177b3" strokeWidth="3" />
          <text x="392" y="130" textAnchor="middle" className="svg-block-title blue">Student encoder</text>
          <text x="392" y="156" textAnchor="middle" className="svg-small">2 global + 4 local</text>
          <text x="392" y="180" textAnchor="middle" className="svg-small blue">梯度流入 ✓</text>
        </g>
        <g opacity={stage >= 2 ? 1 : 0.35}>
          <rect x="300" y="286" width="184" height="108" rx="14" fill="#fccb89" stroke="#c19150" strokeWidth="3" strokeDasharray="8 6" />
          <text x="392" y="324" textAnchor="middle" className="svg-block-title orange">EMA Teacher encoder</text>
          <text x="392" y="350" textAnchor="middle" className="svg-small">仅 2 global</text>
          <text x="392" y="374" textAnchor="middle" className="svg-small orange">stop-gradient ⊘</text>
        </g>

        {stage >= 1 ? <g stroke="#2177b3" strokeWidth="2.5" fill="none" markerEnd="url(#blue-arrow)"><path d="M150 117 C215 117 246 125 294 137" /><path d="M150 225 C220 215 250 185 294 170" /><path d="M84 326 C190 315 250 205 294 181" /><path d="M154 326 C215 300 260 205 294 181" /><path d="M84 392 C205 370 255 215 294 185" /><path d="M154 392 C230 365 270 220 296 187" /></g> : null}
        {stage >= 2 ? <g stroke="#c19150" strokeWidth="2.5" strokeDasharray="6 5" fill="none" markerEnd="url(#orange-arrow)"><path d="M150 117 C220 145 246 286 294 323" /><path d="M150 225 C230 244 260 306 294 342" /></g> : null}

        <g>
          <rect x="572" y="78" width="270" height="320" rx="14" fill="#c7dcea" stroke="#c7dcea" />
          <text x="707" y="108" textAnchor="middle" className="svg-kicker">允许与禁用的匹配</text>
          <g opacity={stage >= 3 ? 1 : 0.3}>
            <path d="M612 153 H798" stroke="#2177b3" strokeWidth="3" markerEnd="url(#blue-arrow)" /><text x="705" y="140" textAnchor="middle" className="svg-small blue">Teacher g1 → Student g2</text>
            <path d="M798 184 H612" stroke="#2177b3" strokeWidth="3" markerEnd="url(#blue-arrow)" /><text x="705" y="208" textAnchor="middle" className="svg-small blue">Teacher g2 → Student g1</text>
          </g>
          <g opacity={stage >= 4 ? 1 : 0.3}>
            {[0,1,2,3].map((item) => <path key={item} d={`M620 ${252 + item * 18} H${760 + item * 10}`} stroke="#13494b" strokeWidth="2" markerEnd="url(#blue-arrow)" />)}
            <text x="705" y="238" textAnchor="middle" className="svg-small">Teacher global → Student local 1–4</text>
          </g>
          <g opacity={stage >= 4 ? 1 : 0.3}>
            <path d="M620 340 H790" stroke="#aebcbc" strokeWidth="3" strokeDasharray="7 5" /><text x="705" y="330" textAnchor="middle" className="svg-small muted">同一 global 自匹配：禁用</text><text x="705" y="367" textAnchor="middle" className="svg-small muted">local ↔ local：禁用</text>
          </g>
        </g>
        {stage >= 5 ? <g><path d="M486 198 C548 228 548 270 486 302" stroke="#c19150" strokeWidth="3" fill="none" markerEnd="url(#orange-arrow)" /><text x="535" y="252" textAnchor="middle" className="svg-small orange">EMA 参数更新</text></g> : null}
        <g className="stage-track">{stages.map((label, index) => <g key={label}><circle cx={52 + index * 152} cy="440" r="7" fill={index <= stage ? '#2177b3' : '#c7dcea'} /><text x={52 + index * 152} y="461" textAnchor="middle" className="svg-tiny">{label}</text></g>)}</g>
      </svg>
      <div className="timeline-control"><button onClick={toggle}>{progress >= 1 ? '重新播放' : playing ? '暂停' : '继续播放'}</button><span><i style={{ width: `${progress * 100}%` }} /></span></div>
    </div>
  );
};
