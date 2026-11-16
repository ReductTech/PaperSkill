import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './seesr-cover';

/** S6 — where the three conditions enter the frozen SD Unet. */
export function SeesrDualBranch(_props: WidgetProps) {
  const [text, setText] = useState(true);
  const [repr, setRepr] = useState(true);
  const [hint, setHint] = useState('');

  const active = (text ? 1 : 0) + (repr ? 1 : 0) + 1;
  const power = (text ? 0.5 : 0) + (repr ? 0.35 : 0) + 0.15;

  const outcome = !text && !repr
    ? '只靠图像条件：对应 StableSR / DiffBIR，细节来自先验，局部语义可能含糊。'
    : !text && repr
      ? '加上软提示：阈值之外的信息由 RCA 补上，但没有显式的物体名。'
      : text && !repr
        ? '加上硬提示：对应 PASD 一类，有了物体名，但受标签阈值限制。'
        : 'SeeSR：硬提示给名字，软提示补信息，图像分支定结构。';

  const feedback = hint || (active === 3
    ? 'TCA 收标签，RCA 收表示，ControlNet 收结构。'
    : '缺一条条件，语义或结构的来源就少一路。');

  const stroke = (on: boolean, color: string) => ({
    stroke: on ? color : C.line,
    strokeWidth: on ? 4 : 2,
    strokeDasharray: on ? undefined : '8 8',
    opacity: on ? 1 : 0.55,
    fill: 'none' as const,
  });

  return (
    <div className="seesr-scene">
      <div className="seesr-branchcol" style={{ left: 0, top: 0, width: 300, height: 622 }}>
        <button type="button" className={`seesr-branch ${text ? 'is-on is-text' : ''}`}
          onClick={() => { setText(!text); setHint(''); }} aria-pressed={text}>
          <b>文本分支</b>
          <span>硬提示 → 冻结文本编码器 → TCA</span>
        </button>
        <button type="button" className={`seesr-branch ${repr ? 'is-on is-repr' : ''}`}
          onClick={() => { setRepr(!repr); setHint(''); }} aria-pressed={repr}>
          <b>表示分支</b>
          <span>软提示 → 表示嵌入 → RCA</span>
        </button>
        <button type="button" className="seesr-branch is-on is-image"
          onClick={() => setHint('图像分支在论文中始终存在：它是结构条件的来源。')} aria-pressed>
          <b>图像分支</b>
          <span>LR → 图像编码器 → ControlNet</span>
        </button>
      </div>

      <svg className="seesr-unet" style={{ left: 316, top: 0, width: 680, height: 622 }} viewBox="0 0 680 622"
        role="img" aria-label={`扩散模型结构：文本分支${text ? '开启' : '关闭'}，表示分支${repr ? '开启' : '关闭'}，图像分支开启`}>
        <rect x="250" y="46" width="250" height="210" rx="14" fill="#ffffff" stroke={C.line} strokeWidth="2" />
        <text x="250" y="38" fill={C.ink} fontSize="26" fontWeight="700">Unet Encoder</text>
        <rect x="250" y="336" width="250" height="210" rx="14" fill="#ffffff" stroke={C.line} strokeWidth="2" />
        <text x="250" y="334" fill={C.ink} fontSize="26" fontWeight="700">Unet Decoder</text>

        <rect x="520" y="120" width="150" height="340" rx="14" fill="#f4f6f8" stroke={C.line} strokeWidth="2" />
        <text x="536" y="172" fill={C.ink} fontSize="26" fontWeight="700">Control</text>
        <text x="536" y="204" fill={C.ink} fontSize="26" fontWeight="700">Net</text>
        <text x="536" y="252" fill={C.muted} fontSize="24">可训练副本</text>

        {[
          { y: 104, tag: 'TCA', on: text, color: C.blue },
          { y: 176, tag: 'RCA', on: repr, color: C.purple },
          { y: 394, tag: 'TCA', on: text, color: C.blue },
          { y: 466, tag: 'RCA', on: repr, color: C.purple },
        ].map((chip) => (
          <g key={`${chip.tag}-${chip.y}`}>
            <rect x="300" y={chip.y - 26} width="120" height="52" rx="26"
              fill={chip.on ? (chip.tag === 'TCA' ? '#dfe8f5' : '#eee6fd') : '#f6f8fc'}
              stroke={chip.on ? chip.color : C.line} strokeWidth="2.5" />
            <text x="360" y={chip.y + 9} textAnchor="middle" fill={chip.on ? chip.color : C.muted} fontSize="26" fontWeight="700">{chip.tag}</text>
          </g>
        ))}
        <text x="300" y="300" fill={C.muted} fontSize="24">RCA 位于 TCA 之后</text>

        <path d="M0 40 H90 V394 H300" {...stroke(text, C.blue)} />
        <path d="M90 104 H300" {...stroke(text, C.blue)} />
        <path d="M0 590 H60 V466 H300" {...stroke(repr, C.purple)} />
        <path d="M60 176 H300" {...stroke(repr, C.purple)} />
        <path d="M520 150 H500" {...stroke(true, C.muted)} />
        <path d="M500 150 H486" fill="none" stroke={C.muted} strokeWidth="4" />
        <path d="M595 580 V462" {...stroke(true, C.muted)} />
        <text x="4" y="30" fill={text ? C.blue : C.muted} fontSize="24">硬提示</text>
        <text x="4" y="616" fill={repr ? C.purple : C.muted} fontSize="24">软提示</text>
        <text x="536" y="580" fill={C.muted} fontSize="24">LR latent</text>
      </svg>

      <div className="seesr-panel" style={{ left: 1012, top: 0, width: 460, height: 372 }}>
        <div className="seesr-h">条件的来源</div>
        <div className="seesr-numbers">
          <span>活跃条件 <b>{active}/3</b></span>
        </div>
        <div className="seesr-meter" aria-label={`语义控制力 ${Math.round(power * 100)}%`}>
          <i className="is-text" style={{ width: `${text ? 50 : 0}%` }} />
          <i className="is-repr" style={{ width: `${repr ? 35 : 0}%` }} />
          <i className="is-image" style={{ width: '15%' }} />
        </div>
        <p className="seesr-muted">语义控制力（示意权重）{Math.round(power * 100)}%</p>
        <p className="seesr-lead">{outcome}</p>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 1012, top: 388, width: 460, height: 234 }}>
        <p className="seesr-feedback is-mid" aria-live="polite">{feedback}</p>
        <div className="seesr-slipmini" aria-hidden="true">
          <span>船</span><span>海</span><span>崖</span><i />
        </div>
      </div>
    </div>
  );
}
