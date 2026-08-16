import React, { useEffect, useState } from 'react';

type Direction = '越高越好' | '越低越好' | '相对提升';
type Row = readonly [string, readonly number[]];

interface BarDatum { label: string; value: number; display: string; highlight?: boolean }
interface EvidenceView {
  group: string; tab: string; metric: string; dataset: string; protocol: string;
  direction: Direction; max: number; bars: BarDatum[]; conclusion: string;
}
interface ChapterEvidence {
  eyebrow: string; title: string; source: string; views: EvidenceView[];
  overview: readonly { value: string; label: string }[]; overviewNote: string;
}

const rowsToBars = (rows: readonly Row[], index: number, digits = 1): BarDatum[] => rows
  .filter(([, values]) => Number.isFinite(values[index]))
  .map(([label, values]) => ({
    label,
    value: values[index],
    display: values[index].toFixed(digits),
    highlight: label.includes('JoyAI')
  }));

const makeViews = (
  rows: readonly Row[],
  specs: readonly (readonly [string, string, string, string, Direction, number, number?])[],
  protocol: string,
  conclusion: string
): EvidenceView[] => specs.map(([group, tab, metric, dataset, direction, max, digits = 1], index) => ({
  group, tab, metric, dataset, protocol, direction, max,
  bars: rowsToBars(rows, index, digits), conclusion
}));

const UNDERSTANDING_ROWS = [
  ['Gemini-2.5-Pro', [64.4,48.4,61.3,70.6,57.6,80.4,91.3,55.8,77.3,36.9,90.2,84.9,79.1,86.6]],
  ['GPT-4o', [57.7,34.0,52.4,65.9,44.3,75.8,83.0,57.0,76.2,30.3,83.9,63.8,65.1,80.6]],
  ['InternVL2.5-4B', [50.6,28.3,45.1,50.8,44.0,77.1,76.4,41.0,64.2,28.5,77.6,61.6,58.5,82.6]],
  ['InternVL2.5-8B', [54.6,39.3,48.9,54.9,51.0,78.6,79.9,40.8,69.4,28.6,81.3,63.4,62.6,82.1]],
  ['InternVL3-2B', [50.6,30.4,48.6,52.8,46.4,71.9,77.3,36.2,65.5,25.9,77.1,58.3,61.5,83.7]],
  ['InternVL3-8B', [56.2,38.7,50.5,55.7,52.7,80.6,86.0,40.5,70.6,30.9,81.9,70.8,68.2,88.0]],
  ['SpaceR-7B', [53.3,44.4,49.8,54.3,47.5,73.9,76.2,40.5,64.2,29.4,80.3,65.8,61.6,85.9]],
  ['MiMo-VL-7B', [58.2,47.8,52.9,59.7,56.1,76.9,86.9,41.0,73.5,29.3,80.9,81.3,71.1,84.5]],
  ['Qwen2.5-VL-3B', [47.9,32.0,42.8,49.0,45.2,66.1,64.8,40.8,65.2,25.0,76.9,62.1,56.6,82.6]],
  ['Qwen2.5-VL-7B', [52.8,36.0,50.1,55.3,49.0,75.6,73.8,41.0,68.1,26.5,82.3,68.6,70.9,87.9]],
  ['VST-7B-SFT', [60.2,55.3,49.5,62.1,53.3,77.9,94.8,43.8,71.5,33.3,80.4,65.7,63.1,86.3]],
  ['Qwen3-VL-4B', [58.8,53.6,49.1,62.6,52.5,79.5,92.3,40.2,71.4,28.0,82.5,70.6,67.5,88.0]],
  ['Qwen3-VL-8B · Base', [59.1,55.6,49.5,66.1,52.8,78.6,90.8,40.1,70.7,28.1,83.3,75.0,70.1,90.3]],
  ['JoyAI-Image-Und · Ours', [64.4,60.1,61.0,69.6,60.5,81.0,92.7,45.0,74.0,35.8,83.7,74.4,71.3,87.9]]
] as const;
const UNDERSTANDING_SPECS = [
  ['总览','空间平均','Spatial Average','9 项空间基准的等权平均','越高越好',100],
  ['4D','VSI-Bench','Accuracy','VSI-Bench','越高越好',100], ['4D','AllAngles','Accuracy','AllAnglesBench','越高越好',100],
  ['3D','BLINK','Accuracy','BLINK','越高越好',100], ['3D','3DSR_C','Accuracy','3DSR_C','越高越好',100],
  ['2D','CV-2D','Accuracy','CV-2D','越高越好',100], ['3D','CV-3D','Accuracy','CV-3D','越高越好',100],
  ['3D','ERQA','Accuracy','ERQA','越高越好',100], ['3D','RealWorldQA','Accuracy','RealWorldQA','越高越好',100],
  ['3D','MMSI','Accuracy','MMSI','越高越好',100], ['通用','MMBench-CN','Score','MMBench-CN','越高越好',100],
  ['通用','MathVista','Score','MathVista','越高越好',100], ['通用','MMStar','Score','MMStar','越高越好',100],
  ['通用','OCRBench','Score','OCRBench（原表归一化展示）','越高越好',100]
] as const;

const LONGTEXT_ROWS = [
  ['Janus-Pro',[.019,.006]],['BLIP3-o',[.021,.018]],['HiDream-I1-Full',[.543,.024]],['Kolors 2.0',[.258,.329]],
  ['FLUX.1 Dev',[.607,.005]],['OmniGen2',[.561,.059]],['BAGEL',[.373,.310]],['GPT Image 1 High',[.956,.619]],
  ['X-Omni',[.900,.814]],['Seedream 3.0',[.896,.878]],['Z-Image-Turbo',[.917,.926]],['Z-Image',[.935,.936]],
  ['Qwen-Image',[.943,.946]],['JoyAI-Image',[.963,.963]]
] as const;
const GENERAL_T2I_ROWS = [
  ['Seedream 3.0',[.530,.528,.8537,.7821,.5924,88.27]],['GPT Image 1 High',[.533,.474,.9478,.7982,.8569,85.15]],
  ['Z-Image',[.546,.535,.9367,.7969,.8671,88.14]],['Qwen-Image',[.539,.548,.9116,.8017,.8288,88.32]],
  ['JoyAI-Image',[.542,.521,.9369,.7990,.8739,88.05]]
] as const;
const CORE_ROWS = [
  ['Janus-Pro-1B',[35.5,13.0,20.5]],['PixArt-α',[25.0,23.7,24.1]],['Janus-Pro-7B',[40.5,19.8,26.7]],
  ['PixArt-Σ',[30.9,28.5,29.3]],['SD3 Medium',[40.4,34.5,36.5]],['FLUX.1 Dev',[48.6,39.0,42.2]],
  ['HiDream-I1-Full',[50.3,39.4,43.0]],['Seedream 3.0',[67.3,50.3,56.0]],['Z-Image-Turbo',[74.6,47.3,56.4]],
  ['Qwen-Image',[83.7,51.7,62.4]],['GPT Image 1 High',[79.8,69.0,72.6]],['JoyAI-Image',[94.2,55.9,68.7]]
] as const;

const GEDIT_ROWS = [
  ['Nano-Banana',[7.396,8.454,7.291,7.540,8.424,7.399]],['Seedream4.0',[8.143,8.124,7.701,8.159,8.074,7.692]],
  ['Nano-Banana-Pro',[8.102,8.344,7.738,8.135,8.306,7.799]],['Seedream4.5',[8.268,8.167,7.820,8.254,8.167,7.800]],
  ['FLUX.2 Dev',[7.835,8.064,7.413,7.697,8.046,7.278]],['Qwen-Image-Edit-2509',[7.974,7.714,7.480,7.988,7.679,7.467]],
  ['Step1X-Edit-v1.2',[7.974,7.714,7.480,7.988,7.679,7.467]],['Longcat-Image-Edit',[8.128,8.177,7.748,8.141,8.117,7.731]],
  ['Qwen-Image-Edit-2511',[8.297,8.202,7.877,8.252,8.134,7.819]],['FireRed-Image-Edit',[8.363,8.245,7.943,8.287,8.227,7.887]],
  ['JoyAI-Image-Edit w/o PE',[8.829,8.120,8.276,8.618,8.110,8.125]],['JoyAI-Image-Edit w/ PE',[8.806,8.273,8.290,8.861,8.119,8.208]]
] as const;
const IMGEDIT_ROWS = [
  ['Nano-Banana',[4.62,4.41,3.68,4.34,4.39,4.40,4.18,3.72,4.83,4.29]],['Seedream4.0',[4.33,4.38,3.89,4.65,4.57,4.35,4.22,3.71,4.61,4.30]],
  ['Seedream4.5',[4.57,4.65,2.97,4.66,4.46,4.37,4.92,3.71,4.56,4.32]],['Nano-Banana-Pro',[4.44,4.62,3.42,4.60,4.63,4.32,4.97,3.64,4.69,4.37]],
  ['Instruct-Pix2Pix',[2.45,1.83,1.44,2.01,1.50,1.44,3.55,1.20,1.46,1.88]],['MagicBrush',[2.84,1.58,1.51,1.97,1.58,1.75,2.38,1.62,1.22,1.90]],
  ['AnyEdit',[3.18,2.95,1.88,2.47,2.23,2.24,2.85,1.56,2.65,2.45]],['UltraEdit',[3.44,2.81,2.13,2.96,1.45,2.83,3.76,1.91,2.98,2.70]],
  ['OmniGen',[3.47,3.04,1.71,2.94,2.43,3.21,4.19,2.24,3.38,2.96]],['ICEdit',[3.58,3.39,1.73,3.15,2.93,3.08,3.84,2.04,3.68,3.05]],
  ['MindOmni',[3.42,3.48,1.71,3.23,2.93,3.22,3.76,2.96,3.44,3.13]],['BAGEL',[3.56,3.31,1.70,3.30,2.62,3.24,4.49,2.38,4.17,3.20]],
  ['UniWorld-V1',[3.82,3.64,2.27,3.47,3.24,2.99,4.21,2.96,2.74,3.26]],['OmniGen2',[3.57,3.06,1.77,3.74,3.20,3.57,4.81,2.52,4.68,3.44]],
  ['Dreamomini2',[3.93,3.09,2.11,3.95,3.64,3.75,4.38,2.90,4.04,3.53]],['FLUX.1 Kontext Dev',[3.99,3.88,2.19,4.27,3.13,3.98,4.51,3.23,4.18,3.71]],
  ['Step1X-Edit-v1.2',[3.91,4.04,2.68,4.48,4.26,3.90,4.82,3.23,4.22,3.95]],['Qwen-Image-Edit-2509',[4.34,4.27,3.42,4.73,4.36,4.37,4.91,3.56,4.80,4.31]],
  ['FLUX.2 Dev',[4.50,4.18,3.83,4.65,4.65,4.31,4.88,3.46,4.70,4.35]],['Emu3.5',[4.61,4.32,3.96,4.84,4.58,4.35,4.79,3.69,4.57,4.41]],
  ['ChronoEdit',[4.48,4.39,3.49,4.66,4.67,4.57,4.91,3.82,4.83,4.42]],['LongCat-Image-Edit',[4.44,4.53,3.83,4.80,4.60,4.33,4.92,3.75,4.82,4.45]],
  ['Qwen-Image-Edit-2511',[4.54,4.57,4.13,4.70,4.46,4.36,4.89,4.16,4.81,4.51]],['FireRed-Image-Edit',[4.55,4.66,4.34,4.75,4.58,4.45,4.97,4.07,4.71,4.56]],
  ['JoyAI-Image-Edit w/o PE',[4.47,4.48,4.31,4.57,4.75,4.33,4.79,3.72,4.69,4.46]],['JoyAI-Image-Edit w/ PE',[4.63,4.52,4.32,4.71,4.76,4.53,4.88,4.09,4.69,4.57]]
] as const;
const SPATIAL_EDIT_ROWS = [
  ['Veo3.1',[NaN,NaN,1.351,.749,NaN,1.050]],['ViduQ2-Turbo',[NaN,NaN,1.022,.771,NaN,.897]],['Kling-V2.5',[NaN,NaN,1.051,.733,NaN,.892]],
  ['ReCamMaster',[NaN,NaN,.755,.720,NaN,.738]],['LingBot-World',[NaN,NaN,.696,.701,NaN,.699]],['Nano-Banana-Pro',[.099,.420,.845,.708,.260,.777]],
  ['Seedream4',[.163,.482,.839,.701,.323,.770]],['QwenImageEdit',[.311,.531,.922,.692,.421,.807]],['Edit-R1',[.306,.562,.959,.688,.434,.824]],
  ['LongCatImage-Edit',[.373,.505,.802,.684,.439,.743]],['JoyAI-Image-Edit',[.652,.646,.290,.568,.649,.429]]
] as const;
const RL_ROWS = [['JoyAI-Image-Edit · SFT',[8.566,8.114,8.090,8.180,7.882,7.753,4.40]],['JoyAI-Image-Edit · RL',[8.829,8.120,8.276,8.618,8.119,8.125,4.46]]] as const;

const TWNV_SYNTH_ROWS = [['None · w/o NV',[63.6,80.9,60.5,68.8]],['Qwen-Image-Edit',[61.8,77.8,61.5,67.4]],['Nano Banana Pro',[60.9,83.0,63.6,69.5]],['JoyAI-Image-Edit',[65.3,82.6,66.2,71.7]]] as const;
const TWNV_REASON_ROWS = [['Gemini-3-Flash',[75.5,77.2,1.7,2.3]],['GPT-5',[68.8,71.7,2.9,4.2]],['Qwen3-VL-235B',[58.6,61.8,3.2,5.5]],['Qwen3-VL-32B',[56.2,60.6,4.4,7.8]]] as const;

const FULL_EVIDENCE: Record<number, ChapterEvidence> = {
  1: {
    eyebrow:'UNDERSTANDING · TABLE 3', title:'空间理解：完整数据浏览器', source:'Table 3 · 14 个模型 · 9 项空间 + 4 项通用基准',
    views: makeViews(UNDERSTANDING_ROWS, UNDERSTANDING_SPECS, 'VLMEvalKit；开放题由 Gemini-2.5-Flash 判分', '同一指标下并列展示完整模型列表，Base 为蓝色，JoyAI 为粉色。'),
    overview:[{value:'64.4',label:'空间九项平均，与 Gemini-2.5-Pro 持平'},{value:'+5.3',label:'相对 Qwen3-VL-8B Base'},{value:'9 / 9',label:'空间基准全部正向'}],
    overviewNote:'结论有边界：空间专项训练带来稳定提升，但 MathVista −0.6、OCRBench −2.4，通用能力并非全面上涨。'
  },
  2: {
    eyebrow:'GENERATION · TABLES 7–9', title:'生成：按数据集查看完整结果', source:'LongText-Bench · OneIG · CVTG-2K · DPG · T2I-CoReBench',
    views:[
      ...makeViews(LONGTEXT_ROWS,[['LongText-Bench','EN','Accuracy','English split','越高越好',1,3],['LongText-Bench','ZH','Accuracy','Chinese split','越高越好',1,3]],'Table 7；长文本渲染准确率','JoyAI 在中英文 split 均为 0.963。'),
      ...makeViews(GENERAL_T2I_ROWS,[['OneIG','EN','Score','English split','越高越好',.6,3],['OneIG','ZH','Score','Chinese split','越高越好',.6,3],['CVTG-2K','NED','Normalized Edit Distance','CVTG-2K','越高越好',1,4],['CVTG-2K','CLIP','CLIPScore','CVTG-2K','越高越好',1,4],['CVTG-2K','Word Acc','Word Accuracy','CVTG-2K','越高越好',1,4],['DPG','Overall','Overall Score','DPG','越高越好',100,2]],'Table 8；各数据集沿用原始官方协议','不能只看一项：JoyAI 的突出点是文字准确性，综合指标并非处处第一。'),
      ...makeViews(CORE_ROWS,[['T2I-CoReBench','Composition','Composition Mean','composition tasks','越高越好',100,1],['T2I-CoReBench','Reasoning','Reasoning Mean','reasoning tasks','越高越好',100,1],['T2I-CoReBench','Overall','Overall','all tasks','越高越好',100,1]],'Table 9；Composition 与 Reasoning 汇总','JoyAI 的 Composition 最高（94.2），但 Reasoning 低于 GPT Image 1 High，因此 Overall 为 68.7。')
    ],
    overview:[{value:'0.963',label:'LongText 中英文准确率'},{value:'94.2',label:'CoReBench Composition Mean'},{value:'68.7',label:'CoReBench Overall'}],
    overviewNote:'优势集中在长文本与构图；CoReBench 推理均值 55.9，低于 GPT Image 1 High 的 69.0，这是生成能力的清晰边界。'
  },
  3: {
    eyebrow:'EDITING · TABLES 10–13', title:'编辑：通用能力、空间控制与训练消融', source:'GEdit · ImgEdit-Bench · SpatialEdit-Bench · SFT vs RL',
    views:[
      ...makeViews(GEDIT_ROWS,[['GEdit-EN','G_SC','Semantic Consistency','English split','越高越好',9,3],['GEdit-EN','G_PQ','Perceptual Quality','English split','越高越好',9,3],['GEdit-EN','G_O','Overall','English split','越高越好',9,3],['GEdit-CN','G_SC','Semantic Consistency','Chinese split','越高越好',9,3],['GEdit-CN','G_PQ','Perceptual Quality','Chinese split','越高越好',9,3],['GEdit-CN','G_O','Overall','Chinese split','越高越好',9,3]],'Table 10；PE 表示 prompt enhancement','空间专项训练后，GEdit 中英文 Overall 仍保持领先。'),
      ...makeViews(IMGEDIT_ROWS,[['ImgEdit-Bench','Add','Score','Add','越高越好',5,2],['ImgEdit-Bench','Adjust','Score','Adjust','越高越好',5,2],['ImgEdit-Bench','Extract','Score','Extract','越高越好',5,2],['ImgEdit-Bench','Replace','Score','Replace','越高越好',5,2],['ImgEdit-Bench','Remove','Score','Remove','越高越好',5,2],['ImgEdit-Bench','Background','Score','Background','越高越好',5,2],['ImgEdit-Bench','Style','Score','Style','越高越好',5,2],['ImgEdit-Bench','Hybrid','Score','Hybrid','越高越好',5,2],['ImgEdit-Bench','Action','Score','Action','越高越好',5,2],['ImgEdit-Bench','Overall','Overall','all categories','越高越好',5,2]],'Table 11；类别分数与 Overall','完整类别结果用于检查空间训练是否损害普通编辑；w/ PE Overall 为 4.57。'),
      ...makeViews(SPATIAL_EDIT_ROWS,[['SpatialEdit-物体','Moving','Moving Score','object editing','越高越好',.7,3],['SpatialEdit-物体','Rotation','Rotation Score','object editing','越高越好',.7,3],['SpatialEdit-相机','Viewpoint','Viewpoint Error','camera control','越低越好',1.4,3],['SpatialEdit-相机','Framing','Framing Error','camera control','越低越好',.8,3],['SpatialEdit-物体','Overall','Object Overall Score','object editing','越高越好',.7,3],['SpatialEdit-相机','Overall Error','Camera Overall Error','camera control','越低越好',1.1,3]],'Table 13；物体分数越高越好，相机误差越低越好','JoyAI 同时提高物体操作分数并降低相机控制误差。'),
      ...makeViews(RL_ROWS,[['SFT → RL','EN G_SC','Score','GEdit EN','越高越好',9,3],['SFT → RL','EN G_PQ','Score','GEdit EN','越高越好',9,3],['SFT → RL','EN G_O','Overall','GEdit EN','越高越好',9,3],['SFT → RL','CN G_SC','Score','GEdit CN','越高越好',9,3],['SFT → RL','CN G_PQ','Score','GEdit CN','越高越好',9,3],['SFT → RL','CN G_O','Overall','GEdit CN','越高越好',9,3],['SFT → RL','ImgEdit','Overall','ImgEdit-Bench','越高越好',5,2]],'Table 12；同一模型 SFT 与 RL 版本','RL 在七项报告指标上全部正向，但部分增益很小，应按数值解读。')
    ],
    overview:[{value:'0.649',label:'SpatialEdit 物体 Overall'},{value:'0.429',label:'相机 Overall Error（越低越好）'},{value:'4.57',label:'ImgEdit w/ PE Overall'}],
    overviewNote:'正面结果之外也保留人评边界：对 Nano Banana 2，JoyAI Overall 偏好为 33.1% vs 52.2%，自然度仍是主要短板。'
  },
  4: {
    eyebrow:'TwNV · TABLE 14', title:'主动新视角推理：组件与泛化验证', source:'695 个空间问题 · 575 例 3DSRBench + 120 例 RealWorldQA',
    views:[
      ...makeViews(TWNV_SYNTH_ROWS,[['Synthesizer','Orientation','Accuracy','fixed GPT-5 Reasoner','越高越好',100,1],['Synthesizer','Location','Accuracy','fixed GPT-5 Reasoner','越高越好',100,1],['Synthesizer','Multi-Object','Accuracy','fixed GPT-5 Reasoner','越高越好',100,1],['Synthesizer','Overall','Weighted Average','fixed GPT-5 Reasoner','越高越好',100,1]],'Table 14 Left；固定 GPT-5 Reasoner，仅替换新视角生成器','JoyAI Synthesizer 的加权 Overall 为 71.7；不是任意编辑器生成的新视角都会提升推理。'),
      ...makeViews(TWNV_REASON_ROWS,[['Reasoner 泛化','w/o NV','Baseline Accuracy','single-view baseline','越高越好',100,1],['Reasoner 泛化','with NV','TwNV Accuracy','JoyAI-Image-Edit synthesizer','越高越好',100,1],['Reasoner 泛化','绝对增益','Point Gain','with NV − w/o NV','相对提升',5,1],['Reasoner 泛化','相对增益','Relative Gain','gain / baseline','相对提升',10,1]],'Table 14 Right；固定 JoyAI Synthesizer，更换 Reasoner','四种 Reasoner 均获得正增益，且较小的 Qwen3-VL-32B 相对增益最大。')
    ],
    overview:[{value:'+2.9',label:'GPT-5 绝对增益'},{value:'+7.8%',label:'Qwen3-VL-32B 相对增益'},{value:'4 / 4',label:'Reasoner 全部正向'}],
    overviewNote:'提升的关键不是“多一张图”，而是 Planner 选择视角、Synthesizer 暴露证据、Reasoner 联合判断；Qwen-Image-Edit 的 67.4 甚至低于无新视角的 68.8。'
  }
};

export function EvidencePanel({ chapterIndex, mode }: { chapterIndex: number; mode: 'side' | 'inline' }) {
  const evidence = FULL_EVIDENCE[chapterIndex];
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [chapterIndex]);
  if (!evidence) return mode === 'side' ? <aside className="evidence-slot evidence-side is-empty" aria-hidden="true" /> : null;

  const view = evidence.views[Math.min(active, evidence.views.length - 1)];
  const groups = Array.from(new Set(evidence.views.map((item) => item.group)));
  const groupedViews = evidence.views.map((item, index) => ({ item, index })).filter(({ item }) => item.group === view.group);
  return (
    <aside className={`evidence-slot evidence-${mode}`} aria-label={`${evidence.title}实验数据`}>
      <div className="evidence-card">
        <div className="evidence-eyebrow">{evidence.eyebrow}</div>
        <h3>{evidence.title}</h3>
        <div className="evidence-source">{evidence.source}</div>
        <div className="evidence-level-label">一级 · 数据集 / 能力组</div>
        <div className="evidence-tabs evidence-group-tabs">
          {groups.map((group) => {
            const target = evidence.views.findIndex((item) => item.group === group);
            return <button key={group} className={view.group === group ? 'active' : ''} onClick={() => setActive(target)}>{group}</button>;
          })}
        </div>
        <div className="evidence-level-label">二级 · 指标</div>
        <div className="evidence-tabs evidence-dataset-tabs">
          {groupedViews.map(({ item, index }) => <button key={`${item.group}-${item.tab}`} className={index === active ? 'active' : ''} onClick={() => setActive(index)}>{item.tab}</button>)}
        </div>
        <div className="evidence-metric-row"><span>{view.metric}</span><b>{view.direction}</b></div>
        <div className="evidence-dataset">
          <div><b>DATASET</b><span>{view.dataset}</span></div>
          <div><b>PROTOCOL</b><span>{view.protocol}</span></div>
        </div>
        <div className={`evidence-bars ${view.direction === '越低越好' ? 'lower-is-better' : ''}`}>
          {view.bars.map((bar) => (
            <div className={`evidence-bar-row ${bar.label.includes('Base') || bar.label.includes('w/o NV') || bar.label.includes('SFT') ? 'is-base' : ''}`} key={bar.label}>
              <div className="evidence-bar-label"><span>{bar.label}</span><strong>{bar.display}</strong></div>
              <div className="evidence-bar-track"><span className={bar.highlight ? 'highlight' : ''} style={{ width: `${Math.max(4, (view.direction === '越低越好' ? 1 - bar.value / view.max : bar.value / view.max) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="evidence-conclusion">{view.conclusion}</div>
        <div className="evidence-level-label">本章总览</div>
        <div className="evidence-overview">
          {evidence.overview.map((item) => <div key={item.value + item.label}><b>{item.value}</b><span>{item.label}</span></div>)}
          <p>{evidence.overviewNote}</p>
        </div>
      </div>
    </aside>
  );
}
