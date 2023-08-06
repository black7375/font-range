import { join, parse } from "path";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { stat, mkdir } from "fs/promises";

import Piscina from "piscina";
import fetch, { Headers } from "@esm2cjs/node-fetch";
import { parse as cssAST, ParseOptions, walk } from "css-tree";
import type { Declaration } from "css-tree";

import type WorkerFn from "./worker";
import type { RequiredByValueExcept } from "./types";

// == Worker ===================================================================
type WorkerRT = ReturnType<typeof WorkerFn>;

class Worker {
  private static instance: Piscina;
  private constructor() { }

  public static getInstance(): Piscina {
    if(!Worker.instance) {
      Worker.instance = new Piscina({
        filename: join(__dirname, "../", "build", "worker.js")
      });
    }
    return Worker.instance;
  }
}

// == Resouce Basics ===========================================================
export const targets = {
  weston:   "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap",
  korean:   "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap",
  japanese: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",
  chinese:  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap",
  chinese_traditional: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap",
};

function getFontName(url: string) {
  const encodedURL = decodeURI(url);
  const urlObj     = new URL(encodedURL);
  const urlParams  = urlObj.searchParams;
  const fontName   = urlParams.get("family");
  return fontName;
}

// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
function validURL(str: string) {
  const pattern = new RegExp("^(https?:\\/\\/)?"+       // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|"+ // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))"+                      // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*"+                  // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?"+                         // query string
    "(\\#[-a-z\\d_]*)?$","i");                          // fragment locator
  return !!pattern.test(str);
}

function getCSSPath(dirPath: string, url: string) {
  if (validURL(url)) {
    const fontName = getFontName(url);
    const cssPath  = join(dirPath, fontName + ".css");
    return cssPath;
  }

  if (!existsSync(url)) {
    throw new Error("Not vaild URL or PATH: " + url);
  }
  return url;
}

// == CSS I/O ==================================================================
async function saveCSS(path: string, url: string) {
  // Fake header
  const version = "109.0";
  const headers = new Headers({
    "Accept": "text/html,application/xhtml+xml,application/xml;",
    "User-Agent": `Mozilla/5.0 (Windows NT 10.0; rv:${ version }) Gecko/20100101 Firefox/${ version }`
  });

  const res = await fetch(url, {
    method: "GET",
    headers: headers
  });
  if(res.status !== 200) {
    throw new Error("Not vaild URL: " + url);
  }

  return new Promise<void>((resolve, reject) => {
    const fileStream = createWriteStream(path);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      console.log("File write Error.");
      reject(err);
    });
    res.body.on("close", () => {
      fileStream.close();
    });
    fileStream.on("close", () => {
      resolve();
    });
  });
}

async function readCSS(path: string) {
  return new Promise<string>((resolve, reject) => {
    const readData: (string | Buffer)[] = [];
    createReadStream(path)
      .on("data", (data) => {
        readData.push(data);
      })
      .on("end", () => {
        const css = readData.join("");

        resolve(css);
      })
      .on("error", reject);
  });
}

// == CSS Parse ================================================================
const parseOptions: ParseOptions = {
  parseAtrulePrelude: false,
  parseRulePrelude:   false,
  parseValue:         false
};

async function existsDir(dirPath: string) {
  try {
    await stat(dirPath);
  }
  catch (err) {
    if (err.code === "ENOENT") {
      try {
        await mkdir(dirPath);
      }
      catch (err) {
        if (err.code !== "EEXIST") {
          throw err;
        }
      }
    }
  }
}

async function loadAST(dirPath: string, url = targets.korean, parseOption = parseOptions) {
  const cssPath = getCSSPath(dirPath, url);
  await existsDir(dirPath)
  if (!existsSync(cssPath)) {
    await saveCSS(cssPath, url);
  }

  const css = await readCSS(cssPath);
  return cssAST(css, parseOption);
}

interface BlockI {
  src:      string;
  unicodes: string;
}
function setBlock(block: BlockI, elem: Declaration, blockProp: keyof BlockI, elemProp: string) {
  if(elem.property === elemProp) {
    if(elem.value.type === "Raw") {
      block[blockProp] = elem.value.value;
    }
  }
}

export async function parseCSS(dirPath = "src", url = targets.korean) {
  const ast    = await loadAST(dirPath, url);
  const parsed = [] as BlockI[];

  walk(ast, { visit: "Atrule", enter(node) {
    if(node.name === "font-face") {
      const block = {
        src: "",
        unicodes: ""
      };
      walk(node, { visit: "Declaration", enter(elem) {
        setBlock(block, elem, "src",       "src");
        setBlock(block, elem, "unicodes",  "unicode-range");
      }});

      if(block.src !== "" || block.unicodes !== "") {
        parsed.push(block);
      }
    }
  }});
  return parsed;
}

// == Options - Basics =========================================================
export interface FontDefaultOptionI {
  saveDir:     string;
  format:      Format;
  nameFormat:  string;
  logFormat:   string;
  defaultArgs: string[];
  etcArgs:     string[];
}
export interface FontRangeOptionI extends FontDefaultOptionI {
  fromCSS:    "default" | "srcIndex" | "srcName";
}
export interface FontSubsetOptionI extends FontDefaultOptionI {
  textFile:    string;
  text:        string;
}
export interface FontPipeOptionI extends FontRangeOptionI, FontSubsetOptionI {
  cssFile:     string;
}
type ArgOptionT<I>     = FontDefaultOptionI["saveDir"] | Partial<I>;
type FontRangeOptionT  = ArgOptionT<FontRangeOptionI>;
type FontSubsetOptionT = ArgOptionT<FontSubsetOptionI>;
type FontPipeOptionT   = Partial<FontPipeOptionI>;
type ArgOptionsT       = FontRangeOptionT | FontSubsetOptionT | FontPipeOptionT;
type Format            = "otf" | "ttf" | "woff2" | "woff" | "woff-zopfli";

export const defaultArgs = [
  "--layout-features=*",
  "--glyph-names",
  "--symbol-cmap",
  "--legacy-cmap",
  "--notdef-glyph",
  "--notdef-outline",
  "--recommended-glyphs",
  "--name-legacy",
  "--drop-tables=",
  "--name-IDs=*",
  "--name-languages=*"
];

function getDefaultOptions(): RequiredByValueExcept<FontDefaultOptionI, "saveDir"> {
  return {
    format:      "woff2",
    nameFormat:  "{NAME}_{INDEX}{EXT}",
    logFormat:    "Convert {ORIGIN} -> {OUTPUT}",
    defaultArgs: defaultArgs,
    etcArgs:     []
  };
}

// == Options - Get Info =======================================================
function getFormat(format: Format) {
  switch(format) {
    case "otf":   return "otf";
    case "ttf":   return "ttf";
    case "woff2": return "woff2";
    case "woff":  return "woff";
    case "woff-zopfli": return "woff";
  }
}

function formatOption(format: Format) {
  const formatName = getFormat(format);

  if(format === "otf" || format === "ttf") return [""];
  return [
    "--flavor=" + formatName,
    (format === "woff-zopfli") ? "--with-zopfli" : ""
  ];
}

function fileNameInit(nameFormat: string, fontName: string, fontExt: string) {
  return nameFormat
    .replace( "{NAME}", fontName)
    .replace(  "{EXT}", fontExt );
}
function getFileName(initName: string, index?: number | string) {
  return initName
    .replace("{INDEX}",
        (typeof index === "number")
      ? index.toString()
      : (typeof index === "string")
      ? index
      : ""
    );
}
function getConsoleLog(logFormat: string, origin: string, output: string) {
  return logFormat
    .replace("{ORIGIN}", origin)
    .replace("{OUTPUT}", output);
}

function getOptionInfos(fontPath = "", fontOption?: ArgOptionsT, indexIndicate = "") {
  const options: FontPipeOptionT = Object.assign(
    { fromCSS: "default" } satisfies Partial<FontRangeOptionI>,
    getDefaultOptions(),
    typeof(fontOption) === "string"
      ? { saveDir: fontOption }
      : fontOption
  );

  const format   = options.format;
  const pathInfo = parse(fontPath);
  const fontDir  = pathInfo.dir;
  const fontBase = pathInfo.base;
  const fontName = pathInfo.name;
  const fontExt  = "." + getFormat(format);

  const dirPath    = Object.prototype.hasOwnProperty.call(options, "saveDir") ? options["saveDir"] : fontDir;
  const nameFormat = options.nameFormat;
  const logFormat  = options.logFormat;

  const initName = fileNameInit(nameFormat, fontName, fontExt);
  const output   = getFileName(initName, indexIndicate);
  const logMsg   = getConsoleLog(logFormat, fontBase, output);

  const convertOption = formatOption(format);
  const defaultOption = options.defaultArgs;
  const etcOption     = options.etcArgs;
  const baseOption    = [
    ...convertOption,
    ...defaultOption,
    ...etcOption
  ].filter(option => option !== "");

  const worker = Worker.getInstance();

  return {
    dirPath,
    initName,
    logMsg,

    baseOption,
    worker,

    fromCSS: options.fromCSS
  };
}

// == Options - Others =========================================================
function getSrcInfo(src: string) {
  const first = src.split(",").find((str) => {
    return str.indexOf("url(") === 0;
  });
  if(typeof first === "undefined") return {
    base:  "",
    index: 0
  };

  const reStr = "url\\(";
  const reMdl = "(.+?)";
  const reEnd = "\\)";
  const quote = "(\\\\?['\"])?";
  const regex = new RegExp(
    reStr + quote + reMdl + quote + reEnd
  );

  const urlContent = first.match(regex)[2];
  const parsedURL  = parse(urlContent);
  return {
    base:  parsedURL.base,
    index: parseInt(
      parsedURL.name.split(".").pop()  // google font index at latest
    )
  };
}

function getSaveOption(dirPath: string, initName: string, index?: number) {
  const fileName = getFileName(initName, index);
  return ("--output-file=" + join(dirPath, fileName));
}

function getSubsetOption(fontSubsetOption?: FontSubsetOptionT) {
  if(
    typeof fontSubsetOption !== "undefined" &&
    typeof fontSubsetOption !== "string"
  ) {
    if("textFile" in fontSubsetOption) {
      return ("--text-file=" + fontSubsetOption.textFile);
    }
    if("text"     in fontSubsetOption) {
      return ("--text="      + fontSubsetOption.text    );
    }
  }
  return "--glyphs=*";
}

// == Main =====================================================================
export async function fontRange(fontPath = "", url = targets.korean, fontRangeOption?: FontRangeOptionT) {
  const {
    dirPath,
    initName,
    logMsg,

    baseOption,
    worker,

    fromCSS
  } = getOptionInfos(fontPath, fontRangeOption, "n");

  const ranges = await parseCSS(dirPath, url);
  const result = ranges.map(async ({src, unicodes}, i) => {
    const srcInfo       = getSrcInfo(src);
    const saveOption    = getSaveOption(
      dirPath,
      (fromCSS === "srcName"  && srcInfo.base !== "")
        ? srcInfo.base
        : initName,
      (fromCSS === "srcIndex" && srcInfo.base !== "")
        ? srcInfo.index
        : i
    );
    const unicodeRanges = unicodes.split(", ").join(",");
    const unicodeOption = "--unicodes=" + unicodeRanges;

    const options = [fontPath, saveOption, unicodeOption, ...baseOption];
    const logInfo = (i === 0) ? logMsg : "";
    const result: WorkerRT = await worker.run({ options, log: logInfo});
    return result;
  });

  return await Promise.all(result);
}

export async function fontSubset(fontPath = "", fontSubsetOption?: FontSubsetOptionT) {
  const {
    dirPath,
    initName,
    logMsg,

    baseOption,
    worker
  } = getOptionInfos(fontPath, fontSubsetOption);
  await existsDir(dirPath)

  const subsetOption = getSubsetOption(fontSubsetOption);
  const saveOption   = getSaveOption(dirPath, initName);

  const options = [fontPath, saveOption, subsetOption, ...baseOption];
  const result: WorkerRT = await worker.run({ options, log: logMsg});
  return result;
}

// == Pipeline =================================================================
export interface FontPipeI {
  fontPath: string;
  option?:  FontPipeOptionT;
}
function fontPipeExec(subsetTarget: FontPipeI) {
  const { fontPath, option } = subsetTarget;

  return ((typeof option         !== "undefined") &&
          (typeof option.cssFile !== "undefined"))
    ? fontRange(fontPath, option.cssFile, option)
    : fontSubset(fontPath, option);
}

function shardNum(shardStr: string, content: string) {
  const num = Math.abs(parseInt(shardStr, 10));

  if(isNaN(num) || num <= 0) {
    throw new Error("<" + content + "> must be a positive number");
  }
  return num;
}
function getShardInfo(shardEnv: string) {
  const [indexStr, totalStr] = shardEnv.split("/");
  const index = shardNum(indexStr, "index");
  const total = shardNum(totalStr, "total");

  if(index > total) {
    throw new Error("<index> must be less then <total>")
  }
  return [index, total] as const;
}

interface ShardI {
  shard:       string;
  shardFormat: string;
}
type ShardT = ShardI["shard"] | Partial<ShardI>
export async function fontPipe(subsetList: FontPipeI[], shard?: ShardT) {
  const shardEnv    = (typeof shard === "object" && typeof shard.shard       === "string")
    ? shard.shard
    : (typeof shard === "object" || typeof shard === "undefined")
    ? process.env.SHARD || "1/1"
    : shard;
  const shardFormat = (typeof shard === "object" && typeof shard.shardFormat === "string")
    ? shard.shardFormat
    : "== {START}/{END} ==========";

  const [index, total] = getShardInfo(shardEnv);
  const shardSize  = Math.ceil(subsetList.length / total);
  const shardStart = shardSize * (index - 1);
  const shardEnd   = shardSize * index;

  if(shardEnv !== "1/1") {
    const shardMsg = shardFormat
      .replace("{START}", index.toString())
      .replace("{END}",   total.toString());
    console.log(shardMsg);
  }

  const result = subsetList
    .slice(shardStart, shardEnd)
    .map(fontPipeExec);
  return await Promise.all(result);
}
