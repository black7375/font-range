/// <reference types="node" />
export declare const targets: {
    weston: string;
    korean: string;
    japanese: string;
    chinese: string;
    chinese_traditional: string;
};
export declare function getUnicodeRanges(dirPath?: string, url?: string): Promise<string[]>;
interface fontRangeOptionI {
    savePath: string;
    format: string;
    nameFormat: string;
    defaultArgs: string;
    etcArgs: string;
}
export declare function fontRange(url?: string, fontPath?: string, fontRangeOption?: fontRangeOptionI['savePath'] | Partial<fontRangeOptionI>): Promise<Buffer[]>;
export {};
