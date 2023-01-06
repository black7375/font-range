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
    logFormat: string;
    defaultArgs: string[];
    etcArgs: string[];
}
interface fontSubsetOptionI extends fontRangeOptionI {
    textFile: string;
    text: string;
}
interface fontPipeOptionI extends fontSubsetOptionI {
    cssFile: string;
}
type argOptionT<I> = fontRangeOptionI["savePath"] | Partial<I>;
type fontRangeOptionT = argOptionT<fontRangeOptionI>;
type fontSubsetOptionT = argOptionT<fontSubsetOptionI>;
type fontPipeOptionT = Partial<fontPipeOptionI>;
export declare const defaultArgs: string[];
export declare function fontRange(url?: string, fontPath?: string, fontRangeOption?: fontRangeOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>[]>;
export declare function fontSubset(fontPath?: string, fontSubsetOption?: fontSubsetOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>>;
interface fontPipeI {
    fontPath: string;
    fontPipeOption?: fontPipeOptionT;
}
export declare function fontPipe(subsetList: fontPipeI[]): Promise<(import("@esm2cjs/execa").ExecaSyncReturnValue<string> | import("@esm2cjs/execa").ExecaSyncReturnValue<string>[])[]>;
export {};
