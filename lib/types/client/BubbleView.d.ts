import React from 'react';
import type { Bubble, BubbleStore } from './bubbles';
import type { BtwTranslate } from '../locales';
export declare function BubbleView({ item, close, clear, t, collapsed, onToggleCollapse }: {
    item: Bubble;
    close: () => void;
    clear?: () => Promise<void>;
    t: BtwTranslate;
    collapsed: boolean;
    onToggleCollapse: () => void;
}): React.JSX.Element;
export declare function BubbleDock({ store, sessionId, t }: {
    store: BubbleStore;
    sessionId: string;
    t: BtwTranslate;
}): React.JSX.Element | null;
