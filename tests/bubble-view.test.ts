// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BubbleDock, BubbleView } from '../src/client/BubbleView'
import { BubbleStore, type Bubble } from '../src/client/bubbles'
import { translate } from '../src/locales'

let container: HTMLDivElement
let root: Root
const close = vi.fn()
const answer = '正常回答\n\n<script>window.compromised = true</script>\n\n[正常链接](https://example.com) [危险链接](javascript:alert%281%29)\n\n![图片说明](https://example.com/tracker.png)'
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  close.mockClear()
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const render = async () => {
  await act(async () => root.render(React.createElement(BubbleView, {
    item: { id: 'request01', sessionId: 'session', question: '问题', answer, phase: 'done' },
    close,
    t: translate('en'),
    collapsed: false,
    onToggleCollapse: () => {},
  })))
}
const click = async (label: string) => {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  expect(button).not.toBeNull()
  await act(async () => button!.click())
}

it('实际 Markdown 渲染拒绝 HTML、脚本链接和远程图片，并保护新窗口链接', async () => {
  await render()
  expect(container.querySelector('script')).toBeNull()
  expect(container.textContent).not.toContain('window.compromised')
  expect(container.querySelector('img')).toBeNull()
  expect(container.textContent).toContain('图片说明')
  const links = [...container.querySelectorAll('a')]
  expect(links[0]?.href).toBe('https://example.com/')
  expect(links[0]?.target).toBe('_blank')
  expect(links[0]?.rel.split(' ')).toEqual(expect.arrayContaining(['noreferrer', 'noopener']))
  expect(links[1]?.getAttribute('href') ?? '').not.toMatch(/^javascript:/i)
})

it('正在回答时提供停止按钮，支持中英文无障碍提示且点击触发取消', async () => {
  const item: Bubble = { id: 'request01', sessionId: 'session', question: '问题', answer: '', phase: 'answering' }
  await act(async () => root.render(React.createElement(BubbleView, { item, close, t: translate('en'), collapsed: false, onToggleCollapse: () => {} })))
  await click('Stop answering')
  expect(close).toHaveBeenCalledOnce()
  close.mockClear()
  await act(async () => root.render(React.createElement(BubbleView, { item, close, t: translate('zh'), collapsed: false, onToggleCollapse: () => {} })))
  await click('停止回答')
  expect(close).toHaveBeenCalledOnce()
  close.mockClear()
})

it('复制保留原始 Markdown；折叠、展开和关闭可操作', async () => {
  const writeText = vi.fn(async () => {})
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  const toggle = vi.fn()
  await act(async () => root.render(React.createElement(BubbleView, {
    item: { id: 'request01', sessionId: 'session', question: '问题', answer, phase: 'done' },
    close,
    t: translate('en'),
    collapsed: false,
    onToggleCollapse: toggle,
  })))
  await click('Copy answer')
  expect(writeText).toHaveBeenCalledWith(answer)
  expect(container.querySelector('button[title="Copied"]')).not.toBeNull()
  await click('Collapse answer')
  expect(toggle).toHaveBeenCalledOnce()
  await click('Close side question')
  expect(close).toHaveBeenCalledOnce()
})

it('BubbleDock 同 session 始终只有一个面板，按顺序展示全部轮次并在新提问时展开', async () => {
  const transport = {
    run: vi.fn(async (_session: string, _id: string, _question: string) => ({ kind: 'success' as const, text: '回答' })),
    close: vi.fn(async () => ({ kind: 'success' as const, text: '' })),
  }
  const store = new BubbleStore(transport, translate('en'))
  const sessionId = 'session-dock'
  await act(async () => root.render(React.createElement(BubbleDock, { store, sessionId, t: translate('en') })))
  for (const question of ['问题1', '问题2', '问题3']) await act(async () => { await store.ask(sessionId, question) })
  expect(container.querySelectorAll('.btw-bubble')).toHaveLength(1)
  expect(container.querySelectorAll('.btw-turn')).toHaveLength(3)
  expect([...container.querySelectorAll('.btw-turn-question')].map(node => node.textContent)).toEqual(['问题1', '问题2', '问题3'])

  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')!.click())
  expect(container.querySelector('.btw-turns')).toBeNull()
  expect(container.querySelector('.btw-followup')).toBeNull()
  await act(async () => { await store.ask(sessionId, '问题4') })
  expect(container.querySelectorAll('.btw-bubble')).toHaveLength(1)
  expect(container.querySelectorAll('.btw-turn')).toHaveLength(4)
  expect(container.querySelector('button[aria-expanded="true"]')).not.toBeNull()

  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Close side question"]')!.click())
  expect(container.querySelector('.btw-dock')).toBeNull()
  await act(async () => { await store.ask(sessionId, '问题5') })
  expect(container.querySelectorAll('.btw-bubble')).toHaveLength(1)
  expect(container.querySelectorAll('.btw-turn')).toHaveLength(5)
})

it('展开面板底部的独立输入框可直接追问，Enter 发送且保持单一聊天记录', async () => {
  const transport = {
    run: vi.fn(async (_session: string, _id: string, _question: string) => ({ kind: 'success' as const, text: '回答' })),
    close: vi.fn(async () => ({ kind: 'success' as const, text: '' })),
  }
  const store = new BubbleStore(transport, translate('en'))
  await act(async () => root.render(React.createElement(BubbleDock, { store, sessionId: 'session', t: translate('en') })))
  await act(async () => { await store.ask('session', '第一问') })
  const textarea = container.querySelector<HTMLTextAreaElement>('.btw-followup textarea')!
  expect(textarea.placeholder).toContain('Ask a follow-up')
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  await act(async () => {
    setValue.call(textarea, '直接追问')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
  })
  expect(transport.run).toHaveBeenCalledTimes(1)
  await act(async () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  })
  expect(transport.run).toHaveBeenCalledTimes(2)
  expect(transport.run.mock.calls[1]?.[2]).toBe('直接追问')
  expect(container.querySelectorAll('.btw-bubble')).toHaveLength(1)
  expect([...container.querySelectorAll('.btw-turn-question')].map(node => node.textContent)).toEqual(['第一问', '直接追问'])
  expect(textarea.value).toBe('')
})

it('输入框单行起步、自动增至四行后滚动，发送后恢复单行', async () => {
  const transport = {
    run: vi.fn(async (_session: string, _id: string, _question: string) => ({ kind: 'success' as const, text: '回答' })),
    close: vi.fn(async () => ({ kind: 'success' as const, text: '' })),
  }
  const store = new BubbleStore(transport, translate('en'))
  await act(async () => root.render(React.createElement(BubbleDock, { store, sessionId: 'session', t: translate('en') })))
  await act(async () => { await store.ask('session', '第一问') })
  const textarea = container.querySelector<HTMLTextAreaElement>('.btw-followup textarea')!
  expect(textarea.rows).toBe(1)
  expect(textarea.style.height).toBe('38px')
  expect(textarea.style.overflowY).toBe('hidden')
  let scrollHeight = 60
  Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  const input = async (value: string) => act(async () => {
    setValue.call(textarea, value)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await input('两行\n内容')
  expect(textarea.style.height).toBe('60px')
  expect(textarea.style.overflowY).toBe('hidden')
  scrollHeight = 120
  await input('超过\n四行\n的\n输入\n内容')
  expect(textarea.style.height).toBe('84px')
  expect(textarea.style.overflowY).toBe('auto')
  scrollHeight = 38
  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Send follow-up"]')!.click())
  expect(textarea.value).toBe('')
  expect(textarea.style.height).toBe('38px')
  expect(textarea.style.overflowY).toBe('hidden')
})

it('复制失败显示可恢复错误，重试成功清除提示', async () => {
  const writeText = vi.fn().mockRejectedValueOnce(new Error('权限不足')).mockResolvedValueOnce(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  await render()
  await click('Copy answer')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Copy failed')
  await click('Copy answer')
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

it('右上角垃圾桶调用清空操作，失败时保留气泡并显示错误', async () => {
  const clear = vi.fn().mockRejectedValueOnce(new Error('连接断开')).mockResolvedValueOnce(undefined)
  await act(async () => root.render(React.createElement(BubbleView, {
    item: { id: 'request01', sessionId: 'session', question: '问题', answer, phase: 'done' },
    close,
    clear,
    t: translate('en'),
    collapsed: false,
    onToggleCollapse: () => {},
  })))
  await click('Clear BTW conversation')
  expect(clear).toHaveBeenCalledOnce()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('连接断开')
  await click('Clear BTW conversation')
  expect(clear).toHaveBeenCalledTimes(2)
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

it('DOM 隔离：头部采用 div.btw-header 并使用 data-btw-phase，避免被宿主或主题宏规则 header 误伤', async () => {
  await render()
  // 关键断言 1：根节点不再使用易与宿主会话冲突的 data-phase，改用独立私有属性 data-btw-phase
  const bubble = container.querySelector('.btw-bubble')
  expect(bubble?.getAttribute('data-phase')).toBeNull()
  expect(bubble?.getAttribute('data-btw-phase')).toBe('done')

  // 关键断言 2：头部必须是普通 div 容器，严禁使用原生 header 语义标签（防止被 Codex UI [data-phase] header 宏规则误伤为独立云母胶囊）
  const header = container.querySelector('.btw-header')
  expect(header).not.toBeNull()
  expect(header?.tagName.toLowerCase()).toBe('div')
  expect(container.querySelector('header')).toBeNull()
})
