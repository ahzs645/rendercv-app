import { act, cleanup, render, screen } from '@testing-library/react';
import { preferencesStore } from '@rendercv/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingTour } from './OnboardingTour';
import { TourCard } from './TourCard';
import { onboardingTour } from './tour-state';
import type { TutorialCardRenderProps } from 'tourkit/player';

vi.mock('./OnboardingTourRun', () => ({
  default: () => {
    throw new ReferenceError('React is not defined');
  }
}));

const props = {
  isMobile: false,
  mobileSidebarOpen: false,
  mobilePane: 'editor' as const,
  onOpenMobileSidebar: () => {},
  onMobilePaneChange: () => {}
};

afterEach(cleanup);

describe('OnboardingTour', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('keeps the workspace up and does not finish onboarding when the player throws', async () => {
    render(
      <main>
        <p>Workspace</p>
        <OnboardingTour {...props} />
      </main>
    );
    await act(async () => {
      onboardingTour.start();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(screen.getByText('Workspace')).toBeTruthy();
    expect(onboardingTour.getSnapshot().isRunning).toBe(false);
    expect(preferencesStore.getSnapshot().onboardingCompletedAt).toBeFalsy();
  });
});

describe('TourCard', () => {
  const labels = {
    errorTitle: 'Tour paused',
    previous: 'Previous',
    next: 'Next',
    finish: 'Done',
    skip: 'Skip tour',
    skipStep: 'Skip step',
    stop: 'Close tour'
  } as TutorialCardRenderProps['labels'];
  const card = (overrides: Partial<TutorialCardRenderProps>) =>
    ({
      title: 'Editor',
      body: 'Edit here.',
      progress: '2 of 7',
      labels,
      canGoNext: true,
      canGoPrevious: true,
      isFinish: false,
      suspended: false,
      notice: null,
      error: null,
      next: () => {},
      previous: () => {},
      stop: () => {},
      ...overrides
    }) as TutorialCardRenderProps;

  it('shows the step with its navigation', () => {
    render(<TourCard card={card({})} />);
    expect(screen.getByText('Editor')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });

  it('swaps in the recovery when a step could not be shown', () => {
    const recover = vi.fn();
    render(
      <TourCard
        card={card({
          error: { kind: 'anchor', message: 'internal', help: 'Not on screen.', recoverLabel: 'Try again', recover }
        })}
      />
    );
    expect(screen.getByText('Tour paused')).toBeTruthy();
    expect(screen.getByText('Not on screen.')).toBeTruthy();
    expect(screen.queryByText('internal')).toBeNull();
    expect(screen.queryByText('Editor')).toBeNull();
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(recover).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Skip step' })).toBeTruthy();
  });
});
