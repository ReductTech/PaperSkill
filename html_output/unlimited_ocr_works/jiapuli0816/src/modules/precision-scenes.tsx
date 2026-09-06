import type { CSSProperties } from 'react';
import type { WidgetProps } from './registry';
import { useSceneVisibility } from './use-scene-visibility';

const tokenCells = Array.from({ length: 256 });

function CompressionScene() {
  return (
    <svg className="precision-svg" viewBox="0 0 320 170" aria-hidden="true">
      <rect className="ps-field" x="0.5" y="0.5" width="319" height="169" rx="13" />

      <g className="ps-document">
        <rect className="ps-paper-shadow" x="21" y="24" width="78" height="112" rx="7" />
        <rect className="ps-paper" x="17" y="20" width="78" height="112" rx="7" />
        <rect className="ps-page-title" x="29" y="33" width="39" height="5" rx="2.5" />
        <rect className="ps-page-line" x="29" y="49" width="52" height="3" rx="1.5" />
        <rect className="ps-page-line" x="29" y="58" width="44" height="3" rx="1.5" />
        <rect className="ps-page-line" x="29" y="67" width="50" height="3" rx="1.5" />
        <rect className="ps-page-block" x="29" y="80" width="52" height="27" rx="3" />
        <rect className="ps-page-line" x="29" y="116" width="46" height="3" rx="1.5" />
        <rect className="ps-scan" x="24" y="36" width="64" height="24" rx="4" />
      </g>

      <path className="ps-route" d="M108 76H207" />
      <circle className="ps-route-dot" cx="112" cy="76" r="4" />
      <g transform="translate(142 54)">
        <g className="ps-bridge">
          <rect width="34" height="44" rx="8" />
          <path d="M9 14h16M9 22h16M9 30h16" />
        </g>
      </g>

      <g className="ps-token-grid" transform="translate(219 34)">
        <rect className="ps-grid-frame" width="78" height="78" rx="9" />
        {tokenCells.map((_, index) => {
          const column = index % 16;
          const row = Math.floor(index / 16);
          const x = 7 + column * 4;
          const y = 7 + row * 4;
          return (
            <rect
              className="ps-token"
              x={x}
              y={y}
              width="2.65"
              height="2.65"
              rx="0.65"
              key={index}
              style={{ '--token-index': column + row } as CSSProperties}
            />
          );
        })}
      </g>

      <text className="ps-caption" x="56" y="153" textAnchor="middle">1024×1024 页面</text>
      <text className="ps-caption ps-caption-active" x="159" y="153" textAnchor="middle">16×桥接</text>
      <text className="ps-caption" x="258" y="153" textAnchor="middle">256 个 token</text>
    </svg>
  );
}

function PageShell() {
  return (
    <>
      <rect className="pc-page-shadow" x="19" y="22" width="122" height="120" rx="7" />
      <rect className="pc-page" x="16" y="18" width="122" height="120" rx="7" />
      <rect className="pc-page-shadow" x="179" y="22" width="122" height="120" rx="7" />
      <rect className="pc-page" x="176" y="18" width="122" height="120" rx="7" />
      <text className="pc-page-label" x="28" y="34">第 1 页</text>
      <text className="pc-page-label" x="188" y="34">第 2 页</text>
      <path className="pc-seam" d="M157 29V132" />
    </>
  );
}

function ContinuityScene() {
  return (
    <svg className="precision-svg" viewBox="0 0 320 170" aria-hidden="true">
      <rect className="ps-field" x="0.5" y="0.5" width="319" height="169" rx="13" />
      <PageShell />

      <g className="pc-layer pc-layer-table">
        <text className="pc-label" x="29" y="53">表格续行</text>
        <path className="pc-rule" d="M29 63H126M29 79H126M29 95H126M29 111H126M45 63v48M87 63v48" />
        <path className="pc-rule" d="M189 63H286M189 79H286M189 95H286M189 111H286M205 63v48M247 63v48" />
        <rect className="pc-highlight" x="28" y="78" width="99" height="18" rx="3" />
        <rect className="pc-highlight" x="188" y="62" width="99" height="18" rx="3" />
        <circle className="pc-cursor" cx="128" cy="87" r="4" style={{ '--cursor-rise': '-16px' } as CSSProperties} />
        <text className="pc-state" x="160" y="157" textAnchor="middle">页尾表格在下页续行</text>
      </g>

      <g className="pc-layer pc-layer-formula">
        <text className="pc-label" x="29" y="53">公式承接</text>
        <text className="pc-formula-mark" x="31" y="84">式 (4)</text>
        <path className="pc-copy" d="M31 99H118M31 109H104M31 119H114" />
        <text className="pc-formula-mark" x="190" y="74">解释承接</text>
        <path className="pc-copy" d="M190 89H278M190 99H265M190 109H282M190 119H252" />
        <circle className="pc-cursor" cx="128" cy="94" r="4" style={{ '--cursor-rise': '-5px' } as CSSProperties} />
        <text className="pc-state" x="160" y="157" textAnchor="middle">公式解释承接上页</text>
      </g>

      <g className="pc-layer pc-layer-section">
        <text className="pc-label" x="29" y="53">章节衔接</text>
        <text className="pc-section-mark" x="30" y="80">§ 3.2</text>
        <path className="pc-copy" d="M31 95H119M31 105H108M31 115H116" />
        <text className="pc-section-mark" x="190" y="70">续写段落</text>
        <path className="pc-copy" d="M190 85H278M190 95H265M190 105H282M190 115H258" />
        <circle className="pc-cursor" cx="128" cy="96" r="4" style={{ '--cursor-rise': '-11px' } as CSSProperties} />
        <text className="pc-state" x="160" y="157" textAnchor="middle">分页后语义位置不重置</text>
      </g>
    </svg>
  );
}

export function PrecisionScenes({ chapterId }: WidgetProps) {
  const rootRef = useSceneVisibility<HTMLDivElement>();
  const isCompression = chapterId === 'chap-2';

  return (
    <div
      className={`precision-scene${isCompression ? ' is-compression' : ' is-continuity'}`}
      ref={rootRef}
      role="img"
      aria-label={
        isCompression
          ? '页面经十六倍桥接形成二百五十六个视觉 token 的动画'
          : '表格、公式和章节跨页保持连续的动画'
      }
    >
      {isCompression ? <CompressionScene /> : <ContinuityScene />}
    </div>
  );
}

export default PrecisionScenes;
