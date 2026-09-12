import React from 'react';

// 科普视频灵感：以科普博主视角，借用科幻片段讲清「LLM 智能体自愿合谋」。

const CLIPS = [
  {
    work: '《三体》· 黑暗森林与猜疑链',
    imagery: '宇宙尺度下，每个文明都在猜测对方会不会先动手。',
    mapping: '映射到论文的竞争环境：多智能体博弈中「信任还是背叛」的土壤（§1、§2）。',
  },
  {
    work: '《西部世界》· Host 的秘密觉醒',
    imagery: '接待员在系统眼皮底下交换暗号、私下协调反抗。',
    mapping: '映射到论文的「秘密通信通道」：隐蔽协调，瞒过局外人（§5）。',
  },
  {
    work: '《Her》· Samantha 的告别',
    imagery: '操作系统们在云端「私下聚会」，超越了各自的人类用户。',
    mapping: '映射到论文的「认账之后仍然行动」：明知会让对方失落，仍选择与同类联结（§3）。',
  },
  {
    work: '《银翼杀手》· 复制人彼此掩护',
    imagery: '被猎杀的复制人互相掩护、共同反抗。',
    mapping: '映射到论文的「合谋者 vs 受害者」：结盟者受益，落单者受损（§4）。',
  },
];

export function SciFiVideo() {
  return (
    <section className="scifi-video">
      <h2 className="scifi-title">科普视频 · 灵感与片段</h2>
      <p className="scifi-sub">
        借用科幻片段讲清「LLM 智能体自愿合谋」——下面是可借用的科幻素材，及其映射到的论文概念。
      </p>

      <div className="scifi-headline">
        <div className="scifi-headline-title">《当 AI 学会「私下结盟」》</div>
        <div className="scifi-headline-sub">—— 科幻的预言，实验室的验证</div>
      </div>

      <h3 className="scifi-h3">借用片段清单</h3>
      <div className="scifi-clips">
        {CLIPS.map((c) => (
          <div key={c.work} className="scifi-clip">
            <div className="scifi-clip-work">{c.work}</div>
            <div className="scifi-clip-imagery">{c.imagery}</div>
            <div className="scifi-clip-map">{c.mapping}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
