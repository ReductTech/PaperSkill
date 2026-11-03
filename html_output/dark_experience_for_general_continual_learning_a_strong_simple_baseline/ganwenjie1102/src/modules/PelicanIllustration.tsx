import { useId } from "react";

export type ImageView = "original" | "saved" | "center" | "flip";
export type ImageRegion = { x: number; y: number; w: number; h: number };
export function PelicanIllustration({ view, label, x, y, width, height, amount = 1, className = "p1-source-art", region, mirrored = false, frame = true, rotation = 0, rotationScale = 1, rotationOffsetX = 0 }: { view: ImageView; label: string; x?: number; y?: number; width?: number; height?: number; amount?: number; className?: string; region?: ImageRegion; mirrored?: boolean; frame?: boolean; rotation?: number; rotationScale?: number; rotationOffsetX?: number }) {
  const clipId = useId().replace(/:/g, "");
  const transforms: Record<ImageView, { scale: number; x: number; y: number }> = {
    original: { scale: 1, x: 0, y: 0 },
    saved: { scale: 1.08, x: -9, y: -5 },
    center: { scale: 1.34, x: -40, y: -21 },
    flip: { scale: 1.23, x: -28, y: -12 },
  };
  const target = transforms[view];
  const t = Math.max(0, Math.min(1, amount));
  const transform = { x: target.x * t, y: target.y * t, scale: 1 + (target.scale - 1) * t };
  return <svg className={className} x={x} y={y} width={width} height={height} viewBox={region ? `${region.x} ${region.y} ${region.w} ${region.h}` : '0 0 320 190'} role="img" aria-label={label} data-image-identity="synthetic-source-x1" data-image-view={view} data-image-region={region ? [region.x,region.y,region.w,region.h].join(',') : undefined} data-mirrored={mirrored} data-rotation={rotation} data-rotation-scale={rotationScale}>
    <defs>
      <clipPath id={clipId}><rect width="320" height="190" rx="9" /></clipPath>
      <linearGradient id={`${clipId}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#392b49"/><stop offset=".58" stopColor="#a25265"/><stop offset="1" stopColor="#ef9a66"/></linearGradient>
      <linearGradient id={`${clipId}-sun`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe6a0"/><stop offset="1" stopColor="#f6ae6c"/></linearGradient>
      <linearGradient id={`${clipId}-pouch`} x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#ffc05f"/><stop offset="1" stopColor="#e76f4f"/></linearGradient>
    </defs>
    <g clipPath={`url(#${clipId})`}>
      <g transform={mirrored ? `translate(${region ? 2*region.x+region.w : 320} 0) scale(-1 1)` : view === "flip" ? `translate(${320 * t} 0) scale(${1 - 2 * t} 1)` : undefined}>
        <g transform={(rotation || rotationScale!==1 || rotationOffsetX) ? `translate(${rotationOffsetX} 0) translate(160 95) rotate(${rotation}) scale(${rotationScale}) translate(-160 -95)` : undefined}>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          <rect width="320" height="190" fill={`url(#${clipId}-sky)`} />
          <circle cx="274" cy="78" r="47" fill={`url(#${clipId}-sun)`} />
          <path d="M0 112L35 98L75 111L111 103L154 117L197 101L237 111L278 96L320 107V137H0Z" fill="#5a3b56" />
          <path d="M0 120C60 116 98 126 151 119S253 120 320 114V157H0Z" fill="#65465f" />
          <path d="M0 131H320M0 141C67 136 123 145 193 138S273 138 320 134" fill="none" stroke="#d7a568" strokeWidth="1.4" opacity=".68" />
          <path d="M0 148C74 144 142 151 209 146S279 144 320 148V190H0Z" fill="#302b3e" />
          <path d="M0 181H320" stroke="#9a705b" strokeWidth="2" opacity=".58" />
          <path d="M11 187H51M84 187H119M251 187H288" stroke="#876356" strokeWidth="2" strokeDasharray="13 9" opacity=".65" />
          <circle cx="27" cy="119" r="2" fill="#ffd47f" />
          <circle cx="295" cy="128" r="1.8" fill="#ffd47f" />
          <path d="M24 102V146" stroke="#332e40" strokeWidth="3" />
          <path d="M17 102L20 94H29L32 102Z" fill="#f5d896" stroke="#3b3143" strokeWidth="2" />
          <ellipse cx="157" cy="178" rx="91" ry="5" fill="#211f31" opacity=".58" />

          <g className="p1-pelican-bicycle" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {[{ cx: 82, cy: 153 }, { cx: 226, cy: 153 }].map(({ cx, cy }) => <g key={cx}>
              <circle cx={cx} cy={cy} r="29" stroke="#f0e4c6" strokeWidth="5" />
              <circle cx={cx} cy={cy} r="23" stroke="#d8b66f" strokeWidth="1.4" />
              {Array.from({ length: 8 }, (_, spoke) => {
                const angle = Math.PI * spoke / 8;
                const innerX = cx + Math.cos(angle) * 3;
                const innerY = cy + Math.sin(angle) * 3;
                const outerX = cx + Math.cos(angle) * 22;
                const outerY = cy + Math.sin(angle) * 22;
                return <path key={spoke} d={`M${innerX} ${innerY}L${outerX} ${outerY}M${innerX} ${innerY}L${cx - Math.cos(angle) * 22} ${cy - Math.sin(angle) * 22}`} stroke="#e7d8ba" strokeWidth=".8" opacity=".86" />;
              })}
              <circle cx={cx} cy={cy} r="3.5" fill="#d9b36b" stroke="none" />
            </g>)}
            <path d="M82 153L139 116L163 153H82ZM139 116L190 116L226 153M163 153L190 116M139 116L132 101M190 116L198 96M195 96H211" stroke="#49b7a6" strokeWidth="4.4" />
            <path d="M125 100H143M194 94L199 90H210" stroke="#33404b" strokeWidth="4" />
            <circle cx="163" cy="153" r="8" stroke="#dfa84e" strokeWidth="2.2" />
            <path d="M163 153L177 158M163 153L151 159M174 158H182M147 159H154" stroke="#e6bd69" strokeWidth="2.4" />
            <path d="M198 109L200 120H222L224 109" fill="#b77b4c" stroke="#503b48" strokeWidth="1.6" />
            <path d="M198 114H224M201 119H222M205 109V120M217 109V120" stroke="#e5b36b" strokeWidth="1" />
            <circle cx="205" cy="105" r="4" fill="#f2c76e" stroke="none" />
            <circle cx="216" cy="104" r="5" fill="#f6d88b" stroke="none" />
          </g>

          <g className="p1-pelican-illustration">
            <path d="M124 95Q111 86 102 91Q109 101 124 105ZM124 101Q109 100 105 108Q117 112 129 107Z" fill="#f3eee4" />
            <path d="M158 101C166 86 166 65 176 47L189 50C181 69 183 89 177 105Z" fill="#f7f2e7" stroke="#d4d1c7" strokeWidth="1" />
            <path d="M138 115C141 123 155 127 157 136L151 148M160 116C165 126 178 130 174 144L168 150" fill="none" stroke="#df8256" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="157" cy="135" r="4" fill="#e5905b" />
            <circle cx="174" cy="143" r="4" fill="#e5905b" />
            <path d="M149 148Q157 152 164 147M166 150Q176 152 183 147" fill="none" stroke="#e28a56" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="144" cy="101" rx="31" ry="22" fill="#faf6eb" stroke="#d7d2c7" strokeWidth="1.2" />
            <path d="M126 94Q141 80 161 91Q157 105 135 109Q128 104 126 94Z" fill="#e9e3d8" />
            <path d="M133 96Q146 87 157 92" fill="none" stroke="#d3cbbd" strokeWidth="1.5" />
            <circle cx="181" cy="44" r="11" fill="#f8f2e7" stroke="#d8d2c6" strokeWidth="1.1" />
            <path d="M168 40Q171 29 184 30Q193 31 196 37L204 40Q197 44 187 43L168 44Z" fill="#263f5a" />
            <path d="M174 32Q181 27 189 32" fill="none" stroke="#6d8497" strokeWidth="1.5" />
            <circle cx="179" cy="34" r="1.5" fill="#f0c96d" />
            <circle cx="184" cy="43" r="2" fill="#273847" />
            <circle cx="184.6" cy="42.4" r=".7" fill="#fff" />
            <path d="M190 42Q219 38 248 43Q251 45 246 49Q217 52 190 50Z" fill="#f3a54e" stroke="#c96748" strokeWidth="1.3" />
            <path d="M191 50Q220 51 246 49C240 64 229 74 216 75Q200 72 194 62Z" fill={`url(#${clipId}-pouch)`} stroke="#bf624a" strokeWidth="1.4" />
            <path d="M195 54Q219 58 243 53" fill="none" stroke="#ffcf74" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M202 62Q215 68 232 62" fill="none" stroke="#dc684e" strokeWidth="1.2" opacity=".7" />
            <path d="M126 97Q139 106 155 99" fill="none" stroke="#fffdf7" strokeWidth="1.5" opacity=".8" />
          </g>
        </g>
        </g>
      </g>
    </g>
    {frame && <><rect x=".75" y=".75" width="318.5" height="188.5" rx="9" className="p1-image-border" />
    <path d="M12 28V12H31M289 12H308V28M12 162V178H31M289 178H308V162" className="p1-crop-corners" /></>}
  </svg>;
}
