import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Readouts, Slider, Feedback, Source, FONT_SANS, FONT_MONO } from './kit';

// 模块 7.1：多尺度深监督（式 2–7，图 2 右侧）。
// 训练：五个侧输出 M1…M5（来自解码层输出 F1…F4 与瓶颈输出 F5，记号同原文图 2）各经上采样后与真值 Y 计算 BCE，再加上融合图 MΣ 的一项，共六项，权重均为 1。
// 推理：只取 M1，按固定阈值 0.5 二值化（§IV-B），不需要真值。

const SUB = '₁₂₃₄₅';

export const SupervisionLab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'train' | 'infer'>('train');
  const [sel, setSel] = useState(2); // 0..4 → M1..M5, 5 → MΣ
  const L = 256;
  const res = [L, L / 2, L / 4, L / 8, L / 16];
  const src = ['F₁', 'F₂', 'F₃', 'F₄', 'F₅'];
  const srcName = ['F₁（解码第 1 层）', 'F₂（解码第 2 层）', 'F₃（解码第 3 层）', 'F₄（解码第 4 层）', 'F₅（瓶颈）'];
  const train = mode === 'train';

  const W = 900;
  const H = 340;
  const ys = [40, 98, 156, 214, 272];
  const side = (i: number) => [44, 34, 26, 20, 14][i];
  const xF = 60;
  const xM = 190;
  const xB = 300;
  const xCat = 470;
  const xY = 760;
  const act = (i: number) => (train ? true : i === 0);
  const hot = (i: number) => sel === i;

  return (
    <div className="sx-lab">
      <Chips
        label="阶段"
        value={mode}
        onChange={(m) => {
          setMode(m);
          if (m === 'infer') setSel(0);
        }}
        options={[
          { value: 'train', label: '训练' },
          { value: 'infer', label: '推理' },
        ]}
      />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-diagram" role="group" aria-label="深监督结构，可点击各输出">
        <defs>
          <marker id="ds-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,1 L9,5 L0,9 z" fill={C.muted} />
          </marker>
        </defs>
        <g fontFamily={FONT_SANS}>
          <text x={xF} y={16} textAnchor="middle" fontSize={11.5} fill={C.muted}>特征 F<tspan baselineShift="sub" fontSize={8}>i</tspan></text>
          <text x={xM} y={16} textAnchor="middle" fontSize={11.5} fill={C.muted}>1×1 卷积 + Sigmoid</text>
          <text x={xB + 40} y={16} textAnchor="middle" fontSize={11.5} fill={C.muted}>双线性上采样 𝓑</text>
          {ys.map((y, i) => {
            const on = act(i);
            const s = side(i);
            return (
              <g key={i} opacity={on ? 1 : 0.25} className="sx-node" onClick={() => on && setSel(i)}>
                <rect x={xF - 34} y={y - 13} width={68} height={26} rx={5} fill={C.paper2} stroke={C.line2} />
                <text x={xF} y={y + 4} textAnchor="middle" fontSize={12} fill={C.ink}>
                  {src[i]}
                </text>
                <line x1={xF + 34} y1={y} x2={xM - s / 2 - 6} y2={y} stroke={C.muted} markerEnd="url(#ds-arr)" />
                <rect x={xM - s / 2} y={y - s / 2} width={s} height={s} fill="#10161d" stroke={hot(i) ? C.orange : C.ink2} strokeWidth={hot(i) ? 2.4 : 1} />
                <text x={xM + s / 2 + 8} y={y + 4} fontSize={12.5} fill={C.ink} fontWeight={600}>
                  M{SUB[i]}
                </text>
                <text x={xM + s / 2 + 34} y={y + 4} fontSize={10.5} fill={C.muted} fontFamily={FONT_MONO}>
                  {res[i]}²
                </text>
                {i > 0 ? (
                  <>
                    <line x1={xB} y1={y} x2={xB + 70} y2={y} stroke={C.muted} markerEnd="url(#ds-arr)" />
                    <text x={xB + 35} y={y - 6} textAnchor="middle" fontSize={10.5} fill={C.muted}>
                      ×{Math.pow(2, i)}
                    </text>
                  </>
                ) : (
                  <line x1={xB} y1={y} x2={xB + 70} y2={y} stroke={C.muted} strokeDasharray="2 3" markerEnd="url(#ds-arr)" />
                )}
                <rect x={xB + 78} y={y - 12} width={24} height={24} fill="#10161d" stroke={C.ink2} />
                {train ? (
                  <path d={`M ${xB + 102} ${y} C ${xCat + 40} ${y}, ${xY - 160} ${(y + 160) / 2}, ${xY - 26} ${160}`} fill="none" stroke={hot(i) ? C.orange : C.red} strokeOpacity={hot(i) ? 1 : 0.35} strokeWidth={hot(i) ? 2 : 1.2} strokeDasharray="5 4" />
                ) : null}
                {train ? <line x1={xB + 102} y1={y} x2={xCat - 22} y2={156} stroke={C.purple} strokeOpacity={0.35} /> : null}
              </g>
            );
          })}
          {train ? (
            <g className="sx-node" onClick={() => setSel(5)}>
              <rect x={xCat - 22} y={140} width={44} height={32} rx={5} fill="#f3effc" stroke={C.purple} />
              <text x={xCat} y={161} textAnchor="middle" fontSize={11} fill={C.purple}>
                拼接
              </text>
              <line x1={xCat + 22} y1={156} x2={xCat + 70} y2={156} stroke={C.purple} markerEnd="url(#ds-arr)" />
              <text x={xCat + 46} y={148} textAnchor="middle" fontSize={10} fill={C.purple}>1×1, σ</text>
              <rect x={xCat + 76} y={142} width={28} height={28} fill="#10161d" stroke={hot(5) ? C.orange : C.purple} strokeWidth={hot(5) ? 2.4 : 1.2} />
              <text x={xCat + 90} y={190} textAnchor="middle" fontSize={12.5} fill={C.purple} fontWeight={600}>
                M<tspan baselineShift="sub" fontSize={9}>Σ</tspan>
              </text>
              <path d={`M ${xCat + 104} 156 C ${xCat + 160} 156, ${xY - 120} 160, ${xY - 26} 160`} fill="none" stroke={hot(5) ? C.orange : C.red} strokeOpacity={hot(5) ? 1 : 0.35} strokeWidth={hot(5) ? 2 : 1.2} strokeDasharray="5 4" />
            </g>
          ) : null}
          {train ? (
            <g>
              <rect x={xY - 24} y={136} width={48} height={48} fill="#10161d" stroke={C.ink2} />
              <circle cx={xY + 6} cy={150} r={2.2} fill="#fff" />
              <text x={xY} y={204} textAnchor="middle" fontSize={12.5} fill={C.ink} fontWeight={600}>
                真值 Y
              </text>
              <text x={xY} y={222} textAnchor="middle" fontSize={11} fill={C.red}>
                6 项 BCE，λ = 1
              </text>
            </g>
          ) : (
            <g>
              <path d={`M ${xB + 102} ${ys[0]} L ${xY - 60} ${ys[0]}`} stroke={C.blue} strokeWidth={1.8} markerEnd="url(#ds-arr)" />
              <text x={(xB + xY) / 2 + 20} y={ys[0] - 8} textAnchor="middle" fontSize={11.5} fill={C.blue}>
                M₁ &gt; 0.5
              </text>
              <rect x={xY - 54} y={ys[0] - 22} width={44} height={44} fill="#10161d" stroke={C.blue} strokeWidth={1.6} />
              <rect x={xY - 30} y={ys[0] - 10} width={4} height={4} fill="#fff" />
              <text x={xY - 32} y={ys[0] + 40} textAnchor="middle" fontSize={12} fill={C.blue}>
                二值掩码
              </text>
            </g>
          )}
        </g>
      </svg>
      <Readouts
        cols={4}
        items={[
          { k: '所选输出', v: sel === 5 ? 'MΣ' : `M${SUB[sel]}`, tone: 'orange' },
          { k: '来源', v: sel === 5 ? '五图拼接' : srcName[sel] },
          { k: '原始分辨率（256 输入）', v: sel === 5 ? '256²' : `${res[sel]}²` },
          { k: '参与损失', v: train ? '是，λ = 1' : sel === 0 ? '不计算损失' : '推理时不用', tone: train ? 'red' : 'muted' },
        ]}
      />
      <Feedback tone={train ? 'info' : 'good'}>
        {train ? (
          sel === 5 ? (
            <>MΣ 把 M₁ 与上采样后的 M₂…M₅ 沿通道拼接，经 1×1 卷积与 Sigmoid 融合（式 3），它也有自己的一项损失 l<sub>Σ</sub>（式 6）。总损失 L = Σλ<sub>i</sub>l<sub>i</sub> + λ<sub>Σ</sub>l<sub>Σ</sub>，全部权重取 1（式 7）。</>
          ) : (
            <>
              M{SUB[sel]} 由 {srcName[sel]} 经 1×1 卷积与 Sigmoid 得到（式 2）{sel > 0 ? <>，先双线性上采样 ×{Math.pow(2, sel)} 到原图大小，再与真值计算 BCE（式 5）</> : <>，本身就是原图大小，直接与真值计算 BCE（式 4）</>}。深层输出也直接受监督，原文的目的是提高梯度传播效率与特征表达。
            </>
          )
        ) : (
          <>推理时只取 M₁（图 2 中标为 Output），以固定阈值 0.5 二值化；其余侧输出与真值都不参与。表 IV 中加入深监督（+DS）使三数据集平均 IoU 从 77.07 升到 77.73（+0.66 个百分点）。</>
        )}
      </Feedback>
      <Source>依据：§III-A 式 (2)–(7)，图 2；阈值 0.5 见 §IV-B。侧输出的来源与上采样倍数与图 2、作者代码一致；分辨率按 256×256 输入计算。</Source>
    </div>
  );
};

// 模块 7.2：训练配置与余弦退火学习率。拖动轮次，查看该轮的学习率。
export const ScheduleLab: React.FC<WidgetProps> = () => {
  const [ep, setEp] = useState(500);
  const T = 1000;
  const lr0 = 1e-3;
  const lrMin = 1e-5;
  const lr = (e: number) => lrMin + 0.5 * (lr0 - lrMin) * (1 + Math.cos((Math.PI * e) / T));
  const W = 560;
  const H = 230;
  const pad = { l: 64, r: 16, t: 14, b: 38 };
  const X = (e: number) => pad.l + (e / T) * (W - pad.l - pad.r);
  const Y = (v: number) => H - pad.b - (v / lr0) * (H - pad.t - pad.b);
  let d = '';
  for (let e = 0; e <= T; e += 10) d += `${e ? 'L' : 'M'}${X(e).toFixed(1)},${Y(lr(e)).toFixed(1)} `;
  const spec: [string, string][] = [
    ['优化器', 'Adam，初始学习率 0.001'],
    ['学习率策略', '余弦退火，逐渐降至 1×10⁻⁵'],
    ['批大小 / 轮数', '16 / 1000'],
    ['数据处理', '归一化；随机裁剪 256×256'],
    ['数据增强', '随机翻转与旋转'],
    ['初始化', 'Kaiming 初始化，不使用预训练权重'],
    ['损失', 'BCE（六项深监督，权重 1）'],
    ['二值化阈值', '0.5（沿用 [14][18][15]）'],
    ['硬件与耗时', '单张 RTX 3090，约 24 小时'],
  ];
  return (
    <div className="sx-lab">
      <div className="sx-split wide-left">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-chart" role="img" aria-label="余弦退火学习率曲线">
            <g fontFamily={FONT_SANS}>
              {[0, 0.5e-3, 1e-3].map((v) => (
                <g key={v}>
                  <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="grid" />
                  <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="tick">
                    {v === 0 ? '0' : v === 1e-3 ? '1e-3' : '5e-4'}
                  </text>
                </g>
              ))}
              {[0, 250, 500, 750, 1000].map((v) => (
                <text key={v} x={X(v)} y={H - pad.b + 18} textAnchor="middle" className="tick">
                  {v}
                </text>
              ))}
              <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle" className="axis">
                训练轮次（epoch）
              </text>
              <path d={d} fill="none" stroke={C.blue} strokeWidth={2} />
              <line x1={X(ep)} x2={X(ep)} y1={pad.t} y2={H - pad.b} stroke={C.orange} strokeDasharray="3 3" />
              <circle cx={X(ep)} cy={Y(lr(ep))} r={5.5} fill={C.orange} stroke="#fff" strokeWidth={1.5} />
            </g>
          </svg>
          <Slider label="轮次" min={0} max={1000} step={10} value={ep} onChange={setEp} display={`${ep}`} />
          <Readouts
            cols={2}
            items={[
              { k: '该轮学习率', v: <span style={{ fontFamily: FONT_MONO }}>{lr(ep).toExponential(2)}</span>, tone: 'orange' },
              { k: '相对初始值', v: ((lr(ep) / lr0) * 100).toFixed(1), unit: '%' },
            ]}
          />
        </div>
        <table className="sx-spec">
          <tbody>
            {spec.map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback tone="info">
        {ep < 300 ? '前期学习率接近 0.001，参数更新幅度大。' : ep < 700 ? '中段学习率按余弦平滑下降。' : '后期学习率趋近 1×10⁻⁵，用于细调。'}
        对比实验中，所有基于学习的方法都在相同训练集上重新训练，并采用各自原论文的固定阈值（§IV-B）。
      </Feedback>
      <Source>
        依据：§IV-B “Implementation Details”。曲线按标准余弦退火 lr(e) = lr<sub>min</sub> + ½(lr₀ − lr<sub>min</sub>)(1 + cos(πe/T)) 绘制，T = 1000——原文只写“用余弦退火逐渐降至 1×10⁻⁵”，作者代码使用 PyTorch 的 CosineAnnealingLR，eta_min = 1×10⁻⁵。约 24 小时的训练时长原文未说明对应哪个数据集。
      </Source>
    </div>
  );
};
