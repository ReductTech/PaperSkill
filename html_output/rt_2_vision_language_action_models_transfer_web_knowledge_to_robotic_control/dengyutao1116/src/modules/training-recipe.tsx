import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type RecipeId = 'scratch' | 'robot' | 'co';
type Level = 'none' | 'weak' | 'good';

type Recipe = {
  id: RecipeId;
  name: string;
  color: string;
  status: string;
  headline: string;
  web: '无' | '有';
  robot: '有';
  weights: string;
  action: Level;
  semantic: Level;
  score: number;
  detail: string;
};

const recipes: Recipe[] = [
  {
    id: 'scratch',
    name: '从零训练',
    color: PAL.red,
    status: '最差',
    headline: '没有网页知识打底',
    web: '无',
    robot: '有',
    weights: '不使用 VLM 预训练权重',
    action: 'weak',
    semantic: 'none',
    score: 3,
    detail: '模型只靠机器人数据从头学习，缺少网页预训练中的视觉概念和语言语义。图 6b 中 5B 从零训练的 Unseen Average 只有 3%。',
  },
  {
    id: 'robot',
    name: '机器人数据微调',
    color: PAL.orange,
    status: '中间',
    headline: '动作学会，语义容易被冲掉',
    web: '无',
    robot: '有',
    weights: '从 VLM 权重开始，但后续只喂机器人数据',
    action: 'good',
    semantic: 'weak',
    score: 28,
    detail: '模型可以学到机器人动作，但微调过程中不再使用原始网页数据，先前语义知识容易退化。5B 对应 Unseen Average 为 28%。',
  },
  {
    id: 'co',
    name: '共同微调',
    color: PAL.green,
    status: '本文方案',
    headline: '动作和网页语义都保留',
    web: '有',
    robot: '有',
    weights: '从 VLM 权重开始，网页数据与机器人轨迹同时训练',
    action: 'good',
    semantic: 'good',
    score: 44,
    detail: '同一批训练中同时保留网页 VQA、图文数据和机器人轨迹，让模型既输出有效动作 token，又不忘记网页语义。5B 对应 Unseen Average 为 44%。',
  },
];

const levelText: Record<Level, string> = {
  none: '缺失',
  weak: '较弱',
  good: '掌握',
};

export const TrainingRecipe: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<RecipeId>('co');
  const selected = recipes.find((item) => item.id === selectedId)!;

  return (
    <div className="tr41">
      <div className="tr41-grid">
        {recipes.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`tr41-card ${selectedId === item.id ? 'is-active' : ''}`}
            onClick={() => setSelectedId(item.id)}
            style={{ '--accent': item.color } as React.CSSProperties}
          >
            <span className="tr41-status">{item.status}</span>
            <span className="tr41-name">{item.name}</span>
            <strong>{item.headline}</strong>
            <div className="tr41-data">
              <span><b>网页数据</b><i>{item.web}</i></span>
              <span><b>机器人数据</b><i>{item.robot}</i></span>
            </div>
            <p>{item.weights}</p>
            <div className="tr41-levels">
              <span><b>动作能力</b><i>{levelText[item.action]}</i></span>
              <span><b>网页语义</b><i>{levelText[item.semantic]}</i></span>
            </div>
            <div className="tr41-score">
              <span>5B Unseen Average</span>
              <strong>{item.score}%</strong>
            </div>
          </button>
        ))}
      </div>

      <div className="tr41-bar-row">
        {recipes.map((item) => (
          <div className="tr41-bar-card" key={item.id} style={{ '--accent': item.color } as React.CSSProperties}>
            <span>{item.name}</span>
            <div className="tr41-bar">
              <i style={{ width: `${item.score}%` }} />
            </div>
            <b>{item.score}%</b>
          </div>
        ))}
      </div>

      <section className="tr41-detail" style={{ '--accent': selected.color } as React.CSSProperties}>
        <b>{selected.name}</b>
        <p>{selected.detail}</p>
      </section>

      <p className="tr41-footnote">同规模 5B 下，三种配方的图 6b 读数为 3%、28%、44%；55B 共同微调的 Unseen Average 为 62%。能力等级用于教学比较，不替代论文数值。</p>
    </div>
  );
};

export default TrainingRecipe;
