[![TypeScript version][ts-badge]][typescript-4-0]
[![Node.js version][nodejs-badge]][nodejs]
[![APLv2][license-badge]][license]

# Font Range

| ![NJ](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Japanese.gif) | ![NK](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Korean.gif) | ![NC](https://raw.githubusercontent.com/black7375/font-range/master/resource/News_Chinese.gif) |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|

Google Font provides a subset of [Korean](https://design.google/news/google-fonts-launches-korean-support-and-unveils-faster-delivery-system/), [Japanese](https://design.google/news/google-fonts-launches-japanese-supportand-makes-loading-large-fonts-even-faster/), and [Chinese](https://design.google/news/google-fonts-launches-chinese-support/) **Slicing Patterns** through machine learning.

**Font Range** helps you to subset using `unicode range` in Google Fonts.

| ![K0](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_0.png) | ![K1](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_1.png) |
|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|

![Result](https://raw.githubusercontent.com/black7375/font-range/master/resource/Korean_Japanese.png)

## Usage
Google font `CSS file`(include `unicode-range` file) url and `font path` are fine.

```js
fontRange(google_font_css_url, font_path);
fontRange(google_font_css_url, font_path, save_path); // Option1
fontRange(google_font_css_url, font_path, {
  savePath:    "<SAVE SUBSET PATH>",
  format:      "<FONT FORMAT>",
  nameForamt:  "<NAME FORAMT>",
  defaultArgs: "<Default Args>",
  etcArgs:     "<ETC pyftsubset args>"
}); // Option2
```
- `save_path`'s default: `<font_path>`
- `format`'s default: `"woff2"`
- `nameFormat`'s default: `"{NAME}_{INDEX}{EXT}"`
- `defaultArgs`'s default:
```
"--layout-features='*' \
 --glyph-names \
 --symbol-cmap \
 --legacy-cmap \
 --notdef-glyph \
 --notdef-outline \
 --recommended-glyphs \
 --name-legacy \
 --drop-tables= \
 --name-IDs='*' \
 --name-languages='*'
"
```
- `etcArgs`'s default: `""`

### Requires
It has dependencies on the following packages:

```sh
pip install fonttools[ufo,woff,unicode]  zopfli brotli
```

### CSS URL?
The URL of [`Noto Sans`](https://www.google.com/get/noto/) is included in the package.

![Noto](https://raw.githubusercontent.com/black7375/font-range/master/resource/Noto_0.png)

```js
const targets = {
  weston:   "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap",
  korean:   "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap",
  japanese: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap",
  chinese:  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap",
  chinese_traditional: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap",
};
```

## License

Licensed under the APLv2. See the [LICENSE](https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE) file for details.

[ts-badge]: https://img.shields.io/badge/TypeScript-4.0-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%2012.13-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v12.x/docs/api/
[typescript-4-0]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html
[license-badge]: https://img.shields.io/badge/license-MIT-blue
[license]: https://github.com/black7375/font-range/blob/master/LICENSE
