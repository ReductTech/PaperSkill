import React from 'react';
import type { TutorialPart } from '../types';

export function PaperRoadmap({ parts }: { parts: TutorialPart[] }) {
  const guide = parts.find((part) => part.number === 0);
  const modules = [
    {
      id: 'efficiency',
      label: '模块一',
      title: '训练与推理效率优化',
      parts: parts.filter((part) => part.moduleId === 'efficiency'),
    },
    {
      id: 'capability',
      label: '模块二',
      title: '模型能力优化',
      parts: parts.filter((part) => part.moduleId === 'capability'),
    },
  ];

  return (
    <section className="paper-roadmap" aria-labelledby="paper-roadmap-title">
      <div className="paper-roadmap-heading">
        <div>
          <span>论文主线</span>
          <h2 id="paper-roadmap-title">两大模块 · 六个正文 Part</h2>
        </div>
        <p>先建立生成模型全局图，再沿“效率优化”和“能力优化”两条主线阅读。</p>
      </div>

      {guide ? (
        <a className="roadmap-guide" href={`#${guide.id}`}>
          <span className="roadmap-part-number">导读 · Part 0</span>
          <strong>{guide.title}</strong>
          <small>{guide.summary}</small>
        </a>
      ) : null}

      <div className="roadmap-modules">
        {modules.map((module) => (
          <section className={`roadmap-module is-${module.id}`} key={module.id}>
            <header>
              <span>{module.label}</span>
              <h3>{module.title}</h3>
            </header>
            <div className="roadmap-part-list">
              {module.parts.map((part) => (
                <a href={`#${part.id}`} className="roadmap-part" key={part.id}>
                  <span>Part {part.number}</span>
                  <strong>{part.title}</strong>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
