import { targets, getUnicodeRanges, fontRange } from '../src/main';
import { join, parse } from 'path';
import { existsSync, unlink, NoParamCallback } from 'fs';
import fetch from 'node-fetch';
import commandExists from 'command-exists';

describe("Preset Check", () => {
  it("Target URLs access check", async () => {
    for ( const targetName in targets ) {
      const res = await fetch(targets[targetName]);
      expect(res.status).toBe(200);
    }
  });

  it("Python command check", async () => {
    commandExists("pyftsubset", (err, commandExists) => {
      expect(commandExists).toBe(true);
      if (err) {
        console.log(err);
      }
    });
  });
});

const fontPath = join("__tests__", "font", "NotoSansKR-Regular.otf");
const fontInfo = parse(fontPath);
const fontDir  = fontInfo.dir;
const fontName = fontInfo.name;
const errCallback: NoParamCallback = (err) => {
  if(err) {
    console.error(err);
    return;
  }
}

describe("FontRange Offline Feature", () => {
  const cssPath = join("__tests__", "font", "NotoSansKR-Local.css");
  beforeAll(() => {
    return fontRange(cssPath, fontPath, {
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  });

  it("Font Created Check", async () => {
    const ranges  = await getUnicodeRanges(fontDir, cssPath);
    const rangesL = ranges.length;
    for (let counts = 0; counts < rangesL; counts++) {
      const eachFontPath = join(fontDir, fontName + ".subset." + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);

      // Remove file
      unlink(eachFontPath, errCallback);
    }
  });
});

describe("FontRange Online Feature", () => {
  beforeAll(() => {
    return fontRange(targets.korean, fontPath);
  });

  it("Check CSS Download", () => {
    const cssPath = join(fontDir, "Noto Sans KR.css");
    expect(existsSync(cssPath)).toBe(true);
  });

  it("Font Created Check", async () => {
    const ranges  = await getUnicodeRanges(fontDir, targets.korean);
    const rangesL = ranges.length;
    for (let counts = 0; counts < rangesL; counts++) {
      const eachFontPath = join(fontDir, fontName + "_" + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);

      // Remove file
      unlink(eachFontPath, errCallback);
    }
  });
});
