import type { TutorialCardRenderProps } from 'tourkit/player';

/**
 * The onboarding popover, drawn the way the driver.js tour drew it: close
 * button in the corner, title and description, then "Skip tour", the step
 * counter and Previous / Next along the footer, with an arrow at the control.
 * Tourkit positions it and supplies the step and its navigation.
 */
export function TourCard({ card }: { card: TutorialCardRenderProps }) {
  return (
    <div className="rcv-tour-popover">
      <span className="rcv-tour-arrow" aria-hidden />
      <button
        type="button"
        className="rcv-tour-close"
        aria-label={card.labels.stop}
        title={card.labels.stop}
        onClick={card.stop}
      >
        ×
      </button>
      {card.suspended ? null : (
        <>
          <header className="rcv-tour-title">{card.title}</header>
          <div className="rcv-tour-description">{card.body}</div>
        </>
      )}
      {card.notice ? <div className="rcv-tour-notice">{card.notice}</div> : null}
      <footer className="rcv-tour-footer">
        <button type="button" className="rcv-tour-skip" onClick={card.stop}>
          {card.labels.skip}
        </button>
        {card.progress ? <span className="rcv-tour-progress">{card.progress}</span> : null}
        <span className="rcv-tour-navigation">
          <button
            type="button"
            className="rcv-tour-previous"
            disabled={!card.canGoPrevious}
            onClick={card.previous}
          >
            {card.labels.previous}
          </button>
          <button
            type="button"
            className="rcv-tour-next"
            disabled={!card.canGoNext}
            onClick={card.next}
          >
            {card.isFinish ? card.labels.finish : card.labels.next}
          </button>
        </span>
      </footer>
    </div>
  );
}
