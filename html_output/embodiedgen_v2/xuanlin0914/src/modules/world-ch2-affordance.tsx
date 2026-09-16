import React, { useEffect, useState } from 'react';

const MEDIA = 'media/embodiedgen';
const ModelViewer = 'model-viewer' as React.ElementType;

const layers = [
  {
    id: 'semantic',
    label: 'Part semantics',
    model: 'ear_hear.glb',
    title: '先知道每个部件“是什么”',
    text: 'part-level semantics 把完整 mesh 分成对任务有意义的部件，后续的抓取与接触不再面对一个没有结构的整体。',
  },
  {
    id: 'grasp',
    label: 'Grasp candidate',
    model: 'ear_hear_afford.glb',
    title: '再给出可执行的接触候选',
    text: 'Affordance 不是物体名称，而是机器人能够在物体上可靠执行某个动作的位置与方式。',
  },
  {
    id: 'contact',
    label: 'Contact validation',
    model: 'ear_hear_collision.glb',
    title: '最后让候选通过物理验证',
    text: '候选点还要和 collision、尺度及物理参数一起检查，才能进入 simulator 中执行。',
  },
];

export const WorldCh2Affordance: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const [active, setActive] = useState(1);
  const layer = layers[active];

  useEffect(() => { void import('@google/model-viewer'); }, []);

  return (
    <div className="og-shell og-affordance-lab">
      <div className="og-hud"><span>ASSET SEMANTICS · INTERACTIVE VIEW</span><strong>FROM PART LABEL TO EXECUTABLE CONTACT</strong><i><b /> AFFORDANCE LAB</i></div>
      <div className="og-affordance-layout">
        <div className="og-affordance-stage">
          <ModelViewer
            key={layer.model}
            src={`${MEDIA}/models/${layer.model}`}
            camera-controls=""
            interaction-prompt="none"
            auto-rotate=""
            rotation-per-second="16deg"
            shadow-intensity="1"
            exposure="1.3"
            environment-image="neutral"
            camera-orbit="35deg 75deg 165%"
            alt={layer.label}
          />
          <div className="og-affordance-grid" aria-hidden="true" />
          <div className={`og-affordance-tag is-${layer.id}`}><i />{layer.label}</div>
          <div className="og-affordance-caption">点击拖动模型，观察当前语义层</div>
        </div>
        <div className="og-affordance-console">
          <p className="og-affordance-kicker">01 / 02 / 03 · 逐层收敛</p>
          <div className="og-affordance-tabs">
            {layers.map((item, index) => (
              <button key={item.id} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
                <em>0{index + 1}</em><span>{item.label}</span><b>{active === index ? 'ACTIVE' : 'VIEW'}</b>
              </button>
            ))}
          </div>
          <div className="og-affordance-readout">
            <span>ACTIVE LAYER</span>
            <h3>{layer.title}</h3>
            <p>{layer.text}</p>
          </div>
          <div className="og-affordance-path"><span>Asset</span><i /> <span>part label</span><i /> <span>validated grasp</span></div>
        </div>
      </div>
    </div>
  );
};
