import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FurtherLearning } from './FurtherLearning';
import { GlossaryProvider } from './Glossary';

function renderFurtherLearning() {
  return render(
    <GlossaryProvider>
      <FurtherLearning />
    </GlossaryProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('FurtherLearning', () => {
  it('asks for third-party consent before creating the first Bilibili player and destroys it on Escape', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderFurtherLearning();

    const playButtons = screen.getAllByRole('button', { name: /播放/ });
    expect(playButtons).toHaveLength(3);
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('dialog', { name: '连接第三方视频提示' })).not.toBeInTheDocument();

    await user.click(playButtons[0]);
    expect(screen.getByRole('dialog', { name: '连接第三方视频提示' })).toBeVisible();
    expect(document.querySelector('iframe')).toBeNull();

    await user.click(screen.getByRole('button', { name: '继续播放' }));
    expect(screen.getByTitle(/Bilibili/)).toBeVisible();
    expect(setItem.mock.calls.some(([key]) => String(key).includes('video-learning'))).toBe(false);

    await user.keyboard('{Escape}');
    expect(document.querySelector('iframe')).toBeNull();
    expect(playButtons[0]).toHaveFocus();
  });

  it('opens later videos directly for the current page session without persisting consent', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderFurtherLearning();

    const playButtons = screen.getAllByRole('button', { name: /播放/ });
    await user.click(playButtons[0]);
    await user.click(screen.getByRole('button', { name: '继续播放' }));
    await user.keyboard('{Escape}');
    await user.click(playButtons[1]);

    expect(screen.queryByRole('dialog', { name: '连接第三方视频提示' })).not.toBeInTheDocument();
    expect(screen.getByTitle(/Bilibili/)).toBeVisible();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('keeps Tab and Shift+Tab inside the consent dialog and restores the inert background on cancel', async () => {
    const user = userEvent.setup();
    const { container } = renderFurtherLearning();

    await user.click(screen.getAllByRole('button', { name: /播放/ })[0]);
    const continueButton = screen.getByRole('button', { name: '继续播放' });
    const cancelButton = screen.getByRole('button', { name: '取消' });

    expect(container).toHaveAttribute('inert');
    expect(continueButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(cancelButton).toHaveFocus();
    await user.tab();
    expect(continueButton).toHaveFocus();

    await user.click(cancelButton);
    expect(container).not.toHaveAttribute('inert');
    expect(screen.getAllByRole('button', { name: /播放/ })[0]).toHaveFocus();
  });

  it('keeps the player close control reachable in its portal modal', async () => {
    const user = userEvent.setup();
    const { container } = renderFurtherLearning();

    await user.click(screen.getAllByRole('button', { name: /播放/ })[0]);
    await user.click(screen.getByRole('button', { name: '继续播放' }));

    const player = screen.getByRole('dialog', { name: 'Bilibili 播放器' });
    const closeButton = screen.getByRole('button', { name: '关闭播放器' });
    const fallbackLink = screen.getByRole('link', { name: '打开 Bilibili 原页' });
    expect(player.parentElement).toHaveClass('further-modal-layer');
    expect(container).toHaveAttribute('inert');
    expect(closeButton).toHaveFocus();

    const playerFrame = screen.getByTitle(/Bilibili/);
    expect(playerFrame).toHaveAttribute('tabindex', '0');
    expect(Array.from(player.querySelectorAll('button, iframe, a[href]'))).toEqual([
      closeButton,
      playerFrame,
      fallbackLink,
    ]);
    fallbackLink.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(fallbackLink).toHaveFocus();
  });
});
