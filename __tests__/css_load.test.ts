import { join } from "path";
import { existsSync } from "fs";

import fetch from "@esm2cjs/node-fetch";

import { targets, parseCSS} from "../src/main";
import { cssFile, fontDir, unlink } from "./shared";

describe("CSS Load", () =>{
    it("Check CSS Path with vaild Path", async () => {
      const parsed  = await parseCSS(fontDir, cssFile);
      const parsing = async () => await parseCSS(fontDir, cssFile);

      expect(existsSync(cssFile)).toBe(true);
      expect(parsed).toBeDefined();
      await expect(parsing()).resolves.not.toThrow();
    });

    it("Check CSS Path with invaild Path", async () => {
      const cssPath = join(fontDir, "anything.css");
      const parsing = async () => await parseCSS(fontDir, cssPath);

      expect(existsSync(cssPath)).toBe(false);
      await expect(parsing()).rejects.toThrow("Not vaild URL or PATH: " + cssPath);
    });

    it("Check CSS Download with valid URL", async () => {
      const cssPath = join(fontDir, "Noto Sans JP.css")
      const parsed  = await parseCSS(fontDir, targets.japanese);
      const parsing = async () => await parseCSS(fontDir, targets.japanese);

      expect(existsSync(cssPath)).toBe(true);
      expect(parsed).toBeDefined();
      await expect(parsing()).resolves.not.toThrow();

      unlink(cssPath);
    });

    it("Check CSS Download with invalid URL", async () => {
      const cssURL404 = "https://github.com/black7375/font-range/unknown/"
      const cssURLNot = "https://www.its-a-unknown-invailid-url-samples.com/";
      const response1 = await fetch(cssURL404);
      const response2 = async () => await fetch(cssURLNot);
      const parsing1  = async () => await parseCSS(fontDir, cssURL404);
      const parsing2  = async () => await parseCSS(fontDir, cssURLNot);

      expect(response1.status).toBe(404);
      await expect(response2()).rejects.toThrow();
      await expect(parsing1()).rejects.toThrow("Not vaild URL: " + cssURL404);
      await expect(parsing2()).rejects.toThrow();
    });
  });
