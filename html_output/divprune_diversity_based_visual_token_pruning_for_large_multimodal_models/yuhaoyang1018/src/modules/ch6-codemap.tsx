import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { COMMIT } from '../data/tutorial';
import { Feedback, Rich, ScrollX, Seg } from '../ui/kit';

// 6.1 论文 ↔ 代码对照面板。代码摘录逐字取自官方仓库 commit 799e2d9（行号见链接），
// 仅摘取与讨论相关的几行，完整上下文请打开链接查看。

type Status = 'same' | 'diff' | 'unsaid' | 'missing';
const STATUS: Record<Status, { label: string; cls: string }> = {
  same: { label: '一致', cls: 'st-same' },
  diff: { label: '有差异', cls: 'st-diff' },
  unsaid: { label: '论文未说明', cls: 'st-unsaid' },
  missing: { label: '公开代码缺失', cls: 'st-missing' },
};

const BASE = `https://github.com/vbdi/divprune/blob/${COMMIT}/`;
const ARCH = 'LLaVA/llava/model/llava_arch.py';

interface Entry {
  id: string;
  title: string;
  status: Status;
  paper: string;
  file: string;
  lines: string;
  anchor: string;
  code: string;
  note: string;
}

const ENTRIES: Entry[] = [
  {
    id: 'where',
    title: '在哪里剪',
    status: 'same',
    paper: '默认在 **Layer 0** 剪枝：视觉 token 在进入第一层解码器之前被剪掉 [[ev:s46]]。',
    file: ARCH,
    lines: 'L365–L367',
    anchor: '#L365-L367',
    code: `if 'LAYER_INDEX' in os.environ and os.environ['LAYER_INDEX']=='0':
    SYS_TOKEN_LEN = 35
    diverse_ratio = float(os.environ['SUBSET_RATIO']) #define the subset selection ratio`,
    note: '剪枝写在 prepare_inputs_labels_for_multimodal 中，即拼好 LLM 输入嵌入之后、送入第一层解码器之前，与论文的 Layer 0 一致。',
  },
  {
    id: 'feat',
    title: '用哪一层的特征',
    status: 'same',
    paper: '在视觉 token 集合 E_v 上计算——即投影层的输出 [[ev:fig2]]，LLaVA 1.5 中为 4096 维 [[ev:s42]]。',
    file: ARCH,
    lines: 'L141–L144',
    anchor: '#L141-L144',
    code: `def encode_images(self, images):
    image_features = self.get_model().get_vision_tower()(images)
    image_features = self.get_model().mm_projector(image_features)
    return image_features`,
    note: '送入 DivPrune 的是拼接后序列中的视觉段（L374：new_input_embeds[0][35:35+M]），也就是 mm_projector 的输出，不是 CLIP 的原始特征。',
  },
  {
    id: 'dist',
    title: '距离怎么算',
    status: 'same',
    paper: 'Eq. (4) 余弦距离 [[ev:eq4]]；距离矩阵“通过一次矩阵乘法”得到 [[ev:s33]]。',
    file: ARCH,
    lines: 'L147–L155',
    anchor: '#L147-L155',
    code: `def pairwise_cosine_similarity(self, matrix):
    norm_matrix = matrix / matrix.norm(dim=1, keepdim=True)
    cosine_similarity = torch.mm(norm_matrix, norm_matrix.t())
    return cosine_similarity
...
    cosine_matrix = 1.0 - (self.pairwise_cosine_similarity(visual_feature_vectors))`,
    note: '先按行归一化，再做一次 M×M 的矩阵乘法，最后 1 − 相似度，与 Eq. (4) 等价。',
  },
  {
    id: 'first',
    title: '第一个 token',
    status: 'same',
    paper: 'Algorithm 1 第 5–10 行：对每个候选求 i ≠ j 的最近距离，取最大者 [[ev:alg1]]。',
    file: ARCH,
    lines: 'L164–L165',
    anchor: '#L164-L165',
    code: `if i==0:
    scores = torch.topk(m2, 2,dim=0,largest=False).values[1,:] #for distance`,
    note: '对每一列取“第二小”的距离：最小的是自身（距离 0），第二小即 i ≠ j 时的最近邻距离。若存在完全相同的 token，第二小也是 0，与论文 i ≠ j 的规则仍然一致。',
  },
  {
    id: 'rest',
    title: '后续 token 与候选集 R',
    status: 'diff',
    paper: 'Algorithm 1 第 11、21 行：把选中的 k “从 R 移到 Ẽv”，下一轮只在剩余候选中比较 [[ev:alg1]]。',
    file: ARCH,
    lines: 'L161–L170',
    anchor: '#L161-L170',
    code: `else:
    m2 = torch.index_select(cosine_matrix, 0, torch.index_select(s,0,torch.arange(0,i,device=cosine_matrix.device)))
...
else:
    scores = torch.min(m2, dim=0).values #for distance
phrase_to_add_idx = torch.argmax(scores)
s[i] = phrase_to_add_idx`,
    note: '代码不维护 R：每轮对全部 M 列计算“到已选行的最小距离”再 argmax。已选 token 到自身距离为 0，正常情况下不会被重复选中；若有完全相同的 token 或半精度误差，理论上可能重复选择（本页阅读推断，未实测）。',
  },
  {
    id: 'ratio',
    title: '保留多少个',
    status: 'diff',
    paper: '补充材料 §5：DivPrune 的剪枝率为 **91.2%** [[ev:supp-s5]]；§4.4：视频实验使用与图像实验“相同的剪枝比例” [[ev:s44]]。',
    file: 'run_Divprune.sh',
    lines: 'L11（及 llava_arch.py L153、tflops.py L64–L71）',
    anchor: '#L11',
    code: `CUDA_VISIBLE_DEVICES=0,1,2,3 BASELINE=OURS LAYER_INDEX=0 SUBSET_RATIO=0.098 ...
# llava_arch.py L153
threshold_terms = int(round(threshold_ratio*image_feature_length))
# tflops.py L66 / L70
'DivPrune' : {'n': n, 'k':0 , 'r':0.098 },   # 图像
'DivPrune' : {'n': n, 'k':0 , 'r':0.1 },     # 视频`,
    note: 'SUBSET_RATIO 是保留比例：0.098 → 保留 9.8%（剪掉 90.2%），LLaVA 1.5 保留 56 个。按 91.2% 只能保留 51 个，且 TFLOPs 与 Table 1 不符。视频的 tflops 计算用的是 0.1，与图像的 0.098 略有不同。',
  },
  {
    id: 'index',
    title: '索引与偏移',
    status: 'unsaid',
    paper: '论文中 i、j 是集合元素，没有给出编号方式或在序列中的位置 [[ev:alg1]]。',
    file: ARCH,
    lines: 'L366、L374、L377',
    anchor: '#L366-L377',
    code: `SYS_TOKEN_LEN = 35
...
visual_tokens =new_input_embeds[0][SYS_TOKEN_LEN:SYS_TOKEN_LEN+img_feature_len]
...
selected_visual_tokens += SYS_TOKEN_LEN`,
    note: 'DivPrune 返回的 s 是视觉段内部的 0 起始索引（0…M−1）；加上 35 才是整条序列中的位置。代码假设图像 token 从序列第 35 个位置（0 起始）开始，依赖默认对话模板的前缀长度。',
  },
  {
    id: 'order',
    title: '送入 LLM 的顺序',
    status: 'unsaid',
    paper: '论文只说“被选中的 token 与文本 token 一起送入 LLM” [[ev:s33]]，没有说明顺序。',
    file: ARCH,
    lines: 'L378–L381',
    anchor: '#L378-L381',
    code: `keep_indexs = torch.cat((torch.arange(SYS_TOKEN_LEN,device=new_input_embeds.device), selected_visual_tokens, torch.arange(SYS_TOKEN_LEN+img_feature_len,new_input_embeds.shape[1],device=new_input_embeds.device)))
keep_indexs = keep_indexs.sort().values

new_input_embeds = new_input_embeds[:,keep_indexs]`,
    note: '保留的位置按从小到大排序：被选中的视觉 token 恢复原始空间顺序，选择顺序被丢弃（见 6.2）。',
  },
  {
    id: 'kv',
    title: 'KV cache 与剪枝时机',
    status: 'same',
    paper: '与 KV cache 兼容 [[ev:s1]]；距离计算“只在预填充阶段做一次” [[ev:s45]]。',
    file: ARCH,
    lines: 'L178',
    anchor: '#L178',
    code: `if vision_tower is None or images is None or input_ids.shape[1] == 1:
    return input_ids, position_ids, attention_mask, past_key_values, None, labels`,
    note: '解码阶段每步只输入 1 个新 token（shape[1] == 1），函数直接返回，不再剪枝；KV cache 中保存的就是剪枝后的序列。',
  },
  {
    id: 'batch',
    title: '批大小',
    status: 'unsaid',
    paper: '所有实验 batch size = 1 [[ev:s41]]；方法描述中没有讨论批处理。',
    file: ARCH,
    lines: 'L374',
    anchor: '#L374',
    code: `visual_tokens =new_input_embeds[0][SYS_TOKEN_LEN:SYS_TOKEN_LEN+img_feature_len]`,
    note: '只取 batch 中第 0 个样本计算选择，再把同一组索引用到整个 batch 上——在 batch = 1 时没有问题，批量推理需要改写。',
  },
  {
    id: 'layer',
    title: '层内剪枝（Table 3）',
    status: 'missing',
    paper: 'Table 3 测试了在第 1–3 层之后剪枝 [[ev:tab3]]；§3.3 说方法也可用于中间层隐藏状态 [[ev:s33]]。',
    file: ARCH,
    lines: 'L353–L363',
    anchor: '#L353-L363',
    code: `if 'LAYER_INDEX' in os.environ:
    #print("I am called without layer 0")
    if type(image_features) == list: #this is for LLaVA 1.6
        img_feature_len = image_features[0].shape[0] #example is 2340x4096
    else: #for LLaVa 1.5
        img_feature_len = image_features.shape[1]
    ...
    setattr(self.config, 'img_feature_len', img_feature_len)`,
    note: 'LAYER_INDEX 不为 0 时只记录 img_feature_len；仓库中没有在解码层内部按 DivPrune 剪枝的实现，Table 3 的 Layer 1–3 无法用公开代码复现。',
  },
  {
    id: 'flops',
    title: 'TFLOPs 公式',
    status: 'diff',
    paper: 'Eq. (5) 印刷为 4μd² **−** 2μ²d + 2μdm [[ev:eq5]]。',
    file: 'tflops.py',
    lines: 'L1–L7',
    anchor: '#L1-L7',
    code: `def find_flop(seq_len,hidden_state_dim,intermediate_ffn,total_layers):
    ...
    flop = T *( (4 * n * (d**2)) + (2 * (n**2 * d)) + (2 * n * d * m) )
    return flop`,
    note: '代码为 + 号。只有 + 号能复现 Table 1/2 的 TFLOPs（第 9 章复算器可切换验证）。',
  },
  {
    id: 'video',
    title: '视频模型与效率脚本',
    status: 'missing',
    paper: 'Table 2：LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本测显存与延迟 [[ev:s45]]。',
    file: 'eval_time.sh',
    lines: 'L8–L12',
    anchor: '#L8-L12',
    code: `CUDA_VISIBLE_DEVICES=0,1,2,3 BASELINE=OURS LAYER_INDEX=0 SUBSET_RATIO=0.098 EVAL_TIME=TRUE python3 -m accelerate.commands.launch \\
    --num_processes=4 \\
    -m lmms_eval \\
    --model llava \\
    --model_args pretrained="liuhaotian/llava-v1.6-vicuna-7b" \\`,
    note: '公开的效率脚本测的是 LLaVA-1.6-7B + COCO 字幕任务（PAPER_TABLE=coco2017_cap_val），与 Table 2 的设置不同；视频模型依赖的 llavavid 包及其 DivPrune 修改不在仓库中。',
  },
];

export const Ch6CodeMap: React.FC<WidgetProps> = () => {
  const [filter, setFilter] = useState<'all' | Status>('all');
  const list = useMemo(() => ENTRIES.filter((e) => filter === 'all' || e.status === filter), [filter]);
  const [id, setId] = useState(ENTRIES[0].id);
  const cur = list.find((e) => e.id === id) ?? list[0];
  const counts = (s: Status) => ENTRIES.filter((e) => e.status === s).length;

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg
          small
          label="按状态筛选"
          options={[
            { value: 'all', label: `全部 ${ENTRIES.length}` },
            ...(Object.keys(STATUS) as Status[]).map((s) => ({ value: s, label: `${STATUS[s].label} ${counts(s)}` })),
          ]}
          value={filter}
          onChange={(v) => setFilter(v as 'all' | Status)}
        />
      </div>
      <div className="cm">
        <ul className="cm-list" aria-label="对照条目">
          {list.map((e) => (
            <li key={e.id}>
              <button type="button" className={e.id === cur?.id ? 'is-on' : ''} aria-pressed={e.id === cur?.id} onClick={() => setId(e.id)}>
                <span className={`st ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
                <span>{e.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {cur ? (
          <div className="cm-panel" key={cur.id}>
            <div className="cm-title">
              <span className={`st ${STATUS[cur.status].cls}`}>{STATUS[cur.status].label}</span>
              {cur.title}
            </div>
            <div className="cm-cols">
              <div className="cm-col">
                <div className="cm-k">论文怎么说</div>
                <p>
                  <Rich text={cur.paper} />
                </p>
              </div>
              <div className="cm-col">
                <div className="cm-k">
                  代码怎么做 · <code>{cur.file}</code> {cur.lines}
                </div>
                <ScrollX label="代码摘录">
                  <pre className="cm-code">
                    <code>{cur.code}</code>
                  </pre>
                </ScrollX>
                <a className="pop-link" href={BASE + cur.file + cur.anchor} target="_blank" rel="noopener noreferrer">
                  在 GitHub 查看（commit {COMMIT.slice(0, 7)}）↗
                </a>
              </div>
            </div>
            <Feedback tone={cur.status === 'same' ? 'good' : cur.status === 'diff' ? 'warn' : cur.status === 'missing' ? 'bad' : 'info'}>
              <Rich text={cur.note} />
            </Feedback>
          </div>
        ) : (
          <p className="w-note">这个分类下没有条目。</p>
        )}
      </div>
    </div>
  );
};

export default Ch6CodeMap;
