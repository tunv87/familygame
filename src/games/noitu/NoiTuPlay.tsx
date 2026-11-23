import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useT } from '../../i18n';
import { sfx } from '../../lib/sound';
import { Avatar } from '../../ui/components';
import { check, last, options, type Dict, type Side } from './logic';

export const HINTS = 3;

/** Seconds left until `deadline`, ticking; plays the countdown sound for the last 3 seconds. */
export function useCountdown(deadline: number | null, now: () => number, onZero: () => void) {
  const [left, setLeft] = useState(0);
  const fired = useRef<number | null>(null);
  const zero = useRef(onZero);
  zero.current = onZero;
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((deadline - now()) / 1000));
      setLeft((prev) => {
        if (s !== prev && s > 0 && s <= 3) sfx.tick();
        return s;
      });
      if (s === 0 && fired.current !== deadline) {
        fired.current = deadline;
        zero.current();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, now]);
  return left;
}

/** The word chain as chat bubbles: side 1 on the right, side 2 on the left. */
export function Chain({
  dict,
  chain,
  sideOf,
  avatars,
}: {
  dict: Dict;
  chain: readonly string[];
  /** who said word i (0 = the opening word) */
  sideOf: (i: number) => Side | 0;
  avatars: [string, string];
}) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [chain.length]);
  return (
    <ol className="nt-chain" ref={ref} data-testid="nt-chain">
      {chain.map((w, i) => {
        const side = sideOf(i);
        return (
          <li
            key={`${i}-${w}`}
            className={`nt-bubble ${side === 0 ? 'start' : side === 1 ? 'me' : 'them'}`}
            data-testid={`nt-word-${i}`}
          >
            {side !== 0 && <Avatar emoji={avatars[side - 1]} />}
            <span className="nt-text">
              <b>{w}</b>
              <small lang="en">{dict.gloss(w)}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Input for the player on turn: the first syllable is fixed, they type the second one.
 * Shows why a word is refused, lets them pick when tones are needed, gives hints.
 */
export function AnswerBox({
  dict,
  chain,
  enabled,
  hintsLeft,
  onHint,
  onAnswer,
  onGiveUp,
}: {
  dict: Dict;
  chain: readonly string[];
  enabled: boolean;
  hintsLeft: number;
  onHint: () => void;
  onAnswer: (word: string) => void;
  onGiveUp: () => void;
}) {
  const t = useT();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const prev = last(chain[chain.length - 1]);

  useEffect(() => {
    setText('');
    setError('');
    setChoices([]);
    if (enabled) inputRef.current?.focus({ preventScroll: true });
  }, [chain.length, enabled]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!enabled) return;
    const v = check(dict, chain, text);
    if (v.ok) {
      sfx.tap();
      onAnswer(v.word);
      return;
    }
    sfx.bad();
    setChoices(v.reason === 'choose' ? v.candidates : []);
    const typed = `${prev} ${text.trim().split(/\s+/).slice(-1)[0]}`;
    setError(
      v.reason === 'empty'
        ? ''
        : v.reason === 'choose'
          ? t('ntChoose')
          : v.reason === 'used'
            ? t('ntUsed', { w: typed })
            : v.reason === 'chain'
              ? t('ntChain', { w: prev })
              : t('ntUnknown', { w: typed }),
    );
  };

  const hint = () => {
    const opts = options(dict, chain);
    const easy = opts.filter((w) => dict.tier(w) === 1);
    const pick = (easy.length ? easy : opts)[
      Math.floor(Math.random() * (easy.length || opts.length))
    ];
    if (!pick) return;
    onHint();
    setText(pick.split(' ')[1]);
    setError('');
    setChoices([]);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <form className="nt-answer" onSubmit={submit} data-testid="nt-answer">
      <div className="nt-input-row">
        <span className="nt-prefix" data-testid="nt-prefix">
          {prev}
        </span>
        <input
          ref={inputRef}
          className="nt-input"
          data-testid="nt-input"
          value={text}
          disabled={!enabled}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
          placeholder={t('ntPlaceholder')}
          aria-label={t('ntPlaceholder')}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          maxLength={20}
        />
        <button className="btn nt-go" type="submit" disabled={!enabled} data-testid="nt-go">
          {t('ntGo')}
        </button>
      </div>
      <div className="nt-error" data-testid="nt-error" role="status">
        {error}
      </div>
      {choices.length > 0 && (
        <div className="nt-choices">
          {choices.map((w) => (
            <button
              key={w}
              type="button"
              className="btn secondary"
              data-testid="nt-choice"
              onClick={() => {
                sfx.tap();
                onAnswer(w);
              }}
            >
              {w}
            </button>
          ))}
        </div>
      )}
      <div className="players">
        <button
          type="button"
          className="btn secondary grow"
          onClick={hint}
          disabled={!enabled || hintsLeft <= 0}
          data-testid="nt-hint"
        >
          💡 {t('ntHint', { n: hintsLeft })}
        </button>
        <button
          type="button"
          className="btn secondary grow"
          onClick={onGiveUp}
          disabled={!enabled}
          data-testid="nt-giveup"
        >
          🏳️ {t('ntGiveUp')}
        </button>
      </div>
    </form>
  );
}

/** Round timer bar. */
export function TimerBar({ left, total }: { left: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className={`nt-timer ${left <= 5 ? 'low' : ''}`} data-testid="nt-timer">
      <div className="nt-timer-fill" style={{ width: `${pct}%` }} />
      <span>⏱️ {left}</span>
    </div>
  );
}
