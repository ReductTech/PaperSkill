interface QuestionSpec {
  question: string;
  route: [string, string, string];
}

const QUESTIONS: Record<string, QuestionSpec> = {
  'chap-1': {
    question: '为什么“看懂图片”还不等于“理解空间”，JoyAI-Image 又怎样跨过这一步？',
    route: ['识别单视角缺口', '引出三任务方法', '跑通 Figure 4']
  },
  'chap-2': {
    question: '如何在保留通用多模态能力的同时，把擅长二维语义理解的 MLLM 训练成更强的空间理解模型？',
    route: ['定义空间能力', '构造并注入监督', '验证能力提升']
  },
  'chap-3': {
    question: 'JoyAI-Image 怎样从数据出发，经过分阶段训练，获得可验证的生成能力？',
    route: ['Data · 学什么', 'Training · 怎么学', 'Results · 学会了吗']
  },
  'chap-4': {
    question: 'JoyAI-Image-Edit 怎样从空间数据出发，学会精确操纵物体与相机？',
    route: ['Data · 两条空间分支', 'Training · 改与保留', 'Results · 空间验证']
  },
  'chap-5': {
    question: '当原始视角不足以回答问题时，模型如何主动生成新视角作为证据？',
    route: ['规划观察位置', '合成新视角', '联合证据推理']
  },
  'chap-6': {
    question: '这篇论文最终建立了一条怎样的空间智能主线？',
    route: ['回看三项任务', '对应训练与证据', '闭合新视角推理']
  }
};

export function ChapterBridge({ text, chapterId }: { text: string; chapterId: string }) {
  const spec = QUESTIONS[chapterId];
  if (!spec) return <div className="chap-bridge"><div className="cb-text" dangerouslySetInnerHTML={{ __html: text }} /></div>;

  return (
    <div className="chap-bridge chapter-question">
      <div className="cb-icon" aria-hidden="true">?</div>
      <div className="cb-body">
        <div className="cb-title">CHAPTER QUESTION · 本章问题</div>
        <div className="cb-question">{spec.question}</div>
        <div className="cb-route" aria-label="本章阅读路线">
          {spec.route.map((step, index) => (
            <span key={step}><b>{String(index + 1).padStart(2, '0')}</b>{step}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
