import { targets, defaultArgs } from '../src/main';
import { textFile, fontPath, fontDir, fontName, unlink } from './shared';
import { join } from 'path';
import { existsSync } from 'fs';
import fetch from 'node-fetch';
import commandExists from 'command-exists';
import { execaSync } from '@esm2cjs/execa';

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
  const fontFile = join(fontDir, fontName + ".preset.woff2");

  beforeAll(() => {
    return execaSync("pyftsubset", [
      fontPath,
      "--output-file=" + fontFile,
      "--text-file=" + textFile,
      ...defaultArgs
    ]);
  });

  it("Subset check", async () => {
    expect(existsSync(fontFile)).toBe(true);
    unlink(fontFile);
  });
});
