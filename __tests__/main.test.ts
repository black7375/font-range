import { join } from "path";
import { existsSync } from "fs";

import { targets, getUnicodeRanges, fontRange, fontSubset, fontPipe } from "../src/main";
import { timeout, cssFile, textFile, fontPath, fontDir, fontName, unlink } from "./shared";

// https://github.com/piscinajs/piscina/issues/83
describe("FontRange Offline Feature", () => {
  beforeAll(async () => {
    return await fontRange(cssFile, fontPath, {
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  }, timeout);

  it("Font Created Check", async () => {
    const ranges  = await getUnicodeRanges(fontDir, cssFile);
    const rangesL = ranges.length;
    for (let counts = 0; counts < rangesL; counts++) {
      const eachFontPath = join(fontDir, fontName + ".subset." + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);

      unlink(eachFontPath);
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

      unlink(eachFontPath);
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

    unlink(fontFile);
  });
});

describe("FontSubset Glyphs File Feature", () => {
  beforeAll(async () => {
    return await fontSubset(fontPath, {
      textFile,
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  }, timeout);

  it("Font Created Check", async () => {
    const fontFile = join(fontDir, fontName + ".subset." + ".woff2");
    expect(existsSync(fontFile)).toBe(true);

    unlink(fontFile);
  });
});

describe("FontSubset Pipeline Feature", () => {
  beforeAll(async () => {
    const pipe = [
      { fontPath },
      { fontPath, fontPipeOption: { textFile, nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } },
      { fontPath, fontPipeOption: { cssFile,  nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } }
    ]
    return await fontPipe(pipe);
  }, timeout * 3);

  it("Font Created Check", async () => {
    const fontFile1 = join(fontDir, fontName + "_" + ".woff2");
    const fontFile2 = join(fontDir, fontName + ".pipe." + ".woff2");

    expect(existsSync(fontFile1)).toBe(true);
    expect(existsSync(fontFile2)).toBe(true);
    unlink(fontFile1);
    unlink(fontFile2);

    const ranges  = await getUnicodeRanges(fontDir, targets.korean);
    const rangesL = ranges.length;
    for (let counts = 0; counts < rangesL; counts++) {
      const eachFontPath = join(fontDir, fontName + ".pipe." + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);
      unlink(eachFontPath);
    }
  });
});
