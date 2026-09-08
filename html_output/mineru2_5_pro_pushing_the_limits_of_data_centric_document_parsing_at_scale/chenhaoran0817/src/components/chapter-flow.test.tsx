import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { tutorial } from '../data/tutorial';
import chapterFlowCss from '../styles/chapter-flow.css?raw';
import { AnalogyVisual } from './AnalogyVisual';
import { ChapterIntro } from './ChapterIntro';
import { ChapterLoader } from './ChapterLoader';
import { ChapterSummary } from './ChapterSummary';
import { GradingTeaser } from './GradingTeaser';
import { JourneyMap } from './JourneyMap';
import { GlossaryProvider } from './Glossary';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlossaryProvider>{children}</GlossaryProvider>
);

describe('ChapterIntro (引入节)', () => {
  it('pairs the bridge card with the analogy card and its self-built scene', () => {
    const chapter = tutorial.chapters[0];
    const { container } = render(
      <ChapterIntro bridge={chapter.bridge} analogy={chapter.analogy} />,
      { wrapper },
    );

    expect(screen.getByText('本节作用')).toBeVisible();
    expect(screen.getByText(chapter.bridge)).toBeVisible();
    expect(screen.getByText('生活类比')).toBeVisible();
    const visual = container.querySelector('.analogy-visual');
    expect(visual).toHaveAttribute('data-visual', 'grocery-budget');
    expect(visual).toHaveAttribute('role', 'img');
    expect(visual).toHaveAttribute('aria-label', expect.stringContaining('菜篮'));
  });

  it('lays the analogy out as a full-width band with the scene pinned to the left', () => {
    expect(chapterFlowCss).toMatch(/\.chapter-intro\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(chapterFlowCss).toMatch(/\.analogy-card\s*\{[^}]*grid-template-columns:\s*minmax\(\d+px,\s*\d+px\)\s+minmax\(0,\s*1fr\)/s);
  });

  it('lets chapter 1 learners stuff extra cabbages while the long-tail count stays at zero', async () => {
    const user = userEvent.setup();
    const chapter = tutorial.chapters[0];
    render(<ChapterIntro bridge={chapter.bridge} analogy={chapter.analogy} />, { wrapper });

    expect(chapter.analogy.interaction).toBe('add-cabbage');
    expect(screen.getByTestId('cabbage-count')).toHaveTextContent('4');
    expect(screen.getByTestId('longtail-count')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: '再装一颗白菜' }));
    expect(screen.getByTestId('cabbage-count')).toHaveTextContent('5');
    expect(screen.getByTestId('longtail-count')).toHaveTextContent('0');
  });

  it('lets chapter 3 learners flip on the same-teacher switch and correlate both wrong answers', async () => {
    const user = userEvent.setup();
    const chapter = tutorial.chapters[2];
    const { container } = render(<ChapterIntro bridge={chapter.bridge} analogy={chapter.analogy} />, { wrapper });

    expect(chapter.analogy.interaction).toBe('same-teacher');
    const toggle = screen.getByRole('button', { name: /同一个老师/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('.analogy-visual [data-correlated="true"]')).toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.analogy-visual [data-correlated="true"]')).not.toBeNull();
  });

  it('lets chapter 5 learners click through the three exam-prep steps in order', async () => {
    const user = userEvent.setup();
    const chapter = tutorial.chapters[4];
    const { container } = render(<ChapterIntro bridge={chapter.bridge} analogy={chapter.analogy} />, { wrapper });

    expect(chapter.analogy.interaction).toBe('exam-steps');
    const group = screen.getByRole('group', { name: '备考三步' });
    await user.click(within(group).getByRole('button', { name: /错题本/ }));
    expect(container.querySelector('.analogy-visual [data-step-active="2"]')).not.toBeNull();
    await user.click(within(group).getByRole('button', { name: /模拟考/ }));
    expect(container.querySelector('.analogy-visual [data-step-active="3"]')).not.toBeNull();
    expect(container.querySelector('.analogy-visual [data-step-active="2"]')).toBeNull();
  });
});

describe('AnalogyVisual', () => {
  it('gives every chapter a distinct labelled scene', () => {
    const visuals = tutorial.chapters.map((chapter) => chapter.analogy.visual);
    expect(new Set(visuals).size).toBe(6);
    for (const visual of visuals) {
      const { container, unmount } = render(<AnalogyVisual visual={visual} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 244 130');
      expect(svg?.getAttribute('aria-label')?.length).toBeGreaterThan(10);
      unmount();
    }
  });
});

describe('ChapterSummary (总结节)', () => {
  it('renders exactly three takeaways and the chapter checkpoint', async () => {
    const user = userEvent.setup();
    const chapter = tutorial.chapters[2];
    const { container } = render(
      <ChapterSummary takeaways={chapter.takeaways} checkpoint={chapter.checkpoint} />,
      { wrapper },
    );

    expect(container.querySelectorAll('.takeaway-card')).toHaveLength(3);
    expect(screen.getByText('本章要点')).toBeVisible();
    const checkpoint = screen.getByText('一分钟自检 · 不计分');
    await user.click(checkpoint);
    const group = screen.getByRole('group', { name: chapter.checkpoint.question });
    await user.click(within(group).getByRole('button', { name: 'Medium' }));
    expect(screen.getByRole('status')).toHaveTextContent('判断正确');
  });
});

describe('ChapterLoader', () => {
  it('shows the hint and reveals the next chapter on click', async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    render(<ChapterLoader hint="本章结束 · 继续探索" step={3} label="没有 GT，怎么判断样本难度？" onReveal={onReveal} />);

    expect(screen.getByText('本章结束 · 继续探索')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /没有 GT，怎么判断样本难度/ }));
    expect(onReveal).toHaveBeenCalledTimes(1);
  });
});

describe('JourneyMap', () => {
  it('marks done, open, frontier and upcoming nodes from the reveal frontier', () => {
    const { container } = render(
      <JourneyMap
        chapters={tutorial.chapters}
        maxRevealed={1}
        completed={(chapterId) => chapterId === 'step-1'}
        onJump={() => {}}
      />,
    );

    const nodes = Array.from(container.querySelectorAll('.journey-node'));
    expect(nodes.map((node) => node.getAttribute('data-state'))).toEqual([
      'done', 'open', 'frontier', 'upcoming', 'upcoming', 'upcoming',
    ]);
    expect(screen.getByRole('button', { name: '复习第 1 章：发现瓶颈' })).toHaveTextContent('✓');
    expect(screen.getByRole('button', { name: '揭示并进入第 3 章：判断难度' })).toHaveAttribute('aria-current', 'step');
  });

  it('jumps via the node callback', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(
      <JourneyMap chapters={tutorial.chapters} maxRevealed={0} completed={() => false} onJump={onJump} />,
    );

    await user.click(screen.getByRole('button', { name: '直接跳到第 5 章：组织训练' }));
    expect(onJump).toHaveBeenCalledWith(4);
  });
});

describe('GradingTeaser', () => {
  it('drops the strict judge on merged predictions while MGAM stays at 100', async () => {
    const user = userEvent.setup();
    const { container } = render(<GradingTeaser />);

    expect(container.querySelectorAll('.gt-block')).toHaveLength(3);
    expect(container.querySelectorAll('.pred-block')).toHaveLength(3);
    expect(screen.getAllByText('100 分')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: '合并 · 1 块' }));

    expect(container.querySelectorAll('.gt-block')).toHaveLength(3);
    expect(container.querySelectorAll('.pred-block')).toHaveLength(1);
    expect(screen.getByText('33 分')).toBeVisible();
    expect(screen.getByText('100 分')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('严格匹配就只剩 33 分');
  });

  it('keeps the teaser self-built and out of the module registry', () => {
    const { container } = render(<GradingTeaser />);

    expect(screen.getByText(/教学示意/)).toBeVisible();
    expect(chapterFlowCss).toMatch(/\.grading-teaser__desk\s*\{[^}]*grid-template-columns/s);
    expect(container.querySelector('.grading-teaser')).not.toHaveAttribute('data-testid', 'chapter-experience');
  });
});
