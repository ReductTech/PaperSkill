import { useId, useState } from "react";
import { binaryKL, coordinateStep, squaredCoordinate } from "./formula-model";
import "./reference-math-explorers.css";

const format = (value: number) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);

function ExplorerPlot({ kind, x, reverse = false }: { kind: "kl" | "square"; x: number; reverse?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const min = kind === "kl" ? 0.02 : -2;
  const max = kind === "kl" ? 0.98 : 2;
  const top = kind === "kl" ? 3 : 4.5;
  const X = (value: number) => 64 + ((value - min) / (max - min)) * 370;
  const Y = (value: number) => 238 - (value / top) * 190;
  const forward = (value: number) => kind === "kl" ? binaryKL(0.8, value).kl : squaredCoordinate(value).loss;
  const backward = (value: number) => binaryKL(0.8, value).reverse;
  const slope = kind === "kl" ? binaryKL(0.8, x).slope : squaredCoordinate(x).slope;
  const sample = Array.from({ length: 161 }, (_, index) => min + ((max - min) * index) / 160);
  const path = (valueAt: (value: number) => number) => sample
    .map((value, index) => `${index === 0 ? "M" : "L"}${X(value)},${Y(valueAt(value))}`)
    .join(" ");
  const xTicks = kind === "kl" ? [0.2, 0.4, 0.6, 0.8] : [-2, -1, 0, 1, 2];
  const yTicks = kind === "kl" ? [0, 1, 2, 3] : [0, 1, 2, 3, 4];
  const valueAt = forward(x);
  const tangentDx = (max - min) * 38 / 370;

  return <svg className="reference-explorer-plot" viewBox="0 0 480 286" role="img" aria-label={kind === "kl" ? "固定旧概率时的 KL 与反向 KL 曲线，以及当前点的切线" : "单坐标平方损失曲线，以及当前点的切线"}>
    <defs><clipPath id={uid}><rect x="63" y="46" width="372" height="193" /></clipPath></defs>
    {yTicks.map(tick => <g key={tick}><line x1="64" x2="435" y1={Y(tick)} y2={Y(tick)} className="explorer-gridline" /><text x="52" y={Y(tick) + 4} textAnchor="end">{tick}</text></g>)}
    <path d="M64 48V238H435" fill="none" className="explorer-axis" />
    {xTicks.map(tick => <g key={tick}><line x1={X(tick)} x2={X(tick)} y1="238" y2="243" className="explorer-axis" /><text x={X(tick)} y="263" textAnchor="middle">{tick}</text></g>)}
    <g clipPath={`url(#${uid})`}>
      <path d={path(forward)} className="explorer-forward" />
      {kind === "kl" && reverse && <path d={path(backward)} className="explorer-reverse" />}
      <line x1={X(x) - 38} x2={X(x) + 38} y1={Y(valueAt - slope * tangentDx)} y2={Y(valueAt + slope * tangentDx)} className="explorer-tangent" />
    </g>
    <line x1={X(x)} x2={X(x)} y1={Y(valueAt)} y2="238" className="explorer-guide" />
    <circle cx={X(x)} cy={Y(valueAt)} r="6" className="explorer-point" data-plot-x={x} data-plot-y={valueAt} data-plot-slope={slope} />
    <text x="435" y="283" textAnchor="end">{kind === "kl" ? "当前概率 q" : "分数差 δ = aₖ − zₖ"}</text>
  </svg>;
}

export function KLExplorer() {
  const [q, setQ] = useState(0.6);
  const [showReverse, setShowReverse] = useState(true);
  const result = binaryKL(0.8, q);

  return <section className="reference-math-explorer" data-math-explorer="kl" aria-labelledby="kl-explorer-title">
    <div className="explorer-copy"><h4 id="kl-explorer-title">移动当前概率，查看两种方向</h4><p>旧分布固定为 p=(0.8,0.2)，q 与 1−q 同时改变。橙色切线表示沿这条二类概率约束曲线的斜率。</p></div>
    <div className="explorer-key"><span>实线 D(p∥q)</span>{showReverse && <span>虚线 D(q∥p)</span>}<span className="explorer-tangent-key">当前切线</span></div>
    <ExplorerPlot kind="kl" x={q} reverse={showReverse} />
    <label className="explorer-control" htmlFor="reference-kl-q"><span>当前 Claude 概率 q</span><strong>{format(q)}</strong></label>
    <input id="reference-kl-q" type="range" min="0.02" max="0.98" step="0.01" value={q} onChange={event => setQ(Number(event.target.value))} />
    <div className="explorer-readout"><span>D(p∥q) <strong>{format(result.kl)}</strong></span><span>D(q∥p) <strong>{format(result.reverse)}</strong></span><span>dD/dq <strong>{format(result.slope)}</strong></span></div>
    <div className="explorer-actions"><button type="button" aria-pressed={showReverse} onClick={() => setShowReverse(value => !value)}>{showReverse ? "隐藏" : "显示"}反向散度</button><button type="button" onClick={() => setQ(0.8)}>令 q=p</button></div>
  </section>;
}

export function SquaredExplorer() {
  const [delta, setDelta] = useState(-1);
  const result = squaredCoordinate(delta);

  return <section className="reference-math-explorer" data-math-explorer="square" aria-labelledby="square-explorer-title">
    <div className="explorer-copy"><h4 id="square-explorer-title">单个分数坐标的平方曲线</h4><p>固定历史目标 z，只改变一个当前分数与它的差值 δ。该标量例用于观察梯度方向，不等同于共享参数网络的一次真实更新。</p></div>
    <ExplorerPlot kind="square" x={delta} />
    <label className="explorer-control" htmlFor="reference-square-delta"><span>起始差值 δ</span><strong>{format(delta)}</strong></label>
    <input id="reference-square-delta" type="range" min="-2" max="2" step="0.05" value={delta} onChange={event => setDelta(Number(event.target.value))} />
    <div className="explorer-readout"><span>ℓ=δ² <strong>{format(result.loss)}</strong></span><span>dℓ/dδ <strong>{format(result.slope)}</strong></span><span>η=0.2 一步后 <strong>{format(coordinateStep(delta))}</strong></span></div>
    <div className="explorer-actions"><button type="button" onClick={() => setDelta(value => coordinateStep(value))}>沿负梯度走一步</button><button type="button" onClick={() => setDelta(-1)}>恢复 δ=−1</button></div>
  </section>;
}
