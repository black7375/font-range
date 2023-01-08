import { join } from "path";
import { existsSync } from "fs";

import { targets, parseCSS, fontRange, fontSubset, fontPipe } from "../src/main";
import { timeout, cssFile, textFile, fontPath, fontDir, fontName, unlink, rmdir } from "./shared";

// https://github.com/piscinajs/piscina/issues/83
describe("FontRange Offline Feature", () => {
  const saveDir = join(fontDir, "offline");
  beforeAll(async () => {
    return await fontRange(fontPath, cssFile, {
      saveDir,
      nameFormat: "{NAME}.subset.{INDEX}{EXT}"
    });
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    const parsed  = await parseCSS(fontDir, cssFile);
    const parsedL = parsed.length;
    for (let counts = 0; counts < parsedL; counts++) {
      const fontFile = join(saveDir, fontName + ".subset." + counts + ".woff2");
      expect(existsSync(fontFile)).toBe(true);
    }
  });
});

describe("FontRange Options with srcIndex", () => {
  const saveDir = join(fontDir, "srcIndex");
  beforeAll(async () => {
    return await fontRange(fontPath, cssFile, {
      saveDir,
      nameFormat: "{NAME}.subset.{INDEX}{EXT}",
      logFormat:  "{ORIGIN} to {OUTPUT}",
      fromCSS:    "srcIndex"
    });
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    // Partial file checks
    const fontFile1 = join(saveDir, fontName + ".subset." + 119 + ".woff2");
    const fontFile2 = join(saveDir, fontName + ".subset." + 120 + ".woff2");
    expect(existsSync(fontFile1)).toBe(false);
    expect(existsSync(fontFile2)).toBe(true);
  });
});

describe("FontRange srcName Option", () => {
  const saveDir = join(fontDir, "srcName");
  beforeAll(async () => {
    return await fontRange(fontPath, cssFile, {
      saveDir,
      fromCSS:    "srcName"
    });
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    // Partial file checks
    const fontFile1 = join(saveDir, "PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2"  );
    const fontFile2 = join(saveDir, "PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.120.woff2");
    expect(existsSync(fontFile1)).toBe(true);
    expect(existsSync(fontFile2)).toBe(true);
  });
});

// online
describe("FontRange Online Feature", () => {
  const saveDir = join(fontDir, "online");
  beforeAll(async () => {
    return await fontRange(fontPath, targets.korean, saveDir);
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Check CSS Download", () => {
    const cssPath = join(saveDir, "Noto Sans KR.css");
    expect(existsSync(cssPath)).toBe(true);
  });

  it("Font Created Check", async () => {
    const parsed  = await parseCSS(saveDir, cssFile);
    const parsedL = parsed.length;
    for (let counts = 0; counts < parsedL; counts++) {
      const fontFile = join(saveDir, fontName + "_" + counts + ".woff2");
      expect(existsSync(fontFile)).toBe(true);
    }
  });
});

describe("FontSubset Format & Glyph Feature", () => {
  const saveDir = join(fontDir, "format");
  beforeAll(async () => {
    const font1 = await fontSubset(fontPath, {
      saveDir,
      text:     "abcd",
      format:   "otf"
    });
    const font2 = await fontSubset(fontPath, {
      saveDir,
      text:     "abcd",
      format:   "ttf"
    });
    const font3 = await fontSubset(fontPath, {
      saveDir,
      text:    "abcd",
      format:  "woff2"
    });
    const font4 = await fontSubset(fontPath, {
      saveDir,
      text:    "abcd",
      format:  "woff"
    });
    const font5 = await fontSubset(fontPath, {
      saveDir,
      text:     "abcd",
      format:   "woff-zopfli"
    });
    return Promise.all([font1, font2, font3, font4, font5])
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    const fontFile1 = join(saveDir, fontName + "_" + ".otf"  );
    const fontFile2 = join(saveDir, fontName + "_" + ".ttf"  );
    const fontFile3 = join(saveDir, fontName + "_" + ".woff2");
    const fontFile4 = join(saveDir, fontName + "_" + ".woff" );
    const fontFile5 = join(saveDir, fontName + "_" + ".woff" );
    expect(existsSync(fontFile1)).toBe(true);
    expect(existsSync(fontFile2)).toBe(true);
    expect(existsSync(fontFile3)).toBe(true);
    expect(existsSync(fontFile4)).toBe(true);
    expect(existsSync(fontFile5)).toBe(true);
  });
});

describe("FontSubset Glyphs File Feature", () => {
  beforeAll(async () => {
    return await fontSubset(fontPath, {
      textFile,
      nameFormat: "{NAME}.glyphFile{INDEX}{EXT}"
    });
  }, timeout);

  it("Font Created Check", async () => {
    const fontFile = join(fontDir, fontName + ".glyphFile" + ".woff2");
    expect(existsSync(fontFile)).toBe(true);

    unlink(fontFile);
  });
});

describe("FontPipe Feature", () => {
  beforeAll(async () => {
    const pipe = [
      { fontPath },
      { fontPath, option: { textFile, nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } },
      { fontPath, option: { cssFile,  nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } }
    ];
    return await fontPipe(pipe);
  }, timeout * 3);

  it("Font Created Check", async () => {
    const fontFile1 = join(fontDir, fontName + "_" + ".woff2");
    const fontFile2 = join(fontDir, fontName + ".pipe." + ".woff2");

    expect(existsSync(fontFile1)).toBe(true);
    expect(existsSync(fontFile2)).toBe(true);
    unlink(fontFile1);
    unlink(fontFile2);

    const parsed  = await parseCSS(fontDir, cssFile);
    const parsedL = parsed.length;
    for (let counts = 0; counts < parsedL; counts++) {
      const eachFontPath = join(fontDir, fontName + ".pipe." + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);
      unlink(eachFontPath);
    }
  });
});

describe("FontPipe Shard with Args", () => {
  const saveDir = join(fontDir, "shardArgs");
  beforeAll(async () => {
    const pipe = [
      { fontPath, option: { saveDir                                                   } },
      { fontPath, option: { saveDir, textFile, nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } },
      { fontPath, option: { saveDir, cssFile,  nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } }
    ];
    return await fontPipe(pipe, "1/2");
  }, timeout);
  afterAll(() => {
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    const fontFile1 = join(saveDir, fontName + "_" + ".woff2");
    const fontFile2 = join(saveDir, fontName + ".pipe." + ".woff2");

    expect(existsSync(fontFile1)).toBe(true);
    expect(existsSync(fontFile2)).toBe(true);
  });
});

describe("FontPipe Shard with Env", () => {
  const saveDir = join(fontDir, "shardEnv");
  const OLD_ENV = process.env;
  beforeAll(async () => {
    process.env = {
      ...OLD_ENV, 
      SHARD: "2/2"
    };
    const pipe = [
      { fontPath, option: { saveDir                                                   } },
      { fontPath, option: { saveDir, textFile, nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } },
      { fontPath, option: { saveDir, cssFile,  nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } }
    ];
    return await fontPipe(pipe);
  }, timeout);
  afterAll(() => {
    process.env = OLD_ENV;
    rmdir(saveDir);
  });

  it("Font Created Check", async () => {
    const parsed  = await parseCSS(fontDir, cssFile);
    const parsedL = parsed.length;
    for (let counts = 0; counts < parsedL; counts++) {
      const eachFontPath = join(saveDir, fontName + ".pipe." + counts + ".woff2");
      expect(existsSync(eachFontPath)).toBe(true);
    }
  });
});

describe("FontPipe Shard Error", () => {
  const saveDir = join(fontDir, "error");
  const pipe = [
    { fontPath, option: { saveDir                                                   } },
    { fontPath, option: { saveDir, textFile, nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } },
    { fontPath, option: { saveDir, cssFile,  nameFormat: "{NAME}.pipe.{INDEX}{EXT}" } }
  ];
  const run = async (shard: string) => await fontPipe(pipe, { shard });
  afterAll(() => {
    if(existsSync(saveDir)) {
      rmdir(saveDir);
    }
  });

  it("Number parsing", async() => {
    await expect(run("a120")).rejects.toThrow("<index> must be a positive number");
    await expect(run("a/20")).rejects.toThrow("<index> must be a positive number");
    await expect(run("0/20")).rejects.toThrow("<index> must be a positive number");
    await expect(run("1/a2")).rejects.toThrow("<total> must be a positive number");
  });
  it("Index size", async() => {
    await expect(run("22/2")).rejects.toThrow("<index> must be less then <total>");
  });
});
