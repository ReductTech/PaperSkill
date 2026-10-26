import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';

function Point({ x, y }: { x: number; y: number }) {
  return { x, y };
}

export function BlockMse(_props: WidgetProps) {
  // 示意损失曲线（非原始图 2）
  const pts = [Point({ x: 0, y: 0.50 }), Point({ x: 10, y: 0.32 }), Point({ x: 20, y: 0.24 }), Point({ x: 30, y: 0.19 }), Point({ x: 40, y: 0.16 })];
  const px = (e: number) => 64 + (e / 40) * 520;
  const py = (loss: number) => 30 + (loss / 0.8) * 270;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${px(p.x)} ${py(p.y)}`).join(' ');
  return (
    <div className="aq-layout aq-two">
      <div className="aq-panel grow">
        <div className="aq-heading">block 输出 MSE 即优化目标</div>
        <p className="aq-body">不做逐层权重误差，而是让<b>量化前后 Transformer Block 的输出激活</b>尽量一致。</p>
        <p className="aq-formula">
          argmin<sub>A</sub> ‖ f(<SymbolHint meaning="X：输入激活。">X</SymbolHint>, <SymbolHint meaning="W：权重矩阵。">W</SymbolHint>) − f((<SymbolHint meaning="X：输入激活。">X</SymbolHint>−δ)·<SymbolHint meaning="A⁻¹：可逆仿射矩阵 A 的逆。">A⁻¹</SymbolHint>, Q(<SymbolHint meaning="A：可逆仿射变换矩阵。">A</SymbolHint>·<SymbolHint meaning="W：权重矩阵。">W</SymbolHint>), b + δ·W) ‖<sup>2</sup><sub>F</sub>
        </p>
        <p className="aq-note">‖·‖<sub>F</sub> = Frobenius 范数；δ 为平移项（官方 LLaMA 代码 shift=0，仅 OPT 启用）。最小化该目标等价于优化困惑度 <b>PPL ∝ CE ∝ 输出 MSE</b>。</p>
      </div>
      <div className="aq-panel">
        <div className="aq-heading">示意损失曲线</div>
        <svg viewBox="0 0 620 340" role="img" aria-label="示意损失随 epoch 下降，初始即低于 OmniQuant">
          <line x1="64" y1="30" x2="64" y2="300" stroke="#d7deea" strokeWidth="2" />
          <line x1="64" y1="300" x2="592" y2="300" stroke="#d7deea" strokeWidth="2" />
          <line x1="64" y1={py(0.7)} x2="592" y2={py(0.7)} stroke="#c43f52" strokeWidth="3" strokeDasharray="8 6" />
          <path d={d} fill="none" stroke="#228d5c" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p) => (
            <circle key={p.x} cx={px(p.x)} cy={py(p.y)} r="5" fill="#228d5c" />
          ))}
          <text x="60" y="322" fontSize="18" fill="#68778f">0</text>
          <text x="560" y="322" fontSize="18" fill="#68778f" textAnchor="end">40 epoch</text>
          <text x="40" y="44" fontSize="18" fill="#68778f">loss</text>
          <text x="596" y={py(0.7) + 4} fontSize="17" fill="#c43f52">OmniQuant 初始</text>
          <text x="596" y={py(0.16) + 4} fontSize="17" fill="#228d5c">AffineQuant</text>
        </svg>
        <p className="aq-note">示意估算，<b>非原始图 2</b>；参考 LLaMA-7B 最后 block 约 40 epoch，初始损失即低于 OmniQuant。</p>
      </div>
    </div>
  );
}