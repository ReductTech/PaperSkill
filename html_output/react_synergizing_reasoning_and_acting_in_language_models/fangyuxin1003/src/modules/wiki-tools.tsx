import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, drawBook, drawCard, label, line } from './scene-kit';

type Page = '《小王子》' | '作者全名条目' | null;
type Session = { stage: number; page: Page; cursor: number; finished: boolean; action: string; observation: string };
const initial: Session = { stage: 0, page: null, cursor: 0, finished: false, action: '尚未调用', observation: '还没有当前页面；先检索一个实体。' };

export function WikiTools() {
  const [session, setSession] = useState<Session>(initial);
  const { stage, page, cursor, finished, action, observation } = session;
  function searchBook() {
    setSession({ stage: 1, page: '《小王子》', cursor: 0, finished: false, action: 'search[The Little Prince]', observation: '作品条目：《小王子》的作者是圣埃克苏佩里。当前页为作品页面。' });
  }
  function lookup() {
    if (!page || finished) return;
    const match = page === '《小王子》' ? '页内匹配：作者是圣埃克苏佩里。还需要打开人物条目核查出生地。' : '页内匹配：圣埃克苏佩里出生于法国里昂。';
    setSession({ ...session, stage: page === '《小王子》' ? 2 : stage, cursor: cursor + 1, action: 'lookup[Saint-Exupéry]', observation: cursor === 0 ? match : `教学片段中没有下一条匹配句。当前页仍是 ${page}；lookup 不会搜索别的页面。` });
  }
  function searchAuthor() {
    if (stage < 2 || finished) return;
    setSession({ stage: 3, page: '作者全名条目', cursor: 0, finished: false, action: 'search[Antoine de Saint-Exupéry]', observation: '人物条目：安托万·德·圣埃克苏佩里出生于法国里昂。当前页为人物页面。' });
  }
  const feedback = finished ? '已结束：答案为里昂。可重新检索 《小王子》，开启新的教学轨迹。' : stage === 0 ? '尚无当前页，lookup 不可用。本教学轨迹先解锁实体检索，再解锁页内查找。' : stage === 1 ? '已定位 《小王子》 页面。教学示意先要求完成一次 lookup，之后解锁作者页检索与提交。' : stage === 2 ? '已获得 圣埃克苏佩里 关联，还需打开作者页核查出生地点；提交按钮暂未解锁。' : '已取得出生地点的观察，可以提交。此时 lookup 查询的是 作者全名条目 当前页。';
  return <>
    <CanvasScene key={`${action}-${cursor}-${stage}`} label={`工具教学示意：当前页 ${page ?? '无'}，已完成 ${stage} 个教学步骤，${finished ? '已终止' : '进行中'}`} draw={(ctx, _w, _h, time) => {

      label(ctx,'当前页面',84,42);label(ctx,finished?'已提交答案':'当前观察',637,42);
      if(stage===0){drawCard(ctx,96,72,285,157,C.contour);words(ctx,['还没有打开页面','先执行 search','再在当前页 lookup'],117,113,19,C.muted,38);}
      else{
        drawBook(ctx,76,60,2,page==='《小王子》'?C.blue:C.green);
        words(ctx,page==='《小王子》'?['《小王子》','作品条目','作者是']:['圣埃克苏佩里','人物条目','人物生平'],93,100,17,C.blue,48);
        const contents=page==='《小王子》'?['作者是','圣埃克苏佩里','继续查出生地']:['出生地','法国里昂','人物生平'];
        if(cursor===1){ctx.fillStyle='#e7efd9';ctx.fillRect(274,123,148,35);}
        words(ctx,contents,278,100,17,C.text,48);
      }
      panel(ctx,636,74,354,153,stage?C.green:C.contour);
      const rows=finished?['finish 已提交','里昂','轨迹结束 · 没有新增观察']:stage===0?['等待调用','尚无环境返回']:cursor>1?['没有下一句匹配内容','仍然停留在当前页','lookup 没有搜索其他页面']:stage<3?['返回：圣埃克苏佩里','已知道作者姓名','还需要核查出生地点']:['返回：出生地点','圣埃克苏佩里出生于里昂','现在可以提交答案'];
      words(ctx,rows,654,110,18,finished?C.blue:C.green,39);
      if(stage&&!finished){flow(ctx,447,147,617,147,(time%2800)/2800,C.green);label(ctx,'当前页内容',469,126,C.muted,16);}
      else if(finished){flow(ctx,721,245,950,245,Math.min(1,(time%5000)/1800),C.blue);}
      else flow(ctx,445,146,616,146,(time%2800)/2800,C.border);

    }} />
    <Controls>
      <Chip active={action === 'search[The Little Prince]'} onClick={searchBook}>search[The Little Prince]</Chip>
      <Chip active={action === 'lookup[Saint-Exupéry]'} onClick={lookup} disabled={!page || finished}>lookup[Saint-Exupéry]</Chip>
      <Chip active={action === 'search[Antoine de Saint-Exupéry]'} onClick={searchAuthor} disabled={stage < 2 || finished}>search[Antoine de Saint-Exupéry]</Chip>
      <Chip active={finished} disabled={stage < 3 || finished} onClick={() => setSession({ ...session, finished: true, action: 'finish[Lyon]', observation: '提交答案：里昂。任务终止；没有新增的检索观察。' })}>finish[Lyon]</Chip>
      <button type="button" onClick={() => setSession(initial)}>重置</button>
    </Controls>
    <div aria-live="polite" style={{ minHeight: 132 }}><p><strong>当前页：</strong>{page ?? '无'}　<strong>教学步骤：</strong>{stage}/3<br /><strong>最近调用：</strong>{action}<br /><strong>{finished ? '提交结果' : '观察'}：</strong>{observation}</p></div>
    <Feedback tone={finished ? 'good' : 'neutral'}>{feedback}</Feedback>
  </>;
}
