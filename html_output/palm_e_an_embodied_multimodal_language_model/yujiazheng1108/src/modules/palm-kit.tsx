import { useId } from 'react';
import type { ReactNode } from 'react';

type KitchenProps = {
  opening?: number;
  sponge?: number;
  arm?: number;
  camera?: boolean;
  spill?: boolean;
  label?: string;
};

/** Shared kitchen drawing. The drawers, camera and gripper reflect the widget state. */
export function Kitchen({ opening = 0.5, sponge = 0, arm = 400, camera = false, spill = false,
  label = '厨房台面、抽屉和机械夹具' }: KitchenProps) {
  const tile = useId();
  const lift = sponge === 2;
  const x = sponge === 1 ? 515 : lift ? arm : sponge === 3 ? 615 : 280;
  const drop = 145 + opening * 41;
  const y = lift ? 118 : sponge === 3 ? 90 : drop + 36;
  return <svg className="pk-kitchen" role="img" aria-label={label} viewBox="0 0 700 270">
    <defs>
      <pattern id={tile} width="53" height="39" patternUnits="userSpaceOnUse">
        <rect width="53" height="39" fill="#e8efdf" />
        <path d="M53 0H0V39" fill="none" stroke="#d7e2d2" strokeWidth="2" />
      </pattern>
    </defs>
    <rect width="700" height="270" rx="23" fill="var(--pk-field)" />
    <path d="M0 0H700V91H0Z" fill={`url(#${tile})`} />
    <ellipse cx="343" cy="250" rx="313" ry="15" fill="#c4d0bf" opacity=".5" />
    <rect x="65" y="105" width="572" height="138" rx="12" fill="#a87858" />
    <path d="M68 113H634V230H68Z" fill="#d7aa82" />
    <path d="M82 129H187V228H82Z" fill="#c79770" stroke="#b1835f" strokeWidth="3" />
    <path d="M88 144h44" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
    <rect x="56" y="92" width="594" height="27" rx="9" fill="#755341" />
    <rect x="56" y="86" width="594" height="19" rx="9" fill="#f2e8d2" />
    <ellipse cx="131" cy="87" rx="49" ry="10" fill="#8c9b9a" />
    <path d="M123 89v-30q0-20 18-20t18 20" fill="none" stroke="#708082" strokeWidth="7" strokeLinecap="round" />
    <path d="M589 74h46l8 18h-58Z" fill="#f9e4b6" stroke="#b88c51" strokeWidth="2" />
    {spill && <path d="M558 91q-26-19-61-6t-48 3q7 13 44 12t65-9Z" fill="#c43f52" opacity=".47" />}
    <g style={{ transform: `translateY(${opening * 34}px)` }} className="pk-shift">
      {[207, 433].map(left => <g key={left}>
        <rect x={left} y="137" width="188" height="54" rx="10" fill="#584636" />
        <path d={`M${left} 160l-9 30h207l-9-30Z`} fill="#ba8e67" />
        <rect x={left - 9} y="182" width="206" height="44" rx="8" fill="#e3ba8e" stroke="#ae8059" strokeWidth="2" />
        <path d={`M${left + 66} 204h56`} stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
      </g>)}
    </g>
    <g style={{ transform: `translate(${x}px,${y}px)`, opacity: opening > .15 || lift || sponge === 3 ? 1 : 0 }} className="pk-shift">
      <rect x="-18" y="-12" width="43" height="22" rx="6" fill="#e8c563" stroke="#9a743a" strokeWidth="2" />
      <path d="M-17 4h40" stroke="#8a9d67" strokeWidth="5" />
      <circle cx="-6" cy="-5" r="2" fill="#ad8741" /><circle cx="12" cy="-4" r="2" fill="#ad8741" />
    </g>
    <g className="pk-shift" style={{ transform: `translateX(${arm}px)` }}>
      <path d="M-38 16h79l-10 28h-60Z" fill="#455971" />
      <path d="M0 42v57" stroke="#637788" strokeWidth="11" strokeLinecap="round" />
      <path d="M-17 105h34m-17 0v16l8 6m26-22v16l-8 6" fill="none" stroke="#27446e" strokeWidth="5" strokeLinecap="round" />
    </g>
    {camera && <g fill="none" stroke="#228d5c" strokeWidth="4">
      <path d="M202 164v-26h30m375 0h30v26M202 219v23h30m375 0h30v-23" />
      <circle cx="614" cy="35" r="11" fill="#228d5c" />
      <path d="m609 35 4 4 7-8" stroke="#fff" strokeWidth="2" />
    </g>}
  </svg>;
}

export function Sponge({ selected = false }: { selected?: boolean }) {
  return <svg className={selected ? 'pk-sponge selected' : 'pk-sponge'} viewBox="0 0 152 74" aria-hidden="true">
    <ellipse cx="77" cy="63" rx="62" ry="8" fill="#b8c9a7" />
    <path d="M25 16 126 14l12 31-12 13H19L9 42Z" fill="#829764" />
    <path d="M25 11h96q9 0 11 7l6 20q2 8-9 8H19q-11 0-8-8l8-22q2-5 6-5Z" fill="#e6c462" />
    <path d="M31 24h3m18 9h3m17-12h3m16 14h3m20-11h3" stroke="#aa833a" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

export function Choice({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className="pk-choice" aria-pressed={active} onClick={onClick}>{children}</button>;
}

export function Feedback({ children, tone = 'blue' }: { children: ReactNode; tone?: 'green' | 'red' | 'blue' }) {
  return <div className={`pk-feedback ${tone}`} aria-live="polite">{children}</div>;
}

export function Bars({ items, max = 100, unit = '%' }: {
  items: Array<{ label: string; value: number; tone: 'blue' | 'green' | 'red' }>; max?: number; unit?: string;
}) {
  return <div className="pk-bars">
    <div className="pk-axis" aria-hidden="true"><span>0{unit}</span><span>{max / 2}{unit}</span><span>{max}{unit}</span></div>
    {items.map(item => <div className="pk-bar-row" key={item.label}>
      <span>{item.label}</span>
      <div className="pk-track" aria-hidden="true"><div className={item.tone} style={{ width: `${item.value / max * 100}%` }} /></div>
      <strong>{item.value.toFixed(1)}{unit}</strong>
    </div>)}
  </div>;
}
