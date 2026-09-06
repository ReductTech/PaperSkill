import type { CSSProperties } from 'react';
import type { WidgetProps } from './registry';
import { useSceneVisibility } from './use-scene-visibility';

export function MemoryHero({ moduleId }: WidgetProps) {
  const isOld = moduleId === 'old';
  const cells = Array.from({ length: 8 });
  const rootRef = useSceneVisibility<HTMLDivElement>();

  return (
    <div
      className={`memory-hero${isOld ? ' is-old' : ' is-new'}`}
      ref={rootRef}
      role="img"
      aria-label={
        isOld
          ? '标准全注意力保留参考前缀和全部输出历史，缓存位置为 Lm 加 T'
          : 'R-SWA 保留参考前缀和最近 n 个输出，缓存位置上界为 Lm 加 n'
      }
    >
      <div className="mh-kicker">活跃 KV 位置</div>
      <div className="mh-track" aria-hidden="true">
        <span className="mh-prefix">P</span>
        <span className="mh-plus">+</span>
        <div className="mh-history">
          {cells.map((_, index) => {
            const quiet = !isOld && index < 4;
            return (
              <span
                className={`mh-cell${quiet ? ' is-quiet' : ''}`}
                key={index}
                style={{ '--cell-index': index } as CSSProperties}
              />
            );
          })}
          {!isOld ? <span className="mh-window-outline" /> : null}
        </div>
      </div>
      <div className="mh-legend">
        <span>参考前缀：常驻</span>
        <span>{isOld ? '输出历史：全部保留' : '输出历史：仅最近 n 个'}</span>
      </div>
      <div className="mh-equation">
        <span>缓存位置</span>
        <strong>
          {isOld ? (
            <>L<sub>m</sub> + T</>
          ) : (
            <>L<sub>m</sub> + n</>
          )}
        </strong>
      </div>
    </div>
  );
}

export default MemoryHero;
