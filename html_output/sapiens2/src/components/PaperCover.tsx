import React from 'react';

interface PaperCoverProps {
  onStart: () => void;
}

export function PaperCover({ onStart }: PaperCoverProps) {
  return (
    <article className="paper-cover" aria-labelledby="paper-cover-title">
      <div className="cover-copy">
        <div className="cover-kicker"><span /> INTERACTIVE PAPER TUTORIAL</div>
        <h1 id="paper-cover-title">
          <span>Sapiens</span><b>→</b><span>Sapiens2</span>
        </h1>
        <p className="cover-title-zh">人体视觉基础模型<br />如何从像素重建走向全局语义理解</p>
        <p className="cover-intro">
          一套模型，同时理解人体的姿态、部位、三维几何、表面朝向与材质。
        </p>

        <div className="cover-story" aria-label="论文核心主线">
          <div><small>01 · 学什么</small><strong>人体数据</strong><span>领域对齐</span></div>
          <i>→</i>
          <div><small>02 · 看清楚</small><strong>MAE</strong><span>局部细节</span></div>
          <i>→</i>
          <div><small>03 · 看明白</small><strong>自蒸馏</strong><span>全局语义</span></div>
        </div>

        <div className="cover-tags" aria-label="论文关键词">
          <span>Humans-1B</span><span>5B ViT</span><span>1K + 4K</span><span>MAE + Self-distillation</span>
        </div>

        <div className="cover-actions">
          <button onClick={onStart}>开始学习 <span aria-hidden="true">→</span></button>
          <p>7 页主线 · 2 个核心动画 · 4 页备用答疑</p>
        </div>
      </div>

      <div className="cover-visual" aria-label="从局部像素重建到全局语义理解的概念图">
        <svg viewBox="0 0 640 580" role="img" aria-labelledby="cover-visual-title">
          <title id="cover-visual-title">Sapiens 到 Sapiens2 的方法演进</title>
          <defs>
            <linearGradient id="cover-blue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#aebcbc" /><stop offset="1" stopColor="#2177b3" />
            </linearGradient>
            <linearGradient id="cover-teal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#aebcbc" /><stop offset="1" stopColor="#13494b" />
            </linearGradient>
            <marker id="cover-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9Z" fill="#c7dcea" />
            </marker>
            <marker id="cover-arrow-orange" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9Z" fill="#f48b5b" />
            </marker>
            <clipPath id="cover-human-frame"><rect x="70" y="105" width="205" height="260" rx="22" /></clipPath>
          </defs>

          <rect x="25" y="28" width="590" height="524" rx="32" fill="#13494b" stroke="#13494b" />
          <text x="62" y="76" className="cover-svg-eyebrow">SAPIENS · HIGH-RESOLUTION HUMAN VISION</text>

          <g>
            <rect x="58" y="94" width="229" height="286" rx="25" fill="#13494b" stroke="#2177b3" />
            <g clipPath="url(#cover-human-frame)">
              <rect x="70" y="105" width="205" height="260" fill="#c7dcea" />
              <circle cx="172" cy="155" r="29" fill="#e6acae" />
              <path d="M125 207 Q172 174 219 207 L232 308 Q202 338 172 338 Q142 338 112 308Z" fill="url(#cover-blue)" />
              <path d="M126 220 L88 291 M218 220 L257 291" stroke="#e6acae" strokeWidth="20" strokeLinecap="round" />
              <path d="M151 330 L139 388 M193 330 L205 388" stroke="#2177b3" strokeWidth="23" strokeLinecap="round" />
              {Array.from({ length: 42 }, (_, index) => {
                const col = index % 7;
                const row = Math.floor(index / 7);
                const masked = (index * 7 + row) % 4 !== 0;
                return <rect key={index} x={70 + col * 29.3} y={105 + row * 43.4} width="29.3" height="43.4" fill={masked ? '#13494b' : 'transparent'} opacity={masked ? 0.9 : 1} stroke="#aebcbc" strokeWidth="0.7" />;
              })}
            </g>
            <text x="172" y="411" textAnchor="middle" className="cover-svg-title">MAE</text>
            <text x="172" y="434" textAnchor="middle" className="cover-svg-caption">75% MASK · PIXEL RECONSTRUCTION</text>
          </g>

          <path d="M298 245 C340 205 356 205 397 245" fill="none" stroke="#c7dcea" strokeWidth="4" markerEnd="url(#cover-arrow)" />
          <text x="347" y="190" textAnchor="middle" className="cover-svg-caption">LOCAL → GLOBAL</text>

          <g>
            <rect x="389" y="94" width="182" height="286" rx="25" fill="#13494b" stroke="#2177b3" />
            <rect x="413" y="122" width="134" height="62" rx="13" fill="#13494b" stroke="#f48b5b" strokeWidth="2" strokeDasharray="7 5" />
            <text x="480" y="148" textAnchor="middle" className="cover-svg-title teacher">EMA TEACHER</text>
            <text x="480" y="169" textAnchor="middle" className="cover-svg-caption">2 GLOBAL VIEWS</text>
            <path d="M480 193 V232" stroke="#f48b5b" strokeWidth="3" strokeDasharray="6 5" markerEnd="url(#cover-arrow-orange)" />
            <rect x="413" y="240" width="134" height="62" rx="13" fill="#13494b" stroke="#aebcbc" strokeWidth="2" />
            <text x="480" y="266" textAnchor="middle" className="cover-svg-title student">STUDENT</text>
            <text x="480" y="287" textAnchor="middle" className="cover-svg-caption">2 GLOBAL + 4 LOCAL</text>
            <g fill="url(#cover-teal)">
              {[0, 1, 2, 3, 4, 5].map((item) => <circle key={item} cx={420 + item * 24} cy="337" r={item < 2 ? 9 : 6} />)}
            </g>
            <text x="480" y="364" textAnchor="middle" className="cover-svg-caption">CROSS-VIEW SEMANTICS</text>
            <text x="480" y="411" textAnchor="middle" className="cover-svg-title">SELF-DISTILLATION</text>
            <text x="480" y="434" textAnchor="middle" className="cover-svg-caption">SEMANTIC CONSISTENCY</text>
          </g>

          <g transform="translate(70 476)">
            <rect width="500" height="48" rx="13" fill="#13494b" stroke="#13494b" />
            <text x="24" y="30" className="cover-svg-caption strong">POSE</text>
            <text x="111" y="30" className="cover-svg-caption strong">SEGMENTATION</text>
            <text x="248" y="30" className="cover-svg-caption strong">POINTMAP</text>
            <text x="354" y="30" className="cover-svg-caption strong">NORMAL</text>
            <text x="436" y="30" className="cover-svg-caption strong">ALBEDO</text>
          </g>
        </svg>
      </div>

      <footer className="cover-meta">
        <span>Rawal Khirodkar 等</span><i /> <span>Meta Reality Labs</span><i /> <span>ICLR 2026</span>
      </footer>
    </article>
  );
}
