import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'projected2d' | 'depthAware';

export const ImplementationProblems: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('projected2d');
  const depthAware = mode === 'depthAware';

  return (
    <div className="depth-disambiguation">
      <div className="ctrl depth-disambiguation-controls" aria-label="前后景位置编码对比">
        <button
          type="button"
          className={`chip ${!depthAware ? 'active' : ''}`}
          onClick={() => setMode('projected2d')}
        >
          仅使用二维重投影
        </button>
        <button
          type="button"
          className={`chip ${depthAware ? 'active' : ''}`}
          onClick={() => setMode('depthAware')}
        >
          加入深度偏移（作者方法）
        </button>
      </div>

      <svg
        className="depth-disambiguation-figure"
        viewBox="0 0 960 300"
        role="img"
        aria-label={depthAware
          ? '前景与背景二维投影重合，但通过深度偏移获得不同的位置编码地址'
          : '前景与背景投影到相同二维位置，因位置编码相同而发生歧义'}
      >
        <defs>
          <marker id="depth-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0 0 7 3.5 0 7Z" fill="#27374d" />
          </marker>
          <marker id="depth-arrow-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0 0 7 3.5 0 7Z" fill="#d97706" />
          </marker>
        </defs>

        <rect x="8" y="8" width="278" height="284" rx="12" className="depth-panel" />
        <rect x="300" y="8" width="246" height="284" rx="12" className="depth-panel" />
        <rect x="560" y="8" width="392" height="284" rx="12" className="depth-panel" />

        <text x="28" y="38" className="depth-panel-title">目标相机中的同一条视线</text>
        <path d="M54 156H252" className="depth-ray" markerEnd="url(#depth-arrow)" />
        <path d="M42 140 62 156 42 172Z" fill="#27374d" />
        <circle cx="133" cy="156" r="15" className="depth-foreground" />
        <circle cx="215" cy="156" r="15" className="depth-background" />
        <text x="133" y="130" textAnchor="middle" className="depth-token-label foreground">前景Token</text>
        <text x="215" y="130" textAnchor="middle" className="depth-token-label background">背景Token</text>
        <text x="133" y="205" textAnchor="middle" className="depth-small-label">深度 d近</text>
        <text x="215" y="205" textAnchor="middle" className="depth-small-label">深度 d远</text>
        <text x="147" y="258" textAnchor="middle" className="depth-note-label">三维位置不同，但可能沿同一投影射线</text>

        <text x="320" y="38" className="depth-panel-title">目标二维平面</text>
        {[0, 1, 2, 3].map(index => (
          <React.Fragment key={`grid-${index}`}>
            <line x1={340 + index * 48} y1="76" x2={340 + index * 48} y2="220" className="depth-grid-line" />
            <line x1="340" y1={76 + index * 48} x2="484" y2={76 + index * 48} className="depth-grid-line" />
          </React.Fragment>
        ))}
        <circle cx="412" cy="148" r="17" className="depth-background" />
        <circle cx="405" cy="141" r="17" className="depth-foreground" />
        <path d="M252 156H326" className="depth-ray" markerEnd="url(#depth-arrow)" />
        <text x="412" y="254" textAnchor="middle" className="depth-note-label">相同或相近的 (h̃, w̃)</text>

        <text x="580" y="38" className="depth-panel-title">参考Kᵧ的位置编码地址</text>
        {!depthAware ? (
          <>
            <rect x="594" y="76" width="270" height="55" rx="9" className="depth-address conflict" />
            <text x="729" y="110" textAnchor="middle" className="depth-address-text">Pᵧ,近 = (t, h̃, w̃)</text>
            <rect x="594" y="145" width="270" height="55" rx="9" className="depth-address conflict" />
            <text x="729" y="179" textAnchor="middle" className="depth-address-text">Pᵧ,远 = (t, h̃, w̃)</text>
            <path d="M864 104H900V138" className="depth-conflict-line" />
            <path d="M864 173H900V138" className="depth-conflict-line" />
            <circle cx="900" cy="138" r="15" className="depth-conflict-dot" />
            <text x="729" y="243" textAnchor="middle" className="depth-result bad">地址重合：Qₓ难以区分前后层</text>
          </>
        ) : (
          <>
            <line x1="610" y1="170" x2="902" y2="170" className="depth-axis" markerEnd="url(#depth-arrow-orange)" />
            <line x1="620" y1="160" x2="620" y2="180" className="depth-axis" />
            <line x1="892" y1="160" x2="892" y2="180" className="depth-axis" />
            <text x="620" y="203" textAnchor="middle" className="depth-small-label">t</text>
            <text x="892" y="203" textAnchor="middle" className="depth-small-label">t + 0.1</text>
            <circle cx="680" cy="170" r="13" className="depth-foreground" />
            <circle cx="824" cy="170" r="13" className="depth-background" />
            <text x="680" y="112" textAnchor="middle" className="depth-token-label foreground">t + Δ(d近)</text>
            <text x="824" y="137" textAnchor="middle" className="depth-token-label background">t + Δ(d远)</text>
            <path d="M680 120V151" className="depth-offset-guide foreground" />
            <path d="M824 145V151" className="depth-offset-guide background" />
            <text x="756" y="243" textAnchor="middle" className="depth-result good">二维落点不变，但RoPE地址获得前后顺序</text>
          </>
        )}
      </svg>

      <div className="depth-explanation-grid">
        <div>
          <strong>作者如何修改？</strong>
          <p>
            作者将深度归一化为 <code>Δ(d)∈[0,0.1]</code>，定义 <code>t′=t+Δ(d)</code>。其中{' '}
            <span className="projection-coordinate-term" tabIndex={0} aria-describedby="projection-coordinate-tip">
              (h̃,w̃)
              <span id="projection-coordinate-tip" className="projection-coordinate-tooltip" role="tooltip">
                参考Token利用深度和相机参数重投影到目标视角后，在目标Latent网格中的二维位置：h̃表示高度方向的行坐标，w̃表示宽度方向的列坐标。
              </span>
            </span>{' '}
            表示目标视角中的二维投影位置，最终地址写成 <code>Pᵧ=(t+Δ(d),h̃,w̃)</code>。
          </p>
          <p>
            <strong>补充：</strong>摄像机参数由ViPE逐帧估计。作者在Video VAE编码前将每张输入图像／视频帧复制多份，
            使时间压缩后的每个Context Latent只对应一张源帧，从而唯一绑定该帧的摄像机参数与投影地址。
          </p>
        </div>
      </div>

      <div className={`feedback ${depthAware ? 'good' : 'bad'}`}>
        {depthAware
          ? '作者方法：同一帧内的Token仍处于[t, t+0.1]范围，但不同深度获得不同地址；具体偏移大小取决于深度归一化约定。'
          : '仅二维重投影：前景和背景虽然内容不同，却可能拥有相同的位置编码，Attention检索因此出现深度歧义。'}
      </div>
    </div>
  );
};

export default ImplementationProblems;
