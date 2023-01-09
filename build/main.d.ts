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
export interface FontDefaultOptionI {
    saveDir: string;
    format: Format;
    nameFormat: string;
    logFormat: string;
    defaultArgs: string[];
    etcArgs: string[];
}
export interface FontRangeOptionI extends FontDefaultOptionI {
    fromCSS: "default" | "srcIndex" | "srcName";
}
export interface FontSubsetOptionI extends FontDefaultOptionI {
    textFile: string;
    text: string;
}
export interface FontPipeOptionI extends FontRangeOptionI, FontSubsetOptionI {
    cssFile: string;
}
type ArgOptionT<I> = FontDefaultOptionI["saveDir"] | Partial<I>;
type FontRangeOptionT = ArgOptionT<FontRangeOptionI>;
type FontSubsetOptionT = ArgOptionT<FontSubsetOptionI>;
type FontPipeOptionT = Partial<FontPipeOptionI>;
type Format = "otf" | "ttf" | "woff2" | "woff" | "woff-zopfli";
export declare const defaultArgs: string[];
export declare function fontRange(fontPath?: string, url?: string, fontRangeOption?: FontRangeOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>[]>;
export declare function fontSubset(fontPath?: string, fontSubsetOption?: FontSubsetOptionT): Promise<import("@esm2cjs/execa").ExecaSyncReturnValue<string>>;
export interface FontPipeI {
    fontPath: string;
    option?: FontPipeOptionT;
}
interface ShardI {
    shard: string;
    shardFormat: string;
}
type ShardT = ShardI["shard"] | Partial<ShardI>;
export declare function fontPipe(subsetList: FontPipeI[], shard?: ShardT): Promise<(import("@esm2cjs/execa").ExecaSyncReturnValue<string> | import("@esm2cjs/execa").ExecaSyncReturnValue<string>[])[]>;
export {};
