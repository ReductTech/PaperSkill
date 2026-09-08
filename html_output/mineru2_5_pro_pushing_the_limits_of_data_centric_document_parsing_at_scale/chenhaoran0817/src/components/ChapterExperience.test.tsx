import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { tutorial } from '../data/tutorial';
import { chapterExperienceRegistry } from '../experiences/registry';
import { ChapterEvidence } from './ChapterEvidence';
import { ChapterExperience } from './ChapterExperience';
import { GlossaryProvider } from './Glossary';

describe('ChapterExperience', () => {
  it('registers one dedicated experience for each of the six tutorial steps', () => {
    expect(Object.keys(chapterExperienceRegistry)).toEqual([
      'step-1',
      'step-2',
      'step-3',
      'step-4',
      'step-5',
      'step-6',
    ]);
  });

  it('restores and reports the stable componentId without adding a repeated module shell', async () => {
    const user = userEvent.setup();
    const step = tutorial.chapters[1];
    const onStateChange = vi.fn();

    render(
      <ChapterExperience
        stepId={step.id}
        modules={step.modules}
        restoredModuleState={{ moduleId: 'element-ddas', state: 'formula' }}
        onInteract={vi.fn()}
        onStateChange={onStateChange}
        onComplete={vi.fn()}
      />,
      { wrapper: GlossaryProvider },
    );

    expect(await screen.findByText('正在放大：公式')).toBeVisible();
    expect(screen.queryByText(step.modules[1].title)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '查看表格元素' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ moduleId: 'element-ddas', state: 'table' });
    expect(onStateChange).not.toHaveBeenCalledWith({ moduleId: '2.2', state: 'table' });
  });

  it('rejects an unknown step instead of silently selecting another experience', () => {
    const { container } = render(
      <ChapterExperience
        stepId="step-7"
        modules={[]}
        onInteract={vi.fn()}
        onStateChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ChapterEvidence', () => {
  it('keeps the chapter evidence in one disclosure that starts closed', () => {
    const { container } = render(
      <ChapterEvidence
        title="本章证据"
        items={[{
          kind: 'paper',
          label: '论文数字',
          text: '主文报告了这一结果。',
          sourceLabel: '论文 §3',
          href: 'https://example.com/paper',
        }]}
      />,
    );

    const disclosure = container.querySelector('details');
    expect(disclosure).not.toHaveAttribute('open');
    expect(screen.getByText('本章证据')).toBeVisible();
    expect(container.querySelectorAll('details')).toHaveLength(1);
  });
});
