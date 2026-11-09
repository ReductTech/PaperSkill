import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type SymptomKey = 'night' | 'scan' | 'social';
type ChipKey = 'iso' | 'aniso' | 'down' | 'gauss' | 'jpeg' | 'sensor';

const SYMPTOMS: Record<SymptomKey, { title: string; desc: string; required: ChipKey[]; optional: ChipKey[] }> = {
  night: { title: '夜景高 ISO', desc: '暗部彩色噪点、亮部颗粒', required: ['sensor', 'gauss'], optional: ['jpeg'] },
  scan: { title: '老照片扫描', desc: '整体发虚、边缘有方向性拖影', required: ['aniso', 'down'], optional: ['iso'] },
  social: { title: '社交平台二次压缩', desc: '8×8 块、颜色断层', required: ['jpeg', 'down'], optional: ['gauss'] },
};

const CHIPS: { key: ChipKey; label: string; family: 'blur' | 'down' | 'noise' }[] = [
  { key: 'iso', label: '各向同性模糊', family: 'blur' },
  { key: 'aniso', label: '各向异性模糊', family: 'blur' },
  { key: 'down', label: '下采样', family: 'down' },
  { key: 'gauss', label: '高斯噪声', family: 'noise' },
  { key: 'jpeg', label: 'JPEG', family: 'noise' },
  { key: 'sensor', label: '传感器噪声', family: 'noise' },
];

function SymptomIcon({ kind }: { kind: SymptomKey }) {
  if (kind === 'night') {
    return (
      <svg viewBox="0 0 100 70" aria-hidden="true">
        <rect x="0" y="0" width="100" height="70" fill="#21324a" />
        <circle cx="72" cy="20" r="11" fill="#f6d98f" />
        <rect x="10" y="38" width="16" height="24" fill="#3b4a61" />
        <rect x="32" y="30" width="20" height="32" fill="#3b4a61" />
        <rect x="58" y="42" width="18" height="20" fill="#3b4a61" />
        {[[14, 30], [24, 52], [40, 24], [50, 58], [66, 34], [82, 50], [88, 28], [6, 60]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 1.1} fill={i % 3 ? '#f07e47' : '#9fc9df'} />
        ))}
      </svg>
    );
  }
  if (kind === 'scan') {
    return (
      <svg viewBox="0 0 100 70" aria-hidden="true">
        <rect x="0" y="0" width="100" height="70" fill="#e9e0cf" />
        <rect x="16" y="10" width="68" height="50" fill="#c9b99c" />
        <rect x="24" y="18" width="52" height="34" fill="#9a8a70" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={26 + i * 10} y={20} width="7" height="30" fill="#d9cfb8" opacity=".5" />)}
        <path d="M18 54 L82 16" stroke="#c43f52" strokeWidth="3" opacity=".75" />
        <path d="M18 58 L82 20" stroke="#f07e47" strokeWidth="2" opacity=".6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="0" y="0" width="100" height="70" fill="#f6f3ea" />
      {Array.from({ length: 10 }, (_, i) => <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="70" stroke="#d7deea" />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#d7deea" />)}
      <rect x="10" y="10" width="30" height="30" fill="#27446e" opacity=".45" />
      <rect x="40" y="10" width="30" height="30" fill="#f07e47" opacity=".45" />
      <rect x="10" y="40" width="30" height="20" fill="#228d5c" opacity=".35" />
      <rect x="40" y="40" width="30" height="20" fill="#c43f52" opacity=".35" />
    </svg>
  );
}

export function Ch4Diagnosis(_props: WidgetProps) {
  const [symptom, setSymptom] = useState<SymptomKey>('night');
  const [picked, setPicked] = useState<Set<ChipKey>>(new Set());
  const [checked, setChecked] = useState(false);
  const spec = SYMPTOMS[symptom];
  const missing = spec.required.filter((key) => !picked.has(key));
  const extra = [...picked].filter((key) => !spec.required.includes(key));
  const toggle = (key: ChipKey) => {
    setChecked(false);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const result = !checked
    ? { tone: 'is-blue', title: '待检查', text: '选好算子后点“检查配方”。' }
    : missing.length === 0
      ? { tone: 'is-green', title: '对症', text: extra.length ? '覆盖了主要症状；多选的算子能增加多样性，但不是对症的关键。训练时还要随机化强度与顺序。' : '覆盖了主要症状；训练时还要随机化强度与顺序。' }
      : { tone: 'is-red', title: '缺一项', text: `还缺：${missing.map((key) => CHIPS.find((c) => c.key === key)?.label).join('、')}。` };

  return (
    <div className="bsr-ch4-diagnosis">
      <section className="bsr-symptom-panel">
        <div className="bsr-panel-head"><span>病征卡</span><b>选一张</b></div>
        {(Object.keys(SYMPTOMS) as SymptomKey[]).map((key) => (
          <button key={key} className={`bsr-symptom-card ${symptom === key ? 'is-on' : ''}`} aria-pressed={symptom === key} onClick={() => { setSymptom(key); setPicked(new Set()); setChecked(false); }}>
            <SymptomIcon kind={key} />
            <span><b>{SYMPTOMS[key].title}</b><em>{SYMPTOMS[key].desc}</em></span>
          </button>
        ))}
      </section>
      <section className="bsr-recipe-builder">
        <div className="bsr-panel-head"><span>训练配方</span><b>{SYMPTOMS[symptom].title}</b></div>
        <div className="bsr-chip-grid">
          {CHIPS.map((chip) => (
            <button key={chip.key} className={`bsr-chip ${picked.has(chip.key) ? 'is-on' : ''}`} aria-pressed={picked.has(chip.key)} onClick={() => toggle(chip.key)}>
              <i className={chip.family} />{chip.label}
            </button>
          ))}
        </div>
        <div className="bsr-recipe-chain">
          <span>配方链</span>
          {picked.size === 0 ? <em>还没有算子</em> : (
            <div>
              {[...picked].map((key) => <b key={key}>{CHIPS.find((c) => c.key === key)?.label}</b>)}
            </div>
          )}
        </div>
        <button className="bsr-primary-btn" onClick={() => setChecked(true)}>检查配方</button>
        <p className="bsr-note">检查规则是本教程的教学诊断，不是论文分类器；真实训练仍需随机化强度与顺序。</p>
      </section>
      <aside className={`bsr-diagnosis-side ${result.tone}`}>
        <span className="bsr-result-title">{result.title}</span>
        <p>{result.text}</p>
        <div className="bsr-rule-card">
          <h3>症状 → 必选算子</h3>
          <p>夜景高 ISO：<b>传感器噪声 + 高斯</b></p>
          <p>老照片扫描：<b>各向异性模糊 + 下采样</b></p>
          <p>社交压缩：<b>JPEG + 下采样</b></p>
        </div>
        <div className="bsr-boundary-card">
          <h3>适用边界</h3>
          <p>模型用于<strong>合成训练数据</strong>，不用于反推某张 LR 的退化参数。</p>
          <p>BSRGAN 仍可能在纹理区产生“气泡”伪影。</p>
        </div>
      </aside>
    </div>
  );
}
