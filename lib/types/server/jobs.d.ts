import type { SideResult, SideTurn } from '../shared';
export type { SideTurn } from '../shared';
import { type BtwLocale } from '../locales';
export interface ChildResult {
    stopReason: string;
    output: readonly {
        type: string;
        text?: string;
    }[];
}
export interface ChildRun {
    result: Promise<ChildResult>;
    dispose(): Promise<void>;
}
export interface ChildRequest {
    scope: string;
    id: string;
    question: string;
    /** 启动时快照；同一会话后续 BTW 默认继承此前已完成的问答。 */
    history: readonly SideTurn[];
    signal: AbortSignal;
    context?: unknown;
    locale: BtwLocale;
}
export type StartChild = (request: ChildRequest) => Promise<ChildRun>;
interface JobOptions {
    cleanupTimeoutMs?: number;
    onError?: (error: Error) => void;
    /** 卸载后所有实际资源均释放时调用；用于释放执行保护。 */
    onIdle?: () => void | Promise<void>;
}
/** 清洗模型可能因上下文 toolcall 惯性残留的裸露工具调用标记与代码块伪影，保留纯文字回答 */
export declare function sanitizeModelAnswer(raw: string): string;
export declare const DEFAULT_TIMEOUT_MS = 1800000;
/** 管理一次性任务；父会话和请求标识共同构成所有权边界。 */
export declare class SideJobs {
    private readonly start;
    private readonly timeoutMs;
    private readonly options;
    private readonly jobs;
    private readonly retired;
    private readonly histories;
    private readonly generations;
    private disposed;
    private idleNotified;
    constructor(start: StartChild, timeoutMs?: number, options?: JobOptions);
    get size(): number;
    ask(scope: string, id: string, question: string, signal?: AbortSignal, context?: unknown, locale?: BtwLocale): Promise<SideResult>;
    /** 关闭可先于启动到达；短期墓碑阻止网络乱序重新启动请求。 */
    close(scope: string, id: string): Promise<SideResult>;
    history(scope: string): SideTurn[];
    /** 垃圾桶重置当前主会话的整段 BTW 历史；旧任务即使迟到也不能写回新对话。 */
    clear(scope: string, locale?: BtwLocale): Promise<SideResult>;
    dispose(): Promise<void>;
    private execute;
    private cleanup;
    private cleanupLater;
    private interruptible;
    private bounded;
    private release;
    private report;
    private notifyIdle;
    private retire;
    private prune;
}
