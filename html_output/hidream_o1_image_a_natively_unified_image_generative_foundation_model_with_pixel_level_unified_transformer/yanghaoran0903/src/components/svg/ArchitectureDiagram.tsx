import React from 'react';

export function ArchitectureDiagram() {
  return (
    <div className="uit-diagram-shell">
      <div className="uit-diagram-scroll">
        <svg
          viewBox="0 40 1080 310"
          role="img"
          className="uit__svg"
          aria-label="HiDream-O1-Image 模型整体架构图：三种输入汇入共享 token 空间，经统一 Transformer 处理后生成图像。"
        >
          <defs>
            <linearGradient id="uitWire" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--color-primary-light)" stopOpacity=".32" />
              <stop offset=".55" stopColor="var(--color-primary)" stopOpacity=".72" />
              <stop offset="1" stopColor="var(--color-token-text)" stopOpacity=".42" />
            </linearGradient>
            <linearGradient id="uitPanel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-primary-light)" />
              <stop offset=".58" stopColor="var(--color-bg-card)" />
              <stop offset="1" stopColor="var(--color-bg-elevated)" />
            </linearGradient>
            <linearGradient id="uitOutput" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-token-generation-bg)" />
              <stop offset=".52" stopColor="var(--color-token-generation)" />
              <stop offset="1" stopColor="var(--color-primary)" />
            </linearGradient>
            <linearGradient id="uitCard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-bg-elevated)" />
              <stop offset="1" stopColor="var(--color-bg-card)" />
            </linearGradient>
            <marker id="uitArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 z" fill="var(--color-text-muted)" />
            </marker>
            <filter id="uitSoftShadow" x="-20%" y="-30%" width="140%" height="170%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="hsl(var(--shadow-color) / 0.14)" />
            </filter>
          </defs>

          <path
            className="uit__grid"
            d="M80 76V320 M160 76V320 M240 76V320 M320 76V320 M400 76V320 M480 76V320 M560 76V320 M640 76V320 M720 76V320 M800 76V320 M880 76V320 M960 76V320 M1040 76V320 M40 100H1040 M40 148H1040 M40 196H1040 M40 244H1040 M40 292H1040"
          />

          <g className="uit__wires" fill="none" stroke="url(#uitWire)" strokeWidth="2.1">
            <path id="w0" d="M220,122 C 284,122 292,202 336,202" />
            <path id="w1" d="M220,202 C 280,202 300,202 336,202" />
            <path id="w2" d="M220,282 C 284,282 292,202 336,202" />
          </g>

          <g className="uit__arrows" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
            <path id="a0" d="M640,202 C 662,202 676,202 696,202" markerEnd="url(#uitArrow)" />
            <path id="a1" d="M880,202 C 902,202 914,202 932,202" markerEnd="url(#uitArrow)" />
          </g>

          <g className="uit__flowtok" aria-hidden="true">
            <circle r="3.4" fill="var(--color-primary)">
              <animateMotion begin="0s" dur="2.6s" repeatCount="indefinite">
                <mpath href="#w0" />
              </animateMotion>
            </circle>
            <circle r="3.4" fill="var(--color-primary)">
              <animateMotion begin="-0.7s" dur="2.6s" repeatCount="indefinite">
                <mpath href="#w1" />
              </animateMotion>
            </circle>
            <circle r="3.4" fill="var(--color-primary)">
              <animateMotion begin="-1.4s" dur="2.6s" repeatCount="indefinite">
                <mpath href="#w2" />
              </animateMotion>
            </circle>
            <circle r="3.4" fill="var(--color-primary)">
              <animateMotion begin="-0.4s" dur="2.6s" repeatCount="indefinite">
                <mpath href="#a0" />
              </animateMotion>
            </circle>
            <circle r="3.4" fill="var(--color-primary)">
              <animateMotion begin="-1.1s" dur="2.6s" repeatCount="indefinite">
                <mpath href="#a1" />
              </animateMotion>
            </circle>
          </g>

          <g className="uit__z">
            <rect x="26" y="72" width="206" height="248" rx="18" fill="transparent" className="uit__hit" />
            <text className="uit__stage" x="54" y="84">多模态输入</text>

            <g>
              <rect className="zbox input-box" x="42" y="92" width="178" height="60" rx="15" fill="url(#uitCard)" />
              <circle cx="68" cy="115" r="5" fill="var(--color-token-text)" />
              <text className="uit__lbl" x="88" y="116">文本提示</text>
              <text className="uit__sub" x="88" y="136">语言 token</text>
            </g>

            <g>
              <rect className="zbox input-box" x="42" y="172" width="178" height="60" rx="15" fill="url(#uitCard)" />
              <circle cx="68" cy="195" r="5" fill="var(--color-token-generation)" />
              <text className="uit__lbl" x="88" y="196">原始像素</text>
              <text className="uit__sub" x="88" y="216">图像 patch</text>
            </g>

            <g>
              <rect className="zbox input-box" x="42" y="252" width="178" height="60" rx="15" fill="url(#uitCard)" />
              <circle cx="68" cy="275" r="5" fill="var(--color-token-condition)" />
              <text className="uit__lbl" x="88" y="276">任务条件</text>
              <text className="uit__sub" x="88" y="296">编辑 / 主体驱动</text>
            </g>
          </g>

          <g className="uit__z on">
            <rect
              className="zbox shared-box"
              x="336"
              y="86"
              width="304"
              height="226"
              rx="24"
              fill="url(#uitPanel)"
              filter="url(#uitSoftShadow)"
            />
            <text className="uit__stage" x="488" y="116" textAnchor="middle">
              共享 token 空间
            </text>
            <text className="uit__cap2" x="488" y="272" textAnchor="middle">
              像素、语言与任务 token 交错融合
            </text>

            {[
              [374, 146, 'var(--color-token-generation)'],
              [413, 146, 'var(--color-token-text)'],
              [452, 146, 'var(--color-token-generation)'],
              [491, 146, 'var(--color-token-condition)'],
              [530, 146, 'var(--color-token-generation)'],
              [569, 146, 'var(--color-token-text)'],
              [374, 172, 'var(--color-token-text)'],
              [413, 172, 'var(--color-token-generation)'],
              [452, 172, 'var(--color-token-generation)'],
              [491, 172, 'var(--color-token-generation)'],
              [530, 172, 'var(--color-token-condition)'],
              [569, 172, 'var(--color-token-generation)'],
              [374, 198, 'var(--color-token-generation)'],
              [413, 198, 'var(--color-token-condition)'],
              [452, 198, 'var(--color-token-text)'],
              [491, 198, 'var(--color-token-generation)'],
              [530, 198, 'var(--color-token-generation)'],
              [569, 198, 'var(--color-token-text)'],
              [374, 224, 'var(--color-token-condition)'],
              [413, 224, 'var(--color-token-generation)'],
              [452, 224, 'var(--color-token-generation)'],
              [491, 224, 'var(--color-token-text)'],
              [530, 224, 'var(--color-token-generation)'],
              [569, 224, 'var(--color-token-condition)'],
            ].map(([x, y, fill], idx) => (
              <rect
                key={idx}
                x={x as number}
                y={y as number}
                width="28"
                height="16"
                rx="4"
                fill={fill as string}
                opacity="0.34"
                stroke={fill as string}
              />
            ))}

            <g className="uit__legend">
              <circle cx="390" cy="294" r="4" fill="var(--color-token-text)" />
              <text x="400" y="298">文本</text>
              <circle cx="438" cy="294" r="4" fill="var(--color-token-generation)" />
              <text x="448" y="298">像素</text>
              <circle cx="496" cy="294" r="4" fill="var(--color-token-condition)" />
              <text x="506" y="298">任务</text>
            </g>
          </g>

          <g className="uit__z">
            <rect className="zbox transformer-box" x="696" y="78" width="184" height="244" rx="24" fill="url(#uitPanel)" filter="url(#uitSoftShadow)" />
            <text className="uit__title" x="788" y="112" textAnchor="middle">统一</text>
            <text className="uit__title" x="788" y="132" textAnchor="middle">Transformer</text>

            <rect x="724" y="148" width="128" height="16" rx="8" fill="url(#uitCore)" opacity="0.56" />
            <rect x="724" y="172" width="128" height="16" rx="8" fill="url(#uitCore)" opacity="0.64" />
            <rect x="724" y="196" width="128" height="16" rx="8" fill="url(#uitCore)" opacity="0.72" />
            <rect x="724" y="220" width="128" height="16" rx="8" fill="url(#uitCore)" opacity="0.8" />
            <rect x="724" y="244" width="128" height="16" rx="8" fill="url(#uitCore)" opacity="0.88" />

            <g className="attention-map">
              <circle cx="742" cy="276" r="3" fill="var(--color-primary)" />
              <circle cx="758" cy="276" r="3" fill="var(--color-border)" />
              <circle cx="774" cy="276" r="3" fill="var(--color-border)" />
              <circle cx="790" cy="276" r="3" fill="var(--color-border)" />
              <circle cx="806" cy="276" r="3" fill="var(--color-primary)" />
              <circle cx="822" cy="276" r="3" fill="var(--color-border)" />
              <circle cx="742" cy="286" r="3" fill="var(--color-border)" />
              <circle cx="758" cy="286" r="3" fill="var(--color-border)" />
              <circle cx="774" cy="286" r="3" fill="var(--color-primary)" />
              <circle cx="790" cy="286" r="3" fill="var(--color-border)" />
              <circle cx="806" cy="286" r="3" fill="var(--color-border)" />
              <circle cx="822" cy="286" r="3" fill="var(--color-primary)" />
              <circle cx="742" cy="296" r="3" fill="var(--color-primary)" />
              <circle cx="758" cy="296" r="3" fill="var(--color-border)" />
              <circle cx="774" cy="296" r="3" fill="var(--color-border)" />
              <circle cx="790" cy="296" r="3" fill="var(--color-border)" />
              <circle cx="806" cy="296" r="3" fill="var(--color-primary)" />
              <circle cx="822" cy="296" r="3" fill="var(--color-border)" />
            </g>
            <text className="uit__cap2" x="788" y="312" textAnchor="middle">混合注意力</text>
          </g>

          <g className="uit__z">
            <rect x="914" y="100" width="152" height="208" rx="24" fill="transparent" className="uit__hit" />
            <ellipse className="output-glow" cx="993" cy="200" rx="72" ry="104" fill="url(#uitPanel)" opacity=".54" />
            <rect className="output-core" x="950" y="134" width="86" height="86" rx="18" fill="url(#uitOutput)" />
            <circle cx="984" cy="168" r="19" fill="#fff" opacity=".34" />
            <path d="M960 205 C 980 181 991 189 1004 173 C 1018 156 1026 169 1036 148 L1036 220 L950 220 Z" fill="var(--color-primary-dark)" opacity=".14" />
            <text className="uit__lbl" x="993" y="251" textAnchor="middle">图像</text>
            <text className="uit__img2k" x="993" y="269" textAnchor="middle">2048×2048</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
