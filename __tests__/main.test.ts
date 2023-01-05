import { targets, getUnicodeRanges, fontRange, fontSubset } from '../src/main';
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

// https://github.com/piscinajs/piscina/issues/83
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
const timeout = 60000;

describe("FontRange Offline Feature", () => {
  const cssPath = join("__tests__", "font", "NotoSansKR-Local.css");
  beforeAll(async () => {
    return await fontRange(cssPath, fontPath, {
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  }, timeout);

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
  beforeAll(async () => {
    return await fontRange(targets.korean, fontPath);
  }, timeout);

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

describe("FontSubset Format Feature", () => {
  beforeAll(async () => {
    return await fontSubset(fontPath, {
      format: "woff",
    });
  }, timeout);

  it("Font Created Check", async () => {
    const fontFile = join(fontDir, fontName + "_" + ".woff");
    expect(existsSync(fontFile)).toBe(true);

    // Remove file
    unlink(fontFile, errCallback);
  });
});

describe("FontSubset Glyphs File Feature", () => {
  beforeAll(async () => {
    const glyphsFile = join(fontDir, "subset_glyphs.txt");
    return await fontSubset(fontPath, {
      glyphsFile,
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  }, timeout);

  it("Font Created Check", async () => {
    const fontFile = join(fontDir, fontName + ".subset." + ".woff2");
    expect(existsSync(fontFile)).toBe(true);

    // Remove file
    unlink(fontFile, errCallback);
  });
});
