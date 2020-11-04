import { join } from 'path';
import { createReadStream, createWriteStream } from "fs";
import fetch, { Headers } from 'node-fetch';
import { parse as parseCSS, ParseOptions } from 'css-tree';

// == =========================================================================
const targets = {
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

function getCSSPath(dirPath: string, url: string) {
  const fontName = getFontName(url);
  const cssPath  = join(dirPath, fontName + ".css");
  return cssPath;
}

// == ==========================================================================
async function saveCSS(path: string, url: string) {
  // Fake header
  const headers = new Headers({
    "Accept": "text/html,application/xhtml+xml,application/xml;",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0"
  });

  const res = await fetch(url, {
    method: "GET",
    headers: headers
  });
  const fileStream = createWriteStream(path);

  await new Promise<void>((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      console.log('File write Error.');
      reject(err);
    });
    fileStream.on("finish", function() {
      resolve();
    });
  });
}

async function readCSS(path: string) {
  return new Promise<string>((resolve, reject) => {
    const readData: string[] = [];
    createReadStream(path)
      .on('data', (data) => {
        readData.push(data);
      })
      .on('end', async () => {
        await Promise.all(readData);
        const css = readData.join('');

        resolve(css);
      })
      .on('error', reject);
  });
}

// == =========================================================================
const parseOptions: ParseOptions = {
  parseAtrulePrelude: false,
  parseRulePrelude:   false,
  parseValue:         false
};

async function loadAST(dirPath: string, url = targets.korean, parseOption = parseOptions) {
  const cssPath = getCSSPath(dirPath, url);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
  }
  if (!existsSync(cssPath)) {
    await saveCSS(cssPath, url);
  }

  const css = await readCSS(cssPath);
  const ast = await parseCSS(css, parseOption);
  return ast;
}

function parseUnicodeRanges(parsed) {
  const fontFaceL = parsed.children;
  const uniRangeL = fontFaceL.map((faceValObj => {
    const faceBlockL     = faceValObj.block.children;
    const uniRangeBlockL = faceBlockL.filter(faceBlock => faceBlock.property === "unicode-range");
    const uniRangeL      = uniRangeBlockL.map(uniRangeBlock => uniRangeBlock.value.value);
    return uniRangeL.head.data;
  }));

  const uniRanges: string[] = [];
  uniRangeL.forEach(unicodeRange => {
    uniRanges.push(unicodeRange);
  });
  return uniRanges;
}

export async function getUnicodeRanges(dirPath = "src", url = targets.korean) {
  const ast = await loadAST(dirPath, url);
  return parseUnicodeRanges(ast);
}
