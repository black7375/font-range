import { join, parse } from "path";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";

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
        filename: join(process.cwd(), "build", "worker.js")
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

async function loadAST(dirPath: string, url = targets.korean, parseOption = parseOptions) {
  const cssPath = getCSSPath(dirPath, url);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath);
  }
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
function setBlock(block: BlockI, elem: Declaration, property: string) {
  if(elem.property === property) {
    if(elem.value.type === "Raw") {
      block[property] = elem.value.value;
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
        setBlock(block, elem, "src");
        setBlock(block, elem, "unicode-range");
      }});

      if(block.src !== "" || block.unicodes !== "") {
        parsed.push(block);
      }
    }
  }});
  return parsed;
}

// == Options - Basics =========================================================
interface fontDefaultOptionI {
  savePath:    string;
  format:      format;
  nameFormat:  string;
  logFormat:   string;
  defaultArgs: string[];
  etcArgs:     string[];
}
interface fontRangeOptionI extends fontDefaultOptionI {
  fromCSS:    "default" | "srcIndex" | "srcName";
}
interface fontSubsetOptionI extends fontDefaultOptionI {
  textFile:    string;
  text:        string;
}
interface fontPipeOptionI extends fontRangeOptionI, fontSubsetOptionI {
  cssFile:     string;
}
type argOptionT<I>     = fontDefaultOptionI["savePath"] | Partial<I>;
type fontRangeOptionT  = argOptionT<fontRangeOptionI>;
type fontSubsetOptionT = argOptionT<fontSubsetOptionI>;
type fontPipeOptionT   = Partial<fontPipeOptionI>;
type argOptionsT       = fontRangeOptionT | fontSubsetOptionT | fontPipeOptionT;
type format            = "otf" | "ttf" | "woff2" | "woff" | "woff-zopfli";

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

function getDefaultOptions(): RequiredByValueExcept<fontDefaultOptionI, "savePath"> {
  return {
    format:      "woff2",
    nameFormat:  "{NAME}_{INDEX}{EXT}",
    logFormat:    "Convert {ORIGIN} -> {OUTPUT}",
    defaultArgs: defaultArgs,
    etcArgs:     []
  };
}

// == Options - Get Info =======================================================
function getFormat(format: format) {
  switch(format) {
    case "otf":   return "otf";
    case "ttf":   return "ttf";
    case "woff2": return "woff2";
    case "woff":  return "woff";
    case "woff-zopfli": return "woff";
  }
}

function formatOption(format: format) {
  const formatName = getFormat(format);

  if(format === "otf" || format === "ttf") return [""];
  return [
    "--flavor=" + formatName,
    (format === "woff-zopfli") ? "--with-zopfli" : ""
  ];
}

function getOptionInfos(fontPath = "", fontOption?: argOptionsT) {
  const options: fontPipeOptionT = Object.assign(
    { fromCSS: "default" } satisfies Partial<fontRangeOptionI>,
    getDefaultOptions(),
    typeof(fontOption) === "string"
      ? { savePath: fontOption }
      : fontOption
  );

  const format   = options.format;
  const pathInfo = parse(fontPath);
  const fontDir  = pathInfo.dir;
  const fontBase = pathInfo.base;
  const fontName = pathInfo.name;
  const fontExt  = "." + getFormat(format);

  const dirPath    = Object.prototype.hasOwnProperty.call(options, "savePath") ? options["savePath"] : fontDir;
  const nameFormat = options.nameFormat;
  const logFormat  = options.logFormat;

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
    fontBase,
    fontName,
    fontExt,

    dirPath,
    nameFormat,
    logFormat,

    baseOption,
    worker,

    fromCSS: options.fromCSS
  };
}

// == Options - Others =========================================================
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

function getSaveOption(dirPath: string, initName: string, index?: number) {
  const fileName = getFileName(initName, index);
  return ("--output-file=" + join(dirPath, fileName));
}

function getSubsetOption(fontSubsetOption?: fontSubsetOptionT) {
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
async function initWithLog(
  dirPath: string, fontBase: string,   fontName:  string, fontExt: string,
  nameFormat: string, logFormat: string,
  index?: number | string
  ) {
  const initName = fileNameInit(nameFormat, fontName, fontExt);

  if(!existsSync(dirPath)) await mkdir(dirPath);
  if(logFormat !== "") {
    const output = getFileName(initName, index);
    const log    = getConsoleLog(logFormat, fontBase, output);
    console.log(log);
  }
  return initName;
}

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
  }
}

export async function fontRange(url = targets.korean, fontPath = "", fontRangeOption?: fontRangeOptionT) {
  const {
    fontBase,
    fontName,
    fontExt,

    dirPath,
    nameFormat,
    logFormat,

    baseOption,
    worker,

    fromCSS
  } = getOptionInfos(fontPath, fontRangeOption);
  const initName = await initWithLog(dirPath, fontBase, fontName, fontExt, nameFormat, logFormat, "n");

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
    const result: WorkerRT = await worker.run(options);
    return result;
  });

  return Promise.all(result);
}

export async function fontSubset(fontPath = "", fontSubsetOption?: fontSubsetOptionT) {
  const {
    fontBase,
    fontName,
    fontExt,

    dirPath,
    nameFormat,
    logFormat,

    baseOption,
    worker
  } = getOptionInfos(fontPath, fontSubsetOption);

  const initName     = await initWithLog(dirPath, fontBase, fontName, fontExt, nameFormat, logFormat);
  const subsetOption = getSubsetOption(fontSubsetOption);
  const saveOption   = getSaveOption(dirPath, initName);

  const options = [fontPath, saveOption, subsetOption, ...baseOption];
  const result: WorkerRT = await worker.run(options);
  return result;
}

// == Pipeline =================================================================
interface fontPipeI {
  fontPath: string;
  fontPipeOption?: fontPipeOptionT;
}

function fontPipeExec(subsetTarget: fontPipeI) {
  const { fontPath, fontPipeOption } = subsetTarget;

  return ((typeof fontPipeOption         !== "undefined") &&
          (typeof fontPipeOption.cssFile !== "undefined"))
    ? fontRange(fontPipeOption.cssFile, fontPath, fontPipeOption)
    : fontSubset(fontPath, fontPipeOption);
}

export function fontPipe(subsetList: fontPipeI[]) {
  const result = subsetList.map(fontPipeExec);
  return Promise.all(result);
}
