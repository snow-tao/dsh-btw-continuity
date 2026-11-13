import { MAX_QUESTION_LENGTH, MAX_REFERENCE_LENGTH, type SideResult, type SideTurn } from '../shared'
import { translate, type BtwTranslate } from '../locales'

const MAX_BUBBLES_PER_SESSION = 20

/** 局域网明文 HTTP 等非安全上下文不暴露 crypto.randomUUID，getRandomValues 不受该限制。 */
function newRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export interface Bubble {
  id: string
  sessionId: string
  question: string
  reference?: string
  answer: string
  phase: 'answering' | 'done' | 'error' | 'closing'
  error?: string
  closeFailed?: boolean
}
export interface SideTransport {
  run(session: string, id: string, question: string, signal: AbortSignal, reference?: string): Promise<SideResult>
  close(session: string, id: string): Promise<SideResult>
  clear?(session: string): Promise<SideResult>
  history?(session: string): Promise<SideTurn[]>
}

/** 宿主在进入 handler 前明确拒绝启动；没有后台任务需要清理。 */
export class SideRequestNotStartedError extends Error {}

/** 仅内存 UI 状态；关闭请求与答案返回按请求身份分别收敛。 */
export class BubbleStore {
  private snapshot: readonly Bubble[] = []
  /** X 只隐藏；下一次同 session 提问时恢复。垃圾桶会同时清空这里。 */
  private readonly archived = new Map<string, Bubble[]>()
  private readonly listeners = new Set<() => void>()
  private readonly active = new Map<string, AbortController>()
  private readonly closing = new Map<string, Promise<void>>()
  private readonly notStarted = new Set<string>()
  private readonly runEnd = new Map<string, 'pending' | 'success' | 'not-started' | 'aborted' | 'failed'>()
  private readonly closeFenced = new Set<string>()
  private readonly admitting = new Set<string>()
  private readonly clearing = new Map<string, Promise<void>>()
  private readonly restoreVersions = new Map<string, number>()
  private disposed = false
  constructor(private readonly transport: SideTransport, private readonly t: BtwTranslate = translate()) {}
  getSnapshot = (): readonly Bubble[] => this.snapshot
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  /** 返回已接收请求的标识；满额先等待旧气泡关闭，失败时拒绝且不发送新问题。 */
  async ask(sessionId: string, question: string, reference?: string): Promise<string> {
    if (this.disposed) throw new Error(this.t('error.stopped'))
    if (!question.trim()) throw new Error(this.t('error.empty'))
    if (question.length > MAX_QUESTION_LENGTH) throw new Error(this.t('error.length'))
    if (reference !== undefined && (!reference.trim() || reference.length > MAX_REFERENCE_LENGTH)) throw new Error(this.t('error.reference'))
    if (this.admitting.has(sessionId)) throw new Error(this.t('error.bubbleCapacity'))
    if (this.active.size >= 8) throw new Error(this.t('error.capacity'))
    void this.restore(sessionId)
    const sessionBubbles = this.snapshot.filter(item => item.sessionId === sessionId)
    if (sessionBubbles.length >= MAX_BUBBLES_PER_SESSION) {
      const oldest = sessionBubbles.find(item => !this.active.has(item.id) && !this.closing.has(item.id) && !item.closeFailed)
      if (!oldest) throw new Error(this.t('error.bubbleCapacity'))
      this.admitting.add(sessionId)
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        // 先确认关闭再接收；传输挂起时有界返回，后续关闭仍由原 Promise 接管。
        await Promise.race([this.close(oldest.id, false), new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(this.t('error.bubbleCapacity'))), 5_000)
        })])
      } finally {
        clearTimeout(timer)
        this.admitting.delete(sessionId)
      }
    }
    if (this.disposed) throw new Error(this.t('error.stopped'))
    if (this.snapshot.filter(item => item.sessionId === sessionId).length >= MAX_BUBBLES_PER_SESSION) throw new Error(this.t('error.bubbleCapacity'))
    if (this.active.size >= 8) throw new Error(this.t('error.capacity'))
    const id = newRequestId()
    const controller = new AbortController()
    this.active.set(id, controller)
    this.runEnd.set(id, 'pending')
    this.publish([...this.snapshot, { id, sessionId, question, ...(reference === undefined ? {} : { reference }), answer: '', phase: 'answering' }])
    void Promise.resolve().then(() => reference === undefined ? this.transport.run(sessionId, id, question, controller.signal) : this.transport.run(sessionId, id, question, controller.signal, reference)).then(result => {
      if (result.kind === 'success') {
        this.runEnd.set(id, 'success')
        if (!this.snapshot.some(item => item.id === id)) return
        const failedClose = this.closeFenced.has(id) || Boolean(this.snapshot.find(item => item.id === id)?.closeFailed)
        this.update(id, { phase: failedClose ? 'error' : this.closing.has(id) ? 'closing' : 'done', answer: result.text, ...(failedClose ? {} : { error: undefined }) })
        return
      }
      if (controller.signal.aborted) {
        if (this.runEnd.get(id) === 'pending') this.runEnd.set(id, 'aborted')
        this.dropIfCloseCannotFinish(id)
        return
      }
      this.runEnd.set(id, 'failed')
      if (!this.closing.has(id)) this.update(id, { phase: 'error', answer: '', error: result.text })
    }).catch(error => {
      if (this.runEnd.get(id) === 'success') return
      const message = error instanceof Error ? error.message : String(error)
      if (error instanceof SideRequestNotStartedError && this.snapshot.some(item => item.id === id)) {
        this.runEnd.set(id, 'not-started')
        this.notStarted.add(id)
        if (this.closeFenced.has(id) || this.closing.has(id)) { this.remove(id); return }
        this.update(id, { phase: 'error', error: message })
        return
      }
      if (controller.signal.aborted) {
        if (this.runEnd.get(id) === 'pending') this.runEnd.set(id, 'aborted')
        this.dropIfCloseCannotFinish(id)
        return
      }
      this.runEnd.set(id, 'failed')
      if (!this.closing.has(id)) this.update(id, { phase: 'error', error: message })
    }).finally(() => { this.active.delete(id) })
    return id
  }

  close(id: string, remember = true): Promise<void> {
    const existing = this.closing.get(id)
    if (existing) return existing
    const item = this.snapshot.find(bubble => bubble.id === id)
    if (!item) return Promise.resolve()
    if (this.notStarted.has(id)) { this.remove(id); return Promise.resolve() }
    this.update(id, { phase: 'closing', error: undefined, closeFailed: false })
    this.active.get(id)?.abort()
    const operation = Promise.resolve().then(() => this.transport.close(item.sessionId, id)).then(result => {
      if (result.kind === 'error') throw new Error(result.text)
      this.remove(id, remember)
    }).catch(error => {
      if (this.notStarted.has(id) || this.runEnd.get(id) === 'not-started') { this.remove(id, remember); return }
      if (error instanceof SideRequestNotStartedError) {
        // 关闭被围栏拒绝只说明这次关闭没进 handler，不能说明启动没开始。
        this.closeFenced.add(id)
        const end = this.runEnd.get(id)
        if (end === 'aborted' || end === 'not-started') { this.remove(id, remember); return }
      }
      this.update(id, { phase: 'error', closeFailed: true, error: error instanceof Error ? error.message : String(error) })
    }).finally(() => { this.closing.delete(id); this.active.delete(id) })
    this.closing.set(id, operation)
    return operation
  }

  /** 清空当前 session 的 BTW 历史与全部气泡；普通关闭只移除单个气泡。 */
  clear(sessionId: string): Promise<void> {
    const existing = this.clearing.get(sessionId)
    if (existing) return existing
    const operation = Promise.resolve().then(async () => {
      if (this.disposed) throw new Error(this.t('error.stopped'))
      if (!this.transport.clear) throw new Error(this.t('error.backend'))
      const result = await this.transport.clear(sessionId)
      if (result.kind === 'error') throw new Error(result.text)
      this.restoreVersions.set(sessionId, (this.restoreVersions.get(sessionId) ?? 0) + 1)
      this.archived.delete(sessionId)
      const owned = this.snapshot.filter(item => item.sessionId === sessionId)
      for (const item of owned) {
        this.active.get(item.id)?.abort()
        this.notStarted.delete(item.id)
        this.runEnd.delete(item.id)
        this.closeFenced.delete(item.id)
      }
      this.publish(this.snapshot.filter(item => item.sessionId !== sessionId))
    }).finally(() => { this.clearing.delete(sessionId) })
    this.clearing.set(sessionId, operation)
    return operation
  }

  async dispose(): Promise<void> {
    this.disposed = true
    await Promise.all(this.snapshot.map(item => this.close(item.id)))
    this.archived.clear()
  }
  private async restore(sessionId: string): Promise<void> {
    const version = (this.restoreVersions.get(sessionId) ?? 0) + 1
    this.restoreVersions.set(sessionId, version)
    if (!this.transport.history) { this.restoreArchived(sessionId); return }
    let turns: SideTurn[]
    try { turns = await this.transport.history(sessionId) }
    catch {
      if (!this.disposed && this.restoreVersions.get(sessionId) === version) this.restoreArchived(sessionId)
      return
    }
    if (this.disposed || this.restoreVersions.get(sessionId) !== version) return
    const visible = this.snapshot.filter(item => item.sessionId === sessionId)
    const hidden = this.archived.get(sessionId) ?? []
    const candidates = [...visible, ...hidden]
    const used = new Set<string>()
    const restored = turns.map((turn, index): Bubble => {
      const match = candidates.find(item => !used.has(item.id) && item.answer === turn.answer
        && (item.question === turn.question || turn.question.endsWith(`\n${item.question}`)))
      if (match) {
        used.add(match.id)
        return { ...match, phase: 'done', closeFailed: false, error: undefined }
      }
      let hash = 0
      for (const char of `${turn.question}\n${turn.answer}`) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) | 0
      return { id: `history-${index}-${(hash >>> 0).toString(36)}`, sessionId, question: turn.question, answer: turn.answer, phase: 'done' }
    })
    const unmatchedVisible = visible.filter(item => !used.has(item.id))
    // 给本轮新问题预留一个位置；旧记录只裁剪可见展示，Host 中的上下文仍完整保留。
    const visibleHistoryCount = Math.max(0, Math.min(restored.length, MAX_BUBBLES_PER_SESSION - unmatchedVisible.length - 1))
    const visibleHistory = visibleHistoryCount === 0 ? [] : restored.slice(-visibleHistoryCount)
    const archivedHistory = restored.slice(0, Math.max(0, restored.length - visibleHistory.length))
    const remainingHidden = [...hidden.filter(item => !used.has(item.id)), ...archivedHistory]
    if (remainingHidden.length) this.archived.set(sessionId, remainingHidden)
    else this.archived.delete(sessionId)
    this.publish([...this.snapshot.filter(item => item.sessionId !== sessionId), ...visibleHistory, ...unmatchedVisible])
  }
  private restoreArchived(sessionId: string): void {
    const archived = this.archived.get(sessionId)
    if (!archived?.length) return
    // 为即将新增的问题预留一个位置；超出上限只裁剪可见气泡，不影响 Host 历史。
    const available = MAX_BUBBLES_PER_SESSION - this.snapshot.filter(item => item.sessionId === sessionId).length - 1
    if (available <= 0) return
    const restored = archived.slice(-available).filter(item => !this.snapshot.some(existing => existing.id === item.id))
    const remaining = archived.slice(0, Math.max(0, archived.length - restored.length))
    if (remaining.length) this.archived.set(sessionId, remaining)
    else this.archived.delete(sessionId)
    if (restored.length) this.publish([...this.snapshot, ...restored])
  }
  private dropIfCloseCannotFinish(id: string): void {
    if (!this.closeFenced.has(id)) return
    const end = this.runEnd.get(id)
    if (end === 'not-started' || end === 'aborted') this.remove(id)
  }
  private remove(id: string, remember = true): void {
    const item = this.snapshot.find(bubble => bubble.id === id)
    const end = this.runEnd.get(id)
    const restorable = item && (end === 'success' || item.phase === 'done' || (item.phase === 'error' && !item.closeFailed))
    if (remember && item && restorable) {
      const archived = this.archived.get(item.sessionId) ?? []
      const restored: Bubble = { ...item, phase: item.answer ? 'done' : 'error', closeFailed: false }
      this.archived.set(item.sessionId, [...archived.filter(bubble => bubble.id !== id), restored])
    }
    this.notStarted.delete(id)
    this.runEnd.delete(id)
    this.closeFenced.delete(id)
    this.publish(this.snapshot.filter(item => item.id !== id))
  }
  private update(id: string, patch: Partial<Bubble>): void { this.publish(this.snapshot.map(item => item.id === id ? { ...item, ...patch } : item)) }
  private publish(snapshot: readonly Bubble[]): void { this.snapshot = snapshot; for (const listener of this.listeners) listener() }
}
