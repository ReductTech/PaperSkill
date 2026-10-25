import React from 'react';
import type {WidgetProps} from './registry';
import {ChapterLab} from './chapter-labs';
import {SearchLab} from './search-lab';
export {PaperHero} from './paper-hero';
export {PaperCutAnalogy} from './paper-analogy';
export const SegAgentLab:React.FC<WidgetProps & {mode?:string}>=({mode='ch1-contour',...props})=>mode==='ch8-search'?<SearchLab {...props}/>:<ChapterLab {...props} mode={mode==='ch8-stop'?'ch9-datasets':mode}/>;
export default SegAgentLab;
