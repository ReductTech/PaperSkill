import { Bars, Sponge } from './palm-kit';

export function PalmGeneral() {
  return <div className="pk-body pk-split pk-general">
    <div className="pk-card pk-stack pk-vqa">
      <Sponge />
      <h2>同一 PaLM-E-562B 检查点</h2>
      <div className="pk-metrics"><div><strong>66.1</strong><span>OK-VQA 验证集</span></div>
        <div><strong>80.0</strong><span>VQAv2 test-dev</span></div></div>
      <p>同一模型可做视觉问答，也可参与具身任务。两种问答成绩来自不同基准。</p>
    </div>
    <div className="pk-card pk-stack">
      <h2>语言生成的相对降幅（越小越好）</h2>
      <Bars items={[
        { label: '12B 对 8B', value: 87.3, tone: 'red' },
        { label: '84B 对 62B', value: 61.6, tone: 'red' },
        { label: '562B 对 540B', value: 3.9, tone: 'red' },
      ]} />
      <p>相对各自的原始 PaLM，数值按图 6 绘制。最大一组在图 6 和正文为 3.9%，附录表 8 列为 3.8%。</p>
    </div>
  </div>;
}
