export declare const targets: {
    weston: string;
    korean: string;
    japanese: string;
    chinese: string;
    chinese_traditional: string;
};
interface BlockI {
    src: string;
    unicodes: string;
}
export declare function parseCSS(dirPath?: string, url?: string): Promise<BlockI[]>;
interface fontDefaultOptionI {
    savePath: string;
    format: format;
    nameFormat: string;
    logFormat: string;
    defaultArgs: string[];
    etcArgs: string[];
}
interface fontRangeOptionI extends fontDefaultOptionI {
    fromCSS: "default" | "srcIndex" | "srcName";
}
interface fontSubsetOptionI extends fontDefaultOptionI {
    textFile: string;
    text: string;
}
interface fontPipeOptionI extends fontRangeOptionI, fontSubsetOptionI {
    cssFile: string;
}
type argOptionT<I> = fontDefaultOptionI["savePath"] | Partial<I>;
type fontRangeOptionT = argOptionT<fontRangeOptionI>;
type fontSubsetOptionT = argOptionT<fontSubsetOptionI>;
type fontPipeOptionT = Partial<fontPipeOptionI>;
type format = "otf" | "ttf" | "woff2" | "woff" | "woff-zopfli";
export declare const defaultArgs: string[];
export declare function fontRange(url?: string, fontPath?: string, fontRangeOption?: fontRangeOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>[]>;
export declare function fontSubset(fontPath?: string, fontSubsetOption?: fontSubsetOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>>;
interface fontPipeI {
    fontPath: string;
    fontPipeOption?: fontPipeOptionT;
}
export declare function fontPipe(subsetList: fontPipeI[]): Promise<(import("@esm2cjs/execa").ExecaSyncReturnValue<string> | import("@esm2cjs/execa").ExecaSyncReturnValue<string>[])[]>;
export {};
