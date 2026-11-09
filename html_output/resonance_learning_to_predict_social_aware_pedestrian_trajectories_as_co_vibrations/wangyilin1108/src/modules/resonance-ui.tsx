import React, { useId, useRef } from 'react';
import type { Point } from './resonance-model';

export const color = {
  history: '#1756a5', baseline: '#607a90', own: '#007f77', social: '#bf560f',
  result: '#6246ad', truth: '#23794e', error: '#b83047',
};

type Route = { points: Point[]; color: string; dashed?: boolean; dots?: boolean; width?: number; opacity?: number };
type Marker = { point: Point; color: string; radius?: number };
type Arrow = { start: Point; end: Point; color: string };

export function Walker({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <g transform={`translate(${x},${y})`} aria-hidden="true">
    <ellipse cy="4" rx="16" ry="5" fill="#192c40" opacity=".14" />
    <path d="M-5 -17 L-10 0 M4 -17 L10 0" stroke="#263c55" strokeWidth="5" strokeLinecap="round" />
    <path d="M-7 -37 Q0 -42 7 -37 L10 -16 H-10 Z" fill={fill} />
    <path d="M-6 -33 L-14 -22 M6 -33 L14 -25" stroke="#a67454" strokeWidth="4" strokeLinecap="round" />
    <circle cy="-46" r="8" fill="#c48e69" />
    <path d="M-8 -47 Q0 -59 8 -47" fill="#263c55" />
  </g>;
}

const W = 900, H = 444;
const screenX = (p: Point) => 435 + p[0] * 50;
const screenY = (p: Point) => 242 - p[1] * 50;
const path = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${screenX(p)},${screenY(p)}`).join(' ');

export function Map({ routes, markers = [], arrows = [], people = [], handles = [],
  label, clean = false }: {
  routes: Route[]; markers?: Marker[]; arrows?: Arrow[]; people?: Marker[];
  handles?: { point: Point; label: string; change: (point: Point) => void }[];
  label: string; clean?: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const ids = useId();
  return <svg ref={svg} className="re-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
    <defs>{arrows.map((arrow, i) => <marker id={`${ids}-${i}`} key={i} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto" viewBox="0 0 8 8"><path d="M0 0L8 4L0 8z" fill={arrow.color}/></marker>)}</defs>
    <rect width={W} height={H} rx="20" fill="#eef4f6" />
    {clean ? <path d="M35 242 H865 M435 28 V412" fill="none" stroke="#c2cdd7" strokeWidth="2" /> : <>
      <path d="M0 80H900V360H0z" fill="#fbfaf5" />
      <path d="M0 80H900 M0 360H900" stroke="#d6cdb6" strokeWidth="3" />
      <path d="M0 124H900 M0 324H900" stroke="#e5e0d2" strokeWidth="2" strokeDasharray="16 12" />
      <path d="M574 80V360 M620 80V360 M666 80V360" stroke="#e9e4d6" strokeWidth="15" />
      <rect x="30" y="21" width="132" height="29" rx="7" fill="#c8d7c5"/><rect x="718" y="389" width="141" height="28" rx="7" fill="#c8d7c5"/>
      <circle cx="801" cy="42" r="20" fill="#b9cfbb"/><circle cx="835" cy="48" r="16" fill="#cfdbcb"/>
    </>}
    {routes.map((route, i) => <g key={i} opacity={route.opacity ?? 1}>
      <path d={path(route.points)} stroke={route.color} fill="none" strokeWidth={route.width ?? 5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={route.dashed ? '13 10' : undefined} />
      {route.dots && route.points.map((point, j) => <circle key={j} cx={screenX(point)} cy={screenY(point)} r="5" fill={route.color}/>)}
    </g>)}
    {arrows.map((arrow, i) => <line key={i} x1={screenX(arrow.start)} y1={screenY(arrow.start)} x2={screenX(arrow.end)} y2={screenY(arrow.end)} stroke={arrow.color} strokeWidth="4" markerEnd={`url(#${ids}-${i})`} />)}
    {markers.map((marker, i) => <circle key={i} cx={screenX(marker.point)} cy={screenY(marker.point)} r={marker.radius ?? 8} fill={marker.color} stroke="white" strokeWidth="3" />)}
    {people.map((person, i) => <Walker key={i} x={screenX(person.point)} y={screenY(person.point)} fill={person.color}/>)}
    {handles.map((handle, i) => <circle key={i} cx={screenX(handle.point)} cy={screenY(handle.point)} r="15"
      className="re-drag" aria-label={handle.label} fill="#fff" stroke={color.result} strokeWidth="5"
      onPointerDown={e => { if (e.isPrimary) e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const transform = svg.current?.getScreenCTM();
        if (!transform) return;
        const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(transform.inverse());
        handle.change([(point.x - 435) / 50, (242 - point.y) / 50]);
      }} />)}
  </svg>;
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="re-page">{children}</div>;
}

export function Split({ visual, children }: { visual: React.ReactNode; children: React.ReactNode }) {
  return <div className="re-split"><div className="re-visual">{visual}</div><div className="re-aside">{children}</div></div>;
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="re-note">{children}</p>;
}

export function Legend({ items }: { items: [string, string][] }) {
  return <div className="re-legend">{items.map(([label, hue]) => <span key={label}><i style={{ background: hue }} />{label}</span>)}</div>;
}

export function Choice({ labels, value, change, label }: {
  labels: string[]; value: number; change: (value: number) => void; label: string;
}) {
  return <div className="re-controls" role="group" aria-label={label}>{labels.map((name, i) =>
    <button key={name} aria-pressed={i === value} onClick={() => change(i)}>{name}</button>)}</div>;
}

export function Slider({ label, value, min, max, step = 1, change }: {
  label: string; value: number; min: number; max: number; step?: number; change: (value: number) => void;
}) {
  return <label className="re-slider">{label}<input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => change(event.currentTarget.valueAsNumber)} />
    <output>{Number.isInteger(step) ? value : value.toFixed(2)}</output></label>;
}

export function Matrix({ rows, columns, values }: { rows: string[]; columns: string[]; values: (string | number)[][] }) {
  return <table className="re-matrix"><thead><tr><th scope="col">行</th>{columns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{values.map((row, i) => <tr key={rows[i]}><th scope="row">{rows[i]}</th>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table>;
}

export function Bars({ entries, unit }: { entries: { label: string; value: number; color: string }[]; unit: string }) {
  const bound = Math.ceil(Math.max(...entries.map(row => row.value)) * 10) / 10;
  return <div className="re-bars">
    {entries.map(row => <div className="re-bar-row" key={row.label}><span>{row.label}</span><div className="re-bar-track">
      <div className="re-bar" style={{ width: `${row.value / bound * 100}%`, background: row.color }} />
    </div><b>{row.value.toFixed(3)} {unit}</b></div>)}
    <div className="re-bar-axis"><span>0</span><span>{bound.toFixed(1)} {unit}</span></div>
  </div>;
}
