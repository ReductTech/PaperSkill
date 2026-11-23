import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

type Part = 'student' | 'teacher' | 'lora' | 'tavsd';
const PARTS: Record<Part, { name: string; fact: string; color: string }> = {
  student: { name: '学生模型 G_θ', fact: '输入 LQ 与 tₛ，一次前向得到 ẑ₀，再解码成照片。', color: '#27446e' },
  teacher: { name: '老师模型 ε_ψ', fact: '冻结的 SD 老师只看加噪后的 ẑ_tᵥ 与 tᵥ，给出真实分布方向。', color: '#228d5c' },
  lora: { name: 'LoRA 模型 ε_φ', fact: '带可训练 LoRA 的复制模型，在学生输出上训练，通常更平滑。', color: '#7c3aed' },
  tavsd: { name: 'TAVSD 损失', fact: '两位老师的 latent 预测相减，梯度只回到学生，不更新老师。', color: '#f07e47' },
};
const BOX: Record<Part, { left: string; top: string; width: string; height: string }> = {
  student: { left: '14%', top: '13%', width: '25%', height: '29%' },
  teacher: { left: '61%', top: '12%', width: '13%', height: '21%' },
  lora: { left: '61%', top: '45%', width: '13%', height: '26%' },
  tavsd: { left: '68%', top: '34%', width: '14%', height: '11%' },
};

export function TadsrArch(_: WidgetProps) {
  const [part, setPart] = useState<Part>('student');
  const [ts, setTs] = useState(500);
  const p = PARTS[part];

  return (
    <div className="studio-page tadsr-arch">
      <div className="studio-card tadsr-arch-map">
        <div style={{ position: 'absolute', left: 14, right: 14, top: '50%', transform: 'translateY(-50%)', aspectRatio: '1250 / 545' }}>
          <img src="./images/fig2_arch.png" alt="论文 Fig.2：TADSR 训练结构总览" />
          {(Object.keys(BOX) as Part[]).map(key => (
            <button key={key} className={`tadsr-arch-hot ${part === key ? 'is-on' : ''}`}
              style={{ ...BOX[key], borderColor: part === key ? '#f07e47' : 'transparent' }}
              aria-label={`查看${PARTS[key].name}`} onClick={() => setPart(key)} />
          ))}
        </div>
      </div>
      <div className="tadsr-arch-side">
        <div className="studio-row">
          {([['student','学生'],['teacher','老师'],['lora','LoRA'],['tavsd','TAVSD']] as [Part,string][]).map(([key,label]) => (
            <button key={key} className={`studio-btn ${part === key ? 'is-on' : ''}`} onClick={() => setPart(key)}>{label}</button>
          ))}
        </div>
        <div className="studio-card" style={{ padding: '14px 16px', display: 'grid', gap: 6 }}>
          <p className="studio-text" style={{ fontWeight: 800 }}>{p.name}</p>
          <p className="studio-muted">{p.fact}</p>
        </div>
        <div className="studio-card" style={{ padding: '10px 14px' }}>
          <label className="studio-slider">
            <span>当前学生档位 tₛ</span><b>{ts}</b>
            <input type="range" min={200} max={600} step={50} value={ts} aria-label="当前学生档位"
              onChange={e => setTs(Number(e.target.value))} />
          </label>
          <p className="studio-caption">tᵥ 标签 ≈ {Math.round(ts * 0.5)}（默认 λ=0.5, γ=0）；只移动标签，不执行网络。</p>
        </div>
        <p className="studio-feedback is-paper">学生一次前向；老师与 LoRA 只在训练期给方向。</p>
      </div>
    </div>
  );
}
