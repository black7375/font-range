import { join, parse } from 'path';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import fetch, { Headers } from 'node-fetch';
import { parse as parseCSS, ParseOptions, findAll } from 'css-tree';
import type { Declaration } from 'css-tree';
import { execSync } from 'child_process';
import { RequiredByValueExcept, ValueOf } from './types';

// == Resouce Basics ==========================================================
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
    throw new Error(url + "Not vaild URL or PATH");
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
  const fileStream = createWriteStream(path);

  await new Promise<void>((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      console.log("File write Error.");
      reject(err);
    });
    fileStream.on("finish", function() {
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
      .on("end", async () => {
        await Promise.all(readData);
        const css = readData.join("");

        resolve(css);
      })
      .on("error", reject);
  });
}

// == CSS Parse ===============================================================
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
  const ast =       parseCSS(css, parseOption);
  return ast;
}

export async function getUnicodeRanges(dirPath = "src", url = targets.korean): Promise<string[]> {
  const ast           = await loadAST(dirPath, url);
  const unicodeNodes  = findAll(ast, (node, _item, _list) => {
    return (
      node.type     === "Declaration"   &&
      node.property === "unicode-range"
    );
  });

  const unicodeRanges = unicodeNodes.reduce((unicodeRanges: string[], node: Declaration) => {
    const nodeValue = node.value;
    if(nodeValue.type === "Raw") {
      unicodeRanges.push(nodeValue.value);
    }
    return unicodeRanges;
  }, []);
  return unicodeRanges;
}

// == Options =================================================================
interface fontRangeOptionI {
  savePath:    string;
  format:      string;
  nameFormat:  string;
  defaultArgs: string;
  etcArgs:     string;
}

function getDefaultOptions(): RequiredByValueExcept<fontRangeOptionI, 'savePath'> {
  return {
    format:      "woff2",
    nameFormat:  "{NAME}_{INDEX}{EXT}",
    defaultArgs: "--layout-features='*' \
                  --glyph-names \
                  --symbol-cmap \
                  --legacy-cmap \
                  --notdef-glyph \
                  --notdef-outline \
                  --recommended-glyphs \
                  --name-legacy \
                  --drop-tables= \
                  --name-IDs='*' \
                  --name-languages='*'",
    etcArgs:      ""
  };
}

function getOption(options: Partial<fontRangeOptionI>, key: keyof fontRangeOptionI, alterValue: ValueOf<fontRangeOptionI>) {
  return Object.prototype.hasOwnProperty.call(options, key)
    ? options[key]
    : alterValue;
}

function getName(nameFormat: string, fontName: string, index: number, fontExt: string) {
  return nameFormat
    .replace( "{NAME}", fontName)
    .replace("{INDEX}", index.toString())
    .replace(  "{EXT}", fontExt);
}

// == Main ====================================================================
function getFormat(format: string) {
  switch(format) {
    case "otf":   return "otf";
    case "ttf":   return "ttf";
    case "woff2": return "woff2";
    case "woff":  return "woff";
    case "woff-zopfli": return "woff";
    default: return "woff2";
  }
}

function formatOption(format: string, ext = true) {
  const formatName = getFormat(format);
  if(ext) return "." + formatName;

  if(format === "otf" || format === "ttf") return "";
  return "--flavor='" + ((format === "woff-zopfli")
       ? formatName + "' --with-zopfli "
       : formatName + "' ");
}

export function fontRange(
  url = targets.korean, fontPath = "",
  fontRangeOption?: fontRangeOptionI['savePath'] | Partial<fontRangeOptionI>
): Promise<Buffer[]> {
  const options = Object.assign(
    getDefaultOptions(),
    typeof(fontRangeOption) === 'string'
      ? { savePath: fontRangeOption }
      : fontRangeOption
  );

  const format   = options.format;
  const pathInfo = parse(fontPath);
  const fontDir  = pathInfo.dir;
  const fontName = pathInfo.name;
  const fontExt  = formatOption(format);

  const dirPath  = getOption(options, 'savePath', fontDir);
  const ranges   = getUnicodeRanges(dirPath, url);

  const convertOption = formatOption(format, false);
  const defaultOption = options.defaultArgs;
  const etcOption     = options.etcArgs;

  const nameFormat = options.nameFormat;
  return ranges.then(eachRanges => eachRanges.map((unicodes, i) => {
    const saveOption = "--output-file='" +
      join(dirPath, getName(nameFormat, fontName, i, fontExt)) + "' ";
    const unicodeRanges = unicodes.split(', ').join(',');
    const unicodeOption = "--unicodes='" + unicodeRanges + "' ";

    const options = " '" + fontPath + "' " + saveOption + unicodeOption
      + convertOption + defaultOption + etcOption;
    return execSync("pyftsubset" + options);
  }));
}
