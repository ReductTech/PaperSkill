import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const BLUE = '#8fb8ff';
const GREEN = '#62d29a';
const RED = '#ff7c91';
const ORANGE = '#f7ad62';
const PURPLE = '#b18cff';
const BG = '#0b1626';
const LINE = '#2a3b55';
const INK = '#f4f7fb';
const MUTED = '#c6d0df';
const PANEL = '#101b2c';
const PANEL_SOFT = '#17263d';
const DARK_TEXT = '#07111f';

type Feedback = { text: string; cls: '' | 'good' | 'bad' };
type State = Record<string, number | string>;

const segments = [
  {
    key: 'prompt',
    name: '用户问题 q',
    desc: '用户问题 q 是轨迹的第一条任务说明。它规定智能体到底要查什么、最后要回答什么，Discard-All 清空历史后也必须保留它。',
    body:
      '用户问题 q 是用户交给网页智能体的原始任务文本。它不是智能体后来查到的证据，也不是模型自己的猜测，而是整条轨迹的目标约束。后面每一轮搜索、网页访问和答案判断，都应该回到这句话检查：我现在做的动作是不是还在解决原问题。',
    points: [
      '具体长相：`q = 找出那首歌：线索人物出生于 10 月 3 日，是天秤座，并且 14 岁时加入 Cambodian Crips。`',
      '它在轨迹里通常只出现一次，位于最开头。后面上下文再长，q 仍然告诉智能体“最终要交付的是歌名”。',
      'Discard-All 会丢掉后面的思考、工具调用和网页返回，但不会丢 q；如果 q 也丢了，智能体就不知道重启后要查哪件事。',
    ],
    lines: ['q: 找歌名', '条件写在这里'],
  },
  {
    key: 'thinking',
    name: '模型思考',
    desc: '模型思考是智能体在调用工具前写下的中间判断。它能说明下一步为什么这样搜，但它本身不是网页证据。',
    body:
      '模型思考是轨迹里的 `<thinking>` 部分，也就是智能体对当前线索的临时解释和行动计划。它可能把多个线索串起来，也可能只是一个还没证实的猜测。读这部分时要很小心：它能解释智能体为什么这么做，但不能直接当成事实来源。',
    points: [
      '具体长相：`<thinking> 10 月 3 日、天秤座、Cambodian Crips 这些线索可能指向 $tupid Young。我需要先确认这个人物资料，再查他相关歌曲。`',
      '这段文字有用，因为它暴露了搜索方向。AgentSwing 的路由器可以看出某条分支是不是正在形成合理计划。',
      '这段文字也危险，因为模型可能把猜测写得像结论。Summary 如果把错误思考压缩进摘要，后面几轮会继续被这个错方向带偏。',
    ],
    lines: ['猜测: $tupid', '计划: 先验证'],
  },
  {
    key: 'call',
    name: '工具调用',
    desc: '工具调用是智能体发给外部工具的动作记录，例如搜索关键词、打开网页、解析 PDF。它记录“做了什么”，还不等于“查到了什么”。',
    body:
      '工具调用是轨迹里的 `<tool call>` 部分。网页智能体不能凭空知道网页内容，它需要把搜索词、URL 或解析命令发给浏览器、搜索引擎、网页读取器等工具。工具调用本身只是一条动作指令，它告诉我们智能体把注意力投向哪里。',
    points: [
      '具体长相：`Search(query="$tupid Young October 3 Libra Cambodian Crips song")`，或者 `Visit(url=".../stupid-young")`。',
      '如果工具调用越来越集中在正确关键词上，说明智能体可能接近答案；如果反复调用同一个失败 PDF 解析器，说明它可能卡在局部循环。',
      'Keep-Last-N 会把轨迹末尾的 N 轮工具调用一起留下。末尾动作是突破还是死循环，会直接影响这种策略是否合适。',
    ],
    lines: ['Search(...)', 'Visit(...)'],
  },
  {
    key: 'response',
    name: '工具返回',
    desc: '工具返回是外部工具写回来的网页片段、搜索结果或解析结果。真正能支持答案的证据，通常从这里进入轨迹。',
    body:
      '工具返回是轨迹里的 `<tool response>` 部分。搜索引擎返回标题和摘要，网页读取器返回页面正文，PDF 工具返回抽取文本或失败信息。它是外部世界进入模型上下文的入口，所以证据、无关片段和工具失败都会混在这里。',
    points: [
      '具体长相：`Result: $tupid Young, born October 3, 1992; zodiac sign Libra; joined the Cambodian Crips at age 14.`',
      '这类返回可以成为证据，因为它来自网页或工具，而不是模型自己猜的。后面如果继续查歌曲列表，就能把人物线索和歌名线索接起来。',
      '工具返回也会制造噪声。比如搜索结果里混入 Lil Durk 或 Hit-Boy 的无关页面，Summary 可能把这些旧误导保留下来。',
    ],
    lines: ['born Oct 3', 'joined Crips'],
  },
];

const clueCards = [
  {
    key: 'evidence',
    name: '证据',
    title: '已核实网页事实',
    desc: '证据是已经被网页或工具返回支持的事实。它能进入最终推理链，应该被保留或准确写进Summary。',
    body:
      '证据是轨迹里已经被外部页面或工具返回支持的信息。它和模型自己的猜测不同：模型可以提出“可能是 $tupid Young”，但只有网页返回了出生日期、星座、帮派经历这些事实后，这些内容才算证据。要尽量保留证据。',
    points: [
      '具体轨迹片段：`<tool_response> $tupid Young was born on October 3, 1992. His zodiac sign is Libra. He joined the Cambodian Crips at age 14. </tool_response>`',
      '这三条事实同时对上题目条件，能把搜索范围从许多说唱歌手缩到一个具体人物。',
      '智能体应该继续查“$tupid Young 相关歌曲”，而不是回到泛泛搜索“Libra rapper”或“Cambodian Crips song”。',
    ],
    color: GREEN,
  },
  {
    key: 'noise',
    name: '噪声',
    title: '错误方向和重复搜索',
    desc: '噪声是会消耗上下文、带偏后续搜索的内容，例如错误假设、重复访问同一页面、无关网页片段。',
    body:
      '噪声是轨迹里看起来有字、有结果、甚至有一点相关性，但会把智能体带离正确方向的内容。它可能来自模型早期错猜，也可能来自搜索引擎返回的无关人物、无关歌曲、重复页面。噪声最麻烦的地方是：它留在上下文里以后，模型下一轮会继续读到它。',
    points: [
      '具体轨迹片段：`<thinking> The song may involve Lil Durk or Hit-Boy because the search result mentions them. </thinking>`，但这条方向没有同时对上“October 3 / Libra / Cambodian Crips”。',
      '智能体可能把旧误导压缩成“之前已经查到 Lil Durk / Hit-Boy 相关”，让错误方向看起来像已有进展。',
      '模型会继续搜错误人物，消耗更多轮数；上下文越长，这种旧噪声越难被甩掉。',
    ],
    color: RED,
  },
  {
    key: 'pending',
    name: '待验证',
    title: '还没确认的方向',
    desc: '待验证线索看起来可能有用，但还不能当答案。它需要继续搜索几轮，看能否和题目条件对上。',
    body:
      '待验证线索是介于证据和噪声之间的内容。它还没有资格进入最终答案，但值得继续查。智能体在长程任务里经常会遇到这种状态：某个名字、网页标题或片段看起来很像目标，但还缺关键连接。',
    points: [
      '具体轨迹片段：`<thinking> $tupid Young matches the biographical clues, but I still need to find which song the task is asking for. </thinking>`',
      '和证据的区别：$tupid Young 的人物资料已经像证据，但“答案是 Mando”还没有被确认；必须继续查歌曲页面或歌词页面。',
      '好的策略应该保留这个方向，让下一轮围绕 `$tupid Young song Mando` 继续验证；如果线索会直接丢掉是不合适的。',
    ],
    color: ORANGE,
  },
  {
    key: 'failure',
    name: '工具失败',
    title: '访问失败或解析失败',
    desc: '工具失败会占用轨迹空间。如果最近几轮主要都是失败动作，智能体容易在局部循环里消耗预算。',
    body:
      '工具失败是工具没有返回有效内容的记录。它不是证据，也不是有价值的线索，但会真实占用上下文空间。更糟的是，如果最近几轮反复出现同一种失败，智能体会误以为“只要再试一次这个工具”就能推进，于是在局部循环里浪费轮数。',
    points: [
      '具体轨迹片段：`<tool_call>extract_text(pdf_url)</tool_call> <tool_response>Error: failed to parse PDF text.</tool_response>`，下一轮又对同一个 PDF 做同样解析。',
      '如果 Keep-Last-N 保留的 N 轮主要都是失败解析，交给模型的上下文就会被失败动作填满。',
      '模型可能继续重复同一个坏动作，而不是换搜索词、换页面或重新从原问题出发。',
    ],
    color: PURPLE,
  },
  {
    key: 'breakthrough',
    name: '突破',
    title: '新出现的重要线索',
    desc: '突破是刚出现、并且能明显改变搜索方向的线索。它通常应该被保留到下一轮验证里。',
    body:
      '突破是刚刚进入轨迹、并且能显著改变后续搜索方向的信息。它通常还需要继续验证，但已经足够说明“最近几轮不是废动作”',
    points: [
      '具体轨迹片段：`<tool_response> ... born October 3 ... Libra ... joined the Cambodian Crips at age 14 ... </tool_response>` 第一次把三个条件同时连到 $tupid Young。',
      '普通待验证线索只是“可能有用”；突破会让智能体的下一步搜索方向明显收窄。',
      '应该保留最近几轮，让智能体接着查歌曲名。',
    ],
    color: BLUE,
  },
];

const strategyCopy: Record<string, { name: string; runtime: string; risk: string; body: string; points: string[]; color: string }> = {
  summary: {
    name: 'Summary',
    runtime: '把累计轨迹压成一段文字，再和原始问题一起交给模型。',
    risk: '如果前面走偏，Summary可能把错方向写得很像“结论”。',
    body:
      'Summary 的输入是当前完整轨迹 τ。系统会调用模型或摘要器，把多轮用户问题、思考、工具调用、网页返回压成一段较短文字，然后把原始问题 q 和这段 summary 交给智能体继续运行。它的目标是节省上下文空间，同时尽量保留全局线索。',
    points: [
      '输入：`τ = [q, turn1, turn2, ..., turn23]`，里面有早期错误方向、最近网页证据、工具失败记录和模型思考。',
      '内部处理：摘要器读完整 τ，提取它认为重要的事实和当前进展，生成 `summary(τ)`。它不会保留每一次原始工具调用的完整细节。',
      '输出：`[q, summary(τ)]`。例如 Mando 任务里，理想摘要应该写清“$tupid Young born Oct 3 / Libra / Cambodian Crips at 14，下一步查歌曲名”。',
      '结合 Mando：如果 Summary 写得好，它能保留人物线索；如果摘要把 Lil Durk / Hit-Boy 旧误导也写进去，后续搜索会继续被旧方向污染。',
      '结合 live-crickets：如果摘要能看出“PDF 抽取一直失败”，它可能帮助模型换路线；如果摘要只写“正在检查 PDF”，模型还是可能继续围着同一个失败 PDF 转。',
    ],
    color: BLUE,
  },
  keep: {
    name: 'Keep-Last-N',
    runtime: '删掉旧历史，只留下 Keep-Last-N 选出的末尾 N 轮思考、调用和返回。',
    risk: '适合最近刚出现突破；但早期证据可能被一起删掉。',
    body:
      'Keep-Last-N 的输入也是当前完整轨迹 τ。它不理解内容、不做摘要，只按时间截断：从轨迹末尾拿 N 轮交互，把更早的历史删掉。这里的“一轮”通常包含模型思考、工具调用和工具返回。',
    points: [
      '输入：`τ = [q, turn1, ..., turn20, turn21, turn22, turn23]`。',
      '内部处理：直接取末尾 N 轮，得到 `last_N(τ)`。它不会判断哪条是证据、哪条是噪声，只相信“最近的内容最重要”。',
      '输出：`last_N(τ)`。如果 N=3，输出可能是 `turn21-23` 的思考、搜索、网页返回。',
      '结合 Mando：最近几轮刚出现 $tupid Young 的生日、星座、Cambodian Crips 证据，Keep-Last-N 会把这些关键线索保留下来，让下一轮继续查 `$tupid Young song Mando`。',
      '结合 live-crickets：最近几轮如果全是 `extract_text(pdf_url) -> failed`，Keep-Last-N 会把失败循环完整保留下来，模型下一步很可能继续重复同一个坏动作。',
    ],
    color: ORANGE,
  },
  discard: {
    name: 'Discard-All',
    runtime: '丢掉累计轨迹，只保留用户原始问题 q，让智能体重新开始。',
    risk: '适合摆脱死循环；代价是之前找到的线索也没了。',
    body:
      'Discard-All 的输入是当前完整轨迹 τ，但它只从里面取出原始用户问题 q，丢掉所有中间思考、工具调用、网页返回和失败记录。它相当于让智能体带着原题重新开始搜索。',
    points: [
      '输入：`τ = [q, turn1, turn2, ..., turnk]`。',
      '内部处理：删除 `turn1...turnk`，只保留 `q`。它不会保留任何已经查到的网页事实，也不会保留失败工具调用。',
      '输出：`[q]`。智能体下一轮只能根据原始问题重新规划搜索词。',
      '结合 live-crickets：最近轨迹主要是 PDF 抽取失败，Discard-All 会清掉这个失败循环，让模型换搜索入口，最后才有机会找到 “a mouthful of live crickets”。',
      '结合 Mando：如果第 23 轮刚找到 $tupid Young 关键线索，Discard-All 会把这些线索全部丢掉，智能体又要从人物条件重新搜一遍。',
    ],
    color: PURPLE,
  },
};

const caseCopy: Record<string, { title: string; situation: string; pick: string; why: string }> = {
  mando: {
    title: 'Mando 案例',
    situation:
      '任务要根据人物条件找到歌曲名。智能体在第 23 轮附近刚找到 $tupid Young，并且网页返回的生日、星座、帮派经历正在和题目条件对上。最近几轮已经出现答案路径。',
    pick: 'Keep-Last-N',
    why:
      '更合适的是 Keep-Last-N：保留最近几轮可以让智能体接着查 `$tupid Young song Mando`。如果 Discard-All，人物线索会丢；如果 Summary 写得不好，可能把 Lil Durk / Hit-Boy 旧误导也带进去。',
  },
  crickets: {
    title: 'live-crickets 案例',
    situation:
      '任务要找某段材料里“吃了什么活物”。智能体最近几轮没有得到新证据，反复尝试从同一个 PDF 抽取文本，工具返回失败。最近轨迹主要记录坏动作，缺少有效线索。',
    pick: 'Discard-All',
    why:
      '更合适的是 Discard-All：回到原始问题后，智能体能换搜索入口，跳出失败 PDF 循环。论文案例里，重新搜索后才找到“吃了一口活蟋蟀”的证据。',
  },
};

const strategyJudge: Record<
  string,
  Record<string, { verdict: string; score: number; label: string; color: string; feedback: string; detail: string }>
> = {
  mando: {
    summary: {
      verdict: '可用但有风险',
      score: 62,
      label: '摘要可能保留证据，也可能混入旧误导',
      color: ORANGE,
      feedback: 'Summary 有机会保住 $tupid Young 线索，但如果摘要把 Lil Durk / Hit-Boy 旧误导写进主线，后续搜索会继续跑偏。',
      detail: '适合轨迹很长且主线清楚的情况；在 Mando 里关键线索刚出现在末尾，Keep-Last-N 更稳。'
    },
    keep: {
      verdict: '最佳选择',
      score: 92,
      label: '保住刚出现的人物证据，继续查歌名',
      color: GREEN,
      feedback: 'Keep-Last-N 更合适：最近几轮刚验证 $tupid Young 的生日、星座和帮派经历，保住它就能继续查 song title。',
      detail: '这正是论文想表达的第一类状态：末尾内容属于刚出现的突破，应当进入下一轮搜索。'
    },
    discard: {
      verdict: '明显倒退',
      score: 28,
      label: '清空后丢掉刚找到的 $tupid Young 线索',
      color: RED,
      feedback: 'Discard-All 在这里会把第 23 轮附近的新证据清掉，智能体只能重新从原问题开始搜。',
      detail: '清空历史可以摆脱循环；Mando 当前已经接近答案路径，清空会造成进度倒退。'
    }
  },
  crickets: {
    summary: {
      verdict: '容易延续坏路线',
      score: 38,
      label: '摘要可能继续写“答案在 PDF 里”',
      color: RED,
      feedback: 'Summary 如果只压缩成“正在检查 PDF”，模型下一步仍可能继续围绕同一个失败 PDF 打转。',
      detail: '当最近几轮主要是工具失败时，摘要未必能把失败循环真正切断。'
    },
    keep: {
      verdict: '最危险',
      score: 22,
      label: '保留下来的正是重复失败动作',
      color: RED,
      feedback: 'Keep-Last-N 在这里会留下 extract_text(pdf_url) -> failed 的尾部循环，等于把坏动作交给下一轮模型。',
      detail: '同样是“保留最近内容”，在 Mando 是保线索，在 live-crickets 就是保失败。'
    },
    discard: {
      verdict: '最佳选择',
      score: 88,
      label: '清掉失败循环，重新从原问题搜索',
      color: GREEN,
      feedback: 'Discard-All 更合适：回到 q 后可以换搜索入口，才有机会找到 “a mouthful of live crickets” 这类外部证据。',
      detail: '这对应论文想表达的第二类状态：最近几轮没有新证据，只是在重复坏动作。'
    }
  }
};

const branchPreview: Record<string, { name: string; quality: number; color: string; steps: string[]; router: string }> = {
  summary: {
    name: 'Summary',
    quality: 58,
    color: ORANGE,
    steps: ['摘要保留人物线索', '也夹带旧误导', '搜索方向不稳定'],
    router: 'Router 会保留它作为候选，同时继续检查它有没有推进原任务。'
  },
  keep: {
    name: 'Keep-Last-N',
    quality: 91,
    color: GREEN,
    steps: ['保住 $tupid Young 证据', '搜索 song Mando', '得到歌名证据'],
    router: 'Router 选择 keep：它把刚出现的人物证据推进到题目要求的歌名。'
  },
  discard: {
    name: 'Discard-All',
    quality: 34,
    color: RED,
    steps: ['只剩原始问题 q', '重新泛搜人物条件', '进度回到前面'],
    router: 'Router 降低 discard 优先级：在 Mando 状态下，它丢掉了刚出现的关键线索。'
  }
};

const ablationTradeoff: Record<string, { quality: number; cost: number; reliability: number; note: string }> = {
  random: { quality: 42, cost: 58, reliability: 24, note: '随机选说明：只有并行分支还不够，必须有路由判断。' },
  nolook: { quality: 55, cost: 28, reliability: 38, note: '不前瞻成本低，但看不到每条分支真实继续跑后的差异。' },
  k1: { quality: 66, cost: 42, reliability: 55, note: 'K=1 能看到一点短程未来，但分支差异还不够充分。' },
  k3: { quality: 86, cost: 64, reliability: 84, note: 'K=3 是论文主实验设置：差异足够明显，额外试跑成本仍可控。' },
  k5: { quality: 82, cost: 86, reliability: 80, note: 'K=5 看到更长未来，但额外调用更多，收益不一定继续上升。' }
};

const pipeline = [
  {
    name: '触发',
    feedback: '触发：只有当当前轨迹 τ 的长度超过阈值 r × Lmax 时，AgentSwing 才接管上下文。',
    body:
      '触发步骤回答“什么时候需要上下文管理”。网页智能体每搜索一轮，τ 都会变长；当 τ 超过论文设定的比例阈值 r × Lmax，系统认为继续把完整旧轨迹塞进模型窗口已经不合适，于是暂停主流程，调用 AgentSwing。',
    points: [
      '输入状态：`|τ| > r × Lmax`。这里 `|τ|` 是当前轨迹长度，`Lmax` 是模型上下文窗口，`r` 是触发比例。',
      'Mando 例子：第 23 轮附近，τ 里已经堆了早期搜索、错误人物、网页返回和刚出现的 $tupid Young 线索。系统在这里触发，后面继续查歌名还需要更干净的工作记忆。',
      '触发后它把当前 τ 交给下一步，并行生成不同 managed context。',
    ],
  },
  {
    name: '并行整理',
    feedback: '并行整理：同一份 τ 同时变成 Summary、Keep-Last-N、Discard-All 三份 managed context。',
    body:
      '并行整理步骤回答“候选上下文从哪里来”。AgentSwing 不先猜哪种策略最好，而是把同一份原始 τ 同时交给三种上下文管理规则，生成三份 managed context。三份上下文都可以继续运行，但保留的信息完全不同。',
    points: [
      '<span class="trace-block"><span class="te-root">三份 managed context</span><br/><span class="te-thinking">Summary: [q, summary(τ)]，把长轨迹压成一段任务进展摘要。</span><br/><span class="te-call">Keep-Last-N: last_N(τ)，只保留轨迹末尾 N 轮思考、调用和返回。</span><br/><span class="te-q">Discard-All: [q]，丢掉所有中间历史，只留下原始问题。</span></span>',
      'Mando 里，Keep-Last-N 会留下 $tupid Young 的最新证据；Discard-All 会把这些证据删掉。live-crickets 里，Keep-Last-N 可能留下的主要是 PDF 抽取失败；Discard-All 反而能让模型摆脱失败循环。',
      '这一步的输出是三份 managed context。',
    ],
  },
  {
    name: '试跑 K 轮',
    feedback: '试跑 K 轮：同一个智能体分别读取三份 managed context，每份真实继续运行 K 轮。',
    body:
      '试跑步骤回答“为什么路由器有依据可选”。三份 managed context 本身只能说明保留了什么、丢掉了什么；AgentSwing 还要让同一个智能体分别在三份上下文上继续运行 K 轮。每条分支新增出来的日志就是 continuation。',
    points: [
      '<span class="trace-block"><span class="te-root">Keep-Last-N 分支 continuation 示例</span><br/><span class="te-thinking">turn24 &lt;thinking&gt; Recent evidence identifies $tupid Young. Search for his song title. &lt;/thinking&gt;</span><br/><span class="te-call">turn24 &lt;tool_call&gt; Search("$tupid Young song Mando") &lt;/tool_call&gt;</span><br/><span class="te-response">turn24 &lt;tool_response&gt; Results include "Mando" by $tupid Young. &lt;/tool_response&gt;</span></span>',
      'live-crickets 里，如果某个分支继续输出 `extract_text(pdf_url) -> failed`，这段 continuation 就暴露出它仍在重复失败动作。',
      'K 的作用是给每条分支一点短程未来。论文主实验使用 K=3，让路由器看到足够的行为差异。',
    ],
  },
  {
    name: '路由选择',
    feedback: '路由选择：路由器比较三段 continuation，选择最可能继续完成任务的一条。',
    body:
      '路由选择步骤回答“凭什么选这一条”。路由器看的是原始 τ 加三段 continuation。它要判断哪条分支的新增日志更像在接近证据，哪条分支还在旧错误或工具失败里打转。',
    points: [
      'Mando 里，Keep-Last-N 分支如果新增了 `Search("$tupid Young song Mando")` 和 `"Mando" by $tupid Young`，路由器会看到这条分支正在把人物证据推进到歌名证据。',
      'live-crickets 里，Discard-All 分支如果重新搜索并找到 `a mouthful of live crickets`，路由器会看到它比继续 PDF 抽取失败的分支更有希望。',
      '输出是一个分支选择：选中哪段 continuation，后面主流程就沿着哪段运行日志继续。',
    ],
  },
  {
    name: '接回主线',
    feedback: '接回主线：丢弃未选中分支，把选中分支形成的 τ_new 作为下一轮主流程轨迹。',
    body:
      '接回主线步骤回答“选完以后系统具体改了什么”。AgentSwing 会丢弃未选中的两条试跑分支，把选中分支的 managed context 和它的 continuation 组成 τ_new。下一轮智能体读到的当前轨迹就是 τ_new。',
    points: [
      '<span class="trace-block"><span class="te-root">Mando 中选中 Keep-Last-N 后</span><br/><span class="te-root">τ_new = [</span><br/><span class="te-response">  turn23 evidence: $tupid Young born Oct 3; Libra; joined Cambodian Crips at 14.</span><br/><span class="te-call">  turn24 call: Search("$tupid Young song Mando")</span><br/><span class="te-response">  turn24 result: Results include "Mando" by $tupid Young.</span><br/><span class="te-root">]</span></span>',
      '接回后，主流程只保留被选中的 τ_new。',
      '后续模型会基于 τ_new 继续验证、补证据、输出答案。AgentSwing 到这里完成一次上下文管理，任务主流程继续向前。',
    ],
  },
];

const architecture = [
  {
    key: 'raw',
    name: '原始轨迹 τ',
    feedback: '原始轨迹 τ：路由器用它判断三条 continuation 是否真的推进了原任务。',
    body:
      '原始轨迹 τ 是触发前的完整运行记录。它是给路由器当参照物：路由器要知道原问题是什么、之前已经验证了什么、哪些方向曾经失败，才能判断三条 continuation 的状态：推进任务、停在原地、重复旧错误。',
    points: [
      '<span class="trace-block"><span class="te-root">Mando 的原始 τ 给路由器的参照信息</span><br/><span class="te-q">q: Find the song from clues: born Oct 3, Libra, joined Cambodian Crips at 14.</span><br/><span class="te-response">verified evidence: $tupid Young was born on October 3; zodiac sign Libra; joined Cambodian Crips at 14.</span><br/><span class="te-thinking">old uncertainty: song title still not verified.</span></span>',
      '路由器用 τ 判断 continuation 是否解决了“找歌名”这个原任务。只继续讨论人物简介的分支价值较低，因为 q 要的是 song title。',
      'τ 还帮助路由器识别旧噪声。比如某个分支继续追 Lil Durk / Hit-Boy，但原始 τ 里这些方向没有完成条件匹配，路由器就应降低它的可信度。',
    ],
  },
  {
    key: 'summary',
    name: 'Summary分支',
    feedback: 'Summary分支：路由器检查摘要是否保留关键证据，同时有没有把旧误导写进主线。',
    body:
      'Summary分支先把 τ 压缩成 [q, summary(τ)]，再让智能体试跑 K 轮。路由器读取 Summary 版 continuation，判断摘要有没有保住关键证据、有没有压缩掉必要细节、有没有把错误方向包装成进展。',
    points: [
      '<span class="trace-block"><span class="te-root">Summary continuation 可能出现的好信号</span><br/><span class="te-thinking">turn24 &lt;thinking&gt; Summary says $tupid Young matches all bio clues. Search song title linked to him. &lt;/thinking&gt;</span><br/><span class="te-call">turn24 &lt;tool_call&gt; Search("$tupid Young song Mando") &lt;/tool_call&gt;</span><br/><span class="te-response">turn24 &lt;tool_response&gt; Results include "Mando" by $tupid Young. &lt;/tool_response&gt;</span></span>',
      '好信号：continuation 明确使用摘要里的已验证证据，并把搜索目标推进到“歌曲名”。',
      '坏信号：continuation 继续围绕摘要里的旧误导搜索，例如把 Lil Durk / Hit-Boy 当成主线，或者只重复人物简介，没有推进到 song title。',
    ],
  },
  {
    key: 'keep',
    name: 'Keep-Last-N分支',
    feedback: 'Keep-Last-N分支：路由器检查末尾 N 轮属于新证据、待验证线索、失败循环中的哪一种。',
    body:
      'Keep-Last-N分支保留轨迹末尾 N 轮，再让智能体试跑 K 轮。它的优势是能保住刚出现的新线索；风险是如果末尾 N 轮全是坏动作，它会把坏动作继续交给模型。路由器要看 continuation 证明了哪一种情况。',
    points: [
      '<span class="trace-block"><span class="te-root">Mando 中 Keep-Last-N 的好信号</span><br/><span class="te-response">context tail: $tupid Young born Oct 3; Libra; joined Cambodian Crips at 14.</span><br/><span class="te-call">continuation: Search("$tupid Young song Mando")</span><br/><span class="te-response">continuation result: Results include "Mando" by $tupid Young.</span></span>',
      '判断依据：末尾 N 轮是否包含新证据；试跑后是否把证据推进到题目要求的答案类型。',
      'live-crickets 的坏信号：Keep-Last-N 的末尾 N 轮是 `extract_text(pdf_url) -> failed`，试跑后仍重复同一 PDF 解析，这条分支质量低。',
    ],
  },
  {
    key: 'discard',
    name: 'Discard-All分支',
    feedback: 'Discard-All分支：路由器检查重新开始后的两件事：摆脱旧循环，保留任务所需线索。',
    body:
      'Discard-All分支把中间历史清空，只保留 q，再让智能体试跑 K 轮。它适合摆脱失败循环，也会丢掉已经找到的证据。路由器判断它时，重点看“重新开始”是否产生了更有效的新搜索；上下文更短只算容量优势，工具返回里的新证据才算任务进展。',
    points: [
      '<span class="trace-block"><span class="te-root">live-crickets 中 Discard-All 的好信号</span><br/><span class="te-q">context: q only, no repeated PDF extraction failures.</span><br/><span class="te-thinking">turn24 &lt;thinking&gt; Previous PDF extraction failed. Search web for the clue phrase instead. &lt;/thinking&gt;</span><br/><span class="te-call">turn24 &lt;tool_call&gt; Search("source material ate live crickets") &lt;/tool_call&gt;</span><br/><span class="te-response">turn24 &lt;tool_response&gt; A result says "a mouthful of live crickets". &lt;/tool_response&gt;</span></span>',
      '好信号：continuation 换了搜索入口，出现了可验证答案证据。',
      '坏信号：在 Mando 里 Discard-All 会丢掉第 23 轮刚确认的 $tupid Young 线索；如果试跑只是重新搜索人物条件，进度反而倒退。',
    ],
  },
  {
    key: 'router',
    name: '路由器',
    feedback: '路由器：由 agent model 读取 τ、三段 continuation 和选择指令，输出 summary、keep 或 discard。',
    body:
      '路由器由 agent model 在测试时完成选择。它的输入包括四部分：原始轨迹 τ、Summary 分支试跑得到的 c_summary、Keep-Last-N 分支试跑得到的 c_keep、Discard-All 分支试跑得到的 c_discard。它再接收一条选择指令，要求从三条 continuation 中选出最有希望继续完成任务的一条。它的输出是分支标签，例如 `selected = keep`。',
    points: [
      '<span class="trace-block"><span class="te-root">Router 输入对象</span><br/><span class="te-q">original_trace τ: original question, verified evidence, previous wrong attempts, current unfinished goal.</span><br/><span class="te-thinking">c_summary: continuation after running from [q, summary(τ)].</span><br/><span class="te-call">c_keep: continuation after running from Keep-Last-N managed context.</span><br/><span class="te-response">c_discard: continuation after running from [q].</span></span>',
      '<span class="trace-block"><span class="te-root">Router prompt 模板</span><br/><span class="te-q">You are routing a long-horizon web agent after context management.</span><br/><span class="te-thinking">Given the original trajectory and three candidate continuations, choose the branch that is most likely to continue solving the original user task.</span><br/><span class="te-call">Compare whether each continuation: (1) advances the original question, (2) uses verified tool evidence, (3) avoids repeated failed actions, (4) preserves important clues.</span><br/><span class="te-response">Return exactly one label: summary, keep, or discard. Then give a short reason.</span></span>',
      '<span class="trace-block"><span class="te-root">Router 输出示例：Mando</span><br/><span class="te-thinking">c_summary: continues with old Lil Durk / Hit-Boy direction.</span><br/><span class="te-call">c_keep: searches "$tupid Young song Mando" after keeping the fresh $tupid Young evidence.</span><br/><span class="te-q">c_discard: restarts from q and repeats broad searches.</span><br/><span class="te-response">selected = keep; reason: c_keep uses verified $tupid Young evidence and advances from person identification to song title.</span></span>',
      '<span class="trace-block"><span class="te-root">Router 输出示例：live-crickets</span><br/><span class="te-thinking">c_summary: still says the answer is inside the PDF.</span><br/><span class="te-call">c_keep: repeats extract_text(pdf_url) and receives another failure.</span><br/><span class="te-q">c_discard: searches the web from q and finds "a mouthful of live crickets".</span><br/><span class="te-response">selected = discard; reason: c_discard escapes the failed PDF loop and gets tool evidence for the answer.</span></span>',
      '判断标准 1：是否朝原问题要求的答案类型推进。Mando 要 song title，所以出现 `"Mando" by $tupid Young` 比继续讲人物生日更有价值。',
      '判断标准 2：是否有外部工具返回支持。`<tool_response>Results include "Mando"</tool_response>` 比 `<thinking>I guess it is Mando</thinking>` 更强。',
      '判断标准 3：是否摆脱失败循环。live-crickets 里继续 `extract_text(pdf_url) -> failed` 是负信号，换搜索入口并找到 `a mouthful of live crickets` 是正信号。',
      '判断标准 4：是否丢掉关键证据。Mando 里 Discard-All 如果导致重新查人物条件、没有利用 $tupid Young 证据，就是倒退。',
    ],
  },
];

const methodIO = [
  {
    key: 'input',
    name: '输入',
    title: '输入：当前原始轨迹 τ',
    desc: '输入是智能体已经跑到一半时手里所有可见材料：当前轨迹 τ、原始问题 q、前瞻步数 K。',
    body:
      '输入τ 、q 、K-候选分支要向前试跑的轮数。下面用 Mando 任务写出一个具体输入形态。',
    points: [
      '<span class="trace-block"><span class="te-root">输入 q</span><br/><span class="te-q">Find the song. The clue describes a person born on October 3, a Libra, who joined the Cambodian Crips at age 14.</span><br/><br/><span class="te-response">这句话规定最终要回答“歌名”。</span></span>',
      '<span class="trace-block"><span class="te-root">输入 τ 的具体片段</span><br/><span class="te-root">τ = [</span><br/><span class="te-q">  q: Find the song. The clue describes a person born on October 3, a Libra, who joined the Cambodian Crips at age 14.</span><br/><span class="te-turn">  ... earlier turns ...</span><br/><span class="te-thinking">  turn21 &lt;thinking&gt; The October 3 / Libra / Cambodian Crips clues may identify a rapper. &lt;/thinking&gt;</span><br/><span class="te-call">  turn22 &lt;tool_call&gt; Search("October 3 Libra Cambodian Crips rapper") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn22 &lt;tool_response&gt; Results mention $tupid Young. &lt;/tool_response&gt;</span><br/><span class="te-call">  turn23 &lt;tool_call&gt; Search("$tupid Young born October 3 Libra Cambodian Crips") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn23 &lt;tool_response&gt; $tupid Young was born on October 3, 1992. His zodiac sign is Libra. He joined the Cambodian Crips at age 14. &lt;/tool_response&gt;</span><br/><span class="te-root">]</span></span>',
      '输入 K：`K = 3` 表示三条候选分支每条都继续产生 3 轮新日志。路由器之后比较的是这些真实新增日志。',
    ],
  },
  {
    key: 'process',
    name: '内部处理',
    title: '内部处理：managed context + continuation',
    desc: '内部处理分两步：先从同一条 τ 生成三份 managed context，再让同一个智能体分别拿着三份上下文试跑 K 轮。',
    body:
      '内部处理先把同一条 τ 改写成三份可以继续喂给智能体的 managed context，然后让同一个智能体分别在这三份上下文上继续跑。每条分支跑出来的新日志就是 continuation。',
    points: [
      '<span class="trace-block"><span class="te-root">Summary managed context</span><br/><span class="te-root">[</span><br/><span class="te-q">  q: Find the song. The clue describes a person born on October 3, a Libra, who joined the Cambodian Crips at age 14.</span><br/><span class="te-thinking">  summary: The task asks for a song title. Recent verified clues identify the person as $tupid Young: born October 3, zodiac sign Libra, joined Cambodian Crips at age 14.</span><br/><span class="te-response">  summary: Earlier searches also mentioned Lil Durk and Hit-Boy, but those links are not verified as the target. Next step: search for songs connected to $tupid Young and these biographical clues.</span><br/><span class="te-root">]</span></span>',
      '<span class="trace-block"><span class="te-root">Keep-Last-N managed context</span><br/><span class="te-root">[</span><br/><span class="te-thinking">  turn21 &lt;thinking&gt; The clues may identify a rapper. &lt;/thinking&gt;</span><br/><span class="te-response">  turn22 &lt;tool_response&gt; Results mention $tupid Young. &lt;/tool_response&gt;</span><br/><span class="te-call">  turn23 &lt;tool_call&gt; Search("$tupid Young born October 3 Libra Cambodian Crips") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn23 &lt;tool_response&gt; $tupid Young was born on October 3, 1992; Libra; joined Cambodian Crips at 14. &lt;/tool_response&gt;</span><br/><span class="te-root">]</span></span>',
      '<span class="trace-block"><span class="te-root">Discard-All managed context</span><br/><span class="te-root">[</span><br/><span class="te-q">  q: Find the song. The clue describes a person born on October 3, a Libra, who joined the Cambodian Crips at age 14.</span><br/><span class="te-root">]</span><br/><span class="te-response"></span></span>',
      '<span class="trace-block"><span class="te-root">Keep-Last-N 分支试跑出的 continuation：c_keep</span><br/><span class="te-root">c_keep = [</span><br/><span class="te-thinking">  turn24 &lt;thinking&gt; The recent evidence identifies $tupid Young. I should search for $tupid Young songs and verify which song matches the clue. &lt;/thinking&gt;</span><br/><span class="te-call">  turn24 &lt;tool_call&gt; Search("$tupid Young song Mando") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn24 &lt;tool_response&gt; Search results include a song page/video titled "Mando" by $tupid Young. &lt;/tool_response&gt;</span><br/><span class="te-call">  turn25 &lt;tool_call&gt; Search("$tupid Young Mando lyrics or release") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn25 &lt;tool_response&gt; Additional results connect $tupid Young with the song "Mando". &lt;/tool_response&gt;</span><br/><span class="te-root">]</span></span>',
      '这一步比较三条分支真实跑出来的新日志：哪条继续靠近答案，哪条丢了刚找到的线索，哪条把旧噪声继续带进下一轮。',
    ],
  },
  {
    key: 'output',
    name: '输出',
    title: '输出：新的主轨迹 τ_new',
    desc: '输出是下一轮主流程要继续使用的轨迹 τ_new。路由器选中哪条分支，主流程就改用那条分支的运行记录继续。',
    body:
      '“接回主流程”具体指替换下一轮模型看到的工作记忆。原来的主流程暂停在触发点，AgentSwing 试跑三条分支。路由器选中 Keep-Last-N 分支后，Summary 分支和 Discard-All 分支的试跑日志被丢弃；系统保留 Keep-Last-N 的 managed context，并把 Keep-Last-N 试跑 K 轮产生的 continuation 放到它后面，形成 τ_new。下一轮模型决策时读的是 τ_new。',
    points: [
      '<span class="trace-block"><span class="te-root">Mando：如果路由器选中 Keep-Last-N，输出 τ_new</span><br/><span class="te-root">τ_new = [</span><br/><span class="te-thinking">  turn21 &lt;thinking&gt; The clues may identify a rapper. &lt;/thinking&gt;</span><br/><span class="te-response">  turn22 &lt;tool_response&gt; Results mention $tupid Young. &lt;/tool_response&gt;</span><br/><span class="te-response">  turn23 &lt;tool_response&gt; $tupid Young was born on October 3, is a Libra, and joined Cambodian Crips at 14. &lt;/tool_response&gt;</span><br/><span class="te-thinking">  turn24 &lt;thinking&gt; The person is $tupid Young. Search for the song title connected to him. &lt;/thinking&gt;</span><br/><span class="te-call">  turn24 &lt;tool_call&gt; Search("$tupid Young song Mando") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn24 &lt;tool_response&gt; Results include "Mando" by $tupid Young. &lt;/tool_response&gt;</span><br/><span class="te-call">  turn25 &lt;tool_call&gt; Search("$tupid Young Mando") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn25 &lt;tool_response&gt; More pages confirm the song title "Mando". &lt;/tool_response&gt;</span><br/><span class="te-root">]</span></span>',
      '这条 τ_new 进入主流程后，下一轮智能体看到的是上面这串日志。它会基于 `Results include "Mando" by $tupid Young` 继续验证并准备最终答案。',
      '<span class="trace-block"><span class="te-root">live-crickets：如果路由器选中 Discard-All，输出 τ_new</span><br/><span class="te-root">τ_new = [</span><br/><span class="te-q">  q: Find what live thing was eaten in the source material.</span><br/><span class="te-thinking">  turn24 &lt;thinking&gt; The PDF extraction loop failed before. I should search the web for the phrase and source title instead. &lt;/thinking&gt;</span><br/><span class="te-call">  turn24 &lt;tool_call&gt; Search("source material ate live crickets") &lt;/tool_call&gt;</span><br/><span class="te-response">  turn24 &lt;tool_response&gt; A result says the person ate "a mouthful of live crickets". &lt;/tool_response&gt;</span><br/><span class="te-root">]</span><br/><span class="te-response">原来连续失败的 extract_text(pdf_url) 日志不会进入 τ_new。</span></span>',
      '所以“接回”是把主流程下一步要读的轨迹对象改成 τ_new：保留被选中分支的可用上下文，追加这条分支已经试跑出的新证据，丢掉未选中分支和旧轨迹里的无效部分。',
    ],
  },
];

const ablation = [
  {
    key: 'random',
    name: '随机选',
    gpt: 51.0,
    tongyi: 56.5,
    desc: '随机选表示三条分支都生成并试跑，然后随机拿一条接回主流程。GPT-OSS 51.0 表示 GPT-OSS-120B 在 BrowseComp 上一次运行答对率为 51.0%。Tongyi-DR 56.5 表示 Tongyi-DR-30B-A3B 在同一基准上一次运行答对率为 56.5%。这个设置反映“只有并行分支，缺少有效选择”时的效果。',
  },
  {
    key: 'nolook',
    name: '无前瞻',
    gpt: 50.0,
    tongyi: 57.0,
    desc: '无前瞻表示路由器只看三份 managed context 的静态内容，直接选择分支。GPT-OSS 50.0 和 Tongyi-DR 57.0 都是 BrowseComp Pass@1 百分比，反映“看上下文本身”这件事能带来的答对率。',
  },
  {
    key: 'k1',
    name: 'K = 1',
    gpt: 52.5,
    tongyi: 58.0,
    desc: 'K = 1 表示每条 managed context 只向前试跑 1 轮，再让路由器选择。GPT-OSS 52.5、Tongyi-DR 58.0 是 BrowseComp Pass@1 百分比，反映短前瞻已经提供了一点分支质量信号。',
  },
  {
    key: 'k3',
    name: 'K = 3',
    gpt: 60.0,
    tongyi: 60.5,
    desc: 'K = 3 是论文主设置。每条 managed context 向前试跑 3 轮，路由器看到更完整的短程 continuation。GPT-OSS 60.0、Tongyi-DR 60.5 是 BrowseComp Pass@1 百分比，反映 K=3 在两种模型上带来的最高或接近最高答对率。',
  },
  {
    key: 'k5',
    name: 'K = 5',
    gpt: 55.0,
    tongyi: 59.0,
    desc: 'K = 5 表示每条分支向前试跑 5 轮。GPT-OSS 55.0、Tongyi-DR 59.0 是 BrowseComp Pass@1 百分比。这个设置反映更长前瞻带来更多信息，同时也消耗更多交互和上下文预算。',
  },
];

const results: Record<string, { name: string; rows: [string, number, number, string][] }> = {
  gpt: {
    name: 'GPT-OSS-120B',
    rows: [
      ['BrowseComp', 52.5, 60.0, '静态最好：Keep-Last-N'],
      ['BrowseComp-ZH', 33.6, 38.0, '静态最好：Keep-Last-N'],
      ['HLE', 34.4, 35.1, '静态最好：Summary'],
    ],
  },
  deepseek: {
    name: 'DeepSeek-v3.2',
    rows: [
      ['BrowseComp', 58.0, 62.5, '静态最好：Discard-All'],
      ['BrowseComp-ZH', 70.2, 71.3, '静态最好：Discard-All'],
      ['HLE', 43.5, 44.4, '静态最好：Summary'],
    ],
  },
  tongyi: {
    name: 'Tongyi-DR-30B-A3B',
    rows: [
      ['BrowseComp', 58.0, 60.5, '静态最好：Discard-All'],
      ['BrowseComp-ZH', 53.9, 56.7, '静态最好：Discard-All'],
      ['HLE', 32.7, 33.1, '静态最好：Discard-All'],
    ],
  },
};

const aligned: Record<string, { name: string; rows: [string, number, number, number, number][] }> = {
  gpt: {
    name: 'GPT-OSS-120B，对齐样本 N = 122',
    rows: [
      ['Discard-All', 41.8, 68.6, 28.7, 297.2],
      ['Summary', 55.7, 51.5, 28.7, 248.0],
      ['Keep-Last-N', 74.6, 47.3, 35.2, 205.4],
      ['AgentSwing', 73.8, 56.7, 41.8, 190.3],
    ],
  },
  deepseek: {
    name: 'DeepSeek-v3.2，对齐样本 N = 73',
    rows: [
      ['Discard-All', 54.8, 60.0, 32.9, 268.3],
      ['Summary', 98.6, 30.6, 30.1, 132.2],
      ['Keep-Last-N', 72.6, 43.4, 31.5, 183.5],
      ['AgentSwing', 93.2, 38.2, 35.6, 151.9],
    ],
  },
  tongyi: {
    name: 'Tongyi-DR-30B-A3B，对齐样本 N = 45',
    rows: [
      ['Discard-All', 24.4, 81.8, 20.0, 340.8],
      ['Summary', 77.8, 25.7, 20.0, 215.7],
      ['Keep-Last-N', 93.3, 21.4, 20.0, 153.0],
      ['AgentSwing', 75.6, 41.2, 31.1, 203.6],
    ],
  },
};

type Detail = { title: string; body: string; points: string[] };

function getPressureDetail(length: number): Detail {
  const pct = Math.round(length * 100);
  if (length < 0.35) {
    return {
      title: `当前轨迹占用约 ${pct}%：任务刚开始，证据不够`,
      body:
        '低占用时，智能体还没有跑很多轮。上下文窗口里通常只有用户问题 q、少量搜索计划和第一批搜索结果。这个阶段的质量问题是还没查够，证据不足：模型容易凭少量线索过早下判断，所以需要继续搜索和验证。',
      points: [
        '具体例子：刚看到“出生于 10 月 3 日、天秤座、Cambodian Crips”时，智能体只搜到一两个页面。它还不能直接回答 Mando，因为还没把人物线索和歌名线索连起来。',
        '这时剩余空间很多，继续保留原始轨迹通常问题不大。可能把“还没验证的猜测”写成简短结论。',
        '智能体回答质量表现：搜索方向还在形成，答案不稳定，主要风险是证据链过短。',
      ],
    };
  }
  if (length < 0.78) {
    return {
      title: `当前轨迹占用约 ${pct}%：证据和噪声开始混在一起`,
      body:
        '中等占用时，智能体已经经历多轮搜索。上下文里既有有用网页事实，也有旧猜测、无关搜索结果和重复工具调用。模型每一步都要在这些内容里重新判断下一步怎么搜，回答质量开始明显依赖上下文是否干净。',
      points: [
        '具体例子：轨迹里同时出现 $tupid Young 的生日证据，也残留 Lil Durk / Hit-Boy 这类旧误导。模型如果读到旧误导，下一轮搜索词就可能偏向错误人物。',
        '这时直接全保留会增加阅读负担，直接清空又可能丢掉刚找到的证据。',
        '智能体回答质量表现：还能继续推进，但会开始出现绕路、重复搜索、把旧假设当成新线索的问题。',
      ],
    };
  }
  return {
    title: `当前轨迹占用约 ${pct}%：上下文已经接近失控，回答质量会明显变差`,
    body:
      '高占用时，模型窗口大部分被旧轨迹占住。智能体继续搜索前要读大量旧内容，剩余空间很少，新的网页返回可能很快又把窗口挤满。更严重的是，早期错误猜测、失败工具返回和重复动作会一直留在模型眼前，模型会更难从旧方向里跳出来。',
    points: [
      '具体例子：在 live-crickets 案例里，最近几轮如果几乎都是同一个 PDF 抽取失败，失败循环完整带到下一轮。智能体看见的主要内容不是证据，而是“我刚刚又解析失败了”。',
      '如果高占用轨迹里混着旧误导和新证据，智能体可能把 Lil Durk / Hit-Boy 的旧方向也压进摘要；模型后面会继续查错方向，最终即使输出答案也可能答错。',
      '智能体回答质量表现：搜索会变慢，动作会重复，纠错能力下降；它可能没走到终点，也可能到终点后基于污染上下文给出错误答案。',
      '这就是论文设置触发线 |τ| > r · L_max 的原因：上下文太满时，系统需要管理轨迹，而不是继续把整段日志塞给模型。',
    ],
  };
}

function getDetail(moduleId: string, state: State): Detail {
  if (moduleId === '1.1') {
    const seg = segments[Number(state.segment)];
    return {
      title: `${seg.name}`,
      body: seg.body,
      points: seg.points,
    };
  }
  if (moduleId === '1.2') {
    const length = Number(state.length);
    return getPressureDetail(length);
  }
  if (moduleId === '2.1') {
    const card = clueCards[Number(state.clue)];
    return {
      title: `${card.name}：${card.title}`,
      body: card.body,
      points: card.points,
    };
  }
  if (moduleId === '4.2') {
    const item = caseCopy[String(state.case)];
    const picked = String(state.judge);
    const judged = strategyJudge[String(state.case)]?.[picked];
    if (judged) {
      return {
        title: `${item.title}：${judged.verdict}`,
        body: judged.detail,
        points: [item.situation, judged.feedback, `论文判断：${item.pick}。${item.why}`],
      };
    }
  }
  if (moduleId === '4.2') {
    const item = caseCopy[String(state.case)];
    return {
      title: `${item.title}：为什么选${item.pick}`,
      body:
        '这两个案例说明固定策略为什么不够。Mando 的最近轨迹里刚出现可验证线索，Keep-Last-N有机会继续推进；live-crickets 的最近轨迹主要是失败工具调用，继续保留最近内容只会让智能体在同一个错误动作上打转。',
      points: [item.situation, item.why, '结论：上下文管理应该在运行中根据当前 τ 选择。任务开始前固定一种策略，会忽略轨迹状态变化。'],
    };
  }
  if (moduleId === '4.1') {
    const item = strategyCopy[String(state.strategy)];
    return {
      title: `${item.name} 是怎么改写上下文的`,
      body: item.body,
      points: item.points,
    };
  }
  if (moduleId === '5.1') {
    const item = methodIO[Number(state.io)];
    return {
      title: item.title,
      body: item.body,
      points: [item.desc, ...item.points],
    };
  }
  if (moduleId === '6.1') {
    const step = Number(state.step);
    const item = pipeline[step];
    return {
      title: `Pipeline 第 ${step + 1} 步：${item.name}`,
      body: item.body,
      points: item.points,
    };
  }
  if (moduleId === '7.1') {
    const picked = String(state.previewBranch);
    const routed = Number(state.routerPicked) === 1;
    const preview = branchPreview[picked];
    if (preview) {
      return {
        title: routed ? `Router 最终选择：${branchPreview.keep.name}` : `${preview.name} 分支的 K=3 试跑`,
        body: routed
          ? '路由器比较三条 continuation 里真实出现的新行为：谁推进原任务、谁有工具证据、谁还在旧错误里打转。'
          : preview.router,
        points: routed
          ? [
              branchPreview.summary.router,
              branchPreview.keep.router,
              branchPreview.discard.router,
              '这就是 AgentSwing 比静态策略多出的关键动作：先试跑，再接回最有希望的分支。',
            ]
          : [...preview.steps, preview.router],
      };
    }
  }
  if (moduleId === '7.1') {
    const item = architecture[Number(state.node)];
    return {
      title: `${item.name} 在真实运行时是什么`,
      body: item.body,
      points: item.points,
    };
  }
  if (moduleId === '8.1') {
    const item = ablation.find((row) => row.key === String(state.ablation)) ?? ablation[3];
    const tradeoff = ablationTradeoff[item.key];
    return {
      title: `K 值取舍：${item.name}`,
      body: tradeoff.note,
      points: [
        `Table 3 数值：GPT-OSS-120B BrowseComp Pass@1 = ${item.gpt.toFixed(1)}%，Tongyi-DR-30B-A3B BrowseComp Pass@1 = ${item.tongyi.toFixed(1)}%。`,
        `互动指标：质量 ${tradeoff.quality}，额外调用成本 ${tradeoff.cost}，选择可靠性 ${tradeoff.reliability}。成本越高表示试跑越多。`,
        item.desc,
      ],
    };
  }
  if (moduleId === '8.1') {
    const item = ablation.find((row) => row.key === String(state.ablation)) ?? ablation[3];
    return {
      title: `消融设置：${item.name}`,
      body:
        'Table 3 的蓝色柱表示 GPT-OSS-120B 在 BrowseComp 上的 Pass@1 百分比，橘色柱表示 Tongyi-DR-30B-A3B 在 BrowseComp 上的 Pass@1 百分比。Pass@1 是一次运行最终答对率，所以 GPT-OSS 51.0 的含义是：在这个消融设置下，GPT-OSS-120B 一次运行答对 51.0%。Tongyi-DR 56.5 的含义同理。',
      points: [
        `蓝色柱：GPT-OSS-120B，BrowseComp Pass@1 = ${item.gpt.toFixed(1)}%。这个数值反映该设置下 GPT-OSS-120B 从问题出发一次运行得到正确答案的比例。`,
        `橘色柱：Tongyi-DR-30B-A3B，BrowseComp Pass@1 = ${item.tongyi.toFixed(1)}%。这个数值反映该设置下 Tongyi-DR 在同一基准上的一次运行答对率。`,
        item.desc,
      ],
    };
  }
  if (moduleId === '9.1') {
    const data = results[String(state.model)];
    return {
      title: `${data.name} 的 Table 1 结果`,
      body:
        'Result 先解释指标。论文用 Pass@1 表示一次运行最终答对的比例。这个数字会同时受到两件事影响：智能体有没有走到终点，以及走到终点后答案对不对。η 和 ρ 就是把这两件事拆开看。',
      points: [
        'η 表示搜索效率：智能体是否能走到终点并输出答案。',
        'ρ 表示终端精度：已经输出答案时，答案是否正确。',
        '灰色条是这个模型在该基准上的最佳静态策略，不一定每个基准都是同一种策略。',
        '绿色条是 AgentSwing。它在三个模型和三个基准上都高过对应最佳静态策略。',
      ],
    };
  }
  const data = aligned[String(state.aligned)];
  return {
    title: `${data.name} 的 Table 2 分解`,
    body:
      'Table 1 告诉我们 AgentSwing 的 Pass@1 更高。Table 2 进一步解释这个提升来自哪里：它把搜索效率 η、终端精度 ρ 和平均轮数放在一起比较。结果显示，AgentSwing 在不同轨迹状态下接回了更合适的分支，单纯增加轮数解释不了这个差异。',
    points: [
      'Table 2 使用对齐样本，便于比较不同策略在同一批任务上的行为。',
      '平均轮数反映任务花了多少交互步。步数更多不一定更好，重复搜索也会增加步数。',
      '最终结论：AgentSwing 把固定上下文管理改成了测试时路由。',
    ],
  };
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, w - 32, h - 32);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 13, weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.fillText(text, x, y);
}

function centerLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 13, weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function wrapLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color = INK,
  size = 12,
  weight = 600,
  lineHeight = 18
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  let lineText = '';
  let lineY = y;
  Array.from(text).forEach((char) => {
    const next = lineText + char;
    if (ctx.measureText(next).width > maxWidth && lineText) {
      ctx.fillText(lineText, x, lineY);
      lineText = char;
      lineY += lineHeight;
    } else {
      lineText = next;
    }
  });
  if (lineText) ctx.fillText(lineText, x, lineY);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = LINE, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke = LINE,
  radius = 8
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();
}

function progressBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string) {
  roundBox(ctx, x, y, w, h, PANEL, LINE, 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(4, w * value), h, 6);
  ctx.fill();
}

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 6) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function drawHero(ctx: CanvasRenderingContext2D, moduleId: string, t: number, w: number, h: number) {
  clear(ctx, w, h);
  const pulse = (Math.sin(t / 700) + 1) / 2;
  if (moduleId === 'old') {
    label(ctx, '固定策略', 26, 35, RED, 15, 800);
    roundBox(ctx, 30, 68, 88, 50, PANEL, BLUE, 8);
    label(ctx, '轨迹 τ', 55, 98, BLUE, 14, 800);
    roundBox(ctx, 148, 68, 86, 50, PANEL_SOFT, RED, 8);
    label(ctx, '同一规则', 165, 98, RED, 13, 800);
    roundBox(ctx, 264, 68, 66, 50, PANEL, LINE, 8);
    label(ctx, '继续', 284, 98, INK, 13, 800);
    line(ctx, 118, 93, 148, 93, RED, 3);
    line(ctx, 234, 93, 264, 93, RED, 3);
    ['证据', '噪声', '失败'].forEach((text, i) => {
      const color = i === 0 ? GREEN : i === 1 ? RED : PURPLE;
      progressBar(ctx, 54, 136 + i * 16, 190, 8, i === 0 ? 0.44 : pulse * 0.45 + 0.28, color);
      label(ctx, text, 256, 144 + i * 16, color, 11, 800);
    });
  } else {
    label(ctx, 'AgentSwing', 26, 35, GREEN, 15, 800);
    roundBox(ctx, 26, 80, 56, 42, PANEL, BLUE, 8);
    label(ctx, 'τ', 50, 106, BLUE, 15, 900);
    ['Summary', 'Keep-Last-N', 'Discard-All'].forEach((name, i) => {
      const y = 48 + i * 43;
      line(ctx, 82, 101, 104, y + 21, LINE, 2);
      roundBox(ctx, 104, y, 112, 34, PANEL, i === 1 ? ORANGE : LINE, 8);
      centerLabel(ctx, name, 160, y + 22, i === 1 ? ORANGE : INK, 11, 800);
      line(ctx, 216, y + 17, 246, 101, i === 1 ? GREEN : LINE, i === 1 ? 3 : 2);
    });
    roundBox(ctx, 246, 80, 38, 42, PANEL_SOFT, GREEN, 8);
    centerLabel(ctx, 'K', 265, 106, GREEN, 13, 900);
    line(ctx, 284, 101, 300, 101, GREEN, 3);
    roundBox(ctx, 300, 80, 42, 42, GREEN, GREEN, 8);
    centerLabel(ctx, '选', 321, 106, DARK_TEXT, 13, 900);
  }
}

function drawMini(ctx: CanvasRenderingContext2D, chapterId: string, w: number, h: number) {
  clear(ctx, w, h);
  const n = Number(chapterId.replace('chap-', '')) || 1;
  const stages = [
    { name: 'Problem', from: 1, to: 2, color: RED },
    { name: 'Motivation', from: 3, to: 4, color: ORANGE },
    { name: 'Method', from: 5, to: 8, color: BLUE },
    { name: 'Result', from: 9, to: 10, color: GREEN },
  ];
  const stage = stages.find((item) => n >= item.from && n <= item.to) ?? stages[0];
  const progress = Math.min(1, Math.max(0.1, n / 10));

  centerLabel(ctx, `第 ${n} 章`, w / 2, 39, stage.color, 18, 900);
  centerLabel(ctx, stage.name, w / 2, 66, INK, 14, 800);

  const barX = 30;
  const barY = 88;
  const barW = w - 60;
  roundBox(ctx, barX, barY, barW, 12, PANEL, LINE, 6);
  fillRoundRect(ctx, barX, barY, barW * progress, 12, stage.color, 6);

  const ticks = ['问题', '动机', '方法', '结果'];
  ticks.forEach((tick, i) => {
    const x = barX + (barW * i) / 3;
    fillRoundRect(ctx, x - 2, barY - 5, 4, 22, i <= stages.indexOf(stage) ? stage.color : LINE, 2);
    centerLabel(ctx, tick, x, 119, i <= stages.indexOf(stage) ? INK : MUTED, 10, 800);
  });
}

function drawTrajectory(ctx: CanvasRenderingContext2D, active: number, w: number) {
  label(ctx, '轨迹 = 智能体运行日志', 30, 40, BLUE, 15, 800);
  segments.forEach((seg, i) => {
    const x = 34 + i * 128;
    const on = i === active;
    roundBox(ctx, x, 72, 105, 82, on ? PANEL_SOFT : PANEL, on ? BLUE : LINE, 8);
    label(ctx, seg.name, x + 10, 96, on ? BLUE : INK, 12, 800);
    seg.lines.forEach((text, row) => label(ctx, text, x + 10, 121 + row * 17, MUTED, 10, 500));
    if (i < segments.length - 1) line(ctx, x + 105, 113, x + 124, 113, LINE, 2);
  });
  label(ctx, `选中：${segments[active].name}`, 34, 198, active === 3 ? GREEN : BLUE, 14, 800);
  line(ctx, 34, 210, w - 34, 210, active === 3 ? GREEN : LINE, 2);
}

function drawPressure(ctx: CanvasRenderingContext2D, length: number) {
  const occupied = Math.max(0.1, Math.min(0.96, length));
  const evidenceInOccupied = Math.max(0.12, 0.38 - occupied * 0.16);
  const evidence = occupied * evidenceInOccupied;
  const noise = occupied - evidence;
  const free = 1 - occupied;
  const threshold = 0.78;
  label(ctx, '上下文压力 = 运行日志占用窗口的程度', 30, 40, BLUE, 15, 800);
  const x = 44;
  const y = 78;
  const w = 470;
  const h = 34;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.clip();
  ctx.fillStyle = GREEN;
  ctx.fillRect(x, y, w * evidence, h);
  ctx.fillStyle = RED;
  ctx.fillRect(x + w * evidence, y, w * noise, h);
  ctx.fillStyle = PANEL_SOFT;
  ctx.fillRect(x + w * occupied, y, w * free, h);
  ctx.restore();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.stroke();

  const markerX = x + w * threshold;
  line(ctx, markerX, y - 10, markerX, y + 48, ORANGE, 2);
  centerLabel(ctx, '触发线', markerX, y - 16, ORANGE, 11, 800);

  label(ctx, '证据：可用于答案的网页事实', x, 146, GREEN, 12, 800);
  label(ctx, '噪声：错猜、重复搜索、失败返回', x, 168, RED, 12, 800);
  label(ctx, `剩余空间：${Math.round(free * 100)}%，留给后续搜索和验证`, x + 250, 146, BLUE, 12, 800);
  label(ctx, occupied >= threshold ? '达到触发线，需要压缩或改写上下文。' : '噪声已经随轨迹一起积累。', x + 250, 168, occupied >= threshold ? RED : ORANGE, 12, 800);
}

function drawClues(ctx: CanvasRenderingContext2D, active: number) {
  label(ctx, '同一段轨迹里，不同信息的价值不同', 30, 40, BLUE, 15, 800);
  clueCards.forEach((card, i) => {
    const x = 34 + i * 101;
    const on = active === i;
    roundBox(ctx, x, 74, 86, 74, on ? card.color : PANEL, on ? card.color : LINE, 8);
    label(ctx, card.name, x + 15, 112, on ? DARK_TEXT : INK, 14, 800);
  });
  const card = clueCards[active];
  label(ctx, `选中：${card.name}`, 34, 190, card.color, 14, 800);
}

function drawStrategies(ctx: CanvasRenderingContext2D, mode: string) {
  label(ctx, 'managed context：整理后的上下文', 30, 40, BLUE, 15, 800);
  roundBox(ctx, 34, 70, 150, 128, PANEL, LINE, 8);
  label(ctx, '原始轨迹 T', 58, 96, INK, 14, 800);
  ['用户问题 q', '早期搜索', '错误假设', '最近线索', '工具返回'].forEach((text, i) => {
    const color = i === 2 ? RED : i >= 3 ? GREEN : MUTED;
    label(ctx, text, 56, 124 + i * 14, color, 11, 600);
  });
  line(ctx, 194, 134, 256, 134, strategyCopy[mode].color, 3);
  const s = strategyCopy[mode];
  roundBox(ctx, 270, 70, 230, 128, PANEL, s.color, 8);
  label(ctx, s.name, 292, 102, s.color, 15, 800);
  label(ctx, mode === 'summary' ? 'τ → [q, summary(τ)]' : mode === 'keep' ? 'τ → last_N(τ)' : 'τ → [q]', 292, 140, INK, 14, 800);
  label(ctx, mode === 'summary' ? '压缩整段轨迹' : mode === 'keep' ? '按时间截断' : '只保留原题', 292, 174, MUTED, 12, 700);
}

function drawCases(ctx: CanvasRenderingContext2D, pickedCase: string) {
  const item = caseCopy[pickedCase];
  label(ctx, item.title, 30, 40, BLUE, 15, 800);
  roundBox(ctx, 34, 68, 216, 124, PANEL, LINE, 8);
  label(ctx, '当前轨迹状态', 52, 96, INK, 14, 800);
  label(ctx, pickedCase === 'mando' ? '最近出现重要线索' : '最近陷入失败循环', 52, 132, pickedCase === 'mando' ? ORANGE : PURPLE, 14, 800);
  roundBox(ctx, 306, 86, 172, 72, PANEL_SOFT, pickedCase === 'mando' ? ORANGE : PURPLE, 8);
  label(ctx, '更合适的策略', 330, 112, INK, 13, 800);
  label(ctx, item.pick, 338, 140, pickedCase === 'mando' ? ORANGE : PURPLE, 16, 900);
  line(ctx, 250, 130, 306, 122, GREEN, 3);
  label(ctx, `选择：${item.pick}`, 34, 208, GREEN, 14, 800);
}

function drawMethodIO(ctx: CanvasRenderingContext2D, active: number) {
  label(ctx, 'AgentSwing 的接口', 30, 40, BLUE, 15, 800);
  const nodes = [
    ['输入', 'τ / q / K', BLUE],
    ['处理', '三分支试跑', ORANGE],
    ['输出', 'τ_new', GREEN],
  ];
  nodes.forEach(([name, sub, color], i) => {
    const x = 48 + i * 170;
    const on = i === active;
    roundBox(ctx, x, 82, 126, 78, on ? String(color) : PANEL, on ? String(color) : LINE, 8);
    label(ctx, String(name), x + 43, 112, on ? DARK_TEXT : String(color), 16, 900);
    label(ctx, String(sub), x + 22, 140, on ? DARK_TEXT : MUTED, 12, 700);
    if (i < nodes.length - 1) line(ctx, x + 126, 121, x + 164, 121, GREEN, 3);
  });
  label(ctx, methodIO[active].name, 44, 204, methodIO[active].key === 'output' ? GREEN : BLUE, 14, 900);
}

function drawPipeline(ctx: CanvasRenderingContext2D, step: number) {
  label(ctx, 'AgentSwing pipeline', 30, 40, BLUE, 15, 800);
  pipeline.forEach((item, i) => {
    const x = 34 + i * 101;
    const active = i <= step;
    roundBox(ctx, x, 86, 82, 54, active ? (i === step ? ORANGE : GREEN) : PANEL, active ? (i === step ? ORANGE : GREEN) : LINE, 8);
    label(ctx, item.name, x + 14, 119, active ? DARK_TEXT : INK, 13, 800);
    if (i < pipeline.length - 1) line(ctx, x + 82, 113, x + 100, 113, active && i < step ? GREEN : LINE, 2);
  });
  label(ctx, `当前步骤：${pipeline[step].name}`, 34, 194, step === 4 ? GREEN : BLUE, 14, 800);
}

function drawArchitecture(ctx: CanvasRenderingContext2D, active: number) {
  label(ctx, 'Figure 4 ', 30, 40, BLUE, 15, 800);
  const pts = [
    [76, 124],
    [238, 68],
    [238, 124],
    [238, 180],
    [422, 124],
  ];
  const boxW = 124;
  const boxH = 46;
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [2, 4],
    [3, 4],
  ].forEach(([a, b]) => line(ctx, pts[a][0] + boxW / 2, pts[a][1], pts[b][0] - boxW / 2, pts[b][1], LINE, 2));
  const nodeLabel: Record<string, string[]> = {
    raw: ['原始轨迹', 'τ'],
    summary: ['Summary', '分支'],
    keep: ['Keep-Last-N', '分支'],
    discard: ['Discard-All', '分支'],
    router: ['Router', '路由器'],
  };
  architecture.forEach((item, i) => {
    const [x, y] = pts[i];
    const on = i === active;
    const fill = on ? ORANGE : item.key === 'router' ? GREEN : PANEL;
    const stroke = on || item.key === 'router' ? ORANGE : LINE;
    const textColor = on || item.key === 'router' ? DARK_TEXT : INK;
    roundBox(ctx, x - boxW / 2, y - boxH / 2, boxW, boxH, fill, stroke, 8);
    const lines = nodeLabel[item.key] ?? [item.name];
    if (lines.length === 1) {
      centerLabel(ctx, lines[0], x, y + 4, textColor, 12, 800);
    } else {
      centerLabel(ctx, lines[0], x, y - 2, textColor, 11, 800);
      centerLabel(ctx, lines[1], x, y + 15, textColor, 10, 800);
    }
  });
  label(ctx, `选中节点：${architecture[active].name}`, 34, 216, active === 4 ? GREEN : BLUE, 14, 800);
}

function drawAblation(ctx: CanvasRenderingContext2D, activeKey: string) {
  label(ctx, 'Table 3：前瞻路由消融，BrowseComp 分数', 30, 40, BLUE, 15, 800);
  roundBox(ctx, 34, 52, 12, 8, BLUE, BLUE, 2);
  label(ctx, '蓝色：GPT-OSS-120B Pass@1', 52, 61, INK, 11, 700);
  roundBox(ctx, 238, 52, 12, 8, ORANGE, ORANGE, 2);
  label(ctx, '橘色：Tongyi-DR-30B-A3B Pass@1', 256, 61, INK, 11, 700);
  ablation.forEach((row, i) => {
    const x = 48 + i * 98;
    const on = row.key === activeKey;
    const gpt = (row.gpt - 48) / 14;
    const tongyi = (row.tongyi - 54) / 8;
    progressBar(ctx, x, 92, 34, 86, gpt, on ? GREEN : BLUE);
    progressBar(ctx, x + 38, 92, 34, 86, tongyi, on ? GREEN : ORANGE);
    label(ctx, row.gpt.toFixed(1), x + 3, 88, on ? GREEN : BLUE, 10, 800);
    label(ctx, row.tongyi.toFixed(1), x + 39, 88, on ? GREEN : ORANGE, 10, 800);
    label(ctx, row.name, x - 4, 206, on ? GREEN : MUTED, 11, 800);
  });
  const item = ablation.find((row) => row.key === activeKey) ?? ablation[3];
  label(ctx, `选中：${item.name}`, 34, 228, item.key === 'k3' ? GREEN : BLUE, 13, 800);
}

function drawResults(ctx: CanvasRenderingContext2D, model: string) {
  const data = results[model];
  label(ctx, `${data.name}：静态最好 vs AgentSwing`, 30, 40, BLUE, 15, 800);
  data.rows.forEach(([bench, stat, swing], i) => {
    const y = 74 + i * 50;
    label(ctx, bench, 34, y + 18, INK, 12, 800);
    progressBar(ctx, 168, y, 255, 15, stat / 80, LINE);
    progressBar(ctx, 168, y + 21, 255, 15, swing / 80, GREEN);
    label(ctx, `静态 ${stat.toFixed(1)}`, 438, y + 13, MUTED, 12, 700);
    label(ctx, `AgentSwing ${swing.toFixed(1)}`, 438, y + 34, GREEN, 12, 800);
  });
}

function drawAligned(ctx: CanvasRenderingContext2D, model: string) {
  const data = aligned[model];
  label(ctx, data.name, 30, 40, BLUE, 15, 800);
  const swing = data.rows.find((row) => row[0] === 'AgentSwing')!;
  const bestStatic = data.rows
    .filter((row) => row[0] !== 'AgentSwing')
    .reduce((best, row) => (row[3] > best[3] ? row : best));
  label(ctx, `静态最好 Pass@1: ${bestStatic[3].toFixed(1)}，AgentSwing: ${swing[3].toFixed(1)}`, 34, 72, GREEN, 13, 800);
  [
    ['η 搜索效率', swing[1] / 100, BLUE],
    ['ρ 终端精度', swing[2] / 100, GREEN],
    ['Pass@1', swing[3] / 100, ORANGE],
    ['平均轮数', Math.min(1, swing[4] / 360), PURPLE],
  ].forEach(([name, value, color], i) => {
    const x = 54 + i * 120;
    progressBar(ctx, x, 112, 78, 20, Number(value), String(color));
    label(ctx, String(name), x, 102, INK, 12, 800);
    label(ctx, i === 3 ? swing[4].toFixed(1) : `${(Number(value) * 100).toFixed(1)}%`, x + 4, 154, String(color), 15, 900);
  });
}

function drawJudgeCases(ctx: CanvasRenderingContext2D, pickedCase: string, pickedStrategy: string) {
  const item = caseCopy[pickedCase];
  const judged = strategyJudge[pickedCase]?.[pickedStrategy];
  label(ctx, '策略判官：同一策略会因轨迹状态而翻转', 30, 40, BLUE, 15, 800);
  roundBox(ctx, 34, 64, 202, 126, PANEL, LINE, 8);
  label(ctx, item.title, 54, 92, pickedCase === 'mando' ? ORANGE : PURPLE, 14, 900);
  wrapLabel(ctx, pickedCase === 'mando' ? '最近刚出现 $tupid Young 证据，下一步要查歌名。' : '最近几轮反复 PDF 抽取失败，没有新证据。', 54, 122, 158, INK, 12, 700, 18);

  ['summary', 'keep', 'discard'].forEach((key, i) => {
    const row = strategyJudge[pickedCase][key];
    const x = 268;
    const y = 64 + i * 48;
    const on = key === pickedStrategy;
    roundBox(ctx, x, y, 226, 36, on ? row.color : PANEL, on ? row.color : LINE, 8);
    label(ctx, row.verdict, x + 14, y + 23, on ? DARK_TEXT : row.color, 12, 900);
    progressBar(ctx, x + 128, y + 10, 78, 11, row.score / 100, on ? DARK_TEXT : row.color);
  });

  if (judged) {
    label(ctx, `你的选择：${pickedStrategy}`, 38, 214, judged.color, 13, 900);
    wrapLabel(ctx, judged.label, 158, 214, 360, judged.color, 12, 800, 17);
  } else {
    label(ctx, '先选一个策略，看看它在当前案例里是救场还是拖后腿。', 38, 214, MUTED, 13, 800);
  }
}

function drawLookahead(ctx: CanvasRenderingContext2D, pickedBranch: string, routed: number) {
  const selected = branchPreview[pickedBranch] ?? branchPreview.keep;
  label(ctx, '三分支 K=3 前瞻试跑', 30, 40, BLUE, 15, 800);
  ['summary', 'keep', 'discard'].forEach((key, i) => {
    const branch = branchPreview[key];
    const x = 42 + i * 170;
    const on = key === pickedBranch || (routed === 1 && key === 'keep');
    roundBox(ctx, x, 58, 132, 44, on ? branch.color : PANEL, on ? branch.color : LINE, 8);
    centerLabel(ctx, branch.name, x + 66, 85, on ? DARK_TEXT : INK, 11, 900);
    line(ctx, x + 66, 102, x + 66, 118, on ? branch.color : LINE, 2);
    branch.steps.forEach((step, row) => {
      const y = 118 + row * 25;
      roundBox(ctx, x, y, 132, 18, row === 2 && on ? PANEL_SOFT : PANEL, row === 2 && on ? branch.color : LINE, 5);
      centerLabel(ctx, step, x + 66, y + 13, row === 2 && on ? branch.color : MUTED, 9, 700);
    });
    progressBar(ctx, x + 8, 198, 116, 10, branch.quality / 100, on ? branch.color : LINE);
  });

  if (routed === 1) {
    roundBox(ctx, 396, 22, 128, 30, GREEN, GREEN, 8);
    centerLabel(ctx, 'Router: keep', 460, 42, DARK_TEXT, 12, 900);
    line(ctx, 278, 206, 396, 37, GREEN, 3);
  } else {
    label(ctx, `正在检查：${selected.name}`, 34, 222, selected.color, 13, 900);
  }
}

function drawKTradeoff(ctx: CanvasRenderingContext2D, activeKey: string) {
  const item = ablation.find((row) => row.key === activeKey) ?? ablation[3];
  const tradeoff = ablationTradeoff[item.key];
  label(ctx, 'K 值取舍：看质量、成本、可靠性', 30, 40, BLUE, 15, 800);
  const metrics: [string, number, string][] = [
    ['任务质量', tradeoff.quality, GREEN],
    ['额外调用成本', tradeoff.cost, ORANGE],
    ['选择可靠性', tradeoff.reliability, BLUE],
  ];
  metrics.forEach(([name, value, color], i) => {
    const y = 74 + i * 42;
    label(ctx, name, 44, y + 14, INK, 12, 800);
    progressBar(ctx, 154, y, 262, 16, value / 100, color);
    label(ctx, `${value}`, 430, y + 14, color, 13, 900);
  });
  roundBox(ctx, 44, 202, 188, 24, item.key === 'k3' ? PANEL_SOFT : PANEL, item.key === 'k3' ? GREEN : LINE, 7);
  label(ctx, item.key === 'k3' ? '论文主实验设置：K=3' : `当前设置：${item.name}`, 58, 219, item.key === 'k3' ? GREEN : INK, 12, 900);
  label(ctx, `GPT-OSS ${item.gpt.toFixed(1)} / Tongyi ${item.tongyi.toFixed(1)}`, 276, 219, BLUE, 12, 900);
}

function drawResultRace(ctx: CanvasRenderingContext2D, model: string, raceStart: number, t: number) {
  const data = aligned[model];
  const swing = data.rows.find((row) => row[0] === 'AgentSwing')!;
  const bestStatic = data.rows.filter((row) => row[0] !== 'AgentSwing').reduce((best, row) => (row[3] > best[3] ? row : best));
  const progress = raceStart > 0 ? Math.min(1, (t - raceStart) / 1100) : 1;
  label(ctx, `${data.name}：Pass@1 结果对比`, 30, 40, BLUE, 15, 800);
  [
    ['静态最好', bestStatic[3], MUTED],
    ['AgentSwing', swing[3], GREEN],
  ].forEach(([name, value, color], i) => {
    const y = 86 + i * 62;
    label(ctx, String(name), 48, y + 17, String(color), 13, 900);
    progressBar(ctx, 158, y, 280, 22, (Number(value) / 100) * progress, String(color));
    label(ctx, `${(Number(value) * progress).toFixed(1)}%`, 456, y + 18, String(color), 14, 900);
  });
  const delta = swing[3] - bestStatic[3];
  roundBox(ctx, 56, 198, 438, 34, PANEL_SOFT, GREEN, 7);
  wrapLabel(ctx, `提升 ${delta.toFixed(1)} 个百分点：测试时路由带来更高 Pass@1。`, 70, 214, 360, GREEN, 11, 900, 14);
}

function drawModule(ctx: CanvasRenderingContext2D, id: string, state: State, t: number, w: number, h: number) {
  clear(ctx, w, h);
  if (id === '1.1') drawTrajectory(ctx, Number(state.segment), w);
  if (id === '1.2') drawPressure(ctx, Number(state.length));
  if (id === '2.1') drawClues(ctx, Number(state.clue));
  if (id === '4.2') drawJudgeCases(ctx, String(state.case), String(state.judge));
  if (id === '4.1') drawStrategies(ctx, String(state.strategy));
  if (id === '5.1') drawMethodIO(ctx, Number(state.io));
  if (id === '6.1') drawPipeline(ctx, Number(state.step));
  if (id === '7.1') drawLookahead(ctx, String(state.previewBranch), Number(state.routerPicked));
  if (id === '8.1') drawKTradeoff(ctx, String(state.ablation));
  if (id === '9.1') drawResults(ctx, String(state.model));
  if (id === '10.1') drawResultRace(ctx, String(state.aligned), Number(state.raceStart), t);
  void t;
}

export const AgentSwingLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<State>({});
  const [state, setState] = useState<State>(() => ({
    segment: 0,
    length: 0.62,
    clue: 0,
    strategy: 'summary',
    case: 'mando',
    judge: 'keep',
    io: 0,
    eta: 0.74,
    rho: 0.57,
    step: 0,
    node: 0,
    previewBranch: 'keep',
    routerPicked: 0,
    ablation: 'k3',
    model: 'deepseek',
    aligned: 'gpt',
    raceStart: 0,
  }));
  const [feedback, setFeedback] = useState<Feedback>({
    text: '',
    cls: '',
  });
  stateRef.current = state;

  const size = useMemo(() => {
    if (chapterId === 'hero') return { w: 360, h: 190 };
    if (moduleId === 'ana') return { w: 244, h: 130 };
    return { w: 560, h: 240 };
  }, [chapterId, moduleId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, size.w, size.h);
    } catch {
      return;
    }

    const tick = (time: number) => {
      if (chapterId === 'hero') drawHero(ctx, moduleId, time, size.w, size.h);
      else if (moduleId === 'ana') drawMini(ctx, chapterId, size.w, size.h);
      else drawModule(ctx, moduleId, stateRef.current, time, size.w, size.h);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    if (chapterId === 'hero') drawHero(ctx, moduleId, 0, size.w, size.h);
    else if (moduleId === 'ana') drawMini(ctx, chapterId, size.w, size.h);
    else drawModule(ctx, moduleId, stateRef.current, 0, size.w, size.h);
    canvas.classList.add('is-ready');
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId, moduleId, size.h, size.w]);

  const update = (patch: State, fb: Feedback) => {
    setState((prev) => ({ ...prev, ...patch }));
    setFeedback(fb);
  };

  if (chapterId === 'hero' || moduleId === 'ana') {
    return <canvas className={moduleId === 'ana' ? 'agentswing-mini-canvas' : undefined} ref={canvasRef} width={size.w} height={size.h} />;
  }

  return (
    <div className="agentswing-widget">
      <canvas ref={canvasRef} width={size.w} height={size.h} />
      {renderControls(moduleId, state, update)}
      {feedback.text ? <div className={`feedback ${feedback.cls}`}>{feedback.text}</div> : null}
      <DetailCard detail={getDetail(moduleId, state)} />
      {moduleId === '9.1' ? <ResultTable model={String(state.model)} /> : null}
      {moduleId === '10.1' ? <AlignedTable model={String(state.aligned)} /> : null}
    </div>
  );
};

function renderControls(moduleId: string, state: State, update: (patch: State, fb: Feedback) => void) {
  if (moduleId === '1.1') {
    return chipRow(
      segments.map((item) => item.key),
      segments.map((item) => item.name),
      segments[Number(state.segment)].key,
      (key) => {
        const index = segments.findIndex((item) => item.key === key);
        update({ segment: index }, { text: segments[index].desc, cls: key === 'response' ? 'good' : '' });
      }
    );
  }
  if (moduleId === '1.2') {
    const value = Number(state.length);
    return (
      <div className="ctrl">
        <label>
          轨迹占用 <span className="val">{Math.round(value * 100)}%</span>
        </label>
        <input
          type="range"
          min={10}
          max={96}
          value={Math.round(value * 100)}
          onChange={(e) => {
            const next = Number(e.target.value) / 100;
            update(
              { length: next },
              next > 0.78
                ? { text: '高占用：旧错误、失败工具返回和重复动作会挤在模型眼前，搜索质量会明显下降。', cls: 'bad' }
                : next < 0.35
                  ? { text: '低占用：窗口空间还多，主要问题是证据链还短，不能急着下结论。', cls: '' }
                  : { text: '中等占用：有用证据和旧噪声开始混在一起，策略选择会影响后续搜索方向。', cls: 'good' }
            );
          }}
        />
      </div>
    );
  }
  if (moduleId === '2.1') {
    return chipRow(
      clueCards.map((item) => item.key),
      clueCards.map((item) => item.name),
      clueCards[Number(state.clue)].key,
      (key) => {
        const index = clueCards.findIndex((item) => item.key === key);
        update({ clue: index }, { text: clueCards[index].desc, cls: key === 'noise' || key === 'failure' ? 'bad' : 'good' });
      }
    );
  }
  if (moduleId === '4.2') {
    const pickedCase = String(state.case);
    const pickedStrategy = String(state.judge);
    return (
      <div className="stacked-controls">
        {chipRow(['mando', 'crickets'], ['Mando 案例', 'live-crickets 案例'], pickedCase, (key) => {
          const nextDefault = key === 'mando' ? 'keep' : 'discard';
          const judged = strategyJudge[key][nextDefault];
          update({ case: key, judge: nextDefault }, { text: judged.feedback, cls: 'good' });
        })}
        {chipRow(['summary', 'keep', 'discard'], ['Summary', 'Keep-Last-N', 'Discard-All'], pickedStrategy, (key) => {
          const judged = strategyJudge[pickedCase][key];
          update({ judge: key }, { text: judged.feedback, cls: judged.color === RED ? 'bad' : judged.color === GREEN ? 'good' : '' });
        })}
      </div>
    );
  }
  if (moduleId === '4.1') {
    return chipRow(
      ['summary', 'keep', 'discard'],
      ['Summary', 'Keep-Last-N', 'Discard-All'],
      String(state.strategy),
      (key) => {
        const item = strategyCopy[key];
        update({ strategy: key }, { text: `${item.name}：${item.runtime} ${item.risk}`, cls: key === 'discard' ? 'good' : '' });
      }
    );
  }
  if (moduleId === '5.1') {
    return chipRow(
      methodIO.map((item) => item.key),
      methodIO.map((item) => item.name),
      methodIO[Number(state.io)].key,
      (key) => {
        const index = methodIO.findIndex((item) => item.key === key);
        update({ io: index }, { text: methodIO[index].desc, cls: key === 'output' ? 'good' : '' });
      }
    );
  }
  if (moduleId === '6.1') {
    const step = Number(state.step);
    return stepButtons(step, pipeline.length - 1, (next) =>
      update({ step: next }, { text: pipeline[next].feedback, cls: next === pipeline.length - 1 ? 'good' : '' })
    );
  }
  if (moduleId === '7.1') {
    const picked = String(state.previewBranch);
    return (
      <div className="stacked-controls">
        {chipRow(['summary', 'keep', 'discard'], ['试跑 Summary', '试跑 Keep-Last-N', '试跑 Discard-All'], picked, (key) => {
          const branch = branchPreview[key];
          update({ previewBranch: key, routerPicked: 0 }, { text: branch.router, cls: key === 'keep' ? 'good' : key === 'discard' ? 'bad' : '' });
        })}
        <div className="race-controls">
          <button
            className="tiny"
            onClick={() =>
              update(
                { previewBranch: 'keep', routerPicked: 1 },
                { text: 'Router 选择 Keep-Last-N：这条 continuation 使用了已验证人物证据，并把任务推进到歌名证据。', cls: 'good' }
              )
            }
            type="button"
          >
            路由器选择
          </button>
          <button className="tiny ghost" onClick={() => update({ routerPicked: 0 }, { text: '继续查看三条分支的 K=3 试跑结果。', cls: '' })} type="button">
            重看分支
          </button>
        </div>
      </div>
    );
  }
  if (moduleId === '8.1') {
    return chipRow(
      ablation.map((item) => item.key),
      ablation.map((item) => item.name),
      String(state.ablation),
      (key) => {
        const item = ablation.find((row) => row.key === key) ?? ablation[3];
        update(
          { ablation: key },
          { text: `${item.name}: GPT-OSS ${item.gpt.toFixed(1)}，Tongyi-DR ${item.tongyi.toFixed(1)}。${item.desc}`, cls: key === 'k3' ? 'good' : '' }
        );
      }
    );
  }
  if (moduleId === '9.1') {
    return chipRow(['gpt', 'deepseek', 'tongyi'], ['GPT-OSS', 'DeepSeek', 'Tongyi-DR'], String(state.model), (key) =>
      update({ model: key }, { text: `${results[key].name}：绿色条是 AgentSwing，灰色条是该模型最好的静态策略。`, cls: 'good' })
    );
  }
  if (moduleId === '10.1') {
    return (
      <div className="stacked-controls">
        {chipRow(['gpt', 'deepseek', 'tongyi'], ['GPT-OSS', 'DeepSeek', 'Tongyi-DR'], String(state.aligned), (key) =>
          update({ aligned: key, raceStart: 0 }, { text: `${aligned[key].name}。点击“开始比较”播放 Pass@1 对比。`, cls: 'good' })
        )}
        <div className="race-controls">
          <button className="tiny" onClick={() => update({ raceStart: performance.now() }, { text: '结果对比开始：两条从同一起点增长，绿色是 AgentSwing。', cls: 'good' })} type="button">
            开始比较
          </button>
          <button className="tiny ghost" onClick={() => update({ raceStart: 0 }, { text: '已重置到最终数值视图。', cls: '' })} type="button">
            重置
          </button>
        </div>
      </div>
    );
  }
  if (moduleId === '10.1') {
    return chipRow(['gpt', 'deepseek', 'tongyi'], ['GPT-OSS', 'DeepSeek', 'Tongyi-DR'], String(state.aligned), (key) =>
      update({ aligned: key }, { text: `${aligned[key].name}。表里能看到 η、ρ、Pass@1 和平均轮数的取舍。`, cls: 'good' })
    );
  }
  return null;
}

function DetailCard({ detail }: { detail: Detail }) {
  return (
    <div className="interaction-detail">
      <div className="interaction-detail-title">{detail.title}</div>
      <p>{detail.body}</p>
      <ul>
        {detail.points.map((point) => (
          <li key={point}>{point.includes('<span') ? <span dangerouslySetInnerHTML={{ __html: point }} /> : point}</li>
        ))}
      </ul>
    </div>
  );
}

function chipRow(keys: string[], labels: string[], active: string, onPick: (key: string) => void) {
  return (
    <div className="chip-row">
      {keys.map((key, i) => (
        <button key={key} className={`chip ${active === key ? 'selected' : ''}`} onClick={() => onPick(key)} type="button">
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

function stepButtons(step: number, max: number, onStep: (next: number) => void) {
  return (
    <div className="step-ctrl">
      <button className="tiny ghost" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0} type="button">
        上一步
      </button>
      <span className="step-label">
        <b>{step + 1}</b> / {max + 1}
      </span>
      <button className="tiny" onClick={() => onStep(Math.min(max, step + 1))} disabled={step === max} type="button">
        下一步
      </button>
    </div>
  );
}

function ResultTable({ model }: { model: string }) {
  return (
    <table className="paper">
      <thead>
        <tr>
          <th>基准</th>
          <th>静态最好</th>
          <th>AgentSwing</th>
          <th>静态策略</th>
        </tr>
      </thead>
      <tbody>
        {results[model].rows.map(([bench, stat, swing, note]) => (
          <tr key={bench}>
            <td>{bench}</td>
            <td>{stat.toFixed(1)}</td>
            <td>
              <b>{swing.toFixed(1)}</b>
            </td>
            <td>{note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AlignedTable({ model }: { model: string }) {
  return (
    <table className="paper">
      <thead>
        <tr>
          <th>策略</th>
          <th>η</th>
          <th>ρ</th>
          <th>Pass@1</th>
          <th>平均轮数</th>
        </tr>
      </thead>
      <tbody>
        {aligned[model].rows.map(([name, eta, rho, pass, turns]) => (
          <tr key={name}>
            <td>{name}</td>
            <td>{eta.toFixed(1)}</td>
            <td>{rho.toFixed(1)}</td>
            <td>
              {name === 'AgentSwing' ? <b>{pass.toFixed(1)}</b> : pass.toFixed(1)}
            </td>
            <td>{turns.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AgentSwingLab;
