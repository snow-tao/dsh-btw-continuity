import React, { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, LoaderCircle, MessageCircle, Send, Square, Trash2, X } from 'lucide-react'
import { AnswerMarkdown } from './answer-markdown'
import type { Bubble, BubbleStore } from './bubbles'
import type { BtwTranslate } from '../locales'

export function BubbleView({ item, close, clear, t, collapsed, onToggleCollapse }: {
  item: Bubble
  close: () => void
  clear?: () => Promise<void>
  t: BtwTranslate
  collapsed: boolean
  onToggleCollapse: () => void
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState('')
  const busy = item.phase === 'answering' || item.phase === 'closing'
  const labels = useMemo(() => ({
    code: { copyLabel: t('action.copyCode'), copiedLabel: t('action.copiedCode') },
    footnotes: t('bubble.footnotes'),
  }), [t])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.answer)
      setCopied(true)
      setCopyError(false)
    } catch { setCopyError(true) }
  }
  const clearHistory = async () => {
    if (!clear || clearing) return
    setClearing(true)
    setClearError('')
    try { await clear() }
    catch (error) { setClearError(error instanceof Error ? error.message : String(error)) }
    finally { setClearing(false) }
  }
  const stopOrCloseTitle = item.closeFailed
    ? t('action.retryClose')
    : t(item.phase === 'answering' ? 'action.stop' : 'action.close')
  return <article className="btw-bubble" data-btw-phase={item.phase} aria-label={t('bubble.label')}>
    <div className="btw-header">
      <span className="btw-symbol"><MessageCircle size={16} /></span>
      <span className="btw-question">{item.question}</span>
      <div className="btw-actions">
        {clear && <button type="button" title={t('action.clear')} aria-label={t('action.clear')} disabled={clearing || item.phase === 'closing'} onClick={() => { void clearHistory() }}>{clearing ? <LoaderCircle size={16} className="btw-spinner" /> : <Trash2 size={16} />}</button>}
        {item.answer && <button type="button" title={t(copied ? 'action.copied' : 'action.copy')} aria-label={t('action.copy')} onClick={() => { void copy() }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>}
        <button type="button" title={t(collapsed ? 'action.expand' : 'action.collapse')} aria-label={t(collapsed ? 'action.expand' : 'action.collapse')} aria-expanded={!collapsed} onClick={onToggleCollapse}>{collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
        <button
          type="button"
          className={item.phase === 'answering' ? 'btw-action-stop' : undefined}
          title={stopOrCloseTitle}
          aria-label={stopOrCloseTitle}
          disabled={item.phase === 'closing'}
          onClick={close}
        >
          {item.phase === 'answering' ? <Square size={14} /> : <X size={16} />}
        </button>
      </div>
    </div>
    {!collapsed && item.reference && <details className="btw-reference"><summary>{t('selection.reference')}</summary><blockquote>{item.reference}</blockquote></details>}
    {busy && <div className="btw-status" role="status"><LoaderCircle size={14} className="btw-spinner" />{t(item.phase === 'closing' ? 'status.closing' : 'status.answering')}</div>}
    {!collapsed && item.answer && <div className="btw-answer"><AnswerMarkdown text={item.answer} labels={labels} imageLabel={t('bubble.image')} /></div>}
    {item.error && <p className="btw-error" role="alert">{item.closeFailed ? t('error.close', { detail: item.error }) : item.error}</p>}
    {copyError && <p className="btw-error" role="alert">{t('error.copy')}</p>}
    {clearError && <p className="btw-error" role="alert">{clearError}</p>}
  </article>
}

function ConversationTurn({ item, t, labels }: {
  item: Bubble
  t: BtwTranslate
  labels: { code: { copyLabel: string; copiedLabel: string }; footnotes: string }
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.answer)
      setCopied(true)
      setCopyError(false)
    } catch { setCopyError(true) }
  }
  return <section className="btw-turn" data-btw-turn-phase={item.phase}>
    <div className="btw-turn-question">{item.question}</div>
    {item.reference && <details className="btw-reference"><summary>{t('selection.reference')}</summary><blockquote>{item.reference}</blockquote></details>}
    {item.phase === 'answering' && <div className="btw-status" role="status"><LoaderCircle size={14} className="btw-spinner" />{t('status.answering')}</div>}
    {item.answer && <div className="btw-answer"><AnswerMarkdown text={item.answer} labels={labels} imageLabel={t('bubble.image')} /></div>}
    {item.answer && <div className="btw-turn-actions"><button type="button" title={t(copied ? 'action.copied' : 'action.copy')} aria-label={t('action.copy')} onClick={() => { void copy() }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>}
    {item.error && <p className="btw-error" role="alert">{item.closeFailed ? t('error.close', { detail: item.error }) : item.error}</p>}
    {copyError && <p className="btw-error" role="alert">{t('error.copy')}</p>}
  </section>
}

function ConversationView({ items, collapsed, onToggleCollapse, close, clear, ask, t }: {
  items: readonly Bubble[]
  collapsed: boolean
  onToggleCollapse: () => void
  close: () => void
  clear: () => Promise<void>
  ask: (question: string) => Promise<void>
  t: BtwTranslate
}): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const answering = items.some(item => item.phase === 'answering')
  const closing = items.some(item => item.phase === 'closing')
  const busy = answering || closing || sending
  const closeFailed = items.some(item => item.closeFailed)
  const labels = useMemo(() => ({
    code: { copyLabel: t('action.copyCode'), copiedLabel: t('action.copiedCode') },
    footnotes: t('bubble.footnotes'),
  }), [t])
  useLayoutEffect(() => {
    const composer = composerRef.current
    if (!composer) return
    const style = window.getComputedStyle(composer)
    const fontSize = Number.parseFloat(style.fontSize) || 13
    const rawLineHeight = Number.parseFloat(style.lineHeight)
    const lineHeight = style.lineHeight.endsWith('px') ? rawLineHeight : (rawLineHeight || 1.5) * fontSize
    const vertical = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
      .reduce((total, key) => total + (Number.parseFloat(style[key as keyof CSSStyleDeclaration] as string) || 0), 0)
    const singleLineHeight = Math.max(38, lineHeight + vertical)
    const maxHeight = lineHeight * 4 + vertical
    composer.style.height = '0px'
    const contentHeight = composer.scrollHeight
    composer.style.height = `${Math.min(Math.max(contentHeight, singleLineHeight), maxHeight)}px`
    composer.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
  }, [draft, collapsed])
  const submit = async () => {
    const question = draft.trim()
    if (!question) { setError(t('error.empty')); return }
    if (busy) return
    setSending(true)
    setError('')
    try {
      await ask(question)
      setDraft('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setSending(false) }
  }
  const clearHistory = async () => {
    if (clearing) return
    setClearing(true)
    setError('')
    try { await clear() }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setClearing(false) }
  }
  const phase = closing ? 'closing' : answering ? 'answering' : items.some(item => item.phase === 'error') ? 'error' : 'done'
  return <article className="btw-bubble btw-conversation" data-btw-phase={phase} aria-label={t('bubble.label')}>
    <div className="btw-header">
      <span className="btw-symbol"><MessageCircle size={16} /></span>
      <span className="btw-question">BTW</span>
      <div className="btw-actions">
        <button type="button" title={t('action.clear')} aria-label={t('action.clear')} disabled={clearing} onClick={() => { void clearHistory() }}>{clearing ? <LoaderCircle size={16} className="btw-spinner" /> : <Trash2 size={16} />}</button>
        <button type="button" title={t(collapsed ? 'action.expand' : 'action.collapse')} aria-label={t(collapsed ? 'action.expand' : 'action.collapse')} aria-expanded={!collapsed} onClick={onToggleCollapse}>{collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
        <button type="button" className={answering ? 'btw-action-stop' : undefined} title={t(closeFailed ? 'action.retryClose' : answering ? 'action.stop' : 'action.close')} aria-label={t(closeFailed ? 'action.retryClose' : answering ? 'action.stop' : 'action.close')} disabled={closing} onClick={close}>{answering ? <Square size={14} /> : <X size={16} />}</button>
      </div>
    </div>
    {!collapsed && <>
      <div className="btw-turns">
        {items.map(item => <ConversationTurn key={item.id} item={item} t={t} labels={labels} />)}
      </div>
      {closing && <div className="btw-status" role="status"><LoaderCircle size={14} className="btw-spinner" />{t('status.closing')}</div>}
      <form className="btw-followup" onSubmit={event => { event.preventDefault(); void submit() }}>
        <textarea
          ref={composerRef}
          value={draft}
          rows={1}
          placeholder={t('followup.placeholder')}
          aria-label={t('followup.placeholder')}
          disabled={busy}
          onChange={event => { setDraft(event.target.value); if (error) setError('') }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              void submit()
            }
          }}
        />
        <button type="submit" title={t('followup.send')} aria-label={t('followup.send')} disabled={busy || !draft.trim()}><Send size={15} /></button>
      </form>
      {error && <p className="btw-error" role="alert">{error}</p>}
    </>}
  </article>
}

export function BubbleDock({ store, sessionId, t }: { store: BubbleStore; sessionId: string; t: BtwTranslate }): React.JSX.Element | null {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const items = snapshot.filter(item => item.sessionId === sessionId)
  const latestId = items.at(-1)?.id
  const [manual, setManual] = useState<{ latestId: string | undefined; collapsed: boolean } | undefined>()
  const collapsed = manual !== undefined && manual.latestId === latestId ? manual.collapsed : false

  if (!items.length) return null
  return <div className="btw-dock">
    <ConversationView
      items={items}
      t={t}
      collapsed={collapsed}
      onToggleCollapse={() => setManual({ latestId, collapsed: !collapsed })}
      close={() => { void Promise.all(items.map(item => store.close(item.id))) }}
      clear={() => store.clear(sessionId)}
      ask={async question => { await store.ask(sessionId, question) }}
    />
  </div>
}
