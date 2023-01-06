import { join, parse } from "path";
import { unlink as remove, PathLike , NoParamCallback } from "fs";

export const timeout = 60000;

export const cssFile  = join("__tests__", "font", "NotoSansKR-Local.css"  );
export const textFile = join("__tests__", "font", "subset_glyphs.txt"     );
export const fontPath = join("__tests__", "font", "NotoSansKR-Regular.otf");
export const fontInfo = parse(fontPath);
export const fontDir  = fontInfo.dir;
export const fontName = fontInfo.name;

const errCallback: NoParamCallback = (err) => {
  if(err) {
    console.error(err);
    return;
  }
}

// Remove file
export function unlink(path: PathLike) {
  remove(path, errCallback);
}
