import React from 'react';
import {MirScene} from './mir-scenes';
import type {WidgetProps} from './registry';
export function MirAnalogy({chapterId}:WidgetProps){return <MirScene scene={Number(chapterId.replace('chap-',''))||1}/>;}
