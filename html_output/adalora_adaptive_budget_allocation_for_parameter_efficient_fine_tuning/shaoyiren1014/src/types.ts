import type {robotStory} from './data/robotStory';
export type TutorialModule={kind:'module';componentId:'workshop'|'robot';interaction:'direct'|'synchronized'};
export type TutorialChapter={kind:'chapter';id:string;story:(typeof robotStory)[number];modules:TutorialModule[]};
