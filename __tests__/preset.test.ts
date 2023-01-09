import { join } from "path";
import { existsSync } from "fs";

import fetch from "@esm2cjs/node-fetch";
import commandExists from "command-exists";

import { targets, defaultArgs } from "../src/main";
import subset from "../src/worker";
import { textFile, fontPath, fontDir, fontName, unlink } from "./shared";

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

describe("Pyftsubset Check", () => {
  it("Subset check with no Log", async () => {
    const fontFile = join(fontDir, fontName + ".preset.woff2");
    console.log = jest.fn();

    subset({options: [
      fontPath,
      "--output-file=" + fontFile,
      "--text-file=" + textFile,
      ...defaultArgs
    ]});

    expect(console.log).not.toHaveBeenCalled();
    expect(existsSync(fontFile)).toBe(true);
    unlink(fontFile);
  });

  it("Subset check with log", async () => {
    const fontFile = join(fontDir, fontName + ".log.woff2");
    console.log = jest.fn();

    subset({
      options: [
        fontPath,
        "--output-file=" + fontFile,
        "--text-file=" + textFile,
        ...defaultArgs
      ],
      log: "== pyftsubset run =="
    });

    expect(console.log).toHaveBeenCalledWith("== pyftsubset run ==");
    expect(existsSync(fontFile)).toBe(true);
    unlink(fontFile);
  });
});
