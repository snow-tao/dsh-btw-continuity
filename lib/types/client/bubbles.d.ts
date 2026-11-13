import { type SideResult, type SideTurn } from '../shared';
import { type BtwTranslate } from '../locales';
export interface Bubble {
    id: string;
    sessionId: string;
    question: string;
    reference?: string;
    answer: string;
    phase: 'answering' | 'done' | 'error' | 'closing';
    error?: string;
    closeFailed?: boolean;
}
export interface SideTransport {
    run(session: string, id: string, question: string, signal: AbortSignal, reference?: string): Promise<SideResult>;
    close(session: string, id: string): Promise<SideResult>;
    clear?(session: string): Promise<SideResult>;
    history?(session: string): Promise<SideTurn[]>;
}
/** 宿主在进入 handler 前明确拒绝启动；没有后台任务需要清理。 */
export declare class SideRequestNotStartedError extends Error {
}
/** 仅内存 UI 状态；关闭请求与答案返回按请求身份分别收敛。 */
export declare class BubbleStore {
    private readonly transport;
    private readonly t;
    private snapshot;
    /** X 只隐藏；下一次同 session 提问时恢复。垃圾桶会同时清空这里。 */
    private readonly archived;
    private readonly listeners;
    private readonly active;
    private readonly closing;
    private readonly notStarted;
    private readonly runEnd;
    private readonly closeFenced;
    private readonly admitting;
    private readonly clearing;
    private readonly restoreVersions;
    private disposed;
    constructor(transport: SideTransport, t?: BtwTranslate);
    getSnapshot: () => readonly Bubble[];
    subscribe: (listener: () => void) => (() => void);
    /** 返回已接收请求的标识；满额先等待旧气泡关闭，失败时拒绝且不发送新问题。 */
    ask(sessionId: string, question: string, reference?: string): Promise<string>;
    close(id: string, remember?: boolean): Promise<void>;
    /** 清空当前 session 的 BTW 历史与全部气泡；普通关闭只移除单个气泡。 */
    clear(sessionId: string): Promise<void>;
    dispose(): Promise<void>;
    private restore;
    private restoreArchived;
    private dropIfCloseCannotFinish;
    private remove;
    private update;
    private publish;
}
