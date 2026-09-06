import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Feedback } from '../feedback/Feedback';
import { emitTelemetry, getTelemetryState } from '../telemetry';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export type QuestionType = 'choice' | 'multiple' | 'judgement' | 'fill' | 'short';

export interface QuestionOption {
  key?: ReactNode;
  value: string;
  label: ReactNode;
  /** Explanation shown when this incorrect option is selected. */
  wrongFeedback?: ReactNode;
  /** Explanation shown when this correct option is omitted from a multiple-choice answer. */
  missedFeedback?: ReactNode;
}

export interface QuestionCheckResult {
  ok: boolean;
  empty?: boolean;
  answer: string[];
  message?: ReactNode;
  tone?: 'correct' | 'wrong' | 'hint';
}

export interface ShortAnswerReview {
  ok: boolean;
  tone: 'correct' | 'wrong' | 'hint';
  message: ReactNode;
}

interface PersistedQuestionResult {
  ok: boolean;
  empty?: boolean;
  answer: string[];
  tone?: 'correct' | 'wrong' | 'hint';
  message?: string;
}

interface PersistedQuestionState {
  selected_values?: string[];
  answer_fields?: Array<{ value?: unknown }>;
  correct?: boolean | null;
  submitted?: boolean;
  result?: PersistedQuestionResult | null;
}

export interface QuestionProps {
  type?: QuestionType;
  title: ReactNode;
  options?: QuestionOption[];
  answer?: string | string[];
  multiple?: boolean;
  blanks?: Array<{ label?: ReactNode; placeholder?: string }>;
  rows?: number;
  typeLabel?: ReactNode;
  submitText?: ReactNode;
  feedback?: { initial?: ReactNode; empty?: ReactNode; correct?: ReactNode; wrong?: ReactNode; sample?: ReactNode };
  instant?: boolean;
  className?: string;
  onCheck?: (result: QuestionCheckResult) => void;
  /** 简答题的真实异步评阅服务；未提供时仅作本地提交，不冒充评阅。 */
  review?: (answers: string[]) => Promise<ShortAnswerReview>;
  /** Stable key used to restore the latest answer from telemetry SQLite. */
  persistenceKey?: string;
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function answerList(answer: string | string[] | undefined) {
  return (Array.isArray(answer) ? answer : answer === undefined ? [] : [answer]).map(normalize).filter(Boolean);
}

function persistableMessage(message: ReactNode) {
  return typeof message === 'string' || typeof message === 'number' ? String(message) : undefined;
}

function FillTitle({ title, blanks, fields, onChange }: { title: ReactNode; blanks: Array<{ label?: ReactNode; placeholder?: string }>; fields: string[]; onChange: (index: number, value: string) => void }) {
  const input = (index: number) => <input className="dl-inline-blank" type="text" value={fields[index] ?? ''} placeholder={blanks[index]?.placeholder ?? '填写答案'} aria-label={String(blanks[index]?.label ?? `第 ${index + 1} 个空`)} autoComplete="off" data-role="question-answer" onChange={(event) => onChange(index, event.target.value)} />;
  if (typeof title !== 'string') return <>{title}{input(0)}</>;
  const parts = title.split('____');
  if (parts.length === 1) return <>{title}{input(0)}</>;
  return <>{parts.map((part, index) => <Typography as="span" variant="inherit" tone="inherit" key={index}>{part}{index < parts.length - 1 && input(index)}</Typography>)}</>;
}

function inlineBlankCount(title: ReactNode) {
  if (typeof title !== 'string') return 1;
  return Math.max(1, title.split('____').length - 1);
}

function optionFeedback(
  options: QuestionOption[],
  selectedValues: string[],
  expectedValues: string[],
  multiple: boolean,
  fallback: ReactNode,
) {
  const selected = new Set(selectedValues.map(normalize));
  const expected = new Set(expectedValues);
  const incorrect = options.filter((option) => selected.has(normalize(option.value)) && !expected.has(normalize(option.value)));
  const missed = multiple ? options.filter((option) => expected.has(normalize(option.value)) && !selected.has(normalize(option.value))) : [];
  const optionKey = (option: QuestionOption) => String(option.key ?? String.fromCharCode(65 + options.indexOf(option)));
  const details = [
    ...incorrect.map((option) => ({ prefix: `误选 ${optionKey(option)}：`, message: option.wrongFeedback })),
    ...missed.map((option) => ({ prefix: `漏选 ${optionKey(option)}：`, message: option.missedFeedback })),
  ].filter((detail) => detail.message !== undefined && detail.message !== null && detail.message !== false && detail.message !== '');
  if (!details.length) return fallback;
  if (details.length === 1) return <><Typography as="strong" variant="inherit" tone="inherit">{details[0].prefix}</Typography>{details[0].message}</>;
  return <ul className="dl-question-feedback-list">{details.map((detail, index) => <Typography as="li" variant="bodySmall" tone="inherit" key={index}><Typography as="strong" variant="inherit" tone="inherit">{detail.prefix}</Typography>{detail.message}</Typography>)}</ul>;
}

function typeLabel(type: QuestionType, multiple: boolean) {
  if (type === 'choice') return multiple ? '多选题' : '单选题';
  if (type === 'judgement') return '判断题';
  if (type === 'fill') return '填空题';
  if (type === 'short') return '简答题';
  return '题目';
}

export function Question({
  type = 'choice',
  title,
  options = [],
  answer,
  multiple = type === 'multiple',
  blanks = [],
  rows = 5,
  typeLabel: label,
  submitText = '检查答案',
  feedback = {},
  instant = !multiple && (type === 'choice' || type === 'judgement'),
  className,
  onCheck,
  review,
  persistenceKey,
}: QuestionProps) {
  const generatedStateId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const normalizedType: QuestionType = type === 'multiple' ? 'choice' : type;
  const [selected, setSelected] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>(() => Array.from({ length: Math.max(1, blanks.length) }, () => ''));
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const expected = useMemo(() => answerList(answer), [answer]);
  const answerValues = normalizedType === 'choice' || normalizedType === 'judgement' ? selected : fields;
  const inlineBlanks = normalizedType === 'fill' ? inlineBlankCount(title) : 0;
  const stateKey = `question:${persistenceKey || generatedStateId}`;

  function emitAnswer(eventName: 'answer_select' | 'answer_submit' | 'answer_change' | 'question_state_restore', answers: string[], checked: QuestionCheckResult | null) {
    const selectedValues = normalizedType === 'choice' || normalizedType === 'judgement' ? answers : selected;
    const answerFields = normalizedType === 'fill' || normalizedType === 'short'
      ? answers.map((value) => ({ value, length: Array.from(value).length, empty: !value.trim() }))
      : fields.map((value) => ({ value, length: Array.from(value).length, empty: !value.trim() }));
    const persistedResult: PersistedQuestionResult | null = checked ? {
      ok: checked.ok,
      empty: checked.empty,
      answer: checked.answer,
      tone: checked.tone,
      message: persistableMessage(checked.message),
    } : null;
    emitTelemetry(eventName, rootRef.current, {
      state_key: stateKey,
      question_type: normalizedType,
      selected_values: selectedValues,
      answer_fields: answerFields,
      correct: checked?.ok ?? null,
      submitted: checked !== null,
      result: persistedResult,
      state: {
        selected_values: selectedValues,
        answer_fields: answerFields,
        correct: checked?.ok ?? null,
        submitted: checked !== null,
        result: persistedResult,
      },
    });
  }

  useEffect(() => {
    if (!stateKey) return;
    let active = true;
    void getTelemetryState<PersistedQuestionState>(stateKey).then(async (entry) => {
      if (!active || !entry?.state) return;
      const restoredSelected = Array.isArray(entry.state.selected_values) ? entry.state.selected_values.filter((value): value is string => typeof value === 'string') : [];
      const restoredFields = Array.isArray(entry.state.answer_fields) ? entry.state.answer_fields.map((field) => String(field?.value ?? '')) : [];
      if (restoredSelected.length) setSelected(restoredSelected);
      if (restoredFields.length) setFields(restoredFields);
      const restoredAnswers = restoredSelected.length ? restoredSelected : restoredFields;
      const wasSubmitted = entry.state.submitted ?? (entry.event_name === 'answer_submit' || (instant && entry.event_name === 'answer_select'));
      const storedResult = entry.state.result;
      if (wasSubmitted && storedResult) {
        const restoredResult: QuestionCheckResult = {
          ok: storedResult.ok === true,
          empty: storedResult.empty,
          answer: Array.isArray(storedResult.answer) ? storedResult.answer.map(String) : restoredAnswers,
          tone: storedResult.tone,
          message: storedResult.message ?? (storedResult.ok ? feedback.correct ?? '回答正确。' : optionFeedback(options, restoredAnswers, expected, multiple, feedback.wrong ?? '再检查一下。')),
        };
        setResult(restoredResult);
        onCheck?.(restoredResult);
        return;
      }

      const restoredEmpty = restoredAnswers.every((value) => !value.trim());
      if (wasSubmitted && normalizedType === 'short') {
        const submittedResult: QuestionCheckResult = { ok: false, empty: restoredEmpty, answer: restoredAnswers, tone: 'hint' };
        onCheck?.(submittedResult);
        if (!restoredEmpty && review) {
          setIsReviewing(true);
          try {
            const reviewed = await review(restoredAnswers);
            if (!active) return;
            const repairedResult: QuestionCheckResult = { ok: reviewed.ok, empty: false, answer: restoredAnswers, tone: reviewed.tone, message: reviewed.message };
            setResult(repairedResult);
            onCheck?.(repairedResult);
            emitAnswer('question_state_restore', restoredAnswers, repairedResult);
          } catch {
            if (!active) return;
            setResult({ ok: false, empty: false, answer: restoredAnswers, tone: 'wrong', message: '此前的评阅结果没有被旧版本保存，评阅服务目前也不可用。' });
          } finally {
            if (active) setIsReviewing(false);
          }
        }
        return;
      }

      const normalizedRestored = restoredAnswers.map(normalize);
      const locallyCorrect = multiple
          ? normalizedRestored.filter(Boolean).sort().join('|') === expected.slice().sort().join('|')
          : normalizedRestored.length === expected.length && normalizedRestored.every((value, index) => value === expected[index]);
      const restoredCorrect = entry.state.correct ?? (wasSubmitted ? locallyCorrect : null);
      if (wasSubmitted || restoredCorrect !== null) {
        const restoredResult: QuestionCheckResult = {
          ok: restoredCorrect === true,
          empty: restoredEmpty,
          answer: restoredAnswers,
          tone: restoredCorrect ? 'correct' : normalizedType === 'short' ? 'hint' : 'wrong',
          message: restoredCorrect ? feedback.correct ?? '回答正确。' : optionFeedback(options, restoredAnswers, expected, multiple, feedback.wrong ?? '再检查一下。'),
        };
        setResult(restoredResult);
        onCheck?.(restoredResult);
      }
    });
    return () => { active = false; };
  }, [stateKey]);

  async function check(candidateAnswers: string[] = answerValues) {
    const normalizedAnswers = candidateAnswers.map(normalize);
    const empty = normalizedAnswers.every((value) => !value);
    if (normalizedType === 'short' && review && !empty) {
      setIsReviewing(true);
      setResult({ ok: false, answer: candidateAnswers, tone: 'hint', message: '正在分析你的回答，请稍候。' });
      try {
        const reviewed = await review(candidateAnswers);
        const next: QuestionCheckResult = { ok: reviewed.ok, answer: candidateAnswers, tone: reviewed.tone, message: reviewed.message };
        setResult(next);
        onCheck?.(next);
        return next;
      } catch {
        const next: QuestionCheckResult = { ok: false, answer: candidateAnswers, tone: 'wrong', message: '评阅服务暂时不可用，请稍后重试。' };
        setResult(next);
        onCheck?.(next);
        return next;
      } finally {
        setIsReviewing(false);
      }
    }
    const ok = normalizedType === 'short'
      ? false
      : multiple
        ? normalizedAnswers.filter(Boolean).sort().join('|') === expected.slice().sort().join('|')
        : normalizedAnswers.length === expected.length && normalizedAnswers.every((value, index) => value === expected[index]);
    const tone = empty ? 'hint' : normalizedType === 'short' ? 'hint' : ok ? 'correct' : 'wrong';
    const message = empty
      ? feedback.empty ?? '请先完成作答，再检查答案。'
      : normalizedType === 'short'
        ? feedback.sample ?? '此简答题尚未配置评阅服务，不能作为已完成作答。'
        : ok ? feedback.correct ?? '回答正确。' : optionFeedback(options, candidateAnswers, expected, multiple, feedback.wrong ?? '再检查一下。');
    const next: QuestionCheckResult = {
      ok: !empty && ok,
      empty,
      answer: candidateAnswers,
      tone,
      message,
    };
    setResult(next);
    onCheck?.(next);
    return next;
  }

  async function choose(value: string) {
    const nextSelected = multiple
      ? selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
      : [value];
    setSelected(nextSelected);
    setResult(null);
    if (instant) {
      const checked = await check(nextSelected);
      emitAnswer('answer_select', nextSelected, checked);
    } else {
      emitAnswer('answer_select', nextSelected, null);
    }
  }

  async function submit() {
    const candidateAnswers = normalizedType === 'choice' || normalizedType === 'judgement' ? selected : fields;
    const checked = await check(candidateAnswers);
    emitAnswer('answer_submit', candidateAnswers, checked);
  }

  return (
    <section
      className={classNames('dl-question', `dl-question--${normalizedType}`, multiple && 'dl-question--multiple', className)}
      ref={rootRef}
      data-question-type={normalizedType}
      data-submit-mode={instant ? 'instant' : 'manual'}
      data-state-key={stateKey}
      data-telemetry-manual
      onBlurCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.matches('[data-role="question-answer"]') || result) return;
        if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.dl-question-submit')) return;
        emitAnswer('answer_change', answerValues, null);
      }}
    >
      <header className="dl-question-head">
        <Typography as="span" variant="label" tone="accent" className="dl-question-type">{label ?? typeLabel(normalizedType, multiple)}</Typography>
        <div className="dl-question-title-row">
          <Typography as="strong" variant="label" className="dl-question-stem">{normalizedType === 'fill' ? <FillTitle title={title} blanks={blanks.length ? blanks : [{ placeholder: '填写答案' }]} fields={fields} onChange={(index, value) => { setFields((current) => { const next = [...current]; next[index] = value; return next; }); setResult(null); }} /> : title}</Typography>
          {!instant && <button className="edu-btn edu-btn--primary dl-question-submit" type="button" disabled={isReviewing} aria-busy={isReviewing} onClick={() => void submit()}><Typography as="span" variant="inherit" tone="inherit">{isReviewing ? '正在分析' : submitText}</Typography></button>}
        </div>
      </header>

      {(normalizedType === 'choice' || normalizedType === 'judgement') && (
        <div className="dl-question-options" role={multiple ? 'group' : 'radiogroup'}>
          {options.map((option, index) => {
            const value = option.value;
            const isSelected = selected.includes(value);
            const expectedValue = expected.includes(normalize(value));
            const markedCorrect = Boolean(result && result.ok && expectedValue);
            const markedWrong = Boolean(result && !result.ok && isSelected && !expectedValue);
            return (
              <button
                className={classNames('dl-question-option', isSelected && 'is-selected', markedCorrect && 'is-correct', markedWrong && 'is-wrong')}
                key={`${value}-${index}`}
                type="button"
                data-index={index}
                data-value={value}
                aria-pressed={isSelected}
                onClick={() => void choose(value)}
              >
                <Typography as="span" variant="code" tone="inherit" className="dl-option-key">{option.key ?? String.fromCharCode(65 + index)}</Typography>
                <Typography as="span" variant="label" tone="inherit" className="dl-option-body">{option.label}</Typography>
              </button>
            );
          })}
        </div>
      )}

      {normalizedType === 'fill' && blanks.length > inlineBlanks && <div className="dl-question-fields">{blanks.slice(inlineBlanks).map((blank, index) => <label className="dl-question-field" key={index}><Typography as="span" variant="label" tone="accent">{blank.label}</Typography><input type="text" value={fields[index + inlineBlanks] ?? ''} placeholder={blank.placeholder} autoComplete="off" data-role="question-answer" onChange={(event) => { setFields((current) => { const next = [...current]; next[index + inlineBlanks] = event.target.value; return next; }); setResult(null); }} /></label>)}</div>}

      {normalizedType === 'short' && (
        <div className="dl-question-fields">
          <label className="dl-question-field">
            <textarea
              rows={rows}
              value={fields[0] ?? ''}
              data-role="question-answer"
              onChange={(event) => {
                setFields([event.target.value]);
                setResult(null);
              }}
            />
          </label>
        </div>
      )}

      <Feedback
        status={result?.tone ?? 'info'}
        message={result?.message ?? feedback.initial}
        streaming={normalizedType === 'short' && Boolean(result && !result.empty)}
        className="dl-question-feedback"
        hidden={!result && feedback.initial === undefined}
      />
    </section>
  );
}
