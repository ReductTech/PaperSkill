import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { DEFAULT_CHAPTER_UNLOCK_KEY } from './hooks/useChapterUnlock';

const PROGRESS_KEY = 'mineru2.5-pro.tutorial-progress.v2';
const ALL_CHAPTER_IDS = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'];

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  window.localStorage.clear();
});

describe('App chapter integration', () => {
  it('starts with one dedicated chapter experience and no legacy experiment shells', () => {
    const { container } = render(<App />);

    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(1);
    expect(screen.queryByText(/实验 1\.1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/一分钟自检/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /补长尾页/ })).toBeVisible();
    expect(container.querySelector('.step-concept-visual')).not.toBeInTheDocument();
    expect(container.querySelector('.learning-lab')).not.toBeInTheDocument();
    expect(container.querySelector('.real-cases')).not.toBeInTheDocument();
    expect(container.querySelector('.checkpoint-card')).not.toBeInTheDocument();
    expect(container.querySelector('.paper-figure-card')).not.toBeInTheDocument();
  });

  it('keeps the real original and output crops inside the document primer', () => {
    render(<App />);

    expect(screen.getByText('真实 PDF 原页')).toBeVisible();
    expect(screen.getByText('结构化输出 A')).toBeVisible();
    expect(screen.getByText('结构化输出 B')).toBeVisible();
  });

  it('shows six-chapter completion rather than legacy experiment progress', () => {
    render(<App />);

    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
    expect(screen.queryByLabelText(/已操作 .*个实验/)).not.toBeInTheDocument();
    expect(screen.queryByText(/极速模式|独立视频模式/)).not.toBeInTheDocument();
  });

  it('records chapter completion only after the main action and then unlocks the next experience', async () => {
    const user = userEvent.setup();
    render(<App />);

    const next = screen.getByRole('button', { name: /完成并解锁：挑选数据/ });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '继续普通页' }));
    expect(next).toBeDisabled();
    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '补长尾页' }));
    expect(next).toBeEnabled();
    expect(screen.getByLabelText('已完成 1 章，共 6 章')).toBeVisible();
    expect(window.location.hash).toBe('#step-1/data-bias/tail');
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? '[]');
      expect(stored).toContain('chapter:step-1');
      expect(stored).toContain('data-bias');
    });

    await user.click(next);
    expect(await screen.findAllByTestId('chapter-experience')).toHaveLength(2);
  });

  it('restores a secondary component state by componentId when its chapter was saved as unlocked', async () => {
    window.localStorage.setItem(DEFAULT_CHAPTER_UNLOCK_KEY, JSON.stringify({
      version: 1,
      unlockedIds: ['step-1', 'step-2'],
    }));
    window.history.replaceState(null, '', '/#step-2/element-ddas/formula');

    render(<App />);

    expect(await screen.findByText('正在放大：公式')).toBeVisible();
    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(2);
  });

  it('does not restore a module when the hash step and module belong to different chapters', () => {
    window.localStorage.setItem(DEFAULT_CHAPTER_UNLOCK_KEY, JSON.stringify({
      version: 1,
      unlockedIds: ['step-1', 'step-2'],
    }));
    window.history.replaceState(null, '', '/#step-1/element-ddas/formula');

    render(<App />);

    expect(screen.getByTestId('figure-3-canvas')).toHaveAttribute('data-view', 'cluster');
    expect(screen.queryByText('正在放大：公式')).not.toBeInTheDocument();
  });

  it('does not render or bypass a chapter targeted by a locked hash', () => {
    window.history.replaceState(null, '', '/#step-3/cmcv-router/medium');

    render(<App />);

    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(1);
    expect(screen.getByText('第 2 步 · 尚未解锁')).toBeVisible();
    expect(screen.queryByLabelText('CMCV 样本分流挑战')).not.toBeInTheDocument();
  });

  it('does not let a locked-chapter hash mutate an earlier unlocked experience', () => {
    window.history.replaceState(null, '', '/#step-3/data-bias/tail');

    render(<App />);

    expect(screen.getByRole('button', { name: '补长尾页' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('第 2 步 · 尚未解锁')).toBeVisible();
  });

  it('does not let a locked-chapter hash mutate the document primer', () => {
    window.history.replaceState(null, '', '/#step-3/document-primer/formula');

    const { container } = render(<App />);

    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'text');
    expect(screen.getByText('第 2 步 · 尚未解锁')).toBeVisible();
  });

  it('restores the document primer when both hash step and module identify it', () => {
    window.history.replaceState(null, '', '/#document-primer/document-primer/formula');

    const { container } = render(<App />);

    expect(container.querySelector('[data-module-id="document-primer"]')).toHaveAttribute('data-region', 'formula');
  });

  it('does not mount the legacy standalone video task when every chapter is unlocked', () => {
    window.localStorage.setItem(DEFAULT_CHAPTER_UNLOCK_KEY, JSON.stringify({
      version: 1,
      unlockedIds: ALL_CHAPTER_IDS,
    }));

    const { container } = render(<App />);

    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(6);
    expect(container.querySelector('.video-learning-task')).not.toBeInTheDocument();
    expect(container.querySelector('.video-learning-progress')).not.toBeInTheDocument();
    expect(screen.queryAllByText(/一分钟自检/)).toHaveLength(0);
  });

  it('clears meaningful completion tokens when the learning path is reset', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(['data-bias', 'chapter:step-1']));

    render(<App />);

    const reset = screen.getByRole('button', { name: '重置学习路径' });
    expect(reset).toBeEnabled();
    await user.click(reset);

    expect(screen.getByLabelText('已完成 0 章，共 6 章')).toBeVisible();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? '[]')).toEqual([]);
    });
  });

  it('ignores a malformed percent-encoded hash', () => {
    window.history.replaceState(null, '', '/#%');

    expect(() => render(<App />)).not.toThrow();
    expect(screen.getAllByTestId('chapter-experience')).toHaveLength(1);
  });

  it('shows the OmniDocBench allowed claim and forbidden inference beside the primer crops', () => {
    render(<App />);

    expect(screen.getByText('该论文页展示了文档内容边界和结构化输出规范会影响评测与训练数据。')).toBeVisible();
    expect(screen.getByText(/不能将 OmniDocBench 原图解读为 MinerU2\.5-Pro 的性能证据/)).toBeVisible();
    expect(screen.getByText(/不能将截图或原图用作 296 页 Hard 训练隔离的独立证明/)).toBeVisible();
  });

  it('exposes the three primer crops as one keyboard-scrollable comparison region', () => {
    render(<App />);

    const comparison = screen.getByRole('region', {
      name: '真实 PDF 与结构化输出对照，可横向滚动',
    });
    expect(comparison).toHaveAttribute('tabindex', '0');
    expect(comparison.querySelectorAll('.paper-media')).toHaveLength(3);
  });
});
