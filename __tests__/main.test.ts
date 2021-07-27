import { targets, getUnicodeRanges, fontRange } from '../src/main';
import { join, parse } from 'path';
import { existsSync } from 'fs';
import fetch from 'node-fetch';

describe("Preset Check", () => {
  it("Target URLs access check", () => {
    for ( const targetName in targets ) {
      const targetAccess = fetch(targets[targetName]);
      targetAccess.then(res => {
        expect(res.status).toBe(200);
      });
    }
  });

  it("Python command check", () => {
    const commandExists = require("command-exists");
    commandExists("pyftsubset", (err, commandExists) => {
      expect(commandExists).toBe(true);
      if (err) {
        console.log(err);
      }
    });
  });
});

describe("FontRange Feature", () => {
  const fontPath = join("__tests__", "font", "NotoSansKR-Regular.otf");
  const fontInfo = parse(fontPath);
  const fontDir  = fontInfo.dir;
  const fontName = fontInfo.name;
  beforeAll(() => {
    fontRange(targets.korean, fontPath);
  });

  it("Check CSS Download", () => {
    const cssPath = join(fontDir, "Noto Sans KR.css");
    expect(existsSync(cssPath)).toBe(true);
  });

  it("Font Created Check", () => {
    let counts = 0;
    const ranges = getUnicodeRanges(fontDir, targets.korean);
    ranges.then(() => {
      const eachFontPath = join(fontDir, fontName + "_" + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);
      counts++;
    });
  });
});
