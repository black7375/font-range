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
interface fontSubsetOptionI extends fontRangeOptionI {
    glyphsFile: string;
    glyphs: string;
}
type argOptionT<I> = fontRangeOptionI["savePath"] | Partial<I>;
type fontRangeOptionT = argOptionT<fontRangeOptionI>;
type fontSubsetOptionT = argOptionT<fontSubsetOptionI>;
export declare function fontRange(url?: string, fontPath?: string, fontRangeOption?: fontRangeOptionT): Promise<Buffer[]>;
export declare function fontSubset(fontPath?: string, fontSubsetOption?: fontSubsetOptionT): Promise<Buffer>;
export {};
