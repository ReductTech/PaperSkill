import { useEffect } from 'react';

export interface BiliCard {
  bvid: string;
  title?: string;
  cover?: string;
  duration?: string;
  views?: string;
}

function formatViews(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿播放';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万播放';
  return n + '播放';
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

let jsonpRequestSerial = 0;

export function useBiliVideos(
  bvids: string[],
  onLoad: (bvid: string, data: BiliCard | null) => void
) {
  const bvidKey = Array.from(
    new Set(bvids.filter((bvid) => bvid && bvid.startsWith('BV')))
  ).join('|');

  useEffect(() => {
    let cancelled = false;
    const real = bvidKey ? bvidKey.split('|') : [];
    if (real.length === 0) return;

    const callbackHost = window as unknown as Record<string, unknown>;
    const pending: Array<{ callbackName: string; script: HTMLScriptElement }> = [];

    real.forEach((bvid) => {
      const callbackName = `__paper_skill_bili_${Date.now()}_${++jsonpRequestSerial}`;
      const script = document.createElement('script');
      const dispose = () => {
        delete callbackHost[callbackName];
        script.remove();
      };

      callbackHost[callbackName] = (res: any) => {
        if (cancelled) return;
        dispose();
        if (!res || res.code !== 0 || !res.data) {
          onLoad(bvid, null);
          return;
        }
        const d = res.data;
        onLoad(bvid, {
          bvid,
          title: d.title,
          cover: d.pic ? d.pic.replace(/^http:/, 'https:') : undefined,
          duration: d.duration ? formatDuration(d.duration) : undefined,
          views: d.stat ? formatViews(d.stat.view) : undefined,
        });
      };
      script.src =
        'https://api.bilibili.com/x/web-interface/view?bvid=' +
        bvid +
        '&jsonp=jsonp&callback=' +
        callbackName;
      script.onerror = () => {
        if (cancelled) return;
        dispose();
        onLoad(bvid, null);
      };
      pending.push({ callbackName, script });
      document.body.appendChild(script);
    });

    return () => {
      cancelled = true;
      pending.forEach(({ callbackName, script }) => {
        callbackHost[callbackName] = () => undefined;
        script.remove();
        window.setTimeout(() => {
          delete callbackHost[callbackName];
        }, 60_000);
      });
    };
  }, [bvidKey, onLoad]);
}
