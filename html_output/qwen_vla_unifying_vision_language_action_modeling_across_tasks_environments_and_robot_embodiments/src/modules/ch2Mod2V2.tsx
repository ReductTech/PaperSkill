import React, { useMemo, useState } from 'react';
import { PsButton, PsChip, PsSliderRow } from '../components/ps-controls';
import { TensorGrid } from './tensorGrid';
import type { WidgetProps } from './registry';

const H = 8;
const K = 10;

type Preset = 'manip' | 'nav' | 'ego' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { c: number; h: number; label: string; hint: string }> = {
  manip: { c: 5, h: 7, label: '操纵', hint: '较多控制通道，未使用位置由 M=0 屏蔽。' },
  nav: { c: 3, h: 6, label: '导航', hint: '航点示意使用前 3 个通道：Δx / Δy / Δθ。' },
  ego: { c: 4, h: 8, label: '人体轨迹', hint: '轨迹类输出仍映射到同一 H×K 外形。' },
};

export const Ch2Mod2V2: React.FC<WidgetProps> = () => {
  const [c, setC] = useState(3);
  const [h, setH] = useState(6);
  const [preset, setPreset] = useState<Preset>('nav');
  const [selected, setSelected] = useState<{ t: number; k: number } | null>({ t: 2, k: 1 });
  const [scan, setScan] = useState(true);

  const valid = c * h;
  const total = H * K;
  const pad = total - valid;
  const ratio = Math.round((valid / total) * 100);
  const active = selected ? selected.k < c && selected.t < h : null;

  const maskRows = useMemo(
    () => Array.from({ length: H }, (_, t) => Array.from({ length: K }, (_, k) => (t < h && k < c ? 1 : 0))),
    [c, h]
  );

  const applyPreset = (kind: Exclude<Preset, 'custom'>) => {
    const p = PRESETS[kind];
    setPreset(kind);
    setC(p.c);
    setH(p.h);
    setSelected({ t: Math.min(2, p.h - 1), k: Math.min(1, p.c - 1) });
  };

  const setCustomC = (v: number) => {
    setPreset('custom');
    setC(v);
  };
  const setCustomH = (v: number) => {
    setPreset('custom');
    setH(v);
  };

  return (
    <div className="c2m2x-lab">
      <div className="c2m2x-topbar">
        <div className="c2m2x-presets" aria-label="动作布局示例">
          {(['manip', 'nav', 'ego'] as const).map((id) => (
            <PsChip key={id} selected={preset === id} onClick={() => applyPreset(id)}>{PRESETS[id].label}</PsChip>
          ))}
        </div>
        <div className="c2m2x-shape"><b>统一接口</b><span>Y ∈ R<sup>H×K</sup></span><i>{H} × {K}</i></div>
      </div>

      <div className="c2m2x-workbench">
        <section className="c2m2x-grid-stage">
          <div className="c2m2x-grid-head">
            <div><span>掩码显微镜</span><strong>哪些动作格真正参与训练？</strong></div>
            <button type="button" className={scan ? 'is-on' : ''} onClick={() => setScan((v) => !v)}>{scan ? '扫描中' : '启动扫描'}</button>
          </div>
          <div className={`c2m2x-grid-shell${scan ? ' is-scan' : ''}`}>
            <span className="c2m2x-axis c2m2x-axis--y">未来时间步 H ↓</span>
            <span className="c2m2x-axis c2m2x-axis--x">动作通道 K →</span>
            <TensorGrid
              rows={H}
              cols={K}
              activeC={c}
              activeH={h}
              showMask
              hoverCell={selected}
              onHover={(t, k) => setSelected({ t, k })}
              onLeave={() => undefined}
            />
            {scan ? <span className="c2m2x-scanline" aria-hidden="true" /> : null}
          </div>
          <div className="c2m2x-legend">
            <span><i className="is-valid" /> M=1 · 有效动作</span>
            <span><i className="is-pad" /> M=0 · padding</span>
          </div>
        </section>

        <aside className="c2m2x-console">
          <div className="c2m2x-kpis">
            <div><span>有效格</span><b>{valid}</b><small>/ {total}</small></div>
            <div><span>屏蔽格</span><b>{pad}</b><small>padding</small></div>
            <div><span>有效占比</span><b>{ratio}%</b><small>mask density</small></div>
          </div>

          <div className="c2m2x-mask-mini" aria-label="掩码矩阵缩略图">
            {maskRows.flatMap((row, t) => row.map((v, k) => <i key={`${t}-${k}`} className={v ? 'is-one' : 'is-zero'} />))}
          </div>

          <div className="c2m2x-sliders">
            <PsSliderRow label="有效通道 c" value={c} min={1} max={K} onChange={setCustomC} display={`${c} / ${K}`} />
            <PsSliderRow label="有效时间步 h" value={h} min={1} max={H} onChange={setCustomH} display={`${h} / ${H}`} />
          </div>

          <div className={`c2m2x-inspector${active === false ? ' is-pad' : ''}`}>
            <div className="c2m2x-inspector-title"><span>CELL INSPECTOR</span><b>{selected ? `t${selected.t + 1} · k${selected.k + 1}` : '悬停任意格'}</b></div>
            {selected ? (
              <div className="c2m2x-inspector-grid">
                <span>Mask</span><strong>{active ? '1' : '0'}</strong>
                <span>训练状态</span><strong>{active ? '参与 loss' : '梯度屏蔽'}</strong>
                <span>物理含义</span><strong>{active ? '原生控制量' : '无效占位'}</strong>
              </div>
            ) : <p>移动鼠标观察每个张量格如何被掩码处理。</p>}
          </div>

          <div className="c2m2x-caption">
            <span className="c2m2x-caption-dot" />
            <p>{preset === 'custom' ? '正在自定义有效区域；张量外形 H×K 始终不变。' : PRESETS[preset].hint}</p>
          </div>
        </aside>
      </div>

      <div className="ps-controls-row c2m2x-bottom">
        <PsButton variant="ghost" onClick={() => { setC(3); setH(6); setPreset('nav'); setSelected({ t: 2, k: 1 }); }}>恢复导航示例</PsButton>
        <span>改变 c / h 只改变有效区域，不改变统一张量接口。</span>
      </div>
    </div>
  );
};

export default Ch2Mod2V2;
