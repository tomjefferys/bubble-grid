import { ReactNode, CSSProperties } from 'react';

export interface Item {
    item: ReactNode;
    style?: CSSProperties;
}

export interface Content {
    content : (Item | undefined)[][];
}