import React, { useState } from 'react';
import { EvidenceMediaDrawer } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type InputMode = '文本' | '单图' | '多视图' | '视频';
type Lane = '世界生成' | '世界重建';

type Mission = {
  lane: Lane;
  goal: string;
  condition: string;
  inputNote: string;
  panoDetail?: string;
  navDetail?: string;
  stereoDetail?: string;
  anyModalDetail?: string;
  mirrorDetail: string;
  outputs: string[];
  caution: string;
};

const missions: Record<InputMode, Mission> = {
  文本: {
    lane: '世界生成',
    goal: '从语言条件想象未观测空间，再合成为可保存、可漫游的三维资产。',
    condition: '没有真实图像约束，系统需要先生成一个全景世界种子，再主动扩展视角。',
    inputNote: '语义最强，几何约束最少',
    panoDetail: '文本生成 360° 全景种子',
    navDetail: '在生成场景中规划互补轨迹',
    stereoDetail: '沿轨迹生成跨视角关键帧',
    mirrorDetail: '恢复几何并组合生成世界',
    outputs: ['3DGS', 'Mesh', '视频'],
    caution: '全部几何都来自生成先验，不能当作真实场景测量。',
  },
  单图: {
    lane: '世界生成',
    goal: '保留参考图的主体、风格和可见结构，同时补出图外的可探索区域。',
    condition: '单张图像只约束一个视角，遮挡区、背面和远处仍需要生成先验。',
    inputNote: '一个真实视角，未见区仍待补全',
    panoDetail: '把单视图扩展为 360° 全景',
    navDetail: '寻找背面、远端与俯视盲区',
    stereoDetail: '生成互相一致的关键帧',
    mirrorDetail: '恢复几何并输出显式资产',
    outputs: ['3DGS', 'Mesh', '视频'],
    caution: '参考图以外的结构并非唯一解，生成结果不等同于真实数字孪生。',
  },
  多视图: {
    lane: '世界重建',
    goal: '利用跨视角对应关系恢复被观测场景的相机、表面和显式三维表示。',
    condition: '输入已经提供多个观察方向，任务重点从想象未见空间切换为忠实恢复几何。',
    inputNote: '离散视角提供跨图对应',
    anyModalDetail: '融合图像与可选相机、深度先验',
    mirrorDetail: '共享骨干一次前馈联合预测',
    outputs: ['点图', '深度', '法线', '相机', '3DGS'],
    caution: '重建质量仍取决于视角覆盖、遮挡、图像质量和先验可靠性。',
  },
  视频: {
    lane: '世界重建',
    goal: '从连续拍摄序列中恢复持续一致的场景几何与相机轨迹。',
    condition: '视频提供密集观察，但重复帧、运动模糊和覆盖盲区仍会影响重建。',
    inputNote: '连续观察丰富，但可能冗余或模糊',
    anyModalDetail: '整理帧序列与可选相机先验',
    mirrorDetail: '联合预测几何、相机与 3DGS',
    outputs: ['点云', '深度', '法线', '相机', '3DGS'],
    caution: '拍摄不到的区域仍可能缺失，视频输入不自动保证完整覆盖。',
  },
};

const modes: InputMode[] = ['文本', '单图', '多视图', '视频'];
const modeIcons: Record<InputMode, string> = { 文本: 'T', 单图: '▣', 多视图: '▦', 视频: '▶' };

const generationStages = [
  { id: 'pano', name: 'HY-Pano 2.0' },
  { id: 'nav', name: 'WorldNav' },
  { id: 'stereo', name: 'WorldStereo 2.0' },
] as const;

export const HyMissionPlanner: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<InputMode>('单图');
  const mission = missions[mode];
  const isGeneration = mission.lane === '世界生成';

  const generationDetail: Record<(typeof generationStages)[number]['id'], string> = {
    pano: mission.panoDetail ?? '生成支路未启用',
    nav: mission.navDetail ?? '生成支路未启用',
    stereo: mission.stereoDetail ?? '生成支路未启用',
  };

  return (
    <div className="mission-planner">
      <div className="learning-contract"><div><span>为什么学</span><p>四种输入并不走同一条前处理路线；线索多少决定系统是先生成观察，还是直接重建。</p></div><div><span>本次操作</span><p>点击任一输入任务卡，观察高亮路径如何改变，未经过的模块会同步变灰。</p></div><div><span>应得判断</span><p>文本/单图走生成主链，多视图/视频跳过前三阶段，但两条路线都在 WorldMirror 2.0 汇合。</p></div></div>
      <section className={`mission-atlas ${isGeneration ? 'generation' : 'reconstruction'}`} aria-live="polite">
        <header className="mission-atlas-head">
          <div>
            <span>四种输入，共享一张系统任务图</span>
            <strong>点击输入卡切换高亮路径；未经过的模块保持灰色</strong>
          </div>
          <b>{mission.lane}</b>
        </header>
        <button type="button" className="mission-click-cue" onClick={() => setMode(mode === '文本' ? '单图' : mode === '单图' ? '多视图' : mode === '多视图' ? '视频' : '文本')}><span aria-hidden="true">↳</span><strong>输入任务卡可点击</strong><small>点这里也可依次预览四条路径</small></button>

        <div className="mission-map-scroll">
          <div className="mission-map">
            <div className="mission-input-stack" role="group" aria-label="选择输入形式并切换系统路径">
              <span className="mission-column-label">输入任务卡</span>
              {modes.map((item) => {
                const itemMission = missions[item];
                const selected = mode === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`mission-map-input ${selected ? 'selected' : 'muted'} ${itemMission.lane === '世界生成' ? 'generation' : 'reconstruction'}`}
                    onClick={() => setMode(item)}
                    aria-pressed={selected}
                  >
                    <div className="mission-input-title"><i aria-hidden="true">{modeIcons[item]}</i><span>{item}</span></div>
                    <strong>{itemMission.lane}</strong>
                    <small>{itemMission.inputNote}</small>
                  </button>
                );
              })}
            </div>

            <div className="mission-split" aria-hidden="true">
              <span>按输入<br />丰富度分流</span>
              <i className={isGeneration ? 'active' : ''}>生成</i>
              <i className={!isGeneration ? 'active' : ''}>重建</i>
            </div>

            <div className="mission-lane-stack">
              <section className={`mission-map-lane generation ${isGeneration ? 'active' : 'muted'}`} aria-label="世界生成共享路径">
                <header><span>稀疏线索</span><strong>世界生成路径</strong><small>文本与单图共享四阶段主链</small></header>
                <div className="mission-map-stages">
                  {generationStages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                      <div className={`mission-map-stage ${isGeneration ? 'active' : 'muted'}`}>
                        <b>{index + 1}</b>
                        <span>{stage.name}</span>
                        <small>{generationDetail[stage.id]}</small>
                      </div>
                      {index < generationStages.length - 1 ? <i className="mission-map-arrow" aria-hidden="true">→</i> : null}
                    </React.Fragment>
                  ))}
                  <i className="mission-map-arrow" aria-hidden="true">→</i>
                </div>
              </section>

              <section className={`mission-map-lane reconstruction ${!isGeneration ? 'active' : 'muted'}`} aria-label="世界重建共享路径">
                <header><span>丰富观察</span><strong>世界重建路径</strong><small>多视图与视频跳过生成扩展</small></header>
                <div className="mission-map-stages compact">
                  <div className={`mission-map-stage ${!isGeneration ? 'active' : 'muted'}`}>
                    <b>1</b>
                    <span>Any-Modal 输入</span>
                    <small>{mission.anyModalDetail ?? '重建支路未启用'}</small>
                  </div>
                  <i className="mission-map-arrow" aria-hidden="true">→</i>
                </div>
              </section>
            </div>

            <section className="mission-shared-core" aria-label="生成与重建共享的 WorldMirror 2.0">
              <div className="mission-shared-feeds" aria-hidden="true">
                <span className={isGeneration ? 'active generation' : 'generation'}>生成路径 ↘</span>
                <span className={!isGeneration ? 'active reconstruction' : 'reconstruction'}>重建路径 ↗</span>
              </div>
              <b>共享重建核心</b>
              <strong>WorldMirror 2.0</strong>
              <small>{mission.mirrorDetail}</small>
              <em>两条路径在这里汇合</em>
            </section>

            <section className="mission-shared-output" aria-label="当前路径输出">
              <div><span>共享落点</span><strong>显式三维资产</strong><small>WorldMirror 2.0 把生成观察或真实观察统一落成可保存、可渲染的空间表示。</small></div>
              <div className="mission-output-assets">{mission.outputs.map((output) => <b key={output}>{output}</b>)}</div>
              <i aria-hidden="true">交给 WorldLens → 实时渲染与漫游</i>
            </section>
          </div>
        </div>
      </section>

      <section className="mission-current-brief">
        <header>
          <div><span>当前任务</span><strong>{mode} → {mission.lane}</strong></div>
          <small>{mission.inputNote}</small>
        </header>
        <div className="mission-brief-grid">
          <p><b>任务目标</b>{mission.goal}</p>
          <p><b>分流原因</b>{mission.condition}</p>
          <p><b>使用边界</b>{mission.caution}</p>
        </div>
      </section>

      <EvidenceMediaDrawer mediaType="论文原图" src="/images/figure-2-architecture.png" title="论文 Figure 2：HY-World 2.0 整体系统架构" caption="论文原图展示世界生成与世界重建两条输入路径如何汇入共享的重建与三维资产环节。上方任务图是为四种输入重新编排的教学视图。" alt="论文 Figure 2 HY-World 2.0 整体架构原图" />

      <div className={`feedback ${isGeneration ? '' : 'good'}`}>
        四种输入不是四套彼此独立的模型：文本与单图共享生成主链，多视图与视频共享重建入口，两条路径最终都依赖 WorldMirror 2.0 形成显式三维资产。官网展示的导出格式属于产品能力说明，论文数字仍需按各自协议阅读。
      </div>
    </div>
  );
};
