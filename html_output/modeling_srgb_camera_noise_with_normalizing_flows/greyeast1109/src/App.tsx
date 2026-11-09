import { useEffect, useRef, useState } from 'react';
import { lessons, paperUrl, photoUrl, scenes, studyStages } from './data/study';
import type { Point, Scene } from './data/study';
import { DenoiseLab, ResultsLab } from './modules/EvidenceLab';
import { ArchitectureLab, IspLab, LikelihoodLab } from './modules/MechanismLab';
import { FlowLab, PhotoWipe, ResidualLab, ScenePicker } from './modules/PhotoLab';
import type { PhotoState } from './modules/PhotoLab';
import { SourceLink } from './modules/StudyUI';

const pageNumber = (index: number) => String(index + 1).padStart(2, '0');
const currentPage = () => Math.max(0, lessons.findIndex(lesson => `#${lesson.id}` === window.location.hash));
const startPoint = { x: 136, y: 150 };

function StudyRoute({ active }: { active?: number }) {
  return <div className="study-route" data-overview={active === undefined}>
    {active === undefined && <h2>从一张照片到去噪实验</h2>}
    <ol aria-label="论文的实验流程">
      {studyStages.map((stage, index) => <li key={stage.title} aria-current={index === active ? 'step' : undefined}>
        <span className="route-index">{index + 1}</span>
        <div><strong>{stage.title}</strong>{active === undefined && <small>{stage.description}</small>}</div>
      </li>)}
    </ol>
  </div>;
}

function Cover({ scene, onScene, onStart }: Pick<PhotoState, 'scene' | 'onScene'> & { onStart: () => void }) {
  return <section aria-labelledby="study-title">
    <div className="study-cover">
      <div className="cover-copy">
        <div className="cover-kicker"><span className="live-dot" /> 交互论文导读 <span className="cover-tag">CVPR 2022</span></div>
        <h1 id="study-title">给照片加上<br /><em>真实的相机噪声</em></h1>
        <p className="cover-intro">{lessons[0].intro}</p>
        <p className="cover-contribution">{lessons[0].contribution}</p>
        <div className="cover-actions">
          <button className="action-button" type="button" onClick={onStart}>开始实验 <span aria-hidden="true">→</span></button>
          <a href={paperUrl} target="_blank" rel="noreferrer">阅读原文 ↗</a>
        </div>
        <div className="cover-credit"><strong>Modeling sRGB Camera Noise with Normalizing Flows</strong><span>Kousha · Maleky · Brown · Brubaker</span></div>
      </div>
      <div className="cover-frame">
        <div className="frame-top"><span><i /> 原文图像对照</span><span>256 × 256 / sRGB</span></div>
        <PhotoWipe left={photoUrl(scene, 'clean')} right={photoUrl(scene, 'noisy')} leftLabel="干净参考" rightLabel="真实带噪" />
        <ScenePicker scene={scene} onScene={onScene} />
        <p className="evidence-note">拖动分割线查看局部颗粒。照片取自原文图 10 第 {scene.row} 行。</p>
      </div>
    </div>
    <StudyRoute />
  </section>;
}

export default function App() {
  const [page, setPage] = useState(currentPage);
  const [scene, setScene] = useState<Scene>(scenes[0]);
  const [point, setPoint] = useState<Point>(startPoint);
  const main = useRef<HTMLElement>(null);
  const lesson = lessons[page];
  const photos: PhotoState = { scene, point, onScene: setScene, onPoint: setPoint };

  const goTo = (index: number) => {
    const next = Math.min(lessons.length - 1, Math.max(0, index));
    if (page === next) return;
    history.pushState(null, '', `#${lessons[next].id}`);
    setPage(next);
  };

  useEffect(() => {
    const sync = () => setPage(currentPage());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (document.activeElement === document.body) main.current?.focus({ preventScroll: true });
  }, [page]);

  const lab = {
    start: null, isp: <IspLab />, residual: <ResidualLab {...photos} />, flow: <FlowLab {...photos} />,
    likelihood: <LikelihoodLab />, architecture: <ArchitectureLab />, results: <ResultsLab />,
    denoising: <DenoiseLab {...photos} />,
  }[lesson.id];

  return <div className="study-shell">
    <aside className="study-sidebar" aria-label="教程目录">
      <a className="study-brand" href="#start" onClick={event => { event.preventDefault(); goTo(0); }}>
        <span className="brand-icon" aria-hidden="true"><span /></span><span><strong>相机噪声实验台</strong><small>归一化流 · 论文导读</small></span>
      </a>
      <div className="sidebar-label">学习路线 <span>08 页</span></div>
      <nav>{lessons.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={page === index ? 'page' : undefined}
        onClick={event => { event.preventDefault(); goTo(index); }}><span>{pageNumber(index)}</span>{item.name}</a>)}</nav>
      <div className="sidebar-footer"><span>CVPR 2022</span><a href={paperUrl} target="_blank" rel="noreferrer">论文 PDF ↗</a></div>
    </aside>
    <div className="mobile-nav"><span className="mobile-brand"><span className="live-dot" /> 相机噪声实验台</span>
      <select aria-label="选择教程页面" value={page} onChange={event => goTo(Number(event.currentTarget.value))}>
        {lessons.map((item, index) => <option key={item.id} value={index}>{pageNumber(index)} · {item.name}</option>)}
      </select>
    </div>
    <main className="study-main" ref={main} tabIndex={-1}>
      <div className="study-content" key={lesson.id}>
        {lesson.id === 'start' ? <Cover scene={scene} onScene={setScene} onStart={() => goTo(1)} /> :
          <section aria-labelledby="study-title">
            <StudyRoute active={lesson.stage} />
            <header className="lesson-header">
              <div className="lesson-eyebrow">
                <span>{pageNumber(page)} / {lesson.label}</span>
                <SourceLink page={lesson.paperPage}>{lesson.source}</SourceLink>
              </div>
              <h1 id="study-title">{lesson.title}</h1>
              <p className="lesson-intro">{lesson.intro}</p>
              <p className="lesson-action"><span>动手看</span>{lesson.action}</p>
            </header>
            {lab}
            <p className="lesson-handoff"><strong>{lesson.id === 'denoising' ? '回到起点' : '接下来'}</strong><span>{lesson.handoff}</span></p>
          </section>}
      </div>
      <nav className="study-pager" aria-label="翻页">
        <button type="button" disabled={page === 0} onClick={() => goTo(page - 1)}>← <span>上一页</span></button>
        <div className="page-counter" aria-live="polite"><strong>{pageNumber(page)}</strong><span> / {lessons.length.toString().padStart(2, '0')}</span></div>
        <button type="button" disabled={page === lessons.length - 1} onClick={() => goTo(page + 1)}><span>下一页</span> →</button>
      </nav>
    </main>
  </div>;
}
